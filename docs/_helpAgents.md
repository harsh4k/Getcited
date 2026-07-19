# _helpAgents.md — Start Here

> **Human onboarding router for GEO.ai.** This file points to the real docs — it does **not** restate them (that caused drift). Each fact lives in exactly one place; here you get the 60-second orientation and where to go next.
>
> AI coding agents: your rules are in **`AGENTS.md`**, not here.

---

## 60-Second Orientation

**GEO.ai** — the AI Visibility OS. "Ahrefs for AI search," but it *fixes* things instead of only reporting them.

- **The loop:** Monitor → Fix → Prove. Every feature serves one of those verbs.
- **Hero (wins demos):** Ad-Revenue Heatmap ★
- **Moat (keeps users):** A/B Testing SDK ★
- **Core (daily value):** AEO Engine ★
- **The shared number:** the GEO Score (0–100), defined once in `prd.md §5`.
- **Team:** TheTokenziers — Jatin "Ded" (Sr Dev), Harsh (Design), Suneet/Kysen (Ideation).
- **Stage:** Hackathon MVP, July 2026.

That's the whole thing. Now go to the source for depth.

---

## Where Everything Lives (single source of truth per topic)

| I need to understand… | Read | Owns |
|---|---|---|
| Why this exists, market, moat, vision | **`brain.md`** | Strategy |
| Features, GEO Score formula, API, data model, KPIs, risks | **`prd.md`** | Product spec |
| Competitors, gaps, pricing, positioning | **`competitors.md`** | Market |
| Feature relationships, dependencies, priority rationale | **`treemap.md`** | Scope map |
| Where a file/route goes | **`structure.md`** | Code layout |
| Colors, type, spacing, motion, components | **`design.md`** | Design tokens |
| Voice, logo, brand applications | **`brand.md`** | Brand |
| Current sprint / what to build next | **`ROADMAP.md`** | Volatile state |
| Coding rules for AI agents (all tools) | **`AGENTS.md`** | Agent rules |

**Dedup rule:** if two files seem to cover the same thing, the "Owns" column wins. Example — every color hex lives in `design.md`; `brand.md` references it. Don't copy values between files; link instead.

---

## First-Day Reading Paths

**New engineer:** `brain.md` → `prd.md §5` (the score) → `structure.md` → `AGENTS.md` → `ROADMAP.md`.

**New designer:** `brand.md` → `design.md` → `prd.md §6` (feature UX).

**New PM / ideator:** `brain.md` → `competitors.md` → `treemap.md` → `prd.md`.

**Pitching / demo prep:** `competitors.md §0` (TL;DR) + §5 (positioning) → lead the demo with the **Heatmap**.

---

## Team

| Role | Name | Focus |
|---|---|---|
| Senior Dev | Jatin "Ded" | Architecture, implementation, AI integration |
| Designer | Harsh | UI/UX, design system, visual identity |
| Ideator | Suneet / Kysen | Product strategy, market, feature ideation |

**Team:** TheTokenziers.

---

## Doc Conventions

- Cross-references use **filenames and section numbers** (`prd.md §5`), never line numbers — line numbers break on every edit.
- Volatile content (sprint status, task lists) lives only in `ROADMAP.md`, kept out of always-loaded rule files.
- If you add a doc, register it in the table above and in `_Navigate.md`.
