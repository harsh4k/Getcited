/**
 * Legacy localStorage audit history helpers.
 * New audits are stored server-side; these remain for one-time migration / fallback.
 */

export interface HistoryEntry {
  id: string;
  url: string;
  tool: string;
  timestamp: number;
  /** Optional display label; falls back to URL when missing. */
  name?: string;
  result?: Record<string, number | string>;
}

const KEY = "audit-history";

export function getLegacyHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}

/** @deprecated Prefer server audits via api.listAudits() */
export function getHistory(): HistoryEntry[] {
  return getLegacyHistory();
}

function writeHistory(history: HistoryEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(history.slice(0, 50)));
}

/** @deprecated Prefer api.createAudit / api.saveAudit* */
export function saveHistory(entry: HistoryEntry) {
  const history = getLegacyHistory();
  history.unshift(entry);
  writeHistory(history);
}

/** @deprecated Prefer api.renameAudit */
export function renameHistoryEntry(id: string, name: string): HistoryEntry | null {
  const cleaned = name.trim();
  if (!cleaned) return null;
  const history = getLegacyHistory();
  const index = history.findIndex((entry) => entry.id === id);
  if (index < 0) return null;
  const updated: HistoryEntry = { ...history[index], name: cleaned };
  history[index] = updated;
  writeHistory(history);
  return updated;
}

/** @deprecated Prefer api.deleteAudit */
export function deleteHistoryEntry(id: string): boolean {
  const history = getLegacyHistory();
  const target = String(id);
  const next = history.filter((entry) => String(entry.id) !== target);
  if (next.length === history.length) return false;
  writeHistory(next);
  return true;
}

/** Clears legacy local history only. Prefer api.clearAudits for server data. */
export function clearHistory() {
  localStorage.removeItem(KEY);
}

export function historyLabel(entry: { name?: string | null; url: string }, maxLen = 28): string {
  const raw = entry.name?.trim() || entry.url.replace(/^https?:\/\//, "");
  if (raw.length <= maxLen) return raw;
  return `${raw.slice(0, maxLen)}…`;
}
