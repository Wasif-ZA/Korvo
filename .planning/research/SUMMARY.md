# Research Summary: Korvo

**Domain:** Job Outreach SaaS with AI Agent Pipeline + Gmail Send
**Researched:** 2026-04-01
**Overall confidence:** HIGH

---

## Executive Summary

Korvo sits at the intersection of four technical domains: AI agent orchestration, job-seeker-specific UX, Gmail API email deliverability, and SaaS payments. Research confirms the chosen stack (Next.js 16, Supabase, BullMQ, Anthropic SDK, Stripe, Gmail API) is well-supported, has active documentation, and maps cleanly to the product's requirements. No technology bets are speculative — every library is production-stable with verified current versions.

The most important architectural insight from research: the `@anthropic-ai/claude-agent-sdk` is NOT the right tool for Korvo's 4 specialized agents. That SDK is designed for autonomous file-editing agents (the renamed Claude Code SDK). Korvo's agents (Contact Finder, Email Guesser, Research Agent, Email Drafter) are specialized API workers — use `@anthropic-ai/sdk` (v0.81.0) directly with a manual tool-use loop inside BullMQ workers. This is the standard pattern for orchestrated AI agent pipelines in 2026.

The BullMQ FlowProducer's parent/child dependency model is an exact match for Korvo's 4-agent DAG (Contact Finder runs first → Email Guesser + Research Agent in parallel → Email Drafter last). This pattern is well-documented, production-tested, and available in BullMQ v5.71.1.

Next.js 16 (currently 16.2.2) introduces two breaking changes that affect the roadmap: (1) `params` and `cookies()` are now async — must be awaited in all Server Components, and (2) `middleware.ts` is deprecated in favor of `proxy.ts`. Both are handled by the automated codemod. The new opt-in `"use cache"` directive replaces the confusing implicit caching of earlier App Router versions — this simplifies the caching story significantly.

Gmail API send is a genuine differentiator for the Pro tier. The key deliverability insight: users are sending from their own Gmail accounts, which means Google handles SPF/DKIM/DMARC authentication. Korvo's deliverability responsibility is enforcing the warm-up ramp (5→10→20 emails/day) at the worker level to protect users' personal Gmail sender reputation. Refresh token management requires care (100-token per-user limit from Google) and tokens must be encrypted at rest.

---

## Key Findings

**Stack:** Next.js 16.2.2 + TailwindCSS 4.2.2 + `@anthropic-ai/sdk` 0.81.0 + BullMQ 5.71.1 + `@supabase/ssr` 0.10.0 + Stripe 21.0.1 + googleapis 171.4.0 — all current, stable, no bets.

**Architecture:** BullMQ FlowProducer DAG with 4 specialized agents; workers on Railway (not Vercel); Supabase Realtime for live pipeline status; `@supabase/ssr` for RLS-safe server components.

**Critical pitfall:** Running BullMQ workers inside Vercel serverless functions — they get killed after request completion. Workers must be a separate Railway service.

---

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation** — Infrastructure, auth, database schema, RLS, Stripe
   - Addresses: Auth flow, payment tiers, RLS security, Supabase pooler config
   - Avoids: Service role key on client, user_metadata RLS bypass, wrong connection string
   - Critical config: Redis `maxmemory-policy noeviction`, Supabase pooler (port 6543), Stripe webhook raw body

2. **Core Agent Pipeline** — BullMQ workers on Railway, 4 agents with tool-use loops, prompt caching
   - Addresses: Contact Finder → parallel Email Guesser + Research Agent → Email Drafter
   - Avoids: Claude Agent SDK (wrong tool), agent infinite loops (step limits), LinkedIn URL access
   - Critical config: BullMQ FlowProducer for DAG ordering, `maxRetriesPerRequest: null` on worker connections, prompt caching only after system prompts frozen

3. **Results UI + Pipeline Dashboard** — SearchForm, ResultCard, Kanban, Supabase Realtime
   - Addresses: Table stakes features (contact cards, email drafts, confidence badges, pipeline tracker)
   - Avoids: "use client" over-annotation, stale cache on pipeline completion, async params pattern

4. **Gmail API Send (Pro Tier)** — OAuth flow, encrypted token storage, deliverability engine
   - Addresses: Pro tier differentiator, warm-up ramp, auto-tracking to "Contacted"
   - Avoids: Refresh token exhaustion, unencrypted token storage, warm-up bypass, SPF/DKIM onboarding gap

5. **Polish + V2 Features** — Apollo.io BYO key, NeverBounce verification, Google Calendar, pre-chat brief
   - Addresses: Differentiators beyond table stakes
   - Avoids: Cost creep without monetization (V2 features are revenue-gated)

**Phase ordering rationale:**
- Foundation first because RLS, pooler config, and Stripe webhook patterns are impossible to retrofit cleanly
- Agent pipeline before UI because the UI is just a consumer of agent results; building the pipeline correctly first means no rewrites
- Gmail send after core pipeline is working because it's a Pro-tier feature that requires a stable base and has its own complex state (OAuth tokens, warm-up counters, deliverability tracking)

**Research flags for phases:**
- Phase 2 (Agent Pipeline): Standard patterns well-documented — unlikely to need additional research
- Phase 4 (Gmail Send): Likely needs phase-specific research on Google OAuth PKCE flow for Supabase SSR + Gmail API concurrent auth, and on Gmail API quota unit calculation for the deliverability engine
- Phase 5 (V2): Apollo.io integration needs separate research (pricing, rate limits, BYO key architecture)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack versions | HIGH | All verified via `npm view` on 2026-04-01 |
| Next.js 16 features | HIGH | Official release notes read in full |
| Anthropic SDK patterns | HIGH | Official docs fetched, prompt caching verified |
| BullMQ FlowProducer | HIGH | Official docs + 2026 guides consistent |
| Gmail API OAuth | HIGH | Official Google docs, scope requirements confirmed |
| Supabase SSR pattern | HIGH | Official docs, migration guide confirmed |
| Stripe webhooks | HIGH | Raw body pattern verified against official Stripe docs |
| Deliverability limits | MEDIUM | Community guides consistent, not official Gmail API docs |
| TailwindCSS 4 | HIGH | Official release, native CSS config confirmed |

---

## Gaps to Address

- **Gmail + Supabase concurrent OAuth:** User needs both Google OAuth (via Supabase Auth) for login AND Gmail OAuth (via googleapis) for Pro send. These are two different OAuth grants from the same provider. Need to verify the token storage pattern — can both be handled in one consent screen, or is it two separate flows? Phase 4 research needed.

- **Supabase Realtime free tier limits:** Free tier allows 200 concurrent Realtime connections. At 1,000+ MAU, peak searches could exceed this. Monitor at scale, upgrade or switch to polling if needed.

- **BullMQ Railway free tier limits:** Railway's free tier provides 500MB Redis. At ~10KB per job (with removeOnComplete config), this supports ~50,000 jobs in storage. Sufficient for MVP, but monitor as user base grows.

- **Apollo.io BYO key architecture (V2):** Storing and using user-provided API keys securely adds complexity (encrypted storage, per-request credential injection). Needs separate design before Phase 5.
