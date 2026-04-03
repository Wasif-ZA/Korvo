# Phase 02: Queue Infrastructure - Research

**Researched:** 2026-04-03
**Domain:** BullMQ + Redis job queue orchestration, Railway deployment, Supabase Realtime, worker process architecture
**Confidence:** HIGH (stack decisions pre-verified in Phase 1 research, versions confirmed against npm registry 2026-04-03)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Supabase Realtime Broadcast for pipeline status updates — worker publishes stage events to a per-search channel, frontend subscribes. Already in stack, no extra infra.
- **D-02:** Coarse 4-stage updates only: `contacts_found` → `emails_guessed` → `research_done` → `drafts_ready`. No per-contact granular updates.
- **D-03:** Retry 3x with exponential backoff per agent step. If still fails after retries, return partial results (whatever completed successfully). User sees results with gaps marked.
- **D-04:** 3-minute total pipeline timeout. Individual agent timeout ~45s each. On timeout, fail gracefully with partial results.
- **D-05:** Docker Redis via `docker-compose.yml` for local dev. Closest to prod (Railway Redis).
- **D-06:** Worker runs as separate terminal process (`npm run dev:worker`). Mirrors prod where worker is a separate Railway service.
- **D-07:** Check rate limits in the API route BEFORE adding to BullMQ queue. Instant feedback to user, no wasted queue resources.
- **D-08:** One search at a time per user — block new search while pipeline is running. Show "Search in progress" state.
- **D-09:** Single repo with `/worker` directory for BullMQ workers, shared types via `/shared` (Phase 1, D-17)
- **D-10:** Prisma ORM for database access (not Supabase client for data queries)
- **D-11:** Firecrawl enrichment deferred to Phase 3. Queue infra supports it without changes.

### Claude's Discretion

Claude has flexibility on: BullMQ FlowProducer vs manual job chaining pattern, Redis connection pool sizing, Bull Board dashboard setup details, worker process entry point structure, docker-compose configuration specifics.

### Deferred Ideas (OUT OF SCOPE)

- **Firecrawl enrichment service** — Phase 3 scope (Research Agent data source)
- **Bull Board monitoring dashboard** — Can be added as Phase 2.1 or deferred to Phase 6
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ORCH-01 | BullMQ v5.71+ with FlowProducer for agent DAG: Contact Finder (parent) → Email Guesser + Research Agent (parallel children) → Email Drafter (grandparent) | FlowProducer API verified, DAG wiring pattern documented below |
| ORCH-02 | BullMQ workers run as separate Railway service (NOT Vercel serverless) | Railway worker service pattern documented, env var config documented |
| ORCH-03 | Redis configured with `maxmemory-policy noeviction` and `maxRetriesPerRequest: null` on worker connections | Both verified from BullMQ official docs, code patterns included |
| ORCH-04 | Per-user rate budgets enforced in Redis | Redis counter pattern with TTL documented; existing Prisma-based limits.ts already enforces monthly limits at route layer |
| ORCH-05 | Two separate BullMQ queues: `pipeline-queue` (2-minute AI pipeline) and `gmail-send-queue` (time-sensitive sends) | Separate Queue instantiation pattern documented |
| ORCH-06 | `removeOnComplete` configured to prevent Redis memory bloat | Config pattern verified from BullMQ docs |
</phase_requirements>

---

## Summary

Phase 2 stands up the BullMQ + Redis scaffolding on Railway as the execution layer for the AI agent pipeline. The work has three distinct areas: (1) the worker process itself — wiring up BullMQ queues, FlowProducer DAG, and the pipeline orchestrator skeleton; (2) the API integration — extending `/api/search` to enqueue jobs and return a job ID; and (3) the progress channel — worker broadcasting coarse stage events via Supabase Realtime Broadcast so the frontend can track pipeline state.

The good news is that the stack is already locked (BullMQ 5.73.0 / ioredis 5.10.1, confirmed on npm registry as of today). The existing `/api/search` route already handles auth and rate limiting (Prisma-based); Phase 2 only adds the BullMQ enqueue call and returns the `searchId` as the job handle. The worker directory is empty and ready for code.

The main risk is configuration correctness: Redis `maxmemory-policy noeviction`, `maxRetriesPerRequest: null` on worker ioredis connections, `REDIS_FAMILY=6` for Railway IPv6 private networking, and `removeOnComplete` on all queues. These are not intuitive defaults — they are all pre-verified pitfalls from Phase 1 research. The FlowProducer DAG topology is also specific: the "grandparent waits for all children" pattern means the Email Drafter is the top-level job, not a leaf.

**Primary recommendation:** Wire a skeleton `PipelineOrchestrator` that runs placeholder agent steps (sleep + log) so the entire DAG plumbing is tested end-to-end before Phase 3 adds real Claude calls. The skeleton validates Railway deployment, queue config, progress broadcasting, and per-user concurrency enforcement before any AI cost is incurred.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| bullmq | 5.73.0 | Job queue and DAG orchestration | De-facto Node.js queue standard; FlowProducer enables parent/child DAG dependencies natively |
| ioredis | 5.10.1 | Redis client for BullMQ | BullMQ's required client; supports REDIS_FAMILY=6 for Railway IPv6 |
| @supabase/supabase-js | 2.101.1 | Realtime Broadcast from worker | Already in stack; Broadcast channel needs only a service-role Supabase client in worker |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @bull-board/api | 6.20.6 | Queue monitoring dashboard API | Deferred to Phase 6 per user decision; deploy separately on Railway |
| @bull-board/express | 6.20.6 | Express adapter for Bull Board | Paired with @bull-board/api when monitoring is needed |
| zod | 4.3.6 | Job payload schema validation | Validate BullMQ job data shapes at enqueue and dequeue boundaries |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| FlowProducer DAG | Manual job chaining (job completion triggers next enqueue) | Manual chaining is simpler to reason about, loses BullMQ's atomic parent/child guarantees and built-in stall detection |
| Supabase Realtime Broadcast | Polling `/api/search/[id]/status` | Polling works but adds latency and request load; Broadcast is already in stack and zero-cost |
| Railway Redis | Upstash Redis | Upstash has per-request pricing which adds up for BullMQ's frequent BRPOP commands; Railway flat-rate Redis is cheaper at expected scale |

**Installation (packages not yet in package.json):**

```bash
npm install bullmq ioredis
```

Note: `@supabase/supabase-js` and `zod` are already installed.

**Version verification (confirmed 2026-04-03):**

```
bullmq    5.73.0   (was 5.71.1 in Phase 1 research — minor version bump, no breaking changes)
ioredis   5.10.1   (unchanged)
```

---

## Architecture Patterns

### Recommended Project Structure

```
worker/
├── index.ts               # Entry point: create workers, register SIGTERM handler
├── pipeline.worker.ts     # Worker consuming pipeline-queue
├── gmail-send.worker.ts   # Worker consuming gmail-send-queue (stub only in Phase 2)
├── orchestrator/
│   └── pipeline.ts        # PipelineOrchestrator: sequences agent steps (skeleton in Phase 2)
└── lib/
    ├── redis.ts            # ioredis connections (worker + queue configs, separate)
    └── supabase.ts         # Supabase service-role client for Broadcast + Prisma writes

shared/
├── types/
│   ├── jobs.ts             # PipelineJobData, GmailSendJobData interfaces
│   └── progress.ts         # ProgressEvent union type (4 stages)
└── queues.ts               # Queue names as constants (imported by both Next.js and worker)
```

### Pattern 1: Two Separate ioredis Connections (REQUIRED)

BullMQ requires different connection configs for Queue instances vs Worker instances. Using the same config for both causes `MaxRetriesPerRequestError` crashes during any Redis blip.

```typescript
// worker/lib/redis.ts
import IORedis from 'ioredis'

// Queue connection: fail fast when Redis is unreachable
export const queueConnection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD,
  family: Number(process.env.REDIS_FAMILY ?? 4), // 6 on Railway (IPv6 private networking)
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,  // fail fast on API calls when Redis is down
})

// Worker connection: MUST have maxRetriesPerRequest: null for BRPOP to work
export const workerConnection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD,
  family: Number(process.env.REDIS_FAMILY ?? 4),
  maxRetriesPerRequest: null,  // REQUIRED for BullMQ workers — do not change
  enableReadyCheck: false,
})
```

### Pattern 2: Queue Definitions with removeOnComplete (REQUIRED)

```typescript
// shared/queues.ts
export const QUEUE_NAMES = {
  PIPELINE: 'pipeline-queue',
  GMAIL_SEND: 'gmail-send-queue',
} as const

// In Next.js API route (enqueue side):
import { Queue } from 'bullmq'
import { queueConnection } from '@/lib/queue/redis'

export const pipelineQueue = new Queue(QUEUE_NAMES.PIPELINE, {
  connection: queueConnection,
  defaultJobOptions: {
    removeOnComplete: { count: 100 },  // keep last 100 for debugging
    removeOnFail: { count: 500 },       // keep failures longer for analysis
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
})
```

### Pattern 3: FlowProducer DAG Topology

The FlowProducer topology is counter-intuitive: the **grandparent** (Email Drafter) is the top-level node. Children are dependencies that must complete first.

```typescript
// Correct topology — Email Drafter waits for both Guesser + Research
// Both Guesser + Research wait for Contact Finder
import { FlowProducer } from 'bullmq'

const flow = new FlowProducer({ connection: queueConnection })

await flow.add({
  name: 'email-drafter',           // runs LAST (parent = runs after all children complete)
  queueName: QUEUE_NAMES.PIPELINE,
  data: { searchId, userId, step: 'email-drafter' },
  children: [
    {
      name: 'email-guesser',
      queueName: QUEUE_NAMES.PIPELINE,
      data: { searchId, userId, step: 'email-guesser' },
      children: [
        {
          name: 'contact-finder',  // runs FIRST (leaf node = no dependencies)
          queueName: QUEUE_NAMES.PIPELINE,
          data: { searchId, userId, step: 'contact-finder' },
        },
      ],
    },
    {
      name: 'research-agent',
      queueName: QUEUE_NAMES.PIPELINE,
      data: { searchId, userId, step: 'research-agent' },
      children: [
        {
          name: 'contact-finder',  // NOTE: BullMQ deduplicates by job name+queue
          queueName: QUEUE_NAMES.PIPELINE,
          data: { searchId, userId, step: 'contact-finder' },
        },
      ],
    },
  ],
})
```

**Important:** BullMQ FlowProducer does NOT automatically deduplicate children by name. If both Email Guesser and Research Agent both list Contact Finder as a child, Contact Finder will run twice. Use a single-parent topology instead: Contact Finder is a child of a parent "orchestrator" job that then fans out.

### Pattern 3b: Recommended Orchestrator-First Topology (Preferred over raw FlowProducer)

Given the deduplication issue above, the cleaner pattern for Phase 2 is a single `pipeline-orchestrator` job that runs in one worker and sequences agents using `Promise.all` for parallel steps:

```typescript
// worker/pipeline.worker.ts
import { Worker } from 'bullmq'
import { runPipeline } from './orchestrator/pipeline'

const worker = new Worker(
  QUEUE_NAMES.PIPELINE,
  async (job) => {
    const { searchId, userId } = job.data
    await runPipeline({ searchId, userId, job })
  },
  {
    connection: workerConnection,
    concurrency: 5,  // 5 concurrent pipeline runs max
  }
)
```

```typescript
// worker/orchestrator/pipeline.ts
export async function runPipeline({ searchId, userId, job }) {
  // Step 1: Contact Finder (sequential, must complete before step 2)
  await job.updateProgress({ stage: 'contacts_found', percent: 25 })
  const contacts = await runContactFinder(searchId)  // Phase 3 impl
  await broadcastProgress(searchId, 'contacts_found')

  // Step 2: Parallel — Email Guesser + Research Agent
  await Promise.all([
    runEmailGuesser(contacts).then(() => broadcastProgress(searchId, 'emails_guessed')),
    runResearchAgent(contacts).then(() => broadcastProgress(searchId, 'research_done')),
  ])

  // Step 3: Email Drafter (waits for both parallel steps)
  const drafts = await runEmailDrafter(contacts)
  await broadcastProgress(searchId, 'drafts_ready')

  // Mark search complete
  await prisma.search.update({ where: { id: searchId }, data: { status: 'completed' } })
}
```

This approach is simpler to test, easier to add timeouts to (D-04: 3-minute total), and avoids FlowProducer deduplication complexity. Claude's discretion applies here — the orchestrator-first pattern is recommended.

### Pattern 4: Supabase Realtime Broadcast from Worker

```typescript
// worker/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Worker uses service role key (bypasses RLS) — correct for writing results
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function broadcastProgress(searchId: string, stage: string) {
  await supabaseAdmin.channel(`search:${searchId}:progress`).send({
    type: 'broadcast',
    event: 'stage',
    payload: { stage, timestamp: new Date().toISOString() },
  })
}
```

### Pattern 5: Graceful Shutdown (REQUIRED for Railway deploys)

```typescript
// worker/index.ts
import { worker } from './pipeline.worker'
import { gmailWorker } from './gmail-send.worker'

process.on('SIGTERM', async () => {
  console.log('SIGTERM received — draining workers')
  await worker.close()        // stops accepting new jobs, finishes active job
  await gmailWorker.close()
  process.exit(0)
})
```

### Pattern 6: In-Progress Concurrency Check (ORCH-04, D-08)

Per D-07, rate limit checks happen in the API route before enqueue. For D-08 (one search at a time per user), check for active jobs before enqueuing:

```typescript
// In /api/search route, after auth + monthly limit check
const activeSearches = await prisma.search.findFirst({
  where: { userId: user.id, status: 'processing' },
})

if (activeSearches) {
  return NextResponse.json({
    limitReached: true,
    limitType: 'concurrent',
    message: 'A search is already in progress',
  })
}
```

This uses Prisma (not Redis) for the concurrency check, consistent with D-10. The worker marks `status = 'processing'` when it starts and `status = 'completed'` or `status = 'failed'` when done.

### Pattern 7: docker-compose.yml for Local Dev (D-05)

```yaml
# docker-compose.yml (project root)
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    command: redis-server --maxmemory-policy noeviction
    volumes:
      - redis_data:/data
volumes:
  redis_data:
```

### Anti-Patterns to Avoid

- **Running BullMQ workers in Next.js API routes:** Vercel serverless functions are killed after request completion. Workers must run on Railway as a long-running process.
- **Using FlowProducer without understanding deduplication:** Contact Finder would run twice if both Email Guesser and Research Agent list it as a child. Use the orchestrator-first pattern instead.
- **Sharing one ioredis connection for Queue and Worker:** Worker connections need `maxRetriesPerRequest: null` for BRPOP; Queue connections should fail fast. Always create two separate connections.
- **Forgetting `removeOnComplete`:** Default BullMQ retains all completed jobs indefinitely. Railway free Redis (25MB) fills in days of production usage.
- **Using the Supabase anon key in the worker:** The worker writes results directly to the database and must bypass RLS. Use the service role key in the worker, never the anon key.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Job queue with retry | Custom queue on top of PostgreSQL | BullMQ | SKIP+DELAY+LIFO+priority+parent/child DAG would take weeks to get right |
| Distributed job deduplication | Redis SET with TTL check | BullMQ jobId deduplication (`jobId` option) | BullMQ's dedup is atomic and handles race conditions |
| Job progress reporting | Custom WebSocket server | Supabase Realtime Broadcast | Already in stack; zero additional infra |
| Graceful worker drain | SIGTERM sleep loop | `worker.close()` | BullMQ's close() waits for active job, then stops BRPOP |
| Per-user job concurrency | Redis INCR/DECR counters | Search.status = 'processing' in Prisma | Already have Prisma; avoids adding Redis primitives for something the DB handles fine |

**Key insight:** BullMQ is doing decades of distributed systems work (at-least-once delivery, stall detection, exponential backoff, parent/child ordering) that would take months to replicate correctly. The only custom code is the job processor function itself.

---

## Runtime State Inventory

Phase 2 is a greenfield infrastructure phase, not a rename/refactor. No runtime state inventory required.

---

## Common Pitfalls

### Pitfall 1: Redis Eviction Policy Not Set — Silent Job Loss

**What goes wrong:** BullMQ jobs vanish mid-pipeline without error. The Contact Finder runs, writes contacts, then the Email Guesser job is evicted before starting.

**Why it happens:** Railway Redis ships with `allkeys-lru` eviction by default. BullMQ documentation states `noeviction` is the ONLY policy that guarantees correct queue behavior.

**How to avoid:** Set `maxmemory-policy noeviction` in the Redis configuration BEFORE writing the first job. In docker-compose, pass `--maxmemory-policy noeviction` as a command flag. On Railway, set this via the Redis plugin configuration or use the `CONFIG SET maxmemory-policy noeviction` command on first startup.

**Warning signs:** Queue depth stays non-zero, workers idle, no error in logs.

### Pitfall 2: Worker Connection Missing `maxRetriesPerRequest: null`

**What goes wrong:** Workers crash with "Connection timeout" on any Redis reconnect. The entire Node process dies.

**Why it happens:** ioredis default `maxRetriesPerRequest: 3` conflicts with BullMQ's BRPOP blocking commands. Workers use long-blocking Redis commands and need unlimited retries.

**How to avoid:** ALWAYS create a separate ioredis instance for workers with `maxRetriesPerRequest: null`. See Pattern 1 above.

**Warning signs:** `MaxRetriesPerRequestError` in logs; workers die silently when Railway restarts Redis.

### Pitfall 3: FlowProducer Runs Contact Finder Twice

**What goes wrong:** If you naively create the FlowProducer DAG with both Email Guesser and Research Agent each listing Contact Finder as a child, BullMQ creates two Contact Finder jobs — one for each parent. Contact Finder runs twice, writing duplicate contacts to the database.

**Why it happens:** BullMQ FlowProducer children are not automatically deduplicated by job name. Each child entry in the tree creates a separate job.

**How to avoid:** Use the orchestrator-first pattern (Pattern 3b) — a single PipelineOrchestrator job that runs Contact Finder, then `Promise.all` for the parallel steps. Simpler and avoids the dedup problem entirely.

**Warning signs:** 6 contacts rows instead of 3 for a search; Contact Finder appears twice in job logs.

### Pitfall 4: Supabase Realtime Broadcast Not Received by Frontend

**What goes wrong:** Worker broadcasts progress events but the browser never receives them. Frontend stays on loading state indefinitely.

**Why it happens:** Supabase Realtime requires the browser to subscribe to the channel BEFORE the worker broadcasts. If the browser subscribes after `contacts_found` fires, it misses that event. Also, the channel name must match exactly (case-sensitive).

**How to avoid:** The browser must subscribe to `search:{searchId}:progress` immediately after receiving the `searchId` from `POST /api/search`. The 4-stage coarse updates (D-02) mean the frontend can recover missed early stages by reading the search status from the database on subscribe.

**Warning signs:** Browser console shows channel subscription success but no events arrive; worker logs show broadcasts firing.

### Pitfall 5: Jobs Marked Stalled During Railway Deploy

**What goes wrong:** Railway restarts the worker process during a deploy. Active BullMQ jobs lose their lock (default lock duration: 30 seconds) and are marked "stalled" — retried after the stall window expires. Users see their search "restart" mid-run.

**How to avoid:** Implement `SIGTERM` handler calling `worker.close()` (Pattern 5). Railway sends SIGTERM before SIGKILL; `worker.close()` waits for the active job to complete (or times out at the configured `closeTimeout`).

**Warning signs:** Job retry logs immediately after deploy; users see partial results then a second run starting.

### Pitfall 6: `REDIS_FAMILY` Not Set on Railway — Connection Refused

**What goes wrong:** Worker cannot connect to Redis on Railway. Railway uses IPv6 private networking between services; connecting via IPv4 (default) fails with "connection refused" or timeout.

**How to avoid:** Set `REDIS_FAMILY=6` in the Railway worker service environment variables. This tells ioredis to use IPv6 for the Redis connection. Locally, this should be `4` (IPv4) or omitted.

**Warning signs:** Worker starts, logs "Connecting to Redis", then times out. No Redis connection errors, just infinite reconnect loops.

### Pitfall 7: `npm run dev:worker` Not in package.json

**What goes wrong:** No script entry to start the worker for local development. Developers run the Next.js dev server but not the worker, leading to jobs that enqueue but never process.

**How to avoid:** Add to `package.json`:
```json
"dev:worker": "ts-node --esm worker/index.ts"
```
or with tsx:
```json
"dev:worker": "tsx watch worker/index.ts"
```
Document clearly in README that two terminal processes are needed for local development.

---

## Code Examples

Verified patterns from prior research (BullMQ docs + Phase 1 PITFALLS.md):

### Queue Instantiation (Next.js side — enqueue only)

```typescript
// lib/queue/pipeline.ts
import { Queue } from 'bullmq'
import IORedis from 'ioredis'

const queueConnection = new IORedis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD,
  family: Number(process.env.REDIS_FAMILY ?? 4),
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
})

export const pipelineQueue = new Queue('pipeline-queue', {
  connection: queueConnection,
  defaultJobOptions: {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
})
```

### Enqueue from `/api/search` Route (extends existing route)

```typescript
// Append to existing /api/search POST handler, after search row creation:

const job = await pipelineQueue.add('pipeline', {
  searchId: search.id,
  userId: user.id,         // or null for guest
  company: parsed.data.company,
  role: parsed.data.role,
  location: parsed.data.location ?? null,
})

return NextResponse.json({
  limitReached: false,
  searchId: search.id,
  jobId: job.id,
})
```

### Worker Entry Point

```typescript
// worker/index.ts
import 'dotenv/config'
import IORedis from 'ioredis'
import { Worker } from 'bullmq'
import { runPipeline } from './orchestrator/pipeline'

const workerConnection = new IORedis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD,
  family: Number(process.env.REDIS_FAMILY ?? 4),
  maxRetriesPerRequest: null,   // REQUIRED
  enableReadyCheck: false,
})

const worker = new Worker(
  'pipeline-queue',
  async (job) => {
    await runPipeline(job)
  },
  {
    connection: workerConnection,
    concurrency: 5,
  }
)

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message)
})

process.on('SIGTERM', async () => {
  await worker.close()
  process.exit(0)
})

console.log('Pipeline worker started')
```

### Pipeline Orchestrator Skeleton (Phase 2 placeholder)

```typescript
// worker/orchestrator/pipeline.ts
import type { Job } from 'bullmq'
import { prisma } from '../lib/prisma'
import { broadcastProgress } from '../lib/supabase'

interface PipelineJobData {
  searchId: string
  userId: string | null
  company: string
  role: string
  location: string | null
}

export async function runPipeline(job: Job<PipelineJobData>) {
  const { searchId, userId } = job.data
  const PIPELINE_TIMEOUT_MS = 3 * 60 * 1000  // D-04: 3-minute total timeout

  await prisma.search.update({
    where: { id: searchId },
    data: { status: 'processing' },
  })

  const timeout = setTimeout(async () => {
    // D-04: fail gracefully with partial results on timeout
    await prisma.search.update({
      where: { id: searchId },
      data: { status: 'failed' },
    })
  }, PIPELINE_TIMEOUT_MS)

  try {
    // Step 1: Contact Finder (Phase 3 will replace this stub)
    console.log(`[${searchId}] Contact Finder running...`)
    await new Promise(r => setTimeout(r, 500))  // stub: simulates 30-60s agent
    await broadcastProgress(searchId, 'contacts_found')
    await job.updateProgress(25)

    // Step 2: Parallel — Email Guesser + Research Agent
    await Promise.all([
      (async () => {
        console.log(`[${searchId}] Email Guesser running...`)
        await new Promise(r => setTimeout(r, 300))  // stub
        await broadcastProgress(searchId, 'emails_guessed')
      })(),
      (async () => {
        console.log(`[${searchId}] Research Agent running...`)
        await new Promise(r => setTimeout(r, 400))  // stub
        await broadcastProgress(searchId, 'research_done')
      })(),
    ])
    await job.updateProgress(75)

    // Step 3: Email Drafter
    console.log(`[${searchId}] Email Drafter running...`)
    await new Promise(r => setTimeout(r, 200))  // stub
    await broadcastProgress(searchId, 'drafts_ready')
    await job.updateProgress(100)

    await prisma.search.update({
      where: { id: searchId },
      data: { status: 'completed' },
    })
  } finally {
    clearTimeout(timeout)
  }
}
```

### Shared Type Definitions

```typescript
// shared/types/jobs.ts
export interface PipelineJobData {
  searchId: string
  userId: string | null
  company: string
  role: string
  location: string | null
}

export type ProgressStage =
  | 'contacts_found'
  | 'emails_guessed'
  | 'research_done'
  | 'drafts_ready'

export interface ProgressEvent {
  stage: ProgressStage
  timestamp: string
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| BullMQ QueueScheduler (separate process) | Built into Worker in BullMQ v2+ | BullMQ v2 (2022) | No separate scheduler process needed |
| `@bull-board/next` for dashboard | `@bull-board/express` on separate service | BullMQ v4+ | Dashboard runs as standalone Express app on Railway |
| `enableReadyCheck: true` on worker connections | `enableReadyCheck: false` | BullMQ v4 docs update | Workers should not check ready on reconnect |
| BullMQ `Queue.getJobCounts()` for monitoring | Bull Board UI | Always | Bull Board gives visual queue depth, failed jobs, retries |

**Current in bullmq 5.73.0 (latest as of 2026-04-03):**
- FlowProducer: stable, same API as 5.71.1
- No breaking changes from 5.71.1 (the version in Phase 1 research)

---

## Open Questions

1. **Worker TypeScript execution on Railway**
   - What we know: The worker directory has `.gitkeep` only; no `tsconfig.json` or build setup in `/worker` yet
   - What's unclear: Whether to use `tsx` (no compile step, recommended for simplicity) or compile to JS first with `tsc` (more predictable for Railway)
   - Recommendation: Use `tsx worker/index.ts` for Phase 2 (simpler). Add `tsx` as a dev dependency. If Railway build step causes issues, switch to a compile-then-run approach.

2. **Prisma access in the worker**
   - What we know: Prisma client is generated to `../generated/prisma` (project root); worker is at `worker/`. The worker needs its own Prisma client import with the DATABASE_URL pointing to the connection pooler.
   - What's unclear: Whether the same prisma.ts from `lib/db/prisma.ts` can be imported by the worker (it can, given single-repo structure).
   - Recommendation: Import `@/lib/db/prisma` from the worker using the existing tsconfig path alias. If the worker has a separate tsconfig, replicate the `@` alias there.

3. **gmail-send-queue worker scope**
   - What we know: ORCH-05 requires the queue to exist and be separate; Phase 5 implements the actual send logic.
   - What's unclear: Whether the Gmail send worker should be a stub job processor in Phase 2 or just the queue definition.
   - Recommendation: Create the queue definition in Phase 2 (Queue instance + `removeOnComplete` config) and a stub worker that logs and completes without doing anything. This validates Railway can run both workers and the configuration is correct before Phase 5.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | Local Redis (D-05) | Yes | 29.2.1 | Use Railway Redis directly with local `.env` pointing to Railway URL |
| Node.js | Worker process | Yes | v22.22.0 | — |
| bullmq | Queue infrastructure | Not installed | 5.73.0 (registry) | Must install: `npm install bullmq` |
| ioredis | BullMQ Redis client | Not installed | 5.10.1 (registry) | Must install: `npm install ioredis` |
| Railway Redis service | Production worker | Not verified locally | — | Provision Railway Redis plugin; use Docker locally |
| REDIS_HOST env var | Worker + Queue connection | Not set | — | Must be set in `.env.local` (Docker: `localhost`), Railway env (private URL) |

**Missing dependencies with no fallback:**
- `bullmq` and `ioredis` are not installed — must be the first step of Wave 0 or Wave 1.

**Missing dependencies with fallback:**
- Railway Redis: Docker Redis locally is a valid fallback for development (D-05 already specifies this).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 (already configured) |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run tests/queue/ --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ORCH-01 | FlowProducer DAG topology — orchestrator sequences steps correctly | unit | `npx vitest run tests/queue/orchestrator.test.ts -x` | No — Wave 0 |
| ORCH-02 | Worker process entry point structure (imports, worker.on handlers) | unit | `npx vitest run tests/queue/worker.test.ts -x` | No — Wave 0 |
| ORCH-03 | ioredis connection configs — workerConnection has `maxRetriesPerRequest: null` | unit | `npx vitest run tests/queue/redis-config.test.ts -x` | No — Wave 0 |
| ORCH-04 | Rate limit check in route before enqueue — concurrent search blocked | unit | `npx vitest run tests/api/search-route.test.ts -x` | Yes (extend) |
| ORCH-05 | Two queues exist with correct names and separate configs | unit | `npx vitest run tests/queue/queues.test.ts -x` | No — Wave 0 |
| ORCH-06 | `removeOnComplete: { count: 100 }` present on queue defaultJobOptions | unit | `npx vitest run tests/queue/queues.test.ts -x` | No — Wave 0 |

**Note:** ORCH-01, ORCH-02, ORCH-03, ORCH-05, ORCH-06 require mocking BullMQ and ioredis (test that the correct config values are passed to constructors). ORCH-04 extends the existing `tests/api/search-route.test.ts` with a new test case for the concurrent search block.

### Sampling Rate

- **Per task commit:** `npx vitest run tests/queue/ tests/api/search-route.test.ts --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/queue/queues.test.ts` — covers ORCH-05, ORCH-06 (queue names, removeOnComplete config)
- [ ] `tests/queue/redis-config.test.ts` — covers ORCH-03 (maxRetriesPerRequest: null on worker connection)
- [ ] `tests/queue/orchestrator.test.ts` — covers ORCH-01 (step sequencing, broadcast calls, Prisma status updates)
- [ ] `tests/queue/worker.test.ts` — covers ORCH-02 (worker process structure, SIGTERM handler)
- [ ] Framework install: `npm install bullmq ioredis` — packages not yet in node_modules

---

## Project Constraints (from CLAUDE.md)

The following directives from CLAUDE.md apply to Phase 2 planning:

| Directive | Impact on Phase 2 |
|-----------|-------------------|
| Tech stack not negotiable: Next.js 16, Supabase, Claude API | Worker uses Supabase SSR client for Realtime; Claude API calls are Phase 3 scope |
| Use `@anthropic-ai/sdk` v0.81.0 directly — NOT Agent SDK | Phase 2 has no Claude calls; applies to Phase 3 orchestrator |
| BullMQ workers on Railway ONLY — not Vercel | Worker must be deployed as Railway service, not a Next.js API route |
| Redis: `maxmemory-policy noeviction` + `maxRetriesPerRequest: null` | Hard requirements; both documented as REQUIRED above |
| Haiku 4.5 for high-volume tasks; Sonnet 4.6 only for deep research | Phase 2 has no Claude calls; configuration is for Phase 3 |
| `@supabase/ssr` for auth + Supabase Realtime | Worker uses `createClient` with service role key (not `@supabase/ssr`, which is for SSR auth flows) |
| Prisma ORM for all DB access (D-10) | Worker imports `lib/db/prisma.ts`; no raw Supabase data queries in worker |
| proxy.ts for auth guards on page routes | Not applicable to worker (no HTTP surface in worker) |
| All services on free tiers initially | Railway free tier: 512MB Redis, shared compute. `removeOnComplete` is critical to stay within 512MB. |
| No LinkedIn scraping (AGENT-09) | Not applicable to Phase 2 queue infra; applies to Phase 3 agent implementation |

---

## Sources

### Primary (HIGH confidence)

- [BullMQ Going to Production](https://docs.bullmq.io/guide/going-to-production) — maxmemory-policy noeviction requirement, worker connection config
- [BullMQ Connections](https://docs.bullmq.io/guide/connections) — maxRetriesPerRequest: null requirement for worker connections
- [BullMQ Flows Documentation](https://docs.bullmq.io/guide/flows) — FlowProducer DAG pattern
- [BullMQ Workers](https://docs.bullmq.io/guide/workers) — Worker instantiation, concurrency, SIGTERM
- npm registry — bullmq 5.73.0 (verified 2026-04-03), ioredis 5.10.1 (verified 2026-04-03)
- `.planning/research/PITFALLS.md` — Pitfalls 1, 2, 3, 19 directly apply to Phase 2
- `.planning/research/STACK.md` — Stack versions, BullMQ FlowProducer pattern
- `.planning/research/ARCHITECTURE.md` — Component diagram, data flow, anti-patterns
- `.planning/phases/02-queue-infrastructure/02-CONTEXT.md` — All locked decisions D-01 through D-11

### Secondary (MEDIUM confidence)

- [Supabase Realtime with Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs) — Broadcast channel subscription pattern
- [Integrating BullMQ with Next.js](https://medium.com/@asanka_l/integrating-bullmq-with-nextjs-typescript-f41cca347ef8) — Community pattern verified against BullMQ docs
- [Railway BullMQ Deploy Template](https://railway.com/deploy/bull-board) — Railway Redis + worker service config pattern

### Tertiary (LOW confidence)

- None — all critical claims verified against official docs or prior research.

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — versions verified on npm registry 2026-04-03; BullMQ 5.73.0 is minor version bump from 5.71.1 with no breaking changes
- Architecture patterns: HIGH — FlowProducer topology verified from BullMQ official docs; orchestrator-first alternative is well-established pattern
- Pitfalls: HIGH — All 7 pitfalls sourced from Phase 1 research (PITFALLS.md) which were themselves verified against official BullMQ docs and npm registry
- Test strategy: HIGH — Vitest 4.1.2 already configured; test structure follows existing test patterns in the codebase

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable libraries; BullMQ minor versions are frequent but non-breaking)
