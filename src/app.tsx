import React, { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    const unsubscribe = window.portLens.onPortsUpdate((data) => {
      setEntries(data);
      setLoading(false);
      setLastUpdated(new Date());
      setRefreshing(false);
    });
    return unsubscribe;
  }, []);

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
        count={entries.length}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        theme={theme}
        onToggleTheme={toggle}
      />
      <PortTable entries={entries} loading={loading} onKill={handleKill} />
    </div>
  );
}

const rootEl = document.getElementById('root') as HTMLElement;
const root = createRoot(rootEl);
root.render(<App />);
