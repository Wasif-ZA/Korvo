---
phase: 04-ui-dashboard
plan: "02"
subsystem: ui
tags: [contact-card, score-display, research-toggle, mark-as-sent, score-breakdown, results-page]
dependency_graph:
  requires: []
  provides: [score-badge-display, research-card-toggle, mark-as-sent-action, score-breakdown-signals, results-page-data-wiring]
  affects: [components/app/ContactCard.tsx, components/app/ScoreBreakdown.tsx, app/(app)/search/[id]/page.tsx]
tech_stack:
  added: []
  patterns: [tone-based-score-coloring, collapsible-research-panel, optimistic-ui-patch, ScoringSignals-type-wiring]
key_files:
  created: []
  modified:
    - components/app/ScoreBreakdown.tsx
    - app/(app)/search/[id]/page.tsx
decisions:
  - "ContactCard Task 1 was pre-completed by prior agent (commit 1e2a8bf) — score badge, research toggle, and Mark as Sent were already implemented"
  - "ScoreBreakdown updated to use ScoringSignals type directly (titleMatchScore, seniorityScore, publicActivityScore, emailConfidenceScore, hiringSignalScore) with max values per spec (30/20/20/15/15)"
  - "Results page wires all score/research/stage data from PipelineResponse contacts to ContactCard"
  - "handleMarkAsSent PATCHes /api/contacts/[id] with stage:contacted, uses toast for user feedback"
  - "SkeletonCard confirmed present in loading state — UI-06 requirement satisfied"
metrics:
  duration_minutes: 15
  completed_date: "2026-04-03"
  tasks_completed: 2
  files_modified: 2
---

# Phase 04 Plan 02: Score Display, Research Toggle, Mark as Sent Summary

Score badge with tone-based coloring on ContactCard, collapsible ResearchCard toggle, Mark as Sent PATCH action, corrected ScoringSignals field names in ScoreBreakdown, and full data wiring in the search results page.

## What Was Built

### Task 1: ContactCard enhancements (pre-completed by prior agent)

ContactCard was already fully updated by commit 1e2a8bf with:

- Score badge displaying 0-100 value with tone-based coloring (green for 75+, amber for 45-74, red for <45) using `getScoreToneClasses()`
- `isResearchOpen` state for collapsible ResearchCard toggling (collapsed by default per D-02)
- "View Research" / "Close Research" toggle button in the actions row
- Animated ResearchCard expansion with `animate-in slide-in-from-top duration-300`
- `onMarkAsSent` prop and "Mark as Sent" button that fires the callback, disabled when `contact.stage === "contacted"`
- ScoringSignals imported from `@/shared/types/agents`

### Task 2: ScoreBreakdown field names fixed + results page wiring

**ScoreBreakdown.tsx** (`components/app/ScoreBreakdown.tsx`):

- Updated props interface from old field names (`titleMatch`, `seniority`, `hiringSignal`, `enrichment`, `activity`) to correct `ScoringSignals` type from `@/shared/types/agents`
- Correct field names: `titleMatchScore` (max 30), `seniorityScore` (max 20), `publicActivityScore` (max 20), `emailConfidenceScore` (max 15), `hiringSignalScore` (max 15)
- Total max = 100, matching the scoring engine spec

**Search Results Page** (`app/(app)/search/[id]/page.tsx`):

- `mappedContact` now includes: `score`, `scoreBreakdown`, `researchBackground`, `researchAskThis`, `researchMentionThis`, `stage: "identified"`
- Uses real `contact.id` with fallback to `c-${idx}` for backward compatibility
- `handleMarkAsSent` async function PATCHes `/api/contacts/${contactId}` with `{ stage: "contacted" }`, shows `toast.success/error`
- `onMarkAsSent={handleMarkAsSent}` passed to each ContactCard
- SlideOver ScoreBreakdown now uses `contact.score ?? Math.round(confidence * 100)` and real `scoreBreakdown`
- SlideOver ResearchCard now uses real research fields with hook fallback
- `selectedContactId` lookup updated to use real contact IDs

**Loading State (UI-06 verification):**

- SkeletonCard already present in the `isLoading` branch (3 skeleton cards rendered) — requirement satisfied, no changes needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] JSX comment nodes causing ESLint failures**

- **Found during:** Task 2 commit
- **Issue:** `// label \\` text inside JSX `<p>` and `<span>` tags was being interpreted as JS comments, violating `react/jsx-no-comment-textnodes` rule
- **Fix:** Wrapped the identifier strings in `{"// label \\"}` expression syntax
- **Files modified:** `components/app/ScoreBreakdown.tsx`, `app/(app)/search/[id]/page.tsx`
- **Commit:** e405f0a

**2. [Rule 1 - Bug] FollowUpReminder null contactId type error**

- **Found during:** Task 2 TypeScript check
- **Issue:** `selectedContactId` is `string | null` but `FollowUpReminder.contactId` expects `string`
- **Fix:** Added null coalescing `selectedContactId ?? ""` — this is safe since FollowUpReminder only renders when `selectedContactData` is truthy, meaning `selectedContactId` is non-null at that point
- **Files modified:** `app/(app)/search/[id]/page.tsx`
- **Commit:** e405f0a

## Known Stubs

None — all data fields wired from PipelineResponse which already includes score, scoreBreakdown, and research fields (per Plan 01 / commit 1e2a8bf).

## Self-Check: PASSED

- FOUND: `components/app/ScoreBreakdown.tsx`
- FOUND: `app/(app)/search/[id]/page.tsx`
- FOUND: commit e405f0a (Task 2)
