---
phase: 03-agent-pipeline
plan: "05"
subsystem: ai
tags: [email-guesser, agent-loop, zod, web-search, confidence-levels]
dependency_graph:
  requires: ["03-01", "03-02"]
  provides:
    ["worker/agents/email-guesser.ts", "guessEmails", "generateFallbackEmail"]
  affects: ["03-06", "03-07", "03-08"]
tech_stack:
  added: []
  patterns:
    [
      "per-contact agent loop",
      "zod validation",
      "JSON extraction with code fence handling",
      "D-03 never-fail fallback",
    ]
key_files:
  created:
    - worker/agents/email-guesser.ts
    - tests/agents/email-guesser.test.ts
  modified: []
decisions:
  - "maxSteps: 3 for email guesser (cost control) vs default 5 in agent-loop"
  - "Domain normalization (lowercase) added to generateFallbackEmail after test caught bug"
  - "Zod safeParse used (not parse) so partial failures return low-confidence rather than throwing"
  - "web_search tool cast via unknown to satisfy Anthropic SDK Tool type while using server-side tool name"
metrics:
  duration_minutes: 8
  completed_date: "2026-04-03"
  tasks_completed: 1
  tasks_total: 1
  files_created: 2
  files_modified: 0
---

# Phase 03 Plan 05: Email Guesser Agent Summary

**One-liner:** Email Guesser using Claude Haiku web search with zod-validated confidence levels (high/medium/low) and D-03 never-fail per-contact fallbacks.

## What Was Built

`worker/agents/email-guesser.ts` implements the second agent in the pipeline. Given contacts from the Contact Finder and a company domain, it searches for each contact's email address and returns an `EmailGuess` with a confidence level.

Key design choices:

- `guessEmails(contacts, companyDomain)` iterates contacts sequentially, calling `runAgentLoop` per contact
- maxSteps set to 3 (vs default 5) to control Haiku API costs
- `extractJsonObject` handles Claude responses wrapped in markdown code fences or with surrounding text
- Zod `safeParse` used so validation failures return low-confidence rather than throwing
- `generateFallbackEmail` produces `first.last@domain` (lowercased) for any failure path
- System prompt includes "Never access linkedin.com" + "Return JSON only"

## Tests

18 tests in `tests/agents/email-guesser.test.ts` covering:

- `guessEmails` with 3 contacts returns 3 results (count invariant)
- High/medium confidence paths from valid agent JSON
- `runAgentLoop` throw → low-confidence fallback
- Invalid JSON response → low-confidence fallback
- `maxSteps: 3` enforced via mock call assertion
- Mixed failures (some contacts fail, others succeed)
- `generateFallbackEmail` full name, single name, uppercase, multi-part name, empty string
- `extractJsonObject` from plain JSON, code fences, surrounded text, and no-JSON (throws)
- `EMAIL_GUESSER_SYSTEM_PROMPT` contains LinkedIn block and JSON-only instructions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Domain not lowercased in generateFallbackEmail**

- **Found during:** Test run (test `lowercases the result` with `TEST.COM`)
- **Issue:** `generateFallbackEmail("ALICE BOB", "TEST.COM")` returned `alice.bob@TEST.COM` instead of `alice.bob@test.com`
- **Fix:** Added `domain.toLowerCase()` assignment in `generateFallbackEmail`
- **Files modified:** `worker/agents/email-guesser.ts`
- **Commit:** Included in task commit

## Known Stubs

None — `guessEmails` wires to real `runAgentLoop` via `worker/lib/agent-loop.ts`. No hardcoded mock data flows to output.

## Self-Check: PASSED

- [x] `worker/agents/email-guesser.ts` exists
- [x] `tests/agents/email-guesser.test.ts` exists
- [x] Commit `9f9c47d` contains both files
- [x] 18/18 tests pass
- [x] `guessEmails` exported
- [x] `generateFallbackEmail` exported
- [x] `EMAIL_GUESSER_SYSTEM_PROMPT` contains "Never access linkedin.com"
- [x] `maxSteps: 3` set in `runAgentLoop` call
- [x] Zod validation present
- [x] Per-contact error catch with low-confidence fallback
