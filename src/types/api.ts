export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Site {
  id: number;
  user_id: number;
  name: string;
  url: string;
  sdk_key: string;
  created_at: string;
}

export interface Experiment {
  id: number;
  site_id: number;
  name: string;
  status: "draft" | "running" | "paused" | "completed";
  traffic_pct: number;
  variants: Variant[];
  created_at: string;
}

export interface Variant {
  name: string;
  weight: number;
  selector?: string;
  html?: string;
  text?: string;
}

export interface SiteOverview {
  totals: { events: number; users: number; sessions: number };
  by_type: { event_type: string; count: number }[];
  recent: {
    event_type: string;
    path: string;
    anonymous_id: string;
    session_id: string;
    experiment_id: string;
    variant: string;
    created_at: string;
  }[];
  top_paths: { path: string; count: number }[];
}

export interface CrawlResult {
  site_url: string;
  sitemap_found: boolean;
  source: "sitemap" | "html";
  sitemaps: string[];
  link_count: number;
  pages: Page[];
  error: string | null;
}

export interface Page {
  url: string;
  ok: boolean;
  status: number | null;
  content: string;
  error: string | null;
}

export interface Hotspot {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  label: string;
  reason: string;
}

export interface AdAnalysis {
  url: string;
  final_url: string;
  page_width: number;
  page_height: number;
  model: string;
  hotspot_count: number;
  hotspots: Hotspot[];
  image_base64: string;
  warning: string | null;
  error: string | null;
}

export interface ExperimentReport {
  experiment: Experiment;
  variants: {
    variant: string;
    events: number;
    users: number;
    pageviews: number;
    clicks: number;
    conversions: number;
    conversion_rate: number;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
