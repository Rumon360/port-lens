import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import type { PortEntry } from "./types/port";
import { useTheme } from "./hooks/useTheme";
import { Toolbar } from "./components/Toolbar";
import { PortTable } from "./components/PortTable";
import { StatusBar } from "./components/StatusBar";
import "./styles/variables.css";
import "./styles/app.css";

function App() {
  const { theme, toggle } = useTheme();
  const [entries, setEntries] = useState<PortEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubscribe = window.portLens.onPortsUpdate((data) => {
      setEntries(data);
      setLoading(false);
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
        onRefresh={handleRefresh}
        refreshing={refreshing}
        theme={theme}
        onToggleTheme={toggle}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <PortTable
        entries={filteredEntries}
        loading={loading}
        onKill={handleKill}
      />
      <StatusBar
        count={filteredEntries.length}
        totalCount={entries.length}
        searchQuery={searchQuery}
      />
    </div>
  );
}

const rootEl = document.getElementById("root") as HTMLElement;
const root = createRoot(rootEl);
root.render(<App />);
