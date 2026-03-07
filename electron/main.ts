/**
 * PedaClic Pro Desktop — electron/main.ts
 * Process PRINCIPAL Electron (Node.js natif)
 * Gère : fenêtre BrowserWindow, SQLite, IPC, auto-updater
 */
import { app, BrowserWindow, ipcMain, shell, nativeTheme } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import fs from 'fs';
import { registerIpcHandlers } from './ipc-handlers';
import { initDatabase } from './db-init';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let pendingVerifyUrl: string | null = null;

// ── Crée la fenêtre principale ─────────────────────────────
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    minWidth: 900, minHeight: 600,
    title: 'PedaClic Pro',
    backgroundColor: '#f0f4ff',
    icon: path.join(
      app.isPackaged ? process.resourcesPath : path.join(__dirname, '../build-resources'),
      process.platform === 'win32' ? 'icon.ico' : 'icon.png'
    ),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,       // Sécurité : désactivé
      contextIsolation: true,       // Sécurité : isolé
      devTools: isDev,
    },
    show: false,  // Anti-flash : afficher seulement quand prêt
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.maximize();
    if (pendingVerifyUrl) {
      const token = new URL(pendingVerifyUrl).searchParams.get('token');
      if (token) mainWindow?.webContents.send('verify-email-token', token);
      pendingVerifyUrl = null;
    }
  });

  // Dev → Vite HMR | Prod → fichier statique
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // DevTools disponibles via Ctrl+Shift+I (Win/Linux) ou Cmd+Option+I (Mac)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Ouvrir les liens <a target="_blank"> dans le navigateur système
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Auto-updater via GitHub Releases ──────────────────────
function setupAutoUpdater(): void {
  if (isDev) return;
  autoUpdater.setFeedURL({
    provider: 'github', owner: 'pedaclic', repo: 'pedaclic-pro-releases',
  });
  autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.on('update-available', (info) =>
    mainWindow?.webContents.send('update-available', info));
  autoUpdater.on('update-downloaded', (info) =>
    mainWindow?.webContents.send('update-downloaded', info));
  ipcMain.handle('install-update', () => autoUpdater.quitAndInstall());
}

// ── Chemin de la base SQLite (persistant dans userData) ───
function getDbPath(): string {
  const p = app.getPath('userData');
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  return path.join(p, 'pedaclic_pro.db');
  // Windows : C:\Users\{user}\AppData\Roaming\PedaClic Pro\pedaclic_pro.db
  // macOS   : ~/Library/Application Support/PedaClic Pro/pedaclic_pro.db
}

// ── Singleton : une seule instance ────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const url = argv.find((a: string) => a.startsWith('pedaclic://'));
    if (url?.startsWith('pedaclic://verify')) {
      pendingVerifyUrl = url;
      if (mainWindow) {
        const token = new URL(url).searchParams.get('token');
        if (token) mainWindow.webContents.send('verify-email-token', token);
      }
    }
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    app.setAsDefaultProtocolClient('pedaclic');
    const dbPath = getDbPath();
    await initDatabase(dbPath);       // 1. Créer les tables SQLite
    registerIpcHandlers(dbPath);      // 2. Enregistrer handlers IPC
    createWindow();                   // 3. Ouvrir la fenêtre
    setupAutoUpdater();               // 4. Configurer les MAJ auto

    app.on('open-url', (_event, url) => {
      if (url.startsWith('pedaclic://verify')) {
        pendingVerifyUrl = url;
        if (mainWindow) {
          const token = new URL(url).searchParams.get('token');
          if (token) mainWindow.webContents.send('verify-email-token', token);
          mainWindow.focus();
        }
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

nativeTheme.themeSource = 'light'; // Forcer le thème clair