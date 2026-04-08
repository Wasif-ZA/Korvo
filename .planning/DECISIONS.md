# Korvo - Architecture Decisions

## DEC-001: Email template structure validated by real data

- **Status:** DECIDED
- **Date:** 2026-04-08
- **Context:** Founder sent 46 cold emails across 20+ companies over Feb-Apr 2026. Only 2 got replies (both at Antares Solutions). Analyzed all 46 for patterns.
- **Decision:** Default email generation follows the 5-sentence casual pattern. No formal tone option in MVP.
- **Rationale:** The two replies came from the shortest, most casual, most specific emails. Every email that used formal language, multiple paragraphs, or credential dumps got zero replies.

## DEC-002: MVP scope tightened

- **Status:** DECIDED
- **Date:** 2026-04-08
- **Context:** Codebase has significant broken code. Trying to build too many features at once.
- **Decision:** MVP is ONLY: (1) company search input, (2) contact discovery (3 contacts), (3) email guess, (4) single email draft per contact using the validated template, (5) copy-to-clipboard. No pipeline tracker, no follow-up automation, no resume tailoring, no coffee chat prep in MVP.
- **Rationale:** Ship the core loop first. Everything else is post-launch.

## DEC-003: One email per contact, no variations

- **Status:** DECIDED
- **Date:** 2026-04-08
- **Context:** Offering tone options or multiple drafts adds decision fatigue for users.
- **Decision:** Generate exactly ONE email per contact. Editable inline but default should be send-ready 80% of the time.
- **Rationale:** Every choice point is a chance for the user to freeze. The winning emails were all the same tone.

## DEC-004: Next.js 14 + TypeScript

- **Status:** DECIDED
- **Context:** Need a full-stack framework with strong typing and good developer experience.
- **Decision:** Next.js 14 with TypeScript for the full application.
- **Rationale:** App Router provides server components, API routes, and edge functions. TypeScript catches errors at compile time. Large ecosystem and deployment support on Vercel.

## DEC-005: Supabase for auth and database

- **Status:** DECIDED
- **Context:** Need auth, database, and row-level security without managing infrastructure.
- **Decision:** Supabase (PostgreSQL + RLS) with Prisma ORM. Google OAuth via Supabase Auth.
- **Rationale:** PostgreSQL gives relational data modeling. RLS ensures data isolation per user. Prisma provides type-safe database access. Supabase Auth handles OAuth flow with minimal code.

## DEC-006: Claude API for AI features

- **Status:** DECIDED
- **Context:** Need AI for contact finding, email drafting, and research synthesis.
- **Decision:** Claude Haiku for contact finding and email drafting (high volume, low cost). Claude Sonnet for coffee chat prep briefs (post-MVP, higher quality needed).
- **Rationale:** Haiku is fast and cheap enough for per-contact operations. Sonnet provides deeper analysis for prep briefs where quality matters more than speed.

## DEC-007: Four-layer data access

- **Status:** DECIDED
- **Context:** Need to find contacts and their emails from multiple data sources.
- **Decision:** Four layers: OAuth connections, enrichment APIs (Apollo, Hunter), structured public data, managed extraction (Firecrawl).
- **Rationale:** No single source has all the data. Layered approach provides fallbacks and maximizes coverage. Apollo for contacts, Hunter for email verification, Firecrawl for company research.

## DEC-008: BullMQ + Redis for job queue

- **Status:** DECIDED
- **Context:** Contact discovery and email generation involve multiple async steps.
- **Decision:** BullMQ with Redis on Railway for background job processing.
- **Rationale:** BullMQ provides reliable job queuing with retries, rate limiting, and progress tracking. Redis on Railway is simple to deploy and manage.

## DEC-009: Stripe billing tiers

- **Status:** DECIDED
- **Context:** Need a monetization model that scales with user value.
- **Decision:** Three tiers: Free (limited searches), Pro ($29/mo), Teams ($79/mo).
- **Rationale:** Free tier for acquisition, Pro for individual job seekers, Teams for career services or cohorts. Stripe handles subscription management and billing.

## DEC-010: Agent ownership model

- **Status:** DECIDED
- **Context:** Multiple AI coding agents working on the same codebase need clear boundaries.
- **Decision:** Claude Code owns backend, Gemini CLI owns frontend, GitHub Copilot owns testing/DevOps. See AGENTS.md for details.
- **Rationale:** Clear ownership prevents conflicts and ensures each agent works in its area of strength.
