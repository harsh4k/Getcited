"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  api,
  sdkSnippet,
  type AbSiteDetail,
  type ExperimentReport,
  type ExperimentVariant,
} from "@/lib/api";
import { conversionSignificance } from "@/lib/ab-stats";
import { cn } from "@/lib/utils";
import {
  Check,
  Copy,
  Lightbulb,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
} from "lucide-react";

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent/40";

interface Suggestion {
  title: string;
  rationale: string;
  action: string;
  priority: "high" | "medium" | "low";
}

interface AbTestingPanelProps {
  siteId: number;
  className?: string;
  onBack?: () => void;
}

export function AbTestingPanel({ siteId, className, onBack }: AbTestingPanelProps) {
  const [detail, setDetail] = useState<AbSiteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expStatus, setExpStatus] = useState<string | null>(null);
  const [busyExpId, setBusyExpId] = useState<number | null>(null);
  const [reports, setReports] = useState<Record<number, ExperimentReport>>({});
  const [creating, setCreating] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [insightSource, setInsightSource] = useState<"ai" | "heuristic" | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const [expName, setExpName] = useState("");
  const [trafficPct, setTrafficPct] = useState(100);
  const [variantA, setVariantA] = useState("control");
  const [variantB, setVariantB] = useState("treatment");
  const [selector, setSelector] = useState("");
  const [htmlB, setHtmlB] = useState("");

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const data = await api.getSite(siteId);
      setDetail(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load site profile");
      return null;
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  const loadInsights = useCallback(async (data: AbSiteDetail) => {
    setInsightsLoading(true);
    try {
      const res = await api.abInsights({
        site: { name: data.site.name, url: data.site.url },
        overview: data.overview,
        experiments: data.experiments,
      });
      setSuggestions(res.data.suggestions);
      setInsightSource(res.data.source);
    } catch {
      setSuggestions([]);
      setInsightSource(null);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setSuggestions([]);
    setInsightSource(null);
    void (async () => {
      const data = await refresh();
      if (data) await loadInsights(data);
    })();
    const timer = window.setInterval(() => void refresh(), 6000);
    return () => window.clearInterval(timer);
  }, [refresh, loadInsights]);

  const snippet = detail ? sdkSnippet(detail.site.sdk_key) : "";

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setError("Copy failed — select the snippet manually.");
    }
  };

  const onCreateExperiment = async (event: FormEvent) => {
    event.preventDefault();
    if (!detail) return;
    setCreating(true);
    setExpStatus(null);
    setError(null);
    const sel = selector.trim();
    const a: ExperimentVariant = { name: variantA.trim() || "control", weight: 1 };
    const b: ExperimentVariant = { name: variantB.trim() || "treatment", weight: 1 };
    if (sel) {
      a.selector = sel;
      b.selector = sel;
      if (htmlB.trim()) b.text = htmlB.trim();
    }
    try {
      await api.createExperiment(detail.site.id, expName.trim(), [a, b], trafficPct);
      setExpStatus("Experiment is running.");
      setExpName("");
      setTrafficPct(100);
      setVariantA("control");
      setVariantB("treatment");
      setSelector("");
      setHtmlB("");
      await refresh();
    } catch (err) {
      setExpStatus(err instanceof Error ? err.message : "Could not create experiment");
    } finally {
      setCreating(false);
    }
  };

  const setStatus = async (experimentId: number, status: "running" | "paused") => {
    setBusyExpId(experimentId);
    setError(null);
    try {
      await api.setExperimentStatus(experimentId, status);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setBusyExpId(null);
    }
  };

  const loadReport = async (experimentId: number) => {
    setBusyExpId(experimentId);
    setError(null);
    try {
      const report = await api.getExperimentReport(experimentId);
      setReports((prev) => ({ ...prev, [experimentId]: report }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load report");
    } finally {
      setBusyExpId(null);
    }
  };

  if (loading && !detail) {
    return (
      <div className={cn("liquid-glass flex items-center gap-2 rounded-2xl bg-bg-primary/25 p-6 text-sm text-text-secondary", className)}>
        <Loader2 size={16} className="animate-spin text-accent" /> Loading site profile…
      </div>
    );
  }

  if (!detail) {
    return (
      <div className={cn("liquid-glass rounded-2xl bg-bg-primary/25 p-5 text-sm text-red-300", className)}>
        {error || "Site not found."}
      </div>
    );
  }

  const totals = detail.overview?.totals ?? { events: 0, users: 0, sessions: 0 };
  const live = (totals.events ?? 0) > 0;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mb-2 text-[11px] text-text-tertiary transition hover:text-text-primary"
              >
                ← All profiles
              </button>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-text-primary">{detail.site.name}</h2>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide",
                  live ? "bg-green-500/20 text-green-300" : "bg-amber-500/20 text-amber-300"
                )}
              >
                {live ? "Live" : "Awaiting SDK"}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-text-secondary">{detail.site.url}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void refresh();
              if (detail) void loadInsights(detail);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs text-text-secondary transition hover:bg-white/15 hover:text-text-primary"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="Events" value={String(totals.events ?? 0)} />
          <Metric label="Users" value={String(totals.users ?? 0)} />
          <Metric label="Sessions" value={String(totals.sessions ?? 0)} />
          <Metric label="Experiments" value={String(detail.experiments.length)} />
        </div>
        {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
      </div>

      <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-5">
        <h3 className="text-sm font-semibold text-text-primary">Your SDK</h3>
        <p className="mt-1 text-xs text-text-secondary">
          Unique to this profile. Paste once in your site&apos;s <code className="text-accent">&lt;head&gt;</code> —
          pageviews, clicks, scroll, engagement, and experiment assignments stream into your dashboard.
        </p>
        <pre className="custom-scrollbar mt-3 overflow-x-auto rounded-xl bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-cyan-200/90">
          {snippet}
        </pre>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void copySnippet()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/30"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy SDK snippet"}
          </button>
          <span className="font-mono text-[10px] text-text-tertiary">{detail.site.sdk_key}</span>
        </div>
      </div>

      <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Sparkles size={16} className="text-accent" /> AI suggestions
          </div>
          {insightSource && (
            <span className="text-[10px] uppercase tracking-wide text-text-tertiary">
              {insightSource === "ai" ? "Model" : "Rules"} · from live DB
            </span>
          )}
        </div>
        {insightsLoading && suggestions.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
            <Loader2 size={12} className="animate-spin" /> Generating suggestions from your analytics…
          </p>
        ) : suggestions.length === 0 ? (
          <p className="mt-3 text-xs text-text-secondary">Install the SDK to unlock insight-based suggestions.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {suggestions.map((s) => (
              <li key={s.title} className="rounded-2xl bg-white/5 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Lightbulb size={13} className="text-accent" />
                  <strong className="text-xs text-text-primary">{s.title}</strong>
                  <PriorityBadge priority={s.priority} />
                </div>
                {s.rationale && <p className="mt-1.5 text-[11px] text-text-secondary">{s.rationale}</p>}
                <p className="mt-1.5 text-[11px] text-cyan-200/80">
                  <span className="text-text-tertiary">Try: </span>
                  {s.action}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-5">
        <h3 className="text-sm font-semibold text-text-primary">Create experiment</h3>
        <form onSubmit={(e) => void onCreateExperiment(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Experiment name">
            <input
              required
              value={expName}
              onChange={(e) => setExpName(e.target.value)}
              placeholder="Homepage CTA"
              className={fieldClass}
            />
          </Field>
          <Field label="Traffic %">
            <input
              type="number"
              min={1}
              max={100}
              value={trafficPct}
              onChange={(e) => setTrafficPct(Number(e.target.value) || 100)}
              className={fieldClass}
            />
          </Field>
          <Field label="Variant A">
            <input required value={variantA} onChange={(e) => setVariantA(e.target.value)} className={fieldClass} />
          </Field>
          <Field label="Variant B">
            <input required value={variantB} onChange={(e) => setVariantB(e.target.value)} className={fieldClass} />
          </Field>
          <Field label="CSS selector (optional)">
            <input
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              placeholder=".hero-cta"
              className={fieldClass}
            />
          </Field>
          <Field label="Variant B text (optional)">
            <input
              value={htmlB}
              onChange={(e) => setHtmlB(e.target.value)}
              placeholder="Try free for 14 days"
              className={fieldClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating || !expName.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-bg-primary transition hover:brightness-110 disabled:opacity-50"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Start experiment
            </button>
            {expStatus && <p className="mt-2 text-xs text-text-secondary">{expStatus}</p>}
          </div>
        </form>
      </div>

      <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-5">
        <h3 className="text-sm font-semibold text-text-primary">Experiments</h3>
        {detail.experiments.length === 0 ? (
          <p className="mt-3 text-xs text-text-secondary">No experiments yet — create one above.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {detail.experiments.map((exp) => {
              const report = reports[exp.id];
              const busy = busyExpId === exp.id;
              return (
                <article key={exp.id} className="rounded-2xl bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-text-primary">{exp.name}</strong>
                        <StatusBadge status={exp.status} />
                      </div>
                      <p className="mt-1 text-[11px] text-text-tertiary">
                        Variants: {exp.variants.map((v) => v.name).join(", ")} · traffic {exp.traffic_pct}%
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void loadReport(exp.id)}
                        className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] text-text-secondary hover:bg-white/15"
                      >
                        View report
                      </button>
                      {exp.status === "running" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void setStatus(exp.id, "paused")}
                          className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] text-text-secondary hover:bg-white/15"
                        >
                          <Pause size={11} /> Pause
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void setStatus(exp.id, "running")}
                          className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] text-text-secondary hover:bg-white/15"
                        >
                          <Play size={11} /> Resume
                        </button>
                      )}
                    </div>
                  </div>
                  {report && <ReportBlock report={report} />}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-5">
          <h3 className="text-sm font-semibold text-text-primary">Live analytics</h3>
          <p className="mt-1 text-[11px] text-text-tertiary">Saved in DB · auto-refreshes</p>
          <ul className="mt-3 space-y-1.5 text-xs text-text-secondary">
            {(detail.overview?.by_type ?? []).length === 0 && <li>No events yet</li>}
            {(detail.overview?.by_type ?? []).map((row) => (
              <li key={row.event_type} className="flex justify-between gap-2">
                <span>{row.event_type}</span>
                <span className="font-mono text-text-tertiary">{row.count}</span>
              </li>
            ))}
          </ul>
          <h4 className="mt-4 text-xs font-semibold text-text-primary">Top pages</h4>
          <ul className="mt-2 space-y-1.5 text-xs text-text-secondary">
            {(detail.overview?.top_paths ?? []).length === 0 && <li>No pageviews yet</li>}
            {(detail.overview?.top_paths ?? []).map((row) => (
              <li key={row.path} className="flex justify-between gap-2">
                <span className="truncate font-mono">{row.path}</span>
                <span className="font-mono text-text-tertiary">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-5">
          <h3 className="text-sm font-semibold text-text-primary">Recent events</h3>
          <div className="custom-scrollbar mt-3 max-h-64 space-y-2 overflow-y-auto">
            {(detail.overview?.recent ?? []).length === 0 && (
              <p className="text-xs text-text-secondary">Waiting for traffic after SDK install…</p>
            )}
            {(detail.overview?.recent ?? []).map((ev, i) => (
              <div
                key={`${ev.created_at}-${ev.event_type}-${i}`}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-white/5 px-2.5 py-1.5 text-[11px]"
              >
                <code className="text-accent">{ev.event_type}</code>
                <span className="truncate text-text-secondary">{ev.path || ""}</span>
                <span className="ml-auto text-text-tertiary">
                  {ev.variant || ""} {ev.created_at ? formatTime(ev.created_at) : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportBlock({ report }: { report: ExperimentReport }) {
  const rows = report.variants;
  const a = rows[0];
  const b = rows[1];
  const sig =
    a && b ? conversionSignificance(a.conversions, a.users, b.conversions, b.users) : null;

  return (
    <div className="mt-3 space-y-2 rounded-xl bg-black/25 p-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-[11px]">
          <thead className="text-text-tertiary">
            <tr>
              <th className="pb-2 font-medium">Variant</th>
              <th className="pb-2 font-medium">Users</th>
              <th className="pb-2 font-medium">Views</th>
              <th className="pb-2 font-medium">Clicks</th>
              <th className="pb-2 font-medium">Conv.</th>
              <th className="pb-2 font-medium">CVR</th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            {rows.map((row) => (
              <tr key={row.variant} className="border-t border-white/5">
                <td className="py-1.5 font-mono text-text-primary">{row.variant || "(none)"}</td>
                <td className="py-1.5 font-mono">{row.users}</td>
                <td className="py-1.5 font-mono">{row.pageviews}</td>
                <td className="py-1.5 font-mono">{row.clicks}</td>
                <td className="py-1.5 font-mono">{row.conversions}</td>
                <td className="py-1.5 font-mono">{(row.conversion_rate * 100).toFixed(1)}%</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-2 text-text-tertiary">
                  No events attributed yet — install the SDK and open the page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {sig ? (
        <p className={cn("text-[11px]", sig.significant ? "text-green-400" : "text-text-tertiary")}>
          Lift {sig.liftPct > 0 ? "+" : ""}
          {sig.liftPct}% · z={sig.z} · p={sig.pValue}
          {sig.significant ? " · statistically significant (p < 0.05)" : " · not yet significant"}
        </p>
      ) : (
        rows.length >= 2 && (
          <p className="text-[11px] text-text-tertiary">Need ≥10 users per variant for significance.</p>
        )
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const tone =
    priority === "high"
      ? "bg-red-500/20 text-red-300"
      : priority === "medium"
        ? "bg-amber-500/20 text-amber-300"
        : "bg-white/10 text-text-tertiary";
  return <span className={cn("rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide", tone)}>{priority}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "running"
      ? "bg-green-500/20 text-green-300"
      : status === "paused"
        ? "bg-amber-500/20 text-amber-300"
        : "bg-white/10 text-text-tertiary";
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide", tone)}>{status}</span>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="liquid-glass rounded-2xl bg-bg-primary/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">{label}</div>
      <div className="mt-1 font-mono text-lg text-text-primary">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-[11px] text-text-secondary">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
