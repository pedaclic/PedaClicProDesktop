/**
 * Service base de données via IPC
 * Remplace Firebase — toutes les requêtes passent par SQLite (process main)
 */

// Déclaration du type global window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      dbRun: (sql: string, params?: unknown[]) => Promise<IpcResult>;
      dbGet: (sql: string, params?: unknown[]) => Promise<IpcResult>;
      dbAll: (sql: string, params?: unknown[]) => Promise<IpcResult>;
      licenceActivate: (key: string) => Promise<IpcResult>;
      licenceCheck: () => Promise<IpcResult>;
      aiGenerate: (payload: unknown) => Promise<IpcResult>;
      pdfSavePath: (nomDefaut: string) => Promise<string | null>;
      pdfWrite: (filePath: string, data: ArrayBuffer) => Promise<void>;
      pdfOpenFile: (filePath: string) => Promise<void>;
      savePDF: (defaultName: string) => Promise<string | null>;
      writePDF: (path: string, data: ArrayBuffer) => Promise<void>;
      openFile: (path: string) => Promise<void>;
      installUpdate: () => Promise<void>;
      onUpdateAvailable: (cb: (info: unknown) => void) => void;
      onUpdateDownloaded: (cb: (info: unknown) => void) => void;
      getAppVersion: () => Promise<string>;
      getMachineId: () => Promise<string>;
      authSendVerificationEmail: (email: string, token: string) => Promise<Record<string, unknown>>;
      authVerifyEmail: (token: string) => Promise<Record<string, unknown>>;
      onVerifyEmailToken: (cb: (token: string) => void) => () => void;
    };
  }
}

interface IpcResult {
  success: boolean;
  data?: unknown;
  error?: string;
  changes?: number;
  lastInsertRowid?: number;
}

export const isElectron = (): boolean =>
  typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined';

/** INSERT / UPDATE / DELETE — retourne les métadonnées */
export async function dbRun(sql: string, params: unknown[] = []): Promise<IpcResult> {
  if (!isElectron()) throw new Error('electronAPI non disponible');
  return window.electronAPI.dbRun(sql, params);
}

/** SELECT — 1 enregistrement */
export async function dbGet<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  if (!isElectron()) throw new Error('electronAPI non disponible');
  const r = await window.electronAPI.dbGet(sql, params);
  if (!r.success) throw new Error(r.error ?? 'Erreur DB');
  return (r.data as T) ?? null;
}

/** SELECT — plusieurs enregistrements */
export async function dbAll<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (!isElectron()) throw new Error('electronAPI non disponible');
  const r = await window.electronAPI.dbAll(sql, params);
  if (!r.success) throw new Error(r.error ?? 'Erreur DB');
  return (r.data as T[]) ?? [];
}