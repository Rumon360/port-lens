import { contextBridge, ipcRenderer } from 'electron';
import type { PortEntry } from './types/port';

// Typed API exposed to the renderer via window.portLens
export interface PortLensAPI {
  /** Subscribe to port list updates pushed from the main process.
   *  Returns an unsubscribe function. */
  onPortsUpdate: (cb: (entries: PortEntry[]) => void) => () => void;
  /** Ask the main process to run an immediate scan. */
  refreshNow: () => void;
  /** Kill a process by PID. Rejects with an error message on failure. */
  killProcess: (pid: number) => Promise<void>;
  /** The current platform (e.g. 'win32', 'darwin', 'linux'). */
  platform: NodeJS.Platform;
  /** Restart WinNAT via UAC-elevated PowerShell (Windows only). */
  restartWinNat: () => Promise<void>;
  /** Open a URL in the system default browser. */
  openUrl: (url: string) => Promise<void>;
}

contextBridge.exposeInMainWorld('portLens', {
  onPortsUpdate: (cb: (entries: PortEntry[]) => void) => {
    const handler = (_: Electron.IpcRendererEvent, entries: PortEntry[]) =>
      cb(entries);
    ipcRenderer.on('ports:update', handler);
    return () => ipcRenderer.removeListener('ports:update', handler);
  },

  refreshNow: () => ipcRenderer.send('ports:refresh'),

  killProcess: (pid: number) => ipcRenderer.invoke('ports:kill', { pid }),
  platform: process.platform,
  restartWinNat: () => ipcRenderer.invoke('winnat:restart'),
  openUrl: (url: string) => ipcRenderer.invoke('shell:openUrl', { url }),
} as PortLensAPI);
