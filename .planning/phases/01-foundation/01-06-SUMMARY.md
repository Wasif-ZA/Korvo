---
phase: 01-foundation
plan: "06"
subsystem: rate-limiting, auth-modals, search-api, settings, navbar
tags: [rate-limiting, auth, modals, search, settings, navbar, integration]
dependency_graph:
  requires: [01-03, 01-04, 01-05]
  provides: [guest-ip-rate-limiting, monthly-search-counter, search-api-stub, guest-limit-modal, monthly-limit-modal, settings-page, auth-aware-navbar]
  affects: [landing-page, navbar, all-search-flows]
tech_stack:
  added: []
  patterns: [server-side-rate-limiting, calendar-month-reset, client-server-component-split, profiles-table-display-data]
key_files:
  created:
    - lib/limits.ts
    - components/auth/GuestLimitModal.tsx
    - components/auth/MonthlyLimitModal.tsx
    - app/api/search/route.ts
    - app/api/me/route.ts
    - app/settings/page.tsx
    - app/settings/SettingsClient.tsx
    - tests/limits/rate-limits.test.ts
  modified:
    - app/page.tsx
    - components/nav/NavBar.tsx
decisions:
  - "Settings page uses client component islands (SettingsClient.tsx) for interactive actions (sign out, manage subscription) — keeps settings/page.tsx as a server component per Next.js App Router best practices"
  - "NavBar fetches profile data via /api/me endpoint rather than directly from Prisma (client component cannot call Prisma directly — server-side only)"
  - "Button asChild prop not implemented — used Link with Tailwind button classes for settings upgrade CTA (consistent with Plan 04 NavBar pattern)"
metrics:
  duration: 7min
  completed_date: "2026-04-01"
  tasks_completed: 3
  files_changed: 10
---

# Phase 1 Plan 06: Rate Limiting, Auth Modals, Search API & Settings Summary

One-liner: Server-side rate limiting (guest IP daily + monthly search counter with calendar reset), Google OAuth modal flow, /api/search stub with limitReached signal, settings page reading from profiles table, and auth-aware NavBar all wired together.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Implement server-side rate limiting (guest IP + monthly search counter) | 7a2895f | Complete |
| 2a | Build auth modals (GuestLimitModal + MonthlyLimitModal) | 62e6d30 | Complete |
| 2b | Create /api/search stub, wire landing page form, build settings page, NavBar auth-aware | 4a2366e | Complete |
| 3 | Verify complete Phase 1 flow end-to-end | — | Awaiting checkpoint |

## What Was Built

### lib/limits.ts
- `checkAndIncrementSearchLimit(userId)`: Reads profile from Prisma, handles calendar month reset inline, increments counter atomically. Returns `LimitCheckResult` with `allowed/used/limit/plan`.
- `checkGuestIpLimit(ipAddress)`: IP-based daily limit using `guest_ip_limits` table. 3 searches/day per IP.
- Constants: `FREE_SEARCH_LIMIT=5`, `PRO_SEARCH_LIMIT=50`, `FREE_DRAFT_LIMIT=5`, `GUEST_IP_DAILY_LIMIT=3`.

### components/auth/GuestLimitModal.tsx
- `dismissable={false}` — backdrop click does not dismiss (per D-03).
- "Your free search is ready." heading (UI-SPEC exact copy).
- "Continue with Google" button triggers Supabase OAuth with guest session UUID in redirectTo.
- "Not now" ghost button navigates to landing page.

### components/auth/MonthlyLimitModal.tsx
- `dismissable={true}` — can be dismissed.
- "You've used all 5 searches this month." heading (UI-SPEC exact copy).
- Primary CTA "Upgrade to Pro — $19/month" navigates to /pricing.
- "Remind me next month" ghost button calls onClose.

### app/api/search/route.ts
- Validates `{ company, role, location }` with Zod.
- Independently checks auth via `supabase.auth.getUser()` (not proxy.ts).
- Authenticated user: calls `checkAndIncrementSearchLimit`, returns `{ limitReached, limitType: 'monthly', used, limit, plan }` or `{ limitReached: false, searchId: null }`.
- Guest: extracts IP from `x-forwarded-for`, calls `checkGuestIpLimit`, returns `{ limitReached, limitType: 'guest' }` or `{ limitReached: false, searchId: null }`.
- `searchId: null` — actual agent pipeline deferred to Phase 2.

### app/api/me/route.ts
- Returns `{ fullName, avatarUrl, plan }` from profiles table.
- Per D-14/FOUND-04: never reads from JWT user_metadata.
- Returns 401 if unauthenticated, 404 if profile not found.

### app/page.tsx (updated)
- Search form now POSTs to `/api/search` on submit.
- Shows `GuestLimitModal` when `limitType === 'guest'`, `MonthlyLimitModal` when `limitType === 'monthly'`.
- Loading state on submit button.

### app/settings/page.tsx
- Server component. Redirects to `/` if unauthenticated.
- Reads profile from Prisma (`fullName`, `avatarUrl`, `plan`, `stripeCustomerId`) — not user_metadata.
- Account section: avatar (64px, rounded-full), name, email, sign-out button.
- Subscription section: plan badge, "Manage subscription" for Pro (links to Stripe Customer Portal), "You're on the Free plan" empty state + upgrade link for Free.

### app/settings/SettingsClient.tsx
- `SignOutButton`: client island that calls `supabase.auth.signOut()` then redirects to `/`.
- `ManageSubscriptionButton`: POSTs to `/api/stripe/portal` and redirects to returned URL.

### components/nav/NavBar.tsx (updated)
- Auth-aware using `onAuthStateChange` subscription for reactive state.
- Pre-auth: shows "Pricing" link + "Get started" button.
- Post-auth: shows "Dashboard" + "Settings" links + avatar dropdown.
- Avatar loaded from `profile.avatarUrl` via `/api/me` — NEVER from `user.user_metadata.avatar_url` (D-14/FOUND-04).
- Fallback: first letter of name in teal circle when no avatar.
- Dropdown on avatar click with "Sign out" option.

## Tests

- `tests/limits/rate-limits.test.ts`: 13 test cases, all passing.
  - 3 constant checks
  - 7 `checkAndIncrementSearchLimit` cases (free/pro allow/block, month boundary reset, profile-not-found)
  - 3 `checkGuestIpLimit` cases (new IP, increment, block at limit)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Button component lacks asChild/Slot support**
- **Found during:** Task 2b (settings page)
- **Issue:** Button component does not have `asChild` prop — passing it caused a TypeScript error.
- **Fix:** Used `Link` with Tailwind button classes directly for the "Upgrade to Pro" CTA in settings — consistent with the existing pattern in NavBar (per Plan 04 decision recorded in STATE.md: "NavBar CTA uses Link with Tailwind button classes").
- **Files modified:** `app/settings/page.tsx`
- **Commit:** 4a2366e

## Known Stubs

- `app/api/search/route.ts`: Returns `searchId: null` — actual search agent pipeline (Contact Finder → Email Guesser + Research Agent → Email Drafter) is deferred to Phase 2. This is intentional; the stub correctly gates searches behind rate limits.

## Self-Check

### Created files exist:
- lib/limits.ts
- components/auth/GuestLimitModal.tsx
- components/auth/MonthlyLimitModal.tsx
- app/api/search/route.ts
- app/api/me/route.ts
- app/settings/page.tsx
- app/settings/SettingsClient.tsx
- tests/limits/rate-limits.test.ts

### Commits verified:
- 7a2895f (Task 1)
- 62e6d30 (Task 2a)
- 4a2366e (Task 2b)

## Self-Check: PASSED
