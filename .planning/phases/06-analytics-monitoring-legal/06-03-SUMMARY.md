---
phase: 06-analytics-monitoring-legal
plan: "03"
subsystem: analytics
tags: [posthog, analytics, events, opt-out, tracking, mdn-01, mon-03]
dependency_graph:
  requires: ["06-01"]
  provides: ["posthog-events-wired", "analytics-opt-out"]
  affects: ["components/app/EmailDraft.tsx", "components/app/PipelineBoard.tsx", "app/(app)/search/page.tsx", "app/(app)/dashboard/page.tsx"]
tech_stack:
  added: ["lib/analytics/track.ts", "components/app/AnalyticsOptOutSection.tsx"]
  patterns: ["type-safe-event-map", "lazy-initializer-for-browser-state", "url-param-bridge-for-server-events"]
key_files:
  created:
    - lib/analytics/track.ts
    - components/app/AnalyticsOptOutSection.tsx
  modified:
    - components/app/EmailDraft.tsx
    - components/app/PipelineBoard.tsx
    - app/(app)/search/page.tsx
    - app/(app)/dashboard/page.tsx
    - app/(auth)/auth/callback/route.ts
    - app/(app)/settings/page.tsx
    - components/app/ContactCard.tsx
    - app/(app)/search/[id]/page.tsx
    - tests/analytics/posthog-events.test.ts
decisions:
  - "server-events-via-url-params: signup event bridged via ?event=signup URL param set by auth callback; upgrade via ?session_id + plan check in dashboard"
  - "posthog-lazy-init: AnalyticsOptOutSection reads posthog.has_opted_out_capturing() via useState lazy initializer to avoid useEffect setState linting error"
  - "search_completed-in-page: search_completed fires in search/page.tsx (pipeline polling) not SearchForm.tsx, because SearchForm only handles input — results arrive via polling"
  - "company-prop-added: EmailDraft required new company prop to support email_copied and email_sent event properties (MON-03)"
metrics:
  duration: "~25 minutes"
  completed: "2026-04-04"
  tasks_completed: 2
  files_changed: 11
---

# Phase 06 Plan 03: PostHog Event Instrumentation Summary

**One-liner:** Type-safe `track()` helper wires all 6 PostHog events into existing components with opt-out toggle in Settings.

## What Was Built

### Task 1: Analytics Helper + 6 Events Wired

Created `lib/analytics/track.ts` — a type-safe wrapper around `posthog.capture` with:
- Union type `TrackableEvent` for all 6 event names
- `EventMap` type mapping each event to required property shapes (MON-03 funnel data)
- SSR guard (`typeof window === "undefined"` check)

Wired all 6 events:

| Event | Location | Trigger |
|---|---|---|
| `search_completed` | `app/(app)/search/page.tsx` | Pipeline polling detects `status === "complete"` |
| `email_copied` | `components/app/EmailDraft.tsx` | `handleCopy()` after clipboard write |
| `email_sent` | `components/app/EmailDraft.tsx` | `handleSendViaGmail()` on success response |
| `pipeline_stage_change` | `components/app/PipelineBoard.tsx` | `handleDragEnd()` on valid stage drop |
| `signup` | `app/(app)/dashboard/page.tsx` | Detects `?event=signup` URL param (set by auth callback for new users) |
| `upgrade` | `app/(app)/dashboard/page.tsx` | Detects `?session_id` + `statsData.plan === "pro"` after Stripe redirect |

Server-side events (`signup`, `upgrade`) use a URL param bridge pattern since `posthog-js` is browser-only. The auth callback route sets `?event=signup` for new users; the dashboard reads it and fires the event via `track()`.

### Task 2: Analytics Opt-Out + Tests

Created `components/app/AnalyticsOptOutSection.tsx`:
- Reads opt-out state via `useState(() => posthog.has_opted_out_capturing())` lazy initializer
- Toggle calls `posthog.opt_out_capturing()` / `posthog.opt_in_capturing()`
- SSR-safe lazy initializer avoids hydration issues

Added "Privacy Controls" section to `app/(app)/settings/page.tsx` with the opt-out toggle card.

Updated `tests/analytics/posthog-events.test.ts` with 10 real assertions (replaced stubs):
- 7 tests verify event names and required properties (MON-01)
- 3 tests verify `lib/analytics/track.ts` contains funnel-required property names (MON-03)
- All 10 tests pass

## Decisions Made

1. **Server-side events via URL params:** `signup` and `upgrade` cannot use `posthog-js` (browser SDK) in Route Handlers. Used URL param bridge pattern — auth callback adds `?event=signup` for new users, Stripe redirect adds `?session_id=...`. Dashboard client component reads both and fires the appropriate events.

2. **`search_completed` in page, not SearchForm:** `SearchForm` only submits the form — it receives results as a callback. The actual pipeline completion is detected in `search/page.tsx` via status polling, which is where `contacts_found` count is available.

3. **`company` prop added to EmailDraft:** Required to include `company` in `email_copied` and `email_sent` event properties (MON-03 funnel data). All three call sites updated: `ContactCard.tsx`, `dashboard/page.tsx`, `search/[id]/page.tsx`.

4. **Lazy initializer for opt-out state:** Used `useState<boolean>(() => posthog.has_opted_out_capturing())` instead of `useEffect(() => setState(...))` to avoid the `react-hooks/set-state-in-effect` ESLint rule. Lazy initializer runs once on mount and is client-side only.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `error: any` in search/page.tsx**
- **Found during:** Task 1 (pre-commit hook)
- **Issue:** `catch (error: any)` triggered `@typescript-eslint/no-explicit-any`
- **Fix:** Changed to `catch (error: unknown)` with `instanceof Error` narrowing
- **Files modified:** `app/(app)/search/page.tsx`
- **Commit:** 2f4a028

**2. [Rule 1 - Bug] Fixed setState in useEffect lint error in AnalyticsOptOutSection**
- **Found during:** Task 2 (pre-commit hook)
- **Issue:** `useEffect(() => { setIsOptedOut(posthog.has_opted_out_capturing()) }, [])` triggered `react-hooks/set-state-in-effect`
- **Fix:** Replaced with `useState(() => posthog.has_opted_out_capturing())` lazy initializer
- **Files modified:** `components/app/AnalyticsOptOutSection.tsx`
- **Commit:** ffa481d

**3. [Rule 2 - Missing functionality] Wired pipeline_stage_change in PipelineBoard instead of PipelineCard**
- **Found during:** Task 1 (analysis)
- **Issue:** `PipelineCard` is a display-only card with no stage change logic; the actual stage change happens in `PipelineBoard.handleDragEnd()`
- **Fix:** Added `track("pipeline_stage_change", ...)` in `PipelineBoard.handleDragEnd()` and imported `track` from `@/lib/analytics/track`
- **Files modified:** `components/app/PipelineBoard.tsx`
- **Commit:** 2f4a028

## Commits

| Hash | Message | Files |
|---|---|---|
| 2f4a028 | feat(ui): create analytics helper and wire 6 PostHog events (06-03) | 11 files |
| ffa481d | feat(ui): add analytics opt-out to Settings and real test assertions (06-03) | 3 files |

## Verification

```
npx vitest run tests/analytics/posthog-events.test.ts
# Result: 10/10 tests passed

grep -rn "track(" lib/analytics/track.ts components/app/EmailDraft.tsx components/app/PipelineBoard.tsx
# Result: email_copied, email_sent, pipeline_stage_change present
```

## Self-Check: PASSED

- `lib/analytics/track.ts` exists: FOUND
- `components/app/AnalyticsOptOutSection.tsx` exists: FOUND
- Task 1 commit 2f4a028: FOUND
- Task 2 commit ffa481d: FOUND
- All 10 tests pass: VERIFIED
