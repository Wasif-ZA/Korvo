---
phase: 08-chat-ui-reconnection
plan: 01
subsystem: api
tags: [bullmq, stripe, prisma, supabase, auth, guest-search]

# Dependency graph
requires:
  - phase: 03-agent-pipeline
    provides: pipelineQueue export from lib/queue/pipeline
  - phase: 01-foundation
    provides: Prisma Profile model with searchesUsedThisMonth field
provides:
  - Guest searches now enqueue to BullMQ pipeline (not just DB rows)
  - Stripe checkout redirects to valid pages (/ not /dashboard)
  - /api/me returns searchesUsed + searchesLimit usage fields
  - OAuth callback at correct path with guest adoption and signup event
affects: [08-02, 08-03, ui, auth, billing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Guest pipeline enqueue: userId: null passed to pipelineQueue.add, worker handles null userId"
    - "/api/me response wrapped in { success: true, data: {...} } envelope"
    - "OAuth callback new user detection via created_at vs last_sign_in_at <5s delta"

key-files:
  created:
    - app/auth/callback/route.ts
  modified:
    - app/api/search/route.ts
    - app/api/stripe/checkout/route.ts
    - app/api/me/route.ts

key-decisions:
  - "Guest pipelineQueue.add uses userId: null — worker must handle null userId for guest searches"
  - "Stripe cancel_url is /?view=pricing not /pricing — pricing is now inside chat UI"
  - "OAuth callback redirects to / not /dashboard — home is now the single-page conversational UI"
  - "/api/me response uses { success, data } envelope to match sidebar data.success check pattern"

patterns-established:
  - "API response envelope: { success: true, data: {...} } for all /api/me reads"

requirements-completed: [AUTH-01, AUTH-04, PAY-02, PAY-03, UI-04]

# Metrics
duration: 15min
completed: 2026-04-04
---

# Phase 08 Plan 01: Backend API Route Fixes Summary

**Four broken backend routes fixed: guest searches now enqueue to BullMQ, Stripe redirects to / with session_id, /api/me returns searchesUsed + searchesLimit, OAuth callback created at app/auth/callback/route.ts with guest adoption**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-04T14:00:00Z
- **Completed:** 2026-04-04T14:17:58Z
- **Tasks:** 2
- **Files modified:** 4 (3 modified, 1 created)

## Accomplishments
- Guest searches now fully enqueue to BullMQ pipeline queue (userId: null) so they complete instead of spinning
- Stripe checkout success_url and cancel_url updated to valid single-page app routes
- /api/me returns searchesUsed and searchesLimit fields in { success, data } envelope for sidebar usage tracking
- OAuth callback recreated at app/auth/callback/route.ts (no route group) with redirect to /, new user detection, and guest search adoption

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix guest enqueue + Stripe redirect + /api/me usage fields** - `7b96a68` (included in parallel agent's commit due to lint-staged stash behavior)
2. **Task 2: Re-create OAuth callback at app/auth/callback/route.ts** - `fa8c45e` (feat)

## Files Created/Modified
- `app/api/search/route.ts` - Added second pipelineQueue.add call in guest path with userId: null
- `app/api/stripe/checkout/route.ts` - Fixed success_url (/?session_id=) and cancel_url (/?view=pricing)
- `app/api/me/route.ts` - Added searchesUsedThisMonth to select, wrapped response in { success, data } with searchesUsed + searchesLimit
- `app/auth/callback/route.ts` - New file: OAuth callback with redirect to /, new user ?event=signup param, guest adoption via prisma.search.updateMany

## Decisions Made
- `userId: null` in guest pipelineQueue.add — worker must handle null gracefully (already designed for this)
- New user detection uses 5-second delta between created_at and last_sign_in_at timestamps
- Response envelope `{ success: true, data: {...} }` added to /api/me to match sidebar's `data.success` check pattern
- cancel_url is `/?view=pricing` because the pricing UI is now rendered inside the chat layout via view param

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Lint-staged stash restoration issue during Task 1 commit caused our changes to be bundled into a pre-existing parallel agent commit (`7b96a68`). Changes are committed and verified in HEAD. Task 2 committed cleanly as `fa8c45e`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Guest pipeline enqueue is live — Plan 03 frontend polling will work for guest searches
- /api/me usage fields ready — Sidebar can display real usage counts
- OAuth callback at correct path — login/signup flows will redirect to / correctly
- Stripe checkout URLs corrected — post-payment UX will land on valid pages

---
*Phase: 08-chat-ui-reconnection*
*Completed: 2026-04-04*
