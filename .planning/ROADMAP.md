# Roadmap: Korvo

## Overview

Korvo is built in six phases that move from infrastructure inward to product outward. Phase 1 lays the non-negotiable foundation — Next.js project, Supabase schema with RLS, Google OAuth, and Stripe — because retrofitting these correctly is painful. Phase 2 stands up the BullMQ + Redis workers on Railway, which must exist before any agent code can run. Phase 3 implements the four specialized agents and the scoring engine that are the core product. Phase 4 wires those agents into a full search UI and Kanban pipeline dashboard. Phase 5 adds the Pro-tier Gmail send capability with deliverability enforcement. Phase 6 closes out with analytics, monitoring, and legal compliance to make the product shippable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Project setup, database schema, auth, and Stripe — the non-negotiable base everything else depends on
- [ ] **Phase 2: Queue Infrastructure** - BullMQ + Redis workers on Railway with correct config for long-running AI jobs
- [ ] **Phase 3: Agent Pipeline** - Four specialized agents, scoring engine, email templates — the core product intelligence
- [ ] **Phase 4: UI & Dashboard** - Search interface, results display, Kanban pipeline — the user-facing product
- [ ] **Phase 5: Gmail Send & Deliverability** - Pro-tier Gmail OAuth send with warm-up ramp and auto-tracking
- [ ] **Phase 6: Analytics, Monitoring & Legal** - PostHog events, Sentry, compliance docs — launch readiness

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
- [ ] 01-05-PLAN.md — Stripe Checkout, webhook handler, Customer Portal endpoints
- [ ] 01-06-PLAN.md — Rate limiting, auth modals, settings page, auth-aware NavBar, E2E verify

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
**Plans**: TBD

### Phase 3: Agent Pipeline
**Goal**: Given a company + role + location, the system returns 3 contacts with guessed emails, research cards, response probability scores, and ready-to-send cold email drafts
**Depends on**: Phase 2
**Requirements**: AGENT-01, AGENT-02, AGENT-03, AGENT-04, AGENT-05, AGENT-06, AGENT-07, AGENT-08, AGENT-09, SCORE-01, SCORE-02, SCORE-03, SCORE-04, EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-04, EMAIL-05
**Success Criteria** (what must be TRUE):
  1. Searching "Atlassian, Software Engineer, Sydney" returns 3 contacts with names, titles, guessed emails with confidence level (high/medium/low), and a 0-100 response probability score
  2. Each contact has a structured research card (Background / Ask This / Mention This) with personalization hooks drawn from public information
  3. Each contact has a draft cold email that matches the tone implied by their score (direct for 75-100, curious for 45-74, value-driven for 0-44) and uses the correct template type
  4. All four agents use @anthropic-ai/sdk directly with prompt caching on system prompts — no LinkedIn URLs appear in any agent output
  5. If a data source fails (e.g., Hunter.io times out), the pipeline falls back to the next layer and completes without returning an error to the user
**Plans**: TBD

### Phase 4: UI & Dashboard
**Goal**: Users can search for contacts, see all results in one seamless load, edit and copy draft emails, and manage their outreach pipeline via a Kanban board
**Depends on**: Phase 3
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08, UI-09, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05
**Success Criteria** (what must be TRUE):
  1. A user fills in the search form and sees a loading skeleton while the pipeline runs (60-120 seconds), with real-time stage updates (contacts_found → emails_guessed → research_done → drafts_ready)
  2. When results load, all three contacts appear with their cards, confidence badges, scores, research cards, and email drafts in one view — no extra clicks required
  3. A user can edit the subject and body of a draft email inline, copy it to clipboard, or click a mailto link — all without leaving the results view
  4. A user can view their full outreach history in a Kanban board and drag or click to move contacts between pipeline stages (Identified → Contacted → Responded → Chatted → Applied → Interviewing)
  5. The UI is warm and approachable (not dev-tool aesthetic), renders correctly on iPhone SE through desktop
**Plans**: TBD
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
**Plans**: TBD

### Phase 6: Analytics, Monitoring & Legal
**Goal**: The product is observable, errors are caught before users see them, and the legal foundation is in place to ship publicly
**Depends on**: Phase 5
**Requirements**: MON-01, MON-02, MON-03, LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04
**Success Criteria** (what must be TRUE):
  1. Key product events (search_completed, email_copied, email_sent, signup, upgrade, pipeline_stage_change) are tracked in PostHog and visible in the dashboard
  2. Any unhandled error on an API route or Railway worker triggers a Sentry alert before a user has to report it
  3. The app has a published Privacy Policy and Terms of Service accessible from the landing page
  4. Agent code contains no LinkedIn direct-access paths; the LinkedIn domain blocklist is enforced and audited
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/6 | In Progress|  |
| 2. Queue Infrastructure | 0/TBD | Not started | - |
| 3. Agent Pipeline | 0/TBD | Not started | - |
| 4. UI & Dashboard | 0/TBD | Not started | - |
| 5. Gmail Send & Deliverability | 0/TBD | Not started | - |
| 6. Analytics, Monitoring & Legal | 0/TBD | Not started | - |
