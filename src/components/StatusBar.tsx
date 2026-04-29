import React from 'react';

interface StatusBarProps {
  count: number;
  totalCount: number;
  lastUpdated: Date | null;
  searchQuery: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function StatusBar({ count, totalCount, lastUpdated, searchQuery }: StatusBarProps) {
  const countLabel = searchQuery.trim()
    ? `${count} / ${totalCount} connection${totalCount !== 1 ? 's' : ''}`
    : `${count} connection${count !== 1 ? 's' : ''}`;

  return (
    <div className="status-bar">
      {lastUpdated ? (
        <span className="status-bar__text">
          {countLabel}
          <span className="status-bar__dot"> · </span>
          updated {formatTime(lastUpdated)}
        </span>
      ) : (
        <span className="status-bar__text">Scanning…</span>
      )}
    </div>
  );
}
