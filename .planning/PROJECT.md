# Korvo

## What This Is

Korvo is a job outreach SaaS that replaces the manual grind of cold networking with an AI-powered pipeline. A user types a company name and target role, and the system finds 3 relevant contacts, guesses their email addresses, researches personalization hooks, scores response probability, and drafts ready-to-send cold emails — all in one seamless flow. For graduating uni students and career changers who can't afford enterprise sales tools.

## Core Value

Enter a company name. Get 3 contacts with personalized cold emails ready to send. Land interviews. The full loop — find, research, score, draft, send, track — in one product, one flow, no stitching tools together.

## Requirements

### Validated

(None yet — ship to validate)

### Active

#### Core Search & AI Pipeline
- [ ] User enters company name + target role + location and gets 3 contacts with emails, research cards, and draft emails in one seamless load
- [ ] 4 specialized AI agents (Contact Finder, Email Guesser, Research Agent, Email Drafter) built with Anthropic Agent SDK
- [ ] Parallel agent orchestration via BullMQ + Redis (Contact Finder first, then Email Guesser + Research Agent in parallel, then Drafter)
- [ ] 4-layer data access: L1 (User OAuth/web search) → L2 (Enrichment APIs) → L3 (Structured Public Data/ATS APIs) → L4 (Managed Extraction) with waterfall fallback and circuit breakers
- [ ] Scoring engine: 0-100 response probability per contact with weighted signals, explainable breakdown, and tone recommendation
- [ ] Tone mapping: score 75-100 = direct, 45-74 = curious, 0-44 = value-driven
- [ ] Email confidence scoring (high/medium/low) with ConfidenceBadge (green/yellow/red)
- [ ] Multiple email template types: referral_ask, hiring_inquiry, value_offer, followup_1, followup_2
- [ ] Structured research cards per contact: Background | Ask This | Mention This
- [ ] Prompt caching on all agent system prompts (90% input cost reduction)

#### Auth & Payments
- [ ] First search free without signup (reduces friction)
- [ ] Google OAuth via Supabase Auth after first search
- [ ] Free tier: 5 searches/month, 5 email drafts
- [ ] Pro tier: $19/month — 50 searches, unlimited drafts, Gmail API send, coffee chat prep, BYO Apollo key
- [ ] Stripe Checkout Sessions, webhooks, Customer Portal
- [ ] Row Level Security on all tables

#### Email Sending & Deliverability
- [ ] Free tier: copy-to-clipboard + mailto link
- [ ] Pro tier: Gmail API OAuth send directly from Korvo
- [ ] Deliverability engine: warm-up ramp (5→10→20/day), send interval jitter, sender rotation, domain reputation monitoring
- [ ] Auto pipeline tracking: auto-move contact to "Contacted" when sent via Gmail API

#### Pipeline & Dashboard
- [ ] Pipeline stages: Identified → Contacted → Responded → Chatted → Applied → Interviewing
- [ ] Kanban-style drag/click to move contacts
- [ ] Expand contact to see email draft, research card, add notes
- [ ] Search history sidebar
- [ ] Auto-move on Gmail API send, manual for everything else

#### V2 Features
- [ ] Apollo.io BYO API key integration (Pro tier) — enriches contacts with verified emails, phone numbers, LinkedIn URLs
- [ ] Google Calendar integration — book coffee chats from dashboard, suggest time slots, auto-create events with prep brief
- [ ] Pre-chat brief generator (Sonnet-powered) — career path, recent activity, team focus, 3 specific questions, 200-word max
- [ ] Resume tailoring engine — upload base resume, generate per-role version, export as PDF

#### V3 Features
- [ ] Follow-up automation — draft follow-ups at 3, 7, 14 days after initial send (user still sends manually, never auto-send)
- [ ] Chrome extension — visit any career page, see Korvo contacts + draft emails, one-click add to pipeline
- [ ] AI response detection — Gmail read-only OAuth, detect positive replies, auto-move to "Responded" stage

### Out of Scope

- V4 B2B/Teams features (career coach dashboard, multi-client, bulk searches, white-label) — deferred until V1-V3 proven
- LinkedIn API access or direct scraping — legal risk (Proxycurl precedent), only Google-indexed public profiles
- Auto-sending emails without user action — human-in-the-loop is deliberate for deliverability and legal safety
- Mobile native app — web-first, mobile-responsive, native later
- OAuth login providers beyond Google — Google OAuth sufficient for target audience

## Context

### Founder Advantage
Wasif has been manually running this exact workflow and it works. Antares pipeline, Atlassian warm contact, 12+ coffee chats booked. The manual process takes 45 minutes per company — Korvo does it in 30 seconds.

### Target Users
- **Primary:** Graduating uni students in Australia looking for their first tech role
- **Secondary:** Career changers, bootcamp grads, mid-career professionals
- **Tertiary (V4):** Career coaches, bootcamps, uni career services departments (B2B)

### Competitive Landscape
Every existing tool does only ONE step: Apollo = contacts, Teal = resume, NetworkAI = messages, Hunter = email finder, Snov = outreach automation. Korvo does the FULL loop. Target audience (broke uni grads) can't afford $50/month enterprise tools.

### Tech Stack
| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js 16 (App Router) + TailwindCSS | Latest, fast to build, Vercel deploys |
| Backend | Next.js API Routes + Server Actions | One codebase, no separate backend |
| Database | Supabase (PostgreSQL) | Free tier (500MB, 50k MAU), built-in auth, RLS |
| Auth | Supabase Auth + Google OAuth | One-click signup, no password management |
| AI Engine | Claude API via Anthropic Agent SDK | Haiku 4.5 for search/drafts ($1/$5), Sonnet 4.6 for prep briefs ($3/$15) |
| Orchestration | BullMQ + Redis | Per-user rate budgets, source priority chain, circuit breakers |
| Payments | Stripe | Checkout Sessions, webhooks, Customer Portal |
| Email Send | Gmail API (Pro) | OAuth send, auto-tracking |
| Hosting | Vercel (frontend) + Railway (Redis/BullMQ) | Free tiers, upgrade when needed |
| Analytics | PostHog (free: 1M events/month) | Event tracking, funnels |
| Errors | Sentry (free tier) | Error tracking |

### 4-Layer Data Access Architecture
1. **L1 — Claude + Web Search (free, always available):** Company team pages, engineering blogs, conference talks, GitHub org, Google-indexed LinkedIn profiles, press releases
2. **L2 — Email Pattern Detection (free):** Hunter.io public results, job listing emails, blog author contacts, common patterns (first.last@company.com)
3. **L3 — Structured Public Data / ATS APIs:** Greenhouse API, Lever API, Workable API, JSON-LD from career pages, RSS feeds
4. **L4 — Third-Party Enrichment (V2+, revenue-gated):** Hunter.io API, NeverBounce verification, Apollo.io BYO key

Source priority chain: L1 → L2 → L3 → L4 with waterfall fallback. Circuit breakers per source. Per-user rate budgets.

### Agent Architecture
4 specialized agents, each with own system prompt, model selection, and workspace boundaries:

| Agent | Model | Writes To | Purpose |
|-------|-------|-----------|---------|
| Contact Finder | Haiku 4.5 + web search | contacts table | Find 3 relevant people at target company |
| Email Guesser | Haiku 4.5 | contacts.email, contacts.email_confidence | Detect email patterns, guess addresses |
| Research Agent | Haiku 4.5 | contacts.personalization_hook + research card fields | Background, Ask This, Mention This per contact |
| Email Drafter | Haiku 4.5 | outreach table | Draft personalized cold email using tone mapping |

Orchestration: Contact Finder runs first → Email Guesser + Research Agent in parallel → Email Drafter last.

### Caching Strategy
| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Contact data | 90 days | People change jobs every 2-3 years |
| Email patterns | 180 days | Company email formats rarely change |
| Search results | 7 days | Fresh results for each company |
| Job postings | 3 days | Postings change frequently |

### Database Schema
4 tables with RLS: profiles, searches, contacts, outreach. All user data scoped via `auth.uid() = user_id`.

### Unit Economics
- Cost per user per month: ~$0.50 (Haiku for search + drafts, Sonnet for prep briefs)
- Pro tier at $19/month: 97%+ margins
- Breakeven: ~3 paying users covers all infrastructure
- Prompt caching reduces agent costs by ~90% on system prompts

### Legal Position
- Only public data (company websites, Google search results)
- Never access LinkedIn API or scrape LinkedIn pages directly
- Proxycurl was shut down after LinkedIn lawsuit — Korvo avoids this entirely
- Clear ToS: users responsible for their own outreach
- Australian Privacy Act compliance (APPs)

### Risk Register
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Claude API outage | Low | High | Cache results, queue retries, show last-known |
| Email guesses bounce | Medium | Medium | Confidence badges, verification in V2, user reports |
| Users get zero responses | High | Medium | Set expectations in UI, benchmarks, improvement tips |
| Competitor builds same | Medium | Medium | Niche on AU grads, build community, move fast |
| Founder lands job, stops building | High | High | Build lean for autopilot, no complex infra |
| User churn when they land a job | High | Medium | Alumni referral program, career growth features |
| Cold emails flagged as spam | Medium | High | Never auto-send, user sends from own Gmail, send limits |
| Legal issues with contact data | Low | High | Only public data, no LinkedIn scraping, privacy policy |

### Success Metrics
- Email copy rate (did user copy the draft?)
- Search-to-send conversion (searches → emails sent)
- 7-day retention (do users come back?)
- Free-to-paid conversion rate
- MRR growth

## Constraints

- **Launch cost:** ~$15 (domain only) — all services on free tiers initially
- **Tech stack:** Next.js 16, Supabase, Claude API — already decided, not negotiable
- **Legal:** No LinkedIn scraping, no auto-sending, human-in-the-loop always
- **AI costs:** Must use Haiku 4.5 for high-volume tasks, Sonnet 4.6 only for deep research/prep briefs
- **Target audience:** Broke uni grads — pricing must be accessible ($19/month Pro)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Anthropic Agent SDK for all 4 agents | Multi-step tool use, retry logic, structured output | -- Pending |
| BullMQ + Redis for orchestration | Parallel agent execution, rate budgets, circuit breakers | -- Pending |
| Gmail API send in V1 (Pro only) | Key differentiator, enables auto-tracking | -- Pending |
| Scoring engine in V1 | Drives tone mapping, differentiates from dumb email guessing | -- Pending |
| Deliverability engine in V1 | Protects user sender reputation from day 1 | -- Pending |
| Next.js 16 (not 14) | Latest version, best DX | -- Pending |
| 4-layer data access with waterfall | Resilient, no single point of failure, defensible architecture | -- Pending |
| Warm friendly design (not dev-tool aesthetic) | Target audience is students, not developers | -- Pending |
| V1+V2+V3 active scope, V4 deferred | Build complete product before B2B expansion | -- Pending |
| Chrome extension in V3 | Web app must prove value first | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-01 after initialization*
