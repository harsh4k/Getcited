# structure.md — GEO.ai File Structure

> Where every file and route lives. Use as the reference when creating anything new.
> Conventions are defined in `AGENTS.md §4`; this file shows the layout that follows them.
> ★ = strategic pillar (see `treemap.md §2`).

---

## Root

```
geo-ai/
├── AGENTS.md · CLAUDE.md · ROADMAP.md      # agent rules (AGENTS canonical)
├── .cursor/rules/geo-ai.mdc · .cursorrules # Cursor rules
├── opencode.json                            # opencode config
│
├── docs/                                    # brain · prd · design · brand
│   └── treemap · structure · competitors    #   (all reference each other)
│
├── prisma/  schema.prisma · migrations/ · seed.ts
│
├── sdk/                                      ★ A/B Testing SDK (standalone, <5KB)
│   ├── src/  index · tracker · ab-test · heatmap · reporter · utils
│   ├── dist/            # built/minified
│   └── package.json · tsconfig.json
│
├── public/  logo.svg · favicon.ico · og-image.png · fonts/
├── src/     app/ · components/ · lib/ · hooks/ · types/ · utils/
├── tests/   unit/ · sdk/ · e2e/
│
├── .env.example · .gitignore · .eslintrc.json · .prettierrc
├── next.config.js · tailwind.config.ts · tsconfig.json · postcss.config.js
├── package.json · README.md
```

---

## App Router — `src/app/`

```
app/
├── layout.tsx                 # root: html, fonts, providers
├── globals.css                # global styles + ALL CSS color variables (design.md §2)
│
├── (marketing)/               # public, no auth
│   ├── layout.tsx             # navbar + footer
│   ├── page.tsx               # landing (/)
│   ├── pricing/ about/ blog/[slug]/ docs/[slug]/
│
├── (dashboard)/               # authenticated
│   ├── layout.tsx             # sidebar + topbar
│   ├── dashboard/             # (5) home
│   ├── audit/  page · [id]/   # (1) new audit + report
│   ├── citations/             # (3) tracker
│   ├── aeo/  ★                # (2) core
│   │   ├── page · keywords/ · optimizer/ · [contentId]/
│   ├── simulator/             # (4) answer preview
│   ├── heatmap/  ★            # (6) hero
│   │   ├── page · [analysisId]/ · recommendations/
│   ├── experiments/  ★        # (7) moat
│   │   ├── page · new/ · [experimentId]/
│   ├── traffic/ schema/ trends/   # (9)(10)(11)
│   └── settings/
│       └── profile/ billing/ sdk/ ★ integrations/
│
├── api/                       # route handlers — all return { success, data?, error? }
│   ├── auth/[...nextauth]/
│   ├── audit/  route · [id]/
│   ├── citations/  route · trends/ · track/
│   ├── aeo/  ★  keywords/ · rewrite/ · preview/ · gaps/
│   ├── simulate/
│   ├── heatmap/  ★  capture/ · analyze/ · recommend/
│   ├── sdk/  ★  register/ · config/[siteId]/ · events/ · experiments/[id]/ · analytics/
│   ├── schema/  generate/ · validate/
│   ├── trends/  rising/ · gaps/
│   ├── projects/  route
│   └── user/  profile/ · billing/
│
├── auth/  login/ register/ error/
└── (plain)/  not-found/ maintenance/
```

---

## Components — `src/components/`

Each feature folder has a barrel `index.ts`. Check `ui/` before creating any new primitive.

```
components/
├── ui/          Button Card Input Select Modal Score Badge Tooltip Toast Tabs
│               Table Chart Skeleton Avatar Dropdown Toggle ProgressBar
│               CodeBlock EmptyState
│
├── layout/      Sidebar TopBar Footer PageHeader PageContainer
│
├── dashboard/   MetricCard CitationChart ActivityFeed QuickActions ProjectSelector
│
├── audit/       UrlInput AuditReport ScoreGauge SubScoreCard
│               RecommendationList WhyNotCited
│
├── aeo/  ★      KeywordTable KeywordCard GapHighlight AeoEditor RewriteButton
│               ComparisonView MultiModelPreview AnswerBlockGenerator SnippetCtaOptimizer
│
├── heatmap/  ★  ScreenshotPreview HeatmapOverlay ZoneLegend AdRecommendationCard
│               RevenueEstimator LayoutComparison HeatmapControls
│
├── experiments/ ★  ExperimentCard ExperimentForm VariantPreview ResultsChart
│               SignificanceMeter RetentionReport EngagementMetrics SdkInstallGuide
│
├── citations/   CitationTimeline CitationCard PlatformBreakdown CompetitorComparison
│
└── simulator/   QueryInput SimulatedAnswer CitationProbability CompetitorSimResults
```

> Note: the old `optimizer/` folder is **merged into `aeo/`** — the AEO engine is now the single owner of content-rewrite UI (Editor/PreviewPanel/AnswerBlocks live there). Don't recreate `optimizer/`.

---

## Lib — `src/lib/` (shared services)

> Build these **once**; multiple features consume each. `scoring.ts` is the critical path — 7 features depend on it (`treemap.md §5`).

```
lib/
├── db.ts          prisma singleton
├── auth.ts        authOptions, getSession, requireSession
├── ai.ts          generateRewrite, simulateAnswer, analyzeContent
├── crawler.ts     crawlPage, extractContent, extractMetadata
├── scoring.ts     ⚑ calculateGeoScore, calculateSubScores  (WEIGHTS live here, one constant)
├── citations.ts   queryAiModels, detectCitations, getCitationTrends
├── aeo.ts     ★   discoverKeywords, findGaps, scoreCitationPotential
├── heatmap.ts ★   captureScreenshot, generateHeatmap, recommendAdPlacements
├── screenshot.ts  shared capture (used by heatmap + extension)
├── experiments.ts ★  createExperiment, assignVariant, calculateSignificance
├── sdk.ts     ★   registerSite, getSdkConfig, processSdkEvents
├── schema.ts      generateSchema, validateSchema
├── email.ts       sendAuditReport, sendWeeklyDigest
└── stripe.ts      createCheckoutSession, getSubscriptionStatus (future)
```

⚑ The GEO Score weights are defined once in `scoring.ts` and specified in `prd.md §5`. Never hardcode weights at a call site — they will be re-tuned.

---

## Types — `src/types/index.ts`

Grouped shared types (keep in sync with `prisma/schema.prisma`):

User/Session/Plan · Project · Audit (Audit, **AuditScore with 6 sub-scores**, Recommendation, Status) · Citation (+Platform, Trend) · **AEO** ★ (AeoKeyword, KeywordGap, CitationPotential, RewriteResult) · **Heatmap** ★ (Analysis, AttentionZone, AdRecommendation, RevenueEstimate) · **Experiment** ★ (AbTestExperiment, Variant, Result, SdkEvent, RetentionReport, EngagementMetrics) · Content · Competitor · Trend · API (`ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`) · UI (NavItem, ChartDataPoint, ScoreBreakdown).

---

## Utils — `src/utils/`

```
utils/
├── constants.ts    APP_NAME/URL · SCORE_RANGES · PLATFORM_NAMES · PLAN_LIMITS
│                   · ZONE_COLORS (hot/cold/dead) · NAVIGATION_ITEMS
├── helpers.ts      cn() · formatDate/Number/Currency · getScoreColor/Label
│                   · getZoneColor · truncateText · isValidUrl · slugify
└── validations.ts  Zod: audit · content · project · profile
                    · aeoKeyword ★ · heatmapCapture ★ · experiment ★
```

`SCORE_RANGES` and `getScoreColor/Label` must match the bands in `design.md` and `prd.md §5`.

---

## Tests — `tests/`

```
tests/
├── unit/
│   ├── lib/        scoring ⚑ · crawler · helpers · aeo ★ · heatmap ★ · experiments ★
│   ├── components/ Button · Score · Card · HeatmapOverlay ★ · ResultsChart ★
│   └── api/        audit · citations · aeo ★ · heatmap ★ · sdk ★
├── sdk/            tracker · ab-test · reporter          ★
└── e2e/            auth · audit · aeo ★ · heatmap ★ · experiments ★ · dashboard
```

`scoring.test.ts` is the highest-value unit test — it guards the number everything depends on.

---

## Rules for Adding Files

**New dashboard page:** `app/(dashboard)/<feature>/page.tsx` → components in `components/<feature>/` (barrel export) → API in `app/api/<feature>/route.ts` (Zod + `{success,data,error}`) → types in `types/index.ts` → logic in `lib/<feature>.ts` → nav item in `Sidebar.tsx` → update this file.

**New UI primitive:** `components/ui/<Name>.tsx` → add to `ui/index.ts` → follow `design.md` → test in `tests/unit/components/`. **Check the folder first — don't duplicate an existing primitive.**

**New API route:** `app/api/<feature>/route.ts` → validate with Zod → return `{success,data,error}` → test in `tests/unit/api/`.
