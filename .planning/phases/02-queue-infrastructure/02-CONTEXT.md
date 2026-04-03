# Phase 2: Queue Infrastructure - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Stand up BullMQ + Redis on Railway as the job queue for long-running AI pipeline jobs. Deliver: FlowProducer DAG wiring (Contact Finder → parallel Email Guesser + Research Agent → Email Drafter), per-user rate budgets, two separate queues (pipeline-queue, gmail-send-queue), Redis memory management, and real-time progress communication back to the frontend. No agent implementation (Phase 3), no search UI (Phase 4), no Gmail send logic (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Job Progress Communication
- **D-01:** Supabase Realtime Broadcast for pipeline status updates — worker publishes stage events to a per-search channel, frontend subscribes. Already in stack, no extra infra.
- **D-02:** Coarse 4-stage updates only: `contacts_found` → `emails_guessed` → `research_done` → `drafts_ready`. No per-contact granular updates.

### Failure & Retry Strategy
- **D-03:** Retry 3x with exponential backoff per agent step. If still fails after retries, return partial results (whatever completed successfully). User sees results with gaps marked.
- **D-04:** 3-minute total pipeline timeout. Individual agent timeout ~45s each. On timeout, fail gracefully with partial results.

### Local Development
- **D-05:** Docker Redis via `docker-compose.yml` for local dev. Closest to prod (Railway Redis).
- **D-06:** Worker runs as separate terminal process (`npm run dev:worker`). Mirrors prod where worker is a separate Railway service.

### Rate Limit Enforcement
- **D-07:** Check rate limits in the API route BEFORE adding to BullMQ queue. Instant feedback to user, no wasted queue resources.
- **D-08:** One search at a time per user — block new search while pipeline is running. Show "Search in progress" state.

### Carried Forward from Phase 1
- **D-09:** Single repo with `/worker` directory for BullMQ workers, shared types via `/shared` (Phase 1, D-17)
- **D-10:** Prisma ORM for database access (Phase 1, D-19)

### Firecrawl Enrichment (Phase 3 Scope)
- **D-11:** Firecrawl enrichment service folded into Phase 3 as an L2 data source for the Research Agent. Docs at `.planning/phases/01-foundation/enrichment-service.md` and `.planning/phases/01-foundation/firecrawl-architecture-addendum.md`. Not implemented in Phase 2 — queue infra supports it without changes.

### Claude's Discretion
Claude has flexibility on: BullMQ FlowProducer vs manual job chaining pattern, Redis connection pool sizing, Bull Board dashboard setup details, worker process entry point structure, docker-compose configuration specifics.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Full project vision, tech stack, 4-layer data access architecture, constraints
- `.planning/REQUIREMENTS.md` — ORCH-01 through ORCH-06 requirements for this phase
- `.planning/ROADMAP.md` — Phase structure, success criteria, dependencies

### Phase 1 Context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Foundation decisions (D-17 single repo structure, D-19 Prisma ORM, D-20 env vars)

### Prior Research
- `.planning/research/STACK.md` — Verified tech stack with versions (BullMQ 5.71.1, ioredis 5.10.1)
- `.planning/research/PITFALLS.md` — Pitfalls including Redis noeviction, maxRetriesPerRequest: null
- `.planning/research/ARCHITECTURE.md` — Component boundaries, data flow

### Firecrawl Docs (Phase 3 reference)
- `.planning/phases/01-foundation/enrichment-service.md` — Enrichment service spec with BullMQ job integration example
- `.planning/phases/01-foundation/firecrawl-architecture-addendum.md` — Pipeline flow diagram showing enrichment position

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/limits.ts` — Rate limiting utilities (can extend for per-user search budget checks)
- `lib/guest.ts` — Guest session handling (relevant for guest search rate limiting)
- `shared/` directory — Shared types location established (guest.ts, limits.ts, utils/)
- `worker/` directory — Empty, ready for BullMQ worker code

### Established Patterns
- Prisma ORM for all database access (not Supabase client for data queries)
- `@supabase/ssr` for auth + Supabase Realtime (will use for Broadcast)
- `proxy.ts` for auth guards on page routes
- API routes independently call `supabase.auth.getUser()` for auth

### Integration Points
- API route (e.g., `/api/search`) validates auth + rate limit, then enqueues BullMQ job
- Worker process reads from BullMQ queue, executes agent DAG
- Worker publishes progress via Supabase Realtime Broadcast
- Worker writes results to database via Prisma
- Frontend subscribes to Supabase Realtime channel for live updates

</code_context>

<specifics>
## Specific Ideas

- REDIS_FAMILY=6 on Railway for IPv6 private networking between services
- `removeOnComplete` configured to prevent Redis memory bloat (ORCH-06)
- `maxmemory-policy noeviction` on Redis (ORCH-03)
- `maxRetriesPerRequest: null` on worker ioredis connections (from PITFALLS.md)
- Two queues: `pipeline-queue` (2-minute AI pipeline) and `gmail-send-queue` (time-sensitive sends) (ORCH-05)

</specifics>

<deferred>
## Deferred Ideas

- **Firecrawl enrichment service** — Folded into Phase 3 as Research Agent data source (not Phase 2 scope)
- **Bull Board monitoring dashboard** — Deploy separately on Railway. Can be added as Phase 2.1 or deferred to Phase 6 (Analytics & Monitoring)

</deferred>

---

*Phase: 02-queue-infrastructure*
*Context gathered: 2026-04-03*
