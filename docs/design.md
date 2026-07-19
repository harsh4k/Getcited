# design.md — GEO.ai Design System

> **The single source of truth for design tokens** — colors, type, spacing, motion.
> `brand.md` references this file; it never redefines tokens. Build any UI from here.

---

## 1. Principles

1. **Dark-mode first.** A pro tool for people who live in dashboards. Dark reduces fatigue; light is the secondary theme.
2. **Score-centric.** Scores are the product's heartbeat — make GEO Score, citation probability, and revenue impact the visual anchors.
3. **Data density with clarity.** Maximum signal, zero clutter. Every pixel earns its place.
4. **Progressive disclosure.** Lead with the one number that matters; let users drill down.
5. **Speed is a feature.** Instant-feeling transitions and loading states. Perceived performance is real performance.
6. **Actionable everywhere.** Every screen has an obvious next step. No dead ends.
7. **Accessible by default.** WCAG 2.1 AA minimum — contrast, keyboard nav, screen readers.

---

## 2. Color Tokens

> Defined once here, as CSS custom properties in `globals.css`. Reference by token name, never raw hex, in components.

### Dark mode (primary)

| Token | Hex | Usage |
|---|---|---|
| `--primary` | `#6366F1` | Primary actions, links, active states (Indigo 500) |
| `--primary-hover` | `#818CF8` | Hover on primary |
| `--primary-dark` | `#4F46E5` | Pressed / emphasis |
| `--secondary` | `#06B6D4` | Secondary actions, data-viz accent (Cyan 500) |
| `--secondary-hover` | `#22D3EE` | Hover on secondary |
| `--accent` | `#F59E0B` | Highlights, badges, premium (Amber 500) |
| `--accent-hover` | `#FBBF24` | Hover on accent |
| `--bg-primary` | `#0F172A` | Main background (Slate 900) |
| `--bg-secondary` | `#1E293B` | Cards, panels, sidebar (Slate 800) |
| `--bg-tertiary` | `#334155` | Modals, elevated surfaces (Slate 700) |
| `--bg-hover` | `#283548` | Hover backgrounds |
| `--text-primary` | `#F1F5F9` | Primary text (Slate 100) |
| `--text-secondary` | `#94A3B8` | Labels, metadata (Slate 400) |
| `--text-tertiary` | `#64748B` | Placeholders (Slate 500) |
| `--border` | `#334155` | Default borders |
| `--border-hover` | `#475569` | Hover borders |

### Light mode (secondary)

| Token | Hex |
|---|---|
| `--bg-primary` | `#F8FAFC` |
| `--bg-secondary` | `#FFFFFF` |
| `--bg-tertiary` | `#F1F5F9` |
| `--text-primary` | `#0F172A` |
| `--text-secondary` | `#64748B` |
| `--border` | `#E2E8F0` |

### Semantic

| Token | Hex | Bg (10%) |
|---|---|---|
| `--success` | `#22C55E` | `#22C55E1A` |
| `--warning` | `#F59E0B` | `#F59E0B1A` |
| `--error` | `#EF4444` | `#EF44441A` |
| `--info` | `#3B82F6` | `#3B82F61A` |

### Score bands (gauges)

| Range | Label | Hex |
|---|---|---|
| 0–25 | Poor | `#EF4444` |
| 26–50 | Needs Work | `#F59E0B` |
| 51–75 | Good | `#06B6D4` |
| 76–100 | Excellent | `#22C55E` |

Score labels/bands map 1:1 to the GEO Score definition in `prd.md §5`.

---

## 3. Typography

| Role | Font | Weights |
|---|---|---|
| Headings | Inter | 600–800 |
| Body | Inter | 400–500 |
| Data / mono | JetBrains Mono | 400–500 |

### Scale

| Token | Size | Weight | Line | Tracking | Usage |
|---|---|---|---|---|---|
| `text-xs` | 12px | 400 | 16px | 0 | Captions, labels, badges |
| `text-sm` | 14px | 400 | 20px | 0 | Secondary body, metadata |
| `text-base` | 16px | 400 | 24px | 0 | Primary body |
| `text-lg` | 18px | 500 | 28px | -0.01em | Subheadings, card titles |
| `text-xl` | 20px | 600 | 28px | -0.01em | Section headings |
| `text-2xl` | 24px | 700 | 32px | -0.02em | Page titles |
| `text-3xl` | 30px | 700 | 36px | -0.02em | Hero headings |
| `text-4xl` | 36px | 800 | 40px | -0.02em | Landing heroes |

**Rules:** 65–75 char body line length · never skip heading levels · 600 for inline bold (not 700+) · **monospace for all data values** (scores, "82/100", URLs, numbers) — it reads as precise. Load via `next/font` with `font-display: swap` for zero layout shift.

---

## 4. Spacing, Radius, Shadow

**Spacing (4px base):** `1`=4 · `2`=8 · `3`=12 · `4`=16 · `5`=20 · `6`=24 · `8`=32 · `10`=40 · `12`=48 · `16`=64.

**Radius:** `sm`=4 (badges) · `md`=8 (buttons, inputs, cards) · `lg`=12 (modals, large cards) · `xl`=16 (feature/hero) · `full`=9999 (pills, avatars).

**Shadow:** `sm` hover lift · `md` cards/dropdowns · `lg` modals/popovers · `glow-indigo` primary focus · `glow-cyan` secondary focus. In dark mode, prefer **colored glows over drop shadows** for interactive elements.

---

## 5. Motion

- **Purposeful, not decorative** — animation communicates state change.
- **Fast:** 150–200ms micro-interactions, 300ms page transitions. Never >300ms.
- **Easing:** `ease-out` entering, `ease-in` exiting.

| Animation | Spec |
|---|---|
| Score fill | Gauge animates 0 → value on mount |
| Card hover | `translateY(-2px)` + shadow bump |
| Sidebar collapse | 200ms width |
| Page transition | 150ms fade |
| Toast | Slide from top-right, auto-dismiss 5s |
| Skeleton | Shimmer sweep |

---

## 6. Component Inventory

### UI primitives (`components/ui/`)
Button · Card · Input · Select · Modal · **Score** (gauge 0–100) · Badge · Tooltip · Toast · Tabs · Table · Chart (Recharts wrapper) · Skeleton · Avatar · Dropdown · Toggle · ProgressBar · CodeBlock · EmptyState.

### Layout (`components/layout/`)
Sidebar · TopBar · Footer · PageHeader · PageContainer.

### Feature components
MetricCard · CitationChart · ActivityFeed · UrlInput · AuditReport · ScoreGauge · Editor · PreviewPanel · ComparisonView · RecommendationList · TrendCard · CompetitorRow · **HeatmapOverlay** · **AdRecommendationCard** · **ExperimentCard**.

**Rule:** check `components/ui/` before building any new primitive (per `AGENTS.md`).

---

## 7. States (don't skip these)

Every async view must design four states, not just the happy one:

| State | Requirement |
|---|---|
| **Loading** | Skeleton matching final shape (never a spinner alone on a full page) |
| **Empty** | `EmptyState` with an icon, one line of copy, and a primary action ("Run your first audit") |
| **Error** | Specific, non-alarming, with a retry — see `brand.md` voice rules |
| **Success** | The data, with the key number emphasized |

---

## 8. Layout Patterns

**Dashboard:** fixed TopBar (logo, ⌘K search, notifications, avatar) + collapsible Sidebar (active = indigo pill, hover = `--bg-hover`) + content area (max-width 1280px, 24px padding, 12-col grid).

**Marketing:** Navbar (logo, links, CTA) + full-width sections + Footer.

---

## 9. Responsive

| Breakpoint | Width | Behavior |
|---|---|---|
| `sm` | 640 | Sidebar → bottom tab bar; single column; lower density |
| `md` | 768 | Icon-only sidebar; 2-col grids |
| `lg` | 1024 | Full sidebar; 3–4 col; side-by-side panels (editor+preview) |
| `xl` | 1280 | Max content width |
| `2xl` | 1536 | Extra whitespace, multi-panel |

Mobile: charts simplify (fewer points), tables → cards, modals → full-screen sheets, touch targets ≥44×44px.

---

## 10. Theming Implementation

- All colors via CSS custom properties; toggle with `data-theme="dark"` on `<html>`.
- Default to dark; respect `prefers-color-scheme` on first visit; manual override persisted to `localStorage`.
- **Never pure black** — use `--bg-primary` (#0F172A). Elevation = lighter surface. Borders subtle. Slightly desaturate colors that feel harsh on dark.

---

## 11. Iconography

**Lucide React** — line icons, 1.5px stroke, 24×24 grid, monochrome unless semantic. Custom needed: GEO score gauge, citation marker, platform marks (ChatGPT/Gemini/Perplexity/Copilot).
