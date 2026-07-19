import { NextResponse } from "next/server";
import { chat } from "@/lib/openrouter";
import { rateLimit } from "@/lib/rate-limit";

interface InsightPayload {
  site: { name: string; url: string };
  overview: {
    totals: { events: number; users: number; sessions: number };
    by_type: { event_type: string; count: number }[];
    top_paths: { path: string; count: number }[];
  };
  experiments: {
    id: number;
    name: string;
    status: string;
    traffic_pct: number;
    variants: { name: string }[];
  }[];
}

export interface AbSuggestion {
  title: string;
  rationale: string;
  action: string;
  priority: "high" | "medium" | "low";
}

function isPayload(value: unknown): value is InsightPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const site = v.site as Record<string, unknown> | undefined;
  const overview = v.overview as Record<string, unknown> | undefined;
  const totals = overview?.totals as Record<string, unknown> | undefined;
  return (
    typeof site?.name === "string" &&
    typeof site?.url === "string" &&
    typeof totals?.events === "number" &&
    typeof totals?.users === "number" &&
    Array.isArray(overview?.by_type) &&
    Array.isArray(overview?.top_paths) &&
    Array.isArray(v.experiments)
  );
}

function heuristicSuggestions(input: InsightPayload): AbSuggestion[] {
  const { overview, experiments } = input;
  const events = overview.totals.events || 0;
  const users = overview.totals.users || 0;
  const pageviews = overview.by_type.find((t) => t.event_type === "pageview")?.count ?? 0;
  const clicks = overview.by_type.find((t) => t.event_type === "click")?.count ?? 0;
  const conversions = overview.by_type.find((t) => t.event_type === "conversion")?.count ?? 0;
  const suggestions: AbSuggestion[] = [];

  if (events === 0) {
    suggestions.push({
      title: "Install the SDK to start collecting data",
      rationale: "No events are in the database yet for this site profile.",
      action: "Paste the install snippet into your site <head>, then reload a public page.",
      priority: "high",
    });
  } else if (users < 20) {
    suggestions.push({
      title: "Gather more traffic before crowning a winner",
      rationale: `Only ${users} unique users recorded so far — early splits are noisy.`,
      action: "Keep the experiment running until you have at least ~50 users per variant.",
      priority: "high",
    });
  }

  if (experiments.length === 0 && events > 0) {
    suggestions.push({
      title: "Launch your first A/B experiment",
      rationale: "You're collecting traffic but nothing is being split yet.",
      action: "Create an experiment on your homepage CTA or hero headline with a CSS selector.",
      priority: "high",
    });
  }

  if (pageviews > 0 && clicks / Math.max(pageviews, 1) < 0.05) {
    suggestions.push({
      title: "Test a stronger primary CTA",
      rationale: `Click-through is low (~${((clicks / pageviews) * 100).toFixed(1)}% of pageviews).`,
      action: "A/B test CTA copy that names the outcome (e.g. “Get my GEO score”) vs a generic label.",
      priority: "medium",
    });
  }

  if (conversions === 0 && events > 30) {
    suggestions.push({
      title: "Instrument a conversion event",
      rationale: "Engagement is flowing in, but no conversion events are stored yet.",
      action: "Call GetCited.convert('signup') on your thank-you / checkout success page.",
      priority: "high",
    });
  }

  const top = overview.top_paths[0];
  if (top) {
    suggestions.push({
      title: `Focus experiments on ${top.path}`,
      rationale: `This path has the most pageviews (${top.count}) — changes here move the needle fastest.`,
      action: "Run a headline or layout test scoped to this URL first.",
      priority: "medium",
    });
  }

  if (experiments.some((e) => e.status === "running") && suggestions.length < 3) {
    suggestions.push({
      title: "Watch engagement depth alongside conversions",
      rationale: "Scroll and engagement events reveal whether a variant holds attention, not just clicks.",
      action: "Compare scroll-depth and time-on-page by variant before shipping a winner.",
      priority: "low",
    });
  }

  return suggestions.slice(0, 5);
}

function parseSuggestions(raw: string): AbSuggestion[] | null {
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as { suggestions?: AbSuggestion[] };
    if (!Array.isArray(parsed.suggestions)) return null;
    return parsed.suggestions
      .filter((s) => s && typeof s.title === "string" && typeof s.action === "string")
      .map((s): AbSuggestion => ({
        title: s.title,
        rationale: String(s.rationale || ""),
        action: s.action,
        priority:
          s.priority === "high" || s.priority === "low" || s.priority === "medium"
            ? s.priority
            : "medium",
      }))
      .slice(0, 6);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const rl = rateLimit("ai-ab-insights", { limit: 8, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.` },
      { status: 429 }
    );
  }

  try {
    const body: unknown = await req.json();
    if (!isPayload(body)) {
      return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 });
    }

    const fallback = heuristicSuggestions(body);

    try {
      const raw = await chat({
        temperature: 0.4,
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content:
              "You are a GEO / conversion optimization advisor. Given live A/B analytics JSON, return ONLY valid JSON: " +
              '{"suggestions":[{"title":"...","rationale":"...","action":"...","priority":"high|medium|low"}]}. ' +
              "Give 3-5 concrete, testable suggestions. No markdown.",
          },
          {
            role: "user",
            content: JSON.stringify(body, null, 2),
          },
        ],
      });
      const ai = parseSuggestions(raw);
      if (ai && ai.length > 0) {
        return NextResponse.json({ success: true, data: { suggestions: ai, source: "ai" as const } });
      }
    } catch {
      // Fall through to heuristics
    }

    return NextResponse.json({
      success: true,
      data: { suggestions: fallback, source: "heuristic" as const },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Insight generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
