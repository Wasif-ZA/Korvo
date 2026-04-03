---
phase: 03-agent-pipeline
plan: "02"
subsystem: ai
tags: [agent-loop, linkedin-blocklist, circuit-breaker, claude-client, prompt-caching]
dependency_graph:
  requires: ["03-01"]
  provides: ["worker/lib/linkedin-blocklist", "worker/lib/circuit-breaker", "worker/lib/claude-client", "worker/lib/agent-loop"]
  affects: ["03-03", "03-04", "03-05", "03-06"]
tech_stack:
  added: ["@anthropic-ai/sdk v0.82.0", "opossum v9.0.0", "p-retry v8.0.0"]
  patterns: ["manual tool-use loop", "prompt caching via cache_control ephemeral", "vi.hoisted for mock factories"]
key_files:
  created:
    - worker/lib/linkedin-blocklist.ts
    - worker/lib/circuit-breaker.ts
    - worker/lib/claude-client.ts
    - worker/lib/agent-loop.ts
    - tests/agents/linkedin-blocklist.test.ts
    - tests/agents/agent-loop.test.ts
  modified: []
decisions:
  - "vi.hoisted required for mockCreate in vitest factories — vi.mock factories are hoisted before variable declarations"
  - "claude-client.ts must be mocked in agent-loop tests to prevent ANTHROPIC_API_KEY check at module load time"
  - "filterBlockedUrls regex preserves surrounding characters — matches URL endpoints at whitespace/quote/paren boundaries"
metrics:
  duration: "9 minutes"
  completed_date: "2026-04-03"
  tasks_completed: 2
  files_created: 6
---

# Phase 3 Plan 2: Agent Shared Infrastructure Summary

**One-liner:** LinkedIn domain blocklist, opossum circuit breaker factory, Anthropic SDK singleton, and manual tool-use loop with prompt caching and LinkedIn filtering for all 4 agents.

## What Was Built

Four shared modules that all agents in Phase 3 will import:

1. **`worker/lib/linkedin-blocklist.ts`** — `isBlockedUrl()` URL checker + `filterBlockedUrls()` regex replacement. Blocks `linkedin.com`, `www.linkedin.com`, `lnkd.in` at code level (AGENT-09). Applied to every tool result before it feeds back to Claude.

2. **`worker/lib/circuit-breaker.ts`** — `createCircuitBreaker()` factory wrapping `opossum`. Configurable timeout, error threshold, and reset timeout with open/halfOpen console logging (AGENT-08).

3. **`worker/lib/claude-client.ts`** — Singleton `Anthropic` instance with `ANTHROPIC_API_KEY` env check at module load. Exports `HAIKU_MODEL = "claude-haiku-4-5-20251001"` constant (D-17, AGENT-05).

4. **`worker/lib/agent-loop.ts`** — `runAgentLoop()` handles all three stop reasons:
   - `end_turn` → extract text, return
   - `tool_use` → call `executeTool()`, filter LinkedIn URLs from result, append `tool_result`, loop
   - `max_tokens` → return partial text if available, throw if no text (Pitfall G)
   - Exceeds `maxSteps` → throws with "exceeded" message (Pitfall C)
   - System prompt wrapped with `cache_control: { type: "ephemeral" }` (AGENT-06)
   - API calls wrapped with `p-retry` (3x exponential backoff, per D-20)

## Tests

- `tests/agents/linkedin-blocklist.test.ts`: 15 tests — all passing
- `tests/agents/agent-loop.test.ts`: 8 tests — all passing
- Total: 23 tests passing

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | ef366f8 | feat(ai): add LinkedIn blocklist, circuit breaker factory, and Claude client |
| Task 2 | aad0f86 | feat(ai): add reusable agent tool-use loop with LinkedIn filtering and prompt caching |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.hoisted required for mock factory references**
- **Found during:** Task 2
- **Issue:** `mockCreate` was declared as a `const` at module level but `vi.mock` factories are hoisted to the top of the file before `const` declarations run. This caused `ReferenceError: Cannot access 'mockCreate' before initialization`.
- **Fix:** Used `vi.hoisted(() => ({ mockCreate: vi.fn() }))` to create `mockCreate` in the hoisting phase, then referenced it in the `vi.mock("../../worker/lib/claude-client")` factory.
- **Files modified:** `tests/agents/agent-loop.test.ts`
- **Commit:** aad0f86

**2. [Rule 2 - Missing] Mock claude-client to prevent env check at test load**
- **Found during:** Task 2
- **Issue:** `worker/lib/claude-client.ts` throws `Error: ANTHROPIC_API_KEY is required` at module load time. Even with `@anthropic-ai/sdk` mocked, `claude-client.ts` still executed its env guard when `agent-loop.ts` imported it.
- **Fix:** Added `vi.mock("../../worker/lib/claude-client", ...)` directly alongside `vi.mock("@anthropic-ai/sdk")` — mock the consuming module, not just the SDK.
- **Files modified:** `tests/agents/agent-loop.test.ts`
- **Commit:** aad0f86

## Known Stubs

None — all 4 modules are fully implemented with no placeholder behavior.

## Self-Check: PASSED

Files created:
- worker/lib/linkedin-blocklist.ts: FOUND
- worker/lib/circuit-breaker.ts: FOUND
- worker/lib/claude-client.ts: FOUND
- worker/lib/agent-loop.ts: FOUND
- tests/agents/linkedin-blocklist.test.ts: FOUND
- tests/agents/agent-loop.test.ts: FOUND

Commits:
- ef366f8: FOUND (feat(ai): add LinkedIn blocklist...)
- aad0f86: FOUND (feat(ai): add reusable agent tool-use loop...)
