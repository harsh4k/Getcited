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

export interface AdsAnalyzeResult {
  url?: string;
  final_url: string;
  page_width?: number;
  page_height?: number;
  model?: string;
  hotspot_count: number;
  hotspots: {
    x: number;
    y: number;
    width: number;
    height: number;
    score: number;
    label: string;
    reason: string;
  }[];
  image_base64: string;
  warning: string | null;
  error: string | null;
}

export interface AuditPageSnapshot {
  id: number;
  audit_id: number;
  url: string;
  content: string;
  content_hash: string;
  status: number | null;
  ok: boolean;
  error: string | null;
  state: "active" | "deleted" | string;
  first_seen_at: string;
  last_seen_at: string;
  aeo: GeoPipelineResult | null;
  aeo_source_hash: string | null;
  aeo_generated_at: string | null;
  aeo_outdated: boolean;
  ads: AdsAnalyzeResult | null;
  ads_source_hash: string | null;
  ads_generated_at: string | null;
  ads_outdated: boolean;
}

export interface AuditSummary {
  id: number;
  user_id: number;
  url: string;
  name: string | null;
  site_url: string | null;
  source: string | null;
  sitemap_found: boolean;
  link_count: number;
  created_at: string;
  refreshed_at: string;
  page_count: number;
  active_page_count: number;
  deleted_page_count: number;
  aeo_count: number;
  ads_count: number;
}

export interface AuditSnapshot extends AuditSummary {
  pages: AuditPageSnapshot[];
}

export interface AuditRefreshResult {
  audit: AuditSnapshot;
  changes: {
    created: number;
    updated: number;
    deleted: number;
    unchanged: number;
  };
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
      pages: {
        url: string;
        ok: boolean;
        status: number | null;
        content: string;
        error: string | null;
      }[];
      error: string | null;
    }>("/crawl", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),

  listAudits: () => request<{ audits: AuditSummary[] }>("/audits", { method: "GET" }),

  createAudit: (url: string) =>
    request<AuditSnapshot>("/audits", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),

  getAudit: (id: number) => request<AuditSnapshot>(`/audits/${id}`, { method: "GET" }),

  renameAudit: (id: number, name: string) =>
    request<AuditSnapshot>(`/audits/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),

  deleteAudit: (id: number) =>
    request<{ success: boolean }>(`/audits/${id}`, { method: "DELETE" }),

  clearAudits: () =>
    request<{ success: boolean; deleted: number }>("/audits", { method: "DELETE" }),

  refreshAudit: (id: number) =>
    request<AuditRefreshResult>(`/audits/${id}/refresh`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  saveAuditAeo: (auditId: number, url: string, aeo: GeoPipelineResult) =>
    request<AuditPageSnapshot>(`/audits/${auditId}/pages/aeo`, {
      method: "POST",
      body: JSON.stringify({ url, aeo }),
    }),

  saveAuditAds: (auditId: number, url: string, ads: AdsAnalyzeResult) =>
    request<AuditPageSnapshot>(`/audits/${auditId}/pages/ads`, {
      method: "POST",
      body: JSON.stringify({ url, ads }),
    }),

  geoPipeline: (url: string, pages: PageData[]) =>
    request<{ success: boolean; data: GeoPipelineResult[] }>("/ai/geo-pipeline", {
      method: "POST",
      body: JSON.stringify({ url, pages }),
    }),

  adsAnalyze: (url: string) =>
    request<AdsAnalyzeResult>("/ads/analyze", {
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

  renameSite: (siteId: number, name: string) =>
    request<SiteData>(`/ab/sites/${siteId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),

  deleteSite: (siteId: number) =>
    request<{ success: boolean }>(`/ab/sites/${siteId}`, {
      method: "DELETE",
    }),

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
  const base = (origin || (typeof window !== "undefined" ? window.location.origin : "")).replace(
    /\/$/,
    ""
  );
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
