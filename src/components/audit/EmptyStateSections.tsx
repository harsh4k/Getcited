"use client";

import Image from "next/image";
import { BarChart3, Globe, Quote, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { prompt: "Analyze my site for AI search visibility", tool: "GEO Optimizer", subtitle: "AI Search Audit" },
  { prompt: "Crawl my site and list all pages", tool: "Crawl", subtitle: "Site Crawler" },
  { prompt: "Find my landing page ad hotspots", tool: "Ads", subtitle: "Attention Heatmap" },
  { prompt: "Set up an A/B test on my homepage", tool: "AB Test", subtitle: "Experiments" },
];

const STEPS = [
  {
    n: "01",
    title: "Paste a URL",
    body: "We discover your sitemap and crawl your strongest pages — no setup, no tracking script.",
    visual: (
      <div className="flex h-full items-center justify-center">
        <div className="w-4/5 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 font-mono text-[11px] text-white/70">
          https://yoursite.com<span className="animate-pulse text-accent">▎</span>
        </div>
      </div>
    ),
  },
  {
    n: "02",
    title: "AI analysis",
    body: "We surface the questions people ask ChatGPT, Gemini, and Perplexity where you should be the cited answer.",
    visual: (
      <div className="flex h-full flex-col justify-center gap-2 px-6">
        {[82, 64, 45].map((w) => (
          <div key={w} className="h-2 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-accent/70" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    ),
  },
  {
    n: "03",
    title: "Citation-ready output",
    body: "Rewritten, quotable content with the entities and structure AI engines love — ranked by impact.",
    visual: (
      <div className="flex h-full items-center justify-center">
        <Quote size={40} className="text-accent/80" fill="currentColor" strokeWidth={0} />
      </div>
    ),
  },
];

const STATS = [
  {
    value: "+23%",
    label: "avg citation lift",
    detail: "measured across beta audits within 30 days of applying rewrites",
  },
  {
    value: "2.4×",
    label: "more AI answers citing optimized pages",
    detail: "versus the same pages before schema and structure fixes",
  },
  {
    value: "60%",
    label: "of searches end without a click",
    detail: "being the cited answer is the new ranking — that's the traffic we win back",
  },
  {
    value: "40+",
    label: "checks per page",
    detail: "structure, entities, quotability, crawlability — scored on every audit",
  },
];

function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 84 84" className="h-24 w-24">
      <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
      <circle
        cx="42" cy="42" r={r} fill="none"
        stroke="var(--accent)" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)}
        transform="rotate(-90 42 42)"
      />
      <text x="42" y="47" textAnchor="middle" className="fill-white font-mono text-lg">{score}</text>
    </svg>
  );
}

function Tile({ className, onClick, children }: { className?: string; onClick?: () => void; children: React.ReactNode }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "scroll-reveal liquid-glass group relative overflow-hidden rounded-2xl bg-bg-primary/25 p-5 text-left",
        onClick && "cursor-pointer transition-colors hover:bg-white/10",
        className
      )}
    >
      {children}
    </Tag>
  );
}

interface EmptyStateSectionsProps {
  onPick: (tool: string) => void;
}

export function EmptyStateSections({ onPick }: EmptyStateSectionsProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-24">
      {/* Suggestion pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.prompt}
            onClick={() => onPick(s.tool)}
            className="liquid-glass group rounded-full bg-bg-primary/25 px-4 py-2 text-left transition-colors hover:bg-white/10"
          >
            <span className="block text-xs text-text-primary">{s.prompt}</span>
            <span className="block text-[10px] text-text-tertiary group-hover:text-text-secondary">{s.subtitle}</span>
          </button>
        ))}
      </div>

      {/* How it works — numbered media cards */}
      <div className="scroll-reveal mt-28 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">How Getcited works</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-white/75">From URL to AI-citable content in three steps.</p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.n} className="scroll-reveal liquid-glass overflow-hidden rounded-2xl bg-bg-primary/25">
            <div className="relative h-36 border-b border-white/10 bg-white/[0.03]">
              <span className="absolute left-5 top-4 font-mono text-3xl font-bold text-white/40">{step.n}</span>
              {step.visual}
            </div>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-text-primary">{step.title}</h3>
              <p className="mt-2 text-xs leading-5 text-text-secondary">{step.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bento — four tools, one goal */}
      <div className="scroll-reveal mt-28 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
          Four tools, one goal — <span className="text-accent">get cited</span>
        </h2>
      </div>
      <div className="mt-10 grid auto-rows-[160px] grid-cols-2 gap-4 lg:grid-cols-4">
        {/* GEO report — large */}
        <Tile className="col-span-2 row-span-2 p-6" onClick={() => onPick("GEO Optimizer")}>
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Sparkles size={16} className="text-accent" /> GEO Optimizer
          </div>
          <p className="mt-2 max-w-sm text-xs leading-5 text-text-secondary">
            The full pipeline: crawl, analyze, and rewrite your pages to maximize AI citation potential.
          </p>
          <div className="mt-5 flex items-center gap-5">
            <ScoreRing score={87} />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="w-fit max-w-full truncate rounded-full bg-white/10 px-3 py-1.5 text-[11px] text-white/80">
                &ldquo;best analytics tool for a small agency?&rdquo;
              </p>
              <p className="w-fit rounded-full bg-accent/15 px-3 py-1.5 font-mono text-[11px] text-accent">
                ✓ yoursite.com · cited #1
              </p>
              <p className="w-fit rounded-full bg-white/5 px-3 py-1.5 font-mono text-[11px] text-white/55">
                competitor-a.com
              </p>
            </div>
          </div>
          <span className="mt-4 inline-block text-[11px] text-accent opacity-0 transition-opacity group-hover:opacity-100">Run it →</span>
        </Tile>

        {/* Image tile — distinct from the site-wide moon-walk video backdrop */}
        <Tile className="col-span-2 row-span-2 p-0 lg:col-span-1">
          <Image
            src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=640&h=800&fit=crop&q=80"
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, 100vw"
            className="object-cover opacity-70 transition-opacity duration-500 group-hover:opacity-90"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-xs font-semibold text-white">Built for the AI-first internet</p>
            <p className="mt-1 text-[11px] text-white/75">Be the answer, not the alternative.</p>
          </div>
        </Tile>

        {/* Heatmap tile */}
        <Tile className="row-span-2" onClick={() => onPick("Ads")}>
          <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
            <BarChart3 size={14} className="text-accent" /> Ads
          </div>
          <p className="mt-1.5 text-[11px] leading-4 text-text-secondary">Predict where attention lands on any page.</p>
          <div className="relative mt-3 h-[calc(100%-4.5rem)] overflow-hidden rounded-lg border border-white/10 bg-white/5">
            <div className="absolute left-2 right-2 top-2 h-2 rounded bg-white/10" />
            <div className="absolute left-2 top-6 h-2 w-1/2 rounded bg-white/10" />
            <div className="absolute left-2 right-8 top-12 h-8 rounded bg-white/5" />
            <div className="absolute h-20 w-20 rounded-full bg-red-500/50 blur-xl" style={{ top: "8%", left: "12%" }} />
            <div className="absolute h-14 w-14 rounded-full bg-amber-400/40 blur-xl" style={{ top: "42%", right: "10%" }} />
            <div className="absolute h-10 w-10 rounded-full bg-emerald-400/30 blur-lg" style={{ bottom: "8%", left: "30%" }} />
          </div>
        </Tile>

        {/* Crawl tile */}
        <Tile onClick={() => onPick("Crawl")}>
          <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
            <Globe size={14} className="text-accent" /> Crawl
          </div>
          <svg viewBox="0 0 200 70" className="mt-2 h-[calc(100%-2rem)] w-full" aria-hidden>
            <g stroke="rgba(129,140,248,0.45)" strokeWidth="1">
              <line x1="100" y1="14" x2="40" y2="52" /><line x1="100" y1="14" x2="100" y2="52" />
              <line x1="100" y1="14" x2="160" y2="52" /><line x1="40" y1="52" x2="16" y2="64" />
            </g>
            <circle cx="100" cy="14" r="7" fill="var(--accent)" />
            {[[40, 52], [100, 52], [160, 52], [16, 64]].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill="rgba(255,255,255,0.35)" />
            ))}
          </svg>
        </Tile>

        {/* A/B tile */}
        <Tile onClick={() => onPick("AB Test")}>
          <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
            <Zap size={14} className="text-accent" /> A/B Test
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-[10px] text-white/75">
              A
              <div className="h-3 flex-1 rounded-full bg-white/10"><div className="h-full w-[46%] rounded-full bg-white/30" /></div>
              46%
            </div>
            <div className="flex items-center gap-2 text-[10px] text-accent">
              B
              <div className="h-3 flex-1 rounded-full bg-white/10"><div className="h-full w-[54%] rounded-full bg-accent" /></div>
              54%
            </div>
          </div>
        </Tile>

        {/* Stat tiles */}
        <Tile>
          <p className="font-mono text-3xl text-text-primary">1,400+</p>
          <p className="mt-2 text-[11px] leading-4 text-text-secondary">prompts tracked across ChatGPT, Gemini &amp; Perplexity — daily.</p>
        </Tile>
        <Tile>
          <p className="font-mono text-3xl text-text-primary">3 min</p>
          <p className="mt-2 text-[11px] leading-4 text-text-secondary">from pasting a URL to your first citation report.</p>
        </Tile>
      </div>

      {/* Numbers, not testimonials — we're new, so we show what we measure */}
      <div className="scroll-reveal mt-28 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">No testimonials. Just numbers.</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-white/75">Getcited is new — so instead of borrowed praise, here&apos;s what the product measures.</p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.value} className="scroll-reveal liquid-glass rounded-2xl bg-bg-primary/25 p-6">
            <p className="font-mono text-4xl text-accent">{s.value}</p>
            <p className="mt-2 text-sm font-semibold text-text-primary">{s.label}</p>
            <p className="mt-2 text-xs leading-5 text-text-secondary">{s.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
