export interface HistoryEntry {
  id: string;
  url: string;
  tool: string;
  timestamp: number;
  result?: Record<string, number | string>;
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("audit-history") || "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveHistory(entry: HistoryEntry) {
  const history = getHistory();
  history.unshift(entry);
  localStorage.setItem("audit-history", JSON.stringify(history.slice(0, 50)));
}

export function clearHistory() {
  localStorage.removeItem("audit-history");
}
