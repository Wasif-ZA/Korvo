# Phase 2: Queue Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 02-queue-infrastructure
**Areas discussed:** Job progress communication, Failure & retry strategy, Local dev experience, Rate limit UX

---

## Pre-Discussion: Firecrawl Docs Triage

User added two new docs (`enrichment-service.md`, `firecrawl-architecture-addendum.md`) describing a Firecrawl-powered Enrichment Service. Analysis determined it maps to Phase 3 (Research Agent data source), not Phase 2 queue infra.

| Option | Description | Selected |
|--------|-------------|----------|
| Fold into Phase 3 | Add Firecrawl as L2 data source for Research Agent | ✓ |
| Add as Phase 3.1 | Separate mini-phase after agents are built | |
| Defer to V2 | Keep 4-layer architecture as-is for V1 | |

**User's choice:** Fold into Phase 3
**Notes:** Queue infrastructure in Phase 2 already supports Firecrawl jobs without changes.

---

## Job Progress Communication

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase Realtime Broadcast | Worker publishes stage events via Supabase Broadcast channel. Already in stack. | ✓ |
| Polling /api/status endpoint | Frontend polls every 2-3s. Simpler but adds API load. | |
| Server-Sent Events (SSE) | Dedicated SSE endpoint. Low latency but Vercel timeout concerns. | |

**User's choice:** Supabase Realtime Broadcast

| Option | Description | Selected |
|--------|-------------|----------|
| Coarse stages | 4 stages: contacts_found → emails_guessed → research_done → drafts_ready | ✓ |
| Per-contact granular | Updates per contact ("Found contact 1/3"). More complex, may feel noisy. | |

**User's choice:** Coarse stages

---

## Failure & Retry Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Retry then partial results | Retry 3x with exponential backoff, return whatever completed on final failure | ✓ |
| Retry then full error | Retry 3x, then fail entire pipeline. User retries manually. | |
| Always partial, no retry | Never retry, return whatever completed. Fastest. | |

**User's choice:** Retry then partial results

| Option | Description | Selected |
|--------|-------------|----------|
| 3 minutes | Generous ceiling, ~45s per agent. Graceful partial results on timeout. | ✓ |
| 5 minutes | Very generous. Handles slow APIs but user waits longer. | |
| 2 minutes | Tight. May timeout on complex searches. | |

**User's choice:** 3 minutes

---

## Local Dev Experience

| Option | Description | Selected |
|--------|-------------|----------|
| Docker Redis | docker-compose.yml with Redis container. Closest to prod. | ✓ |
| In-memory mock queue | BullMQ mock adapter. No Docker but behavior may differ. | |
| Railway dev Redis | Separate Railway instance. Requires internet, costs money. | |

**User's choice:** Docker Redis

| Option | Description | Selected |
|--------|-------------|----------|
| Separate terminal process | npm run dev:worker in second terminal. Mirrors prod. | ✓ |
| Inline with Next.js dev | Worker starts with npm run dev. One command but blurs boundaries. | |

**User's choice:** Separate terminal process

---

## Rate Limit UX

| Option | Description | Selected |
|--------|-------------|----------|
| Block before queuing | Check limit in API route before BullMQ. Instant feedback. | ✓ |
| Queue then reject in worker | Accept job, check in worker, reject if exceeded. Adds latency. | |

**User's choice:** Block before queuing

| Option | Description | Selected |
|--------|-------------|----------|
| One at a time | Block new search while pipeline running. Simpler, prevents abuse. | ✓ |
| Allow 2-3 concurrent | Pro users run multiple searches. More complex queue management. | |

**User's choice:** One at a time

---

## Claude's Discretion

- FlowProducer vs manual job chaining pattern
- Redis connection pool sizing
- Bull Board dashboard setup details
- Worker process entry point structure
- docker-compose configuration specifics

## Deferred Ideas

- Firecrawl enrichment service → Phase 3
- Bull Board monitoring dashboard → Phase 2.1 or Phase 6
