interface StatusBarProps {
  count: number;
  totalCount: number;

  searchQuery: string;
}

export function StatusBar({ count, totalCount, searchQuery }: StatusBarProps) {
  const countLabel = searchQuery.trim()
    ? `${count} / ${totalCount} connection${totalCount !== 1 ? "s" : ""}`
    : `${count} connection${count !== 1 ? "s" : ""}`;

  return (
    <div className="status-bar">
      <span className="status-bar__text">{countLabel}</span>
    </div>
  );
}
