---
phase: 03-agent-pipeline
plan: 08
subsystem: orchestrator
tags: [integration, pipeline, assembly, api, bullmq, prisma]

# Dependency graph
requires:
  - phase: 03-agent-pipeline
    provides: findContacts (Plan 04)
    provides: guessEmails (Plan 05)
    provides: researchContacts (Plan 06)
    provides: draftEmails (Plan 07)
    provides: scoring-engine (Plan 03)
provides:
  - runPipeline: Real orchestrator logic replacing all stubs
  - assemblePipelineResponse: DB-to-API mapping for search results
  - GET /api/search/[id]: Endpoint for UI results polling
  - Progress broadcasting: Real-time Supabase updates for all 4 stages
affects:
  [Phase 4, UI]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DAG Orchestration: Contact discovery -> Parallel(Email+Research) -> Scoring -> Drafting"
    - "Heuristic domain derivation: company name to .com domain mapping"
    - "Progressive DB writes: Creating contact rows early to store incremental agent data"
    - "Polled Response pattern: GET endpoint assembles state from Search/Contact/Outreach models"

key-files:
  created:
    - lib/api/pipeline-response.ts
    - app/api/search/[id]/route.ts
    - tests/agents/pipeline-integration.test.ts
    - tests/api/pipeline-response.test.ts
  modified:
    - worker/orchestrator/pipeline.ts

key-decisions:
  - "Early contact creation: Contact rows are created as soon as found to provide IDs for parallel research/guessing"
  - "Confidence override: Email guesser confidence replaces contact finder confidence for higher scoring accuracy"
  - "Simple domain derivation: Low-fidelity name-to-domain mapping used for V1 MVP"
  - "3-minute timeout: Global pipeline safety cap to prevent zombie worker processes"

patterns-established:
  - "Integration testing pattern: Mocking all 4 agents to verify orchestrator flow and DB side-effects"
  - "Numeric confidence mapping: Translating high/medium/low strings to 0.9/0.6/0.3 for frontend bars"

requirements-completed: [AGENT-06, AGENT-09, ORCH-01]

# Metrics
duration: 15min
completed: 2026-04-04
---

# Phase 03 Plan 08: Pipeline Integration Summary

**Wired all four agents and the scoring engine into the BullMQ orchestrator. Replaced all stubs with real agent calls in the correct DAG order. Implemented the API layer for result assembly and polling.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-04-04T01:25:00Z
- **Completed:** 2026-04-04T01:40:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- **Real Orchestrator:** Rewrote `runPipeline` to execute the full contact discovery, parallel research/guessing, and tone-mapped drafting flow.
- **Persistent Storage:** Integrated Prisma throughout the pipeline to write contact and outreach rows as they are generated.
- **PipelineResponse Assembly:** Created a robust mapper that assembles Search, Contact, and Outreach data into the unified D-14 response interface.
- **Results Endpoint:** Implemented `GET /api/search/[id]` with proper error handling and auth-readiness.
- **Verified Stage Progress:** Orchestrator now correctly triggers all 4 progress stages (`contacts_found`, `emails_guessed`, `research_done`, `drafts_ready`) via Supabase broadcasting.
- **12 Passing Integration Tests:** 7 pipeline integration tests + 5 pipeline-response API tests. Verified DAG execution order, DB writes, confidence mapping, email guess confidence override, and API response shapes.

## Files Created/Modified

- `worker/orchestrator/pipeline.ts` — Real pipeline logic
- `lib/api/pipeline-response.ts` — Result assembly logic
- `app/api/search/[id]/route.ts` — Results API endpoint
- `tests/agents/pipeline-integration.test.ts` — Orchestrator integration tests
- `tests/api/pipeline-response.test.ts` — API assembly unit tests

## Decisions Made

- **Parallel Step Optimization:** Email guessing and Research run concurrently to minimize total search latency.
- **Scoring Dependency:** Scoring is deferred until after the parallel step so it can benefit from both technical enrichment and email confidence data.
- **Generic Sign-off:** Sign-offs use a placeholder "Alex" or generic greeting for V1, to be replaced by profile data in Phase 4.

## Next Phase Readiness

- Phase 3 (Agent Pipeline) is now 100% complete.
- The system is ready for Phase 4: UI & Dashboard.
- The frontend can now transition from mock data to polling the real `/api/search/[id]` endpoint.

## Deviations from Plan (03-08 Execution Pass)

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed scoring mock missing from pipeline integration test**

- **Found during:** Task 1 verification
- **Issue:** The `overrides contact finder confidence` test used dynamic import of `extractSignals` after `vi.clearAllMocks()`, causing `mock.calls` to be undefined. Scoring engine was not mocked.
- **Fix:** Added `mockExtractSignals` + `mockScoreContact` to `vi.hoisted()`, added scoring mock, restored implementations in `beforeEach`.
- **Files modified:** tests/agents/pipeline-integration.test.ts
- **Commit:** e61e021

**2. [Rule 1 - Bug] Fixed TypeScript no-explicit-any violations in pipeline.ts and route.ts**

- **Found during:** Commit hook (ESLint)
- **Issue:** Pipeline used `(contacts[i] as any)._score` etc. to attach data to ContactResult. Route used `(err as any)?.code` and had an unused `user` variable.
- **Fix:** Replaced with typed `scores: ScoreResult[]` array tracked by index. Route error check uses type-narrowed `{ code?: string }` cast.
- **Files modified:** worker/orchestrator/pipeline.ts, app/api/search/[id]/route.ts
- **Commit:** c6d7a8d

**3. [Rule 2 - Missing] Added 4 additional test cases to meet plan's minimum of 6**

- **Found during:** Task 1 review
- **Issue:** Original test file had 4 cases; plan required at least 6 pipeline integration + 5 pipeline-response.
- **Fix:** Added 3 more pipeline integration tests (contact row write, update with score/research, outreach creation) plus 1 more pipeline-response test.
- **Files modified:** tests/agents/pipeline-integration.test.ts, tests/api/pipeline-response.test.ts
- **Commits:** e61e021, 9611ae3

## Self-Check: PASSED

- worker/orchestrator/pipeline.ts: VERIFIED (c6d7a8d)
- lib/api/pipeline-response.ts: VERIFIED (c6d7a8d)
- GET /api/search/[id]: VERIFIED (c6d7a8d)
- 12 integration tests passing: VERIFIED (12/12)
- broadcastProgress calls: 4 VERIFIED

---

_Phase: 03-agent-pipeline_
_Completed: 2026-04-03_
