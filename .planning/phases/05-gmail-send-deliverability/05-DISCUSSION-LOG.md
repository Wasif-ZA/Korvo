# Phase 5: Gmail Send & Deliverability - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 05-gmail-send-deliverability
**Areas discussed:** Gmail OAuth flow, Send UX & button placement, Deliverability controls, Unsubscribe footer

---

## Gmail OAuth Flow

| Option                 | Description                                                                 | Selected |
| ---------------------- | --------------------------------------------------------------------------- | -------- |
| Separate OAuth flow    | Second OAuth consent with gmail.send scope, independent from Supabase login | ✓        |
| Upgrade existing OAuth | Re-trigger Google OAuth with additional scope appended                      |          |
| You decide             | Claude picks approach                                                       |          |

**User's choice:** Separate OAuth flow
**Notes:** Cleanest separation — login and send are independent.

| Option                     | Description                                                                | Selected |
| -------------------------- | -------------------------------------------------------------------------- | -------- |
| Settings page + first send | Settings has 'Connect Gmail' section + inline prompt on first send attempt | ✓        |
| Settings page only         | Gmail connection lives exclusively in Settings                             |          |
| Inline only                | No Settings section, OAuth starts on first send click                      |          |

**User's choice:** Settings page + first send
**Notes:** Two entry points for discoverability.

| Option                    | Description                                 | Selected |
| ------------------------- | ------------------------------------------- | -------- |
| Graceful reconnect prompt | On 401, show toast and disable send button  | ✓        |
| Auto-retry then prompt    | Silently attempt refresh first, then prompt |          |
| You decide                | Claude picks                                |          |

**User's choice:** Graceful reconnect prompt
**Notes:** No cryptic errors — clear messaging.

---

## Send UX & Button Placement

| Option                        | Description                                                                         | Selected |
| ----------------------------- | ----------------------------------------------------------------------------------- | -------- |
| Primary action, replaces Copy | Send via Gmail is primary (filled) for Pro+connected. Copy/mailto become secondary. | ✓        |
| Additional button alongside   | Third button next to Copy and Open in Mail                                          |          |
| You decide                    | Claude picks layout                                                                 |          |

**User's choice:** Primary action, replaces Copy as default
**Notes:** Free users keep Copy as primary, no send button.

| Option                         | Description                                                        | Selected |
| ------------------------------ | ------------------------------------------------------------------ | -------- |
| Toast + auto-move to Contacted | Success toast, auto-move to Contacted stage, button shows "Sent ✓" | ✓        |
| Toast + manual move            | Success toast only, manual pipeline move                           |          |
| Confirmation dialog first      | Are you sure dialog before send                                    |          |

**User's choice:** Toast + auto-move to Contacted
**Notes:** One action completes the full loop.

| Option             | Description                              | Selected |
| ------------------ | ---------------------------------------- | -------- |
| Send immediately   | Click → spinner → sent. No confirmation. | ✓        |
| Quick confirmation | Brief inline confirmation before send    |          |
| You decide         | Claude picks                             |          |

**User's choice:** Send immediately
**Notes:** User already reviewed the draft, zero friction.

---

## Deliverability Controls

| Option                      | Description                                                     | Selected |
| --------------------------- | --------------------------------------------------------------- | -------- |
| Counter badge + limit toast | Show X/Y sent today counter, disable on limit, toast on attempt | ✓        |
| Only show on limit hit      | No visible counter, only message on exceed                      |          |
| You decide                  | Claude picks                                                    |          |

**User's choice:** Counter badge + limit toast
**Notes:** Visible counter helps users plan their sends.

| Option                        | Description                                       | Selected |
| ----------------------------- | ------------------------------------------------- | -------- |
| Calendar days from first send | Day 1-7: 5/day, Day 8-14: 10/day, Day 15+: 20/day | ✓        |
| Rolling window                | 7-day rolling volume tracking                     |          |
| You decide                    | Claude picks                                      |          |

**User's choice:** Calendar days from first send
**Notes:** Simple, predictable. Based on first Gmail send, not account creation.

| Option                          | Description                                                              | Selected |
| ------------------------------- | ------------------------------------------------------------------------ | -------- |
| Auto-pause at 5% + notification | Track hard bounces per 24h, auto-disable at >5%, require acknowledgement | ✓        |
| Warn but don't pause            | Warning banner but allow continued sending                               |          |
| You decide                      | Claude picks                                                             |          |

**User's choice:** Auto-pause at 5% + notification
**Notes:** Protects sender reputation over user convenience.

---

## Unsubscribe Footer

| Option                  | Description                                                           | Selected |
| ----------------------- | --------------------------------------------------------------------- | -------- |
| Simple text line        | "If you'd prefer not to hear from me, just let me know." Casual tone. | ✓        |
| Formal unsubscribe link | Standard Unsubscribe link to Korvo-hosted page                        |          |
| You decide              | Claude picks                                                          |          |

**User's choice:** Simple text line
**Notes:** Matches non-corporate email tone. Personal outreach, not bulk marketing.

| Option                   | Description                                                                | Selected |
| ------------------------ | -------------------------------------------------------------------------- | -------- |
| Editable in Settings     | Default text, user can edit in Settings, auto-appended, visible in preview | ✓        |
| Fixed text, not editable | Same footer for everyone                                                   |          |
| You decide               | Claude picks                                                               |          |

**User's choice:** Editable in Settings
**Notes:** Default provided, user can customize.

---

## Claude's Discretion

- Token encryption approach
- Gmail API client setup details
- Redis key structure for counters
- Bounce detection mechanism
- Database schema for gmail_tokens
- BullMQ worker retry strategy

## Deferred Ideas

None — discussion stayed within phase scope.
