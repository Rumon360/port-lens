import { exec } from 'child_process';
import { promisify } from 'util';
import type { BrowserWindow } from 'electron';
import type { PortEntry } from '../types/port';

const execAsync = promisify(exec);

// Cache process names to avoid repeated tasklist calls on Windows
const pidNameCache = new Map<number, string>();

// ─── Platform helpers ──────────────────────────────────────────────────────

async function scanWindows(): Promise<PortEntry[]> {
  const { stdout } = await execAsync('netstat -ano');
  const lines = stdout.split('\n');
  const entries: PortEntry[] = [];
  const pidSet = new Set<number>();

  for (const line of lines) {
    const trimmed = line.trim();
    // Match TCP and UDP rows
    const match = trimmed.match(
      /^(TCP|UDP)\s+(\S+):(\d+)\s+\S+\s+(\S+)\s+(\d+)/i
    );
    if (!match) continue;

    const protocol = match[1].toUpperCase() as 'TCP' | 'UDP';
    const localAddress = match[2];
    const port = parseInt(match[3], 10);
    const rawStatus = match[4];
    // UDP rows have PID in position 4 (no state column)
    const pid = protocol === 'UDP'
      ? parseInt(match[4], 10)
      : parseInt(match[5], 10);
    const status = protocol === 'UDP' ? '' : rawStatus;

    if (isNaN(pid) || isNaN(port)) continue;

    pidSet.add(pid);
    entries.push({
      key: `${protocol}-${port}-${pid}`,
      port,
      protocol,
      pid,
      processName: '',
      localAddress,
      status,
    });
  }

  // Resolve process names for unique PIDs not in cache
  const unknownPids = [...pidSet].filter(pid => !pidNameCache.has(pid));
  await Promise.all(
    unknownPids.map(async pid => {
      try {
        const { stdout: tl } = await execAsync(
          `tasklist /FI "PID eq ${pid}" /FO CSV /NH`
        );
        const csvMatch = tl.trim().match(/^"([^"]+)"/);
        pidNameCache.set(pid, csvMatch ? csvMatch[1] : `PID ${pid}`);
      } catch {
        pidNameCache.set(pid, `PID ${pid}`);
      }
    })
  );

  // Fill process names
  for (const entry of entries) {
    entry.processName = pidNameCache.get(entry.pid) ?? `PID ${entry.pid}`;
  }

  return entries;
}

async function scanUnix(): Promise<PortEntry[]> {
  const platform = process.platform;
  let stdout = '';

  if (platform === 'linux') {
    try {
      ({ stdout } = await execAsync('ss -tulnp'));
      return parseSs(stdout);
    } catch {
      // fall through to lsof
    }
  }

  // macOS (and Linux fallback)
  try {
    ({ stdout } = await execAsync('lsof -i -n -P'));
    return parseLsof(stdout);
  } catch {
    return [];
  }
}

function parseSs(output: string): PortEntry[] {
  const entries: PortEntry[] = [];
  const lines = output.split('\n').slice(1); // skip header

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) continue;

    const netid = parts[0].toUpperCase();
    if (netid !== 'TCP' && netid !== 'UDP') continue;
    const protocol = netid as 'TCP' | 'UDP';

    const state = parts[1] === 'LISTEN' || parts[1] === 'ESTAB' ? parts[1] : '';
    const localFull = parts[4] ?? '';
    const colonIdx = localFull.lastIndexOf(':');
    if (colonIdx === -1) continue;
    const localAddress = localFull.slice(0, colonIdx);
    const port = parseInt(localFull.slice(colonIdx + 1), 10);
    if (isNaN(port)) continue;

    // Extract PID from "users:(("name",pid=1234,fd=5))"
    const pidMatch = line.match(/pid=(\d+)/);
    const pid = pidMatch ? parseInt(pidMatch[1], 10) : 0;
    const nameMatch = line.match(/\(\("([^"]+)"/);
    const processName = nameMatch ? nameMatch[1] : (pid ? `PID ${pid}` : 'unknown');

    entries.push({
      key: `${protocol}-${port}-${pid}`,
      port,
      protocol,
      pid,
      processName,
      localAddress,
      status: state || 'LISTEN',
    });
  }

  return entries;
}

function parseLsof(output: string): PortEntry[] {
  const entries: PortEntry[] = [];
  const lines = output.split('\n').slice(1); // skip header

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 9) continue;

    const command = parts[0];
    const pid = parseInt(parts[1], 10);
    const typeCol = parts[4]?.toUpperCase();
    if (typeCol !== 'IPV4' && typeCol !== 'IPV6') continue;

    const protoRaw = parts[7]?.toUpperCase() ?? '';
    const protocol: 'TCP' | 'UDP' = protoRaw.startsWith('UDP') ? 'UDP' : 'TCP';

    const nameCol = parts[8] ?? '';
    // nameCol format: "address:port" or "address:port (STATE)"
    const stateMatch = nameCol.match(/\((\w+)\)$/);
    const status = stateMatch ? stateMatch[1] : (protocol === 'TCP' ? 'LISTEN' : '');
    const addrPart = nameCol.replace(/\s*\(\w+\)$/, '');
    const colonIdx = addrPart.lastIndexOf(':');
    if (colonIdx === -1) continue;
    const localAddress = addrPart.slice(0, colonIdx);
    const port = parseInt(addrPart.slice(colonIdx + 1), 10);
    if (isNaN(port) || isNaN(pid)) continue;

    entries.push({
      key: `${protocol}-${port}-${pid}`,
      port,
      protocol,
      pid,
      processName: command,
      localAddress,
      status,
    });
  }

  return entries;
}

// ─── Kill helpers ──────────────────────────────────────────────────────────

async function killWindows(pid: number): Promise<void> {
  await execAsync(`taskkill /PID ${pid} /F`);
}

async function killUnix(pid: number): Promise<void> {
  await execAsync(`kill -9 ${pid}`);
}

// ─── PortScanner class ─────────────────────────────────────────────────────

export class PortScanner {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isScanning = false;
  private win: BrowserWindow | null = null;

  /** Start polling. Runs an immediate scan then repeats at `interval` ms. */
  start(win: BrowserWindow, interval = 2500): void {
    this.win = win;
    this.scan();
    this.intervalId = setInterval(() => this.scan(), interval);
  }

  /** Stop polling. */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.win = null;
  }

  /** Trigger an immediate scan outside of the normal interval. */
  scanNow(): void {
    this.scan();
  }

  /** Kill a process by PID. Rejects with a human-readable error message. */
  async killProcess(pid: number): Promise<void> {
    try {
      if (process.platform === 'win32') {
        await killWindows(pid);
      } else {
        await killUnix(pid);
      }
      // Invalidate cached name so it doesn't show up after kill
      pidNameCache.delete(pid);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(msg);
    }
  }

  private async scan(): Promise<void> {
    if (this.isScanning || !this.win) return;
    this.isScanning = true;

    try {
      const entries =
        process.platform === 'win32'
          ? await scanWindows()
          : await scanUnix();

      if (this.win && !this.win.isDestroyed()) {
        this.win.webContents.send('ports:update', entries);
      }
    } catch {
      // Silently ignore scan errors; renderer stays at last known state
    } finally {
      this.isScanning = false;
    }
  }
}
