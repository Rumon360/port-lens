# PortLens Search Feature — Design Spec
**Date:** 2026-04-29  
**Status:** Approved

---

## Overview

Add a single search input inside the Toolbar that filters the port table in real time across three fields: port number, local address, and process name.

---

## Architecture

Pure renderer-side feature. No IPC, main process, or preload changes required.

---

## State & Filter Logic (`app.tsx`)

- Add `searchQuery: string` state, default `""`
- Derive `filteredEntries` via `useMemo`:
  - Case-insensitive match against `String(entry.port)`, `entry.localAddress`, `entry.processName`
  - Runs on every `entries` or `searchQuery` change
- Pass `filteredEntries` to `PortTable` (instead of `entries`)
- Pass `searchQuery`, `onSearchChange`, and `totalCount={entries.length}` to `Toolbar`

---

## Toolbar Changes

**New props:**
```typescript
searchQuery: string
onSearchChange: (q: string) => void
totalCount: number
```

**Layout:**
- Search input lives in `toolbar__center`
- Status text ("X connections · updated HH:MM:SS") remains, displayed alongside the input
- When `searchQuery` is non-empty, count shows `"${count} / ${totalCount} connections"`
- When `searchQuery` is empty, count shows existing `"${count} connections"` format
- A clear button (×) appears inside the input when query is non-empty

---

## Styling

- `.toolbar__search-wrap` — relative container for input + clear button positioning
- `.toolbar__search` — input styled with `--bg-secondary`, `--border`, `--text-primary` (light/dark theme automatic)
- Clear button positioned absolutely inside the input (right side)
- No new CSS variables needed

---

## Empty State

When search matches nothing, `filteredEntries` is `[]`. `PortTable` already handles this case with "No active connections found" — no changes needed to `PortTable`.

---

## Files Changed

| File | Change |
|---|---|
| `src/app.tsx` | Add `searchQuery` state, `filteredEntries` memo, pass new props |
| `src/components/Toolbar.tsx` | Add search input, clear button, updated count display |
| `src/styles/app.css` | Add `.toolbar__search-wrap` and `.toolbar__search` styles |

---

## Out of Scope

- Debouncing (not needed — filter is synchronous, port list is small)
- Per-field separate inputs
- Search history or persistence
