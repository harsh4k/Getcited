# prd.md — GEO.ai Product Requirements

| Field | Value |
|---|---|
| **Version** | 3.0 (reimagined) |
| **Date** | July 2026 |
| **Author** | TheTokenziers |
| **Status** | Draft |
| **Related** | `brain.md` (why), `competitors.md` (market), `treemap.md` (scope), `design.md` (UI), `structure.md` (code layout) |

---

## 1. Overview

GEO.ai is an **AI visibility execution platform**: it monitors how AI models see a website, fixes the content and layout to improve that, and proves the impact against real revenue. The organizing principle is one loop — **Monitor → Fix → Prove** (`brain.md §4`) — not a feature pile.

- **Hero feature:** Ad-Revenue Heatmap (demo magnet, revenue-tied, zero competition).
- **Moat feature:** A/B Testing SDK (switching costs + data flywheel).
- **Core value:** AEO Engine (the "fix" nobody ships).

---

## 2. Goals & Non-Goals

### Goals
- Give owners a single, trustworthy **GEO Score** and the specific fixes to raise it.
- Make optimization **execution**, not advice — one-click rewrites, generated schema, concrete ad placements.
- Track real AI citations across ChatGPT, Gemini, Perplexity, Copilot.
- Tie visibility work to **money** via heatmap ad optimization + SDK-measured retention.

### Non-Goals (v1)
- Replacing traditional SEO tools (we complement).
- Guaranteeing citations (we optimize *probability*, and say so).
- A general CMS, on-prem enterprise deployments, or internet-wide hallucination monitoring.

---

## 3. Personas

| Persona | Role | Goal | Pain | WTP/mo |
|---|---|---|---|---|
| **Priya** | Solo blogger | Keep traffic & ad revenue | 40% traffic drop in 6mo to AI Overviews | ₹500–2,000 |
| **Arjun** | B2B SaaS founder | Be the AI-recommended tool | Competitors cited, he isn't — silent pipeline loss | ₹5,000–15,000 |
| **Meera** | Agency owner (10 ppl) | Sell AI-visibility services now | Clients asking; no tool to deliver | ₹10,000–30,000 |

Priya is the **beachhead** — she runs ads, so the heatmap speaks directly to her.

---

## 4. MVP Scope (P0)

Five features. The bar for "done" is that a user can walk the full loop for one page: **audit → see the fix → apply it → preview the improved answer → watch it on the dashboard.**

| # | Feature | Loop role |
|---|---|---|
| 1 | AI Visibility Audit | Monitor |
| 2 | AEO Content Optimization Engine ★ | Fix |
| 3 | AI Citation Tracker | Monitor |
| 4 | AI Answer Preview (Simulator) | Fix (preview) |
| 5 | Dashboard | Monitor (aggregate) |

---

## 5. The GEO Score (canonical definition)

> This is the single specification of the score. Every other doc references it; nothing redefines it.

**GEO Score = weighted sum of six sub-scores, each 0–100, rounded to an integer 0–100.**

| # | Sub-score | Weight | What it measures | Signals (heuristics for MVP) |
|---|---|---|---|---|
| 1 | **Entity Clarity** | 20% | Can AI tell who/what the page is about? | Named entity density, author/brand presence, title↔content alignment |
| 2 | **Citation Friendliness** | 25% | How quotable is the content? | Self-contained claims, direct answers near headings, question-shaped H2/H3, list/table use |
| 3 | **Schema Validity** | 15% | Structured data AI can parse | Presence + validity of Article/FAQ/Org/Product schema |
| 4 | **Factual Density** | 20% | Facts per unit of text | Stats, dates, named sources, specific numbers vs. filler |
| 5 | **Structure** | 10% | Machine-readable layout | Heading hierarchy, paragraph length, TL;DR/summary blocks |
| 6 | **Source Credibility** | 10% | Signals of trust | Author bio, outbound citations, freshness/last-updated, HTTPS |

```
GEO = round(
  0.20*entity + 0.25*citation + 0.15*schema +
  0.20*factual + 0.10*structure + 0.10*credibility
)
```

**Bands** (colors in `design.md §Score Colors`): 0–25 Poor · 26–50 Needs Work · 51–75 Good · 76–100 Excellent.

**Rules:**
- Weights live in one constant (`lib/scoring.ts`), never hardcoded per-call — they *will* be re-tuned as AI behavior changes.
- Every sub-score returns not just a number but **the specific issues** behind it (this powers "Why AI Won't Cite You" and the AEO fix list).
- MVP uses heuristics; ML layers on later without changing the interface.

---

## 6. P0 Feature Requirements

### 6.1 — AI Visibility Audit (Monitor)
**Story:** *As a blog owner, I enter my URL and get a GEO Score so I know how likely AI is to cite me — and exactly what to fix.*

**Acceptance:**
- Valid URL initiates an audit; page is crawled (content, metadata, structure, schema).
- GEO Score + all six sub-scores render with a visual gauge (`ScoreGauge`).
- "Why AI Won't Cite You" lists specific issues, **ranked by score impact** (highest-leverage fix first).
- Each issue links to the relevant AEO action ("Fix this →").
- Report saved to the project and reachable from the dashboard.
- Completes in **≤30s** (p95); on failure, a clear retry state — never a blank screen.
- Free: 1 audit/mo. Paid: unlimited.

### 6.2 — AEO Content Optimization Engine ★ (Fix)
**Story:** *As a creator, I discover what AI searches for and rewrite my content to match, so my pages get cited.*

**Acceptance — Keyword Discovery:**
- Analyzes the domain/niche and surfaces AI-likely keywords & questions.
- Each keyword shows: est. volume, competition, **citation potential (0–100)**.
- Flags **gap keywords** (AI searches for it; user doesn't cover it).
- Ranked by citation probability.

**Acceptance — AI Rewrite:**
- Paste content or import by URL.
- Suggests AI-friendly changes: structure, direct-answer phrasing, entity mentions, formatting.
- One-click **"Rewrite for AI"**; generates answer blocks (FAQ, definition boxes, summary cards, tables).
- **Snippet CTA Optimizer** — structures summaries to leave a curiosity gap that drives the click.

**Acceptance — Before/After:**
- Side-by-side diff; **before → after GEO Score** delta shown prominently.
- Multi-model preview: how ChatGPT / Gemini / Perplexity would each summarize the result.
- Export as Markdown / HTML / copy.

### 6.3 — AI Citation Tracker (Monitor)
**Story:** *As a founder, I want to know when and where AI mentions my brand.*

**Acceptance:**
- Register domains/brands to monitor.
- System queries AI models with relevant keywords, detects citations/mentions.
- Dashboard: total citations, by-platform breakdown, trend over time.
- Each entry: model, query, context snippet, sentiment, date.
- Competitor citation comparison; weekly email digest; ≥90-day history.

### 6.4 — AI Answer Preview / Simulator (Fix — preview)
**Story:** *As a creator, I preview how AI would answer a question using my content before I publish.*

**Acceptance:**
- Enter keyword/question → simulated AI answer.
- Shows likely cited sources + the user's **Citation Probability Score** for that query.
- Recommends specific changes to raise it; competitor comparison for the same query.
- Re-runs live when content changes in the optimizer (shared state with 6.2).

### 6.5 — Dashboard (Monitor — aggregate)
**Story:** *As a user, I want one view of my AI visibility.*

**Acceptance:**
- Cards: GEO Score trend, total citations, traffic at risk, content optimized.
- Citation trend chart with selectable range (7/30/90d/custom).
- Activity feed (audits, citations, optimizations); quick actions (New Audit, Optimize, Simulate).
- Project selector for multi-site users; auto-refresh every 5 min.

---

## 7. P1 Feature Requirements (Growth)

### 7.1 — Ad-Revenue Heatmap & Layout Optimizer ★ (HERO)
**Story:** *As a publisher, I want to know where to place ads for maximum revenue, based on attention.*

**Acceptance:**
- Enter URL → full-page screenshot captured (Puppeteer).
- AI analyzes layout: visual hierarchy, density, scroll depth, attention zones.
- **Heatmap overlay:** hot / cold / dead zones (Canvas).
- **Ad placement recommendations** ranked by estimated RPM/CPM impact.
- Before/after layout mockup with suggested positions.
- Revenue-impact estimate ("Move ad A→B ≈ +X% RPM"). *Estimates must be validated against SDK data before shown as firm numbers (`brain.md §9`).*
- Ad-network aware (AdSense, Mediavine, AdThrive); shareable PDF; historical tracking.

### 7.2 — A/B Testing SDK & Analytics ★ (MOAT)
**Story:** *As an owner, I want to test layouts/content and see what retains users and revenue.*

**Acceptance — SDK:**
- <5KB gzipped, one-line install, no framework dependency, works on any stack.
- Tracks pageviews, scroll depth, clicks, time-on-page, bounce, nav paths. **No PII.**
- Real-time stream to dashboard.

**Acceptance — Testing & Reports:**
- Create experiments (A/B), auto traffic split, per-variant tracking.
- **Statistical-significance calculator** — no early false winners.
- Retention/engagement reports; **revenue correlation** to ad changes; weekly email; live dashboard widget.

**Acceptance — Integration (the flywheel):**
- Feeds Audit ("test your fix"), Heatmap ("verify predictions with real data"), AEO ("A/B original vs. optimized").

### 7.3 — Browser Extension ★ (Distribution)
On-page AI-visibility score, heatmap preview, AEO gap suggestions, top-3 fixes, live A/B status, one-click full audit, competitor compare, dashboard sync. Works on any site.

### 7.4–7.7 (specs retained from v2)
- **Traffic Recovery Analytics** — zero-click risk + revenue-at-risk + recovery plays; optional GA integration.
- **Schema Generator** — auto-generate + validate FAQ/Article/Org/Product schema; preview before apply.
- **AI Search Trend Discovery** — rising queries, weak-response opportunities, gap analysis; powers 6.2 keyword discovery.
- **Competitor Analysis** — side-by-side GEO Score, citation frequency, "why they're cited more" structural breakdown, head-to-head benchmark, PDF export.

---

## 8. Success Metrics & KPIs

| Metric | 6 mo | 12 mo |
|---|---|---|
| Registered users | 5,000 | 25,000 |
| Paying customers | 200 | 2,000 |
| MRR | ₹2,00,000 | ₹25,00,000 |
| Monthly audits | 2,000 | 15,000 |
| Content optimizations | 500 | 5,000 |
| **SDK installations** (moat NSM) | **100** | **1,000** |
| Heatmap reports | 300 | 3,000 |
| A/B tests run | 50 | 500 |
| Monthly churn | <8% | <5% |
| NPS | >30 | >50 |
| Avg. GEO Score lift | +15 | +20 |

---

## 9. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Performance** | Audit ≤30s p95; dashboard TTI ≤2s; SDK ≤5KB gzip, non-blocking (async, no layout shift). |
| **Reliability** | Long jobs (audit, heatmap) are async with status states (PENDING/COMPLETED/FAILED); no silent failures. |
| **Scalability** | Event ingestion (SDK) must handle burst writes; batch + queue, don't write per-event synchronously. |
| **Security** | JWT auth (NextAuth); API keys for programmatic/SDK access; secrets only in env; rate limit 100/min free, 1000/min pro. |
| **Privacy** | SDK collects **no PII**; opt-in; GDPR-aligned; transparent data usage. |
| **Accessibility** | WCAG 2.1 AA (see `design.md`). |
| **Observability** | Structured logs on every AI call and crawl; capture confidence scores, not just results. |

---

## 10. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| AI platforms block automated queries | High | High | Official APIs where possible; rotate methods; partnerships |
| Citation tracking inaccurate | High | Med | Multiple sources; manual spot-checks; show confidence scores |
| AI changes citation behavior | High | High | Modular scoring engine (`lib/scoring.ts`), rapid re-tune |
| AthenaHQ ships real execution | High | High | Beat them to *execution* + own heatmap/SDK (they have no path) |
| Profound moves down-market | High | Med | Own the SMB niche + price advantage |
| Heatmap revenue claims don't hold | Med | Med | Validate against SDK data before promising RPM lift |
| SDK adoption friction | Med | Med | <5KB, one-line install, instant value demo |
| Scope creep | Med | High | Strict P0/P1/P2; weekly scope review |

---

## 11. API Surface (v1)

```
/api/v1/
├── auth/                     # NextAuth
├── projects/                 # project CRUD
├── audit/  POST · GET/:id · GET
├── citations/  GET · GET /trends · POST /track
├── aeo/  POST /keywords · POST /rewrite · POST /preview · GET /gaps
├── simulator/  POST
├── heatmap/  POST /capture · POST /analyze · POST /recommend
├── sdk/  POST /register · GET /config/:siteId · POST /events
│        · POST /experiments · GET /experiments · GET /analytics
├── schema/  POST /generate · POST /validate
├── trends/  GET /rising · GET /gaps
└── user/  GET·PUT /profile · GET /billing
```
Response envelope everywhere: `{ success: boolean, data?: T, error?: string }`. Validate every input with Zod.

---

## 12. Data Model (entities)

Full field list unchanged from the schema below; keep in sync with `prisma/schema.prisma`.

`User` · `Project` · `Audit` (geoScore + 6 sub-scores + recommendations JSON) · `Citation` · `AeoKeyword` · `Content` · `HeatmapAnalysis` · `AbTestExperiment` · `AbTestResult` · `SdkEvent` · `Competitor` · `Trend`.

Key relationships: `User 1─* Project 1─* {Audit, Citation, AeoKeyword, Content, HeatmapAnalysis, AbTestExperiment, SdkEvent, Competitor}`. `AbTestExperiment 1─* AbTestResult`. `Trend` is global (not project-scoped).

---

## 13. Timeline

| Phase | Weeks | Deliverables |
|---|---|---|
| MVP | 1 | Setup, auth, schema, UI shell |
| | 2 | Audit (crawl, score, report) |
| | 3 | AEO (keywords + rewrite) + Citation Tracker |
| | 4 | Simulator + Dashboard + landing + deploy |
| Growth | 5–6 | **Heatmap ★** |
| | 7–8 | **A/B SDK ★** + analytics |
| | 9–10 | **Browser Extension ★** |
| | 11–12 | Billing, onboarding, landing optimization |
| Scale | 13–24 | Traffic Recovery, Schema, Trends, Competitor, then P2 |
