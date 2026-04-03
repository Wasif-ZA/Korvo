---
phase: 04-ui-dashboard
plan: "03"
subsystem: ui
tags: [dashboard, kanban, optimistic-updates, mobile, follow-up, swr]
dependency_graph:
  requires: [04-01, 04-02]
  provides:
    [dashboard-optimistic-moves, mobile-stage-selector, followup-real-api]
  affects:
    [
      app/(app)/page.tsx,
      components/app/FollowUpReminder.tsx,
      components/app/PipelineBoard.tsx,
      components/app/StageSelector.tsx,
    ]
tech_stack:
  added: []
  patterns: [swr-optimistic-update, immutable-spread, typed-swr-hooks]
key_files:
  created:
    - components/app/StageSelector.tsx
  modified:
    - app/(app)/page.tsx
    - components/app/FollowUpReminder.tsx
    - components/app/PipelineBoard.tsx
decisions:
  - "SWR optimistic update uses immutable spread (map returns new objects) per coding-style rules"
  - "StageSelector hidden on md+ with md:hidden to avoid interfering with desktop Kanban DnD"
  - "FollowUpReminder replaces mock setTimeout with real PATCH /api/contacts/[id]/reminder"
  - "Typed SWR hooks (useSWR<ApiResponse<T>>) replace any-typed fetcher returns for better type safety"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-03"
  tasks_completed: 2
  files_changed: 4
---

# Phase 4 Plan 3: Dashboard Polish & Real API Wiring Summary

**One-liner:** Production-ready dashboard with SWR optimistic Kanban moves, mobile StageSelector dropdown, typed SWR hooks, and FollowUpReminder calling real PATCH endpoint.

## What Was Built

### Task 1: Optimistic Stage Moves, StageSelector, Dashboard Polish

**`app/(app)/page.tsx`:**

- `handleContactMove` upgraded to SWR optimistic pattern: mutates local cache immediately with immutable spread, reverts on failure
- `fetcher` now throws on `!res.ok` for correct SWR error handling
- Added typed `ApiResponse<T>` interfaces replacing `any` throughout: `ContactData`, `StatData`, `HistoryItem`
- Typed `useSWR` calls: `useSWR<ApiResponse<ContactData[]>>`, `useSWR<ApiResponse<StatData[]>>`, `useSWR<ApiResponse<HistoryItem[]>>`
- Added `handleRegenerate(draftId)` — calls `POST /api/drafts/[id]/regenerate`, refreshes via `mutateContacts()`
- EmailDraft in SlideOver wired with `onRegenerate`, `onSave`, null guard via `selectedContact.draft &&`
- Removed `console.warn` stub and TODO comment
- JSX comment text nodes fixed for ESLint compliance

**`components/app/StageSelector.tsx` (new):**

- `StageSelectorProps` with `currentStage`, `contactId`, `onStageChange` callback
- Renders `<select>` with all 6 pipeline stages
- Hidden on desktop via `md:hidden`, visible on mobile
- Warm aesthetic: `bg-surface border border-border-card rounded-md text-text-primary`

**`components/app/PipelineBoard.tsx`:**

- Added mobile list view (`md:hidden` wrapper) with stage group headers and contact rows
- Each mobile contact row includes `StageSelector` for click-to-move
- Kanban board wrapped in `hidden md:flex` to show only on desktop
- Imported `StageSelector` and `ConfidenceBadge` for mobile view
- Removed unused `arrayMove` and `cn` imports

### Task 2: FollowUpReminder Real API Wiring

**`components/app/FollowUpReminder.tsx`:**

- Replaced `setTimeout(600)` mock with real `PATCH /api/contacts/${contactId}/reminder`
- Request body: `{ reminderActive: true/false }` for set/clear
- On success (set): toast `"Reminder set for {locale date +7 days}"`
- On success (clear): toast `"Follow-up reminder removed"`
- On error: toast `"Couldn't set reminder. Please try again."`
- Removed TODO comment and mock pattern

### UI-07 Realtime Verification

Supabase Realtime subscription is present in `app/(app)/search/page.tsx` (lines 103-129). All 4 broadcast handlers wired: `contacts_found`, `emails_guessed`, `research_done`, `drafts_ready`. No action needed.

## Verification

- `grep -n "revalidate: false" app/(app)/page.tsx` — line 98: optimistic update present
- `grep -n "console.warn" app/(app)/page.tsx` — no matches
- `grep -n "Couldn't update stage" app/(app)/page.tsx` — line 110: error toast present
- `grep -n "Moved to" app/(app)/page.tsx` — line 106: success toast present
- `grep -n "md:hidden" components/app/StageSelector.tsx` — line 34: mobile-only
- `grep -n "onStageChange" components/app/StageSelector.tsx` — line 15: callback prop
- `grep -n "api/contacts.*reminder" components/app/FollowUpReminder.tsx` — line 25: real API
- `grep -n "setTimeout" components/app/FollowUpReminder.tsx` — no matches (mock removed)
- TypeScript: no errors in modified files
- ESLint: clean on all modified files

## Commits

| Hash    | Message                                                                                 |
| ------- | --------------------------------------------------------------------------------------- |
| 3d8b4e2 | feat(ui): optimistic stage moves, StageSelector mobile dropdown, fetcher error handling |
| c4c7dba | feat(ui): wire FollowUpReminder to real PATCH /api/contacts/[id]/reminder endpoint      |

Note: `components/app/StageSelector.tsx` and `components/app/PipelineBoard.tsx` were committed at `6d6b585` (same wave, parallel execution — files were already staged and committed by the time the hook restored from stash).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Typed SWR hooks instead of `any`**

- **Found during:** Task 1
- **Issue:** ESLint `@typescript-eslint/no-explicit-any` blocked commit on `any`-typed SWR hooks and contact array
- **Fix:** Introduced proper `ContactData`, `StatData`, `HistoryItem`, `ApiResponse<T>` interfaces; typed all `useSWR` calls; cast `contacts` at PipelineBoard call site for Stage union compatibility
- **Files modified:** `app/(app)/page.tsx`
- **Commit:** 3d8b4e2

**2. [Rule 1 - Bug] JSX comment text node lint errors**

- **Found during:** Task 1
- **Issue:** Inline JSX comments `// Generated_Outreach \\` and `// Recent_Searches \\` triggered `react/jsx-no-comment-textnodes`
- **Fix:** Wrapped in `{"// ... \\\\"}` JSX string expressions
- **Files modified:** `app/(app)/page.tsx`
- **Commit:** 3d8b4e2

## Known Stubs

None — all stubs resolved in this plan. FollowUpReminder calls real endpoint. Dashboard EmailDraft handlers are wired. Optimistic updates use real PATCH endpoint.

## Self-Check

- [x] `app/(app)/page.tsx` — exists and modified
- [x] `components/app/StageSelector.tsx` — exists (created)
- [x] `components/app/PipelineBoard.tsx` — exists and modified
- [x] `components/app/FollowUpReminder.tsx` — exists and modified
- [x] Commit 3d8b4e2 — verified in git log
- [x] Commit c4c7dba — verified in git log
