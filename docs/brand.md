# brand.md — GEO.ai Brand Guidelines

> Brand identity, voice, and applications.
> **All visual tokens (color, type, spacing) live in `design.md`** — this file references them, never redefines them.

---

## 1. Identity

| | |
|---|---|
| **Name** | GEO.ai |
| **Stands for** | **G**enerative **E**ngine **O**ptimization |
| **Tagline** | The AI Visibility OS |
| **Marketing line** | "We help websites grow in the AI-first internet." |
| **Promise** | Every website deserves to be seen, cited, and clicked — even in the age of AI answers. |

The brand's whole personality reduces to one verb the category doesn't own: **fix.** Competitors report; we act. Everything below serves that.

---

## 2. Logo

- **Wordmark:** "GEO" bold Inter, ".ai" lighter weight.
- **Icon:** stylized compass / gradient circle — guidance through the AI landscape; gradient = the shift from search to AI-first.
- **Variants:** Full (icon+wordmark) for headers/marketing · Icon-only for favicon/app/social · Wordmark-only for footers · Dark variant on light bg · Light variant on dark bg.
- **Clear space:** ≥ the height of the "G" on all sides. Never on busy backgrounds without a container.

---

## 3. Voice & Tone

### Voice attributes

| Attribute | In practice |
|---|---|
| **Technical but approachable** | Know the craft, never talk down. "Your GEO score dropped 12 points — here's why and how to fix it." |
| **Confident** | "The AI Visibility OS. Not another SEO tool." |
| **Forward-thinking** | "The post-search internet is here. Are you ready?" |
| **Actionable** | Every insight ends in a next step. "Add an FAQ section to lift citation probability ~23%." |
| **Honest** | We optimize *probability*, not guarantees — and we say so. |

### Tone by context

| Context | Tone |
|---|---|
| Landing page | Bold, visionary, slightly urgent |
| Dashboard | Calm, clear, data-driven |
| Error messages | Helpful, specific, non-alarming |
| Audit reports | Direct, actionable, encouraging |
| Marketing email | Conversational, benefit-first |
| Docs | Precise, example-rich, patient |

### Writing rules
1. Lead with the benefit, not the feature.
2. Active voice.
3. Short sentences (<25 words).
4. Numbers and data wherever possible.
5. No jargon unless the audience expects it.
6. Never "leverage," "synergy," or "ecosystem" unironically.

---

## 4. Visual System

Color, typography, spacing, radius, shadow, motion, and iconography are **defined in `design.md`.** Do not restate hex values or type scales here — reference the token name (e.g. `--primary`, `text-2xl`) and let `design.md` own the value. This keeps brand and product pixel-identical.

Quick brand anchors (values in `design.md`):
- **Primary brand color:** `--primary` (Indigo).
- **Headings & body:** Inter · **data values:** JetBrains Mono (mono = "precise/technical").
- **Score bands** double as the brand's emotional color language (red→green = bad→excellent), matching `prd.md §5`.

---

## 5. Component Voice — Buttons

Visual specs in `design.md §6`. Brand-level intent:

| Variant | When | Label style |
|---|---|---|
| Primary | The main action on a screen | Specific verb + noun ("Run Audit") |
| Secondary | Alternative action | Neutral |
| Ghost | Tertiary / nav | Minimal |
| Danger | Destructive | Explicit ("Delete project") |
| Premium | Upgrade paths | Value-led ("Unlock Heatmap") |

---

## 6. Do's & Don'ts

### Do
- Default to dark mode (pro aesthetic, less fatigue).
- Lead with data and scores — people love quantified progress.
- Make every screen actionable.
- Use Indigo (`--primary`) for primary actions consistently.
- Show before/after comparisons — demonstrate value instantly.
- Keep navigation consistent.
- Monospace for data values.

### Don't
- Pure black (`#000`) — use `--bg-primary`.
- More than ~3 accent colors per screen.
- Generic CTAs ("Get Started") — be specific ("Run Your First Audit").
- Walls of text — use headers, bullets, cards.
- Animations >300ms.
- Pop-ups for non-critical info — use toasts/inline.
- Stock photos of people pointing at screens.

---

## 7. Applications

- **Email:** subject <50 chars, action-oriented · from "GEO.ai" · footer "The AI Visibility OS" + unsubscribe.
- **Social:** X → technical insights & GEO tips · LinkedIn → thought leadership & case studies · GitHub → dev tools & open source.
- **Slides:** dark bg (`--bg-primary`), light text, ≤6 words/line, score visuals as heroes.

---

## 8. Messaging Cheat-Sheet

Pull-quotes that carry the positioning (full argument in `brain.md` + `competitors.md`):

- "Not another SEO tool. The AI Visibility OS."
- "Everyone tells you what's wrong. We fix it."
- "See where AI attention lands — then make it pay."
- "Test every change against real revenue, not vibes."
