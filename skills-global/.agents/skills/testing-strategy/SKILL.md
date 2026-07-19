---
name: testing-strategy
description: >-
  Design testing strategies and apply TDD principles. Use whenever the user asks about testing, test strategy, TDD, test coverage, mocking, integration testing, end-to-end testing, or how to test a specific feature. Also use when the user writes code without tests — suggest the right level of testing for the situation. Use when reviewing code — check for testability alongside correctness.
---

# Testing Strategy

Help the user write tests that provide real confidence without becoming a maintenance burden.

## Core philosophy

The goal of testing is confidence. Not coverage numbers, not purity of methodology. Every test should either make you more confident the system works correctly, or it should be deleted.

## When to test what

### The testing pyramid (practical version)

| Layer | What | How many | Speed | Confidence in |
|---|---|---|---|---|
| Unit | Individual functions and classes | Many | ms | Logic correctness |
| Integration | Module boundaries, DB access, API contracts | Some | ms-s | Components work together |
| E2E | User workflows via the real UI/API | Few | s-min | The system actually works |

Don't obsess over ratios. The right amount depends on your project. A data-processing library needs mostly units. A CRUD app needs more integration tests. A payment system needs E2E for critical flows.

### TDD: when it helps, when it doesn't

**TDD is great for:**
- Logic-heavy code (business rules, calculations, validations)
- Bug fixes — write a test that reproduces the bug, then fix it
- APIs with clear contracts — test drives the interface design
- Code you're unsure about — tests force you to understand the API first

**TDD is less useful for:**
- UI components where the "correct" output is subjective
- Exploratory or prototyped code where the requirements are fluid
- IO-heavy code that requires complex mocking (DB, network, filesystem)

### What makes a good test

1. **Readable** — someone unfamiliar with the code can understand what's being tested and what "passing" means
2. **Deterministic** — same code, same test, same result, every time. No flakiness.
3. **Isolated** — tests should be runnable in any order, independently
4. **Fast** — if tests are slow, people stop running them
5. **Focused** — each test tests one behavior, not multiple

A test that fails to tell you what's wrong when it breaks is worse than no test at all.

### What to mock

- External services you don't own (payment gateways, auth providers, third-party APIs)
- Time-dependent code (dates, clocks, delays)
- Randomness or non-deterministic output
- Heavy IO that makes tests slow

Do NOT mock:
- Your own code (refactor instead)
- Simple data transformations (use real values)
- Database queries that are core to the feature (use a test DB)

If mocking is painful, the design is telling you something. Listen.

## Test structure

### Arrange-Act-Assert

Every test should follow this pattern clearly:

```
// Arrange — set up the world
// Act — perform the action being tested
// Assert — verify the result
```

If you need comments to separate the sections, the test is probably too long.

### Naming convention

Test names should describe:
1. What's being tested
2. The scenario or input
3. The expected outcome

Example: `withdraw_insufficient_balance_returns_error` not `test_withdraw`

## Testing patterns by layer

### Unit tests
- Test the public API, not internal implementation
- One assertion per test (or a few that test the same behavior)
- Test edge cases: empty, null, zero, boundary values, error paths

### Integration tests
- Test the boundary between your code and external systems
- Use a real database in test containers or a test instance
- Test that your code handles both success and error responses from dependencies

### E2E tests
- Cover the critical user journeys (signup, purchase, core workflow)
- Test happy paths first, then critical error paths
- Keep them minimal — each E2E test is expensive to maintain

## Code review: testing lens

When reviewing code, always ask:
- Is this code testable? (Can you call it without complex setup?)
- Are the tests readable? (Can you tell what's being tested?)
- Are the tests meaningful? (Would they catch a real bug?)
- Are there obvious gaps in coverage? (Untested error paths, edge cases)
- Are the tests reliable? (Any non-determinism or shared state?)
