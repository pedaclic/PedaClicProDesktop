/**
 * PedaClic Pro Desktop — electron/ipc-handlers.ts
 * Tous les handlers IPC : SQLite, licence, IA, système, PDF
 */
import { ipcMain, app, dialog, shell } from 'electron';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import os from 'os';
import https from 'https';

let db: Database.Database | null = null;

// Machine ID unique basé sur les infos matérielles
function getMachineId(): string {
  const raw = `${os.hostname()}-${os.cpus()[0]?.model ?? 'cpu'}-${os.platform()}-${os.arch()}`;
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 32);
}

// Requête HTTPS vers api.pedaclic.sn
function httpsPost(path: string, body: string): Promise<unknown> {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.pedaclic.sn',
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data) as Record<string, unknown>;
            // Si HTTP 4xx/5xx, forcer success: false si absent
            if (res.statusCode && res.statusCode >= 400 && parsed.success !== false) {
              parsed.success = false;
              parsed.error = parsed.error ?? parsed.message ?? `Erreur serveur (${res.statusCode})`;
            }
            resolve(parsed);
          } catch {
            resolve({ success: false, error: 'Réponse serveur invalide' });
          }
        });
      }
    );
    req.on('error', (err) =>
      resolve({ success: false, error: err.message || 'Connexion internet requise' }));
    req.write(body);
    req.end();
  });
}

export function registerIpcHandlers(dbPath: string): void {
  // Ouvrir la DB (singleton)
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // ── SQLite : INSERT / UPDATE / DELETE ─────────────────
  ipcMain.handle('db-run', (_e, { sql, params = [] }: { sql: string; params: unknown[] }) => {
    try {
      const result = db!.prepare(sql).run(...params);
      return { success: true, changes: result.changes, lastInsertRowid: result.lastInsertRowid };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // ── SQLite : SELECT (1 ligne) ──────────────────────────
  ipcMain.handle('db-get', (_e, { sql, params = [] }: { sql: string; params: unknown[] }) => {
    try {
      return { success: true, data: db!.prepare(sql).get(...params) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // ── SQLite : SELECT (plusieurs lignes) ─────────────────
  ipcMain.handle('db-all', (_e, { sql, params = [] }: { sql: string; params: unknown[] }) => {
    try {
      return { success: true, data: db!.prepare(sql).all(...params) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // ── Infos système ──────────────────────────────────────
  ipcMain.handle('get-app-version', () => app.getVersion());
  ipcMain.handle('get-machine-id', () => getMachineId());

  // ── Activation de licence (nécessite internet) ─────────
  ipcMain.handle('licence-activate', async (_e, { key }: { key: string }) => {
    const machineId = getMachineId();
    const result = await httpsPost('/api/licences/activate', JSON.stringify({ key, machineId })) as Record<string, unknown>;
    if (result.success) {
      db!.prepare(`
        INSERT OR REPLACE INTO licence (cle, statut, machine_id, activated_at)
        VALUES (?, 'active', ?, datetime('now'))
      `).run(key, machineId);
    }
    return result;
  });

  // ── Vérification licence locale (100% hors-ligne) ─────
  ipcMain.handle('licence-check', () => {
    const row = db!.prepare(`SELECT * FROM licence WHERE statut = 'active' LIMIT 1`).get();
    return { valid: !!row, licence: row };
  });

  // ── Export PDF ────────────────────────────────────────
  ipcMain.handle('pdf-save-path', async (_e, nomDefaut: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Enregistrer le PDF',
      defaultPath: join(app.getPath('documents'), nomDefaut),
      filters: [{ name: 'Documents PDF', extensions: ['pdf'] }],
      properties: ['createDirectory'],
    });
    return canceled || !filePath ? null : filePath;
  });
  ipcMain.handle('pdf-write', async (_e, filePath: string, data: ArrayBuffer) => {
    await writeFile(filePath, Buffer.from(data));
  });
  ipcMain.handle('pdf-open-file', async (_e, filePath: string) => {
    await shell.openPath(filePath);
  });

  // ── Vérification d'email (inscription sécurisée) ───────
  ipcMain.handle('auth-send-verification-email', async (_e, { email, token }: { email: string; token: string }) => {
    const result = await httpsPost('/api/auth/send-verification-email', JSON.stringify({ email, token })) as Record<string, unknown>;
    return result;
  });

  ipcMain.handle('auth-verify-email', async (_e, { token }: { token: string }) => {
    try {
      const row = db!.prepare(`
        SELECT utilisateur_id FROM email_verification_tokens
        WHERE token = ? AND expires_at > datetime('now')
      `).get(token) as { utilisateur_id: number } | undefined;
      if (!row) return { success: false, error: 'Lien expiré ou invalide' };
      db!.prepare('UPDATE utilisateur SET email_verified = 1 WHERE id = ?').run(row.utilisateur_id);
      db!.prepare('DELETE FROM email_verification_tokens WHERE token = ?').run(token);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // ── Génération IA via api.pedaclic.sn ─────────────────
  ipcMain.handle('ai-generate', async (_e, payload: unknown) => {
    const licenceRow = db!.prepare(`SELECT cle, machine_id FROM licence WHERE statut = 'active' LIMIT 1`).get() as { cle: string; machine_id: string } | undefined;
    const machineId = getMachineId();
    const body = {
      ...(typeof payload === 'object' && payload !== null ? payload : {}),
      licence_key: licenceRow?.cle,
      machine_id: licenceRow?.machine_id ?? machineId,
    };
    const raw = await httpsPost('/api/generate', JSON.stringify(body)) as Record<string, unknown>;
    // Normaliser la réponse : content peut être dans content ou data.content
    const content = raw.content ?? (raw.data && typeof raw.data === 'object' && (raw.data as Record<string, unknown>).content);
    const hasContent = typeof content === 'string' && content.length > 0;
    const success = raw.success === true || (hasContent && raw.success !== false);
    const error = raw.error ?? raw.message;
    return {
      success,
      content: hasContent ? content : undefined,
      error: typeof error === 'string' ? error : undefined,
    };
  });
}