"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import Link from "next/link";
import { PromptInput } from "@/components/ui/ai-chat-input";
import { ProfileMenu } from "@/components/audit/ProfileMenu";
import { EmptyStateSections } from "@/components/audit/EmptyStateSections";
import { MarkdownWriteup } from "@/components/audit/MarkdownWriteup";
import { LogoMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { api, type GeoPipelineResult } from "@/lib/api";
import { getHistory, saveHistory, type HistoryEntry } from "@/lib/history";
import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Globe,
  LayoutDashboard,
  Search,
  Sparkles,
  Zap,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const TOOLS = ["Analysis", "AB Test"] as const;
type Tool = (typeof TOOLS)[number];

/** Older history entries used separate tool names — map them onto Analysis. */
function resolveTool(tool: string): Tool {
  return tool === "AB Test" ? "AB Test" : "Analysis";
}

interface PageData {
  url: string;
  ok: boolean;
  status: number | null;
  content: string;
  error: string | null;
}

interface AdHotspot {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  label: string;
  reason: string;
}

interface AdsResult {
  final_url: string;
  hotspot_count: number;
  hotspots: AdHotspot[];
  image_base64: string;
  warning: string | null;
  error?: string | null;
}

interface AbResult {
  site?: { id: number; name: string; url: string };
  experiments: { id: number; name: string; status: string; traffic_pct: number }[];
  overview?: { totals: { events: number; users: number; sessions: number } };
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withProtocol).toString();
}

function scoreTone(score: number): string {
  if (score >= 76) return "text-green-400";
  if (score >= 51) return "text-cyan-300";
  if (score >= 26) return "text-amber-300";
  return "text-red-300";
}

export default function AuditPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeResult, setActiveResult] = useState<HistoryEntry | null>(null);
  const [crawlPages, setCrawlPages] = useState<PageData[]>([]);
  const [geoResults, setGeoResults] = useState<GeoPipelineResult[]>([]);
  const [adsResult, setAdsResult] = useState<AdsResult | null>(null);
  const [abResult, setAbResult] = useState<AbResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [expandedResult, setExpandedResult] = useState<number | null>(0);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [selectedTool, setSelectedTool] = useState<Tool>("Analysis");
  const [historyClock, setHistoryClock] = useState(0);
  const [pageActionLoading, setPageActionLoading] = useState<string | null>(null);
  const [selectedPageUrl, setSelectedPageUrl] = useState<string | null>(null);
  const [pagePanel, setPagePanel] = useState<"aeo" | "ads" | null>(null);
  const [aeoCache, setAeoCache] = useState<Record<string, GeoPipelineResult>>({});
  const [adsCache, setAdsCache] = useState<Record<string, AdsResult>>({});
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      setHistory(getHistory());
      setHistoryClock(Date.now());
    }, 0);
    const timer = window.setInterval(() => setHistoryClock(Date.now()), 60000);
    return () => {
      window.clearTimeout(hydrate);
      window.clearInterval(timer);
    };
  }, []);

  const hasResults = loading || error || crawlPages.length > 0 || geoResults.length > 0 || adsResult || abResult;

  const runTool = useCallback(async (rawUrl: string, tool: Tool) => {
    let url: string;
    try {
      url = normalizeUrl(rawUrl);
    } catch {
      setError("Paste a valid website URL, like getcited.studio or https://example.com.");
      return;
    }

    setLoading(true);
    setError(null);
    setActiveResult(null);
    setCrawlPages([]);
    setGeoResults([]);
    setAdsResult(null);
    setAbResult(null);
    setSelectedPageUrl(null);
    setPagePanel(null);
    setAeoCache({});
    setAdsCache({});
    setProgress({ done: 0, total: 0 });

    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url,
      tool,
      timestamp: Date.now(),
    };

    try {
      if (tool === "Analysis") {
        const data = await api.crawl(url);
        if (data.error) throw new Error(data.error);
        const valid = data.pages.filter((p) => p.ok && p.content.trim().length > 50);
        setCrawlPages(valid);
        setProgress({ done: valid.length, total: data.pages.length });
        entry.result = { pageCount: valid.length };
      } else {
        const sites = await api.listSites();
        const existing = sites.sites.find((s) => s.url === url);
        if (existing) {
          const data = await api.getSite(existing.id);
          setAbResult(data);
          entry.result = { experimentCount: data.experiments.length };
        } else {
          const site = await api.createSite(new URL(url).hostname, url);
          setAbResult({ site, experiments: [] });
          entry.result = { experimentCount: 0 };
        }
      }

      saveHistory(entry);
      setHistory(getHistory());
      setHistoryClock(Date.now());
      setActiveResult(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (value: string, meta: { model: string }) => {
    runTool(value, resolveTool(meta.model));
  };

  const handleSuggestionPick = (tool: string) => {
    setSelectedTool(resolveTool(tool));
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => inputRef.current?.querySelector("textarea")?.focus(), 400);
  };

  const timeAgo = (ts: number) => {
    const diff = (historyClock || ts) - ts;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const toolIcon = (tool: string, size = 14) => {
    const className = "text-accent";
    if (resolveTool(tool) === "Analysis") return <Search size={size} className={className} />;
    return <Zap size={size} className={className} />;
  };

  const clearReport = () => {
    setActiveResult(null);
    setCrawlPages([]);
    setGeoResults([]);
    setAdsResult(null);
    setAbResult(null);
    setError(null);
    setPageActionLoading(null);
    setSelectedPageUrl(null);
    setPagePanel(null);
    setAeoCache({});
    setAdsCache({});
    setTimeout(() => inputRef.current?.querySelector("textarea")?.focus(), 50);
  };

  const runAeoWriteup = async (page: PageData) => {
    setSelectedPageUrl(page.url);
    setPagePanel("aeo");
    setError(null);

    const cached = aeoCache[page.url];
    if (cached) {
      setGeoResults([cached]);
      return;
    }

    setPageActionLoading(`aeo-${page.url}`);
    try {
      const pipeline = await api.geoPipeline(page.url, [page]);
      const result = pipeline.data[0];
      if (result) {
        setAeoCache((prev) => ({
          ...prev,
          [page.url]: result,
          [result.url]: result,
        }));
        setGeoResults([result]);
      } else {
        setGeoResults([]);
      }
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        url: page.url,
        tool: "Analysis",
        timestamp: Date.now(),
        result: { pageCount: 1, optimizedPages: pipeline.data.length },
      };
      saveHistory(entry);
      setHistory(getHistory());
      setHistoryClock(Date.now());
      setActiveResult(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AEO writeup failed");
    } finally {
      setPageActionLoading(null);
    }
  };

  const runAdPlacement = async (pageUrl: string) => {
    setSelectedPageUrl(pageUrl);
    setPagePanel("ads");
    setError(null);

    const cached = adsCache[pageUrl];
    if (cached) {
      setAdsResult(cached);
      return;
    }

    setPageActionLoading(`ads-${pageUrl}`);
    try {
      const data = await api.adsAnalyze(pageUrl);
      setAdsCache((prev) => ({ ...prev, [pageUrl]: data }));
      setAdsResult(data);
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        url: pageUrl,
        tool: "Analysis",
        timestamp: Date.now(),
        result: { hotspotCount: data.hotspot_count },
      };
      saveHistory(entry);
      setHistory(getHistory());
      setHistoryClock(Date.now());
      setActiveResult(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ad placement analysis failed");
    } finally {
      setPageActionLoading(null);
    }
  };

  return (
    <div className="relative z-10 h-dvh overflow-hidden text-text-primary">
      <ProfileMenu onMenuToggle={() => setMobileMenuOpen((v) => !v)} />

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "liquid-glass absolute bottom-3 left-3 top-3 z-50 hidden w-56 flex-col rounded-2xl bg-bg-primary/40 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:flex",
          sidebarCollapsed ? "pointer-events-none -translate-x-[115%] opacity-0" : "translate-x-0 opacity-100"
        )}
        aria-hidden={sidebarCollapsed}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <LogoMark size={26} />
            <span><span className="font-bold">Get</span><span className="font-light">cited</span></span>
          </Link>
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-white/10 hover:text-text-primary"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        <div className="px-3 pt-2 pb-1">
          <button onClick={clearReport} className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] text-text-secondary">+</span>
            New Audit
          </button>
        </div>

        <nav className="px-3 pt-2 space-y-0.5">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-text-tertiary">Tools</div>
          {TOOLS.map((tool) => {
            const isActive = selectedTool === tool && !hasResults;
            return (
              <button
                key={tool}
                onClick={() => {
                  setSelectedTool(tool);
                  if (!hasResults) setTimeout(() => inputRef.current?.querySelector("textarea")?.focus(), 50);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors ${
                  isActive ? "bg-white text-black" : "text-text-secondary hover:bg-white/10 hover:text-text-primary"
                }`}
              >
                {toolIcon(tool)}
                {tool === "AB Test" ? "A/B Test" : tool}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 overflow-hidden flex flex-col px-3 pt-4">
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex items-center justify-between rounded-full px-3 py-1.5 text-left transition-colors hover:bg-white/10"
            aria-expanded={historyOpen}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-tertiary">Search History</span>
            <span className="flex items-center gap-2 text-text-tertiary">
              <Search size={12} />
              {historyOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </span>
          </button>
          {historyOpen && (
            <div className="custom-scrollbar overflow-y-auto space-y-0.5 mt-1">
              {history.length === 0 && <p className="px-3 py-6 text-[11px] text-text-tertiary text-center leading-relaxed">Your audit history<br />will appear here</p>}
              {history.slice(0, 20).map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => runTool(entry.url, resolveTool(entry.tool))}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                    activeResult?.id === entry.id ? "bg-white text-black" : "text-text-secondary hover:bg-white/10 hover:text-text-primary"
                  }`}
                >
                  {toolIcon(entry.tool)}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-mono">{entry.url.replace(/^https?:\/\//, "").slice(0, 28)}</span>
                    <span className="block text-[10px] text-text-tertiary">{timeAgo(entry.timestamp)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {!historyOpen && (
            <div className="px-3 pt-3 text-[11px] text-text-tertiary">
              {history.length} saved {history.length === 1 ? "audit" : "audits"}
            </div>
          )}
        </div>

      </aside>

      <aside
        className={cn(
          "liquid-glass fixed inset-y-0 left-0 z-50 flex w-56 flex-col rounded-r-2xl bg-bg-primary/95 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden",
          mobileMenuOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <LogoMark size={26} />
            <span><span className="font-bold">Get</span><span className="font-light">cited</span></span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-white/10 hover:text-text-primary"
            aria-label="Close menu"
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        <div className="px-3 pt-2 pb-1">
          <button onClick={() => { clearReport(); setMobileMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] text-text-secondary">+</span>
            New Audit
          </button>
        </div>

        <nav className="px-3 pt-2 space-y-0.5">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-text-tertiary">Tools</div>
          {TOOLS.map((tool) => {
            const isActive = selectedTool === tool && !hasResults;
            return (
              <button
                key={tool}
                onClick={() => {
                  setSelectedTool(tool);
                  setMobileMenuOpen(false);
                  if (!hasResults) setTimeout(() => inputRef.current?.querySelector("textarea")?.focus(), 50);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors ${
                  isActive ? "bg-white text-black" : "text-text-secondary hover:bg-white/10 hover:text-text-primary"
                }`}
              >
                {toolIcon(tool)}
                {tool === "AB Test" ? "A/B Test" : tool}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 overflow-hidden flex flex-col px-3 pt-4">
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex items-center justify-between rounded-full px-3 py-1.5 text-left transition-colors hover:bg-white/10"
            aria-expanded={historyOpen}
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-tertiary">Search History</span>
            <span className="flex items-center gap-2 text-text-tertiary">
              <Search size={12} />
              {historyOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </span>
          </button>
          {historyOpen && (
            <div className="custom-scrollbar overflow-y-auto space-y-0.5 mt-1">
              {history.length === 0 && <p className="px-3 py-6 text-[11px] text-text-tertiary text-center leading-relaxed">Your audit history<br />will appear here</p>}
              {history.slice(0, 20).map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => { runTool(entry.url, resolveTool(entry.tool)); setMobileMenuOpen(false); }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                    activeResult?.id === entry.id ? "bg-white text-black" : "text-text-secondary hover:bg-white/10 hover:text-text-primary"
                  }`}
                >
                  {toolIcon(entry.tool)}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-mono">{entry.url.replace(/^https?:\/\//, "").slice(0, 28)}</span>
                    <span className="block text-[10px] text-text-tertiary">{timeAgo(entry.timestamp)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="liquid-glass absolute left-4 top-1/2 z-30 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-bg-primary/35 text-text-secondary shadow-lg transition-all animate-in fade-in slide-in-from-left-2 duration-300 hover:text-text-primary md:flex"
          aria-label="Show sidebar"
        >
          <ChevronRight size={16} />
        </button>
      )}

      <main
        className={cn(
          "flex h-full flex-col overflow-hidden transition-[padding] duration-300",
          !sidebarCollapsed && "md:pl-[248px]"
        )}
      >
        {!hasResults && (
          <div className="custom-scrollbar flex-1 overflow-y-auto">
            <div className="flex min-h-full flex-col items-center justify-center px-6 py-16">
              <div className="w-full max-w-[680px]">
                <div className="animate-blur-fade-up mb-6 flex justify-center">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs text-white/80 backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Free beta — first report in ~3 minutes
                  </span>
                </div>
                <h1 className="animate-blur-fade-up [animation-delay:120ms] mb-5 text-center text-4xl font-bold tracking-tight text-white sm:text-6xl">
                  The AI Visibility Layer For <span className="text-accent">Your Brand.</span>
                </h1>
                <p className="animate-blur-fade-up [animation-delay:240ms] mx-auto mb-10 max-w-xl text-center text-sm leading-relaxed text-white/80">
                  Getcited helps brands identify, evaluate, and optimize their presence across AI search engines. No guesswork. No wasted budget. Just results.
                </p>
                <div ref={inputRef} className="animate-blur-fade-up [animation-delay:360ms] mx-auto max-w-[580px]">
                  <div className="">
                    <PromptInput onSubmit={handleSubmit} placeholder="Paste a URL to get started..." models={[...TOOLS]} selectedModel={selectedTool} onModelChange={(m) => setSelectedTool(resolveTool(m))} className="w-full" />
                  </div>
                </div>
              </div>
            </div>
            <EmptyStateSections onPick={handleSuggestionPick} />
          </div>
        )}

        {hasResults && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="shrink-0 flex justify-center px-6 pt-6 pb-3 relative z-20">
              <div className="w-full max-w-[580px]" ref={inputRef}>
                <div className="">
                  <PromptInput onSubmit={handleSubmit} placeholder="Paste your URL..." models={[...TOOLS]} selectedModel={selectedTool} onModelChange={(m) => setSelectedTool(resolveTool(m))} className="w-full" />
                </div>
              </div>
            </div>

            {error && (
              <div className="mx-auto max-w-2xl px-4 shrink-0">
                <p className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 rounded-lg px-4 py-3">
                  <AlertCircle size={14} /> {error}
                </p>
              </div>
            )}

            {loading && (
              <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-3 px-6 py-6 md:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-32 animate-pulse rounded-lg border border-border/30 bg-bg-secondary/25" />
                ))}
                <p className="md:col-span-3 text-center text-sm text-text-secondary">
                  Analyzing{progress.total > 0 ? ` ${progress.done} of ${progress.total} crawled pages` : ""}...
                </p>
              </div>
            )}

            {!loading && hasResults && (
              <section className="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-3 pb-10 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:px-6 md:px-12">
                <div className="max-w-6xl mx-auto space-y-4">
                  {activeResult && (
                    <div className="liquid-glass flex items-center justify-between rounded-2xl bg-bg-primary/25 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3 text-sm">
                        {toolIcon(activeResult.tool, 16)}
                        <span className="min-w-0 truncate font-mono text-text-primary">{activeResult.url}</span>
                      </div>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(activeResult.url);
                          setCopiedUrl(activeResult.url);
                          window.setTimeout(() => setCopiedUrl(null), 1200);
                        }}
                        className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs text-text-secondary hover:bg-white/10 hover:text-text-primary"
                      >
                        {copiedUrl === activeResult.url ? <Check size={13} /> : <Copy size={13} />}
                        {copiedUrl === activeResult.url ? "Copied" : "Copy"}
                      </button>
                    </div>
                  )}

                  {crawlPages.length > 0 && (
                    <div
                      className={cn(
                        "grid gap-4 transition-all duration-300",
                        pagePanel ? "lg:grid-cols-[minmax(280px,380px)_1fr]" : "grid-cols-1"
                      )}
                    >
                      <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <Globe size={16} className="text-accent" /> Crawl Results
                          </div>
                          <span className="text-xs text-text-tertiary">{crawlPages.length} pages</span>
                        </div>
                        <div className="mt-4 grid gap-2">
                          {crawlPages.slice(0, 30).map((page) => {
                            const aeoLoading = pageActionLoading === `aeo-${page.url}`;
                            const adsLoading = pageActionLoading === `ads-${page.url}`;
                            const busy = pageActionLoading !== null;
                            const isSelected = selectedPageUrl === page.url && pagePanel !== null;
                            const hasAeo = Boolean(aeoCache[page.url]);
                            const hasAds = Boolean(adsCache[page.url]);
                            return (
                              <div
                                key={page.url}
                                className={cn(
                                  "flex flex-col gap-2 rounded-2xl px-3 py-2 transition-colors",
                                  isSelected ? "bg-white/20 ring-1 ring-white/25" : "bg-white/10"
                                )}
                              >
                                <div className="flex min-w-0 flex-1 items-center gap-3 text-xs">
                                  <CheckCircle2 size={14} className="shrink-0 text-green-400" />
                                  <span className="min-w-0 flex-1 truncate font-mono">{page.url}</span>
                                  {!pagePanel && (
                                    <span className="shrink-0 text-text-tertiary">
                                      {page.content.length.toLocaleString()} chars
                                    </span>
                                  )}
                                </div>
                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={busy && !hasAeo}
                                    onClick={() => void runAeoWriteup(page)}
                                    className={cn(
                                      "rounded-full px-3 py-1.5 text-xs font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
                                      pagePanel === "aeo" && selectedPageUrl === page.url
                                        ? "bg-accent text-black"
                                        : "bg-accent/90 text-black hover:opacity-90"
                                    )}
                                  >
                                    {aeoLoading ? "Running…" : hasAeo ? "AEO writeup ✓" : "AEO writeup"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy && !hasAds}
                                    onClick={() => void runAdPlacement(page.url)}
                                    className={cn(
                                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                                      pagePanel === "ads" && selectedPageUrl === page.url
                                        ? "bg-white/30 text-text-primary"
                                        : "bg-white/15 text-text-primary hover:bg-white/25"
                                    )}
                                  >
                                    {adsLoading ? "Running…" : hasAds ? "Ad placement ✓" : "Ad placement"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {pagePanel && (
                        <div className="min-w-0 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                          {pagePanel === "aeo" && (
                            <>
                              {pageActionLoading?.startsWith("aeo-") && !aeoCache[selectedPageUrl ?? ""] && (
                                <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-8 text-center text-sm text-text-secondary">
                                  Generating AEO writeup…
                                </div>
                              )}
                              {(() => {
                                const result = selectedPageUrl ? aeoCache[selectedPageUrl] : undefined;
                                if (!result) return null;
                                const questions = result.questions?.questions ?? [];
                                const queries = result.queries?.queries ?? [];
                                const weaknesses = result.analysis?.currentWeaknesses ?? [];
                                return (
                                  <article className="liquid-glass rounded-2xl bg-bg-primary/25 overflow-hidden">
                                    <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/10">
                                      <span className="min-w-0">
                                        <span className="block truncate text-sm font-medium">
                                          {result.analysis?.mainTopic ?? "Optimized page"}
                                        </span>
                                        <span className="block truncate text-[11px] font-mono text-text-tertiary">
                                          {result.url}
                                        </span>
                                      </span>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <button
                                          onClick={() => setExpandedResult(expandedResult === 0 ? null : 0)}
                                          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-text-secondary hover:bg-white/10 hover:text-text-primary transition-colors"
                                        >
                                          <Search size={12} />
                                          {expandedResult === 0 ? "Hide analysis" : "Show analysis"}
                                        </button>
                                        <button
                                          onClick={async () => {
                                            await navigator.clipboard.writeText(result.optimizedWriteup || "");
                                            setCopiedUrl("writeup-0");
                                            window.setTimeout(() => setCopiedUrl(null), 1500);
                                          }}
                                          className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-black hover:opacity-90 transition-opacity"
                                        >
                                          {copiedUrl === "writeup-0" ? (
                                            <>
                                              <Check size={12} /> Copied
                                            </>
                                          ) : (
                                            <>
                                              <Copy size={12} /> Copy writeup
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                    <div className="px-5 py-4">
                                      <MarkdownWriteup content={result.optimizedWriteup || ""} />
                                    </div>
                                    {expandedResult === 0 && (
                                      <div className="border-t border-white/10 px-5 py-4">
                                        <div className="grid gap-3 md:grid-cols-3">
                                          <Panel title="Citation Questions">
                                            {questions.slice(0, 5).map((q) => (
                                              <li key={q.question} className="flex gap-2 text-xs text-text-secondary">
                                                <span className={cn(scoreTone(q.citationPotential), "shrink-0 font-mono")}>
                                                  {q.citationPotential}
                                                </span>
                                                <span className="break-words">{q.question}</span>
                                              </li>
                                            ))}
                                          </Panel>
                                          <Panel title="Fix First">
                                            {weaknesses.slice(0, 5).map((item) => (
                                              <li key={item} className="text-xs text-text-secondary break-words">
                                                {item}
                                              </li>
                                            ))}
                                          </Panel>
                                          <Panel title="AI Search Queries">
                                            {queries.slice(0, 5).map((q) => (
                                              <li key={q.query} className="text-xs text-text-secondary break-words">
                                                {q.query}{" "}
                                                <span className="text-text-tertiary">({q.platform})</span>
                                              </li>
                                            ))}
                                          </Panel>
                                        </div>
                                      </div>
                                    )}
                                  </article>
                                );
                              })()}
                            </>
                          )}

                          {pagePanel === "ads" && (
                            <>
                              {pageActionLoading?.startsWith("ads-") && !adsCache[selectedPageUrl ?? ""] && (
                                <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-8 text-center text-sm text-text-secondary">
                                  <p>Analyzing ad placement…</p>
                                  <p className="mt-2 text-xs text-text-tertiary">
                                    Capturing the page and running the attention heatmap. This can take up to a minute.
                                  </p>
                                </div>
                              )}
                              {!pageActionLoading?.startsWith("ads-") &&
                                selectedPageUrl &&
                                !adsCache[selectedPageUrl] &&
                                error && (
                                  <div className="liquid-glass rounded-2xl bg-red-500/10 p-5 text-sm text-red-300">
                                    {error}
                                  </div>
                                )}
                              {(() => {
                                const result = selectedPageUrl ? adsCache[selectedPageUrl] : undefined;
                                if (!result) return null;
                                return (
                                  <div className="space-y-4">
                                    <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-5">
                                      <div className="flex items-center gap-2 text-sm font-semibold">
                                        <BarChart3 size={16} className="text-accent" /> Ad Heatmap
                                      </div>
                                      <div className="mt-5 grid grid-cols-2 gap-2">
                                        <Metric label="Hotspots" value={String(result.hotspot_count)} />
                                        <Metric label="Warnings" value={result.warning || result.error ? "1" : "0"} />
                                      </div>
                                      {result.warning && (
                                        <p className="mt-4 text-xs text-amber-300">{result.warning}</p>
                                      )}
                                      {result.error && (
                                        <p className="mt-3 text-xs text-amber-300">{result.error}</p>
                                      )}
                                    </div>
                                    <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-3">
                                      {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI, not optimizable by next/image */}
                                      {result.image_base64 && (
                                        <div className="custom-scrollbar max-h-[min(80vh,960px)] overflow-y-auto overflow-x-hidden rounded-md bg-black/20">
                                          <img
                                            src={`data:image/jpeg;base64,${result.image_base64}`}
                                            alt="Ad heatmap analysis"
                                            className="w-full rounded-md object-contain object-top"
                                          />
                                        </div>
                                      )}
                                      <div className="mt-3 grid gap-2">
                                        {result.hotspots.slice(0, 5).map((spot) => (
                                          <div
                                            key={`${spot.x}-${spot.y}-${spot.label}`}
                                            className="rounded-2xl bg-white/10 px-3 py-2 text-xs text-text-secondary break-words"
                                          >
                                            {spot.label}: {spot.reason}
                                          </div>
                                        ))}
                                        {result.hotspots.length === 0 && (
                                          <p className="text-xs text-text-tertiary">
                                            No ranked slots on this page — the heatmap above still shows attention.
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {geoResults.length > 0 && crawlPages.length === 0 && (
                    <div className="space-y-4">
                      <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <Sparkles size={16} className="text-accent" /> GEO Optimized Writeups
                          </div>
                          <div className="flex items-center gap-3 text-xs text-text-tertiary">
                            <span>{geoResults.length} optimized</span>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-text-secondary">
                          Copy each writeup below and paste it directly into your website CMS.
                        </p>
                      </div>

                      {geoResults.map((result, idx) => {
                        const questions = result.questions?.questions ?? [];
                        const queries = result.queries?.queries ?? [];
                        const weaknesses = result.analysis?.currentWeaknesses ?? [];
                        return (
                          <article key={result.url} className="liquid-glass rounded-2xl bg-bg-primary/25 overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium">
                                  {result.analysis?.mainTopic ?? "Optimized page"}
                                </span>
                                <span className="block truncate text-[11px] font-mono text-text-tertiary">
                                  {result.url}
                                </span>
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setExpandedResult(expandedResult === idx ? null : idx)}
                                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-text-secondary hover:bg-white/10 hover:text-text-primary transition-colors"
                                >
                                  <Search size={12} />
                                  {expandedResult === idx ? "Hide analysis" : "Show analysis"}
                                </button>
                                <button
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(result.optimizedWriteup || "");
                                    setCopiedUrl(`writeup-${idx}`);
                                    window.setTimeout(() => setCopiedUrl(null), 1500);
                                  }}
                                  className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-black hover:opacity-90 transition-opacity"
                                >
                                  {copiedUrl === `writeup-${idx}` ? (
                                    <>
                                      <Check size={12} /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} /> Copy writeup
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="px-5 py-4">
                              <MarkdownWriteup content={result.optimizedWriteup || ""} />
                            </div>
                            {expandedResult === idx && (
                              <div className="border-t border-white/10 px-5 py-4">
                                <div className="grid gap-3 md:grid-cols-3">
                                  <Panel title="Citation Questions">
                                    {questions.slice(0, 5).map((q) => (
                                      <li key={q.question} className="flex gap-2 text-xs text-text-secondary">
                                        <span className={cn(scoreTone(q.citationPotential), "shrink-0 font-mono")}>
                                          {q.citationPotential}
                                        </span>
                                        <span className="break-words">{q.question}</span>
                                      </li>
                                    ))}
                                  </Panel>
                                  <Panel title="Fix First">
                                    {weaknesses.slice(0, 5).map((item) => (
                                      <li key={item} className="text-xs text-text-secondary break-words">
                                        {item}
                                      </li>
                                    ))}
                                  </Panel>
                                  <Panel title="AI Search Queries">
                                    {queries.slice(0, 5).map((q) => (
                                      <li key={q.query} className="text-xs text-text-secondary break-words">
                                        {q.query} <span className="text-text-tertiary">({q.platform})</span>
                                      </li>
                                    ))}
                                  </Panel>
                                </div>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}

                  {adsResult && crawlPages.length === 0 && (
                    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
                      <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <BarChart3 size={16} className="text-accent" /> Ad Heatmap
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-2">
                          <Metric label="Hotspots" value={String(adsResult.hotspot_count)} />
                          <Metric label="Warnings" value={adsResult.warning || adsResult.error ? "1" : "0"} />
                        </div>
                        {adsResult.warning && <p className="mt-4 text-xs text-amber-300">{adsResult.warning}</p>}
                        {adsResult.error && <p className="mt-3 text-xs text-amber-300">{adsResult.error}</p>}
                      </div>
                      <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI, not optimizable by next/image */}
                        {adsResult.image_base64 && (
                          <div className="custom-scrollbar max-h-[min(80vh,960px)] overflow-y-auto overflow-x-hidden rounded-md bg-black/20">
                            <img
                              src={`data:image/jpeg;base64,${adsResult.image_base64}`}
                              alt="Ad heatmap analysis"
                              className="w-full rounded-md object-contain object-top"
                            />
                          </div>
                        )}
                        <div className="mt-3 grid gap-2">
                          {adsResult.hotspots.slice(0, 5).map((spot) => (
                            <div
                              key={`${spot.x}-${spot.y}-${spot.label}`}
                              className="rounded-2xl bg-white/10 px-3 py-2 text-xs text-text-secondary break-words"
                            >
                              {spot.label}: {spot.reason}
                            </div>
                          ))}
                          {adsResult.hotspots.length === 0 && (
                            <p className="text-xs text-text-tertiary">
                              No ranked slots on this page — the heatmap above still shows attention.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {abResult && (
                    <div className="liquid-glass rounded-2xl bg-bg-primary/25 p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold"><LayoutDashboard size={16} className="text-accent" /> A/B Testing</div>
                      <div className="mt-5 grid grid-cols-3 gap-2">
                        <Metric label="Experiments" value={String(abResult.experiments.length)} />
                        <Metric label="Events" value={String(abResult.overview?.totals.events ?? 0)} />
                        <Metric label="Users" value={String(abResult.overview?.totals.users ?? 0)} />
                      </div>
                      {abResult.experiments.length === 0 && <p className="mt-4 text-xs text-text-secondary">Site connected. Create an experiment from the backend dashboard or SDK flow to start measuring changes.</p>}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="liquid-glass rounded-2xl bg-bg-primary/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">{label}</div>
      <div className="mt-1 font-mono text-lg text-text-primary">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="liquid-glass rounded-2xl bg-bg-primary/20 p-3 min-w-0 overflow-hidden">
      <div className="mb-2 text-xs font-semibold text-text-primary">{title}</div>
      <ul className="space-y-2 break-words">{children}</ul>
    </div>
  );
}
