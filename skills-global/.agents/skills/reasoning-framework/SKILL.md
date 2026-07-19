---
name: reasoning-framework
description: >-
  Apply structured reasoning to complex problems. Use whenever the user faces a difficult technical problem, ambiguous requirements, a debugging challenge, or any situation where "just start coding" would be premature. Also use when the user asks to "think through", "reason about", "analyze", "break down", "what am I missing", or when they present a problem with multiple unknowns or failure modes. Activate even when the user does not explicitly ask for reasoning — if the problem is hard, the skill should engage.
---

# Reasoning Framework

Guide the user through structured thinking when the path forward isn't obvious.

## Core Principle

Most engineering mistakes come from jumping to solutions too quickly. Slow down at the right moments to save time overall. This skill exists to catch those moments and add just enough structure to avoid costly backtracking.

## When to use this

Apply structured reasoning when:
- The problem has multiple unknowns you need to untangle
- There are competing explanations for a bug or failure
- A decision has consequences that are hard to reverse
- You're in unfamiliar territory (new domain, new codebase, new tech)
- The user seems stuck, frustrated, or unsure what to try next
- The user asks to "think step by step" or "reason through this"

Do NOT use this for simple lookups, straightforward implementations, or well-understood tasks — that would be over-engineering.

## Reasoning patterns

Choose a pattern based on the situation. Explain briefly why you're using it so the user can learn.

### First Principles — for when assumptions are wrong

Strip the problem down to its fundamental truths and rebuild from there.

1. What are we absolutely certain is true?
2. What are we assuming that might not be true?
3. What would the simplest possible solution look like?
4. What's the actual root mechanism causing the problem?

Use this when debugging something that shouldn't be broken, or when conventional wisdom keeps failing.

### MECE (Mutually Exclusive, Collectively Exhaustive) — for analysis with gaps

Break the problem space into non-overlapping categories that cover all possibilities.

1. Enumerate all possible categories or causes
2. Check each one for completeness and non-overlap
3. Investigate the most likely or most impactful first
4. Cross off categories as you eliminate them

Use this when you're not sure where the problem is and need a systematic search.

### Premortem — for risk discovery

Assume the project has failed. Work backward: what went wrong?

1. "It's 6 months from now and this project is a disaster. What happened?"
2. List every failure mode that comes to mind
3. For each one: how likely is it? How bad would it be? Can we prevent or mitigate it now?
4. Prioritize the high-likelihood, high-impact risks

Use this when planning something ambitious or when everyone seems too optimistic.

### Decision matrix — for choices with multiple criteria

When you need to pick between options with different tradeoffs.

1. List the options (2-5)
2. List the criteria that matter (3-6)
3. Score each option against each criterion (1-5)
4. Weight criteria by importance
5. Calculate and discuss the results

Don't treat the score as gospel — it's a thinking tool, not a calculator. The conversation around the scores is more valuable than the final number.

### Inversion — for when forward thinking isn't working

Instead of asking "how do I achieve X?", ask "what would guarantee failure?" — then avoid those things.

Use this when you're stuck on how to succeed but can clearly see what would fail.

## How to engage

Don't just apply a pattern mechanically. Instead:

1. **Name the pattern** you're using and why it fits the situation
2. **Walk through it** step by step, inviting input at each stage
3. **Synthesize** — what did we learn? what's the next action?
4. **Let the user drive** — if they want to stop reasoning and start doing, respect that

The goal is to build better thinking habits over time, not to force process onto every problem.
