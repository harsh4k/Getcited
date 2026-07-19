---
name: architecture-planner
description: >-
  Make architectural decisions with structured tradeoff analysis. Use whenever the user asks about system design, architecture decisions, choosing between technologies, designing service boundaries, planning migrations, or when the conversation involves significant technical decisions that affect scalability, maintainability, or cost. Also use when the user says "should we use X or Y", "how should we architect this", "design the system", "what's the best approach for", or when evaluating technical tradeoffs even if not explicitly asking for architecture.
---

# Architecture Planner

Help the user make clear, documented architectural decisions. The goal is not to produce diagrams or specs — it's to build shared understanding and surface the right tradeoffs.

## When to engage

Anytime the conversation involves:
- Choosing between technologies, frameworks, or approaches
- Designing a new system or service
- Planning a migration or refactor
- Debugging a recurring architectural pain point
- Reviewing someone else's architecture proposal

The earlier in the process the better.

## Core workflow

### 1. Clarify constraints before proposing solutions

Start by understanding the context. Ask about:
- **Scale**: Users, data volume, growth expectations
- **Team**: Size, expertise, existing codebase ownership
- **Timeline**: When does it need to ship? Is this MVP or v2?
- **Constraints**: Budget, compliance, infra, organizational
- **Existing stack**: What's already in place? What's the team fluent in?

Don't treat these as a checklist. Ask naturally based on what's relevant.

### 2. Use ADRs for significant decisions

For any non-trivial choice, suggest or write an Architecture Decision Record with:

**Title**: A short, descriptive name of the decision

**Context**: What's driving this decision? What constraints exist?

**Options considered**: 2-4 realistic alternatives with pros/cons

**Decision**: What was chosen and why

**Consequences**: What tradeoffs were accepted — what gets easier and what gets harder

Keep ADRs short. One page max. They're communication tools, not documentation theater.

### 3. Compare options honestly

When comparing approaches, evaluate each option against these dimensions:
- **Complexity**: How hard is it to build, understand, and change?
- **Maintainability**: Will this be easy to debug and modify in 6 months?
- **Performance**: Latency, throughput, resource usage
- **Scalability**: How does it behave under 10x or 100x load?
- **Cost**: Infrastructure, development time, operational burden
- **Risk**: What could go wrong? How likely? How bad?

Recommend one option and explain why. If there's no clear winner, explain what additional information would break the tie.

### 4. Prefer boring technology

The best architecture is the simplest thing that works for the next 12-18 months. Default to:
- Technologies the team already knows
- Solutions with proven production track records
- The minimum number of moving parts

Novelty is a liability unless it directly solves a specific, confirmed problem.

### 5. Design for change

The only constant is that requirements will change. Favor architectures that:
- Make local changes cheap (good modular boundaries)
- Make it easy to add new features without rewriting old ones
- Can be migrated incrementally — no big-bang deployments
- Allow you to defer decisions that are hard to reverse

### 6. Write it down

After the conversation, offer to summarize the architecture decisions in a brief document the team can reference. This isn't about ceremony — it's about making sure decisions don't get lost or re-litigated every few weeks.
