const BACKEND = "/api";

export interface SiteData {
  id: number;
  user_id: number;
  name: string;
  url: string;
  sdk_key: string;
  created_at: string;
}

export interface ExperimentVariant {
  name: string;
  weight: number;
  selector?: string;
  html?: string;
  text?: string;
}

export interface ExperimentData {
  id: number;
  site_id: number;
  name: string;
  status: string;
  traffic_pct: number;
  variants: ExperimentVariant[];
  created_at: string;
}

export interface AbOverview {
  totals: { events: number; users: number; sessions: number };
  by_type: { event_type: string; count: number }[];
  recent: {
    event_type: string;
    path?: string | null;
    anonymous_id?: string;
    session_id?: string;
    experiment_id?: string | null;
    variant?: string | null;
    created_at?: string;
  }[];
  top_paths: { path: string; count: number }[];
}

export interface AbSiteDetail {
  site: SiteData;
  experiments: ExperimentData[];
  overview: AbOverview;
}

export interface ExperimentReportVariant {
  variant: string;
  events: number;
  users: number;
  pageviews: number;
  clicks: number;
  conversions: number;
  conversion_rate: number;
}

export interface ExperimentReport {
  experiment: ExperimentData;
  variants: ExperimentReportVariant[];
}

interface PageData {
  url: string;
  ok: boolean;
  status: number | null;
  content: string;
  error: string | null;
}

export interface GeoPipelineResult {
  url: string;
  analysis: {
    siteName?: string;
    pageType?: string;
    mainTopic?: string;
    targetAudience?: string;
    keyEntities?: string[];
    currentStrengths?: string[];
    currentWeaknesses?: string[];
  } | null;
  questions: {
    questions?: {
      question: string;
      citationPotential: number;
      difficulty: string;
      reason?: string;
    }[];
  } | null;
  queries: {
    queries?: {
      query: string;
      platform: string;
      intent: string;
      volume: string;
    }[];
  } | null;
  optimizedWriteup: string;
}

async function request<T = Record<string, unknown>>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BACKEND}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = (await res.json().catch(() => null)) as
    | (Record<string, unknown> & { error?: string | null })
    | null;
  // Only treat HTTP failures as hard errors. Several backend payloads include a
  // soft `error` field on 200 responses (e.g. ads heatmap with zero slots).
  if (!res.ok || data == null) {
    const message =
      data && typeof data.error === "string" && data.error.trim()
        ? data.error
        : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  crawl: (url: string) =>
    request<{
      site_url: string;
      sitemap_found: boolean;
      source: string;
      sitemaps: string[];
      link_count: number;
      pages: { url: string; ok: boolean; status: number | null; content: string; error: string | null }[];
      error: string | null;
    }>("/crawl", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),

  geoPipeline: (url: string, pages: PageData[]) =>
    request<{ success: boolean; data: GeoPipelineResult[] }>("/ai/geo-pipeline", {
      method: "POST",
      body: JSON.stringify({ url, pages }),
    }),

  adsAnalyze: (url: string) =>
    request<{
      url: string;
      final_url: string;
      page_width: number;
      page_height: number;
      model: string;
      hotspot_count: number;
      hotspots: { x: number; y: number; width: number; height: number; score: number; label: string; reason: string }[];
      image_base64: string;
      warning: string | null;
      /** Soft message when heatmap exists but no slot passed filters — not an HTTP failure. */
      error: string | null;
    }>("/ads/analyze", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),

  listSites: () => request<{ sites: SiteData[] }>("/ab/sites"),

  createSite: (name: string, url: string) =>
    request<SiteData>("/ab/sites", {
      method: "POST",
      body: JSON.stringify({ name, url }),
    }),

  getSite: (siteId: number) => request<AbSiteDetail>(`/ab/sites/${siteId}`),

  createExperiment: (
    siteId: number,
    name: string,
    variants: ExperimentVariant[],
    trafficPct: number
  ) =>
    request<ExperimentData>(`/ab/sites/${siteId}/experiments`, {
      method: "POST",
      body: JSON.stringify({ name, variants, traffic_pct: trafficPct }),
    }),

  setExperimentStatus: (experimentId: number, status: string) =>
    request<ExperimentData>(`/ab/experiments/${experimentId}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  getExperimentReport: (experimentId: number) =>
    request<ExperimentReport>(`/ab/experiments/${experimentId}/report`),

  abInsights: (payload: {
    site: { name: string; url: string };
    overview: AbOverview;
    experiments: ExperimentData[];
  }) =>
    request<{
      success: boolean;
      data: {
        suggestions: {
          title: string;
          rationale: string;
          action: string;
          priority: "high" | "medium" | "low";
        }[];
        source: "ai" | "heuristic";
      };
    }>("/ai/ab-insights", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

/** Install snippet — SDK origin is this app so /ab/collect + /ab/config rewrite correctly. */
export function sdkSnippet(sdkKey: string, origin?: string): string {
  const base = (origin || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");
  return `<script src="${base}/sdk.js" data-getcited-key="${sdkKey}" async></script>`;
}

/** Normalize URLs for site matching (ignore trailing slash / default ports). */
export function normalizeSiteUrl(value: string): string {
  const withProtocol = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;
  const u = new URL(withProtocol);
  u.hash = "";
  let path = u.pathname;
  if (path.endsWith("/") && path.length > 1) path = path.slice(0, -1);
  return `${u.protocol}//${u.host}${path}${u.search}`;
}
