---
phase: 01-foundation
plan: 04
subsystem: ui
tags: [nextjs, tailwindcss, react, landing-page, pricing, stripe, lucide-react]

# Dependency graph
requires:
  - phase: 01-foundation plan 01
    provides: Button, Input, Card, cn utility — base UI components used throughout

provides:
  - Landing page with hero, search bar (3 fields), how-it-works, pricing section, footer CTA
  - Dedicated /pricing page with monthly/annual toggle and promo code input
  - NavBar component rendered in root layout on all pages
  - PricingCard, PricingToggle, PromoCodeInput reusable pricing components
  - Pro card ctaAction wired to /api/stripe/checkout with priceId and optional promoCode

affects: [01-05-stripe, 01-06-auth, 04-search-results]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server/client split for pages needing both metadata and useState (server page.tsx wraps client component)
    - Pricing toggle state lifted to page level, passed down as props to cards
    - Promo code state lifted to page level via onCodeApplied callback

key-files:
  created:
    - components/nav/NavBar.tsx
    - components/pricing/PricingCard.tsx
    - components/pricing/PricingToggle.tsx
    - components/pricing/PromoCodeInput.tsx
    - components/pricing/PricingPageClient.tsx
    - app/pricing/page.tsx
  modified:
    - app/layout.tsx
    - app/page.tsx

key-decisions:
  - "Server/client component split on /pricing page: app/pricing/page.tsx is a server component exporting metadata, PricingPageClient.tsx is the client component with useState for toggle — Next.js App Router requires this pattern when both metadata export and useState are needed"
  - "NavBar uses plain Link with Tailwind button classes instead of Button component with asChild — Button component does not support Radix Slot pattern, Link-as-button is cleaner"
  - "PricingCard receives ctaVariant prop to support both primary (Pro) and secondary (Free) CTA button styles"

patterns-established:
  - "Server page wrapper pattern: app/*/page.tsx exports metadata and renders a *Client.tsx client component for pages needing both"
  - "Pricing promo code state lifted to page level so it can be passed to ctaAction fetch call"

requirements-completed: [AUTH-02, PAY-05]

# Metrics
duration: 15min
completed: 2026-04-01
---

# Phase 1 Plan 04: Landing Page and Pricing Pages Summary

**Full landing page with hero, 3-field search bar, how-it-works, pricing with monthly/annual toggle; dedicated /pricing page with promo code input; NavBar rendered globally via root layout**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-01T12:31:00Z
- **Completed:** 2026-04-01T12:46:38Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- NavBar with sticky header, Korvo logo, Pricing link, and "Get started" primary CTA with mobile hamburger menu
- Landing page with all 5 sections: hero ("Land interviews with one search."), 3-field search bar, how-it-works steps, pricing with toggle, footer CTA
- Pricing section shows Free (AUD $0) and Pro (AUD $19/month or AUD $149/year with "Save 35%" badge), toggle switches dynamically without page reload
- Pro card ctaAction POSTs `{ priceId }` to `/api/stripe/checkout` and redirects to returned Stripe Checkout URL
- Dedicated /pricing page with same cards plus PromoCodeInput; promo code passed as `promoCode` in checkout POST body

## Task Commits

Each task was committed atomically:

1. **Task 1: Create NavBar component and update root layout** - `d51b6e5` (feat)
2. **Task 2: Build landing page with hero, search bar, how-it-works, pricing section, and footer CTA** - `b1bce52` (feat)
3. **Task 3: Build dedicated /pricing page with promo code support** - `d9a16f4` (feat)

## Files Created/Modified

- `components/nav/NavBar.tsx` - Sticky nav with logo, Pricing link, CTA button, mobile hamburger toggle
- `components/pricing/PricingToggle.tsx` - Pill-style monthly/annually toggle with aria-pressed states
- `components/pricing/PricingCard.tsx` - Reusable plan card with highlighted prop, features list with Check icons, configurable CTA variant
- `components/pricing/PromoCodeInput.tsx` - Promo code input with apply button, success state with green check, error state via Input error prop
- `components/pricing/PricingPageClient.tsx` - Client component for /pricing page with toggle + promo state, checkout wiring
- `app/pricing/page.tsx` - Server component exporting metadata, renders PricingPageClient
- `app/layout.tsx` - Added NavBar import and render above {children}
- `app/page.tsx` - Full landing page replacing placeholder stub

## Decisions Made

- **Server/client split on /pricing**: `app/pricing/page.tsx` is a server component exporting metadata; `PricingPageClient.tsx` holds all state. Next.js App Router requires this when both `export const metadata` and `useState` are needed in the same route.
- **NavBar uses Link with Tailwind classes for CTA**: The `Button` component is a plain `<button>` element without Radix Slot/asChild support. Using `Link` with button-equivalent Tailwind classes avoids wrapping a `<button>` inside an `<a>` (invalid HTML).
- **PricingCard ctaVariant prop**: Added to support secondary variant for Free card CTA without requiring two separate card components.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] NavBar: removed Button with asChild usage — Button component lacks Slot support**
- **Found during:** Task 1 (NavBar implementation)
- **Issue:** Plan specified using `Button` component for the "Get started" CTA in NavBar, but the Button component only renders a `<button>` element with no `asChild`/Radix Slot support. Wrapping `Link` inside `Button` would render invalid HTML (`<button><a>...</a></button>`).
- **Fix:** Replaced with `Link` element styled with the same Tailwind classes as the primary Button variant — visually identical, semantically correct.
- **Files modified:** `components/nav/NavBar.tsx`
- **Verification:** TypeScript check passes with no errors.
- **Committed in:** `d51b6e5` (Task 1 commit)

**2. [Rule 1 - Bug] /pricing page server/client split for metadata + useState coexistence**
- **Found during:** Task 3 (/pricing page implementation)
- **Issue:** Plan specified both `'use client'` (for toggle state) and `export const metadata` on `app/pricing/page.tsx`. In Next.js App Router, a Client Component cannot export metadata — doing so silently ignores the metadata object.
- **Fix:** Created `PricingPageClient.tsx` as the client component; `app/pricing/page.tsx` remains a server component that exports metadata and renders `<PricingPageClient />`.
- **Files modified:** `app/pricing/page.tsx`, `components/pricing/PricingPageClient.tsx` (new)
- **Verification:** TypeScript check passes; metadata is correctly exported from server component.
- **Committed in:** `d9a16f4` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both auto-fixes required for correct HTML semantics and correct Next.js metadata behavior. No scope creep.

## Issues Encountered

- Pre-existing `lib/db/prisma.ts` TypeScript error (`Cannot find module '../../generated/prisma'`) from Plan 02 — Prisma client not yet generated. This causes `next build` to fail but is outside this plan's scope. My new files (`app/page.tsx`, `app/pricing/page.tsx`, all `components/`) have zero TypeScript errors when checked in isolation.

## User Setup Required

None — no external service configuration required for this plan.

## Next Phase Readiness

- Landing page and /pricing page are complete and ready for Plan 05 (Stripe checkout route)
- NavBar is rendered globally and ready for auth-aware switching (Plan 06)
- Pro card `ctaAction` is wired to POST `/api/stripe/checkout` — Plan 05 must implement that route with `{ priceId, promoCode? }` input
- PromoCodeInput stores code locally; Stripe coupon validation happens in Plan 05

## Self-Check: PASSED

- All 8 files verified to exist on disk
- All 3 task commits verified in git log (d51b6e5, b1bce52, d9a16f4)

---
*Phase: 01-foundation*
*Completed: 2026-04-01*
