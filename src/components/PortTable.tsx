import React, { useCallback } from "react";
import type { PortEntry } from "../types/port";
import { TableRow } from "./TableRow";

interface PortTableProps {
  entries: PortEntry[];
  loading: boolean;
  onKill: (pid: number) => void;
}

export function PortTable({ entries, loading, onKill }: PortTableProps) {
  const handleKill = useCallback((pid: number) => onKill(pid), [onKill]);

  return (
    <div className="table-container">
      {loading ? (
        <div className="table-message">Scanning for active connections…</div>
      ) : entries.length === 0 ? (
        <div className="table-message">No active connections found</div>
      ) : (
        <table className="port-table">
          <thead>
            <tr>
              <th className="col-port">Port</th>
              <th className="col-proto">Proto</th>
              <th className="col-address">Local Address</th>
              <th className="col-process">Process</th>
              <th className="col-pid">PID</th>
              <th className="col-status">Status</th>
              <th className="col-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <TableRow key={entry.key} entry={entry} onKill={handleKill} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
