---
phase: 07-search-flow-guest-access
plan: "01"
subsystem: ui
tags: [search, api-wiring, realtime, posthog]
dependency_graph:
  requires: []
  provides: [working-search-form-submission, correct-realtime-channel, polling-via-api-search]
  affects: [app/(app)/search/page.tsx]
tech_stack:
  added: []
  patterns: [fetch-POST-to-api-search, supabase-realtime-channel, polling-with-setInterval]
key_files:
  modified:
    - app/(app)/search/page.tsx
decisions:
  - "creditsRemaining hardcoded to 5 — /api/user/usage removed per plan to eliminate 404 on page load"
  - "Immutable spread pattern applied in setSteps handler per coding-style rules"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-04"
  tasks_completed: 1
  files_modified: 1
---

# Phase 07 Plan 01: Search Page API Wiring Fix Summary

Fixed four broken wiring points in `app/(app)/search/page.tsx` so the core search flow works end-to-end: POST /api/search, correct Realtime channel key `search:${searchId}:progress`, polling via GET /api/search/${searchId}, and router.push to /search/${searchId}.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Rewrite search/page.tsx with correct API wiring | 81f3eb2 | app/(app)/search/page.tsx |

## What Was Built

The search page previously called three non-existent API routes (`/api/pipeline/start`, `/api/pipeline/status/${jobId}`, `/api/user/usage`) and used the wrong Realtime channel key. Nothing in the core product loop worked. This plan corrected all four wiring failures:

1. **POST /api/search** — replaces non-existent `/api/pipeline/start`. Includes `guestSessionId` from `getOrCreateGuestSessionId()` for guest path. Handles `limitReached` signals by throwing an Error with the message for toast display.

2. **Realtime channel key** — changed from `search:${jobId}:progress` to `search:${searchId}:progress`, matching the exact key the worker broadcasts via `supabaseAdmin.channel(\`search:${searchId}:progress\`)`.

3. **Polling endpoint** — changed from non-existent `/api/pipeline/status/${jobId}` to `/api/search/${searchId}`. Updated condition to `data.data?.pipeline_status === "complete"` and contacts count to `data.data?.contacts?.length ?? 0`.

4. **router.push** — changed from `/search/${jobId}` to `/search/${searchId}` so navigation reaches the correct results page.

5. **Removed /api/user/usage** — eliminated the credits state, fetchCredits useEffect, and the credits prop. `creditsRemaining={5}` hardcoded to SearchForm. No more 404 in the browser network tab on page load.

6. **Renamed jobId → searchId** — state variable and all references updated throughout the component.

7. **Added import** for `getOrCreateGuestSessionId` from `@/lib/guest`.

8. **search_completed PostHog event** — preserved and wired to `data.data?.contacts?.length ?? 0` for accurate contacts_found count.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Code Quality] Immutable setSteps updates**
- **Found during:** Task 1
- **Issue:** The original code mutated array elements directly (`newSteps[0].status = "complete"`), violating the immutability coding-style rule.
- **Fix:** Applied spread pattern for each step update: `newSteps[0] = { ...newSteps[0], status: "complete" }`.
- **Files modified:** app/(app)/search/page.tsx
- **Commit:** 81f3eb2

## Known Stubs

None — all data flows are wired to real endpoints.

## Self-Check: PASSED

- [x] `app/(app)/search/page.tsx` exists and contains correct wiring
- [x] Commit 81f3eb2 exists in git log
- [x] No TypeScript errors in search/page.tsx (verified via `npx tsc --noEmit | grep search/page`)
- [x] All acceptance criteria grep checks passed
