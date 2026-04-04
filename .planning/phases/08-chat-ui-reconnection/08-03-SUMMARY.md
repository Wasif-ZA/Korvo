---
phase: 08-chat-ui-reconnection
plan: 03
subsystem: ui
tags: [analytics, auth, billing, guest-search, dashboard]

# Dependency graph
requires:
  - phase: 08-chat-ui-reconnection
    plan: 01
    provides: /api/me searchesUsed/searchesLimit fields, OAuth callback with guest_session param
  - phase: 08-chat-ui-reconnection
    plan: 02
    provides: landing page navigation and footer links
provides:
  - Stripe upgrade analytics event fires after checkout redirect via ?session_id=
  - Guest session stored in localStorage and adopted via /api/guest/adopt on login
  - Sidebar displays real usage (searchesUsed/searchesLimit) from /api/me
  - Sidebar shows aggregate stats grid from /api/dashboard/stats
  - ContactCard has reminder toggle wired to PATCH /api/contacts/[id]/reminder
affects: [ui, auth, billing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Upgrade bridge: detect ?session_id= in useEffect, fire track('upgrade'), clean URL"
    - "Guest adoption: localStorage korvo_guest_session, passed as guest_session param in OAuth redirectTo"
    - "Fallback adoption: fetch POST /api/guest/adopt in user-detection useEffect after login"
    - "Stats grid: conditional render when stats.length > 0, keyed by label"

key-files:
  created: []
  modified:
    - app/page.tsx
    - components/chat/Sidebar.tsx
    - components/chat/ContactCard.tsx

key-decisions:
  - "Guest session ID stored as 'browser-session' literal — sufficient for single-device guest tracking"
  - "Stats grid renders conditionally only when /api/dashboard/stats returns data, no loading state needed"
  - "Reminder state is local (useState) — not persisted across page loads; server state is authoritative"
  - "Pre-existing any types in app/page.tsx fixed as part of Rule 3 deviation (blocked commit hooks)"

# Metrics
duration: 6min
completed: 2026-04-04
---

# Phase 08 Plan 03: Chat UI Reconnection Summary

**Seven integration gaps closed: upgrade event fires after Stripe checkout, guest sessions adopted via localStorage+OAuth param, sidebar reads real usage and stats, ContactCard has reminder toggle wired to backend**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-04T14:21:53Z
- **Completed:** 2026-04-04T14:28:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `app/page.tsx`: Detects `?session_id=` after Stripe checkout and fires `track("upgrade", { plan: "pro", source: "stripe_checkout" })` then cleans the URL and refreshes the profile
- `app/page.tsx`: `handleGoogleLogin` now includes `guest_session=<encoded>` in the OAuth `redirectTo` URL so server-side adoption works via the auth callback
- `app/page.tsx`: After login, a fallback fetch to `POST /api/guest/adopt` claims any guest searches if server-side adoption was skipped; `korvo_guest_session` is cleared from localStorage afterward
- `app/page.tsx`: Guest searches store `korvo_guest_session` in localStorage via `localStorage.setItem` in `handleSend`
- `components/chat/Sidebar.tsx`: Usage now reads `data.data.searchesUsed` and `data.data.searchesLimit` (was broken reading `monthlySearchCount`)
- `components/chat/Sidebar.tsx`: Fetches `GET /api/dashboard/stats` and renders a 2-column grid of up to 4 stat cards (Total Contacts, Emails Sent, Replies Received, Reply Rate)
- `components/chat/ContactCard.tsx`: Bell/BellOff reminder toggle calls `PATCH /api/contacts/[id]/reminder` with `{ reminderActive }`, shows toast feedback, has local state

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire upgrade event bridge + guest adoption in app/page.tsx** - `ffdfc02`
2. **Task 2: Wire Sidebar usage/stats + ContactCard reminder** - `b4c570e`

## Files Created/Modified

- `app/page.tsx` - Upgrade event bridge, guest_session OAuth param, fallback guest adoption, localStorage guest session tracking
- `components/chat/Sidebar.tsx` - Fixed searchesUsed/searchesLimit field names, added /api/dashboard/stats fetch, added stats grid render
- `components/chat/ContactCard.tsx` - Added Bell/BellOff reminder toggle, handleReminder function, toast imports

## Decisions Made

- Guest session stored as `'browser-session'` literal — single-device guest tracking is sufficient for V1
- Stats grid renders conditionally on `stats.length > 0` — no loading skeleton needed, unauthenticated users just see nothing
- Reminder state (`reminderActive`) is local useState — server is authoritative on reload; acceptable for V1
- Pre-existing `any` types in app/page.tsx replaced with proper types as part of Rule 3 fix (lint hook blocked commits)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing lint errors in app/page.tsx**
- **Found during:** Task 1 commit
- **Issue:** `app/page.tsx` had 12 lint errors (`@typescript-eslint/no-explicit-any`, unused vars) that blocked the pre-commit hook even though they were pre-existing before this plan's changes
- **Fix:** Replaced `any` types with `unknown` and proper interfaces; removed unused `error` variables in catch blocks; changed unused `contactId` param to `_contactId`; fixed `view as any` to a proper union cast
- **Files modified:** `app/page.tsx`
- **Commit:** `ffdfc02`

**2. [Rule 3 - Blocking] Fixed lint errors in Sidebar.tsx and ContactCard.tsx**
- **Found during:** Task 2 commit
- **Issue:** `Sidebar.tsx` had unused imports (`ChevronRight`, `User`) and `any` in SidebarProps; `ContactCard.tsx` had unescaped `"` quotes in JSX
- **Fix:** Removed unused imports, typed `user` prop as `{ email?: string }`, escaped quotes as `&quot;`
- **Files modified:** `components/chat/Sidebar.tsx`, `components/chat/ContactCard.tsx`
- **Commit:** `b4c570e`

## Known Stubs

- `handleSaveContact` in `app/page.tsx` shows a toast but does not actually persist the contact to the database (the function body only calls `toast.success`). This is a pre-existing stub from prior phases — not introduced by this plan. A future plan should wire this to `POST /api/contacts`.

## Self-Check: PASSED

- FOUND: `app/page.tsx` contains `searchParams.get('session_id')` (line 101)
- FOUND: `app/page.tsx` contains `track("upgrade", { plan: "pro", source: "stripe_checkout" })` (line 102)
- FOUND: `app/page.tsx` contains `guest_session=` in OAuth redirectTo (line 236)
- FOUND: `app/page.tsx` contains fetch to `/api/guest/adopt` (line 65)
- FOUND: `app/page.tsx` contains `localStorage.removeItem("korvo_guest_session")` (line 70)
- FOUND: `app/page.tsx` contains `localStorage.setItem("korvo_guest_session"` (line 258)
- FOUND: `components/chat/Sidebar.tsx` contains `searchesUsed` (line 50)
- FOUND: `components/chat/Sidebar.tsx` contains `/api/dashboard/stats` (line 57)
- FOUND: `components/chat/ContactCard.tsx` contains `reminderActive` state (line 32)
- FOUND: `components/chat/ContactCard.tsx` contains fetch to `/api/contacts/${contact.id}/reminder` (line 38)
- FOUND commit: ffdfc02 (Task 1)
- FOUND commit: b4c570e (Task 2)

---
*Phase: 08-chat-ui-reconnection*
*Completed: 2026-04-04*
