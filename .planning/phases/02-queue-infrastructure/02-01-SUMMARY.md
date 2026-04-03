---
phase: 02-queue-infrastructure
plan: 01
subsystem: queue
tags: [bullmq, ioredis, redis, queue, worker, docker]
dependency_graph:
  requires: []
  provides:
    - shared/types/jobs.ts (PipelineJobData, GmailSendJobData, ProgressStage, ProgressEvent)
    - shared/queues.ts (QUEUE_NAMES constants)
    - lib/queue/redis.ts (Next.js queue ioredis connection)
    - lib/queue/pipeline.ts (pipelineQueue BullMQ Queue instance)
    - worker/lib/redis.ts (worker queueConnection + workerConnection)
    - worker/lib/supabase.ts (supabaseAdmin + broadcastProgress)
    - worker/lib/prisma.ts (prisma re-export for worker)
    - docker-compose.yml (local Redis dev)
  affects:
    - Plan 02-02 (worker orchestrator imports from worker/lib/)
    - Plan 02-03 (API search route imports pipelineQueue from lib/queue/pipeline.ts)
tech_stack:
  added:
    - bullmq@5.73.0
    - ioredis@5.10.1
  patterns:
    - Two separate ioredis connections for BullMQ (queue fail-fast + worker null-retry)
    - QUEUE_NAMES constant shared between Next.js and worker
    - Supabase Realtime Broadcast for pipeline progress events
key_files:
  created:
    - shared/types/jobs.ts
    - shared/queues.ts
    - lib/queue/redis.ts
    - lib/queue/pipeline.ts
    - worker/lib/redis.ts
    - worker/lib/supabase.ts
    - worker/lib/prisma.ts
    - docker-compose.yml
  modified:
    - package.json (added bullmq, ioredis deps; dev:worker, start:worker scripts)
    - .env.example (added REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_FAMILY)
decisions:
  - Two separate ioredis instances required for BullMQ worker vs queue (BRPOP needs null retries)
  - removeOnComplete count:100 and removeOnFail count:500 prevent Redis memory bloat
  - Docker Redis uses noeviction policy to preserve job data under memory pressure
  - REDIS_FAMILY=4 default (IPv4 local), set to 6 for Railway IPv6 private networking
metrics:
  duration: ~8min
  completed_date: "2026-04-03T12:13:24Z"
  tasks_completed: 2
  files_changed: 10
---

# Phase 02 Plan 01: Queue Infrastructure Foundation Summary

BullMQ + ioredis installed and configured with shared types, queue constants, Redis connections for both Next.js and worker sides, Supabase broadcast helper, and docker-compose for local Redis development.

## What Was Built

### Task 1: Dependencies, Shared Types, Queue Constants

- Installed `bullmq@5.73.0` and `ioredis@5.10.1` as production dependencies
- Added `dev:worker` and `start:worker` scripts to `package.json` per D-06 (mirrors Railway service)
- Created `shared/types/jobs.ts` exporting `PipelineJobData`, `GmailSendJobData`, `ProgressStage`, `ProgressEvent`
- Created `shared/queues.ts` exporting `QUEUE_NAMES` constant with `pipeline-queue` and `gmail-send-queue`

### Task 2: Redis Connections, Queue Instances, Worker Libs, docker-compose

- Created `lib/queue/redis.ts`: Next.js-side `queueConnection` (fail-fast: `maxRetriesPerRequest: 3`, `enableOfflineQueue: false`)
- Created `lib/queue/pipeline.ts`: `pipelineQueue` BullMQ Queue with `removeOnComplete: { count: 100 }`, `removeOnFail: { count: 500 }`, 3 retries with exponential backoff
- Created `worker/lib/redis.ts`: Two separate ioredis instances — `queueConnection` (fail-fast) and `workerConnection` (`maxRetriesPerRequest: null`, `enableReadyCheck: false` for BRPOP)
- Created `worker/lib/supabase.ts`: Supabase admin client + `broadcastProgress()` helper for Realtime Broadcast on `search:{searchId}:progress` channel
- Created `worker/lib/prisma.ts`: Re-exports `prisma` from `@/lib/db/prisma` for worker context
- Created `docker-compose.yml`: Redis 7 alpine with `maxmemory-policy noeviction` for local dev
- Updated `.env.example` with `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_FAMILY` vars

## Commits

| Task | Commit  | Message                                                                                 |
| ---- | ------- | --------------------------------------------------------------------------------------- |
| 1    | 520168a | feat(queue): install bullmq/ioredis, add shared types and queue constants               |
| 2    | 040ab15 | feat(queue): create Redis connections, queue instances, worker libs, and docker-compose |

## Deviations from Plan

None — plan executed exactly as written.

Note: `tsx` was already installed as a devDependency (`^4.20.6`) when the plan was written. The install step for `tsx` was skipped; npm install only added `bullmq` and `ioredis`. The existing `queue:dev` script in package.json was preserved and new `dev:worker` and `start:worker` scripts were added alongside it.

## Known Stubs

None — all modules export real implementations. The `broadcastProgress` function in `worker/lib/supabase.ts` creates and immediately removes a Supabase channel per call, which is functional but not optimized for high-frequency updates. Optimization (persistent channel with cleanup on worker shutdown) is deferred to Plan 02-02 when the orchestrator wires it up.

## Self-Check: PASSED

All files verified present on disk. Both commits (520168a, 040ab15) verified in git log.
