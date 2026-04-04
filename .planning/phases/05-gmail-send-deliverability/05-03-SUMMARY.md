---
phase: 05-gmail-send-deliverability
plan: 03
subsystem: ui
tags: [gmail, send, settings, optimistic-update, daily-counter, unsubscribe-footer, pro-gating]

requires:
  - phase: 05-02
    provides: GET /api/gmail/status, POST /api/gmail/send, GET /api/gmail/connect, DELETE /api/gmail/disconnect

provides:
  - components/app/EmailDraft.tsx — conditional Send via Gmail button for Pro+connected, daily counter badge, optimistic pipeline stage move
  - components/app/GmailStatusBadge.tsx — reusable inline badge with sent today / limit reached / suspended states
  - app/(app)/settings/SettingsClient.tsx — GmailConnectionSection and UnsubscribeFooterEditor client components
  - app/(app)/settings/page.tsx — Gmail Integration section with Pro-gated footer editor
  - app/api/settings/route.ts — PATCH endpoint for updating unsubscribeFooter

affects: [email-draft-component, settings-page, pipeline-stage-tracking]

tech-stack:
  added: []
  patterns:
    - "useSWR + mutate() for Gmail status polling and cache invalidation on send"
    - "Optimistic pipeline stage move: update UI immediately, revert on API failure"
    - "Plan-tier conditional rendering: isPro prop drives Send via Gmail button visibility"
    - "OAuth return URL param handling: ?gmail=connected shows success toast, ?gmail=error shows error"
    - "Defense-in-depth: rate limit checked client-side (disable button) AND server-side (API returns 429)"

key-files:
  created:
    - components/app/GmailStatusBadge.tsx
    - app/api/settings/route.ts
  modified:
    - components/app/EmailDraft.tsx
    - app/(app)/settings/SettingsClient.tsx
    - app/(app)/settings/page.tsx

key-decisions:
  - "Send via Gmail is only primary button when isPro AND isGmailConnected — three distinct rendering paths"
  - "Optimistic stage move reverts to 'identified' on any API failure (consistent with Phase 4 D-07 pattern)"
  - "GmailConnectionSection uses useSearchParams to detect OAuth return params and show success/error toast"
  - "UnsubscribeFooterEditor saves via PATCH /api/settings, not inline action — reuses settings endpoint pattern"
  - "app/api/settings/route.ts created as general settings patch endpoint, not Gmail-specific"

requirements-completed:
  - SEND-01
  - SEND-03

duration: 8min
completed: 2026-04-04
---

# Phase 05 Plan 03: Gmail Send UI and Settings Summary

**Complete Gmail send UX: Send via Gmail button for Pro+connected users, daily counter badge, Settings Gmail Integration section with connect/disconnect/reconnect states, unsubscribe footer editor**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-04T07:20:00Z
- **Completed:** 2026-04-04T07:28:00Z
- **Tasks:** 2 (Task 3 auto-approved per auto_advance config)
- **Files modified:** 5

## Accomplishments

### Task 1: EmailDraft and GmailStatusBadge
- EmailDraft extended with `isPro`, `contactId`, `onStageMoved` props
- Free users: Copy (primary) + Mailto (secondary) — no Send via Gmail visible at all (SEND-01)
- Pro + not connected: Copy (primary) + inline "Connect Gmail to send directly" link to /settings?section=gmail
- Pro + connected: Send via Gmail (primary, filled), Copy and Mailto become outline secondary buttons
- `handleSendViaGmail`: spinner on send, "Sent" checkmark on success, error toasts for disconnected/rate-limited/bounce-suspended
- Optimistic `onStageMoved(contactId, 'contacted')` on send — reverts to 'identified' on any API failure
- Daily counter badge (`GmailStatusBadge`) shows X/Y sent today (green), limit reached (amber), Sending paused (red)
- Unsubscribe footer preview text visible below email body for Pro+connected users
- New `GmailStatusBadge` component with three visual states

### Task 2: Settings Gmail Integration
- `GmailConnectionSection` client component: four states — not-pro (upsell), not-connected (connect button), connected (green badge + disconnect), reconnect-required (amber warning), bounce-suspended (red warning)
- Handles `?gmail=connected` and `?gmail=error` URL params on OAuth return with success/error toasts
- `UnsubscribeFooterEditor` component: editable text input, PATCH /api/settings on save, 200 char limit
- Settings page adds "Gmail Integration" section after subscription section, with Pro-gated footer editor
- `app/api/settings/route.ts` created as general PATCH settings endpoint (validates with zod, updates Profile.unsubscribeFooter)
- Settings page now selects `unsubscribeFooter` from profile and passes to UnsubscribeFooterEditor

## Task Commits

1. **Task 1: Send via Gmail button and GmailStatusBadge** — `b31c4f0` (feat)
2. **Task 2: Gmail settings section and unsubscribe footer editor** — `ea6934e` (feat)

## Files Created/Modified

- `components/app/GmailStatusBadge.tsx` — new; reusable badge with three visual states
- `components/app/EmailDraft.tsx` — extended with isPro, contactId, onStageMoved, Gmail send flow
- `app/(app)/settings/SettingsClient.tsx` — added GmailConnectionSection, UnsubscribeFooterEditor
- `app/(app)/settings/page.tsx` — added Gmail Integration section, unsubscribeFooter select
- `app/api/settings/route.ts` — new; PATCH endpoint for updating profile settings fields

## Deviations from Plan

**1. [Rule 2 - Auto-fix] Typed AccountForm props instead of using `any`**
- Found during: Task 2 — ESLint blocked commit with `@typescript-eslint/no-explicit-any`
- Fix: Added `AccountFormProps` interface (initialName, email, avatarUrl) to replace implicit `any`
- Files modified: `app/(app)/settings/SettingsClient.tsx`
- Commit: ea6934e

**2. [Rule 1 - Bug] Fixed JSX comment text node in EmailDraft header**
- Found during: Task 1 — ESLint `react/jsx-no-comment-textnodes` error on `// Email_Draft_Buffer \\`
- Fix: Wrapped header text in JSX expression braces
- Files modified: `components/app/EmailDraft.tsx`
- Commit: b31c4f0

## Known Stubs

None — all acceptance criteria met, Gmail send flow fully wired to API routes from Plan 02.

## Self-Check: PASSED

- `components/app/GmailStatusBadge.tsx` — FOUND
- `components/app/EmailDraft.tsx` — FOUND (contains isPro, contactId, onStageMoved, handleSendViaGmail, daily send limit)
- `app/(app)/settings/SettingsClient.tsx` — FOUND (contains GmailConnectionSection, UnsubscribeFooterEditor, Gmail connection expired)
- `app/(app)/settings/page.tsx` — FOUND (contains Gmail_Integration section)
- `app/api/settings/route.ts` — FOUND
- Commits b31c4f0, ea6934e — FOUND

---
*Phase: 05-gmail-send-deliverability*
*Completed: 2026-04-04*
