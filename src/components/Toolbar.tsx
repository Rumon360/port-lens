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
