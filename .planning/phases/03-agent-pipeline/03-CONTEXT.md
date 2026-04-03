# Phase 3: Agent Pipeline - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement four specialized AI agents (Contact Finder, Email Guesser, Research Agent, Email Drafter), the scoring engine (0-100 response probability), and email template system. Replace the stub agent steps in `worker/orchestrator/pipeline.ts` with real Claude API calls using `@anthropic-ai/sdk`. Add Firecrawl enrichment as a data source for the Research Agent. Output must match the `PipelineResponse` shape the frontend demo expects. No UI changes (Phase 4), no Gmail send (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Data Sources

- **D-01:** Contact Finder uses Claude Haiku 4.5 web search ONLY (L1). No external APIs (Hunter.io, Apollo, ATS APIs) for V1. Claude searches company team pages, engineering blogs, conference talks, Google-indexed LinkedIn profiles, press releases.
- **D-02:** Email Guesser uses Claude Haiku 4.5 pattern detection ONLY. Searches for email patterns on company blogs, job listings, author bios, GitHub commits. Guesses from common patterns (first.last@, firstl@, first@). No Hunter.io for V1.
- **D-03:** Always return 3 contacts, even with sparse data. Flag low-confidence results with appropriate confidence levels (high/medium/low). Never return an error to the user — best-effort with transparency.

### Firecrawl Enrichment (Research Agent)

- **D-04:** Firecrawl scrapes targeted pages only: /about, /careers, /blog, /team, /jobs — max 10 pages per company. Extracts tech stack, recent news, company values, hiring roles.
- **D-05:** Cache enrichment data per company domain in a `company_enrichments` table. 30-day TTL. Reuse cached data for repeat searches targeting the same company.
- **D-06:** If Firecrawl fails or credits exhausted, Research Agent falls back to Claude web search only. Pipeline never fails due to Firecrawl.
- **D-07:** Firecrawl free tier budget: 500 credits/month ~= 50 companies at 10 pages each.

### Scoring Engine

- **D-08:** Response probability score (0-100) with weighted signals:
  - Title/role match: 30%
  - Seniority level: 20%
  - Public activity/approachability: 20%
  - Email confidence: 15%
  - Company hiring signals: 15%
- **D-09:** Full breakdown panel showing each signal's contribution (per SCORE-02). User sees exactly why a contact scored 78 vs 45.
- **D-10:** Tone mapping: 75-100 = direct, 45-74 = curious, 0-44 = value-driven (per SCORE-03).

### Email Templates & Tone

- **D-11:** Voice: genuine curiosity. Casual, direct, shows research was done. No corporate speak, no em dashes, no "I hope this finds you well". 4 sentences max (per EMAIL-03).
- **D-12:** Tone bands vary opening and ask (not entire structure):
  - Direct (75-100): Lead with shared connection/mutual interest, ask for coffee chat
  - Curious (45-74): Lead with research hook, ask open-ended question about their work
  - Value-driven (0-44): Lead with something you can offer/share, suggest low-commitment interaction
- **D-13:** Template types: referral_ask, hiring_inquiry, value_offer (per EMAIL-01). Follow-up templates (EMAIL-02) are scaffolded but populated in V3.

### Pipeline Response Shape

- **D-14:** Agent outputs MUST produce data that maps to the `PipelineResponse` interface the frontend demo expects:
  ```typescript
  interface PipelineResponse {
    company: string;
    role: string;
    pipeline_status: "running" | "complete" | "failed";
    contacts: {
      name: string;
      title: string;
      email: string;
      confidence: number; // 0-1, email guess confidence
      hooks: string[]; // personalization hooks found
    }[];
    steps: {
      id: "contacts" | "emails" | "hooks" | "drafts";
      label: string;
      status: "pending" | "running" | "complete" | "failed";
      detail: string;
    }[];
    drafts: {
      contact_name: string;
      subject: string;
      body: string;
      hook_used: string;
    }[];
  }
  ```
- **D-15:** Each agent writes structured results to the database via Prisma. The pipeline orchestrator assembles the PipelineResponse from DB rows after all agents complete.

### Agent Architecture

- **D-16:** All agents use `@anthropic-ai/sdk` v0.81.0 directly with manual tool-use loops (NOT Agent SDK). Per CLAUDE.md and AGENT-05.
- **D-17:** Haiku 4.5 (`claude-haiku-4-5-20251001`) for all 4 agents. Sonnet 4.6 reserved for V2 prep briefs only.
- **D-18:** Prompt caching enabled on all agent system prompts. Dynamic content (company, role, contact data) in user message turn only, never in system prompt after cache_control breakpoint. Per AGENT-06.
- **D-19:** LinkedIn domain blocklist — agents must never access LinkedIn directly. Only Google-indexed public profile data. Per AGENT-09.

### Carried Forward

- **D-20:** Retry 3x with exponential backoff per agent step, partial results on final failure (Phase 2, D-03)
- **D-21:** 3-minute total pipeline timeout (Phase 2, D-04)
- **D-22:** Supabase Realtime Broadcast for 4 coarse progress stages (Phase 2, D-01/D-02)

### Claude's Discretion

Claude has flexibility on: agent system prompt design, tool definitions for web search, structured output schemas (as long as they map to PipelineResponse), Firecrawl extract vs crawl mode selection, scoring engine implementation details (formula vs ML), circuit breaker library choice (opossum or simpler), database column specifics for company_enrichments table.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context

- `.planning/PROJECT.md` — Full project vision, 4-layer data access architecture, tech stack constraints
- `.planning/REQUIREMENTS.md` — AGENT-01-09, SCORE-01-04, EMAIL-01-05 requirements for this phase
- `.planning/ROADMAP.md` — Phase structure, success criteria, dependencies

### Prior Phase Context

- `.planning/phases/01-foundation/01-CONTEXT.md` — Foundation decisions (D-17 single repo, D-19 Prisma, D-18 pure Tailwind)
- `.planning/phases/02-queue-infrastructure/02-CONTEXT.md` — Queue decisions (D-01 Supabase Realtime, D-03 retry strategy, D-04 timeout)

### Prior Research

- `.planning/research/STACK.md` — Verified tech stack versions (@anthropic-ai/sdk 0.81.0, @mendable/firecrawl-js)
- `.planning/research/PITFALLS.md` — Known pitfalls for Anthropic API, prompt caching patterns
- `.planning/research/ARCHITECTURE.md` — Component boundaries, agent DAG flow

### Firecrawl Docs

- `.planning/phases/01-foundation/enrichment-service.md` — Enrichment service spec with Firecrawl integration code examples
- `.planning/phases/01-foundation/firecrawl-architecture-addendum.md` — Pipeline flow diagram showing enrichment position

### Existing Code (Phase 2 output)

- `worker/orchestrator/pipeline.ts` — Pipeline orchestrator with 4 stub agent steps to replace
- `shared/types/jobs.ts` — PipelineJobData, ProgressStage types
- `worker/lib/supabase.ts` — broadcastProgress function for Realtime updates
- `worker/lib/prisma.ts` — Prisma client for worker process

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `worker/orchestrator/pipeline.ts` — 4 stub agent steps (Contact Finder, Email Guesser, Research Agent, Email Drafter) ready to replace with real Claude API calls
- `worker/lib/supabase.ts` — `broadcastProgress(searchId, stage)` for Realtime updates
- `worker/lib/prisma.ts` — Prisma client configured for worker process
- `shared/types/jobs.ts` — PipelineJobData with searchId, userId, company, role, location
- `lib/queue/pipeline.ts` — pipelineQueue with removeOnComplete configured
- `prisma/schema.prisma` — contacts, searches, outreach tables already defined

### Established Patterns

- BullMQ orchestrator-first pattern (sequential + parallel via Promise.all) — NOT FlowProducer
- Supabase Realtime Broadcast for 4 coarse stages (contacts_found → emails_guessed → research_done → drafts_ready)
- Prisma for all database access (not Supabase client for data queries)
- Vitest for testing with node env globally, jsdom per-file for React

### Integration Points

- Replace stub delays in `worker/orchestrator/pipeline.ts` with real agent calls
- Write contact/email/research/draft results to database via Prisma
- Assemble PipelineResponse from DB rows for the API endpoint
- Firecrawl enrichment runs as part of Research Agent step (not a separate queue job)

</code_context>

<specifics>
## Specific Ideas

- Landing page has been redesigned to Firecrawl-style light mode (#FAFAF8 background, Source Serif 4 headings). Marketing components are Gemini-owned — don't modify.
- The demo card on landing page shows a `PipelineResponse` shape with steps[], contacts[], and drafts[] — agent outputs must map to this
- EMAIL PREVIEW tab on landing page is wired but needs data — Phase 4 will connect it
- Static demo text says "L2 (Apollo/Hunter)" and "Scraped 5 sources" but actual V1 uses Claude-only + Firecrawl. Demo copy is marketing-owned, will be updated separately.
- The landing page shows an aspirational `Korvo` SDK API example — no SDK exists yet, this is future
- `POST /api/waitlist` endpoint is needed by landing page but belongs outside phase scope (Phase 6 or ad-hoc)

</specifics>

<deferred>
## Deferred Ideas

- **Hunter.io email verification** — Deferred to V2 (ENRICH-03: NeverBounce)
- **Apollo.io BYO API key** — Deferred to V2 (ENRICH-01-04)
- **ATS API integration** (Greenhouse, Lever, Workable) — Could be added as L3 data source later
- **Follow-up templates** (followup_1, followup_2) — Scaffolded in EMAIL-02 but populated in V3
- **Waitlist endpoint** — Needed by landing page CTA, not in Phase 3 scope
- **Bull Board monitoring dashboard** — Phase 2 deferred idea, still deferred

</deferred>

---

_Phase: 03-agent-pipeline_
_Context gathered: 2026-04-03_
