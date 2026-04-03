---
phase: 02-queue-infrastructure
plan: 03
subsystem: api
tags: [bullmq, ioredis, redis, prisma, vitest, queue, concurrency]

requires:
  - phase: 02-01
    provides: pipelineQueue, queueConnection, workerConnection, QUEUE_NAMES, PipelineJobData

provides:
  - /api/search route with per-user concurrent search enforcement (D-08)
  - BullMQ pipeline job enqueue from /api/search (ORCH-04)
  - tests/api/search-route.test.ts covering concurrent block and enqueue paths
  - tests/queue/queues.test.ts verifying QUEUE_NAMES and removeOnComplete/removeOnFail (ORCH-05, ORCH-06)
  - tests/queue/redis-config.test.ts verifying Redis connection configs (ORCH-03)

affects:
  - 02-04 (worker subscribes to same pipelineQueue now being enqueued)
  - Any phase that checks search concurrency or rate limit behavior

tech-stack:
  added: []
  patterns:
    - "Prisma findFirst before create to enforce one-active-search-per-user (D-08)"
    - "pipelineQueue.add() called after search row created, returns jobId to client"
    - "Class-based vi.mock for ioredis and BullMQ Queue in vitest (function mock not sufficient for new keyword)"

key-files:
  created:
    - tests/api/search-route.test.ts
    - tests/queue/queues.test.ts
    - tests/queue/redis-config.test.ts
  modified:
    - app/api/search/route.ts

key-decisions:
  - "Guest path does not enqueue pipeline jobs in Phase 2 — Phase 4 handles guest search queueing when search UI is built"
  - "Concurrent check placed AFTER monthly limit check but BEFORE search row creation — prevents phantom rows for blocked requests"
  - "vitest class mock pattern required for ioredis and BullMQ Queue (vi.fn().mockImplementation(function(this,...){}) with Object.assign)"

patterns-established:
  - "Pattern: concurrent active search check — prisma.search.findFirst({ where: { userId, status: 'processing' } })"
  - "Pattern: enqueue returns job.id — client receives both searchId and jobId for polling/tracking"

requirements-completed: [ORCH-04, ORCH-05, ORCH-06]

duration: 18min
completed: 2026-04-03
---

# Phase 02 Plan 03: Search Route BullMQ Integration and Queue Config Tests Summary

**Per-user concurrent search enforcement (D-08) wired to /api/search, pipeline jobs enqueued to BullMQ (ORCH-04), and comprehensive tests verifying queue names, retention config, and Redis connection settings (ORCH-03, ORCH-05, ORCH-06)**

## Performance

- **Duration:** 18 min
- **Started:** 2026-04-03T23:20:00Z
- **Completed:** 2026-04-03T23:38:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Updated /api/search to check for an active search (status: 'processing') before creating a new one, returning `limitType: 'concurrent'` when blocked
- Wired `pipelineQueue.add('pipeline', ...)` after search row creation, returning `jobId` alongside `searchId` to authenticated callers
- Added 4 tests covering: authenticated success with jobId, guest success without enqueue, concurrent block, and correct PipelineJobData shape
- Created queue config tests verifying QUEUE_NAMES.PIPELINE and QUEUE_NAMES.GMAIL_SEND constants (ORCH-05)
- Created queue config tests verifying `removeOnComplete: { count: 100 }` and `removeOnFail: { count: 500 }` (ORCH-06)
- Created Redis config tests verifying `maxRetriesPerRequest: null` and `enableReadyCheck: false` on worker connection (ORCH-03)
- Full test suite: 78 tests passing, 0 regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add concurrent check and BullMQ enqueue to /api/search** - `15bb789` (feat)
2. **Task 2: Create queue configuration and Redis connection tests** - `7da1fec` (test)

## Files Created/Modified

- `app/api/search/route.ts` - Added Prisma concurrent check, pipelineQueue.add, jobId in response, guestSessionId field in schema
- `tests/api/search-route.test.ts` - 4 test cases: authenticated success, guest success, concurrent block, correct enqueue data
- `tests/queue/queues.test.ts` - QUEUE_NAMES constants and pipeline queue defaultJobOptions verification
- `tests/queue/redis-config.test.ts` - Next.js queueConnection and worker workerConnection config verification

## Decisions Made

- Guest path intentionally does NOT enqueue to BullMQ in Phase 2 — guest searches get queued in Phase 4 when search UI is built. Only creates Prisma row.
- Concurrent check is placed after monthly limit check (AFTER `checkAndIncrementSearchLimit`) but BEFORE `prisma.search.create` to avoid creating phantom search rows for blocked requests.
- vitest class mock pattern needed: `vi.fn().mockImplementation(function(this, config) { Object.assign(this, config) })` — a plain function mock doesn't work with `new IORedis(...)` syntax.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vitest mock type mismatch for ioredis and BullMQ Queue**

- **Found during:** Task 2 (queue config tests)
- **Issue:** Plan's mock pattern `vi.fn().mockImplementation((config) => config)` cannot be used with `new IORedis(...)` — arrow function is not a constructor. Same issue with BullMQ `Queue`.
- **Fix:** Used class-style `vi.fn().mockImplementation(function(this, ...) { ... })` pattern which works with `new` keyword.
- **Files modified:** tests/queue/queues.test.ts, tests/queue/redis-config.test.ts
- **Verification:** All 10 queue/redis tests pass after fix
- **Committed in:** a098c5d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug in mock pattern)
**Impact on plan:** Essential fix for tests to function at all. No scope creep.

## Issues Encountered

- Worktree has separate vitest.config.ts without `@vitejs/plugin-react` — correctly uses node environment, no issue in practice.
- commitlint enforces `scope-enum` and `body-max-line-length: 100` — adjusted commit messages to comply.

## Known Stubs

None — no stub data, all logic is wired to real Prisma and real BullMQ queue (mocked in tests only).

## Next Phase Readiness

- Search route now enqueues pipeline jobs — Phase 2 Plan 04 (worker) can subscribe to `pipeline-queue` and process them
- All ORCH-03, ORCH-04, ORCH-05, ORCH-06 requirements verified by tests
- Worker connection config validated — safe to run BullMQ workers in Railway

---

_Phase: 02-queue-infrastructure_
_Completed: 2026-04-03_
