# Requirements: Korvo

**Defined:** 2026-04-01
**Core Value:** Enter a company name. Get 3 contacts with personalized cold emails ready to send. Land interviews.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

<<<<<<< HEAD
- [x] **FOUND-01**: Next.js 16 project with App Router, TailwindCSS 4, TypeScript
- [ ] **FOUND-02**: Supabase project with PostgreSQL database and RLS enabled on all tables
- [ ] **FOUND-03**: Database schema: profiles, searches, contacts, outreach tables with all fields and constraints
- [ ] **FOUND-04**: Row Level Security policies: all tables scoped via `auth.uid() = user_id`, plan gating via profiles table (never JWT user_metadata)
- [ ] **FOUND-05**: Supabase connection pooler configured (port 6543, not direct connection)
=======
- [ ] **FOUND-01**: Next.js 16 project with App Router, TailwindCSS 4, TypeScript
- [x] **FOUND-02**: Supabase project with PostgreSQL database and RLS enabled on all tables
- [x] **FOUND-03**: Database schema: profiles, searches, contacts, outreach tables with all fields and constraints
- [x] **FOUND-04**: Row Level Security policies: all tables scoped via `auth.uid() = user_id`, plan gating via profiles table (never JWT user_metadata)
- [x] **FOUND-05**: Supabase connection pooler configured (port 6543, not direct connection)
>>>>>>> worktree-agent-a3fbb471

### Authentication

- [x] **AUTH-01**: First search is free without signup (session-scoped guest search)
- [x] **AUTH-02**: Google OAuth signup via Supabase Auth prompted after first search
- [x] **AUTH-03**: User session persists across browser refresh via Supabase SSR (`@supabase/ssr`)
- [x] **AUTH-04**: Auth middleware on all API routes checking session validity
- [ ] **AUTH-05**: Free tier: 5 searches/month, 5 email drafts/month enforced server-side

### Agent Pipeline

- [ ] **AGENT-01**: Contact Finder agent — finds 3 relevant people at target company via Claude Haiku 4.5 + web search tool, returns structured JSON
- [ ] **AGENT-02**: Email Guesser agent — detects company email pattern (Hunter.io public, job listings, blog bios), guesses addresses with confidence level (high/medium/low)
- [ ] **AGENT-03**: Research Agent — finds personalization hooks per contact, outputs structured research card: Background, Ask This, Mention This
- [ ] **AGENT-04**: Email Drafter agent — drafts 4-sentence cold email using tone mapping from scoring engine, uses correct template type
- [ ] **AGENT-05**: All agents use `@anthropic-ai/sdk` v0.81.0 directly with manual tool-use loops (NOT Agent SDK)
- [ ] **AGENT-06**: Prompt caching enabled on all agent system prompts (dynamic content in user message turn only, never in system prompt after cache_control breakpoint)
- [ ] **AGENT-07**: 4-layer data access waterfall: L1 (Claude web search) → L2 (email pattern detection) → L3 (ATS APIs: Greenhouse, Lever, Workable) → L4 (third-party enrichment, V2)
- [ ] **AGENT-08**: Circuit breakers per data source (opossum library) with fallback to next layer
- [ ] **AGENT-09**: LinkedIn domain blocklist — agents must never access LinkedIn directly, only Google-indexed public profile data

### Orchestration

- [ ] **ORCH-01**: BullMQ v5.71+ with FlowProducer for agent DAG: Contact Finder (parent) → Email Guesser + Research Agent (parallel children) → Email Drafter (grandparent)
- [ ] **ORCH-02**: BullMQ workers run as separate Railway service (NOT Vercel serverless — Vercel kills after request completion)
- [ ] **ORCH-03**: Redis configured with `maxmemory-policy noeviction` and `maxRetriesPerRequest: null` on worker connections
- [ ] **ORCH-04**: Per-user rate budgets enforced in Redis
- [ ] **ORCH-05**: Two separate BullMQ queues: `pipeline-queue` (2-minute AI pipeline) and `gmail-send-queue` (time-sensitive sends)
- [ ] **ORCH-06**: `removeOnComplete` configured to prevent Redis memory bloat

### Scoring Engine

- [ ] **SCORE-01**: Response probability scoring (0-100) per contact with weighted signals (title match, seniority, recency, public activity, email confidence)
- [ ] **SCORE-02**: Explainable score breakdown panel showing each signal's contribution
- [ ] **SCORE-03**: Tone mapping from score: 75-100 = direct, 45-74 = curious, 0-44 = value-driven
- [ ] **SCORE-04**: Tone drives email template selection and drafter prompt variation

### Email Templates

- [ ] **EMAIL-01**: Template types: referral_ask, hiring_inquiry, value_offer
- [ ] **EMAIL-02**: Follow-up templates: followup_1 (3 days), followup_2 (7 days)
- [ ] **EMAIL-03**: All emails max 4 sentences, casual/direct tone, no em dashes, no corporate speak
- [ ] **EMAIL-04**: Editable subject line + body before send
- [ ] **EMAIL-05**: Regenerate button with different tone/template option

### UI — Search & Results

- [ ] **UI-01**: Landing page with search bar (company + role + location), hero section, how-it-works, pricing
- [ ] **UI-02**: One-click seamless flow: search → all results (contacts + research cards + email drafts) load together, no extra clicks
- [ ] **UI-03**: Contact cards: name, title, email + ConfidenceBadge (green/yellow/red), score (0-100), personalization hook, source URL
- [ ] **UI-04**: Research card per contact: Background | Ask This | Mention This (structured, not paragraph)
- [ ] **UI-05**: Email draft inline/modal: editable subject + body, copy button with animation, mailto link, regenerate, "Mark as Sent"
- [ ] **UI-06**: Loading skeleton during search (pipeline takes 60-120 seconds)
- [ ] **UI-07**: Real-time progress updates via Supabase Broadcast (stage: contacts_found, emails_guessed, research_done, drafts_ready)
- [ ] **UI-08**: Warm, friendly, approachable design (Notion/Teal aesthetic, not dev-tool)
- [ ] **UI-09**: Mobile-responsive, tested iPhone SE through desktop

### UI — Dashboard & Pipeline

- [ ] **DASH-01**: Pipeline Kanban board: Identified → Contacted → Responded → Chatted → Applied → Interviewing
- [ ] **DASH-02**: Drag or click to move contacts between stages
- [ ] **DASH-03**: Expand contact to see email draft, research card, score breakdown, notes
- [ ] **DASH-04**: Search history sidebar with timestamps and company names
- [ ] **DASH-05**: Basic follow-up reminder ("remind me in 7 days" per contact)

### Payments

- [ ] **PAY-01**: Stripe Checkout Sessions for Pro tier ($19/month)
- [ ] **PAY-02**: Stripe webhooks (checkout.session.completed, customer.subscription.deleted) with raw body parsing
- [ ] **PAY-03**: Customer Portal for self-service subscription management
- [ ] **PAY-04**: Plan stored in profiles table, updated by server-side webhook handler (never client-side)
- [ ] **PAY-05**: Pro tier: 50 searches/month, unlimited drafts, Gmail API send, coffee chat prep (V2)

### Email Sending & Deliverability

- [ ] **SEND-01**: Free tier: copy-to-clipboard + mailto link
- [ ] **SEND-02**: Pro tier: Gmail API OAuth send directly from Korvo (separate OAuth flow from Supabase Google login, requires `gmail.send` scope)
- [ ] **SEND-03**: Gmail refresh token stored encrypted at rest, handles 100-token-per-user limit with graceful "Reconnect Gmail" prompt
- [ ] **SEND-04**: Deliverability engine: warm-up ramp (5→10→20 emails/day), enforced in Redis counters inside BullMQ jobs
- [ ] **SEND-05**: Send interval jitter (randomized delays between sends)
- [ ] **SEND-06**: Auto pipeline tracking: contact auto-moves to "Contacted" when sent via Gmail API
- [ ] **SEND-07**: Australia Spam Act compliance: configurable unsubscribe footer in every commercial email

### Analytics & Monitoring

- [ ] **MON-01**: PostHog events: search_completed, email_copied, email_sent, signup, upgrade, pipeline_stage_change
- [ ] **MON-02**: Sentry error tracking on all API routes and worker processes
- [ ] **MON-03**: Success metrics tracked: email copy rate, search-to-send conversion, 7-day retention, free-to-paid conversion

### Legal & Compliance

- [ ] **LEGAL-01**: No LinkedIn scraping — only Google-indexed public data
- [ ] **LEGAL-02**: Privacy policy explaining data collection and usage
- [ ] **LEGAL-03**: Terms of Service: users responsible for their own outreach
- [ ] **LEGAL-04**: Australian Privacy Act (APPs) compliance for storing contact data

## v2 Requirements

Deferred to after V1 launch. Tracked but not in current roadmap phases.

### Enrichment

- **ENRICH-01**: Apollo.io BYO API key input (Pro tier, Settings page)
- **ENRICH-02**: Apollo enrichment: verified emails, phone numbers, LinkedIn URLs
- **ENRICH-03**: NeverBounce email verification before sending
- **ENRICH-04**: Encrypted storage for user-provided API keys

### Coffee Chat Prep

- **PREP-01**: Pre-chat brief generator (Sonnet 4.6): career path, recent activity, team focus, 3 specific questions, 200-word max
- **PREP-02**: Brief attached to contact card, viewable before call

### Calendar

- **CAL-01**: Google Calendar integration: book coffee chats from dashboard
- **CAL-02**: Suggest available time slots
- **CAL-03**: Auto-create calendar event with prep brief attached

### Resume

- **RESUME-01**: Upload base resume (PDF/DOCX parsing)
- **RESUME-02**: Generate per-role tailored version highlighting relevant experience
- **RESUME-03**: Export tailored resume as PDF

## v3 Requirements

Deferred to after V2. Tracked for future planning.

### Follow-Up Automation

- **FOLLOW-01**: Draft follow-ups at 3, 7, 14 days after initial send (never auto-send)
- **FOLLOW-02**: User reviews and sends manually
- **FOLLOW-03**: Track which follow-up stage each contact is at

### Chrome Extension

- **EXT-01**: Visit any company career page → see Korvo contacts + draft emails
- **EXT-02**: One-click add to pipeline from extension
- **EXT-03**: Requires Chrome Web Store review and approval

### AI Response Detection

- **DETECT-01**: Gmail read-only OAuth to detect positive replies
- **DETECT-02**: Auto-move contact to "Responded" stage
- **DETECT-03**: Privacy consent UI before connecting Gmail read access

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auto-sending emails | CAN-SPAM/Spam Act violations, Gmail deliverability damage, irreversible sender reputation harm |
| Bulk campaign sequences (1,000+) | Wrong use case — students need depth not breadth, increases spam risk |
| LinkedIn API / scraping | LinkedIn actively litigates (Proxycurl precedent), legal risk too high |
| CRM integrations | Target user (uni grad) doesn't use Salesforce; dilutes product focus |
| Multi-seat / team features | V4 territory — validate single-user product first |
| Mobile native app | Web-first, mobile-responsive sufficient; native costs 3x |
| Cover letter generator | Saturated market, dilutes positioning as outreach tool |
| Open rate tracking pixels | Blocked by Apple MPP, increases spam filter scores, hurts deliverability |
| Multi-channel outreach | Email is the correct channel for cold job outreach; LinkedIn/WhatsApp/phone fragments UX |
| White-label / agency | V4 B2B territory, builds wrong mental model in codebase |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
<<<<<<< HEAD
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 1 | Pending |
=======
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 1 | Complete |
>>>>>>> worktree-agent-a3fbb471
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Pending |
| PAY-01 | Phase 1 | Pending |
| PAY-02 | Phase 1 | Pending |
| PAY-03 | Phase 1 | Pending |
| PAY-04 | Phase 1 | Pending |
| PAY-05 | Phase 1 | Pending |
| ORCH-01 | Phase 2 | Pending |
| ORCH-02 | Phase 2 | Pending |
| ORCH-03 | Phase 2 | Pending |
| ORCH-04 | Phase 2 | Pending |
| ORCH-05 | Phase 2 | Pending |
| ORCH-06 | Phase 2 | Pending |
| AGENT-01 | Phase 3 | Pending |
| AGENT-02 | Phase 3 | Pending |
| AGENT-03 | Phase 3 | Pending |
| AGENT-04 | Phase 3 | Pending |
| AGENT-05 | Phase 3 | Pending |
| AGENT-06 | Phase 3 | Pending |
| AGENT-07 | Phase 3 | Pending |
| AGENT-08 | Phase 3 | Pending |
| AGENT-09 | Phase 3 | Pending |
| SCORE-01 | Phase 3 | Pending |
| SCORE-02 | Phase 3 | Pending |
| SCORE-03 | Phase 3 | Pending |
| SCORE-04 | Phase 3 | Pending |
| EMAIL-01 | Phase 3 | Pending |
| EMAIL-02 | Phase 3 | Pending |
| EMAIL-03 | Phase 3 | Pending |
| EMAIL-04 | Phase 3 | Pending |
| EMAIL-05 | Phase 3 | Pending |
| UI-01 | Phase 4 | Pending |
| UI-02 | Phase 4 | Pending |
| UI-03 | Phase 4 | Pending |
| UI-04 | Phase 4 | Pending |
| UI-05 | Phase 4 | Pending |
| UI-06 | Phase 4 | Pending |
| UI-07 | Phase 4 | Pending |
| UI-08 | Phase 4 | Pending |
| UI-09 | Phase 4 | Pending |
| DASH-01 | Phase 4 | Pending |
| DASH-02 | Phase 4 | Pending |
| DASH-03 | Phase 4 | Pending |
| DASH-04 | Phase 4 | Pending |
| DASH-05 | Phase 4 | Pending |
| SEND-01 | Phase 5 | Pending |
| SEND-02 | Phase 5 | Pending |
| SEND-03 | Phase 5 | Pending |
| SEND-04 | Phase 5 | Pending |
| SEND-05 | Phase 5 | Pending |
| SEND-06 | Phase 5 | Pending |
| SEND-07 | Phase 5 | Pending |
| MON-01 | Phase 6 | Pending |
| MON-02 | Phase 6 | Pending |
| MON-03 | Phase 6 | Pending |
| LEGAL-01 | Phase 6 | Pending |
| LEGAL-02 | Phase 6 | Pending |
| LEGAL-03 | Phase 6 | Pending |
| LEGAL-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 67 total
- Mapped to phases: 67
- Unmapped: 0

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01 after roadmap creation (corrected count: 67 v1 requirements)*
