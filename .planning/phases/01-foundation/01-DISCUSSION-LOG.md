# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 01-foundation
**Areas discussed:** Guest search flow, Auth-to-payment UX, Schema & RLS strategy, Project structure

---

## Guest Search Flow

### Guest Data Adoption

| Option | Description | Selected |
|--------|-------------|----------|
| Adopt into account | Guest search results transfer to their new account seamlessly | ✓ |
| Gone after signup | They start fresh — the free search was just a taste | |
| Let me explain | I have a specific flow in mind | |

**User's choice:** Adopt into account

### Abuse Prevention

| Option | Description | Selected |
|--------|-------------|----------|
| Browser fingerprint | Track via cookie/localStorage — easy to bypass but good enough | |
| IP rate limit | Limit searches per IP address on the server side | ✓ |
| Both | Cookie client-side + IP rate limit server-side | |
| You decide | Claude picks the best approach | |

**User's choice:** IP rate limit

### Guest Search Limit

| Option | Description | Selected |
|--------|-------------|----------|
| 1 search | One taste, then signup wall — highest conversion pressure | |
| 3 searches | Enough to evaluate, then wall | ✓ |
| You decide | Claude picks based on conversion patterns | |

**User's choice:** 3 searches

### Guest Data Storage

| Option | Description | Selected |
|--------|-------------|----------|
| Server session | Store in a temp table keyed by session ID — survives redirect, server-controlled | |
| localStorage | Store results client-side — simpler, no server state for guests | |
| You decide | Claude picks the best approach | ✓ |

**User's choice:** You decide (Claude's discretion)

### Signup Prompt Style

| Option | Description | Selected |
|--------|-------------|----------|
| Soft banner | Dismissible banner suggesting signup to save results | |
| Modal overlay | Modal blocking further action until signup — results visible behind it | ✓ |
| Hard wall | No more results visible until they sign up | |

**User's choice:** Modal overlay

---

## Auth-to-Payment UX

### Pro Upsell Timing

| Option | Description | Selected |
|--------|-------------|----------|
| On limit hit | Only show Pro when they hit the 5 searches/month limit | ✓ |
| Dashboard banner | Persistent but dismissible banner showing Pro benefits | |
| After 1st search | Show what Pro would unlock right after first signed-in search | |
| You decide | Claude picks | |

**User's choice:** On limit hit

### Paywall Type

| Option | Description | Selected |
|--------|-------------|----------|
| Hard block | Can't search until next month or upgrade | ✓ |
| Degraded access | Can still view past results, just can't run new searches | |
| You decide | Claude picks | |

**User's choice:** Hard block
**Notes:** Past results and pipeline remain accessible — just new searches blocked.

### Pricing Page Location

| Option | Description | Selected |
|--------|-------------|----------|
| Landing page section | Pricing section on the homepage | |
| Dedicated /pricing | Separate pricing page | |
| Both | Section on landing page + dedicated page | ✓ |

**User's choice:** Both

### Free Trial

| Option | Description | Selected |
|--------|-------------|----------|
| No trial | Free tier is the trial | |
| 7-day trial | Try Pro free for 7 days | |
| You decide | Claude picks | ✓ |

**User's choice:** You decide (Claude's discretion)

### Upgrade Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Stripe Checkout | Redirect to Stripe-hosted checkout | |
| In-app modal | Embedded Stripe Elements | |
| You decide | Claude picks | ✓ |

**User's choice:** You decide (Claude's discretion)

### Cancel Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Stripe Portal | Link to Stripe Customer Portal | |
| In-app cancel | Cancel button in settings | |
| You decide | Claude picks | ✓ |

**User's choice:** You decide (Claude's discretion)

### Data on Subscription End

| Option | Description | Selected |
|--------|-------------|----------|
| Keep all data | Data stays, just can't exceed free limits | ✓ |
| Grace period | 30-day grace, then archive Pro-only data | |
| You decide | Claude picks | |

**User's choice:** Keep all data

### Annual Pricing

| Option | Description | Selected |
|--------|-------------|----------|
| Monthly only | Keep it simple for MVP | |
| Both | Monthly $19 + Annual $149 (~35% savings) | ✓ |
| You decide | Claude picks | |

**User's choice:** Both

### Promo Codes

| Option | Description | Selected |
|--------|-------------|----------|
| Yes | Stripe Coupons — useful for launch distribution | ✓ |
| Not for MVP | Add later | |
| You decide | Claude picks | |

**User's choice:** Yes

### Currency

| Option | Description | Selected |
|--------|-------------|----------|
| AUD | Target audience is Australian students | ✓ |
| USD | Standard SaaS pricing | |
| Both | Detect location, show local | |

**User's choice:** AUD

---

## Schema & RLS Strategy

### Guest Data Adoption Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Anonymous rows | Guest searches stored with session_id, then user_id updated on signup | |
| Merge on signup | Guest data stored separately, copied into user tables | |
| You decide | Claude picks | ✓ |

**User's choice:** You decide (Claude's discretion)

### Soft Delete

| Option | Description | Selected |
|--------|-------------|----------|
| Soft delete | Keep data, mark as deleted | |
| Hard delete | Actually remove rows | |
| You decide | Claude picks | ✓ |

**User's choice:** You decide (Claude's discretion)

### Search Counter Reset

| Option | Description | Selected |
|--------|-------------|----------|
| Calendar month | Resets on the 1st of each month | ✓ |
| Rolling 30 days | Resets 30 days after first search | |
| Signup anniversary | Resets on signup date each month | |
| You decide | Claude picks | |

**User's choice:** Calendar month

---

## Project Structure

### Repo Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Single repo, /worker | One repo: src/ for Next.js, worker/ for BullMQ, shared types via /shared | ✓ |
| Turborepo monorepo | apps/web + apps/worker + packages/shared | |
| Two repos | Separate repos | |
| You decide | Claude picks | |

**User's choice:** Single repo, /worker

### Component Library

| Option | Description | Selected |
|--------|-------------|----------|
| shadcn/ui | Copy-paste components on Radix + Tailwind | |
| Pure Tailwind | Build everything from scratch | ✓ |
| You decide | Claude picks | |

**User's choice:** Pure Tailwind

### ORM

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase client | @supabase/supabase-js directly | |
| Drizzle | Type-safe SQL builder | |
| Prisma | Full ORM with migrations | ✓ |
| You decide | Claude picks | |

**User's choice:** Prisma

### RLS Management

| Option | Description | Selected |
|--------|-------------|----------|
| Prisma migrations | RLS as raw SQL in Prisma migrations | ✓ |
| Supabase dashboard | Manage RLS in Supabase UI | |
| You decide | Claude picks | |

**User's choice:** Prisma migrations

### Environment Variables

| Option | Description | Selected |
|--------|-------------|----------|
| .env files | .env.local for dev, Vercel/Railway env vars for prod | ✓ |
| You decide | Claude picks | |

**User's choice:** .env files

### Testing

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest | Fast, Vite-native | ✓ |
| Jest | Industry standard | |
| You decide | Claude picks | |

**User's choice:** Vitest

---

## Claude's Discretion

- Guest data storage mechanism (server session vs localStorage)
- Free trial offering (yes/no)
- Upgrade flow (Stripe Checkout vs embedded)
- Cancellation flow (Stripe Portal vs in-app)
- Guest data adoption pattern (anonymous rows vs merge)
- Soft delete vs hard delete

## Deferred Ideas

None — discussion stayed within phase scope
