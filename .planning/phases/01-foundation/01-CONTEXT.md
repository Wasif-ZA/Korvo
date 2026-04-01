# Phase 1: Foundation - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the Next.js 16 project, Supabase database with Prisma ORM, Google OAuth authentication, Stripe payments, and the guest search flow. This phase delivers the non-negotiable infrastructure that all subsequent phases build on. No agent pipeline, no search UI beyond a basic form, no email drafting — just the secure, deployable base.

</domain>

<decisions>
## Implementation Decisions

### Guest Search Flow
- **D-01:** 3 free searches allowed before requiring signup (IP rate-limited server-side to prevent abuse)
- **D-02:** Guest search results are adopted into the user's account on signup (data persists seamlessly)
- **D-03:** After 3 guest searches, a modal overlay appears blocking further action but with results visible behind it — prompting Google OAuth signup
- **D-04:** Claude's Discretion: Guest data storage mechanism (session-based server storage vs localStorage — Claude picks the cleanest approach for surviving the OAuth redirect)

### Auth-to-Payment UX
- **D-05:** Pro upsell only appears when user hits their free tier limit (5 searches/month) — no earlier nudges
- **D-06:** Free tier limit is a hard block — no new searches until next month or upgrade. Past results and pipeline remain accessible
- **D-07:** Pricing shown in both landing page section AND dedicated /pricing page
- **D-08:** Data is kept on subscription end — user just can't exceed free tier limits
- **D-09:** Both monthly ($19 AUD/month) and annual ($149 AUD/year, ~35% savings) pricing tiers
- **D-10:** Promo/discount codes supported at launch via Stripe Coupons (e.g., UTSBDSOC for 50% off first month)
- **D-11:** Pricing in AUD (target audience is Australian students)
- **D-12:** Search counter resets on calendar month (1st of each month)
- **D-13:** Claude's Discretion: Free trial (yes/no), upgrade flow (Stripe Checkout vs embedded), cancellation flow (Stripe Portal vs in-app)

### Schema & RLS Strategy
- **D-14:** RLS policies managed as raw SQL in Prisma migrations — version controlled and reproducible
- **D-15:** Claude's Discretion: Guest data adoption mechanism (anonymous rows with session_id updated on signup vs separate merge)
- **D-16:** Claude's Discretion: Soft delete vs hard delete for contacts/searches

### Project Structure
- **D-17:** Single repo with /worker directory for BullMQ workers, shared types via /shared — NOT a Turborepo monorepo
- **D-18:** Pure Tailwind CSS for all UI components — no component library (no shadcn/ui)
- **D-19:** Prisma ORM for database access (schema, queries, migrations) — Supabase handles auth + realtime only
- **D-20:** Environment variables via .env files (.env.local for dev, Vercel/Railway env vars for prod)
- **D-21:** Vitest for testing
- **D-22:** RLS policies in Prisma migrations as raw SQL

### Claude's Discretion
Claude has flexibility on: guest data storage mechanism (D-04), free trial offering (D-13), upgrade/cancel flow details (D-13), guest data adoption pattern (D-15), soft vs hard delete (D-16). For all of these, pick the simplest, most standard approach.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Full project vision, tech stack, architecture, constraints
- `.planning/REQUIREMENTS.md` — All v1 requirements with REQ-IDs (FOUND-01-05, AUTH-01-05, PAY-01-05 for this phase)
- `.planning/ROADMAP.md` — Phase structure, success criteria, dependencies

### Research
- `.planning/research/STACK.md` — Verified tech stack with versions (Next.js 16.2.2, Prisma, @supabase/ssr 0.10.0, Stripe 21.0.1)
- `.planning/research/PITFALLS.md` — 22 pitfalls including Supabase RLS bypass via user_metadata, connection pooler config (port 6543), Stripe webhook raw body parsing
- `.planning/research/ARCHITECTURE.md` — Component boundaries, data flow, build order

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None — patterns will be established in this phase

### Integration Points
- Supabase project (to be created)
- Stripe account (to be created)
- Vercel project (to be connected)
- Railway project (to be created for Redis/BullMQ in Phase 2)

</code_context>

<specifics>
## Specific Ideas

- Warm, friendly, approachable design (Notion/Teal aesthetic, not dev-tool) — this applies to the landing page and any auth/payment UI built in this phase
- AUD pricing, not USD — target audience is Australian students
- UTSBDSOC promo code for launch distribution
- Annual plan at ~35% discount ($149 AUD/year vs $19 AUD/month)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-01*
