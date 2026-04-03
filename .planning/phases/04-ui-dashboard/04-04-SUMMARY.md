---
phase: 04-ui-dashboard
plan: "04"
subsystem: ui
tags: [results-page, empty-state, swr, regenerate, copywriting]
dependency_graph:
  requires: [04-01, 04-02]
  provides: [real-id-wiring, regenerate-handler, empty-state-copy]
  affects: [search-results-page, dashboard-empty-state]
tech_stack:
  added: []
  patterns: [swr-mutate-refresh, null-guard-drafts, id-fallback-lookup]
key_files:
  created: []
  modified:
    - app/(app)/search/[id]/page.tsx
    - components/app/EmptyState.tsx
decisions:
  - "Use contact.id || `c-${idx}` fallback for real ID lookup — handles both DB IDs and array-index fallback when agents haven't populated IDs yet"
  - "handleUpdateDraft calls mutate() only — EmailDraft auto-save handles PATCH internally via debounce"
  - "Empty state copy updated verbatim from UI-SPEC to match copywriting contract exactly"
metrics:
  duration: "8 minutes"
  completed_date: "2026-04-03"
  tasks_completed: 2
  tasks_total: 3
  files_modified: 2
---

# Phase 4 Plan 4: Results Page Wiring and Empty State Copy Summary

One-liner: Wired search results page to real API endpoints for draft regeneration/save with SWR cache invalidation, and updated EmptyState copy to match UI-SPEC contract verbatim.

## Tasks Completed

### Task 1: Wire results page to real endpoints with regenerate and save handlers

Added `mutate` to SWR destructuring, created `handleRegenerate` (POST `/api/drafts/[id]/regenerate` with toast + SWR revalidation), and `handleUpdateDraft` (calls `mutate()` after EmailDraft's internal auto-save). Wired both handlers to `ContactCard` via `onUpdateDraft` and `onRegenerateDraft` props. Fixed SlideOver's `EmailDraft` to use real `selectedDraft.id` instead of hardcoded `d-${selectedContactId}`, and added `onRegenerate` and `onSave` handlers. Updated `selectedContactData` lookup to prefer real ID match with array-index fallback. Also added `mutate()` to `handleMarkAsSent` for consistent cache refresh.

**Commit:** `6d6b585`

### Task 2: Update empty states to match copywriting contract

Updated `EmptyState.tsx` to match the UI-SPEC copywriting contract exactly:

- Heading: "No contacts yet" (was "Your pipeline is _empty_")
- Body: "Run your first search to start building your outreach pipeline." (was longer description)
- CTA: "Start a Search" (was "Start First Search")

Typography (`font-serif` on heading, `text-text-body` on body, `variant="primary"` button) was already correct — no change needed.

**Commit:** `e21eed2`

### Task 3: Full Phase 4 visual and functional verification

CHECKPOINT — awaiting human verification.

## Deviations from Plan

None — plan executed exactly as written. The `contact.id || \`c-${idx}\`` pattern was already in place from a prior plan; Task 1 extended it correctly for the SlideOver lookup.

## Known Stubs

None — all data is wired to real endpoints. The `handleUpdateDraft` callback intentionally delegates auto-save to EmailDraft's internal debounce mechanism; this is by design, not a stub.

## Self-Check: PARTIAL (checkpoint pending)

Tasks 1 and 2 verified:

- `app/(app)/search/[id]/page.tsx` — modified and committed
- `components/app/EmptyState.tsx` — modified and committed
- Commit `6d6b585` — verified present
- Commit `e21eed2` — verified present

Task 3 (checkpoint) — pending human verification.
