---
phase: 05-gmail-send-deliverability
plan: "04"
subsystem: ui
tags: [gap-closure, email-draft, gmail-send, pro-gating]
dependency_graph:
  requires: ["05-01", "05-02", "05-03"]
  provides: ["SEND-01", "SEND-02", "SEND-06"]
  affects: ["components/app/EmailDraft.tsx", "app/(app)/dashboard/page.tsx", "app/(app)/search/[id]/page.tsx", "components/app/ContactCard.tsx"]
tech_stack:
  added: []
  patterns: ["SWR reuse for plan field", "prop threading for Pro gating", "optimistic PATCH via existing handlers"]
key_files:
  created: []
  modified:
    - app/api/dashboard/stats/route.ts
    - app/(app)/dashboard/page.tsx
    - app/(app)/search/[id]/page.tsx
    - components/app/ContactCard.tsx
decisions:
  - "Reuse /api/dashboard/stats for isPro derivation in search/[id]/page.tsx instead of adding a new endpoint — avoids API sprawl and leverages SWR cache sharing"
  - "isPro = statsData?.plan === 'pro' — derivation at call site, not in EmailDraft itself"
  - "ContactCard isPro and onStageMoved are optional with defaults (isPro=false) to preserve backward compatibility"
metrics:
  duration_minutes: 12
  completed_date: "2026-04-04"
  tasks_completed: 3
  files_modified: 4
---

# Phase 05 Plan 04: EmailDraft Call Site Gap Closure Summary

**One-liner:** Wired isPro, contactId, and onStageMoved into all three EmailDraft call sites so Pro users see Send via Gmail and optimistic stage moves fire on send.

## What Was Built

This plan was a pure gap-closure fix. EmailDraft.tsx already had complete Pro-gated Gmail send logic implemented in Plan 03, but all three call sites that render it were missing the required `isPro` and `contactId` props — TypeScript confirmed TS2739 errors at all three sites.

Three targeted changes were made:

**Task 1 — Stats API plan field** (`app/api/dashboard/stats/route.ts`): Added a parallel `prisma.profile.findUnique` to the existing `Promise.all` query block, returning `plan: profile?.plan ?? "free"` alongside the existing stats data array. No new endpoint — piggybacked on the stats call all dashboard consumers already make.

**Task 2 — Dashboard call site** (`app/(app)/dashboard/page.tsx`): Extended the statsData SWR type to include `plan?: string`. Derived `isPro = statsData?.plan === "pro"`. Added `handleStageMovedForContact` that delegates to the existing `handleContactMove` (no duplicate PATCH logic). Passed all three props to the EmailDraft in the SlideOver.

**Task 3 — Search and ContactCard call sites** (`app/(app)/search/[id]/page.tsx`, `components/app/ContactCard.tsx`): Added a secondary `useSWR("/api/dashboard/stats")` call in the search page to derive `isPro`. Added `handleStageMoved` with PATCH + `mutate()`. Wired all three props to the EmailDraft in the SlideOver. Extended `ContactCardProps` with optional `isPro?: boolean` and `onStageMoved?` (both backward-compatible with defaults). Passed `isPro` and `onStageMoved` down to all ContactCard renders in the results list.

## Verification

```
npx tsc --noEmit 2>&1 | grep -E "TS2739|EmailDraft"
```
Result: zero TS2739 errors. Pre-existing errors in worker files and settings (unsubscribeFooter schema migration) are unrelated.

Spot-check:
- `dashboard/page.tsx`: lines 213-220 show `contactId`, `isPro`, `onStageMoved` at EmailDraft call
- `search/[id]/page.tsx`: lines 205-210 show same at SlideOver EmailDraft; lines 312+317 show on ContactCard renders
- `ContactCard.tsx`: lines 226-231 show all three props at inline EmailDraft expansion

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `0b4a5c4` | feat(api): add plan field to dashboard stats API response |
| 2 | `8b64790` | feat(ui): wire isPro, contactId, onStageMoved into dashboard EmailDraft call site |
| 3 | `4697dc2` | feat(ui): wire isPro, contactId, onStageMoved into search and ContactCard EmailDraft call sites |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all props are wired to real data sources. `isPro` flows from a live DB query (prisma.profile.findUnique) via the stats API. `contactId` comes from real DB contact IDs. `onStageMoved` triggers real PATCH calls.

## Self-Check: PASSED

Files modified:
- `app/api/dashboard/stats/route.ts` — FOUND
- `app/(app)/dashboard/page.tsx` — FOUND
- `app/(app)/search/[id]/page.tsx` — FOUND
- `components/app/ContactCard.tsx` — FOUND

Commits:
- `0b4a5c4` — FOUND
- `8b64790` — FOUND
- `4697dc2` — FOUND
