# brain.md — GEO.ai

> **The AI Visibility OS for the post-search internet.**
> Core idea, market, positioning, and moat. Read this before any strategic decision.

| | |
|---|---|
| **Product** | GEO.ai — Generative Engine Optimization |
| **Tagline** | The AI Visibility OS |
| **One-liner** | Ahrefs for AI search — but it *fixes* things, not just reports them. |
| **Team** | TheTokenziers — Jatin "Ded" (Sr. Dev), Harsh (Design), Suneet/Kysen (Ideation) |
| **Stage** | Hackathon MVP (Namaste Dev Hackathon), July 2026 |
| **Related docs** | `prd.md` (features), `competitors.md` (market), `treemap.md` (scope), `design.md` (UI) |

---

## 1. Positioning Statement

> **For website owners losing traffic to AI answers**, GEO.ai is the **AI visibility execution platform** that shows you where AI attention lands on your page, rewrites your content to get cited, and A/B tests every change against real revenue — **unlike Profound, AthenaHQ, or Peec, which only tell you what's wrong.** GEO.ai fixes it.

The whole product hangs on one verb the competition doesn't own: **fix.** Everyone monitors. Nobody executes. That gap is the business.

---

## 2. Why Now (the wedge)

The internet is mid-migration from *search-and-click* to *ask-and-answer*. Three facts make this a **now** problem, not a someday one:

- **AI answers are replacing clicks.** Google AI Overviews appear on ~50% of searches; ChatGPT passed 900M weekly users in early 2026. Users get the answer without visiting the source.
- **The old playbook is inverted.** 83% of AI Overview citations come from pages *outside* the organic top 10 — ranking #1 no longer guarantees you're the cited source.
- **Revenue is leaking silently.** Publishers lose ad impressions, SaaS founders lose pipeline, affiliates lose commissions — even when their content is the thing the AI summarized.

The category is early enough to lead and painful enough to sell. Full data + sources in `competitors.md §1`.

---

## 3. The Problem

| Who | What breaks |
|---|---|
| Bloggers / publishers | Traffic and ad revenue fall as AI answers their topics without a click |
| SaaS founders | Competitors get recommended in AI answers; they don't — pipeline lost invisibly |
| Affiliate sites | Click-through and commission collapse |
| Agencies | Clients are asking about AI visibility; agencies have no tool to deliver it |

Underneath all four: **website owners have zero visibility into how AI perceives, cites, or recommends them — and no tool that acts on it.**

---

## 4. The Solution — Monitor → Fix → Prove

GEO.ai is built as a single loop, not a pile of features:

```
   MONITOR                 FIX                    PROVE
   ───────                 ───                    ─────
   GEO Score audit    →    AEO rewrite       →    A/B test the change
   Citation tracker   →    Ad-revenue        →    against real revenue
                          heatmap layout          & retention (SDK)
```

Every feature serves one of those three verbs. The GEO Score is the spine: it's the *before* number in Monitor, the target in Fix, and the *after* number in Prove. (Score formula defined once in `prd.md §5`.)

### The lead story: the Ad-Revenue Heatmap ★
The heatmap is our **hero feature** — the thing that makes a demo land in 10 seconds. Snapshot a site → generate an attention heatmap → recommend ad placements ranked by revenue impact. It's visual, it's tied directly to money, and **zero GEO competitors offer it.** It's how we get attention.

### The moat: the A/B Testing SDK ★
The heatmap wins the demo; the **SDK wins retention.** A <5KB script users embed on their site. Once it's collecting behavioral data and running experiments, their data and switching costs live on our platform. This is the compounding, defensible layer — the reason a user who installs it doesn't leave.

### The core value: the AEO Engine ★
The everyday reason to log in. Discover what AI searches for in your niche → one-click "Rewrite for AI" → preview how ChatGPT/Gemini/Perplexity would cite the result. This is the "fix" nobody else does.

---

## 5. Feature Roadmap (at a glance)

Priority tiers are strategic, not just chronological — see `treemap.md` for the full map.

**P0 — MVP (Weeks 1–4): prove the loop.**
1. AI Visibility Audit — URL in, GEO Score (0–100) + fix list out
2. AEO Content Optimization Engine ★ — discover + rewrite + multi-model preview
3. AI Citation Tracker — where ChatGPT/Gemini/Perplexity/Copilot cite you
4. AI Answer Preview (Simulator) — simulate the answer before you publish
5. Dashboard — the single pane of AI-visibility truth

**P1 — Growth (Weeks 5–12): the hook + the moat.**
6. Ad-Revenue Heatmap & Layout Optimizer ★ (hero) · 7. A/B Testing SDK ★ (moat) · 8. Browser Extension ★ (distribution) · 9. Traffic Recovery Analytics · 10. Schema Generator · 11. Trend Discovery · 12. Competitor Analysis

**P2 — Ecosystem (Weeks 13–24): someday.**
13. AI Brand Authority Builder · 14. Interactive Content Builder · 15. Community & Leaderboards *(lowest confidence — validate demand before building)*

---

## 6. Target Market

| Segment | Pain | Willingness to pay |
|---|---|---|
| Bloggers & creators | Traffic lost to AI summaries | Medium |
| Small/mid SaaS | Leads lost to AI-intermediated answers | High |
| News & media | Ad revenue declining as AI summarizes | High |
| Affiliate sites | Click-through & commission collapse | High |
| Agencies | Need a tool to serve clients *now* | Very high |

**Beachhead:** SMB publishers and creators who run ads — underserved by $500+/mo enterprise tools, and the exact audience the heatmap speaks to. Land here, expand to SaaS and agencies.

---

## 7. Business Model

| Phase | Motion | Notes |
|---|---|---|
| 1 — Validate | Agency / done-for-you | Manual optimization for first customers; build case studies, lower upfront cost |
| 2 — SaaS | Self-serve subscription | ₹999–₹14,999/mo tiers; automated audit, AEO, heatmap, SDK |
| 3 — Platform | API + white-label + enterprise | Agencies and developers build on top; browser extension distribution |

Pricing detail and competitive comparison: `competitors.md §8`.

---

## 8. The Moat — Honestly

Of the four "unique" features, not all are equally defensible. Being honest about this shapes where we invest:

| Feature | Role | Defensibility |
|---|---|---|
| **A/B Testing SDK** ★ | **The moat** | **High** — embedded code + accumulating data = real switching costs + a data flywheel |
| Ad-Revenue Heatmap ★ | Acquisition hook | Medium — copyable, but we're first and it's revenue-tied |
| AEO Engine ★ | Core value | Medium — the "fix" nobody ships today, but LLMs make it replicable over time |
| Browser Extension ★ | Distribution | Low on its own — valuable only because it surfaces the other three |

**Strategic read:** win demos with the heatmap, keep users with the SDK, give them a daily reason to return with AEO. The extension makes all of it feel omnipresent. Don't over-invest in the extension as a standalone.

---

## 9. Where We Could Lose

Strategy is nothing without knowing the failure modes (mitigations in `prd.md §10` and `competitors.md §9`):

- **AthenaHQ closes the execution gap** — closest competitor; already has advisory optimization. We must ship *actual* execution + heatmap/SDK (which they have no path to) faster.
- **Profound moves down-market** — unlikely (they're enterprise-anchored at $499+), but if they do, our SMB niche is the defense.
- **AI platforms change citation behavior** — the scoring engine must be modular and fast to re-tune.
- **The heatmap's revenue claims don't hold up** — validate estimates against real SDK data before we promise RPM lift numbers.

---

## 10. Long-Term Vision

> Become the **operating system for AI-era website growth** — "Google Analytics for AI traffic" plus an "AI reputation layer" where businesses monitor and shape how AI represents them.

The opportunity isn't "help websites rank on AI." It's **"help businesses survive and grow in the AI-first internet."**

---

## 11. Success Metrics (North Stars)

| Metric | Why it matters |
|---|---|
| **SDK installations** | The truest retention/moat signal |
| Avg. GEO Score improvement per user | Proves the "fix" actually works |
| Time-to-first-audit | Activation speed |
| Paying customers / MRR | The business |
| Net revenue retention | Compounding value of the SDK flywheel |

Targets in `prd.md §8`.
