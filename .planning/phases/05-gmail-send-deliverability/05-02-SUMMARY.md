---
phase: 05-gmail-send-deliverability
plan: 02
subsystem: api
tags: [gmail, oauth, bullmq, redis, deliverability, token-encryption, rate-limiting]

requires:
  - phase: 05-01
    provides: GmailToken schema, token-crypto (encryptToken/decryptToken), send-quota functions (checkAndIncrementDaily, getJitterMs, recordBounce, checkBounceRate, markFirstSend), oauth-client (getOAuth2Client)

provides:
  - GET /api/gmail/connect — initiates Gmail OAuth with gmail.send scope, CSRF state cookie
  - GET /api/gmail/connect/callback — validates CSRF, exchanges code, encrypts and stores refresh token
  - DELETE /api/gmail/disconnect — removes GmailToken record, cleans Redis warmup/suspension keys
  - GET /api/gmail/status — connection state, daily counter, suspension and reconnect flags
  - POST /api/gmail/send — validates pro/connection/rate/bounce, appends footer, enqueues with jitter
  - worker/gmail-send.worker.ts — full Gmail API send, auto-moves contact to contacted stage, handles invalid_grant and bounces
  - lib/gmail/redis-client.ts — lightweight Redis client for API route context
  - Profile.unsubscribeFooter field for customizable unsubscribe footer text

affects: [05-03, ui, settings-page, email-draft-component]

tech-stack:
  added: []
  patterns:
    - "CSRF state cookie pattern for OAuth flows (gmail_oauth_state httpOnly cookie, 10-min TTL)"
    - "Defense-in-depth rate limiting: checked at both API route enqueue time AND worker execution"
    - "Error type detection for invalid_grant and bounce-like SMTP errors without rethrowing"
    - "RFC2822 message building with base64url encoding for Gmail API raw send"
    - "Unsubscribe footer appended at enqueue time (not worker) — body already complete when job runs"

key-files:
  created:
    - app/api/gmail/connect/route.ts
    - app/api/gmail/connect/callback/route.ts
    - app/api/gmail/disconnect/route.ts
    - app/api/gmail/status/route.ts
    - app/api/gmail/send/route.ts
    - lib/gmail/redis-client.ts
  modified:
    - worker/gmail-send.worker.ts
    - prisma/schema.prisma

key-decisions:
  - "prompt:consent mandatory in OAuth URL — without it reconnects don't receive a refresh_token (Pitfall 1)"
  - "Unsubscribe footer appended at enqueue time in send route, not in worker — body is complete when job runs"
  - "Defense-in-depth: daily rate check runs in both send route (pre-enqueue) and worker (pre-send)"
  - "invalid_grant handled by deleting GmailToken and setting redis reconnect_required flag — no retry, user must reconnect"
  - "Bounce errors do not rethrow — job completes normally, recordBounce tracks the bad address"
  - "Redis client for API routes uses REDIS_URL env var (single URL), worker context uses REDIS_HOST/PORT split"

patterns-established:
  - "Pattern: CSRF OAuth protection — state=randomBytes(32), stored in httpOnly cookie, validated in callback"
  - "Pattern: Dual Redis client — REDIS_URL for API routes on Vercel, REDIS_HOST/PORT for BullMQ workers on Railway"
  - "Pattern: Defense-in-depth rate enforcement — same check at HTTP layer and worker layer"

requirements-completed:
  - SEND-02
  - SEND-05
  - SEND-06
  - SEND-07

duration: 4min
completed: 2026-04-04
---

# Phase 05 Plan 02: Gmail API Routes and Worker Summary

**5 Gmail OAuth/send API routes + full BullMQ worker replacing stub: OAuth connect with CSRF protection, encrypted token storage, daily rate limits, bounce tracking, jitter delays, and auto contact stage progression**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-04T07:13:13Z
- **Completed:** 2026-04-04T07:16:23Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Gmail OAuth connect flow with CSRF state protection, `prompt:consent` to guarantee refresh_token on every consent
- OAuth callback exchanges code, encrypts refresh token with AES-256-GCM (from Plan 01), upserts GmailToken
- Disconnect route removes DB record and clears all Redis warmup/suspension/reconnect keys
- Status route returns full connection state including daily counter, suspension flag, reconnect-required flag
- Send route validates Pro plan, Gmail connection, bounce suspension, and daily rate limit before enqueuing with 60-180s jitter
- Worker fully replaces stub: decrypts token, builds RFC2822 message, sends via Gmail API, marks outreach sent, auto-moves contact to "contacted" pipeline stage
- Worker handles `invalid_grant` by deleting token and setting reconnect flag (no retry), handles bounce-like SMTP errors by recording bounce without retry
- Unsubscribe footer appended at enqueue time in send route (D-14, D-15)
- Added `unsubscribeFooter` field to Profile schema for user customization

## Task Commits

1. **Task 1: Gmail OAuth routes (connect, callback, disconnect, status)** - `7f1b21d` (feat)
2. **Task 2: Send route and full gmail-send worker** - `c9124dd` (feat)

## Files Created/Modified

- `app/api/gmail/connect/route.ts` — GET: OAuth initiation with CSRF state, prompt:consent, gmail.send scope
- `app/api/gmail/connect/callback/route.ts` — GET: CSRF validation, code exchange, token encryption and upsert
- `app/api/gmail/disconnect/route.ts` — DELETE: removes GmailToken record and all related Redis keys
- `app/api/gmail/status/route.ts` — GET: connection state, daily counter, suspended, reconnectRequired
- `app/api/gmail/send/route.ts` — POST: pro/connection/rate/bounce checks, footer append, jitter enqueue
- `lib/gmail/redis-client.ts` — lightweight Redis client using REDIS_URL for API route context
- `worker/gmail-send.worker.ts` — full Gmail API send worker replacing placeholder stub
- `prisma/schema.prisma` — added `unsubscribeFooter String? @map("unsubscribe_footer")` to Profile model

## Decisions Made

- `prompt:consent` is mandatory in the OAuth URL — without it Google won't return a refresh_token on reconnects (Pitfall 1 from research)
- Unsubscribe footer appended at enqueue time (in the send route), not in the worker — the job's `body` field is already complete when it reaches the worker
- Defense-in-depth: daily rate limit checked at both the HTTP layer (pre-enqueue) and worker layer (pre-send), ensuring no over-sending even if jobs pile up
- API routes use `REDIS_URL` (single connection string, suited for Vercel), while the worker uses `REDIS_HOST`/`REDIS_PORT` (Railway private networking)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — all implementation followed the plan specification directly.

## User Setup Required

None - no new external service configuration required beyond what Plan 01 established (GMAIL_TOKEN_ENCRYPTION_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIS_URL).

The `unsubscribeFooter` field added to the Profile model will need a Supabase migration via `npx prisma db push` before the settings UI can expose the custom footer feature (Plan 03 work).

## Known Stubs

None — the gmail-send worker stub has been fully replaced with production implementation.

## Next Phase Readiness

- All 5 Gmail API routes are complete and ready for UI integration (Plan 03)
- Worker is fully functional — connect Gmail, send route enqueues job, worker delivers email and moves contact
- The `profile.unsubscribeFooter` field is in schema, ready for settings UI to expose customization
- `GET /api/gmail/status` provides all data needed for the settings page Gmail connection section and send button state

---
*Phase: 05-gmail-send-deliverability*
*Completed: 2026-04-04*
