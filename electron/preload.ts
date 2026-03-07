/**
 * PedaClic Pro Desktop — electron/preload.ts
 * PONT SÉCURISÉ entre renderer (React) et main (Node.js)
 * Seules les API exposées ici sont accessibles au renderer
 */
import { contextBridge, ipcRenderer } from 'electron';

// Typage de l'API exposée (utile côté renderer)
export interface IElectronAPI {
  dbRun: (sql: string, params?: unknown[]) => Promise<IpcResult>;
  dbGet: (sql: string, params?: unknown[]) => Promise<IpcResult>;
  dbAll: (sql: string, params?: unknown[]) => Promise<IpcResult>;
  licenceActivate: (key: string) => Promise<IpcResult>;
  licenceCheck: () => Promise<IpcResult>;
  aiGenerate: (payload: unknown) => Promise<IpcResult>;
  pdfSavePath: (nomDefaut: string) => Promise<string | null>;
  pdfWrite: (filePath: string, data: ArrayBuffer) => Promise<void>;
  pdfOpenFile: (filePath: string) => Promise<void>;
  /** Alias pour compatibilité avec electronIPCHandlers */
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
}

export interface IpcResult {
  success: boolean;
  data?: unknown;
  error?: string;
  changes?: number;
  lastInsertRowid?: number;
}

// Exposition sécurisée sous window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  // ── SQLite ────────────────────────────────────────────
  dbRun: (sql: string, params?: unknown[]) =>
    ipcRenderer.invoke('db-run', { sql, params }),
  dbGet: (sql: string, params?: unknown[]) =>
    ipcRenderer.invoke('db-get', { sql, params }),
  dbAll: (sql: string, params?: unknown[]) =>
    ipcRenderer.invoke('db-all', { sql, params }),

  // ── Licence ───────────────────────────────────────────
  licenceActivate: (key: string) =>
    ipcRenderer.invoke('licence-activate', { key }),
  licenceCheck: () =>
    ipcRenderer.invoke('licence-check'),

  // ── Génération IA ──────────────────────────────────────
  aiGenerate: (payload: unknown) =>
    ipcRenderer.invoke('ai-generate', payload),

  // ── Export PDF ─────────────────────────────────────────
  pdfSavePath: (nomDefaut: string) =>
    ipcRenderer.invoke('pdf-save-path', nomDefaut),
  pdfWrite: (filePath: string, data: ArrayBuffer) =>
    ipcRenderer.invoke('pdf-write', filePath, data),
  pdfOpenFile: (filePath: string) =>
    ipcRenderer.invoke('pdf-open-file', filePath),
  // Alias pour compatibilité avec electronIPCHandlers
  savePDF: (defaultName: string) =>
    ipcRenderer.invoke('pdf-save-path', defaultName),
  writePDF: (path: string, data: ArrayBuffer) =>
    ipcRenderer.invoke('pdf-write', path, data),
  openFile: (path: string) =>
    ipcRenderer.invoke('pdf-open-file', path),

  // ── Auto-updater ────────────────────────────────────────
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateAvailable: (cb: (info: unknown) => void) =>
    ipcRenderer.on('update-available', (_e, info) => cb(info)),
  onUpdateDownloaded: (cb: (info: unknown) => void) =>
    ipcRenderer.on('update-downloaded', (_e, info) => cb(info)),

  // ── Infos système ──────────────────────────────────────
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),

  // ── Vérification email ─────────────────────────────────
  authSendVerificationEmail: (email: string, token: string) =>
    ipcRenderer.invoke('auth-send-verification-email', { email, token }),
  authVerifyEmail: (token: string) =>
    ipcRenderer.invoke('auth-verify-email', { token }),
  onVerifyEmailToken: (cb: (token: string) => void) => {
    const handler = (_: unknown, token: string) => cb(token);
    ipcRenderer.on('verify-email-token', handler);
    return () => ipcRenderer.removeListener('verify-email-token', handler);
  },
} satisfies IElectronAPI);