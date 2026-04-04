import React from 'react';

interface ToolbarProps {
  count: number;
  lastUpdated: Date | null;
  onRefresh: () => void;
  refreshing: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function Toolbar({
  count,
  lastUpdated,
  onRefresh,
  refreshing,
  theme,
  onToggleTheme,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar__left">
        <span className="toolbar__title">PortLens</span>
      </div>

      <div className="toolbar__center">
        {lastUpdated ? (
          <span className="toolbar__status">
            {count} connection{count !== 1 ? 's' : ''}
            <span className="toolbar__dot"> · </span>
            updated {formatTime(lastUpdated)}
          </span>
        ) : (
          <span className="toolbar__status">Scanning…</span>
        )}
      </div>

      <div className="toolbar__right">
        {/* Refresh button */}
        <button
          className={`icon-btn${refreshing ? ' icon-btn--spinning' : ''}`}
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh now"
          aria-label="Refresh"
        >
          ↻
        </button>

        {/* Theme toggle */}
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
