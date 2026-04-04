---
phase: "07"
plan: "02"
subsystem: auth
tags: [guest-access, auth-guard, modal, requirements-traceability]
dependency_graph:
  requires: ["07-01"]
  provides: [guest-access-to-search, guest-limit-modal-wired]
  affects: [proxy.ts, app/(app)/search/page.tsx, .planning/REQUIREMENTS.md]
tech_stack:
  added: []
  patterns: [guest-modal-on-limit, fragment-wrapping-for-modal-coexistence]
key_files:
  modified:
    - proxy.ts
    - app/(app)/search/page.tsx
    - .planning/REQUIREMENTS.md
decisions:
  - "Remove /search from PROTECTED_ROUTES — API routes have independent RLS checks"
  - "Show GuestLimitModal on limitType=guest rather than throwing error — better UX"
  - "Fragment wrapper allows GuestLimitModal to coexist with main layout div"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-04"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase 07 Plan 02: Guest Access + GuestLimitModal Wiring Summary

Guest access to /search enabled by removing route from PROTECTED_ROUTES; GuestLimitModal wired to fire on API limitType=guest response; REQUIREMENTS.md SCORE checkboxes corrected.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove /search from PROTECTED_ROUTES | 4a98725 | proxy.ts |
| 2 | Wire GuestLimitModal into search/page.tsx | 2f29cb2 | app/(app)/search/page.tsx |
| 3 | Update REQUIREMENTS.md SCORE traceability | c3d8d55 | .planning/REQUIREMENTS.md |

## What Was Built

### Task 1 — proxy.ts
Removed `'/search'` from the `PROTECTED_ROUTES` array. Previously `['/dashboard', '/settings', '/search', '/drafts']`, now `['/dashboard', '/settings', '/drafts']`. Unauthenticated visitors can now load `/search` and `/search/[id]` without being redirected to `/login`. The POST `/api/search` route independently handles guest vs authenticated paths via IP-based rate limiting.

### Task 2 — app/(app)/search/page.tsx
Three changes to satisfy AUTH-01 and AUTH-02:
1. Added `import { GuestLimitModal } from "@/components/auth/GuestLimitModal"` at the top.
2. Added `const [showGuestModal, setShowGuestModal] = useState(false)` state variable.
3. Changed the `limitReached` check to branch on `limitType === "guest"`: opens the modal and returns early instead of throwing an error. Non-guest limit still throws the "Please upgrade" error.
4. Wrapped the JSX return in a fragment `<>...</>` so `<GuestLimitModal>` coexists with the main layout `div`.

The `GuestLimitModal` handles its own OAuth redirect internally — clicking "Continue with Google" calls `supabase.auth.signInWithOAuth` with `redirectTo` including `guest_session` param.

### Task 3 — .planning/REQUIREMENTS.md
Fixed three stale `[ ]` checkboxes to `[x]` for SCORE-01, SCORE-03, SCORE-04. The traceability table already showed these as "Complete" — the checkboxes were the only inconsistency.

## Decisions Made

- **Remove /search entirely from PROTECTED_ROUTES** rather than adding per-request guest detection in the proxy. The `/api/search` POST already handles the guest path (IP-based limit, no BullMQ enqueue), so no proxy change to API routes was needed.
- **Modal over error toast for guest limit** — `setShowGuestModal(true)` + early return rather than `throw new Error(...)`. Error toasts are dismissable and easy to miss; the modal forces a conscious decision (sign up vs. not now), which is the correct AUTH-02 UX.
- **Fragment wrapper** — the simplest change to add the modal to the JSX without restructuring the layout. The `<GuestLimitModal>` renders as an overlay via the `Modal` component's portal, so no layout impact.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All changes are fully wired:
- `proxy.ts`: PROTECTED_ROUTES change is a complete, correct removal.
- `search/page.tsx`: GuestLimitModal wired to real state and real API response fields.
- `REQUIREMENTS.md`: Documentation correction, no code stubs.

## Self-Check

- [x] proxy.ts modified — `grep "'/search'" proxy.ts` returns no match
- [x] search/page.tsx — GuestLimitModal import, JSX render, open prop, and onClose all present
- [x] REQUIREMENTS.md — SCORE-01, SCORE-03, SCORE-04 all `[x]` and "Complete" in traceability table
- [x] TypeScript — no errors in search/page.tsx (pre-existing errors in other files are out of scope)
- [x] All 3 tasks committed with valid conventional commit messages

## Self-Check: PASSED
