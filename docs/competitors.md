# competitors.md — GEO.ai Competitive Analysis

> Version 2.0 · The GEO/AEO landscape, gaps, and our position.
> Strategy that consumes this: `brain.md`. Features it justifies: `prd.md`.

---

## 0. TL;DR (one screen)

- **Market:** GEO/AEO is $850M (2025) → $12.1B (2034), **38.5% CAGR**. No vendor holds >~25%.
- **The universal gap:** every competitor **monitors** (tells you what's wrong). **None execute** (fix it). Promptwatch is the only partial exception.
- **Our wedge:** *execution* at *SMB pricing.*
- **Three features with literally zero GEO competition:** Ad-Revenue Heatmap, A/B Testing SDK, multi-model content preview.
- **Where we lead demos:** the **Heatmap** (visual, revenue-tied). **Where we hold users:** the **SDK** (switching costs + data flywheel).
- **Closest threat:** **AthenaHQ** (has advisory optimization + revenue attribution). We beat them on real execution + heatmap/SDK, which they have no path to.
- **Our weapon:** price — execution capabilities at ~10× below enterprise incumbents.

---

## 1. Market Overview

### The shift: SEO → GEO → AEO

| Era | User behavior | Tools optimize for | Examples |
|---|---|---|---|
| SEO (2000–2024) | Type keywords, click links | Rankings, backlinks | Ahrefs, Semrush, Moz |
| GEO (2024–2026) | Ask AI, get answers | Citations in AI responses | Profound, AthenaHQ, Peec |
| **AEO (2026+)** | AI answers, no click | **Being THE cited source** | **GEO.ai** |

### Size & timing

| Metric | Value | Source |
|---|---|---|
| Market 2025 | $850M | Research Intelo |
| Market 2034 | $12.1B | Research Intelo |
| CAGR | 38.5% | Research Intelo |
| VC into GEO 2023–26 | $480M+ | Higashi Report |

**Timing signals:** ChatGPT >900M WAU (early 2026) · AI Overviews on ~50% of searches · **83% of AI Overview citations come from pages outside organic top 10** (BrightEdge) · Gartner: 25% decline in traditional search by 2026, 50% of traffic to generative AI by 2028.

**Bottom line:** real pain, fast growth, no dominant player.

---

## 2. Landscape

### Tier 1 — Pure-play GEO/AEO (direct)

| Company | Funding | Pricing | Engines | Best for |
|---|---|---|---|---|
| **Profound** | $155M | $499–5,000+/mo | 10+ | Enterprise analytics |
| **AthenaHQ** | $2.7M (YC W25) | $270–2,000+/mo | 8+ | Revenue attribution |
| **Peec AI** | $29M | €89–205/mo | 3–6 | Mid-market monitoring |
| **Otterly.ai** | — | $29–489/mo | 6 | SMB entry monitoring |
| **Scrunch AI** | $19M | $250–1,000/mo | 7+ | Agency workflows |
| **Promptwatch** | — | ~$99+/mo | 10+ | Content + tracking |
| **Evertune** | $19M | $3,000+/mo | 4+ | Statistical scale |
| **Bluefish** | $24M | Enterprise | Multiple | Enterprise agentic |
| **Goodie.ai** | — | $495/mo | All major | DTC brands |

### Tier 2 — SEO tools with AI bolt-ons (indirect)

| Company | Added | Pricing | Threat |
|---|---|---|---|
| **Semrush** | AI Visibility Toolkit + LLM Optimizer | $99/mo add-on | High (user base) |
| **Ahrefs** | Brand Radar | Included | Medium |
| **SE Ranking** | AI Visibility Tracker | $119/mo add-on | Low |
| **BrightEdge** | AI Search modules | Enterprise | Medium |
| **Conductor** | AI Mention Tracking | Enterprise | Low |

### Tier 3 — Adjacent
Mersel AI (managed service) · HubSpot (free grader) · Frase (content) · **Attrifast** (Stripe attribution, $15/mo — medium relevance) · Geoptie (budget) · Trakkr (white-label).

---

## 3. Deep dives (the ones that matter)

### Profound — enterprise leader
$155M, ~$1B valuation, 700+ customers incl. 10% of Fortune 500. **Strengths:** Prompt Volumes panel, Agent Analytics, 10+ engines, SOC 2 Type II. **Weaknesses:** ~48% above category price; lost every 30-day head-to-head benchmark tested; monitoring-focused; needs an analyst team; no content generation. **Our take:** don't fight them in enterprise; their "monitor-only + expensive + no SMB" is our opening.

### AthenaHQ — the real threat
Ex-Google Search/DeepMind founders; G2 4.9. **Strengths:** native GA4/Shopify revenue attribution, Action Center optimization agents, ACE citation engine, QVEM volume model, won the 30-day benchmark (+45% answer share). **Weaknesses:** optimization is **advisory** (tells you; you do it); agents still maturing; better features locked to enterprise; SOC 2 Type I only. **Our take:** closest to our vision. We win on (1) actual execution, (2) SMB pricing, (3) heatmap + SDK — which they have no architectural path to.

### Peec AI — mid-market speed
$29M, 2,000+ teams, 115+ languages, fastest-growing. **Strengths:** best monitoring value, competitive benchmarking, clean UI. **Weaknesses:** monitoring only, no execution, no revenue features. **Our take:** users graduate to Peec from Otterly; we intercept by adding the "fix."

### Otterly — the entry point
$29/mo, 30k+ users, Gartner Cool Vendor. **Strengths:** cheapest, 25+ factor GEO audit, clean reports. **Weaknesses:** monitoring only; capped prompt/competitor slots; shallow. **Our take:** the starter pack users outgrow — be the upgrade with execution.

### Scrunch — agency play
$19M, SOC 2 Type II. **Strengths:** Agent Experience Platform concept (serve AI-optimized content to crawlers), hallucination detection, agency/white-label. **Weaknesses:** AXP still waitlisted; monitoring in practice; pricey for single brands. **Our take:** undercut on price, ship execution they haven't.

### Promptwatch — closest on "execution"
8,480+ brands, G2 4.7. **Strengths:** only one closing the loop (find gaps → generate content → track), scrapes real AI UIs, Answer Gap Analysis, content grounded in 880M+ citations. **Weaknesses:** less established; content quality varies; **no heatmap, no A/B, no revenue attribution.** **Our take:** most similar to us on content — we separate on the revenue side (heatmap + SDK).

---

## 4. Gap Analysis — what nobody does

| Gap | Who addresses | What we build |
|---|---|---|
| **Monitoring → Action** | Promptwatch (partial) | AEO keyword discovery + one-click rewrite + specific audit fixes |
| **Ad-revenue optimization** | **Nobody** | Ad-Revenue Heatmap → placement recs ranked by RPM |
| **A/B ↔ AI citation link** | **Nobody** | SDK connecting content tests to citation + revenue outcomes |
| **Revenue at risk / ROI** | AthenaHQ, Attrifast (partial) | Revenue-at-risk dashboard + full attribution |
| **Execution at SMB price** | **Nobody** | Execution platform at $10–50/mo |

> Three of these — heatmap, A/B/citation link, and multi-model preview — have **zero** competitors. That trio is the moat.

---

## 5. Positioning

**We are NOT:** another Profound (enterprise dashboard) · another Otterly (cheap monitor) · an SEO tool with an AI bolt-on.

**We ARE:** the AI Visibility **Execution** Platform — the full loop:

```
MONITOR  →  FIX          →  PROVE
Audit +     AEO rewrite +    A/B test vs.
Citations   Heatmap layout   real revenue (SDK)
```

### UVPs

| # | UVP | Beats |
|---|---|---|
| 1 | Ad-Revenue Heatmap (hero) | **Everybody — nobody has it** |
| 2 | A/B Testing SDK (moat) | **Everybody — nobody has it** |
| 3 | AEO engine: discover + rewrite + multi-model preview | AthenaHQ (advisory), Profound (no gen) |
| 4 | Execution at SMB pricing | Profound ($499+), AthenaHQ ($295+) |
| 5 | Revenue-first framing ("make more money," not "improve your score") | All (score-focused) |

### Positioning statement
> For website owners losing traffic to AI answers, GEO.ai is the AI visibility execution platform that discovers what AI searches for, rewrites content to match, optimizes ad layout for revenue, and A/B tests everything — unlike Profound, AthenaHQ, or Peec, which only tell you what's wrong. **GEO.ai fixes it.**

---

## 6. Where We Lose (honest)

Positioning without failure modes is marketing, not strategy:

| We lose to | When | Because | Our answer |
|---|---|---|---|
| **AthenaHQ** | Buyer wants proven optimization + revenue attribution today | They ship it now; we're pre-launch | Ship execution + heatmap/SDK fast; own the features they can't reach |
| **Profound / Evertune** | Enterprise buyer wants breadth + compliance | 10+ engines, SOC 2 Type II, analyst support | Don't compete here — stay SMB |
| **Peec / Otterly** | Buyer just wants cheap monitoring | Simpler, proven, live | Convert on the "fix" they lack |
| **Semrush** | Existing Semrush customer | Bundled, zero switching | We're AI-native, not a bolt-on — lead with heatmap/SDK they don't have |

**Honest risks to our own moat:** the heatmap is copyable (we're just first); AEO is replicable as LLMs commoditize; only the **SDK's accumulated data + switching costs** compound. Invest accordingly.

---

## 7. Feature Matrix (condensed)

| Feature | Profound | AthenaHQ | Peec | Otterly | Scrunch | **GEO.ai** |
|---|---|---|---|---|---|---|
| Multi-engine citation tracking | ✓ | ✓ | Partial | ✓ | ✓ | ✓ |
| Prompt volume data | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |
| AI keyword discovery | ✗ | Partial | ✗ | ✗ | ✗ | **✓** |
| One-click content rewrite | Partial | Advisory | ✗ | ✗ | ✗ | **✓** |
| Multi-model preview | ✗ | ✗ | ✗ | ✗ | ✗ | **✓ unique** |
| **Ad-revenue heatmap** | ✗ | ✗ | ✗ | ✗ | ✗ | **✓ unique** |
| **A/B testing SDK** | ✗ | ✗ | ✗ | ✗ | ✗ | **✓ unique** |
| Revenue attribution | ✗ | Partial | ✗ | ✗ | Partial | **✓** |
| Browser extension | ✗ | ✗ | ✗ | ✗ | ✗ | **✓ unique** |

---

## 8. Pricing

### Market reference
Free (HubSpot grader) · Entry $29–99 (Otterly, Geoptie) · Mid $100–300 (Peec, AthenaHQ, Scrunch) · Enterprise $500–5,000+ (Profound, Evertune).

### Ours

| Plan | Price/mo | Includes | Target |
|---|---|---|---|
| Free | ₹0 | 1 audit/mo, basic dashboard | Viral growth, lead capture |
| Starter | ₹999 (~$12) | Unlimited audits, AEO keywords, citations, basic optimizer | Solo bloggers |
| Growth | ₹4,999 (~$60) | + Heatmap, A/B testing, multi-model preview, 3 projects | Growing blogs, small SaaS |
| Agency | ₹14,999 (~$180) | + Unlimited projects, white-label, client SDK | Agencies |
| Enterprise | Custom | API, SLA, dedicated support | Large brands |

**Why it wins:** ~10× cheaper than Profound for comparable monitoring, and the only platform including **execution + heatmap + A/B** at these prices.

---

## 9. Key Takeaways

1. Market is real and fast ($850M → $12.1B, 38.5% CAGR).
2. No one dominates.
3. The monitoring→action gap is universal.
4. Revenue optimization is completely untied — our opening.
5. SMBs are underserved (enterprise starts at $500+).
6. Heatmap + SDK + multi-model preview = **zero competition.**
7. The SDK is the only *compounding* moat — everything else is a head start.
8. Price is the weapon.
