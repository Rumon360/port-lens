# PortLens — Design Spec
**Date:** 2026-04-04  
**Status:** Draft

---

## Context

PortLens is a lightweight cross-platform Electron desktop app that lets users see all active TCP/UDP ports and their owning processes in real time, and kill processes directly from the UI. The existing project scaffold is Electron Forge + Vite + React 19 + TypeScript, already configured for Windows (Squirrel), macOS (ZIP), and Linux (RPM/DEB) builds.

The goal is minimal footprint: no heavy UI frameworks, no state management libraries, just React + CSS variables.

---

## Architecture

### Process Model

Standard Electron 3-process architecture:

1. **Main process** (`src/main.ts`) — app lifecycle, window creation, IPC registration, owns the polling interval
2. **Preload** (`src/preload.ts`) — contextBridge exposes a typed `window.portLens` API to the renderer
3. **Renderer** (`src/renderer.ts` → `app.tsx`) — React UI, purely reactive to main-process push events

### Data Flow

```
portScanner.ts
  └─ setInterval (2500ms)
       └─ spawn platform command
            └─ parse → PortEntry[]
                 └─ win.webContents.send('ports:update', entries)
                      └─ preload: ipcRenderer.on → callback
                           └─ app.tsx: setState(entries)
                                └─ PortTable → TableRow (React.memo)
```

Kill flow: `Kill button click` → `window.portLens.killProcess(pid)` → `ipcMain` → platform kill command → success/error → `ipcRenderer` reply → `alert()` on error.

Manual refresh: `Refresh button` → `window.portLens.refreshNow()` → `ipcMain` triggers immediate scan outside interval.

---

## File Structure

```
src/
├── main.ts                  — window, IPC handlers, starts scanner
├── preload.ts               — contextBridge (portLens API)
├── renderer.ts              — mounts React app
├── app.tsx                  — root layout + theme state
├── services/
│   └── portScanner.ts       — cross-platform scan + parse, owns interval
├── components/
│   ├── PortTable.tsx        — renders table header + rows
│   ├── TableRow.tsx         — React.memo single row
│   ├── Toolbar.tsx          — refresh button + theme toggle + status
│   └── StatusBadge.tsx      — colored pill (LISTEN / ESTABLISHED / etc.)
├── hooks/
│   └── useTheme.ts          — system pref detection, localStorage persist, toggle
├── types/
│   └── port.ts              — PortEntry interface (shared main+renderer)
└── styles/
    ├── variables.css        — CSS custom properties for light + dark
    └── app.css              — layout, table, component styles
index.html                   — updated title, removes placeholder
```

---

## Types

```typescript
// src/types/port.ts
export interface PortEntry {
  key: string;           // "${protocol}-${port}-${pid}" — stable React key
  port: number;
  protocol: 'TCP' | 'UDP';
  pid: number;
  processName: string;
  localAddress: string;
  status: string;        // LISTEN, ESTABLISHED, TIME_WAIT, etc.
}
```

---

## Platform Commands & Parsing

### Windows
Primary: `netstat -ano` (always available, no PowerShell dependency)
```
Proto  Local Address          Foreign Address        State           PID
TCP    0.0.0.0:80             0.0.0.0:0              LISTENING       4
```
Process name: `tasklist /FI "PID eq <pid>" /FO CSV /NH` → parse CSV

Fallback for UDP: `netstat -ano` includes UDP rows without state.

### macOS / Linux
Primary: `ss -tulnp` (Linux) / `lsof -i -n -P` (macOS)  
Fallback: `netstat -tulnp` for older systems

The scanner detects `process.platform` and selects the appropriate strategy.

---

## PortScanner Service

`src/services/portScanner.ts` runs entirely in the main process.

```
PortScanner
  .start(win: BrowserWindow, interval: number = 2500)
    — sets interval, runs scan immediately, pushes via webContents.send
  .stop()
    — clears interval
  .scanNow(win: BrowserWindow)
    — single immediate scan
  .killProcess(pid: number): Promise<void>
    — platform-appropriate kill, rejects with error message on failure
```

Internally: uses `exec` (async, non-blocking) wrapped in a promise. An `isScanning: boolean` flag prevents overlapping scans — if a scan is already running when the interval fires, that tick is skipped. Falls back gracefully if command not found (returns empty array).

---

## Preload Bridge

```typescript
// window.portLens
{
  onPortsUpdate: (cb: (entries: PortEntry[]) => void) => () => void,
  refreshNow:    () => void,
  killProcess:   (pid: number) => Promise<{ ok: boolean; error?: string }>
}
```

`killProcess` returns a promise (using `ipcRenderer.invoke`) so the renderer can `await` and show an alert on failure.

---

## IPC Channels

| Channel | Direction | Payload |
|---|---|---|
| `ports:update` | main → renderer | `PortEntry[]` |
| `ports:refresh` | renderer → main | — |
| `ports:kill` | renderer → main (invoke) | `{ pid: number }` |

---

## Renderer UI

### Toolbar (`src/components/Toolbar.tsx`)
- App name "PortLens" on the left
- Center: last-updated timestamp + entry count
- Right: Refresh button (disabled for 500ms after click to prevent spam) + Theme toggle (sun/moon icon)

### PortTable (`src/components/PortTable.tsx`)
- HTML `<table>` (no external lib)
- Columns: Port | Protocol | Local Address | Process | PID | Status | Action
- Empty state: "No active connections found"
- Loading state: "Scanning..." on first load (before first push)

### TableRow (`src/components/TableRow.tsx`)
- `React.memo` + key = `entry.key` ensures only changed rows re-render
- Kill button: confirms with window.confirm before sending IPC

### StatusBadge (`src/components/StatusBadge.tsx`)
- CSS class per status: `.status-listen`, `.status-established`, `.status-time-wait`, `.status-other`
- Colors defined in variables.css

---

## Theme System

### CSS Variables (`src/styles/variables.css`)
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #111111;
  --text-secondary: #666666;
  --border: #e0e0e0;
  --accent: #0066ff;
  --danger: #d32f2f;
  --status-listen: #2e7d32;
  --status-established: #1565c0;
  --status-time-wait: #ef6c00;
}

[data-theme="dark"] {
  --bg-primary: #141414;
  --bg-secondary: #1e1e1e;
  --text-primary: #f0f0f0;
  --text-secondary: #999999;
  --border: #333333;
  --accent: #4d9eff;
  --danger: #ef5350;
  --status-listen: #66bb6a;
  --status-established: #64b5f6;
  --status-time-wait: #ffb74d;
}
```

### useTheme Hook
- On mount: check `localStorage.getItem('theme')` → if none, check `window.matchMedia('(prefers-color-scheme: dark)')`
- Sets `document.documentElement.dataset.theme`
- Persists choice to localStorage on toggle

---

## Error Handling

- **Kill fails (EPERM, not found):** `window.alert('Could not kill PID ${pid}: ${error}')` in renderer
- **Scan command not found:** Scanner returns empty array, renderer shows "Scanning..." or empty state — no crash
- **Process exits before kill:** kill command returns error → alert in renderer
- **First load delay:** Renderer shows "Scanning..." until first `ports:update` event arrives

---

## Performance

- `React.memo` on `TableRow` with stable `key` (protocol-port-pid) prevents unnecessary re-renders
- No virtualization needed: typical active port count is under 200
- Main process does NOT block on scan: uses async `exec` wrapped in a promise; if scan takes longer than interval, the next scan is skipped (tracked with `isScanning` flag)

---

## Build & Run Instructions

Documented in project README (to be created separately).

```bash
# Install dependencies
npm install

# Development (hot reload)
npm start

# Package (no installer)
npm run package

# Build distributable
npm run make
```

Platform-specific output in `out/` directory.

---

## Verification

1. `npm start` — app opens, table populates within 3 seconds
2. Ports update every ~2.5s without full re-render flash
3. Kill button on a known process terminates it and it disappears from the list
4. Theme toggle switches immediately; preference survives app restart
5. System dark mode is respected on first launch (fresh localStorage)
6. App builds with `npm run make` on Windows without errors
