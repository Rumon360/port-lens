# Search Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single search input in the Toolbar that filters the port table in real time across port number, local address, and process name.

**Architecture:** Pure renderer-side feature — `app.tsx` owns `searchQuery` state and derives `filteredEntries` via `useMemo`, passing the filtered list to `PortTable` and the query/setter to `Toolbar`. No IPC, main process, or preload changes needed.

**Tech Stack:** React 19, TypeScript, CSS custom properties (existing stack, no new deps)

---

### Task 1: Add search state and filter logic to `app.tsx`

**Files:**
- Modify: `src/app.tsx`

- [ ] **Step 1: Add `searchQuery` state and `filteredEntries` memo**

Replace the existing `App` function body in `src/app.tsx` with the following (full file):

```tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import type { PortEntry } from './types/port';
import { useTheme } from './hooks/useTheme';
import { Toolbar } from './components/Toolbar';
import { PortTable } from './components/PortTable';
import './styles/variables.css';
import './styles/app.css';

function App() {
  const { theme, toggle } = useTheme();
  const [entries, setEntries] = useState<PortEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = window.portLens.onPortsUpdate((data) => {
      setEntries(data);
      setLoading(false);
      setLastUpdated(new Date());
      setRefreshing(false);
    });
    return unsubscribe;
  }, []);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        String(e.port).includes(q) ||
        e.localAddress.toLowerCase().includes(q) ||
        e.processName.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  const handleKill = useCallback(async (pid: number) => {
    try {
      await window.portLens.killProcess(pid);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Could not kill PID ${pid}: ${msg}`);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    window.portLens.refreshNow();
  }, []);

  return (
    <div className="app">
      <Toolbar
        count={filteredEntries.length}
        totalCount={entries.length}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        theme={theme}
        onToggleTheme={toggle}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <PortTable entries={filteredEntries} loading={loading} onKill={handleKill} />
    </div>
  );
}

const rootEl = document.getElementById('root') as HTMLElement;
const root = createRoot(rootEl);
root.render(<App />);
```

- [ ] **Step 2: Commit**

```bash
git add src/app.tsx
git commit -m "feat: add search state and filter logic to app.tsx"
```

---

### Task 2: Update `Toolbar.tsx` with search input and clear button

**Files:**
- Modify: `src/components/Toolbar.tsx`

- [ ] **Step 1: Replace Toolbar with search-aware version**

Overwrite `src/components/Toolbar.tsx` with:

```tsx
import React from 'react';

interface ToolbarProps {
  count: number;
  totalCount: number;
  lastUpdated: Date | null;
  onRefresh: () => void;
  refreshing: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function Toolbar({
  count,
  totalCount,
  lastUpdated,
  onRefresh,
  refreshing,
  theme,
  onToggleTheme,
  searchQuery,
  onSearchChange,
}: ToolbarProps) {
  const countLabel =
    searchQuery.trim()
      ? `${count} / ${totalCount} connection${totalCount !== 1 ? 's' : ''}`
      : `${count} connection${count !== 1 ? 's' : ''}`;

  return (
    <div className="toolbar">
      <div className="toolbar__left">
        <span className="toolbar__title">PortLens</span>
      </div>

      <div className="toolbar__center">
        <div className="toolbar__search-wrap">
          <input
            className="toolbar__search"
            type="text"
            placeholder="Filter by port, address, process…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            spellCheck={false}
          />
          {searchQuery && (
            <button
              className="toolbar__search-clear"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {lastUpdated ? (
          <span className="toolbar__status">
            {countLabel}
            <span className="toolbar__dot"> · </span>
            updated {formatTime(lastUpdated)}
          </span>
        ) : (
          <span className="toolbar__status">Scanning…</span>
        )}
      </div>

      <div className="toolbar__right">
        <button
          className={`icon-btn${refreshing ? ' icon-btn--spinning' : ''}`}
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh now"
          aria-label="Refresh"
        >
          ↻
        </button>

        <button
          className="icon-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '☽'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Toolbar.tsx
git commit -m "feat: add search input and clear button to Toolbar"
```

---

### Task 3: Add CSS styles for search input

**Files:**
- Modify: `src/styles/app.css`

- [ ] **Step 1: Append search styles to `src/styles/app.css`**

Add the following block at the end of `src/styles/app.css`:

```css
/* ─── Search ────────────────────────────────────────────────────────────────── */
.toolbar__search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.toolbar__search {
  width: 220px;
  height: 28px;
  padding: 0 28px 0 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 12px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.toolbar__search:focus {
  border-color: var(--accent);
}

.toolbar__search::placeholder {
  color: var(--text-secondary);
}

.toolbar__search-clear {
  position: absolute;
  right: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  border-radius: 3px;
  transition: color 0.1s;
}

.toolbar__search-clear:hover {
  color: var(--text-primary);
}
```

- [ ] **Step 2: Verify the app starts without errors**

```bash
npm start
```

Expected: App opens, search input visible in toolbar, typing filters the table, × button clears the query.

- [ ] **Step 3: Commit**

```bash
git add src/styles/app.css
git commit -m "feat: add search input styles"
```
