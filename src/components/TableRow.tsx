import React, { useState, useCallback } from 'react';
import type { PortEntry } from '../types/port';
import { StatusBadge } from './StatusBadge';
import { getPortLabel, getLocalhostUrl, isListenPort } from '../utils/portLabels';

interface TableRowProps {
  entry: PortEntry;
  onKill: (pid: number) => void;
}

export const TableRow = React.memo(function TableRow({ entry, onKill }: TableRowProps) {
  const [copied, setCopied] = useState(false);

  const label = getPortLabel(entry.port);
  const isTCP = entry.protocol === 'TCP';
  const isListen = isListenPort(entry.status);
  const localhostUrl = getLocalhostUrl(entry.port);

  const handleKill = useCallback(() => {
    const msg = isListen
      ? `Free port ${entry.port}? This will kill "${entry.processName}" (PID ${entry.pid}).`
      : `Kill process "${entry.processName}" (PID ${entry.pid})?`;
    if (window.confirm(msg)) {
      onKill(entry.pid);
    }
  }, [entry, isListen, onKill]);

  const handleOpen = useCallback(() => {
    window.portLens.openUrl(localhostUrl);
  }, [localhostUrl]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(localhostUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [localhostUrl]);

  return (
    <tr>
      <td className="col-port cell-port">
        <span className="port-number">{entry.port}</span>
        {label && <span className="port-label">{label.name}</span>}
      </td>
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
        <div className="row-actions">
          {isTCP && (
            <>
              <button
                className="row-btn row-btn--icon"
                onClick={handleOpen}
                title={`Open ${localhostUrl}`}
                aria-label="Open in browser"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </button>
              <button
                className={`row-btn row-btn--icon${copied ? ' row-btn--copied' : ''}`}
                onClick={handleCopy}
                title={copied ? 'Copied!' : `Copy ${localhostUrl}`}
                aria-label="Copy localhost URL"
              >
                {copied ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </>
          )}
          <button
            className={`row-btn ${isListen ? 'row-btn--free' : 'row-btn--kill'}`}
            onClick={handleKill}
            title={isListen ? `Free port ${entry.port}` : `Kill PID ${entry.pid}`}
          >
            {isListen ? 'Free' : 'Kill'}
          </button>
        </div>
      </td>
    </tr>
  );
});
