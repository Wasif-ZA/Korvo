# Architecture Patterns: Korvo AI Agent Pipeline

**Domain:** AI-agent-powered job outreach SaaS
**Researched:** 2026-04-01
**Overall confidence:** HIGH (Claude Agent SDK docs verified, Redis/BullMQ patterns verified, Gmail API quotas verified)

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BROWSER (Next.js Client)                                               │
│  SearchForm → ResultCard × 3 → PipelineKanban → EmailComposer          │
│  Supabase Realtime subscription (progress channel per search_id)        │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │ HTTP / Server Actions
┌──────────────────────▼──────────────────────────────────────────────────┐
│  NEXT.JS APP ROUTER (Vercel)                                            │
│  /api/search/start  → enqueue BullMQ job, return job_id                │
│  /api/search/[id]   → read search + contacts from Supabase             │
│  /api/gmail/send    → Gmail API send (Pro only)                        │
│  /api/stripe/*      → Checkout, webhooks, portal                       │
│  /api/auth/*        → Supabase Auth / Google OAuth                     │
└──────┬────────────────────────────────────────────────────────────┬─────┘
       │ BullMQ enqueue                                             │ Supabase client
┌──────▼──────────────────────────────────┐    ┌───────────────────▼──────┐
│  BULLMQ + REDIS (Railway)               │    │  SUPABASE (PostgreSQL)   │
│                                         │    │                          │
│  Queues:                                │    │  profiles                │
│  • pipeline-queue (main search jobs)    │    │  searches                │
│  • gmail-send-queue (email sends)       │    │  contacts                │
│  • cleanup-queue (TTL expiry)           │    │  outreach                │
│                                         │    │                          │
│  Job state per search:                  │    │  RLS on all tables       │
│  • WAITING → ACTIVE → COMPLETED/FAILED  │    │  auth.uid() scoping      │
│                                         │    │                          │
│  Rate budgets per user_id               │    │  Realtime channel:       │
│  Circuit breaker state per data source  │    │  search:{id}:progress    │
└──────┬──────────────────────────────────┘    └──────────────────────────┘
       │ worker process spawns agents
┌──────▼──────────────────────────────────────────────────────────────────┐
│  WORKER PROCESS (Railway — long-running Node.js)                        │
│                                                                         │
│  PipelineOrchestrator                                                   │
│    Step 1 ──────────────────────────────────────────────────────────   │
│    ContactFinderAgent (Haiku 4.5 + WebSearch)                           │
│      writes → contacts table (3 rows)                                   │
│      broadcasts → search:{id}:progress (stage: "contacts_found")        │
│                                                                         │
│    Step 2 (parallel Promise.all) ───────────────────────────────────   │
│    EmailGuesserAgent (Haiku 4.5)                                        │
│      reads → contacts.name, contacts.company                            │
│      writes → contacts.email, contacts.email_confidence                 │
│    ResearchAgent (Haiku 4.5)                                            │
│      reads → contacts.linkedin_url, contacts.company                    │
│      writes → contacts.personalization_hook, contacts.research_card     │
│      broadcasts → search:{id}:progress (stage: "research_complete")     │
│                                                                         │
│    Step 3 ─────────────────────────────────────────────────────────── │
│    EmailDrafterAgent (Haiku 4.5)                                        │
│      reads → contacts (all fields), scoring_engine output               │
│      writes → outreach table (3 rows)                                   │
│      broadcasts → search:{id}:progress (stage: "pipeline_complete")     │
└──────┬──────────────────────────────────────────────────────────────────┘
       │ tool calls
┌──────▼──────────────────────────────────────────────────────────────────┐
│  4-LAYER DATA ACCESS (inside Worker)                                    │
│                                                                         │
│  L1 — Claude + Web Search (always, free)                                │
│    Company team pages, GitHub org, Google-indexed profiles               │
│    Tool: WebSearch (built into Claude Agent SDK)                        │
│                                                                         │
│  L2 — Email Pattern Detection (free, no API key required)               │
│    Hunter.io public endpoint, job listing emails, blog authors           │
│    Common pattern inference (first.last@company.com)                    │
│                                                                         │
│  L3 — Structured Public Data / ATS APIs                                 │
│    Greenhouse /jobs API, Lever /postings API, Workable /jobs            │
│    JSON-LD structured data from career pages                            │
│                                                                         │
│  L4 — Third-Party Enrichment (V2+, revenue-gated)                       │
│    Hunter.io verified API, NeverBounce, Apollo.io BYO key               │
│                                                                         │
│  Waterfall: L1 → L2 → L3 → L4 (stop when confidence threshold met)     │
│  Circuit breaker per source (opossum library)                           │
│  Per-user rate budget (Redis counter with TTL)                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  DELIVERABILITY ENGINE (inside Worker, Gmail send path only)            │
│                                                                         │
│  WarmupRampService                                                      │
│    daily_limit = min(5 + (days_since_connect * 2), 20) per Gmail acct  │
│    reads/writes → profiles.warmup_state (Redis-backed counter)         │
│                                                                         │
│  JitterScheduler                                                        │
│    send_at = requested_time + rand(30s, 5min)                           │
│    enqueues delayed BullMQ job with computed send_at                    │
│                                                                         │
│  SenderRotationService (V2+ with multiple accounts)                     │
│    round-robin or health-weighted across connected Gmail accounts        │
│    health score degrades on bounces, improves on opens                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Primary Flow: User Triggers Search

```
1. User submits SearchForm (company + role + location)
   └─ POST /api/search/start
      ├─ create searches row (status: PENDING)
      ├─ enqueue BullMQ job { search_id, user_id, input }
      └─ return { search_id, job_id }

2. Browser subscribes to Supabase Realtime channel: search:{search_id}:progress

3. Worker picks up job
   ├─ ContactFinderAgent runs (30-60s)
   │   ├─ calls L1/L2/L3 data sources in waterfall
   │   ├─ writes 3 contacts rows to Supabase
   │   └─ broadcasts progress event { stage: "contacts_found", contact_count: 3 }
   │
   ├─ EmailGuesserAgent + ResearchAgent run in PARALLEL (Promise.all)
   │   ├─ EmailGuesser: reads contacts, infers emails, writes back confidence
   │   ├─ ResearchAgent: reads contacts, scrapes public profiles, writes research cards
   │   └─ both broadcast individual completion events
   │
   ├─ ScoringEngine calculates 0-100 score per contact
   │   ├─ weighted signals: role seniority, recency of LinkedIn activity, ATS match
   │   ├─ tone mapping: 75-100 = direct, 45-74 = curious, 0-44 = value-driven
   │   └─ writes score + tone back to contacts row
   │
   ├─ EmailDrafterAgent runs (reads all contact data + tone mapping)
   │   ├─ selects template type per tone
   │   ├─ injects personalization_hook into draft
   │   ├─ writes 3 outreach rows to Supabase
   │   └─ broadcasts { stage: "pipeline_complete" }
   │
   └─ Worker writes searches.status = COMPLETED

4. Browser receives progress events via Realtime
   └─ progressively reveals UI: contacts first, then research cards, then emails
      (waterfall reveal, not a spinner-to-reveal)
```

### Email Send Flow (Pro Tier)

```
User clicks "Send via Gmail"
└─ POST /api/gmail/send { outreach_id }
   ├─ check Pro tier (Supabase profiles.tier)
   ├─ check WarmupRampService (daily limit not exceeded)
   ├─ compute jitter delay (JitterScheduler)
   ├─ enqueue delayed job to gmail-send-queue
   └─ return { scheduled_at }

Worker executes gmail-send job at scheduled_at
├─ retrieve user's stored Gmail OAuth refresh token (Supabase, encrypted)
├─ exchange refresh token → access token
├─ construct MIME message + base64url encode
├─ call gmail.users.messages.send
├─ write outreach.sent_at + outreach.gmail_message_id
└─ broadcast status update to pipeline Kanban (contact moves to "Contacted")
```

### Progress Streaming Pattern

Supabase Realtime (WebSocket) carries progress events from worker to browser. Worker writes progress to a dedicated `search_progress` table or uses Supabase Broadcast channel (no DB write needed for ephemeral progress). Browser updates UI progressively as each stage fires.

**Recommended:** Use Supabase Broadcast (not DB insert) for progress events — zero latency, no row overhead.

---

## Component Boundaries

| Component | Responsibility | Reads From | Writes To |
|-----------|---------------|------------|-----------|
| Next.js API Routes | HTTP surface, auth guard, job enqueue, Stripe webhooks | Supabase, request body | Supabase, BullMQ |
| PipelineOrchestrator | Sequence agents, handle step errors, emit progress | BullMQ job payload | Supabase, Broadcast channel |
| ContactFinderAgent | Find 3 people at company matching role | L1/L2/L3 data sources | contacts table |
| EmailGuesserAgent | Infer email address, assign confidence | contacts table (name, company) | contacts.email, contacts.email_confidence |
| ResearchAgent | Generate research card per contact | Public web (via SDK WebSearch) | contacts.research_card, contacts.personalization_hook |
| ScoringEngine | Score 0-100 per contact, map to tone | contacts table | contacts.score, contacts.tone |
| EmailDrafterAgent | Draft cold email using tone + personalization | contacts table (all fields) | outreach table |
| DataAccessLayer | Waterfall fetch with circuit breakers | L1 → L2 → L3 → L4 external APIs | memory (returned to agents) |
| WarmupRampService | Enforce daily send limits per Gmail account | Redis counter | Redis counter, profiles.warmup_state |
| JitterScheduler | Add randomized delay to sends | configured jitter range | BullMQ (delayed job) |
| Gmail Send Worker | Execute Gmail API send | outreach table, profiles.gmail_tokens | gmail API, outreach.sent_at |

---

## Integration Points

### External Services and Their Failure Modes

| Service | Used By | Failure Mode | Mitigation |
|---------|---------|--------------|------------|
| Anthropic API | All 4 agents | Rate limit / outage | BullMQ retry with exponential backoff (3 attempts); show cached on outage |
| Supabase | Next.js, Worker | Connectivity | Connection pooling; retry logic in worker |
| Redis (Railway) | BullMQ, rate budgets | Restart / OOM | Railway persistent volume; BullMQ built-in job recovery |
| Gmail API | Pro send path | Token expiry, 429 | Token auto-refresh on 401; exponential backoff on 429; 250 quota units/user/sec |
| Hunter.io (L2) | EmailGuesserAgent | Rate limit | Circuit breaker (opossum); fallback to pattern inference |
| Greenhouse/Lever (L3) | ContactFinderAgent | API down | Circuit breaker; skip L3, continue waterfall |
| Stripe | Payments | Webhook failure | Webhook signature verification; idempotency keys; retry endpoint |

### Prompt Caching Integration Point

Each agent system prompt is large and static. The Anthropic API supports prompt caching via the `cache_control` header on the system message. All 4 agent system prompts must mark their system blocks with `"type": "ephemeral"` to activate caching. This reduces input token cost by ~90% on repeated invocations of the same agent.

Implementation: set on `ClaudeAgentOptions` system prompt block, not in the user-facing prompt. Cache TTL is 5 minutes (Anthropic default). HIGH confidence — documented in official Anthropic docs.

---

## Build Order

The components have hard dependencies that dictate the only safe build sequence:

### Phase 1 — Foundation (everything else depends on this)
1. Supabase schema: `profiles`, `searches`, `contacts`, `outreach` tables with RLS
2. Google OAuth flow (Supabase Auth) — needed before any search can be attributed to a user
3. Next.js app shell: layout, routing, basic auth guard

**Why first:** No agent can write data without the tables. No pipeline run can be attributed without auth. All subsequent phases write to this foundation.

### Phase 2 — Pipeline Infrastructure (no agents yet, just scaffolding)
4. BullMQ + Redis setup on Railway — queue definitions, worker process bootstrap
5. `/api/search/start` endpoint — creates searches row, enqueues job, returns job_id
6. Supabase Realtime progress channel — browser subscribes, worker broadcasts
7. PipelineOrchestrator skeleton — reads job, runs placeholder steps, marks complete

**Why second:** The agent code needs somewhere to run and something to notify the frontend. Building the scaffolding before agents makes each agent independently testable.

### Phase 3 — Agent Pipeline (core product value)
8. ContactFinderAgent — hardest agent, sets up the pattern for all others
9. L1/L2/L3 DataAccessLayer with waterfall + circuit breakers (opossum)
10. EmailGuesserAgent — depends on contacts rows from Step 8
11. ResearchAgent — parallel with Step 10, both depend on contacts rows
12. ScoringEngine — depends on complete contacts data
13. EmailDrafterAgent — depends on score + tone from Step 12
14. Prompt caching on all 4 system prompts

**Why this order within Phase 3:** ContactFinder must produce data before Guesser/Research can run. Scoring must complete before Drafter can select the right tone. Each agent can be end-to-end tested before the next is built.

### Phase 4 — Auth, Paywalls, Payments
15. Free tier limits (5 searches/month counter in Redis or Supabase)
16. First-search-without-signup flow (anonymous search, prompt to sign up)
17. Stripe Checkout + webhooks + Customer Portal
18. Pro tier unlock gates on API routes

**Why after pipeline:** Limits and payments only matter once the pipeline produces real value. Shipping payments before the core pipeline works is premature.

### Phase 5 — Email Sending + Deliverability
19. Gmail API OAuth (separate from Supabase Google OAuth — different scopes)
20. WarmupRampService + JitterScheduler
21. `gmail-send-queue` worker
22. Auto-move contact to "Contacted" on send

**Why fifth:** Sending email is the output of a working pipeline. Deliverability engine wraps the send path. This is also the highest-risk integration (Gmail OAuth is complex) — building it last prevents it from blocking the core pipeline.

### Phase 6 — Dashboard + Polish
23. Pipeline Kanban (stages, drag/click)
24. Search history sidebar
25. Research card expand view
26. Progressive reveal UX (contacts appear first, then research, then emails)

**Why last:** These are presentation layers over already-working data. They can be iterated on continuously without blocking any pipeline functionality.

---

## Scaling Considerations

| Concern | At Launch (1-100 users) | At 1K MAU | At 10K MAU |
|---------|------------------------|-----------|------------|
| Agent parallelism | Single Railway worker, BullMQ concurrency 5 | Add concurrency (BullMQ supports per-queue) | Multiple worker replicas; Railway autoscale |
| Redis memory | Free tier (512MB, ~30K jobs) | Railway $5/mo plan (1GB) | Redis Cloud or Upstash |
| Supabase | Free tier (500MB, 50K MAU) | Pro ($25/mo, 8GB, 100K MAU) | Pro with read replicas |
| Claude API costs | ~$0.50/user/month with caching | Same (caching covers scale) | Negotiate volume pricing |
| Gmail send queue | Single queue is fine | Separate queue per user for isolation | Sharded queues + multiple workers |
| Circuit breaker state | In-process opossum (per worker restart) | Centralize in Redis (use `opossum-prometheus`) | Distributed circuit breaker state in Redis |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Running Agents Inside Serverless Functions
**What goes wrong:** Next.js API routes on Vercel are serverless — they time out at 10-60 seconds. Agent pipelines take 60-120 seconds per search.
**Instead:** Always enqueue to BullMQ and run agents in the Railway worker process. API route returns a job ID immediately; frontend polls/subscribes for results.

### Anti-Pattern 2: Storing Gmail Refresh Tokens in Plaintext
**What goes wrong:** Tokens in Supabase `profiles` table in plaintext — if DB is compromised, all connected accounts are exposed.
**Instead:** Encrypt refresh tokens at rest using a server-side key (AES-256). Decrypt only in the worker at send time. Never log tokens.

### Anti-Pattern 3: Chaining Agents Synchronously via HTTP Calls
**What goes wrong:** ContactFinder calls EmailGuesser via HTTP which calls Research — tightly coupled, hard to retry, no parallelism.
**Instead:** PipelineOrchestrator manages sequencing in the worker process. Agents are library functions, not services. Step 2 parallel agents use `Promise.all` in one worker, not cross-service calls.

### Anti-Pattern 4: Writing Agent Output Directly to DB from Inside Agent
**What goes wrong:** Agents become coupled to Supabase schema. System prompts contain table names. Refactoring schema requires touching agent prompts.
**Instead:** Agent returns structured JSON to PipelineOrchestrator. Orchestrator owns all Supabase writes. Agents are pure: prompt in → structured data out.

### Anti-Pattern 5: One Monolithic BullMQ Queue for Everything
**What goes wrong:** Gmail send jobs compete with 2-minute AI pipeline jobs. A slow pipeline delays time-sensitive sends.
**Instead:** Separate queues for `pipeline-queue` and `gmail-send-queue`. Workers can consume from both but priorities differ.

---

## Sources

- [Claude Agent SDK Overview — Anthropic Docs](https://platform.claude.com/docs/en/agent-sdk/overview) (HIGH confidence — official docs, verified 2026-04-01)
- [AI Agent Orchestration for Production — Redis Blog](https://redis.io/blog/ai-agent-orchestration/) (HIGH confidence — verified)
- [AI Agent Architecture Patterns — Redis Blog](https://redis.io/blog/ai-agent-architecture-patterns/) (MEDIUM confidence)
- [Integrating BullMQ with Next.js](https://medium.com/@asanka_l/integrating-bullmq-with-nextjs-typescript-f41cca347ef8) (MEDIUM confidence — community verified against BullMQ docs)
- [Using Realtime with Next.js — Supabase Docs](https://supabase.com/docs/guides/realtime/realtime-with-nextjs) (HIGH confidence — official docs)
- [Gmail API Quota Reference — Google Developers](https://developers.google.com/workspace/gmail/api/reference/quota) (HIGH confidence — official docs)
- [Cold Email Infrastructure Technical Guide — PipeCrush](https://www.pipecrush.tech/resources/cold-email-infrastructure-guide) (MEDIUM confidence — practitioner source)
- [Circuit Breaker Pattern Node.js — Opossum](https://github.com/nodeshift/opossum) (HIGH confidence — official library repo)
- [Running Background Jobs Discussion — Vercel/Next.js GitHub](https://github.com/vercel/next.js/discussions/33989) (HIGH confidence — confirms serverless limitation)
