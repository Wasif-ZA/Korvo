---
phase: 02-queue-infrastructure
plan: "02"
subsystem: queue
tags:
  [bullmq, worker, orchestrator, pipeline, redis, supabase-realtime, sigterm]
dependency_graph:
  requires: [02-01]
  provides: [worker-process, pipeline-orchestrator, gmail-send-stub]
  affects: [phase-03-agents]
tech_stack:
  added: []
  patterns:
    - BullMQ Worker with typed job data
    - Pipeline DAG: sequential → parallel → sequential
    - Supabase Realtime broadcast for progress stages
    - SIGTERM graceful drain pattern
    - TDD with vi.mock for external dependencies
key_files:
  created:
    - worker/orchestrator/pipeline.ts
    - worker/pipeline.worker.ts
    - worker/gmail-send.worker.ts
    - worker/index.ts
    - tests/queue/orchestrator.test.ts
    - tests/queue/worker.test.ts
  modified:
    - package.json (added @vitejs/plugin-react dev dependency)
decisions:
  - "Worker mocks require constructor functions (regular function with this), not arrow functions — arrow functions cannot be used as constructors with new"
  - "Mocking @/worker/lib/redis directly (not ioredis) is simpler for worker unit tests — avoids IORedis constructor issues"
  - "Pipeline orchestrator uses setTimeout stubs for agent steps — Phase 3 replaces with real Claude API calls"
metrics:
  duration: "5 minutes"
  completed: "2026-04-03"
  tasks_completed: 2
  files_created: 6
---

# Phase 02 Plan 02: Worker Process and Pipeline Orchestrator Summary

**One-liner:** BullMQ worker process with 4-step pipeline DAG skeleton (Contact Finder → parallel Email Guesser + Research Agent → Email Drafter) that broadcasts Supabase Realtime progress and gracefully shuts down on SIGTERM.

## What Was Built

### worker/orchestrator/pipeline.ts

The `runPipeline` function implements the full 4-step orchestration DAG as stubs:

1. Contact Finder — runs sequentially, broadcasts `contacts_found`, updates job progress to 25%
2. Email Guesser + Research Agent — run in parallel via `Promise.all`, broadcast `emails_guessed` and `research_done`
3. Email Drafter — runs after both parallel steps, broadcasts `drafts_ready`, updates job progress to 100%

Updates Prisma search status: `processing` at start → `completed` on success → `failed` on 3-minute timeout (D-04).

### worker/pipeline.worker.ts

BullMQ `Worker` consuming `pipeline-queue` with `concurrency: 5`. Delegates to `runPipeline`. Logs failed/completed events.

### worker/gmail-send.worker.ts

Stub BullMQ `Worker` consuming `gmail-send-queue` with `concurrency: 1`. Logs receipt and does nothing — Phase 5 implements actual Gmail API send.

### worker/index.ts

Entry point that imports both workers and registers a `SIGTERM` handler. On SIGTERM: calls `close()` on both workers concurrently, then `process.exit(0)`.

### tests/queue/orchestrator.test.ts

3 tests covering:

- Stage sequencing (contacts_found first, emails_guessed + research_done in parallel middle, drafts_ready last)
- Search status lifecycle (processing → completed)
- Job progress reporting (25 → 75 → 100)

### tests/queue/worker.test.ts

5 tests covering:

- pipelineWorker exports and Worker constructor args (queue name + concurrency)
- gmailSendWorker exports and Worker constructor args
- SIGTERM handler registration via process.on spy

## Task Commits

| Task                                  | Commit  | Description                                                        |
| ------------------------------------- | ------- | ------------------------------------------------------------------ |
| Task 1: Pipeline orchestrator + tests | 22faaf3 | feat(queue): pipeline orchestrator skeleton with 4-step sequencing |
| Task 2: Worker files + tests          | 05885d2 | feat(queue): worker entry point, pipeline worker, gmail-send stub  |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing @vitejs/plugin-react dependency**

- **Found during:** Task 1 (RED phase test run)
- **Issue:** vitest.config.ts imports `@vitejs/plugin-react` which was missing from node_modules, causing all vitest runs to fail with `Cannot find module '@vitejs/plugin-react'`
- **Fix:** `npm install --save-dev @vitejs/plugin-react`
- **Files modified:** package.json, package-lock.json
- **Commit:** 22faaf3

**2. [Rule 1 - Bug] BullMQ Worker mock could not be used as constructor**

- **Found during:** Task 2 (first test run attempt)
- **Issue:** The test used `vi.fn().mockImplementation(() => ({...}))` for the Worker class — arrow functions cannot be called as constructors with `new`, causing `TypeError: X is not a constructor`
- **Fix:** Rewrote mock using a regular function with `this` binding and a static `calls` array to track constructor arguments
- **Files modified:** tests/queue/worker.test.ts
- **Commit:** 05885d2

**3. [Rule 1 - Bug] ioredis mock in tests caused constructor errors**

- **Found during:** Task 2 (initial test approach)
- **Issue:** Attempting to mock ioredis directly in tests also triggered constructor errors since the Redis client uses `new IORedis()`
- **Fix:** Mocked `@/worker/lib/redis` module directly (returning plain objects for `queueConnection` and `workerConnection`) instead of mocking ioredis — cleaner and avoids constructor concerns entirely
- **Files modified:** tests/queue/worker.test.ts
- **Commit:** 05885d2

## Known Stubs

| File                            | Stub                                                                | Reason                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| worker/orchestrator/pipeline.ts | `await new Promise<void>((r) => setTimeout(r, 100))` per agent step | Phase 3 replaces with real Claude API calls (Contact Finder, Email Guesser, Research Agent, Email Drafter) |
| worker/gmail-send.worker.ts     | Processor only logs receipt                                         | Phase 5 implements actual Gmail API OAuth send                                                             |

These stubs are intentional — this plan validates DAG plumbing end-to-end. Real agent logic arrives in Phase 3.

## Verification

All queue tests pass:

- tests/queue/orchestrator.test.ts: 3/3 tests pass
- tests/queue/worker.test.ts: 5/5 tests pass
- Total: 8/8 tests pass

## Self-Check: PASSED

All created files exist and commits are present in git history.
