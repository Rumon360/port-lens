import React from "react";

interface ToolbarProps {
  onRefresh: () => void;
  refreshing: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function Toolbar({
  onRefresh,
  refreshing,
  theme,
  onToggleTheme,
  searchQuery,
  onSearchChange,
}: ToolbarProps) {
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
            placeholder="Search..."
            aria-label="Filter connections"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onSearchChange("");
            }}
            spellCheck={false}
          />
          {searchQuery && (
            <button
              className="toolbar__search-clear"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="toolbar__right">
        <button
          className={`icon-btn${refreshing ? " icon-btn--spinning" : ""}`}
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
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "☀" : "☽"}
        </button>
      </div>
    </div>
  );
}
