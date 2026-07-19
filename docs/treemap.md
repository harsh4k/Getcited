# treemap.md — GEO.ai Feature Map

> How the 15 features relate, depend on each other, and earn their priority.
> Strategy behind the tiers: `brain.md`. Full specs: `prd.md`.

---

## 1. The Spine

Everything maps to one loop. If a feature doesn't serve Monitor, Fix, or Prove, it doesn't ship.

```
                        ┌─────────────────────────────┐
                        │      GEO SCORE (0–100)       │  ← the shared number
                        │   defined once in prd.md §5  │     (before → target → after)
                        └──────────────┬──────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
    ┌───▼────┐                    ┌────▼─────┐                   ┌─────▼────┐
    │ MONITOR │                   │   FIX     │                   │  PROVE   │
    └───┬────┘                    └────┬─────┘                   └─────┬────┘
        │                              │                              │
   Audit (1)                     AEO Engine (2) ★               A/B SDK (7) ★
   Citation Tracker (3)          Simulator (4)                  Heatmap (6) ★
   Dashboard (5)                 Schema Gen (10)                Traffic Recovery (9)
   Competitor Analysis (12)      Trend Discovery (11)
   Brand Authority (13)
```

★ = strategic pillar (hero / moat / core).

---

## 2. Strategic Roles (read this before priority)

Priority tiers (P0/P1/P2) say *when.* Roles say *why.* A feature can be later-phase but still strategically central.

| Role | Feature | Why it exists |
|---|---|---|
| **Hero** (wins the demo) | Ad-Revenue Heatmap (6) | Visual, revenue-tied, zero competition — the 10-second wow |
| **Moat** (keeps users) | A/B Testing SDK (7) | Embedded code + data flywheel = switching costs |
| **Core** (daily reason to log in) | AEO Engine (2) | The "fix" nobody ships |
| **Distribution** | Browser Extension (8) | Makes the other three omnipresent on-site |
| **Table stakes** | Audit (1), Citations (3), Dashboard (5) | Everyone has these; we must too, done well |
| **Support** | Simulator (4), Schema (10), Trends (11), Traffic (9), Competitor (12) | Deepen the loop |
| **Someday** | Brand Authority (13), Interactive Builder (14), Community (15) | Validate demand first |

---

## 3. Priority Tiers

### P0 — MVP (Weeks 1–4) · *prove the loop works end-to-end*

| # | Feature | Role | Depends on |
|---|---|---|---|
| 1 | AI Visibility Audit | Table stakes | Crawler, Scoring engine |
| 2 | AEO Engine ★ | **Core** | Audit (uses sub-score issues), AI service |
| 3 | Citation Tracker | Table stakes | AI query pipeline |
| 4 | AI Answer Preview | Support | Shares state with (2) |
| 5 | Dashboard | Table stakes | 1, 3 (aggregates their data) |

**Exit criteria:** a user takes one page through audit → fix → preview → dashboard and sees the GEO Score move.

### P1 — Growth (Weeks 5–12) · *add the hook + the moat*

| # | Feature | Role | Depends on |
|---|---|---|---|
| 6 | Ad-Revenue Heatmap ★ | **Hero** | Screenshot pipeline, Canvas overlay |
| 7 | A/B Testing SDK ★ | **Moat** | SDK build, event ingestion, experiments |
| 8 | Browser Extension ★ | Distribution | 1, 2, 6, 7 (surfaces them) |
| 9 | Traffic Recovery | Support | Audit + optional GA |
| 10 | Schema Generator | Support | Audit (schema sub-score) |
| 11 | Trend Discovery | Support | Powers (2) keyword discovery |
| 12 | Competitor Analysis | Support | Audit + Citations run on competitor domains |

### P2 — Ecosystem (Weeks 13–24) · *someday / validate first*

| # | Feature | Role |
|---|---|---|
| 13 | AI Brand Authority Builder | Someday |
| 14 | Interactive Content Builder | Someday |
| 15 | Community & Leaderboards | Someday (lowest confidence) |

---

## 4. Dependency Graph

```
Crawler ──► Audit (1) ──► Scoring Engine (GEO Score)
                │              │
                │              ├──► Dashboard (5)
                │              ├──► Schema Gen (10)
                │              └──► Traffic Recovery (9)
                │
                ▼
          AEO Engine (2) ◄──── Trend Discovery (11)
                │
                ├──► Simulator (4)   (shared content state)
                └──► Snippet CTA / Answer Blocks

AI Query Pipeline ──► Citation Tracker (3) ──► Competitor Analysis (12)
                                              └► Brand Authority (13)

Screenshot Pipeline ──► Heatmap (6) ──┐
                                       ├──► Browser Extension (8)
SDK + Event Ingestion ──► A/B (7) ─────┘
        │
        └──► feeds real data back into: Audit, Heatmap, AEO  (the flywheel)
```

**Critical-path insight:** the **Scoring Engine** is the single most-depended-on component (7 features touch it). Build it first, build it modular (`lib/scoring.ts`), and make weight changes cheap — AI behavior will shift.

---

## 5. Shared Infrastructure (build once)

| Service | File | Consumed by |
|---|---|---|
| Crawler | `lib/crawler.ts` | 1, 2, 6, 12 |
| Scoring engine | `lib/scoring.ts` | 1, 2, 4, 5, 9, 10, 12 |
| AI service | `lib/ai.ts` | 2, 3, 4, 11, 13 |
| Screenshot | `lib/screenshot.ts` | 6, 8 |
| Event ingestion | `api/sdk/events` | 7, 8, and the flywheel |

Don't duplicate these per-feature — reuse (per `AGENTS.md`).

---

## 6. Sequencing Rationale

1. **Scoring first** — it's the spine; nothing downstream works without it.
2. **Audit before AEO** — AEO consumes the audit's per-sub-score issues to build its fix list.
3. **Heatmap before SDK in the calendar, but SDK is the bigger bet** — heatmap gets attention in demos; SDK converts that attention into retention. Ship heatmap to pull people in, SDK to keep them.
4. **Extension last in P1** — it has no value until the things it surfaces (audit, heatmap, AEO, A/B) exist.
5. **P2 gated on demand** — don't build community/leaderboards until retention data proves people want them.
