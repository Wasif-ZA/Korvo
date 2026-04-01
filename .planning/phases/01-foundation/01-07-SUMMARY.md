---
phase: 01-foundation
plan: 07
subsystem: payments
tags: [stripe, zod, checkout, env-vars, tdd]

requires:
  - phase: 01-foundation plan 05
    provides: Stripe checkout route, webhook handler, and test suite foundation

provides:
  - Server-side plan name → Stripe price ID resolution in checkout route
  - z.enum(['monthly', 'annual']) schema replacing z.string().startsWith('price_')
  - 500 response for missing env var configuration (graceful failure)
  - Price IDs resolved from STRIPE_PRO_MONTHLY_PRICE_ID/STRIPE_PRO_ANNUAL_PRICE_ID env vars only

affects: [payments, pro-subscription, pricing-page]

tech-stack:
  added: []
  patterns:
    - "Server-side plan name resolution: callers send semantic names ('monthly'/'annual'), server maps to price IDs via env vars"
    - "Env var presence check before Stripe API call — 500 on missing config, not crash"

key-files:
  created:
    - tests/stripe/checkout.test.ts (rewritten with 9 plan-name-aware tests)
  modified:
    - app/api/stripe/checkout/route.ts

key-decisions:
  - "Validation schema uses z.enum(['monthly', 'annual']) — callers are correct, server absorbs naming"
  - "Price ID resolution happens before auth check — env var misconfiguration fails fast with 500"
  - "priceIdMap typed as Record<string, string | undefined> to force undefined check before use"

patterns-established:
  - "Plan name pattern: UI sends semantic names, API route resolves to Stripe IDs — price IDs never in client JS"

requirements-completed: [PAY-01]

duration: 8min
completed: 2026-04-01
---

# Phase 1 Plan 7: Stripe Checkout Plan Name Resolution Summary

**Fixed Pro subscription blocker: checkout route now resolves 'monthly'/'annual' plan names to Stripe price IDs server-side via env vars, eliminating the 400 error every subscription attempt produced**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-01T13:43:00Z
- **Completed:** 2026-04-01T13:47:05Z
- **Tasks:** 1 (TDD)
- **Files modified:** 2

## Accomplishments
- Replaced `z.string().startsWith('price_')` with `z.enum(['monthly', 'annual'])` — matches what callers actually send
- Added server-side `priceIdMap` resolving plan names to `STRIPE_PRO_MONTHLY_PRICE_ID` / `STRIPE_PRO_ANNUAL_PRICE_ID` env vars
- `resolvedPriceId` used in `line_items` instead of raw request value — price IDs never in client JS
- 500 returned with `{ error: 'Price not configured' }` when env var is absent, not a crash
- All existing behaviors preserved: promo code lookup, auth check, session creation

## Task Commits

Each task was committed atomically:

1. **Task 1: Resolve plan name to price ID server-side in checkout route** - `f6f1c00` (feat)

**Plan metadata:** (docs commit below)

_Note: TDD — tests written first (RED), then implementation (GREEN in same commit for clarity)_

## Files Created/Modified
- `app/api/stripe/checkout/route.ts` - Updated schema + price resolution logic
- `tests/stripe/checkout.test.ts` - Rewritten with 9 tests covering all 5 plan behaviors + preserved behaviors

## Decisions Made
- Plan name resolution placed before auth check so env var misconfiguration returns 500 fast (before any Supabase calls)
- `priceIdMap` typed as `Record<string, string | undefined>` to make TypeScript enforce the undefined check
- Callers (`app/page.tsx`, `components/pricing/PricingPageClient.tsx`) left unchanged — server absorbs naming per plan instructions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

The env vars `STRIPE_PRO_MONTHLY_PRICE_ID` and `STRIPE_PRO_ANNUAL_PRICE_ID` must be set in the deployment environment (Vercel). This is pre-existing infrastructure setup, not new setup from this plan.

## Next Phase Readiness
- Gap 1 (VERIFICATION.md) closed — Pro subscription flow unblocked end-to-end
- Callers send `priceId: 'monthly'` or `priceId: 'annual'` and the server correctly resolves them
- Ready for any remaining gap closure plans

## Self-Check: PASSED

---
*Phase: 01-foundation*
*Completed: 2026-04-01*
