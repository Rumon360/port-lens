import React from 'react';

interface StatusBadgeProps {
  status: string;
}

function getBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (s === 'LISTEN' || s === 'LISTENING') return 'status-badge--listen';
  if (s === 'ESTABLISHED' || s === 'ESTAB') return 'status-badge--established';
  if (s === 'TIME_WAIT' || s === 'TIME-WAIT') return 'status-badge--time-wait';
  if (s === 'CLOSE_WAIT' || s === 'CLOSE-WAIT') return 'status-badge--close-wait';
  return 'status-badge--other';
}

function normalizeStatus(status: string): string {
  const s = status.toUpperCase();
  if (s === 'LISTENING') return 'LISTEN';
  if (s === 'ESTAB') return 'ESTABLISHED';
  return status || '—';
}

export const StatusBadge = React.memo(function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return <span className="status-badge status-badge--other">—</span>;
  return (
    <span className={`status-badge ${getBadgeClass(status)}`}>
      {normalizeStatus(status)}
    </span>
  );
});
