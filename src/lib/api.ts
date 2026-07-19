const BACKEND = "/api";

interface SiteData {
  id: number;
  user_id: number;
  name: string;
  url: string;
  sdk_key: string;
  created_at: string;
}

interface ExperimentData {
  id: number;
  site_id: number;
  name: string;
  status: string;
  traffic_pct: number;
  variants: { name: string; weight: number; selector?: string; html?: string; text?: string }[];
  created_at: string;
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
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.error) {
    throw new Error(data?.error || `Request failed (${res.status})`);
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

  getSite: (siteId: number) =>
    request<{
      site: SiteData;
      experiments: ExperimentData[];
      overview: {
        totals: { events: number; users: number; sessions: number };
        by_type: { event_type: string; count: number }[];
        recent: Record<string, unknown>[];
        top_paths: { path: string; count: number }[];
      };
    }>(`/ab/sites/${siteId}`),

  createExperiment: (
    siteId: number,
    name: string,
    variants: { name: string; weight: number; selector?: string; html?: string; text?: string }[],
    trafficPct: number
  ) =>
    request<ExperimentData>(`/ab/sites/${siteId}/experiments`, {
      method: "POST",
      body: JSON.stringify({ name, variants, traffic_pct: trafficPct }),
    }),

  setExperimentStatus: (experimentId: number, status: string) =>
    request(`/ab/experiments/${experimentId}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  getExperimentReport: (experimentId: number) =>
    request(`/ab/experiments/${experimentId}/report`),
};
