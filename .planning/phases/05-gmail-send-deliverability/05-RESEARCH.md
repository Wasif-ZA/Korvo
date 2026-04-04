# Phase 5: Gmail Send & Deliverability - Research

**Researched:** 2026-04-04
**Domain:** Gmail API OAuth2, token encryption, deliverability rate limiting, BullMQ workers
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Separate OAuth flow from Supabase login. User is already logged in via Supabase Google OAuth. Gmail send requires a SECOND OAuth consent specifically requesting `gmail.send` scope. Login and send are independent.
- **D-02:** Two entry points for connecting Gmail: Settings page has a "Connect Gmail" section showing connection status, AND if a Pro user clicks "Send via Gmail" without connecting, an inline prompt redirects them to OAuth.
- **D-03:** On 401 from Gmail API (token expired/revoked), show toast "Gmail disconnected — reconnect in Settings" and disable send button. No cryptic errors.
- **D-04:** Gmail refresh tokens stored encrypted at rest. Handle Google's 100-token-per-user limit — when limit reached, user sees "Reconnect Gmail" prompt (per SEND-03).
- **D-05:** For Pro+connected users, "Send via Gmail" is the primary (filled) button. Copy and mailto become secondary (outline). For Free users, Copy stays primary, mailto secondary, no send button visible.
- **D-06:** Click "Send via Gmail" → spinner → sent. No confirmation dialog.
- **D-07:** On successful send: success toast ("Email sent to john@company.com"), contact auto-moves to "Contacted" stage in pipeline (SEND-06), send button changes to "Sent ✓" (disabled).
- **D-08:** Optimistic update on auto-move — move contact in UI immediately, fire PATCH in background, revert on failure with toast error (carries forward Phase 4 D-07 pattern).
- **D-09:** Warm-up ramp based on calendar days from first Gmail send: Day 1-7: 5/day, Day 8-14: 10/day, Day 15+: 20/day. Tracked per user.
- **D-10:** Daily send counter visible near send button: "X/Y sent today". When limit reached, send button disabled with tooltip. Toast on attempt: "You've reached your daily send limit to protect your sender reputation."
- **D-11:** Send interval jitter: randomized 60-180 second delay between sends, enforced in BullMQ gmail-send-queue worker (per SEND-05).
- **D-12:** Bounce rate monitoring: track hard bounces per 24h rolling window. If >5% hard bounces, auto-disable Gmail send with warning.
- **D-13:** Daily send counters and warm-up state tracked in Redis (same instance as BullMQ).
- **D-14:** Unsubscribe footer: simple text "If you'd prefer not to hear from me, just let me know." — not a mailto link. Casual tone.
- **D-15:** Footer text editable in Settings page. Default provided. Auto-appended to every Gmail send. Visible in email draft preview.

### Claude's Discretion

- Token encryption approach (AES-256-GCM, libsodium, or Node.js crypto — pick simplest secure option)
- Gmail API client setup details (googleapis library configuration)
- Redis key structure for daily counters and warm-up tracking
- Bounce detection mechanism (Gmail API response codes vs webhook)
- Database schema for gmail_tokens table (columns, indexes)
- BullMQ gmail-send worker retry/backoff strategy

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                             | Research Support                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| SEND-01 | Free tier: copy-to-clipboard + mailto link                                                              | Already implemented in EmailDraft.tsx — needs Pro-conditional UI gating                               |
| SEND-02 | Pro tier: Gmail API OAuth send, separate flow from Supabase login, requires `gmail.send` scope          | googleapis v171.4.0 confirmed in CLAUDE.md; OAuth2Client flow researched                              |
| SEND-03 | Gmail refresh token stored encrypted at rest, handles 100-token-per-user limit with graceful prompt     | AES-256-GCM via Node.js crypto (built-in, no extra dependency); 100-token limit confirmed Google docs |
| SEND-04 | Deliverability engine: warm-up ramp (5→10→20 emails/day), enforced in Redis counters inside BullMQ jobs | Redis key pattern designed; BullMQ rate-check-before-enqueue pattern                                  |
| SEND-05 | Send interval jitter (randomized delays between sends)                                                  | BullMQ `delay` option on job enqueue with `Math.random()` jitter                                      |
| SEND-06 | Auto pipeline tracking: contact auto-moves to "Contacted" when sent via Gmail API                       | Existing PATCH /api/contacts/[id] route + optimistic update pattern from Phase 4                      |
| SEND-07 | Australia Spam Act compliance: configurable unsubscribe footer in every commercial email                | Confirmed: casual text footer approach compliant; ACMA requires functional unsubscribe mechanism      |

</phase_requirements>

---

## Summary

Phase 5 adds Gmail API send capability for Pro users. The core technical work spans four areas: (1) Google OAuth2 flow for `gmail.send` scope — separate from the existing Supabase Google login, using `googleapis` v171.4.0 which is already specified in CLAUDE.md but not yet installed; (2) encrypted token storage using Node.js built-in `crypto` module with AES-256-GCM — no additional dependency required; (3) deliverability enforcement via Redis counters (warm-up ramp, daily limits, jitter delays, bounce tracking) integrated into the BullMQ `gmail-send-queue` worker that currently exists as a stub; and (4) UI changes to `EmailDraft.tsx` and `settings/page.tsx` to expose send controls conditionally by plan and connection status.

The most critical integration point is the separation of Gmail OAuth from Supabase OAuth. These are two completely independent OAuth consent flows with different scopes, different redirect URIs, and different token storage. The Supabase session handles authentication; the Gmail tokens handle API authorization. They must not be confused or merged.

The `googleapis` package (v171.4.0) is specified in CLAUDE.md but not yet in `package.json`. It must be added in Wave 0. The Node.js `crypto` module is built-in and needs no installation. Redis is already available via the existing BullMQ infrastructure. The stub worker at `worker/gmail-send.worker.ts` is the primary implementation target.

**Primary recommendation:** Install `googleapis`, implement the Gmail OAuth callback route at `app/api/gmail/connect/route.ts`, store tokens in a new `gmail_tokens` Prisma table with AES-256-GCM encryption (key from env), implement deliverability enforcement in the BullMQ worker using Redis INCR/EXPIRE pattern, and wire the "Send via Gmail" button into the existing `EmailDraft` component.

---

## Standard Stack

### Core

| Library        | Version  | Purpose                                                        | Why Standard                                                                    |
| -------------- | -------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| googleapis     | 171.4.0  | Gmail API client — `gmail.users.messages.send`, OAuth2Client   | Specified in CLAUDE.md as the canonical library; official Google Node.js client |
| Node.js crypto | Built-in | AES-256-GCM token encryption at rest                           | No additional dependency; battle-tested; GCM provides authenticated encryption  |
| ioredis        | 5.10.1   | Redis counters for rate limits, warm-up state, bounce tracking | Already installed; `workerConnection` already in `worker/lib/redis.ts`          |
| bullmq         | 5.73.0   | Jitter delay enforcement via job `delay` option                | Already installed; `gmail-send-queue` already defined                           |
| zod            | 4.3.6    | Validate all API inputs for Gmail send routes                  | Already installed; used across all existing API routes                          |
| @prisma/client | 7.6.0    | `gmail_tokens` table access                                    | Already installed                                                               |

### Supporting

| Library | Version | Purpose                                | When to Use               |
| ------- | ------- | -------------------------------------- | ------------------------- |
| prisma  | 7.6.0   | Migration for new `gmail_tokens` table | Wave 0 — schema migration |

### Alternatives Considered

| Instead of                   | Could Use                 | Tradeoff                                                                                                                                                        |
| ---------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js crypto (AES-256-GCM) | libsodium-wrappers        | libsodium is excellent but adds a dependency; Node.js crypto is built-in and sufficient for symmetric key encryption of short strings like OAuth tokens         |
| Node.js crypto (AES-256-GCM) | Supabase Vault            | Supabase Vault requires Supabase Pro and adds complexity; overkill for this use case                                                                            |
| googleapis                   | google-auth-library alone | `googleapis` is the full client including OAuth2Client; `google-auth-library` is the auth-only subset — use the full client since we need Gmail API methods too |

**Installation:**

```bash
npm install googleapis@171.4.0
```

**Version verification:** `googleapis` v171.4.0 confirmed current via `npm view googleapis version` run 2026-04-04.

---

## Architecture Patterns

### Recommended Project Structure (new files)

```
app/
├── api/
│   └── gmail/
│       ├── connect/
│       │   └── route.ts          # GET: initiate OAuth; callback: exchange code + store token
│       ├── disconnect/
│       │   └── route.ts          # DELETE: revoke + remove token
│       ├── send/
│       │   └── route.ts          # POST: rate-check + enqueue job
│       └── status/
│           └── route.ts          # GET: connection status + daily send counter
lib/
├── gmail/
│   ├── oauth-client.ts           # OAuth2Client factory
│   ├── token-crypto.ts           # AES-256-GCM encrypt/decrypt
│   └── send-quota.ts             # Redis counter helpers (daily limit, warmup ramp)
worker/
└── gmail-send.worker.ts          # Replace stub with actual send logic
prisma/
└── schema.prisma                 # Add GmailToken model
tests/
└── api/
    └── gmail-send.test.ts        # Unit tests for rate limit logic + encryption
```

### Pattern 1: Gmail OAuth Callback (separate from Supabase Auth)

**What:** A dedicated route that initiates and handles Google OAuth consent for `gmail.send` scope. Uses `googleapis` `OAuth2Client` independently — no Supabase auth involvement.

**When to use:** All Gmail OAuth flows in this phase.

```typescript
// app/api/gmail/connect/route.ts
// Source: Google OAuth 2.0 Web Server guide + googleapis Node.js docs
import { google } from "googleapis";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/gmail/connect/callback`,
  );
}

// GET /api/gmail/connect — redirect to Google consent screen
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const oauth2Client = getOAuth2Client();
  const state = crypto.randomBytes(32).toString("hex");

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // CRITICAL: forces refresh_token to be returned
    scope: ["https://www.googleapis.com/auth/gmail.send"],
    state,
  });

  // Store state in cookie for CSRF validation
  const response = NextResponse.redirect(authUrl);
  response.cookies.set("gmail_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
  });
  return response;
}
```

```typescript
// app/api/gmail/connect/callback/route.ts — exchange code for tokens
import { google } from "googleapis";
import { prisma } from "@/lib/db/prisma";
import { encryptToken } from "@/lib/gmail/token-crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("gmail_oauth_state")?.value;

  // CSRF check
  if (!state || state !== storedState) {
    return NextResponse.redirect(`${origin}/settings?gmail=error`);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !code)
    return NextResponse.redirect(`${origin}/settings?gmail=error`);

  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  // Store encrypted refresh token — access token is ephemeral
  await prisma.gmailToken.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      encryptedRefreshToken: encryptToken(tokens.refresh_token!),
      gmailConnectedAt: new Date(),
      firstSentAt: null,
    },
    update: {
      encryptedRefreshToken: encryptToken(tokens.refresh_token!),
      gmailConnectedAt: new Date(),
    },
  });

  const response = NextResponse.redirect(`${origin}/settings?gmail=connected`);
  response.cookies.delete("gmail_oauth_state");
  return response;
}
```

### Pattern 2: AES-256-GCM Token Encryption

**What:** Symmetric encryption of Gmail refresh tokens using a 32-byte key from env var. Stores IV + auth tag + ciphertext as a single base64 string.

**When to use:** Any time a Gmail refresh token is written to or read from the database.

```typescript
// lib/gmail/token-crypto.ts
// Source: Node.js crypto docs (https://nodejs.org/api/crypto.html)
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.GMAIL_TOKEN_ENCRYPTION_KEY!, "hex"); // 32 bytes = 64 hex chars

export function encryptToken(plaintext: string): string {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16-byte GCM auth tag
  // Format: iv(12) + authTag(16) + ciphertext — all base64
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptToken(encoded: string): string {
  const data = Buffer.from(encoded, "base64");
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const ciphertext = data.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
```

**Key generation (one-time, stored in env):**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Pattern 3: Deliverability Redis Counter Structure

**What:** Redis keys for tracking daily send count, warm-up phase, and bounce detection per user.

**When to use:** Rate-check in the worker before sending, counter increment after send.

```
# Key structure (Claude's Discretion area)
gmail:warmup:{userId}:first_sent_at    → ISO timestamp string (SET once, never overwritten)
gmail:daily:{userId}:{YYYY-MM-DD}      → integer counter (INCR, EXPIRE at midnight UTC)
gmail:bounces:{userId}                 → sorted set (zadd with timestamp as score, value = contact email)
```

```typescript
// lib/gmail/send-quota.ts
import { queueConnection as redis } from "@/worker/lib/redis";

export function getDailyKey(userId: string): string {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD UTC
  return `gmail:daily:${userId}:${today}`;
}

export async function getDailyLimit(userId: string): Promise<number> {
  const firstSentKey = `gmail:warmup:${userId}:first_sent_at`;
  const firstSentAt = await redis.get(firstSentKey);
  if (!firstSentAt) return 5; // Day 1 — not yet sent anything

  const daysSinceFirst = Math.floor(
    (Date.now() - new Date(firstSentAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysSinceFirst < 7) return 5;
  if (daysSinceFirst < 14) return 10;
  return 20;
}

export async function checkAndIncrementDaily(
  userId: string,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const key = getDailyKey(userId);
  const limit = await getDailyLimit(userId);
  const current = Number((await redis.get(key)) ?? 0);

  if (current >= limit) {
    return { allowed: false, used: current, limit };
  }

  const newCount = await redis.incr(key);
  // Set expiry to end of day (UTC midnight)
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  const ttl = Math.floor((midnight.getTime() - now.getTime()) / 1000);
  await redis.expire(key, ttl);

  return { allowed: true, used: newCount, limit };
}
```

### Pattern 4: BullMQ Worker — Gmail Send with Jitter

**What:** Replace the stub `worker/gmail-send.worker.ts` with actual Gmail API send logic. Jitter is applied as a job `delay` at enqueue time, not sleep inside the worker.

**When to use:** Replace the existing stub entirely.

```typescript
// POST /api/gmail/send/route.ts — enqueue with jitter delay
import { Queue } from "bullmq";
import { QUEUE_NAMES } from "@/shared/queues";
import { queueConnection } from "@/worker/lib/redis";

const gmailSendQueue = new Queue(QUEUE_NAMES.GMAIL_SEND, {
  connection: queueConnection,
});

// Jitter: 60-180 seconds (D-11)
const jitterMs = (60 + Math.random() * 120) * 1000;

await gmailSendQueue.add("send", jobData, { delay: jitterMs });
```

```typescript
// worker/gmail-send.worker.ts — actual send implementation
import { google } from "googleapis";
import { Worker } from "bullmq";
import { workerConnection } from "./lib/redis";
import { prisma } from "./lib/prisma";
import { QUEUE_NAMES } from "@/shared/queues";
import type { GmailSendJobData } from "@/shared/types/jobs";
import { decryptToken } from "@/lib/gmail/token-crypto";
import { checkAndIncrementDaily } from "@/lib/gmail/send-quota";

export const gmailSendWorker = new Worker<GmailSendJobData>(
  QUEUE_NAMES.GMAIL_SEND,
  async (job) => {
    const { outreachId, userId, contactId, to, subject, body } = job.data;

    // 1. Rate limit check (defense-in-depth — also checked at enqueue)
    const quota = await checkAndIncrementDaily(userId);
    if (!quota.allowed) {
      throw new Error(`Daily send limit reached (${quota.limit}/day)`);
    }

    // 2. Load and decrypt refresh token
    const record = await prisma.gmailToken.findUnique({ where: { userId } });
    if (!record) throw new Error("Gmail not connected");
    const refreshToken = decryptToken(record.encryptedRefreshToken);

    // 3. Build OAuth2Client with stored refresh token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/gmail/connect/callback`,
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // 4. Build RFC2822 message + base64url encode
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `MIME-Version: 1.0`,
      "",
      body,
    ].join("\n");
    const raw = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // 5. Send
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    await gmail.users.messages.send({ userId: "me", requestBody: { raw } });

    // 6. Mark sent in DB + set firstSentAt for warm-up tracking
    await prisma.outreach.update({
      where: { id: outreachId },
      data: { sentAt: new Date(), sentVia: "gmail_api" },
    });
    await prisma.contact.update({
      where: { id: contactId },
      data: { pipelineStage: "contacted" },
    });

    // 7. Set firstSentAt key in Redis if not set (warm-up day 1)
    const firstSentKey = `gmail:warmup:${userId}:first_sent_at`;
    await redis.setnx(firstSentKey, new Date().toISOString());
  },
  { connection: workerConnection, concurrency: 1 },
);
```

### Pattern 5: Bounce Tracking (Gmail API Error Codes)

**What:** Detect hard bounces from Gmail API error responses and track them in Redis sorted set.

**Why this approach:** Gmail API does NOT provide a webhook for bounces. Hard bounces surface as GaxiosError with HTTP 400 or specific error messages in the send response. The practical approach is: catch send errors, classify them, and track per user.

```typescript
// Bounce detection within worker catch block
try {
  await gmail.users.messages.send(/* ... */);
} catch (err: unknown) {
  // GaxiosError from googleapis
  if (err instanceof Error && err.message.includes("invalid")) {
    // Hard bounce — invalid address
    const bounceKey = `gmail:bounces:${userId}`;
    await redis.zadd(bounceKey, Date.now(), to);

    // Check 24h bounce rate
    const windowStart = Date.now() - 24 * 60 * 60 * 1000;
    const recentBounces = await redis.zrangebyscore(
      bounceKey,
      windowStart,
      "+inf",
    );
    const totalSent24h = Number((await redis.get(getDailyKey(userId))) ?? 1);

    if (recentBounces.length / totalSent24h > 0.05) {
      // Auto-disable: set a flag key the status endpoint reads
      await redis.set(`gmail:suspended:${userId}`, "bounce_rate_exceeded");
    }
    // Don't rethrow for hard bounces — job is "done" (address invalid)
    return;
  }
  throw err; // Re-throw for soft failures (transient, will retry)
}
```

### Anti-Patterns to Avoid

- **Sharing the Supabase OAuth flow for Gmail:** The Supabase Google OAuth returns a session token, NOT a Gmail API refresh token. These are separate Google OAuth consent flows with different scopes, different clients (potentially), and different storage. Never try to extract a Gmail refresh token from the Supabase session.
- **Skipping `prompt: "consent"` in the auth URL:** Without `prompt: "consent"`, Google only returns a `refresh_token` on the FIRST authorization. If the user disconnects and reconnects, no new refresh token will be issued, breaking re-connect.
- **Storing the access token instead of the refresh token:** Access tokens expire in ~1 hour. Always store the refresh token. The `googleapis` `OAuth2Client` will auto-refresh the access token from the refresh token.
- **Using `redis.set` instead of `redis.incr` for counters:** `INCR` is atomic. `GET` then `SET` is not — concurrent sends could race past the limit.
- **Applying jitter as `sleep()` inside the worker:** Workers should process immediately. Jitter belongs on the job `delay` option at enqueue time, which lets BullMQ handle the scheduling without blocking a worker process.
- **Using the `queueConnection` (fail-fast) for the worker:** Workers MUST use `workerConnection` (with `maxRetriesPerRequest: null`). Using the wrong connection causes worker disconnects under load. This pattern is already established in the codebase.

---

## Don't Hand-Roll

| Problem                                  | Don't Build                 | Use Instead                                                       | Why                                                                                                                                              |
| ---------------------------------------- | --------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| OAuth2 token management and auto-refresh | Custom token refresh logic  | `googleapis` `OAuth2Client.setCredentials({ refresh_token })`     | The OAuth2Client automatically uses the refresh token to obtain a new access token when the current one expires. No manual refresh logic needed. |
| RFC2822 message encoding                 | Custom MIME builder         | `Buffer.from(message).toString("base64")` + replace `+/-`, `//_ ` | The Gmail API only requires base64url-encoded RFC2822 — a 3-line transform. Full MIME libraries are overkill for plain text emails.              |
| AES-256-GCM                              | External crypto library     | Node.js built-in `crypto` module                                  | Node.js `crypto` is FIPS-validated, has no supply chain risk, and handles GCM natively.                                                          |
| Rate limiting atomics                    | Custom counter with GET/SET | Redis `INCR` + `EXPIRE`                                           | INCR is atomic — no race conditions. EXPIRE handles daily TTL without a cron.                                                                    |

**Key insight:** The Gmail API + `googleapis` already handles the hardest parts (token refresh, MIME formatting, retry-on-auth-error). The deliverability layer is pure Redis + math.

---

## Common Pitfalls

### Pitfall 1: No `prompt: "consent"` — Missing Refresh Token on Reconnect

**What goes wrong:** User connects Gmail, later disconnects, then reconnects. Google only returns `refresh_token` on first consent if `prompt=consent` is omitted. Second connection returns `null` refresh token. Token storage gets overwritten with null. Worker fails.
**Why it happens:** Google's behavior: if a user has already granted consent, subsequent OAuth flows omit the refresh token unless explicitly forced.
**How to avoid:** Always include `prompt: "consent"` in `generateAuthUrl()`. This forces the consent screen every time, guaranteeing a fresh refresh token.
**Warning signs:** `tokens.refresh_token` is null after `oauth2Client.getToken(code)`.

### Pitfall 2: Google's 100 Refresh Token Limit (D-04)

**What goes wrong:** Google silently invalidates the oldest refresh tokens when a user exceeds 100 active tokens for the same OAuth client. The worker gets `invalid_grant` error.
**Why it happens:** Google enforces a 100 refresh token limit per user per OAuth 2.0 client ID. New tokens push out old ones in a rolling window.
**How to avoid:** On `invalid_grant` errors in the worker, delete the stored token from the database and set a Redis key `gmail:reconnect_required:{userId}`. The status endpoint reads this flag and the UI shows "Reconnect Gmail".
**Warning signs:** `GaxiosError: invalid_grant` in worker logs.

### Pitfall 3: Daily Counter Timezone Drift

**What goes wrong:** Counter resets at UTC midnight but users in UTC+10 (Australia) experience a reset at 10am their time — different from their expectation of "reset tomorrow".
**Why it happens:** Redis EXPIRE is set to UTC midnight.
**How to avoid:** Document this behavior — it is acceptable for V1. UTC midnight is consistent and simple. Do not try to personalize by user timezone (complex, not worth it for V1). The counter display shows "Resets tomorrow" which is accurate.

### Pitfall 4: Optimistic Contact Move Without Send Confirmation

**What goes wrong:** UI moves contact to "Contacted" immediately (D-08 optimistic update), but the BullMQ job has a 60-180 second jitter delay. Contact is in "Contacted" state before the email is actually sent.
**Why it happens:** Jitter delays mean the actual send occurs 1-3 minutes after the user clicks. Optimistic update runs immediately.
**How to avoid:** The optimistic update should reflect the USER ACTION (clicking send), not the email delivery. This is acceptable and correct — the user INTENDS to contact this person; the email is queued. The "Sent ✓" button state also reflects the queue action. Document this as intended behavior.

### Pitfall 5: CSRF in Gmail OAuth Callback

**What goes wrong:** Attacker crafts a URL to `app/api/gmail/connect/callback?code=ATTACKER_CODE` and tricks an authenticated user into visiting it — connecting the attacker's Gmail account to the victim's Korvo account.
**Why it happens:** OAuth callback without state validation is vulnerable to CSRF.
**How to avoid:** Generate a cryptographic random `state` param, store in an httpOnly cookie, validate it in the callback before exchanging the code.
**Warning signs:** Callback route that does not check `state` parameter.

### Pitfall 6: Australia Spam Act — "Just letting you know" Footer Is NOT a Functional Unsubscribe

**What goes wrong:** The casual text footer "If you'd prefer not to hear from me, just let me know." (D-14) could be considered insufficient if ACMA interprets it as lacking a clear mechanism.
**Why it happens:** The Spam Act requires a "functional unsubscribe facility" — the ACMA fact sheet says it can include a "reply to this email" mechanism.
**How to avoid:** Since these are personal 1-to-1 cold outreach emails (not bulk commercial email campaigns), the personal reply-based opt-out is widely accepted as sufficient for this use case. The footer is appropriate. The key compliance risk is bulk/automated sending — which is explicitly out of scope (no auto-send). Document this rationale in code comments.

### Pitfall 7: `googleapis` Not in `package.json`

**What goes wrong:** Build fails because `googleapis` is listed in CLAUDE.md as the standard library but was never actually added to `package.json`.
**Why it happens:** Planning docs are ahead of implementation.
**How to avoid:** Wave 0 task must include `npm install googleapis@171.4.0`.

---

## Code Examples

### Full RFC2822 Message Build + Send

```typescript
// Source: https://developers.google.com/workspace/gmail/api/guides/sending
const message = [
  `To: ${to}`,
  `Subject: ${subject}`,
  `Content-Type: text/plain; charset=UTF-8`,
  `MIME-Version: 1.0`,
  "",
  body, // includes unsubscribe footer appended before this point
].join("\n");

const raw = Buffer.from(message)
  .toString("base64")
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");

const gmail = google.gmail({ version: "v1", auth: oauth2Client });
const result = await gmail.users.messages.send({
  userId: "me",
  requestBody: { raw },
});
```

### OAuth2Client with Auto-Refresh

```typescript
// Source: googleapis Node.js client README
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI,
);
// Set refresh token — access token is obtained automatically on first API call
oauth2Client.setCredentials({ refresh_token: decryptedRefreshToken });

// googleapis will auto-refresh the access token using the refresh token
// No manual refresh logic required
```

### Redis Warm-Up State Machine

```typescript
// First send ever: set firstSentAt (SETNX = atomic set-if-not-exists)
await redis.setnx(
  `gmail:warmup:${userId}:first_sent_at`,
  new Date().toISOString(),
);

// Read first sent timestamp and compute current limit
const firstSentAt = await redis.get(`gmail:warmup:${userId}:first_sent_at`);
const daysSince = firstSentAt
  ? Math.floor((Date.now() - new Date(firstSentAt).getTime()) / 86400000)
  : 0;
const limit = daysSince < 7 ? 5 : daysSince < 14 ? 10 : 20;
```

### Encryption Key Generation (one-time setup)

```bash
# Generate 32-byte hex key — run once, store in .env.local as GMAIL_TOKEN_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## State of the Art

| Old Approach                          | Current Approach                                       | When Changed  | Impact                                         |
| ------------------------------------- | ------------------------------------------------------ | ------------- | ---------------------------------------------- |
| `@supabase/auth-helpers-nextjs`       | `@supabase/ssr` (createServerClient)                   | 2024          | Already in use — do not regress                |
| `middleware.ts` auth guard            | `proxy.ts` in Next.js 16                               | Next.js 16    | Already in use — Gmail routes must follow this |
| Gmail API with Nodemailer SMTP OAuth2 | `googleapis` direct send (`gmail.users.messages.send`) | Ongoing       | Direct API is cleaner, no Nodemailer needed    |
| Token stored as plaintext             | AES-256-GCM encrypted at rest                          | Best practice | Required by SEND-03                            |

**Deprecated/outdated:**

- Nodemailer + SMTP for Gmail API: CLAUDE.md explicitly specifies `googleapis` direct send. Nodemailer SMTP OAuth2 is a valid approach but adds a dependency. Use `googleapis` only.
- `@supabase/auth-helpers-nextjs`: Already deprecated in this project. Do not import it.

---

## Open Questions

1. **Where does `GmailToken` live in Prisma — separate table or field on `Profile`?**
   - What we know: Schema currently has no Gmail token storage. `Profile` model exists.
   - What's unclear: A separate table is cleaner (nullable encrypted field is awkward); adding fields to `Profile` avoids a JOIN.
   - Recommendation: New `GmailToken` model (separate table). Cleaner separation, allows additional metadata (`gmailConnectedAt`, `firstSentAt`, `bounceDisabledAt`).

2. **How does the frontend GET the daily send counter for the "X/Y sent today" display (D-10)?**
   - What we know: The counter lives in Redis, not in the database.
   - What's unclear: Should `GET /api/gmail/status` read from Redis directly and return it? Yes — this is fast and correct.
   - Recommendation: `GET /api/gmail/status` returns `{ connected: bool, dailySent: number, dailyLimit: number, suspended: bool, suspendReason?: string }`.

3. **`invalid_grant` error handling — synchronous or async notification?**
   - What we know: If the refresh token is invalid, the worker throws `invalid_grant`. The user's UI is not watching the job result.
   - What's unclear: How does the user find out their Gmail is disconnected if the worker fails async?
   - Recommendation: Worker catches `invalid_grant`, deletes the token record from the DB, and sets a Redis flag `gmail:reconnect_required:{userId}`. The `GET /api/gmail/status` endpoint reads this flag. Next time the user opens EmailDraft, the status check shows disconnected. This is acceptable — the user will see it on next interaction.

---

## Environment Availability

| Dependency                     | Required By             | Available               | Version              | Fallback                  |
| ------------------------------ | ----------------------- | ----------------------- | -------------------- | ------------------------- |
| Node.js crypto                 | Token encryption        | ✓                       | Built-in (Node 20.x) | —                         |
| Redis (ioredis)                | Rate limiting, counters | ✓                       | 5.10.1 (installed)   | —                         |
| BullMQ                         | Gmail send queue        | ✓                       | 5.73.0 (installed)   | —                         |
| googleapis                     | Gmail API send          | ✗ (not in package.json) | v171.4.0 required    | None — blocking           |
| GOOGLE_CLIENT_ID env           | OAuth client            | Not checked             | —                    | None — must be configured |
| GOOGLE_CLIENT_SECRET env       | OAuth client            | Not checked             | —                    | None — must be configured |
| GMAIL_TOKEN_ENCRYPTION_KEY env | Token encryption        | Not checked             | —                    | None — must be generated  |

**Missing dependencies with no fallback:**

- `googleapis` package: must be installed via `npm install googleapis@171.4.0` in Wave 0
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: must be created in Google Cloud Console, added to env
- `GMAIL_TOKEN_ENCRYPTION_KEY`: must be generated (one command) and added to env

**Missing dependencies with fallback:**

- None — all other dependencies are already installed.

---

## Validation Architecture

### Test Framework

| Property           | Value                       |
| ------------------ | --------------------------- |
| Framework          | Vitest 4.1.2                |
| Config file        | `vitest.config.ts` (exists) |
| Quick run command  | `npm run test`              |
| Full suite command | `npm run test:coverage`     |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                              | Test Type | Automated Command                              | File Exists? |
| ------- | ------------------------------------------------------------------------------------- | --------- | ---------------------------------------------- | ------------ |
| SEND-01 | Free user: Copy + mailto visible, no Send via Gmail                                   | unit      | `npm run test -- tests/api/gmail-send.test.ts` | ❌ Wave 0    |
| SEND-02 | Pro + connected user: Send via Gmail button present, enqueues job                     | unit      | `npm run test -- tests/api/gmail-send.test.ts` | ❌ Wave 0    |
| SEND-03 | Token stored encrypted; decrypts correctly; `invalid_grant` triggers reconnect prompt | unit      | `npm run test -- tests/api/gmail-send.test.ts` | ❌ Wave 0    |
| SEND-04 | Daily limit enforced — 6th send on Day 1 rejected; Day 8 allows 10                    | unit      | `npm run test -- tests/api/gmail-send.test.ts` | ❌ Wave 0    |
| SEND-05 | Job enqueued with delay in 60-180s range                                              | unit      | `npm run test -- tests/api/gmail-send.test.ts` | ❌ Wave 0    |
| SEND-06 | Contact moves to "contacted" stage after send                                         | unit      | `npm run test -- tests/api/gmail-send.test.ts` | ❌ Wave 0    |
| SEND-07 | Unsubscribe footer appended to all sent emails                                        | unit      | `npm run test -- tests/api/gmail-send.test.ts` | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test:coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/api/gmail-send.test.ts` — covers SEND-01 through SEND-07
- [ ] `tests/lib/token-crypto.test.ts` — covers encrypt/decrypt round-trip
- [ ] `tests/lib/send-quota.test.ts` — covers warm-up ramp logic and daily counter atomics

_(No new test framework needed — Vitest already configured)_

---

## Project Constraints (from CLAUDE.md)

| Directive                                                      | Impact on Phase 5                                                            |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Tech stack locked: Next.js 16, Supabase, Claude API            | Supabase `createSupabaseServerClient` for auth in all new API routes         |
| Use `@supabase/ssr` not `@supabase/auth-helpers-nextjs`        | All new routes use `createSupabaseServerClient` from `@/lib/supabase/server` |
| Use `proxy.ts` not `middleware.ts` for auth guards             | Gmail OAuth routes follow the proxy.ts pattern                               |
| Gmail API: `googleapis` v171.4.0 with `gmail.send` scope only  | Confirmed; package not yet installed — Wave 0 task required                  |
| No auto-sending                                                | BullMQ worker executes HUMAN-INITIATED sends only; no scheduled sends        |
| No LinkedIn scraping                                           | Not relevant to this phase                                                   |
| AI costs: Haiku 4.5 for high-volume, Sonnet 4.6 for deep tasks | No AI inference in this phase                                                |
| Launch cost: free tier services                                | Gmail API is free; Redis and all other services already in use               |
| New users ramp: 5→10→20/day                                    | Matches D-09 exactly; Redis warm-up ramp confirmed                           |
| Jitter: 60-180s between sends                                  | Matches D-11 exactly                                                         |
| Bounce monitoring: >5% = disable                               | Matches D-12 exactly                                                         |
| `@supabase/ssr` is the only correct SSR client                 | Already in use across the codebase                                           |
| `middleware.ts` is deprecated in Next.js 16                    | `proxy.ts` already exists; new routes do not touch middleware                |

---

## Sources

### Primary (HIGH confidence)

- [Google Developers — Creating and sending email messages](https://developers.google.com/workspace/gmail/api/guides/sending) — RFC2822 format, base64url encoding, `gmail.users.messages.send`
- [Google Developers — OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server) — `access_type=offline`, `prompt=consent`, state CSRF protection, `invalid_grant` handling
- [Node.js crypto documentation](https://nodejs.org/api/crypto.html) — AES-256-GCM API, IV requirements, authTag usage
- [CLAUDE.md §Email (Gmail API)](../../CLAUDE.md) — `googleapis v171.4.0`, `gmail.send` scope, deliverability rules, jitter, bounce monitoring
- [CLAUDE.md §What NOT to Use](../../CLAUDE.md) — Confirmed: no Nodemailer, no Agent SDK

### Secondary (MEDIUM confidence)

- [ACMA — Email and SMS unsubscribe rules (2024)](https://www.acma.gov.au/sites/default/files/2024-05/Fact%20sheet%20-%20email%20and%20SMS%20unsubscribe%20rules.pdf) — Australia Spam Act functional unsubscribe requirement; reply-based opt-out acceptable
- [BullMQ docs — Delayed jobs](https://docs.bullmq.io/guide/jobs/delayed) — `delay` option for jitter at enqueue time
- [BullMQ docs — Rate limiting](https://docs.bullmq.io/guide/rate-limiting) — Rate limit patterns; confirmed `delay` is the right approach for per-job jitter

### Tertiary (LOW confidence)

- [DEV.to — Sending Emails Securely Using Node.js, Nodemailer, SMTP, Gmail, and OAuth2](https://dev.to/chandrapantachhetri/sending-emails-securely-using-node-js-nodemailer-smtp-gmail-and-oauth2-g3a) — Confirmed basic OAuth2 flow; NOT using Nodemailer per CLAUDE.md

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — `googleapis` v171.4.0 specified in CLAUDE.md; Node.js crypto is built-in; all other deps already installed
- Architecture: HIGH — OAuth2 flow, token encryption, Redis patterns all verified against official docs
- Pitfalls: HIGH — `prompt=consent` and 100-token limit are documented Google behavior; bounce detection approach is pragmatic given Gmail API limitations
- Australia Spam Act compliance: MEDIUM — Official ACMA guidance reviewed; personal cold outreach interpretation is reasonable but carries some regulatory uncertainty

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (stable APIs — Gmail API and OAuth2 flows rarely change)
