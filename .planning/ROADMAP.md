# Roadmap: Korvo

## Overview

Korvo is built in six phases that move from infrastructure inward to product outward. Phase 1 lays the non-negotiable foundation — Next.js project, Supabase schema with RLS, Google OAuth, and Stripe — because retrofitting these correctly is painful. Phase 2 stands up the BullMQ + Redis workers on Railway, which must exist before any agent code can run. Phase 3 implements the four specialized agents and the scoring engine that are the core product. Phase 4 wires those agents into a full search UI and Kanban pipeline dashboard. Phase 5 adds the Pro-tier Gmail send capability with deliverability enforcement. Phase 6 closes out with analytics, monitoring, and legal compliance to make the product shippable.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Project setup, database schema, auth, and Stripe — the non-negotiable base everything else depends on (completed 2026-04-01)
- [x] **Phase 2: Queue Infrastructure** - BullMQ + Redis workers on Railway with correct config for long-running AI jobs (completed 2026-04-03)
- [x] **Phase 3: Agent Pipeline** - Four specialized agents, scoring engine, email templates — the core product intelligence (completed 2026-04-04)
- [x] **Phase 4: UI & Dashboard** - Search interface, results display, Kanban pipeline — the user-facing product (completed 2026-04-03)
- [x] **Phase 5: Gmail Send & Deliverability** - Pro-tier Gmail OAuth send with warm-up ramp and auto-tracking (gap closure in progress) (completed 2026-04-04)
- [x] **Phase 6: Analytics, Monitoring & Legal** - PostHog events, Sentry, compliance docs — launch readiness (completed 2026-04-04)
- [x] **Phase 7: Search Flow & Guest Access Fix** - Fix search page API wiring, Realtime channel, guest access — milestone gap closure (completed 2026-04-04)
- [x] **Phase 8: Chat UI Reconnection** - Reconnect conversational UI to all backend infrastructure broken by UX rebuild — guest pipeline, Gmail send, Stripe redirect, legal pages, sidebar usage (completed 2026-04-04)
- [ ] **Phase 9: API Response & Deploy Fixes** - Return scores in API response, fix railway.toml, apply warm light theme

## Phase Details

### Phase 1: Foundation

**Goal**: The project is deployed and secure — users can sign up, the database enforces data isolation, and payments are wired up
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, PAY-01, PAY-02, PAY-03, PAY-04, PAY-05
**Success Criteria** (what must be TRUE):

1. A new visitor can run one search without signing up, then is prompted for Google OAuth after completing it
2. A signed-in user's data is completely invisible to other users (RLS enforced at database level)
3. A user can subscribe to Pro via Stripe Checkout, and the subscription state is reflected immediately in their profile
4. A Pro user can manage or cancel their subscription via the Stripe Customer Portal without contacting support
5. Free tier limits (5 searches/month, 5 drafts/month) are enforced server-side and cannot be bypassed client-side
   **Plans**: 6 plans

Plans:

- [x] 01-01-PLAN.md — Scaffold Next.js 16 project, design system components, Vitest setup
- [x] 01-02-PLAN.md — Prisma schema with all core tables, RLS policies, dual-connection config
- [x] 01-03-PLAN.md — Supabase SSR auth clients, proxy.ts guard, OAuth callback with guest adoption
- [x] 01-04-PLAN.md — Landing page (hero, search bar, how-it-works, pricing), /pricing page
- [x] 01-05-PLAN.md — Stripe Checkout, webhook handler, Customer Portal endpoints
- [x] 01-06-PLAN.md — Rate limiting, auth modals, settings page, auth-aware NavBar, E2E verify

**UI hint**: yes

### Phase 2: Queue Infrastructure

**Goal**: The BullMQ job queue and Redis instance are running on Railway and can receive, process, and complete multi-step AI jobs reliably
**Depends on**: Phase 1
**Requirements**: ORCH-01, ORCH-02, ORCH-03, ORCH-04, ORCH-05, ORCH-06
**Success Criteria** (what must be TRUE):

1. A job submitted to the pipeline queue reaches the Railway worker (not Vercel), executes through the Contact Finder → parallel Email Guesser + Research Agent → Email Drafter DAG, and completes without being killed mid-flight
2. Redis memory does not grow unboundedly after job completion (removeOnComplete configured, noeviction policy set)
3. Per-user rate budgets are enforced — a user cannot exceed their tier's search limit by submitting concurrent jobs
4. The gmail-send-queue is separate from the pipeline-queue and processes independently
   **Plans**: 3 plans

Plans:

- [x] 02-01-PLAN.md — Install BullMQ/ioredis, shared types, queue definitions, Redis connections, docker-compose
- [x] 02-02-PLAN.md — Worker entry point, pipeline orchestrator skeleton, gmail-send stub, worker tests
- [x] 02-03-PLAN.md — API route integration (concurrent check + enqueue), queue config tests

### Phase 3: Agent Pipeline

**Goal**: Given a company + role + location, the system returns 3 contacts with guessed emails, research cards, response probability scores, and ready-to-send cold email drafts
**Depends on**: Phase 2
**Requirements**: AGENT-01, AGENT-02, AGENT-03, AGENT-04, AGENT-05, AGENT-06, AGENT-07, AGENT-08, AGENT-09, SCORE-01, SCORE-02, SCORE-03, SCORE-04, EMAIL-01, EMAIL-02, EMAIL-03
**Success Criteria** (what must be TRUE):

1. Searching "Atlassian, Software Engineer, Sydney" returns 3 contacts with names, titles, guessed emails with confidence level (high/medium/low), and a 0-100 response probability score
2. Each contact has a structured research card (Background / Ask This / Mention This) with personalization hooks drawn from public information
3. Each contact has a draft cold email that matches the tone implied by their score (direct for 75-100, curious for 45-74, value-driven for 0-44) and uses the correct template type
4. All four agents use @anthropic-ai/sdk directly with prompt caching on system prompts — no LinkedIn URLs appear in any agent output
5. If a data source fails (e.g., Hunter.io times out), the pipeline falls back to the next layer and completes without returning an error to the user
   **Plans**: 8 plans

Plans:

- [x] 03-01-PLAN.md — Install packages, Prisma schema updates, shared agent type contracts
- [x] 03-02-PLAN.md — LinkedIn blocklist, circuit breaker, Claude client, agent tool-use loop
- [x] 03-03-PLAN.md — Scoring engine (TDD): weighted signals, tone mapping, score breakdown
- [x] 03-04-PLAN.md — Contact Finder agent: Claude Haiku 4.5 web search, 3 contacts
- [x] 03-05-PLAN.md — Email Guesser agent: pattern detection, confidence levels
- [x] 03-06-PLAN.md — Research Agent + Firecrawl enrichment with caching
- [x] 03-07-PLAN.md — Email Drafter agent: tone-mapped cold emails, template types
- [x] 03-08-PLAN.md — Pipeline integration: wire agents, PipelineResponse assembly, GET endpoint

### Phase 4: UI & Dashboard

**Goal**: Users can search for contacts, see all results in one seamless load, edit and copy draft emails, and manage their outreach pipeline via a Kanban board
**Depends on**: Phase 3
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08, UI-09, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, EMAIL-04, EMAIL-05
**Success Criteria** (what must be TRUE):

1. A user fills in the search form and sees a loading skeleton while the pipeline runs (60-120 seconds), with real-time stage updates (contacts_found → emails_guessed → research_done → drafts_ready)
2. When results load, all three contacts appear with their cards, confidence badges, scores, research cards, and email drafts in one view — no extra clicks required
3. A user can edit the subject and body of a draft email inline, copy it to clipboard, or click a mailto link — all without leaving the results view
4. A user can view their full outreach history in a Kanban board and drag or click to move contacts between pipeline stages (Identified → Contacted → Responded → Chatted → Applied → Interviewing)
5. The UI is warm and approachable (not dev-tool aesthetic), renders correctly on iPhone SE through desktop
   **Plans**: 4 plans

Plans:

- [x] 04-01-PLAN.md — Backend contracts: real IDs in PipelineResponse, regenerate endpoint, reminder endpoint
- [x] 04-02-PLAN.md — ContactCard score badge, research toggle, ScoreBreakdown field fix
- [x] 04-03-PLAN.md — Dashboard optimistic updates, FollowUpReminder wiring, regenerate in SlideOver
- [x] 04-04-PLAN.md — Results page real IDs, empty state copywriting, full visual verification

**UI hint**: yes

### Phase 5: Gmail Send & Deliverability

**Goal**: Pro users can send emails directly from Korvo via their own Gmail account, with warm-up ramp enforcement protecting their sender reputation
**Depends on**: Phase 4
**Requirements**: SEND-01, SEND-02, SEND-03, SEND-04, SEND-05, SEND-06, SEND-07
**Success Criteria** (what must be TRUE):

1. A Free user sees copy-to-clipboard and mailto link options; a Pro user sees a "Send via Gmail" button that triggers a Gmail OAuth flow on first use
2. A Pro user can send a draft email from Korvo; the contact automatically moves to "Contacted" in their pipeline without any manual action
3. The deliverability engine enforces the daily send limit (warm-up ramp: 5 → 10 → 20 per day), and attempting to exceed it displays a clear rate-limit message rather than silently failing
4. Gmail refresh tokens are stored encrypted at rest; when the token limit is reached, the user sees a "Reconnect Gmail" prompt rather than an unexplained error
5. Every email sent via Korvo includes a configurable unsubscribe footer (Australia Spam Act compliance)
   **Plans**: 4 plans

Plans:

- [x] 05-01-PLAN.md — Install googleapis, GmailToken model, token encryption, deliverability library, Wave 0 tests
- [x] 05-02-PLAN.md — Gmail OAuth routes (connect/callback/disconnect/status/send), worker implementation
- [x] 05-03-PLAN.md — EmailDraft send button, Settings Gmail section, daily counter, visual verification
- [x] 05-04-PLAN.md — Gap closure: wire isPro, contactId, onStageMoved into all three EmailDraft call sites

**UI hint**: yes

### Phase 6: Analytics, Monitoring & Legal

**Goal**: The product is observable, errors are caught before users see them, and the legal foundation is in place to ship publicly
**Depends on**: Phase 5
**Requirements**: MON-01, MON-02, MON-03, LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04
**Success Criteria** (what must be TRUE):

1. Key product events (search_completed, email_copied, email_sent, signup, upgrade, pipeline_stage_change) are tracked in PostHog and visible in the dashboard
2. Any unhandled error on an API route or Railway worker triggers a Sentry alert before a user has to report it
3. The app has a published Privacy Policy and Terms of Service accessible from the landing page
4. Agent code contains no LinkedIn direct-access paths; the LinkedIn domain blocklist is enforced and audited
   **Plans**: 3 plans

Plans:

- [x] 06-01-PLAN.md — Install PostHog + Sentry SDKs, initialization files, Wave 0 test stubs
- [x] 06-02-PLAN.md — Privacy Policy, Terms of Service, LinkedIn audit, CI enforcement
- [x] 06-03-PLAN.md — Wire 6 PostHog events, analytics opt-out in Settings

### Phase 7: Search Flow & Guest Access Fix

**Goal**: The search flow works end-to-end (search page calls correct API, Realtime channel matches, results display) and guest users can run their first search without signing up
**Depends on**: Phase 6
**Requirements**: AUTH-01, AUTH-02, UI-01, MON-01, MON-03
**Gap Closure:** Closes gaps from v1.0 milestone audit
**Success Criteria** (what must be TRUE):

1. An authenticated user can enter a company + role on the search page, the pipeline enqueues via POST /api/search, Realtime progress updates display correctly, and results load on the search/[id] page
2. A guest (unauthenticated) visitor can access the search page, run one search, and is prompted with GuestLimitModal after reaching the guest limit
3. The search_completed PostHog event fires when pipeline results load
4. REQUIREMENTS.md traceability shows SCORE-01, SCORE-03, SCORE-04 as Complete
   **Plans**: 2 plans

Plans:

- [x] 07-01-PLAN.md — Fix search/page.tsx: /api/search, Realtime channel key, polling endpoint, router.push, remove /api/user/usage
- [x] 07-02-PLAN.md — proxy.ts guest access, GuestLimitModal wiring, REQUIREMENTS.md traceability cleanup

### Phase 8: Chat UI Reconnection

**Goal**: The conversational UI is fully wired to all existing backend infrastructure — guest searches complete, Gmail send works for Pro users, Stripe post-checkout lands correctly, legal pages are accessible, and sidebar usage displays accurately
**Depends on**: Phase 7
**Requirements**: AUTH-01, AUTH-04, PAY-02, PAY-03, MON-01, MON-03, SEND-02, DASH-02, DASH-03, DASH-05, UI-01, UI-04, LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04
**Gap Closure:** Closes integration gaps from v1.0 milestone audit
**Success Criteria** (what must be TRUE):

1. A guest user can enter a company + role, the pipeline enqueues and completes, and results display in the chat — no infinite spinner
2. A Pro user sees a "Send via Gmail" button in the chat EmailDraft that calls `/api/gmail/send` (not mailto), and the contact auto-moves to Contacted
3. After Stripe checkout, the user lands on a valid page (not 404) and the `upgrade` PostHog event fires
4. The sidebar usage display shows the correct search count from `/api/me` (not always 0/5)
5. `/privacy` and `/terms` pages are accessible and render the full Privacy Policy and Terms of Service
6. Guest search history is adopted after signup via `/api/guest/adopt`
   **Plans**: 4 plans

Plans:

- [x] 08-01-PLAN.md — Backend route fixes: guest enqueue, Stripe redirect, /api/me usage, OAuth callback
- [x] 08-02-PLAN.md — Restore Privacy Policy and Terms of Service pages
- [x] 08-03-PLAN.md — Chat UI wiring: upgrade event, guest adopt, sidebar stats, ContactCard reminders
- [x] 08-04-PLAN.md — Port Gmail send into chat EmailDraft component

**UI hint**: yes

### Phase 9: API Response & Deploy Fixes

**Goal**: The API returns complete data (scores, breakdowns) and the worker can deploy to Railway with correct config
**Depends on**: Phase 3
**Requirements**: SCORE-01, SCORE-02, ORCH-02, FOUND-01
**Gap Closure:** Closes remaining gaps from v1.0 milestone audit
**Success Criteria** (what must be TRUE):

1. GET `/api/search/[id]` returns `score` (0-100) and `scoreBreakdown` per contact in the response JSON
2. `railway.toml` has a correct `startCommand` that matches the actual worker entry point
3. `globals.css` uses the warm light theme (#FAFAF8 background) per UI-SPEC, not the dark theme

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

| Phase                            | Plans Complete | Status         | Completed  |
| -------------------------------- | -------------- | -------------- | ---------- |
| 1. Foundation                    | 8/8            | Complete       | 2026-04-01 |
| 2. Queue Infrastructure          | 3/3            | Complete       | 2026-04-03 |
| 3. Agent Pipeline                | 8/8            | Complete       | 2026-04-03 |
| 4. UI & Dashboard                | 4/4            | Complete       | 2026-04-03 |
| 5. Gmail Send & Deliverability   | 4/4            | Complete       | 2026-04-04 |
| 6. Analytics, Monitoring & Legal | 3/3            | Complete       | 2026-04-04 |
| 7. Search Flow & Guest Access    | 2/2            | Complete       | 2026-04-04 |
| 8. Chat UI Reconnection          | 4/4 | Complete   | 2026-04-04 |
| 9. API Response & Deploy Fixes   | 0/0            | Not Started    |            |
