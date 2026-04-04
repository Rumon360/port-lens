import React from 'react';
import type { PortEntry } from '../types/port';
import { StatusBadge } from './StatusBadge';

interface TableRowProps {
  entry: PortEntry;
  onKill: (pid: number) => void;
}

export const TableRow = React.memo(function TableRow({ entry, onKill }: TableRowProps) {
  const handleKill = () => {
    if (window.confirm(`Kill process "${entry.processName}" (PID ${entry.pid})?`)) {
      onKill(entry.pid);
    }
  };

  return (
    <tr>
      <td className="col-port cell-port">{entry.port}</td>
      <td className="col-proto">{entry.protocol}</td>
      <td className="col-address cell-address" title={entry.localAddress}>
        {entry.localAddress}
      </td>
      <td className="col-process cell-process" title={entry.processName}>
        {entry.processName}
      </td>
      <td className="col-pid cell-pid">{entry.pid}</td>
      <td className="col-status">
        <StatusBadge status={entry.status} />
      </td>
      <td className="col-action">
        <button className="kill-btn" onClick={handleKill} title={`Kill PID ${entry.pid}`}>
          Kill
        </button>
      </td>
    </tr>
  );
});
