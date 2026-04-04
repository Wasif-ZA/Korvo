# Phase 5: Gmail Send & Deliverability - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Pro users can send emails directly from Korvo via their own Gmail account, with warm-up ramp enforcement protecting their sender reputation. Free users keep copy-to-clipboard and mailto. Auto-pipeline tracking moves contacts to "Contacted" on send. Australia Spam Act compliance via configurable unsubscribe footer. No analytics/monitoring (Phase 6), no follow-up automation (V3).

</domain>

<decisions>
## Implementation Decisions

### Gmail OAuth Flow

- **D-01:** Separate OAuth flow from Supabase login. User is already logged in via Supabase Google OAuth. Gmail send requires a SECOND OAuth consent specifically requesting `gmail.send` scope. Login and send are independent.
- **D-02:** Two entry points for connecting Gmail: Settings page has a "Connect Gmail" section showing connection status, AND if a Pro user clicks "Send via Gmail" without connecting, an inline prompt redirects them to OAuth.
- **D-03:** On 401 from Gmail API (token expired/revoked), show toast "Gmail disconnected — reconnect in Settings" and disable send button. No cryptic errors.
- **D-04:** Gmail refresh tokens stored encrypted at rest. Handle Google's 100-token-per-user limit — when limit reached, user sees "Reconnect Gmail" prompt (per SEND-03).

### Send UX & Button Placement

- **D-05:** For Pro+connected users, "Send via Gmail" is the primary (filled) button. Copy and mailto become secondary (outline). For Free users, Copy stays primary, mailto secondary, no send button visible.
- **D-06:** Click "Send via Gmail" → spinner → sent. No confirmation dialog. User already reviewed the draft. Fast, zero friction.
- **D-07:** On successful send: success toast ("Email sent to john@company.com"), contact auto-moves to "Contacted" stage in pipeline (per SEND-06), send button changes to "Sent ✓" (disabled). One action completes the full loop.
- **D-08:** Optimistic update on auto-move — move contact in UI immediately, fire PATCH in background, revert on failure with toast error (carries forward Phase 4 D-07 pattern).

### Deliverability Controls

- **D-09:** Warm-up ramp based on calendar days from first Gmail send: Day 1-7: 5/day, Day 8-14: 10/day, Day 15+: 20/day. Tracked per user. Simple, predictable.
- **D-10:** Daily send counter visible near send button: "X/Y sent today". When limit reached, send button disabled with tooltip "Daily limit reached (X/day). Resets tomorrow." Toast on attempt: "You've reached your daily send limit to protect your sender reputation."
- **D-11:** Send interval jitter: randomized 60-180 second delay between sends, enforced in BullMQ gmail-send-queue worker (per SEND-05).
- **D-12:** Bounce rate monitoring: track hard bounces per 24h rolling window. If >5% hard bounces, auto-disable Gmail send with warning: "Sending paused — too many bounces. Check your email addresses." User must acknowledge to re-enable.
- **D-13:** Daily send counters and warm-up state tracked in Redis (same instance as BullMQ). Rate limit checked before enqueuing to gmail-send-queue.

### Unsubscribe Footer (Australia Spam Act)

- **D-14:** Simple text line appended below email body: "If you'd prefer not to hear from me, just let me know." Casual tone matching the non-corporate email style. Not a mailto unsubscribe link — these are personal outreach, not bulk marketing.
- **D-15:** Footer text editable in Settings page. Default provided. Auto-appended to every Gmail send. Visible in email draft preview so user sees exactly what will be sent.

### Claude's Discretion

- Token encryption approach (AES-256-GCM, libsodium, or Node.js crypto — pick simplest secure option)
- Gmail API client setup details (googleapis library configuration)
- Redis key structure for daily counters and warm-up tracking
- Bounce detection mechanism (Gmail API response codes vs webhook)
- Database schema for gmail_tokens table (columns, indexes)
- BullMQ gmail-send worker retry/backoff strategy

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements

- `.planning/REQUIREMENTS.md` §Email Sending & Deliverability — SEND-01 through SEND-07 acceptance criteria

### Project Context

- `.planning/PROJECT.md` — Tech stack (googleapis v171.4.0), Gmail API scope (`gmail.send`), deliverability rules, legal constraints
- `CLAUDE.md` §Technology Stack §Email (Gmail API) — Send limits, jitter, bounce monitoring, SPF/DKIM/DMARC notes

### Existing Code

- `worker/gmail-send.worker.ts` — Stub worker for gmail-send-queue, ready for Phase 5 implementation
- `shared/queues.ts` — QUEUE_NAMES.GMAIL_SEND already defined
- `shared/types/jobs.ts` — GmailSendJobData interface (outreachId, userId, contactId, to, subject, body)
- `components/app/EmailDraft.tsx` — Existing email draft component with Copy + mailto, needs "Send via Gmail" button
- `prisma/schema.prisma` — Current schema (Profile, Search, Contact, Outreach) — needs gmail_tokens table
- `app/(app)/settings/page.tsx` — Settings page, needs "Connect Gmail" section

### Prior Phase Context

- `.planning/phases/02-queue-infrastructure/02-CONTEXT.md` — BullMQ queue setup, gmail-send-queue decisions
- `.planning/phases/04-ui-dashboard/04-CONTEXT.md` — SWR data fetching, optimistic update pattern, EmailDraft component integration

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `worker/gmail-send.worker.ts` — Stub BullMQ worker for gmail-send-queue, already wired into worker/index.ts. Replace stub with actual Gmail API send logic.
- `shared/types/jobs.ts` — `GmailSendJobData` type already defined with outreachId, userId, contactId, to, subject, body fields.
- `shared/queues.ts` — `QUEUE_NAMES.GMAIL_SEND` constant already exists.
- `components/app/EmailDraft.tsx` — Full email draft component with inline editing, auto-save, copy-to-clipboard, and mailto. Add "Send via Gmail" button here.
- `worker/lib/redis.ts` — Redis connection for workers, reuse for deliverability counters.

### Established Patterns

- **BullMQ job flow:** API route enqueues job → worker processes → result stored in DB. Established in Phase 2.
- **Optimistic UI updates:** Kanban stage moves use optimistic pattern (update UI → fire API → revert on failure). Reuse for auto-move to "Contacted".
- **SWR + mutate():** All data fetching uses SWR with `mutate()` for cache invalidation. Gmail send status should invalidate relevant caches.
- **Settings page structure:** Settings page already exists at `app/(app)/settings/page.tsx`. Add Gmail connection section.
- **Supabase Auth:** Google OAuth login via Supabase. Gmail OAuth is SEPARATE — different scopes, different tokens, different storage.

### Integration Points

- **EmailDraft component:** Add conditional "Send via Gmail" button based on user plan + Gmail connection status.
- **Settings page:** Add "Connect Gmail" section with connection status, connect/disconnect buttons.
- **Profile model:** May need `gmailConnectedAt` field or separate `gmail_tokens` table.
- **API routes:** Need POST /api/gmail/send (enqueue), GET /api/gmail/status (connection check), POST /api/gmail/connect (OAuth callback).
- **Worker:** Replace stub in gmail-send.worker.ts with googleapis send logic + deliverability enforcement.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 05-gmail-send-deliverability_
_Context gathered: 2026-04-04_
