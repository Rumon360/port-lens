import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { PortScanner } from './services/portScanner';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const scanner = new PortScanner();

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    title: 'PortLens',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Only open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // Start pushing port data to the renderer
  mainWindow.webContents.on('did-finish-load', () => {
    scanner.start(mainWindow);
  });

  mainWindow.on('closed', () => {
    scanner.stop();
  });
};

// ─── IPC handlers ────────────────────────────────────────────────────────────

ipcMain.on('ports:refresh', () => {
  scanner.scanNow();
});

ipcMain.handle('ports:kill', async (_, { pid }: { pid: number }) => {
  await scanner.killProcess(pid);
});

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
