---
phase: 05-gmail-send-deliverability
plan: 01
subsystem: gmail
tags: [gmail, encryption, deliverability, redis, prisma, testing]
dependency_graph:
  requires: []
  provides:
    - lib/gmail/token-crypto.ts (encryptToken, decryptToken)
    - lib/gmail/send-quota.ts (getDailyLimit, checkAndIncrementDaily, getDailyKey, checkBounceRate, recordBounce, getJitterMs, markFirstSend)
    - lib/gmail/oauth-client.ts (getOAuth2Client)
    - prisma/schema.prisma GmailToken model
  affects:
    - 05-02 (gmail worker, OAuth callback route — depends on token-crypto, send-quota, GmailToken)
    - 05-03 (EmailDraft UI — depends on send-quota quota display)
tech_stack:
  added:
    - googleapis@171.4.0 (Gmail API OAuth2 client)
  patterns:
    - AES-256-GCM symmetric encryption via Node.js built-in crypto
    - Dependency injection for Redis (testability)
    - In-memory Redis mock for fast isolated tests
    - Wave 0 test stub scaffolding
key_files:
  created:
    - lib/gmail/token-crypto.ts
    - lib/gmail/oauth-client.ts
    - lib/gmail/send-quota.ts
    - tests/lib/gmail-token-encryption.test.ts
    - tests/lib/deliverability.test.ts
    - tests/api/gmail-send.test.ts
  modified:
    - prisma/schema.prisma (GmailToken model added)
    - package.json (googleapis dependency)
    - .env.example (GMAIL_TOKEN_ENCRYPTION_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
decisions:
  - "Used dependency injection (redis as parameter) in send-quota.ts for testability — avoids top-level module import that would fail in test environments without Redis"
  - "getKey() called lazily (inside functions) not at module load time — allows tests to set GMAIL_TOKEN_ENCRYPTION_KEY in beforeAll without module cache issues"
  - "googleapis import timeout (22s) in tests fixed by extending test timeout to 30s for the oauth-client test"
metrics:
  duration: 6 minutes
  completed_date: "2026-04-04"
  tasks_completed: 2
  files_created: 6
  files_modified: 3
---

# Phase 05 Plan 01: Gmail Foundation — Schema, Encryption, Deliverability Libraries Summary

**One-liner:** AES-256-GCM Gmail token encryption, Redis-based warm-up ramp (5/10/20/day), and Wave 0 test scaffolds for SEND-01 through SEND-07.

## What Was Built

### 1. GmailToken Prisma Model

Added to `prisma/schema.prisma` after `CompanyEnrichment`. Fields: `userId` (unique), `encryptedRefreshToken`, `gmailEmail`, `gmailConnectedAt`, `firstSentAt` (null until first send), `createdAt`, `updatedAt`. Maps to `gmail_tokens` table. Schema validated and Prisma client regenerated.

### 2. Token Encryption Library (`lib/gmail/token-crypto.ts`)

AES-256-GCM symmetric encryption for Gmail OAuth refresh tokens. Key is a 32-byte (64 hex chars) value from `GMAIL_TOKEN_ENCRYPTION_KEY` env var. Each encryption generates a fresh 12-byte IV so identical plaintext produces different ciphertext. Encoded format: `iv(12) + authTag(16) + ciphertext` as base64. The `getKey()` function is called lazily inside each exported function to avoid module-load failures in test environments.

### 3. OAuth2Client Factory (`lib/gmail/oauth-client.ts`)

Returns a configured `google.auth.OAuth2` instance pointing to `/api/gmail/connect/callback`. This is completely separate from Supabase authentication (D-01) — different scopes, different redirect URI, different token storage.

### 4. Deliverability Library (`lib/gmail/send-quota.ts`)

Seven exports implementing the deliverability engine:

| Function | Purpose |
|----------|---------|
| `getDailyKey` | Returns Redis key for today's counter |
| `getDailyLimit` | Warm-up ramp: 5/10/20 based on days since first send |
| `checkAndIncrementDaily` | Atomic check+increment with midnight UTC expiry |
| `recordBounce` | Adds bounce to Redis sorted set |
| `checkBounceRate` | 24h rolling window, suspends at >5% (D-12) |
| `getJitterMs` | Random 60-180 second jitter (D-11) |
| `markFirstSend` | SETNX first_sent_at timestamp |

Redis is accepted as a parameter (dependency injection) so callers pass `queueConnection` from `worker/lib/redis.ts` in production, and a mock in tests.

### 5. Test Files (51 passing tests total)

- `tests/lib/gmail-token-encryption.test.ts` — 8 tests: round-trip, IV randomness, tamper detection, wrong key, oauth-client redirect URI
- `tests/lib/deliverability.test.ts` — 29 tests: all warm-up ramp branches, daily limit enforcement, bounce tracking, jitter range, markFirstSend
- `tests/api/gmail-send.test.ts` — 14 Wave 0 stubs: 7 describe blocks for SEND-01 through SEND-07

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | d1f8580 | feat(db): add GmailToken schema, googleapis, token-crypto and oauth-client |
| Task 2 | 4ea0c20 | feat(api): add send-quota deliverability library and Wave 0 test scaffolds |

## Decisions Made

1. **Dependency injection for Redis in send-quota.ts** — avoids top-level module import that would fail in CI/test environments without a live Redis instance. Callers pass `queueConnection` in production.

2. **Lazy key loading in token-crypto.ts** — `getKey()` is called inside each function rather than at module load. This lets tests set `GMAIL_TOKEN_ENCRYPTION_KEY` in `beforeAll` before the module reads the env var.

3. **googleapis import timeout** — importing `googleapis` takes ~5s due to module size. The oauth-client test uses a 30s timeout to accommodate this. No other test is affected since the encryption tests don't import googleapis.

4. **`db push` skipped (no database URL in environment)** — schema change was validated with `npx prisma validate` and Prisma client was regenerated. The actual migration will run when DATABASE_URL is configured.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] googleapis import timeout in tests**
- **Found during:** Task 1 test run
- **Issue:** The oauth-client test timed out at 5s (default) because importing `googleapis` takes ~22s on first import in vitest
- **Fix:** Extended the specific test timeout to 30s with `}, 30000)` — a standard vitest pattern
- **Files modified:** `tests/lib/gmail-token-encryption.test.ts`
- **Commit:** d1f8580 (included in task commit)

**2. [Rule 2 - Missing] Lazy key loading in token-crypto.ts**
- **Found during:** Task 1 implementation
- **Issue:** The research pattern initialized `KEY` at module load time: `const KEY = Buffer.from(process.env.GMAIL_TOKEN_ENCRYPTION_KEY!, "hex")`. This throws at import time if env var is not set (breaks tests that set it in `beforeAll`)
- **Fix:** Moved key derivation into a `getKey()` helper called inside `encryptToken` and `decryptToken`
- **Files modified:** `lib/gmail/token-crypto.ts`
- **Commit:** d1f8580

**3. [Rule 2 - Missing] Added `markFirstSend` export**
- **Found during:** Task 2 implementation
- **Issue:** Plan's acceptance criteria listed `markFirstSend` as a required export but action step 1 description didn't explicitly call it out in the function list
- **Fix:** Implemented `markFirstSend` using `redis.setnx` — stores first_sent_at timestamp once and never overwrites it
- **Files modified:** `lib/gmail/send-quota.ts`, `tests/lib/deliverability.test.ts`
- **Commit:** 4ea0c20

## Known Stubs

`tests/api/gmail-send.test.ts` contains 14 placeholder tests (all `expect(true).toBe(true)`) for SEND-01 through SEND-07. These are intentional Wave 0 scaffolds that will be replaced with real assertions in plans 05-02 (worker/routes) and 05-03 (UI).

## Self-Check: PASSED

All files exist, all commits verified, all 51 tests pass.
