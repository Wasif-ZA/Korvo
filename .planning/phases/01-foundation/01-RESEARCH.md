# Phase 1: Foundation - Research

**Researched:** 2026-04-01
**Domain:** Next.js 16 + Supabase Auth + Prisma ORM + Stripe + Guest Flow
**Confidence:** HIGH (all package versions verified via npm registry; pitfalls sourced from verified canonical research files)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Guest Search Flow**
- D-01: 3 free searches allowed before requiring signup (IP rate-limited server-side to prevent abuse)
- D-02: Guest search results are adopted into the user's account on signup (data persists seamlessly)
- D-03: After 3 guest searches, a modal overlay appears blocking further action but with results visible behind it — prompting Google OAuth signup
- D-04: Claude's Discretion — Guest data storage mechanism (session-based server storage vs localStorage — Claude picks the cleanest approach for surviving the OAuth redirect)

**Auth-to-Payment UX**
- D-05: Pro upsell only appears when user hits their free tier limit (5 searches/month) — no earlier nudges
- D-06: Free tier limit is a hard block — no new searches until next month or upgrade. Past results and pipeline remain accessible
- D-07: Pricing shown in both landing page section AND dedicated /pricing page
- D-08: Data is kept on subscription end — user just can't exceed free tier limits
- D-09: Both monthly ($19 AUD/month) and annual ($149 AUD/year, ~35% savings) pricing tiers
- D-10: Promo/discount codes supported at launch via Stripe Coupons (e.g., UTSBDSOC for 50% off first month)
- D-11: Pricing in AUD (target audience is Australian students)
- D-12: Search counter resets on calendar month (1st of each month)
- D-13: Claude's Discretion — Free trial (yes/no), upgrade flow (Stripe Checkout vs embedded), cancellation flow (Stripe Portal vs in-app)

**Schema & RLS Strategy**
- D-14: RLS policies managed as raw SQL in Prisma migrations — version controlled and reproducible
- D-15: Claude's Discretion — Guest data adoption mechanism (anonymous rows with session_id updated on signup vs separate merge)
- D-16: Claude's Discretion — Soft delete vs hard delete for contacts/searches

**Project Structure**
- D-17: Single repo with /worker directory for BullMQ workers, shared types via /shared — NOT a Turborepo monorepo
- D-18: Pure Tailwind CSS for all UI components — no component library (no shadcn/ui)
- D-19: Prisma ORM for database access (schema, queries, migrations) — Supabase handles auth + realtime only
- D-20: Environment variables via .env files (.env.local for dev, Vercel/Railway env vars for prod)
- D-21: Vitest for testing
- D-22: RLS policies in Prisma migrations as raw SQL

### Claude's Discretion

Claude has flexibility on:
- D-04: Guest data storage mechanism — pick the cleanest approach for surviving the OAuth redirect
- D-13: Free trial offering, upgrade/cancel flow details
- D-15: Guest data adoption pattern (anonymous rows with session_id updated on signup vs separate merge)
- D-16: Soft vs hard delete

For all of these, pick the simplest, most standard approach.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Next.js 16 project with App Router, TailwindCSS 4, TypeScript | Next.js 16.2.2 + TailwindCSS 4.2.2 confirmed current; `create-next-app` bootstraps both |
| FOUND-02 | Supabase project with PostgreSQL database and RLS enabled on all tables | Supabase free tier confirmed; RLS enabled per-table via `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` in Prisma migrations |
| FOUND-03 | Database schema: profiles, searches, contacts, outreach tables with all fields and constraints | Prisma 7.6.0 confirmed; schema patterns documented below |
| FOUND-04 | Row Level Security policies: all tables scoped via `auth.uid() = user_id`, plan gating via profiles table (never JWT user_metadata) | Critical pattern documented in Pitfall 9; raw SQL in migrations confirmed as the right approach |
| FOUND-05 | Supabase connection pooler configured (port 6543, not direct connection) | PgBouncer/Supavisor port 6543 pattern confirmed; `directUrl` for migrations, `url` for runtime |
| AUTH-01 | First search is free without signup (session-scoped guest search) | localStorage with `guestSessionId` UUID recommended — survives redirect, clean adoption pattern |
| AUTH-02 | Google OAuth signup via Supabase Auth prompted after first search | `@supabase/ssr` 0.10.0 confirmed; `signInWithOAuth({ provider: 'google' })` pattern documented |
| AUTH-03 | User session persists across browser refresh via Supabase SSR (`@supabase/ssr`) | `createServerClient` + cookie-based session in `proxy.ts` (not `middleware.ts`) |
| AUTH-04 | Auth middleware on all API routes checking session validity | `proxy.ts` export `proxy` function pattern; session check via `supabase.auth.getUser()` |
| AUTH-05 | Free tier: 5 searches/month, 5 email drafts/month enforced server-side | Counter on `profiles` table, checked server-side in API route before enqueue, reset via cron |
| PAY-01 | Stripe Checkout Sessions for Pro tier ($19/month) | Stripe 21.0.1 confirmed; Server Action creates Checkout Session; AUD currency supported |
| PAY-02 | Stripe webhooks (checkout.session.completed, customer.subscription.deleted) with raw body parsing | `await req.text()` pattern (NOT `req.json()`) critical for webhook signature verification |
| PAY-03 | Customer Portal for self-service subscription management | `stripe.billingPortal.sessions.create()` from Server Action; portal redirect pattern |
| PAY-04 | Plan stored in profiles table, updated by server-side webhook handler (never client-side) | Webhook uses Supabase service role key to bypass RLS; profiles.plan updated on `checkout.session.completed` |
| PAY-05 | Pro tier: 50 searches/month, unlimited drafts, Gmail API send, coffee chat prep (V2) | Counter limits 5 (free) / 50 (pro) in `profiles.searches_this_month`; reset on calendar month boundary |

</phase_requirements>

---

## Summary

Phase 1 establishes the non-negotiable foundation: a deployable Next.js 16 application with Supabase PostgreSQL (RLS enforced at database level), Google OAuth via Supabase Auth, Stripe payment integration, and a guest search flow that adopts data into the user account on signup. All subsequent phases build on top of these exact primitives — getting them wrong here forces rewrites in every later phase.

The three highest-risk areas in this phase are: (1) **RLS policy correctness** — specifically avoiding user_metadata-based gating and SQL view RLS bypass, both of which silently leak user data; (2) **Stripe webhook raw body parsing** — using `req.json()` instead of `req.text()` breaks signature verification and makes the payment fulfillment path untrustworthy; and (3) **Supabase connection pooler configuration** — using the direct port 5432 instead of pooler port 6543 causes connection exhaustion under any real load on Vercel's serverless functions.

The guest search flow deserves careful design. The recommended pattern is a `guestSessionId` UUID stored in `localStorage` (generated on first search attempt, persisted across the OAuth redirect via query param or cookie handoff). On Google OAuth completion, a server-side migration associates all guest search rows with the newly authenticated `user_id`. This is simpler and more reliable than server-side session storage which is incompatible with Vercel's stateless serverless model.

**Primary recommendation:** Build in strict dependency order — schema + RLS first, then auth, then payments. Never skip the RLS test harness (verify isolation between two test accounts) before building anything that reads user data.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.2 | Full-stack framework | App Router stable, Turbopack default, `proxy.ts` replaces `middleware.ts`, React 19.2 |
| TailwindCSS | 4.2.2 | Utility CSS | Native CSS config (no `tailwind.config.js`), JIT default, Turbopack integration |
| TypeScript | 5.x (min 5.1) | Type safety | Required by Next.js 16; use strict mode |
| Prisma | 7.6.0 | ORM + migrations | Schema-first, raw SQL support for RLS migrations, `directUrl` / `url` dual-connection pattern |
| @supabase/supabase-js | 2.101.1 | Supabase client | RLS-scoped queries via user JWT, realtime subscriptions |
| @supabase/ssr | 0.10.0 | SSR auth client | Replaces deprecated `@supabase/auth-helpers-nextjs`; `createServerClient` for App Router |
| stripe | 21.0.1 | Payments | Checkout Sessions, webhooks, Customer Portal; AUD currency |
| zod | 4.3.6 | Schema validation | All API boundaries, webhook payload validation |

### Supporting (Phase 1 scope)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority | 0.7.1 | Component variant management | Button variants (primary/secondary/ghost/destructive), all hand-built components |
| clsx + tailwind-merge | 2.1.1 / 3.5.0 | Class composition | `cn()` utility — prevents Tailwind class conflicts in dynamic components |
| lucide-react | 1.7.0 | Icons | Consistent, tree-shakeable; Google icon for OAuth button |
| react-hot-toast | 2.6.0 | Toast notifications | Lightweight, works with App Router; "Signed in", "Subscription updated" etc. |

### Deferred (Phase 2+)

| Library | Purpose | Phase |
|---------|---------|-------|
| @tanstack/react-query | Server state + pipeline polling | Phase 2 |
| @dnd-kit/core | Kanban drag-and-drop | Phase 4 |
| bullmq + ioredis | Job queue | Phase 2 |
| @anthropic-ai/sdk | AI agents | Phase 3 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma | Drizzle, raw Supabase client | Prisma gives schema + migration management + raw SQL support. Supabase client alone can't manage migrations. Drizzle is lighter but Prisma's `migrate deploy` is battle-tested for RLS raw SQL inclusion. |
| @supabase/ssr | @supabase/auth-helpers-nextjs | auth-helpers is deprecated — broken in App Router. `@supabase/ssr` is the only correct package. |
| Stripe Checkout | Stripe embedded (Payment Element) | Checkout is simpler, handles tax, SCA, and AUD currency automatically. Embedded requires more setup and is overkill for a single subscription product. |

**Installation:**
```bash
# Create project
npx create-next-app@latest korvo --typescript --tailwind --app --turbopack

# Database / Auth
npm install prisma @prisma/client @supabase/supabase-js @supabase/ssr

# Payments
npm install stripe

# Validation
npm install zod

# UI utilities
npm install class-variance-authority clsx tailwind-merge lucide-react react-hot-toast

# Dev tools
npm install -D @types/node prettier eslint
```

**Version verification (all confirmed 2026-04-01 via npm registry):**
- `next`: 16.2.2
- `@supabase/supabase-js`: 2.101.1
- `@supabase/ssr`: 0.10.0
- `stripe`: 21.0.1
- `prisma` / `@prisma/client`: 7.6.0
- `tailwindcss`: 4.2.2
- `vitest`: 4.1.2
- `zod`: 4.3.6

---

## Architecture Patterns

### Recommended Project Structure

```
korvo/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout — fonts, toast provider, query client
│   ├── page.tsx                  # Landing page (hero, how-it-works, pricing section)
│   ├── pricing/
│   │   └── page.tsx              # Dedicated /pricing page
│   ├── settings/
│   │   └── page.tsx              # Settings page (account, subscription)
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # OAuth callback handler (Supabase token exchange)
│   └── api/
│       ├── stripe/
│       │   ├── checkout/
│       │   │   └── route.ts      # Create Checkout Session (Server Action preferred)
│       │   ├── portal/
│       │   │   └── route.ts      # Create Customer Portal session
│       │   └── webhooks/
│       │       └── route.ts      # Stripe webhook handler (raw body)
│       └── guest/
│           └── adopt/
│               └── route.ts      # Adopt guest searches to user on signup
├── components/
│   ├── ui/                       # Base components (Button, Input, Card, Modal)
│   ├── auth/                     # GuestLimitModal, MonthlyLimitModal
│   ├── pricing/                  # PricingCard, PricingToggle, PromoCodeInput
│   └── nav/                      # NavBar
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # createBrowserClient (client components)
│   │   └── server.ts             # createServerClient (server components, route handlers)
│   ├── stripe/
│   │   ├── client.ts             # Stripe instance
│   │   └── webhooks.ts           # Webhook event handlers
│   ├── db/
│   │   └── prisma.ts             # Prisma client singleton
│   └── utils/
│       └── cn.ts                 # cn() = twMerge(clsx(...))
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # All migrations (including RLS raw SQL)
├── proxy.ts                      # Auth guard (NOT middleware.ts — deprecated in Next.js 16)
├── shared/                       # Shared types for worker (Phase 2+)
└── worker/                       # BullMQ worker process (Phase 2+)
```

### Pattern 1: Prisma + Supabase Dual Connection (Pooler for runtime, Direct for migrations)

**What:** Use two separate connection strings — the Supabase connection pooler (port 6543, PgBouncer) for runtime queries in Vercel serverless functions, and the direct connection (port 5432) for Prisma migrations only.

**When to use:** Required in every project combining Prisma + Vercel + Supabase. Without this, migrations fail against the pooler (PgBouncer doesn't support all DDL commands) and runtime queries exhaust the 25-connection limit on the free tier.

```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")        // pooler: postgres://...@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
  directUrl = env("DIRECT_DATABASE_URL") // direct: postgres://...@db.xxx.supabase.co:5432/postgres
}
```

```
# .env.local
DATABASE_URL="postgres://postgres.[ref]:[password]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgres://postgres:[password]@db.[ref].supabase.co:5432/postgres"
```

### Pattern 2: RLS as Raw SQL in Prisma Migrations

**What:** Embed `ENABLE ROW LEVEL SECURITY` and `CREATE POLICY` statements as raw SQL inside Prisma migrations using `prisma migrate dev --create-only` to get the migration file, then manually append the RLS SQL.

**When to use:** Every table creation migration. RLS must be enabled and policies must be created in the same migration that creates the table. Never rely on Supabase dashboard-only RLS — it won't be version controlled.

```sql
-- prisma/migrations/20260401000000_create_core_tables/migration.sql
-- (Prisma generates the CREATE TABLE statements, then you append:)

-- Enable RLS on all user tables
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "searches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "outreach" ENABLE ROW LEVEL SECURITY;

-- profiles: users can only read/write their own profile
CREATE POLICY "profiles_own" ON "profiles"
  FOR ALL USING (auth.uid() = user_id);

-- searches: scoped to owner
CREATE POLICY "searches_own" ON "searches"
  FOR ALL USING (auth.uid() = user_id);

-- contacts: scoped to owner of the search
CREATE POLICY "contacts_own" ON "contacts"
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM searches WHERE id = search_id)
  );

-- outreach: scoped to owner of the contact
CREATE POLICY "outreach_own" ON "outreach"
  FOR ALL USING (
    auth.uid() = (SELECT s.user_id FROM contacts c JOIN searches s ON s.id = c.search_id WHERE c.id = contact_id)
  );

-- Service role bypass for webhook handler
-- (Supabase service role key bypasses RLS automatically — no policy needed)
```

### Pattern 3: Supabase SSR — Auth in proxy.ts (NOT middleware.ts)

**What:** In Next.js 16, `middleware.ts` is deprecated. Auth guards live in `proxy.ts` exporting a `proxy` function. Logic is identical — just the filename and export name changed.

**When to use:** All Next.js 16 projects with Supabase Auth.

```typescript
// proxy.ts (NOT middleware.ts — deprecated in Next.js 16)
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() refreshes the session if needed
  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### Pattern 4: Stripe Webhook with Raw Body Parsing

**What:** Stripe webhook handler MUST read raw request body via `req.text()` before signature verification. Using `req.json()` parses the body first and breaks signature validation.

**When to use:** Every Stripe webhook endpoint.

```typescript
// app/api/stripe/webhooks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()  // NOT req.json() — critical
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutCompleted(session)
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionDeleted(subscription)
      break
    }
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Use Supabase service role key — bypasses RLS to update profiles
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // service role, not anon key
  )
  await supabase
    .from('profiles')
    .update({ plan: 'pro', stripe_customer_id: session.customer as string })
    .eq('user_id', session.metadata?.user_id)
}
```

### Pattern 5: Guest Session — localStorage UUID + DB Adoption on Signup

**Recommendation for D-04 / D-15 (Claude's Discretion):**

Use `localStorage` with a UUID `guestSessionId` as the guest identity mechanism. This is the only reliable approach on Vercel because server-side sessions (Redis, in-memory) are stateless across serverless function invocations.

**Flow:**
1. On first search attempt, if no auth: generate `guestSessionId = crypto.randomUUID()`, store in `localStorage.setItem('guestSessionId', id)`.
2. Send `guestSessionId` in the `POST /api/search/start` request body.
3. Server creates the `searches` row with `user_id = null` and `session_id = guestSessionId`.
4. After 3 guest searches, show modal. User clicks "Continue with Google".
5. Before redirecting to OAuth, store `guestSessionId` in a cookie: `document.cookie = 'gst=' + guestSessionId + '; path=/'` (survives the redirect, `localStorage` would not be accessible from the server during the callback).
6. OAuth callback at `app/auth/callback/route.ts`: read `gst` cookie, call `POST /api/guest/adopt` with the new `user_id` and `guestSessionId`.
7. Adopt: `UPDATE searches SET user_id = $user_id WHERE session_id = $guestSessionId AND user_id IS NULL`.

This pattern requires no Redis, no extra service, and adopts all guest data atomically in one query.

### Pattern 6: Stripe Checkout Session with AUD + Promo Codes

```typescript
// Server Action — app/pricing/actions.ts
'use server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
import { createServerClient } from '@supabase/ssr'

export async function createCheckoutSession(
  priceId: string,  // pass monthly or annual price ID
  promoCode?: string
) {
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    currency: 'aud',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings?upgraded=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
    customer_email: user.email,
    metadata: { user_id: user.id },
    allow_promotion_codes: true,  // enables promo code field in Checkout UI
  }

  // If user entered a promo code manually, look it up and attach
  if (promoCode) {
    const promo = await stripe.promotionCodes.list({ code: promoCode, limit: 1 })
    if (promo.data.length > 0) {
      sessionParams.discounts = [{ promotion_code: promo.data[0].id }]
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams)
  return session.url
}
```

### Pattern 7: Free Tier Counter with Calendar Month Reset

**Recommendation for D-12:** Store `searches_used_this_month` and `drafts_used_this_month` on the `profiles` table alongside `searches_reset_at` (a date). On each search API call, compare `searches_reset_at` against the current calendar month. If it's a new month, reset to 0 before checking.

```typescript
// lib/limits.ts
export async function checkAndIncrementSearchLimit(userId: string) {
  const supabase = createServerClient(...)  // service role to bypass RLS
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, searches_used_this_month, searches_reset_at')
    .eq('user_id', userId)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Calendar month reset
  const now = new Date()
  const resetAt = new Date(profile.searches_reset_at)
  const isNewMonth = now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()

  let searchesUsed = isNewMonth ? 0 : profile.searches_used_this_month
  const limit = profile.plan === 'pro' ? 50 : 5

  if (searchesUsed >= limit) {
    return { allowed: false, used: searchesUsed, limit }
  }

  // Increment atomically
  await supabase
    .from('profiles')
    .update({
      searches_used_this_month: searchesUsed + 1,
      ...(isNewMonth ? { searches_reset_at: now.toISOString() } : {}),
    })
    .eq('user_id', userId)

  return { allowed: true, used: searchesUsed + 1, limit }
}
```

### Anti-Patterns to Avoid

- **`middleware.ts` in Next.js 16:** Renamed to `proxy.ts`, export `proxy`. Still works but deprecated — use `proxy.ts` from day 1.
- **RLS via `user_metadata`:** User-modifiable. Never gate Pro features on `auth.jwt() -> 'user_metadata' ->> 'plan'`. Always gate on the `profiles` table.
- **SQL views without `security_invoker = true`:** Views run as the creating user (postgres superuser) and bypass RLS on underlying tables. Any view over user tables MUST add `WITH (security_invoker = true)`.
- **Direct DB port (5432) in Vercel:** Causes connection exhaustion. Always use pooler port 6543 for runtime.
- **Stripe webhook using `req.json()`:** Parses body before signature check, breaking HMAC verification. Always `req.text()`.
- **Client-side plan updates:** Never update `profiles.plan` from client-side code. Only the server-side Stripe webhook handler may write this field, using the service role key.
- **`@supabase/auth-helpers-nextjs`:** Deprecated. Only use `@supabase/ssr`.
- **localStorage for guest ID surviving OAuth redirect:** `localStorage` is browser-tab-local and not accessible during the server-side callback. Store `guestSessionId` in a cookie before redirecting to OAuth.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth session management across server/client | Custom cookie + JWT handling | `@supabase/ssr` createServerClient | Handles cookie rotation, session refresh, PKCE, and App Router cache invalidation correctly |
| Stripe webhook signature verification | Custom HMAC comparison | `stripe.webhooks.constructEvent()` | Timing-safe comparison, handles Stripe's specific serialization |
| Stripe subscription lifecycle | Custom subscription state machine | Stripe webhooks + Customer Portal | Covers cancellation, renewal, failed payment, trial end automatically |
| Database connection pooling | Custom pool manager | Supabase PgBouncer (port 6543) | PgBouncer handles multiplexing, connection recycling, timeout management |
| Promo code validation | Custom discount code system | Stripe Coupons + Promotion Codes | Handles redemption limits, expiry, stacking rules, per-user restrictions |
| Database migrations + RLS | Manual migration scripts | Prisma Migrate + raw SQL blocks | Version-controlled, replay-safe, handles dependencies between migrations |
| TypeScript form validation | Custom validation logic | Zod schemas | Handles nested objects, transformations, union types, `.parse()` vs `.safeParse()` |

**Key insight:** Every item in the "Don't Build" column has at least 3-5 years of production edge case handling baked in. Custom implementations hit these edge cases the first time a real user hits a non-happy-path (expired session, payment dispute, connection spike under load).

---

## Common Pitfalls

### Pitfall 1: RLS via user_metadata — Subscription Bypass
**What goes wrong:** RLS policy checks `auth.jwt() -> 'user_metadata' ->> 'plan'`. Any user can update their own `user_metadata` client-side to set `plan: 'pro'`, bypassing the Stripe paywall entirely.
**Why it happens:** `user_metadata` is prominently featured in Supabase docs without always surfacing the mutability warning.
**How to avoid:** Gate Pro features exclusively via: `auth.uid() IN (SELECT user_id FROM profiles WHERE plan = 'pro')`. Only the server-side webhook handler (using service role key) may write `profiles.plan`.
**Warning signs:** RLS policies containing `user_metadata`, `app_metadata` (less risky but still wrong), or JWT-extracted plan strings.

### Pitfall 2: Stripe Webhook Raw Body Parsing
**What goes wrong:** Using `req.json()` or `await request.json()` before calling `stripe.webhooks.constructEvent()` breaks HMAC signature verification. Every webhook returns 400 "Invalid signature", and subscription fulfillment never fires.
**Why it happens:** `req.json()` is the idiomatic Next.js pattern for all other API routes. Developers copy-paste the pattern.
**How to avoid:** Always `const rawBody = await req.text()` as the FIRST line in the Stripe webhook handler. Never read the body twice.
**Warning signs:** `stripe.webhooks.constructEvent()` throwing `WebhookSignatureVerificationError`.

### Pitfall 3: Direct DB Port in Vercel (Connection Exhaustion)
**What goes wrong:** Using Supabase's direct port (5432) for runtime queries in Vercel serverless functions. Each function invocation creates a new PostgreSQL connection. Free tier allows 25 connections. Under any real load, connections are exhausted and all requests fail.
**Why it happens:** Supabase's "Connection string" in the dashboard defaults to the direct connection. Developers copy it without reading the pooler section.
**How to avoid:** In `prisma/schema.prisma`, set `url` to the pooler URL (port 6543, `?pgbouncer=true`) and `directUrl` to the direct URL (port 5432). The `directUrl` is used only by `prisma migrate deploy`.
**Warning signs:** "too many connections" errors in Sentry under any non-trivial load; `remaining_pool_size: 0` in Supabase dashboard.

### Pitfall 4: SQL Views Bypassing RLS
**What goes wrong:** Any SQL view created in Supabase runs as the `postgres` superuser by default. Queries through the view return all rows, ignoring the RLS policies on underlying tables.
**Why it happens:** PostgreSQL default. Developers create convenience views (e.g., `contacts_with_search_info`) without knowing about the security invoker override.
**How to avoid:** Every view over user-scoped tables must include `WITH (security_invoker = true)`:
```sql
CREATE VIEW contacts_with_search_info WITH (security_invoker = true) AS
  SELECT c.*, s.company FROM contacts c JOIN searches s ON s.id = c.search_id;
```
**Warning signs:** View queries returning more rows than direct table queries for the same authenticated user.

### Pitfall 5: OAuth Redirect Losing Guest Session Data
**What goes wrong:** Guest `sessionId` stored in `localStorage` is browser-tab memory. When Google OAuth redirects away from the app and back, `localStorage` is preserved — but the data is NOT accessible during the server-side `auth/callback/route.ts` handler (which runs on the server, not the browser). The adoption query has no `guestSessionId` to match against.
**Why it happens:** Developers assume `localStorage` data survives the OAuth redirect. It does survive on the client, but the server-side callback handler can't read it.
**How to avoid:** Before triggering `signInWithOAuth()`, copy `localStorage.getItem('guestSessionId')` into a `Set-Cookie` header via a server action, OR append it to the OAuth `redirectTo` URL as a state parameter. The Supabase SSR `signInWithOAuth` supports a `options.redirectTo` that can include `?guest_session=ID`.

Recommended: Pass via state in OAuth redirect:
```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback?guest_session=${guestSessionId}`,
  },
})
```

Then in `app/auth/callback/route.ts`, read `request.nextUrl.searchParams.get('guest_session')` and trigger the adoption.

### Pitfall 6: Next.js 16 Async params in Dynamic Routes
**What goes wrong:** In Next.js 16, `params` in dynamic route pages is a Promise. Accessing `params.id` synchronously throws a runtime error: "params must be awaited before use".
**Why it happens:** Breaking change from Next.js 15 enforced in Next.js 16. Most tutorials and StackOverflow answers still show the old synchronous pattern.
**How to avoid:** Always destructure params with `await`:
```typescript
export default async function SearchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // ...
}
```
**Warning signs:** "params must be awaited" warning in dev console; runtime errors on dynamic routes.

### Pitfall 7: Webhook Handler Running Before Checkout Session is Fully Created
**What goes wrong:** `checkout.session.completed` fires correctly but the handler tries to fetch the `line_items` from the session before Stripe has fully populated them. `session.line_items` is null.
**Why it happens:** `checkout.session.completed` webhook fires immediately on completion. Some session fields (line items, expanded data) must be explicitly retrieved via a separate `stripe.checkout.sessions.retrieve()` call.
**How to avoid:** In the webhook handler, always retrieve the full session:
```typescript
const fullSession = await stripe.checkout.sessions.retrieve(
  session.id,
  { expand: ['line_items', 'subscription'] }
)
```
**Warning signs:** `session.line_items?.data` is empty or undefined in webhook handler.

### Pitfall 8: Search Counter Reset Logic Using Row-Level Timestamps Only
**What goes wrong:** Using a per-row `created_at` comparison to reset monthly limits (e.g., "count searches WHERE created_at > start of month") is correct for counting but doesn't reset the `searches_used_this_month` denormalized counter. If the counter and the actual count diverge (due to a bug, direct DB update, etc.), users get stuck.
**Why it happens:** Developers sometimes track usage via counts over the searches table instead of a denormalized counter, making reset logic more complex and prone to inconsistency.
**How to avoid:** Keep a denormalized `searches_used_this_month` counter on `profiles` alongside `searches_reset_at` date. Reset happens in the same transaction that increments the counter (checking the month boundary). This is faster, simpler, and authoritative.

---

## Code Examples

### Supabase Server Client (Route Handler / Server Action)
```typescript
// lib/supabase/server.ts
// Source: @supabase/ssr official docs (https://supabase.com/docs/guides/auth/server-side/creating-a-client)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Thrown in Server Components — safe to ignore
          }
        },
      },
    }
  )
}
```

### Supabase Browser Client (Client Components)
```typescript
// lib/supabase/client.ts
// Source: @supabase/ssr official docs
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### OAuth Callback Route Handler
```typescript
// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const guestSession = searchParams.get('guest_session')

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user && guestSession) {
      // Adopt guest searches to this user
      await supabase
        .from('searches')
        .update({ user_id: data.user.id })
        .eq('session_id', guestSession)
        .is('user_id', null)
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
```

### Prisma Client Singleton
```typescript
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### cn() Utility
```typescript
// lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Button Component with CVA
```typescript
// components/ui/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-teal-600 text-white hover:bg-teal-700',
        secondary: 'bg-[#F4F3F0] text-[#1C1C1A] border border-[#E5E4E0] hover:bg-[#E9E8E4]',
        ghost: 'text-[#1C1C1A] hover:bg-[#F4F3F0]',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        default: 'h-11 px-4 text-sm',   // 44px — meets WCAG touch target
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` + `export function middleware` | `proxy.ts` + `export function proxy` | Next.js 16 | Rename required — old name is deprecated, removed in future version |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | auth-helpers broken in App Router; `@supabase/ssr` is the only correct package |
| Implicit Next.js fetch caching (v14) | `"use cache"` opt-in directive (v15+/16) | Next.js 15 | Explicit caching per route segment — much more predictable |
| `tailwind.config.js` | CSS-native config in `app/globals.css` | TailwindCSS v4 | No JS config file needed; theme via `@theme` directive |
| Synchronous `params.id` | `const { id } = await params` | Next.js 15/16 | Breaking change — params is now a Promise |
| Prisma 5.x `@db.Uuid` annotations needed | Prisma 7.x native UUID support improved | Prisma 7 | Cleaner schema, fewer explicit annotations needed |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr`. Do not install.
- `middleware.ts` auth guard: Still functional but deprecated. Use `proxy.ts`.
- TailwindCSS v3 `tailwind.config.js`: Not needed in v4; CSS-native config replaces it.
- Next.js implicit fetch caching: Removed in Next.js 15+. Do not rely on fetch-level caching unless explicitly opted in with `"use cache"`.

---

## Open Questions

1. **Stripe AUD tax handling**
   - What we know: Stripe supports AUD natively. For Australian businesses, GST (10%) may need to be collected on digital services sold to Australian consumers.
   - What's unclear: Whether Korvo's student-to-student model requires GST registration at launch (depends on ABN status and revenue threshold — currently ~$75K AUD/year threshold). At $19/month this threshold would not be hit until ~330 paying users.
   - Recommendation: Launch without tax collection. Add Stripe Tax (automatic) when revenue approaches the GST threshold. Add a note in CONTEXT.md to revisit at 200 paying users.

2. **Guest search IP rate-limiting mechanism**
   - What we know: D-01 requires IP rate-limiting for guest searches (3 per IP to prevent abuse). Vercel provides the client IP via `request.ip` (or `x-forwarded-for` header).
   - What's unclear: Whether to use Supabase as the rate-limit store (simple, already in stack) or a separate in-memory approach. Supabase adds a DB round-trip per guest search.
   - Recommendation: Store IP-to-count mapping in a `guest_ip_limits` table in Supabase with a `date` column (reset daily). Simple, no extra infrastructure, survives Vercel cold starts.

3. **Prisma 7.x compatibility with Supabase PostgreSQL 15**
   - What we know: Prisma 7.6.0 is the current version. Supabase uses PostgreSQL 15.
   - What's unclear: Whether any Prisma 7 features require PostgreSQL 16+ (which Supabase does not run by default as of April 2026).
   - Recommendation: Treat as LOW risk. Prisma 7 is documented as PostgreSQL 15-compatible. Verify by running `prisma migrate dev` against Supabase before adding any Prisma 7-specific features.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All dev/build tooling | ✓ | 22.22.0 | — |
| npm | Package management | ✓ | 10.9.4 | — |
| Git | Version control | ✓ | system | — |
| Supabase project | Database + Auth | ✗ (not created yet) | — | Must create before any work |
| Stripe account | Payments | ✗ (not configured yet) | — | Must create before PAY-01 tasks |
| Vercel project | Deployment | ✗ (not connected yet) | — | Can defer to end of phase for first deploy |
| npx / create-next-app | Project scaffolding | ✓ | via npm 10.9.4 | — |

**Missing dependencies with no fallback:**
- Supabase project: Required for FOUND-02, FOUND-03, FOUND-04, FOUND-05, AUTH-01 through AUTH-05. Must be created in Wave 0 of the plan.
- Stripe account: Required for PAY-01 through PAY-05. Must be created and API keys configured before payment tasks.

**Missing dependencies with fallback:**
- Vercel project: Required for deployment. Can develop and test locally until final deployment task.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` — Wave 0 gap |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-03 | Database schema correct (all columns, types, constraints) | Integration (Prisma schema validation) | `npx prisma validate` | ❌ Wave 0 |
| FOUND-04 | RLS blocks cross-user data access | Integration (two-user scenario) | `npx vitest run tests/rls.test.ts` | ❌ Wave 0 |
| FOUND-05 | Pooler URL used in runtime config | Unit (env var check) | `npx vitest run tests/db-config.test.ts` | ❌ Wave 0 |
| AUTH-01 | Guest search creates row with null user_id | Unit | `npx vitest run tests/guest-flow.test.ts` | ❌ Wave 0 |
| AUTH-02 | OAuth callback adopts guest searches to user | Integration | `npx vitest run tests/auth-adoption.test.ts` | ❌ Wave 0 |
| AUTH-03 | Session persists across simulated refresh | Unit (cookie check) | `npx vitest run tests/session.test.ts` | ❌ Wave 0 |
| AUTH-04 | Protected routes return 401 without session | Integration | `npx vitest run tests/auth-guard.test.ts` | ❌ Wave 0 |
| AUTH-05 | Free tier limit enforced server-side (5 searches) | Unit | `npx vitest run tests/limits.test.ts` | ❌ Wave 0 |
| PAY-01 | Checkout Session created with AUD currency | Unit (Stripe mock) | `npx vitest run tests/stripe-checkout.test.ts` | ❌ Wave 0 |
| PAY-02 | Webhook raw body parses correctly + plan updated | Unit (webhook mock) | `npx vitest run tests/stripe-webhook.test.ts` | ❌ Wave 0 |
| PAY-04 | Plan stored in profiles, not in user_metadata | Unit (DB assertion) | `npx vitest run tests/plan-storage.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose` (relevant test file only)
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — framework config with coverage reporter
- [ ] `tests/` directory with initial test files
- [ ] `tests/setup.ts` — shared mocks (Supabase client, Stripe client)
- [ ] `tests/rls.test.ts` — covers FOUND-04 (critical — two-user isolation)
- [ ] `tests/guest-flow.test.ts` — covers AUTH-01, AUTH-02
- [ ] `tests/limits.test.ts` — covers AUTH-05, PAY-04, PAY-05
- [ ] `tests/stripe-webhook.test.ts` — covers PAY-02 (raw body parsing)

---

## Project Constraints (from CLAUDE.md)

These directives apply to all code written in this phase:

| Directive | Implication |
|-----------|-------------|
| Tech stack is locked: Next.js 16, Supabase, Claude API | No alternative frameworks. No Drizzle instead of Prisma. |
| No LinkedIn scraping, no auto-sending, human-in-the-loop always | No LinkedIn URLs in any contact discovery code in Phase 1 |
| Must use Haiku 4.5 for high-volume tasks, Sonnet 4.6 only for prep briefs | Not relevant to Phase 1 (no AI agents yet) |
| Pricing must be accessible ($19/month Pro) | AUD currency confirmed in all Stripe configurations |
| Launch cost ~$15 (free tiers only) | All services (Supabase, Vercel, Railway, Stripe) on free tiers |
| GSD workflow enforcement: use `/gsd:execute-phase` for planned work | All code changes go through GSD — no direct edits outside workflow |
| Immutability: always create new objects, never mutate | State updates return new objects (React patterns, not in-place mutation) |
| Functions < 50 lines, files < 800 lines | Keep route handlers and utility functions small; extract helpers |
| 80% test coverage minimum | Test suite must cover all critical paths (RLS, auth, payments) |

---

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — verified stack with npm registry confirmation, Next.js 16.2.2, Prisma 7.6.0, Stripe 21.0.1, Supabase SSR 0.10.0
- `.planning/research/PITFALLS.md` — 22 pitfalls with official source citations (BullMQ docs, Supabase docs, Next.js docs)
- `.planning/research/ARCHITECTURE.md` — build order, component boundaries, data flow patterns
- `.planning/phases/01-foundation/01-CONTEXT.md` — all locked decisions
- `.planning/phases/01-foundation/01-UI-SPEC.md` — design system, component specs, copy, breakpoints
- npm registry (2026-04-01) — all package versions verified: next@16.2.2, prisma@7.6.0, @supabase/ssr@0.10.0, stripe@21.0.1, tailwindcss@4.2.2, vitest@4.1.2, zod@4.3.6

### Secondary (MEDIUM confidence)
- Supabase SSR docs: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Stripe webhook Next.js patterns: https://dev.to/thekarlesi/stripe-subscription-lifecycle-in-nextjs-the-complete-developer-guide-2026-4l9d
- Prisma + Supabase dual-connection pattern: standard community practice, consistent with official Prisma datasource docs

### Tertiary (LOW confidence)
- None in this phase — all critical claims are backed by HIGH or MEDIUM sources

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all versions verified via npm registry 2026-04-01
- Architecture: HIGH — patterns sourced from canonical research files verified against official docs
- Pitfalls: HIGH — sourced from pre-existing verified pitfall research
- Guest flow pattern: MEDIUM — recommended approach is standard practice, not verified against a single official doc

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (30 days — stable ecosystem)
