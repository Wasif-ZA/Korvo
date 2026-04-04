---
phase: 08-chat-ui-reconnection
plan: 04
subsystem: ui
tags: [gmail, email-send, pro, analytics, pipeline]

# Dependency graph
requires:
  - phase: 08-chat-ui-reconnection
    plan: 03
    provides: profile state with plan field in app/page.tsx
  - phase: 05
    plan: gmail-send
    provides: /api/gmail/send and /api/gmail/status endpoints
provides:
  - Chat EmailDraft shows "Send via Gmail" for Pro users with connected Gmail
  - Free users see copy + mailto only
  - onStageMoved fires pipeline_stage_change analytics on send
  - SEND-02 satisfied
affects: [ui, api, analytics]

# Tech tracking
tech-stack:
  added:
    - swr (useSWR, mutate) imported into chat/EmailDraft.tsx
  patterns:
    - "Optimistic stage move: onStageMoved(cId, 'contacted') before fetch, revert on failure"
    - "Gmail status SWR: fetch /api/gmail/status only when isPro=true (conditional SWR key)"
    - "Error code handling: GMAIL_NOT_CONNECTED, DAILY_LIMIT_REACHED, BOUNCE_SUSPENDED"

key-files:
  created: []
  modified:
    - components/chat/EmailDraft.tsx
    - app/page.tsx

key-decisions:
  - "Connect Gmail link navigates to /?view=settings (not /settings) — settings is inside chat layout via view param"
  - "onStageMoved in app/page.tsx fires analytics only; actual DB stage update is handled server-side via /api/gmail/send"

# Metrics
duration: 4min
completed: 2026-04-04
---

# Phase 08 Plan 04: Gmail Send Integration in Chat EmailDraft Summary

**Port Gmail send from app/EmailDraft into chat/EmailDraft: Pro users see SEND_VIA_GMAIL button calling /api/gmail/send, free users see copy + mailto**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-04T14:31:42Z
- **Completed:** 2026-04-04T14:35:13Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `components/chat/EmailDraft.tsx`: Added `isPro`, `contactId`, `onStageMoved` props; imported `useSWR` + `mutate` from swr; added `/api/gmail/status` fetch (Pro only); implemented `handleSendViaGmail` with optimistic stage move, error code handling (GMAIL_NOT_CONNECTED, DAILY_LIMIT_REACHED, BOUNCE_SUSPENDED), and revert on failure; shows SEND_VIA_GMAIL primary button for Pro+connected, mailto fallback for others, "Connect Gmail" link for Pro+not connected, "Mark as sent" checkbox for free users
- `app/page.tsx`: Updated EmailDraft rendering to pass `isPro={profile?.plan === 'pro'}`, `contactId={m.content.contact_id}`, `onStageMoved` callback that fires `track("pipeline_stage_change", ...)` (MON-01)

## Task Commits

Each task was committed atomically:

1. **Task 1: Port Gmail send logic into components/chat/EmailDraft.tsx** - `aa1e7f3`
2. **Task 2: Pass isPro, contactId, onStageMoved to EmailDraft in app/page.tsx** - `6323671`

## Files Created/Modified

- `components/chat/EmailDraft.tsx` - Gmail send integration: useSWR status check, handleSendViaGmail, conditional button rendering, error handling
- `app/page.tsx` - EmailDraft now receives isPro, contactId, onStageMoved; fixed eslint-disable comment placement

## Decisions Made

- Connect Gmail link navigates to `/?view=settings` (not `/settings`) — settings is inside the chat layout via view param; this is consistent with the rest of the app navigation
- `onStageMoved` in `app/page.tsx` fires analytics only; actual DB stage update happens server-side in `/api/gmail/send` endpoint — no local pipeline state management needed in this plan

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed eslint-disable comment placement in app/page.tsx**
- **Found during:** Task 2 commit
- **Issue:** The `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comment was on the interface declaration line, not on the `content: any` field, so ESLint still flagged the `any` type and blocked the commit
- **Fix:** Moved the eslint-disable comment to be directly above the `content: any` field
- **Files modified:** `app/page.tsx`
- **Commit:** `6323671`

## Known Stubs

- `handleSaveContact` in `app/page.tsx` shows a toast but does not persist the contact to the database — pre-existing from prior phases; not introduced by this plan.

## Self-Check: PASSED

- FOUND: `components/chat/EmailDraft.tsx` contains `fetch("/api/gmail/send"` (line 105)
- FOUND: `components/chat/EmailDraft.tsx` contains `/api/gmail/status` (line 51, 140)
- FOUND: `components/chat/EmailDraft.tsx` contains `SEND_VIA_GMAIL` (line 226)
- FOUND: `components/chat/EmailDraft.tsx` contains `isPro` in interface (line 23) and usage (lines 34, 51, 206, 251, 265)
- FOUND: `components/chat/EmailDraft.tsx` contains `onStageMoved` in interface (line 25) and usage (lines 36, 102, 127, 143)
- FOUND: `components/chat/EmailDraft.tsx` contains `track("email_sent"` with `method: "gmail"` (lines 76, 134)
- FOUND: `components/chat/EmailDraft.tsx` contains `GMAIL_NOT_CONNECTED` (line 117)
- FOUND: `components/chat/EmailDraft.tsx` imports `useSWR` from "swr" (line 9)
- FOUND: `components/chat/EmailDraft.tsx` imports `Send, Loader2` from "lucide-react" (line 4)
- FOUND: `app/page.tsx` contains `isPro={profile?.plan === "pro"}` (line 500, 509)
- FOUND: `app/page.tsx` contains `onStageMoved` callback (line 511)
- FOUND: `app/page.tsx` contains `pipeline_stage_change` (line 512)
- FOUND commit: aa1e7f3 (Task 1)
- FOUND commit: 6323671 (Task 2)

---
*Phase: 08-chat-ui-reconnection*
*Completed: 2026-04-04*
