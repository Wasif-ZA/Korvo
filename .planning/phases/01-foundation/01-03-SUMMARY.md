---
phase: 01-foundation
plan: 03
subsystem: auth
tags: [supabase, auth, oauth, guest-flow, proxy, session]
dependency_graph:
  requires: [01-01, 01-02]
  provides: [supabase-ssr-clients, proxy-auth-guard, oauth-callback, guest-session-utilities]
  affects: [all-api-routes, all-page-routes, guest-to-user-adoption-flow]
tech_stack:
  added: ["@supabase/ssr createServerClient", "@supabase/ssr createBrowserClient"]
  patterns: ["proxy.ts auth guard (Next.js 16)", "guest localStorage session + OAuth redirectTo handoff", "prisma.search.updateMany adoption pattern"]
key_files:
  created:
    - lib/supabase/server.ts
    - lib/supabase/client.ts
    - lib/guest.ts
    - app/auth/callback/route.ts
    - app/api/guest/adopt/route.ts
    - tests/auth/guest-flow.test.ts
    - tests/auth/auth-guard.test.ts
  modified:
    - proxy.ts
decisions:
  - "proxy.ts guards /settings and /dashboard PAGE routes only — API routes independently call supabase.auth.getUser()"
  - "Guest session stored in localStorage as UUID; passed to OAuth redirectTo as guest_session param (survives redirect per Pitfall 5)"
  - "Guest data adopted via prisma.search.updateMany targeting sessionId + userId: null in a single UPDATE query"
  - "Backup adoption endpoint app/api/guest/adopt/route.ts handles edge cases where callback adoption fails"
metrics:
  duration: "12 minutes"
  completed_date: "2026-04-01"
  tasks_completed: 3
  files_created: 7
  files_modified: 1
---

# Phase 01 Plan 03: Auth System Summary

**One-liner:** Supabase SSR auth with Google OAuth callback, guest session localStorage UUID management, and seamless guest-to-user data adoption via proxy.ts page-route guard.

## What Was Built

### Task 1: Supabase SSR Clients + proxy.ts Auth Guard

**lib/supabase/server.ts** — `createSupabaseServerClient()` using `@supabase/ssr` `createServerClient` with async `cookies()` API. Used in Server Components, Route Handlers, and Server Actions for cookie-based session access. `setAll` wrapped in try/catch to safely ignore throws from Server Components.

**lib/supabase/client.ts** — `createSupabaseBrowserClient()` using `@supabase/ssr` `createBrowserClient`. Used in Client Components (`'use client'`).

**proxy.ts** — Updated from stub to full auth guard. Guards `/settings` and `/dashboard` PAGE routes only. Excludes `/api/stripe/webhooks` from matcher so the webhook handler never requires auth. API routes are intentionally NOT guarded here — each API route independently calls `supabase.auth.getUser()` as needed.

### Task 2: OAuth Callback + Guest Session Utilities

**lib/guest.ts** — localStorage-based guest session management:
- `GUEST_SEARCH_LIMIT = 3` (per D-01)
- `getOrCreateGuestSessionId()` — lazy-creates UUID on first call, persists in localStorage
- `getGuestSearchCount()` / `incrementGuestSearchCount()` — tracks searches before signup prompt
- `clearGuestSessionId()` / `clearGuestSearchCount()` — cleanup after adoption

**app/auth/callback/route.ts** — OAuth PKCE callback handler:
1. Reads `code` and `guest_session` from searchParams
2. Calls `supabase.auth.exchangeCodeForSession(code)` to complete OAuth flow
3. If user authenticated AND `guest_session` present: runs `prisma.search.updateMany({ where: { sessionId, userId: null }, data: { userId } })` to adopt all guest searches in one query
4. Redirects to `/dashboard` on success, `/` on error

**app/api/guest/adopt/route.ts** — Backup adoption endpoint for edge cases where the callback adoption fails. POST with `{ guestSessionId }`. Requires authentication (401 if not logged in). Returns `{ adopted: count }`.

### Task 3: Auth Integration Tests

**tests/auth/guest-flow.test.ts** — 14 tests covering:
- `GUEST_SEARCH_LIMIT` equals 3
- `getOrCreateGuestSessionId()` creates UUID on first call, returns same UUID on subsequent calls
- `incrementGuestSearchCount()` increments 0→1→2→3 (to GUEST_SEARCH_LIMIT)
- Adoption logic unit test with mocked Prisma verifying `{ sessionId, userId: null }` filter

**tests/auth/auth-guard.test.ts** — 11 tests covering:
- Protected routes (`/settings`, `/dashboard`, `/settings/profile`) redirect to `/` when unauthenticated
- Public routes (`/`, `/pricing`, `/api/search`) pass through when unauthenticated
- Protected routes pass through when authenticated
- Config matcher contains `api/stripe/webhooks` in negative lookahead

**All 25 tests pass.**

## Architecture Decisions

### Proxy Scope: PAGE Routes Only
`proxy.ts` guards only `/settings` and `/dashboard` page routes. API routes independently check auth via `createSupabaseServerClient() + supabase.auth.getUser()` within each handler. This design gives each API route flexibility — some are public (webhooks), some require auth, some allow guests.

### Guest Session via localStorage + Query Param Handoff
Guest session UUID stored in `localStorage`. When user triggers OAuth signup, the `guest_session` UUID is passed as a query param in the OAuth `redirectTo` URL. This survives the OAuth redirect (no server-side session storage needed, compatible with Vercel's stateless model). On callback, the UUID is read from `searchParams` and used to adopt the guest searches.

### Single-Query Adoption
Guest data adoption uses a single `prisma.search.updateMany()` targeting `{ sessionId: guestSession, userId: null }`. This atomically adopts all guest searches in one database roundtrip. The `userId: null` filter ensures authenticated rows (from other sessions) are never overwritten.

## Verification Checklist

- [x] `lib/supabase/server.ts` uses `@supabase/ssr` (not deprecated auth-helpers)
- [x] `lib/supabase/server.ts` contains `await cookies()` (async Next.js cookies API)
- [x] `lib/supabase/client.ts` exports `createSupabaseBrowserClient`
- [x] `proxy.ts` exports `async function proxy` (NOT `middleware`)
- [x] `proxy.ts` contains `supabase.auth.getUser()`
- [x] `proxy.ts` only guards `/settings` and `/dashboard` page routes
- [x] `proxy.ts` config matcher excludes `api/stripe/webhooks`
- [x] `app/auth/callback/route.ts` reads `guest_session` from searchParams
- [x] `app/auth/callback/route.ts` calls `exchangeCodeForSession`
- [x] Adoption query uses `{ sessionId, userId: null }` filter
- [x] TypeScript: zero errors from Plan 03 files (pre-existing Prisma generated-type errors from Plan 02 unaffected)
- [x] All 25 auth tests pass

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all functionality is fully implemented.

## Self-Check: PASSED
