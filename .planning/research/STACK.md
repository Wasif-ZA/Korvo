# Technology Stack

**Project:** Korvo — Job Outreach SaaS with AI Agent Pipeline
**Researched:** 2026-04-01
**Confidence:** HIGH (all versions verified via npm registry + official docs)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 16.2.2 | Full-stack framework (frontend + API routes + Server Actions) | App Router is stable, Turbopack default, React 19.2, `"use cache"` opt-in caching replaces the broken implicit caching in v14. `proxy.ts` replaces `middleware.ts`. Node.js 20.9+ required. |
| React | 19.2 (via Next.js 16) | UI rendering | Ships with Next.js 16. View Transitions, `useEffectEvent`, `<Activity/>` available. React Compiler stable but opt-in. |
| TailwindCSS | 4.2.2 | Utility-first styling | v4 introduces native CSS config (no `tailwind.config.js` needed), JIT by default, faster builds with Turbopack integration. |
| TypeScript | 5.x (min 5.1) | Type safety | Required by Next.js 16 minimum. Use strict mode. |

### Database & Auth

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @supabase/supabase-js | 2.101.1 | Supabase JS client (data, realtime, storage) | Official client, handles RLS-scoped queries automatically when user JWT is forwarded. |
| @supabase/ssr | 0.10.0 | SSR-compatible Supabase client for Next.js App Router | Replaces deprecated `@supabase/auth-helpers-nextjs`. Provides `createBrowserClient` and `createServerClient` for correct cookie-based session handling across Server Components, Route Handlers, and Server Actions. This is the only correct way to use Supabase Auth in Next.js App Router. |

**RLS Pattern:** Every table (`profiles`, `searches`, `contacts`, `outreach`) uses `auth.uid() = user_id` policies. Never bypass RLS by using the service role key on the client side — service role key is server-only (API routes, workers).

### AI Engine

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @anthropic-ai/sdk | 0.81.0 | Direct Claude API access for the 4 specialized agents | **Use this, not `@anthropic-ai/claude-agent-sdk`** (see "What NOT to Use" section). Supports tool_use, structured outputs, prompt caching via `cache_control`. Haiku 4.5 for Contact Finder / Email Guesser / Research / Drafter; Sonnet 4.6 for deep prep briefs (V2). |

**Prompt Caching Pattern:** Mark system prompts with `cache_control: { type: "ephemeral" }` on the final system block. Reduces input token cost by 90% on repeated calls with the same system prompt. Cache TTL: 5 minutes (ephemeral) or 1 hour (paid tier). Workspace-level isolation since Feb 2026.

```typescript
// Correct prompt caching pattern (verified against official docs)
await anthropic.messages.create({
  model: "claude-haiku-4-5",
  max_tokens: 1024,
  system: [
    {
      type: "text",
      text: CONTACT_FINDER_SYSTEM_PROMPT, // large, stable system prompt
      cache_control: { type: "ephemeral" },
    },
  ],
  messages: [{ role: "user", content: userRequest }],
});
```

**Agent Loop Pattern (DIY, not Agent SDK):** The 4 agents are orchestrated via BullMQ jobs, not via the Claude Agent SDK's autonomous loop. Each agent = one BullMQ worker that calls `anthropic.messages.create()` in an agentic tool-use loop (check `stop_reason === "tool_use"`, execute tool, feed result back, repeat until `stop_reason === "end_turn"`). This gives you full control over rate budgets, per-user quotas, and retry semantics.

### Job Queue & Orchestration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| bullmq | 5.71.1 | Job queue and orchestration engine | De-facto Node.js queue standard in 2026. Built on Redis Streams. Native TypeScript. FlowProducer enables DAG-style parent/child dependencies — exactly the pattern needed: Contact Finder (parent) → Email Guesser + Research Agent (children, parallel) → Email Drafter (grandparent, waits for both children). |
| ioredis | 5.10.1 | Redis client for BullMQ connection | BullMQ's required Redis client. Use `REDIS_FAMILY=6` on Railway for IPv6 private networking. |
| @bull-board/api + @bull-board/express | 6.20.6 | Queue monitoring dashboard | Deploy separately on Railway. Monitor queue depth, failed jobs, processing time. Critical for ops. |

**BullMQ FlowProducer Pattern for Agent Orchestration:**
```
FlowProducer.add({
  name: 'email-drafter',    // runs LAST (parent waits for children)
  queueName: 'agents',
  children: [
    { name: 'email-guesser', queueName: 'agents', data: {...} },
    { name: 'research-agent', queueName: 'agents', data: {...},
      children: [
        { name: 'contact-finder', queueName: 'agents', data: {...} }
      ]
    }
  ]
})
```
Email Guesser and Research Agent both depend on Contact Finder completing first. Email Drafter waits for both Email Guesser + Research Agent. BullMQ guarantees this ordering via parent/child dependencies.

**Worker Architecture:** BullMQ workers MUST run in a separate process from the Next.js API — never in Next.js Route Handlers (Vercel serverless functions are stateless and killed after request completion). Workers run on Railway as a long-running Node.js service.

### Payments

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| stripe | 21.0.1 | Payment processing | Checkout Sessions for subscription creation, webhooks for fulfillment, Customer Portal for self-service management. |

**Stripe + Next.js 16 Critical Pattern:** Webhook handler at `app/api/webhooks/stripe/route.ts` must use `await req.text()` (NOT `req.json()`) to get raw body for signature verification. Signature verification with `stripe.webhooks.constructEvent(rawBody, signature, secret)` is mandatory — never trust redirect URLs alone.

**Server Actions for Checkout:** In Next.js 16, create Checkout Sessions from Server Actions instead of API routes. This avoids the extra round-trip.

### Email (Gmail API)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| googleapis | 171.4.0 | Gmail API OAuth2 send | Official Google Node.js client. `gmail.users.messages.send` with base64-encoded RFC2822 message. Scope: `https://www.googleapis.com/auth/gmail.send` (send-only, minimal permissions). |

**Gmail OAuth Flow:**
1. User connects Gmail in Pro tier settings
2. Store refresh token encrypted in Supabase `profiles.gmail_refresh_token`
3. Per-send: exchange refresh token for access token → call `gmail.users.messages.send`
4. Auto-tracking: after send, update `contacts.stage = 'Contacted'`

**Deliverability Engine Rules (enforced at worker level):**
- New users: 5 emails/day → 10/day → 20/day ramp (week 1 / week 2 / week 3+)
- Send interval jitter: 60-180 seconds between sends (randomized)
- Domain reputation: monitor bounce rate, stop if >5% hard bounces in 24h
- SPF/DKIM/DMARC: Users send from their own Gmail → Google handles authentication

### Frontend Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.96.1 | Server state management for search results + pipeline data | All data fetching that needs cache invalidation (after search completes, after stage change). Pairs with Supabase Realtime for live updates. |
| @tanstack/react-table | 8.21.3 | Pipeline table/list views | If pipeline view uses table layout. Optional — could use CSS Grid directly for Kanban. |
| @dnd-kit/core | 6.3.1 | Drag-and-drop for Kanban pipeline | Accessibility-first DnD, works correctly with React 19's concurrent rendering. |
| lucide-react | 1.7.0 | Icon set | Consistent icon library, tree-shakeable, used by shadcn/ui. |
| class-variance-authority | 0.7.1 | Component variant management | For building the design system (ConfidenceBadge variants, button states). |
| clsx + tailwind-merge | 2.1.1 / 3.5.0 | Class composition utilities | `cn()` utility = `twMerge(clsx(...))`. Prevents Tailwind class conflicts. |
| react-hot-toast | 2.6.0 | Toast notifications | Lightweight, zero-config, works with App Router. For "Search complete", "Email copied" etc. |
| zod | 4.3.6 | Runtime schema validation | Validate all API inputs, agent tool parameters, Stripe webhook payloads. Critical at all system boundaries. |

### Analytics & Observability

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| posthog-js | 1.364.4 | Frontend analytics + funnels | Free tier: 1M events/month. App Router integration: use `instrumentation-client.ts` for lightweight setup in Next.js 15.3+/16. Track: search_initiated, email_copied, email_sent, upgrade_clicked. |
| @sentry/nextjs | 10.47.0 | Error tracking | Vercel integration, source maps, session replay. Captures unhandled errors in workers too. |

### Infrastructure & DevOps

| Service | Version/Tier | Purpose | Why |
|---------|-------------|---------|-----|
| Vercel | Free → Pro | Next.js hosting | Optimal for Next.js — same team, zero-config deploys, Turbopack CI support, Edge Network. |
| Railway | Free → Hobby | Redis + BullMQ workers | Simple Redis deployment + long-running Node.js worker service. `REDIS_FAMILY=6` for IPv6 private networking between services. Use Railway's Bull Board template as starting point. |
| Supabase | Free tier (500MB, 50k MAU) | PostgreSQL + Auth + RLS | Free until meaningful scale. Connection pooling via PgBouncer for worker connections. |

---

## Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| TypeScript | 5.x | Type safety — strict mode |
| ESLint (Flat Config) | Latest | Next.js 16 uses Flat Config format by default (removed `next lint` command — run ESLint directly) |
| Prettier | Latest | Code formatting |
| Turbopack | Built into Next.js 16 | Default bundler — do NOT switch to webpack unless custom webpack plugins required |

---

## Installation

```bash
# Initialize project
npx create-next-app@latest korvo --typescript --tailwind --app --turbopack

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# AI
npm install @anthropic-ai/sdk

# Queue / Worker
npm install bullmq ioredis

# Payments
npm install stripe

# Gmail API
npm install googleapis

# Analytics / Errors
npm install posthog-js @sentry/nextjs

# Frontend utilities
npm install @tanstack/react-query @dnd-kit/core lucide-react \
  class-variance-authority clsx tailwind-merge react-hot-toast zod

# Dev dependencies
npm install -D @types/node @bull-board/api @bull-board/express
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| AI SDK | `@anthropic-ai/sdk` (direct) | `@anthropic-ai/claude-agent-sdk` | Agent SDK is designed for Claude Code/agentic file-editing workflows. For 4 specialized API agents with custom tool orchestration, the direct SDK gives full control over the agent loop, retries, and per-user rate budgets. Agent SDK autonomous loops are harder to interrupt for per-user quota enforcement. |
| Queue | BullMQ | SQS, Inngest, Trigger.dev | BullMQ runs on Railway Redis (already in stack), zero additional SaaS cost, parent/child flows are exactly what's needed for the 4-agent DAG. Inngest/Trigger.dev add vendor lock-in and cost at scale. |
| Auth | Supabase Auth | Auth.js (NextAuth) | Supabase Auth integrates directly with RLS — same JWT used for auth IS the RLS policy enforcer. Auth.js requires a separate session adapter and manual RLS integration. |
| Database | Supabase PostgreSQL | PlanetScale, Neon, Prisma + Postgres | Supabase gives PostgreSQL + RLS + Auth + Realtime + Storage in one free tier. PlanetScale dropped free tier (2023). Neon requires separate auth layer. |
| Payments | Stripe | Paddle, Lemon Squeezy | Stripe has best-in-class Next.js docs, webhook tooling, and Customer Portal. Paddle/Lemon handle tax but add complexity not needed for $19/month single-product SaaS. |
| CSS | TailwindCSS 4 | CSS Modules, Styled Components | TailwindCSS 4 has native CSS config, no build config file needed. Fastest iteration for UI-heavy student-friendly design. |
| Email Send | Gmail API (`googleapis`) | Resend, SendGrid | Pro-tier feature is users sending from THEIR OWN Gmail account — not platform emails. Gmail OAuth send IS the differentiator. Resend/SendGrid are for transactional platform emails (not in scope for V1). |
| Frontend State | TanStack Query | SWR, Zustand, Redux | TanStack Query v5 handles server state (search results, pipeline data) with cache invalidation. BullMQ job polling needs query invalidation on completion — TanStack Query's `refetchInterval` pattern is clean. Zustand for lightweight UI state only if needed. |

---

## What NOT to Use

### `@anthropic-ai/claude-agent-sdk` for the 4 specialized agents
**Avoid.** This SDK is the renamed Claude Code SDK — designed for building autonomous coding agents with file system access. For Korvo's agents (Contact Finder, Email Guesser, Research Agent, Email Drafter), you need the direct `@anthropic-ai/sdk` with manual tool-use loops. The Agent SDK's autonomous `query()` loop doesn't integrate cleanly with BullMQ's worker model and makes per-user quota enforcement awkward.

### Next.js API Route Handlers as BullMQ workers
**Avoid.** Vercel serverless functions have a max execution timeout (10s hobby, 60s pro) and are stateless. BullMQ workers are long-running processes — run them on Railway as a separate service, not inside the Next.js app.

### `@supabase/auth-helpers-nextjs`
**Deprecated.** Replaced by `@supabase/ssr`. Do not use the old auth-helpers package — it doesn't support App Router correctly.

### `middleware.ts` for auth guards in Next.js 16
**Deprecated.** Rename to `proxy.ts` and export a `proxy` function. `middleware.ts` still works but is deprecated in Next.js 16 and will be removed. The logic stays identical — just rename.

### Auto-sending emails
**Never implement.** Human-in-the-loop is a legal and deliverability requirement. Users send from their own Gmail account. No platform auto-send at any tier. This is enforced at the architecture level, not just policy.

### LinkedIn scraping or LinkedIn API
**Never implement.** Proxycurl precedent (LinkedIn lawsuit). Only use Google-indexed public profiles, company websites, and ATS APIs (Greenhouse, Lever, Workable public endpoints).

### Vercel for BullMQ workers
**Wrong environment.** Vercel = stateless serverless. Workers need persistent processes. Railway is the correct host for the worker service.

---

## Sources

- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16) — HIGH confidence (official)
- [Next.js 16.2 Release](https://nextjs.org/blog/next-16-2) — HIGH confidence (official)
- [Anthropic Agent SDK TypeScript Docs](https://platform.claude.com/docs/en/agent-sdk/typescript) — HIGH confidence (official)
- [Anthropic Prompt Caching Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) — HIGH confidence (official)
- [BullMQ Flows Documentation](https://docs.bullmq.io/guide/flows) — HIGH confidence (official)
- [BullMQ v5.71.1 on npm](https://www.npmjs.com/package/bullmq) — HIGH confidence (verified)
- [Supabase SSR Package](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — HIGH confidence (official)
- [Gmail API Scopes](https://developers.google.com/workspace/gmail/api/auth/scopes) — HIGH confidence (official)
- [Stripe Webhooks Next.js Pattern](https://dev.to/thekarlesi/stripe-subscription-lifecycle-in-nextjs-the-complete-developer-guide-2026-4l9d) — MEDIUM confidence (community, consistent with official docs)
- [PostHog Next.js Docs](https://posthog.com/docs/libraries/next-js) — HIGH confidence (official)
- [Railway BullMQ Deploy Template](https://railway.com/deploy/bull-board) — MEDIUM confidence (official template)
- All npm versions verified via `npm view [package] version` on 2026-04-01
