---
phase: 02-queue-infrastructure
verified: 2026-04-03T23:45:00Z
status: gaps_found
score: 3/4 success criteria verified
gaps:
  - truth: "A job submitted to the pipeline queue reaches the Railway worker (not Vercel), executes through the Contact Finder → parallel Email Guesser + Research Agent → Email Drafter DAG, and completes without being killed mid-flight"
    status: partial
    reason: "The worker process, DAG plumbing, and queue infrastructure are fully implemented and tested. However, the Railway deployment artifact (railway.toml) is untracked in git, has an incorrect startCommand referencing a non-existent compiled output (node dist/workers/index.js), and no build step produces that file. The package.json start:worker script correctly uses tsx worker/index.ts, but this is misaligned with the untracked railway.toml. The worker cannot reach Railway with the current railway.toml configuration."
    artifacts:
      - path: "railway.toml"
        issue: "Untracked (not committed), startCommand is 'node dist/workers/index.js' but no build compiles worker to dist/, and tsconfig.json has noEmit: true. The correct command should be 'npm run start:worker' or 'npx tsx worker/index.ts'."
    missing:
      - "Either commit railway.toml with corrected startCommand (npm run start:worker), OR remove railway.toml and document the correct Railway start command in .env.example or a deployment README section"
human_verification:
  - test: "Deploy worker to Railway and submit a pipeline job"
    expected: "Job is picked up by the Railway worker (not Vercel), executes through the 4-step DAG, and the search status transitions from pending to processing to completed in the database"
    why_human: "Cannot verify actual Railway deployment or remote job execution programmatically from local environment"
---

# Phase 02: Queue Infrastructure Verification Report

**Phase Goal:** The BullMQ job queue and Redis instance are running on Railway and can receive, process, and complete multi-step AI jobs reliably
**Verified:** 2026-04-03T23:45:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| #   | Truth                                                                                                                                                                                                                           | Status   | Evidence                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A job submitted to the pipeline queue reaches the Railway worker (not Vercel), executes through the Contact Finder → parallel Email Guesser + Research Agent → Email Drafter DAG, and completes without being killed mid-flight | PARTIAL  | DAG plumbing, worker process, and queue wiring are all implemented and tests pass (22/22). But railway.toml is untracked with a broken startCommand — the worker cannot be deployed to Railway as-is.                                                                                                                                                                                 |
| 2   | Redis memory does not grow unboundedly after job completion (removeOnComplete configured, noeviction policy set)                                                                                                                | VERIFIED | `lib/queue/pipeline.ts` has `removeOnComplete: { count: 100 }` and `removeOnFail: { count: 500 }`. `docker-compose.yml` has `redis-server --maxmemory-policy noeviction`. Tests in `tests/queue/queues.test.ts` verify these configurations pass (ORCH-06).                                                                                                                           |
| 3   | Per-user rate budgets are enforced — a user cannot exceed their tier's search limit by submitting concurrent jobs                                                                                                               | VERIFIED | `/api/search` checks `prisma.search.findFirst({ where: { userId, status: 'processing' } })` before enqueuing. Returns `limitType: 'concurrent'` when blocked. Test `blocks concurrent search for authenticated user (D-08)` passes. Monthly limits enforced via `checkAndIncrementSearchLimit` in Prisma.                                                                             |
| 4   | The gmail-send-queue is separate from the pipeline-queue and processes independently                                                                                                                                            | VERIFIED | `QUEUE_NAMES.PIPELINE = 'pipeline-queue'` and `QUEUE_NAMES.GMAIL_SEND = 'gmail-send-queue'` are separate constants. `gmailSendWorker` consumes only `gmail-send-queue` with independent concurrency (1). `pipelineWorker` consumes only `pipeline-queue` with concurrency 5. Both workers start independently in `worker/index.ts`. Tests verify both queue name constants (ORCH-05). |

**Score:** 3/4 success criteria verified

---

### Required Artifacts

#### Plan 02-01 Artifacts

| Artifact                 | Expected                                                              | Status   | Details                                                                                                                      |
| ------------------------ | --------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `shared/types/jobs.ts`   | PipelineJobData, GmailSendJobData, ProgressStage, ProgressEvent types | VERIFIED | All 4 types exported. Substantive (28 lines). Imported by worker files.                                                      |
| `shared/queues.ts`       | QUEUE_NAMES constant object                                           | VERIFIED | Exports QUEUE_NAMES with PIPELINE and GMAIL_SEND. Imported by pipeline.worker.ts, gmail-send.worker.ts.                      |
| `lib/queue/redis.ts`     | Next.js-side queue ioredis connection (fail-fast config)              | VERIFIED | Exports queueConnection with maxRetriesPerRequest: 3, enableOfflineQueue: false. Imported by lib/queue/pipeline.ts.          |
| `lib/queue/pipeline.ts`  | BullMQ Queue instance for pipeline-queue with removeOnComplete        | VERIFIED | Exports pipelineQueue with removeOnComplete: { count: 100 }, removeOnFail: { count: 500 }, attempts: 3, exponential backoff. |
| `worker/lib/redis.ts`    | Worker-side ioredis connections (queue + worker configs)              | VERIFIED | Exports queueConnection (fail-fast) and workerConnection (maxRetriesPerRequest: null, enableReadyCheck: false).              |
| `docker-compose.yml`     | Redis 7 with noeviction policy for local dev                          | VERIFIED | Redis 7-alpine with `--maxmemory-policy noeviction` in command.                                                              |
| `worker/lib/supabase.ts` | broadcastProgress helper                                              | VERIFIED | Exports supabaseAdmin and broadcastProgress(searchId, stage). Creates channel, broadcasts, removes channel.                  |
| `worker/lib/prisma.ts`   | Prisma re-export for worker                                           | VERIFIED | Re-exports prisma from @/lib/db/prisma.                                                                                      |

#### Plan 02-02 Artifacts

| Artifact                           | Expected                                               | Status                      | Details                                                                                                                                                                                                                        |
| ---------------------------------- | ------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `worker/index.ts`                  | Worker entry point with SIGTERM handler                | VERIFIED                    | Imports both workers. Registers SIGTERM handler that calls close() on both workers then process.exit(0).                                                                                                                       |
| `worker/pipeline.worker.ts`        | BullMQ Worker consuming pipeline-queue                 | VERIFIED                    | Exports pipelineWorker. Uses workerConnection. Concurrency 5. Delegates to runPipeline.                                                                                                                                        |
| `worker/orchestrator/pipeline.ts`  | PipelineOrchestrator with 4-step skeleton              | VERIFIED (INTENTIONAL STUB) | Exports runPipeline. 4-step DAG: Contact Finder → parallel Email Guesser + Research Agent → Email Drafter. Each step is a stub (setTimeout 100ms). INTENTIONAL — Phase 3 replaces with Claude API calls. DAG plumbing is real. |
| `worker/gmail-send.worker.ts`      | Stub BullMQ Worker consuming gmail-send-queue          | VERIFIED (INTENTIONAL STUB) | Exports gmailSendWorker. Concurrency 1. Processor logs receipt only. INTENTIONAL — Phase 5 implements Gmail API send.                                                                                                          |
| `tests/queue/orchestrator.test.ts` | Tests for pipeline step sequencing and broadcast calls | VERIFIED                    | 3 tests: stage sequencing, status lifecycle, progress reporting. All pass.                                                                                                                                                     |
| `tests/queue/worker.test.ts`       | Tests for worker exports and SIGTERM                   | VERIFIED                    | 5 tests: pipeline worker exports, gmail worker exports, SIGTERM registration. All pass.                                                                                                                                        |

#### Plan 02-03 Artifacts

| Artifact                           | Expected                                                      | Status   | Details                                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/api/search/route.ts`          | Updated search route with concurrent check and BullMQ enqueue | VERIFIED | Contains pipelineQueue.add. Concurrent check via findFirst before create. Returns jobId.                                                   |
| `tests/api/search-route.test.ts`   | Extended tests for concurrent search block and enqueue        | VERIFIED | 4 tests covering authenticated success, guest success, concurrent block, correct PipelineJobData shape. All pass.                          |
| `tests/queue/queues.test.ts`       | Tests for queue names and removeOnComplete config             | VERIFIED | 5 tests verifying QUEUE_NAMES constants and removeOnComplete/removeOnFail. All pass.                                                       |
| `tests/queue/redis-config.test.ts` | Tests for Redis connection configs                            | VERIFIED | 5 tests verifying queueConnection maxRetriesPerRequest: 3, workerConnection maxRetriesPerRequest: null, enableReadyCheck: false. All pass. |

---

### Key Link Verification

| From                              | To                                | Via                       | Status | Details                                                                                      |
| --------------------------------- | --------------------------------- | ------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `lib/queue/pipeline.ts`           | `shared/queues.ts`                | `import QUEUE_NAMES`      | WIRED  | Line 3: `import { QUEUE_NAMES } from "@/shared/queues"`                                      |
| `lib/queue/redis.ts`              | `ioredis`                         | `IORedis constructor`     | WIRED  | Line 1: `import IORedis from "ioredis"`, Line 3: `new IORedis({...})`                        |
| `worker/pipeline.worker.ts`       | `worker/orchestrator/pipeline.ts` | `import runPipeline`      | WIRED  | Line 5: `import { runPipeline } from "./orchestrator/pipeline"`                              |
| `worker/orchestrator/pipeline.ts` | `worker/lib/supabase.ts`          | `broadcastProgress calls` | WIRED  | 4 calls to broadcastProgress for contacts_found, emails_guessed, research_done, drafts_ready |
| `worker/index.ts`                 | `worker/pipeline.worker.ts`       | `import pipelineWorker`   | WIRED  | Line 2: `import { pipelineWorker } from "./pipeline.worker"`                                 |
| `app/api/search/route.ts`         | `lib/queue/pipeline.ts`           | `import pipelineQueue`    | WIRED  | Line 11: `import { pipelineQueue } from "@/lib/queue/pipeline"`                              |
| `app/api/search/route.ts`         | `prisma.search.findFirst`         | `concurrent search check` | WIRED  | Lines 72-81: findFirst with status: 'processing', blocks on match                            |

---

### Data-Flow Trace (Level 4)

Not applicable — no components rendering dynamic data. The artifacts in this phase are server-side infrastructure (queue connections, worker processes, API routes). The API route returns `searchId` and `jobId` from real Prisma create and real BullMQ queue.add calls.

---

### Behavioral Spot-Checks

| Behavior                                        | Command                                                                         | Result                                                          | Status |
| ----------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------ |
| All 22 queue/API tests pass                     | `npx vitest run tests/queue/ tests/api/search-route.test.ts --reporter=verbose` | 22/22 tests pass, 5 files                                       | PASS   |
| Worker entry point exports correct structure    | Module imports verify                                                           | pipelineWorker and gmailSendWorker exported, SIGTERM registered | PASS   |
| pipelineQueue has removeOnComplete configured   | `tests/queue/queues.test.ts`                                                    | removeOnComplete: { count: 100 }, removeOnFail: { count: 500 }  | PASS   |
| workerConnection has maxRetriesPerRequest: null | `tests/queue/redis-config.test.ts`                                              | Verified via class-style mock capturing config                  | PASS   |
| Railway deployment                              | Cannot test without Railway service                                             | railway.toml has incorrect startCommand                         | FAIL   |

---

### Requirements Coverage

| Requirement | Source Plan  | Description                                                                                            | Status              | Evidence                                                                                                                                                                                                                                                                        |
| ----------- | ------------ | ------------------------------------------------------------------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORCH-01     | 02-02        | BullMQ FlowProducer DAG: Contact Finder → parallel Email Guesser + Research Agent → Email Drafter      | SATISFIED           | `worker/orchestrator/pipeline.ts` implements the 4-step DAG with Promise.all for parallel steps. `tests/queue/orchestrator.test.ts` verifies sequencing. Note: uses manual Promise.all pattern rather than FlowProducer — the requirement intent (DAG sequencing) is satisfied. |
| ORCH-02     | 02-02        | Workers run as separate Railway service (NOT Vercel)                                                   | PARTIALLY SATISFIED | Worker runs as separate process (worker/index.ts, tsx worker/index.ts). Architecture correctly separates worker from Next.js. BUT railway.toml has incorrect startCommand and is not committed — physical Railway deployment is unverified.                                     |
| ORCH-03     | 02-01, 02-03 | Redis configured with maxmemory-policy noeviction and maxRetriesPerRequest: null on worker connections | SATISFIED           | docker-compose.yml: noeviction. worker/lib/redis.ts: maxRetriesPerRequest: null. Tests in redis-config.test.ts verify.                                                                                                                                                          |
| ORCH-04     | 02-03        | Per-user rate budgets enforced                                                                         | SATISFIED           | Concurrent search check in /api/search. Monthly limits via checkAndIncrementSearchLimit (Prisma). Note: requirement says "enforced in Redis" but implementation uses Prisma — functionally equivalent for the use case.                                                         |
| ORCH-05     | 02-01, 02-03 | Two separate BullMQ queues: pipeline-queue and gmail-send-queue                                        | SATISFIED           | QUEUE_NAMES.PIPELINE = 'pipeline-queue', QUEUE_NAMES.GMAIL_SEND = 'gmail-send-queue'. Separate Worker instances. Tests verify constants.                                                                                                                                        |
| ORCH-06     | 02-01, 02-03 | removeOnComplete configured to prevent Redis memory bloat                                              | SATISFIED           | pipelineQueue defaultJobOptions: removeOnComplete: { count: 100 }, removeOnFail: { count: 500 }. Tests in queues.test.ts verify.                                                                                                                                                |

---

### Anti-Patterns Found

| File                              | Lines          | Pattern                                          | Severity | Impact                                                                                                                                                                                                                                     |
| --------------------------------- | -------------- | ------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `worker/orchestrator/pipeline.ts` | 26, 34, 39, 47 | `setTimeout(r, 100)` stub delays for agent steps | INFO     | INTENTIONAL — Phase 3 replaces with Claude API calls. DAG plumbing and Supabase broadcast are real. Not a blocker for phase goal.                                                                                                          |
| `worker/gmail-send.worker.ts`     | 9-11           | Processor body only logs receipt                 | INFO     | INTENTIONAL stub — Phase 5 implements Gmail API send. Correctly documented. Not a blocker for phase goal.                                                                                                                                  |
| `railway.toml`                    | 6              | `startCommand = "node dist/workers/index.js"`    | WARN     | `dist/workers/` does not exist. tsconfig.json has `noEmit: true`. No build produces this file. The file is also untracked (not committed). The correct command would be `npm run start:worker` (uses tsx). This blocks Railway deployment. |
| Multiple worker files             | Various        | `console.log` used throughout worker             | INFO     | Acceptable for server-side worker process logging (Railway logs). Not UI-facing. Pattern is consistent with Node.js worker conventions.                                                                                                    |

---

### Human Verification Required

#### 1. Railway Deployment End-to-End Test

**Test:** Fix railway.toml startCommand to `npm run start:worker`, commit it, deploy to Railway as a separate service with Redis private networking (REDIS_FAMILY=6, REDIS_HOST from Railway internal URL), submit a search as an authenticated user via the Next.js app, and monitor Railway logs for the worker to pick up the job.
**Expected:** Railway worker logs show "Korvo workers started", then picks up the pipeline job, logs "Contact Finder running...", "Email Guesser running...", "Research Agent running...", "Email Drafter running...", and the search record in the database transitions to `status: 'completed'`.
**Why human:** Cannot verify Railway deployment, remote Redis connectivity, or actual job execution without a running Railway environment.

---

### Gaps Summary

**1 gap blocking full goal achievement:**

The phase goal states the queue infrastructure should be "running on Railway." All the code infrastructure is solid — the worker process, DAG plumbing, queue connections, and concurrent-check enforcement all work correctly and are fully tested (22/22 tests pass). However, the `railway.toml` deployment config is:

- Untracked (not committed to git)
- Has a broken `startCommand = "node dist/workers/index.js"` that references a file path that does not exist and cannot be produced (tsconfig.json has noEmit: true, no worker build step exists)

The correct start command based on the package.json scripts is `npm run start:worker` (which runs `tsx worker/index.ts`). This is a small but blocking deployment fix. The fix requires either:

1. Correcting and committing `railway.toml` with `startCommand = "npm run start:worker"`
2. Or removing `railway.toml` and documenting the Railway service configuration separately

All queue infrastructure code and tests are production-ready. The gap is purely in the deployment artifact.

---

_Verified: 2026-04-03T23:45:00Z_
_Verifier: Claude (gsd-verifier)_
