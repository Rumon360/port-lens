import type { PortEntry } from './port';

declare global {
  interface Window {
    portLens: {
      onPortsUpdate: (cb: (entries: PortEntry[]) => void) => () => void;
      refreshNow: () => void;
      killProcess: (pid: number) => Promise<void>;
      platform: string;
      restartWinNat: () => Promise<void>;
    };
  }
}

export {};
