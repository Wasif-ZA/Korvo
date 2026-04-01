---
phase: 01-foundation
plan: 05
subsystem: payments
tags: [stripe, webhook, checkout, customer-portal, payments, subscription]
dependency_graph:
  requires: [01-02, 01-03]
  provides: [stripe-checkout-endpoint, stripe-webhook-handler, stripe-portal-endpoint]
  affects: [profiles.plan, profiles.stripeCustomerId, profiles.stripeSubscriptionId]
tech_stack:
  added: [stripe@21.0.1]
  patterns: [raw-body-webhook, checkout-sessions, customer-portal, zod-validation, vi.hoisted-mocks]
key_files:
  created:
    - lib/stripe/client.ts
    - lib/stripe/webhooks.ts
    - app/api/stripe/checkout/route.ts
    - app/api/stripe/portal/route.ts
    - app/api/stripe/webhooks/route.ts
    - tests/stripe/webhook.test.ts
    - tests/stripe/checkout.test.ts
  modified:
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/STATE.md
decisions:
  - "Stripe apiVersion set to 2026-03-25.dahlia matching installed stripe@21.0.1 (cast as LatestApiVersion)"
  - "Webhook uses req.text() raw body — req.json() would break HMAC signature verification (Pitfall 2)"
  - "Checkout session retrieves full session via stripe.checkout.sessions.retrieve() with expand subscription — Pitfall 7 prevention"
  - "Plan stored in profiles table only via Prisma webhook handler — never user_metadata, never client-side"
  - "allow_promotion_codes removed from session params when explicit promo code is applied via discounts array to avoid Stripe conflict"
metrics:
  duration: 7min
  completed_date: "2026-04-01"
  tasks_completed: 3
  files_created: 7
  files_modified: 3
---

# Phase 1 Plan 5: Stripe Payment Integration Summary

**One-liner:** Stripe Checkout Sessions + raw-body webhook fulfillment + Customer Portal with zod validation, 13 passing tests.

## What Was Built

Complete Stripe payment integration enabling the Pro subscription flow:

1. **`lib/stripe/client.ts`** — Stripe SDK singleton initialized from `STRIPE_SECRET_KEY`. API version pinned to `2026-03-25.dahlia` (matches installed stripe@21.0.1).

2. **`app/api/stripe/checkout/route.ts`** — POST endpoint that:
   - Validates input with zod (`priceId` must start with `price_`)
   - Guards auth via `supabase.auth.getUser()` → 401 if no user
   - Creates Checkout Session with `mode: 'subscription'`, AUD support, `metadata.user_id`, `allow_promotion_codes: true`
   - If `promoCode` provided: looks up via `stripe.promotionCodes.list()` and attaches via `discounts` array (removes `allow_promotion_codes` to avoid Stripe conflict)
   - Returns `{ url: session.url }`

3. **`app/api/stripe/portal/route.ts`** — POST endpoint that:
   - Guards auth via Supabase server client
   - Reads `stripeCustomerId` from `profiles` table via Prisma
   - Returns 400 `{ error: 'No active subscription' }` if no Stripe customer
   - Creates Customer Portal session and returns `{ url: session.url }`

4. **`app/api/stripe/webhooks/route.ts`** — POST webhook handler that:
   - FIRST LINE: `const rawBody = await req.text()` (NOT `req.json()` — critical for HMAC)
   - Verifies signature via `stripe.webhooks.constructEvent(rawBody, signature, secret)`
   - Routes `checkout.session.completed` → `handleCheckoutCompleted`
   - Routes `customer.subscription.deleted` → `handleSubscriptionDeleted`
   - Returns 200 for all unhandled event types (prevents Stripe retries)

5. **`lib/stripe/webhooks.ts`** — Webhook event handlers that:
   - `handleCheckoutCompleted`: retrieves full session with `expand: ['subscription']` (Pitfall 7), updates `profiles.plan = 'pro'` + `stripeCustomerId` + `stripeSubscriptionId`
   - `handleSubscriptionDeleted`: downgrades `profiles.plan = 'free'`, clears `stripeSubscriptionId` (data kept per D-08)

6. **Tests** — 13 passing tests across two files covering all critical paths.

## Decisions Made

1. **Stripe apiVersion `2026-03-25.dahlia`**: The plan specified `2025-12-18.acacia` but installed stripe@21.0.1 uses `2026-03-25.dahlia` as its latest version. Cast as `Stripe.LatestApiVersion` to satisfy TypeScript.

2. **`allow_promotion_codes` vs `discounts`**: When a promo code is explicitly provided and found, `allow_promotion_codes` is removed and replaced with `discounts: [{ promotion_code: id }]`. Stripe throws an error if both are set simultaneously. When the promo code is not found, `allow_promotion_codes: true` remains.

3. **`vi.hoisted()`** for test mocks: Vitest hoists `vi.mock()` calls before module imports, but variable declarations in test file scope are not yet initialized at that point. `vi.hoisted()` executes the factory before hoisting, making mock references available in `vi.mock()` factories.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stripe API version mismatch**
- **Found during:** Task 1
- **Issue:** Plan specified `apiVersion: '2025-12-18.acacia'` but installed stripe@21.0.1's `LatestApiVersion` is `2026-03-25.dahlia`. Using the plan's version would cause a TypeScript type error.
- **Fix:** Used `'2026-03-25.dahlia' as Stripe.LatestApiVersion` matching the installed package.
- **Files modified:** `lib/stripe/client.ts`
- **Commit:** `23c5f12`

**2. [Rule 1 - Bug] vi.mock variable initialization order**
- **Found during:** Task 3 (first test run)
- **Issue:** `vi.mock()` factories referenced `const mockX = vi.fn()` variables declared in file scope, but `vi.mock` is hoisted before those declarations execute, causing `ReferenceError: Cannot access 'mockConstructEvent' before initialization`.
- **Fix:** Converted all mock variables to use `vi.hoisted(() => ({ ... }))` which runs before hoisting.
- **Files modified:** `tests/stripe/webhook.test.ts`, `tests/stripe/checkout.test.ts`
- **Commit:** `cc0dd20`

**3. [Rule 3 - Blocking] Merge conflicts in .planning files**
- **Found during:** Task 1 commit
- **Issue:** Parallel agent execution of plans 01-03 and 01-04 left unresolved merge conflicts in `ROADMAP.md`, `STATE.md`, and `REQUIREMENTS.md`, blocking all git commits.
- **Fix:** Resolved conflicts by merging both agents' contributions (both 01-03 and 01-04 marked complete in ROADMAP, all decisions preserved in STATE, requirements updated with correct completion status).
- **Files modified:** `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`
- **Commit:** `23c5f12`

## Known Stubs

None. All endpoints are fully implemented and connected to real dependencies (Stripe SDK, Prisma, Supabase Auth). No placeholder data flows to UI rendering.

## Self-Check: PASSED
