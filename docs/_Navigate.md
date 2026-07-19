# _Navigate.md — Documentation Index

> Durable map of every doc. Cross-references use **section numbers**, never line numbers (those break on edit).
> For a 60-second orientation, read `_helpAgents.md` first.

---

## All Files

| File | Owns | Read when |
|---|---|---|
| `_helpAgents.md` | Onboarding router | First contact with the project |
| `_Navigate.md` | This index | Looking for which doc covers a topic |
| `brain.md` | Strategy | Strategic decisions, pitching, "why" |
| `prd.md` | Product spec | Implementing a feature, scope, the GEO Score |
| `competitors.md` | Market | Positioning, demos, product decisions |
| `treemap.md` | Scope map | Feature relationships, sequencing |
| `structure.md` | Code layout | Creating a file or route |
| `design.md` | Design tokens | Any UI work |
| `brand.md` | Brand | Voice, logo, brand consistency |
| `ROADMAP.md` | Volatile state | Current sprint, what's next |
| `AGENTS.md` | Agent rules | Any AI coding session (canonical) |
| `CLAUDE.md` · `.cursor/rules/` · `opencode.json` | Tool pointers | Tool-specific rule loading (all → AGENTS.md) |

---

## Topic → Source (single owner each)

### Strategy & market
| Topic | Source |
|---|---|
| Positioning statement | `brain.md §1`, `competitors.md §5` |
| Why now / market timing | `brain.md §2`, `competitors.md §1` |
| Problem & personas | `brain.md §3`, `prd.md §3` |
| The moat (honest) | `brain.md §8`, `competitors.md §6` |
| Business model & pricing | `brain.md §7`, `competitors.md §8` |
| Competitive deep-dives | `competitors.md §3` |
| Gap analysis | `competitors.md §4` |

### Product
| Topic | Source |
|---|---|
| **GEO Score formula** | `prd.md §5` |
| MVP scope (P0) | `prd.md §4`, `treemap.md §3` |
| Feature specs & acceptance criteria | `prd.md §6–7` |
| Non-functional requirements | `prd.md §9` |
| Success metrics / KPIs | `prd.md §8` |
| Risks & mitigations | `prd.md §10`, `competitors.md §6` |
| Feature dependencies & sequencing | `treemap.md §4–6` |

### Technical
| Topic | Source |
|---|---|
| Tech stack | `AGENTS.md §2` |
| File / folder / route layout | `structure.md` |
| API surface | `prd.md §11`, `structure.md` |
| Data model | `prd.md §12`, `prisma/schema.prisma` |
| Coding conventions | `AGENTS.md §4` |
| Commands, env vars | `AGENTS.md §7–8` |
| Shared services (scoring, crawler…) | `treemap.md §5`, `structure.md` |

### Design
| Topic | Source |
|---|---|
| Colors, type, spacing, motion | `design.md` (sole owner) |
| Component inventory & states | `design.md §6–7` |
| Responsive & theming | `design.md §9–10` |
| Voice, logo, brand applications | `brand.md` |

---

## Feature → Spec

All feature specs live in `prd.md`. Priority and dependencies in `treemap.md §3`.

| Feature | Priority | Spec |
|---|---|---|
| AI Visibility Audit | P0 | `prd.md §6.1` |
| AEO Engine ★ (core) | P0 | `prd.md §6.2` |
| Citation Tracker | P0 | `prd.md §6.3` |
| AI Answer Preview | P0 | `prd.md §6.4` |
| Dashboard | P0 | `prd.md §6.5` |
| Ad-Revenue Heatmap ★ (hero) | P1 | `prd.md §7.1` |
| A/B Testing SDK ★ (moat) | P1 | `prd.md §7.2` |
| Browser Extension ★ | P1 | `prd.md §7.3` |
| Traffic Recovery / Schema / Trends / Competitor | P1 | `prd.md §7.4` |
| Brand Authority / Interactive / Community | P2 | `treemap.md §3` |

---

## Maintenance

- New doc → add a row to **All Files** above and to the router in `_helpAgents.md`.
- Never cite line numbers across files; use `file.md §N`.
- If a topic appears in two files, mark one as owner here and make the other reference it.
