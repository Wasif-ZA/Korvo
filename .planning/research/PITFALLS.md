# Domain Pitfalls

**Project:** Korvo — AI-powered job outreach SaaS
**Domain:** AI agent pipeline + cold email delivery + outreach SaaS
**Researched:** 2026-04-01
**Confidence:** MEDIUM-HIGH (most findings verified against official docs or multiple sources)

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, legal exposure, or user trust destruction.

---

### Pitfall 1: Redis maxmemory-policy Not Set to noeviction

**What goes wrong:** BullMQ jobs silently disappear. Redis evicts queue keys when memory pressure hits, causing jobs to vanish mid-pipeline without any error. The Contact Finder job runs, writes contacts, then the Email Guesser job is evicted before starting — the user sees a half-finished result with no explanation.

**Why it happens:** Redis ships with `maxmemory-policy allkeys-lru` by default on many managed providers (Railway included). Developers assume "it's just a queue" and don't configure persistence.

**Consequences:** Silent data loss, pipeline abandons mid-run, user thinks the product is broken. Extremely hard to debug because the job never fails — it simply no longer exists.

**Prevention:**
- Set `maxmemory-policy noeviction` in Redis config. BullMQ documentation states this is "the ONLY setting that guarantees correct behavior of the queues."
- Enable AOF persistence (append-only file, fsync ~1 second) so jobs survive Redis restarts.
- Use a dedicated Redis instance for BullMQ, separate from any caching layer. Queues and caches have opposing eviction requirements.

**Warning signs:**
- Jobs added but never processed
- Queue depth stays non-zero but workers are idle
- Railway Redis memory usage approaching instance limit

**Phase:** Phase 1 (infrastructure setup). Configure before writing a single job.

---

### Pitfall 2: BullMQ Worker Missing maxRetriesPerRequest: null

**What goes wrong:** Workers crash with "Connection timeout" or "BRPOP command timeout" errors under any Redis reconnect scenario. The worker throws and takes down the entire Node process.

**Why it happens:** The BullMQ documentation is explicit: for Workers, `maxRetriesPerRequest` must be set to `null`. Without this, ioredis throws on blocked commands (like BRPOP) that workers depend on. Developers copy-paste generic Redis client setup without reading BullMQ's specific requirements.

**Consequences:** Under any Redis blip (Railway restarts, memory pressure, network glitch), all active workers die. Parallel agents stop. Users get stuck mid-search.

**Prevention:**
```typescript
// Worker connection config (NOT the same as Queue config)
const workerConnection = new IORedis({
  maxRetriesPerRequest: null,  // REQUIRED for BullMQ workers
  enableReadyCheck: false,
});

// Queue connection should fail fast
const queueConnection = new IORedis({
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,   // Fail fast on API calls when Redis is down
});
```

**Warning signs:**
- "MaxRetriesPerRequestError" in logs
- Workers die silently when Redis restarts
- Jobs marked as stalled immediately after worker crash

**Phase:** Phase 1 (BullMQ setup).

---

### Pitfall 3: Completed BullMQ Jobs Never Removed — Redis Memory Fills

**What goes wrong:** Every completed/failed job stays in Redis by default. Over time (weeks of usage), Redis memory fills, hitting the Railway free tier limit (25MB), causing Redis to stop accepting writes and breaking the entire pipeline.

**Why it happens:** BullMQ does not auto-remove jobs. Developers focus on job logic and forget retention config.

**Consequences:** Redis write failures at unpredictable times. All new searches fail at the queue layer. Cascading production outage.

**Prevention:**
```typescript
// Set on every queue
const searchQueue = new Queue('search-pipeline', {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 100 },  // Keep last 100 for debugging
    removeOnFail: { count: 500 },       // Keep failures longer for analysis
  },
});
```
Also set up a Redis memory alert at 80% capacity.

**Warning signs:**
- `redis_used_memory` growing linearly with usage
- Railway Redis memory gauge approaching limit
- Sudden queue write failures after weeks of stable operation

**Phase:** Phase 1 (queue setup), revisit in Phase 3 (scalability).

---

### Pitfall 4: Claude API 529 Overloaded vs 429 Rate Limit — Not Handled Differently

**What goes wrong:** Anthropic's API returns two distinct transient errors: `429 rate_limit_error` (your account's quota) and `529 overloaded_error` (Anthropic's servers under load from all users). Teams handle one but not the other, causing agent failures during peak usage even when the account has quota available.

**Why it happens:** The 529 is easy to miss in docs. It's a global platform issue, not an account issue, so standard rate-limit logic (check your quota, back off) doesn't apply the same way.

**Consequences:** The 4-agent pipeline (Contact Finder → Email Guesser + Research Agent → Email Drafter) has multiple Claude calls. Any unhandled 529 causes a partial pipeline run. Users see partial results or errors during high-traffic periods.

**Prevention:**
- Handle 429 and 529 with exponential backoff, but with different logic:
  - 429: Back off, check rate-limit headers (`anthropic-ratelimit-tokens-remaining`), stay under quota
  - 529: Back off with longer jitter (30s-120s), do NOT retry aggressively — you're competing with all API users
- Use BullMQ's built-in retry with exponential backoff as the outer retry layer
- Never surface raw API errors to users; map to "Search is taking longer than usual, retrying..."

**Warning signs:**
- Occasional pipeline failures during business hours (9am-6pm US time = peak Anthropic load)
- Error logs showing 529 with no quota exhaustion context

**Phase:** Phase 1 (agent implementation) — build retry handling before any other agent logic.

---

### Pitfall 5: Prompt Caching Cache Write Costs Causing Budget Surprises

**What goes wrong:** Prompt caching writes cost 1.25x base price (5-minute TTL) or 2x base price (1-hour TTL). Developers assume caching is free or always cheaper. When agent system prompts change frequently (during development), cache writes happen constantly with no reads, costing MORE than no caching at all.

**Why it happens:** The 90% cost reduction from cache reads is real, but only materializes when cache hits exceed writes. In development (frequent prompt iteration) and for low-volume users (few searches per day), the cache write cost can dominate.

**Consequences:** Development costs are higher than expected. The "90% reduction" only applies to high-traffic production scenarios where the same prompt is reused many times within the TTL window.

**Prevention:**
- Freeze system prompts before enabling caching in production
- Track cache hit rate in metrics (cache_read_input_tokens / total_input_tokens)
- Don't enable caching on prompts that change per-request (dynamic context)
- Use 1-hour TTL only for high-volume agents (Contact Finder runs every search); use 5-minute TTL for lower-frequency agents

**Warning signs:**
- Claude API costs not decreasing after adding cache_control
- `cache_creation_input_tokens` >> `cache_read_input_tokens` in API responses
- Agent system prompts being edited frequently in production

**Phase:** Phase 2 (cost optimization). Do not enable caching until system prompts are stable.

---

### Pitfall 6: Agent Infinite Tool-Call Loops With No Step Limit

**What goes wrong:** An agent enters a loop where each tool result triggers another tool call, consuming API calls and tokens until the request timeout or a manual kill. In Korvo's 4-agent pipeline, this can happen if the Contact Finder's web search returns ambiguous results and the agent keeps trying variations. Without a step limit, one "bad" search can cost $5-10 in a single runaway loop.

**Why it happens:** The Claude Agent SDK has a default step limit of 20 but this is overridden if developers configure agents manually. Tool call errors (malformed response) can cause agents to retry the same call endlessly if not handled at the tool level.

**Consequences:** Per-search cost blows up from ~$0.02 to $5+. One bad actor or malformed request can cost a day's worth of API budget in minutes.

**Prevention:**
- Enforce hard step limits on every agent (Contact Finder: max 5 tool calls, Research Agent: max 3 per contact)
- Implement per-user daily API cost budget in BullMQ job metadata. Fail the job if the budget is exceeded.
- Log every tool call with input/output for debugging
- Set `maxTokens` on every Claude call — never rely on model defaults

**Warning signs:**
- Single jobs running for >60 seconds
- `tool_use` blocks repeating identical inputs in Claude response logs
- API cost spikes on specific user IDs

**Phase:** Phase 1 (agent implementation) — budget enforcement before first production deploy.

---

### Pitfall 7: Gmail API Refresh Token Exhaustion (100-Token Limit)

**What goes wrong:** Google enforces a limit of 100 refresh tokens per user per OAuth client ID. When a new token is issued, the oldest one is silently revoked. For a SaaS with users who connect/reconnect Gmail frequently, old tokens stop working with no warning — users suddenly can't send emails.

**Why it happens:** Developers store one refresh token per user and don't realize old tokens get invalidated as new ones are issued. The revocation is silent — there is no webhook or notification from Google.

**Consequences:** Pro-tier users lose Gmail send capability mid-campaign. Trust destruction for a feature they're paying $19/month for.

**Prevention:**
- Store only the most recently issued refresh token, replacing the old one on each new OAuth consent
- Implement token validity checks before each send attempt, not just at OAuth time
- Handle `invalid_grant` errors gracefully with a "Reconnect Gmail" prompt in the UI
- Never hard-fail on token refresh failure — show a clear, actionable error

**Warning signs:**
- `invalid_grant` errors in Gmail API send calls
- Users who connected Gmail months ago unable to send
- OAuth consent prompts appearing more than once per user

**Phase:** Phase 2 (Gmail API integration). Build token management before building the send UI.

---

### Pitfall 8: Sending from User's Primary Gmail Identity — Immediate Spam Risk

**What goes wrong:** Korvo sends cold emails from the user's personal Gmail account via the Gmail API. If users send too many cold emails too quickly, Google flags their personal account for spam and may suspend it. The user loses their primary email account — a catastrophic outcome that destroys trust permanently.

**Why it happens:** The deliverability warm-up ramp in PROJECT.md (5→10→20/day) is the right approach, but it's easy to accidentally bypass: users manually triggering sends, batch operations, or misconfigured daily counters reset incorrectly.

**Consequences:** User's personal Gmail suspended. Irreversible trust loss. Potential chargeback, refund demand, and App Store/legal complaints.

**Prevention:**
- Enforce daily send limits at the API layer, NOT the UI layer. BullMQ job should check and increment a Redis counter; fail with an explicit "daily limit reached" error if exceeded.
- Rate limit: 5/day in week 1, 10/day in week 2, 20/day in week 3+ — stored per user in Supabase, enforced in the send job
- Add a prominent warning in the Pro upgrade flow: "Korvo sends from your Gmail. Daily limits protect your account."
- Never bypass limits for any user, including during testing

**Warning signs:**
- Users reporting Gmail "unusual activity" prompts
- Gmail API returning `quotaExceeded` for the user (not the project)
- Send counter not incrementing correctly after jitter/retry

**Phase:** Phase 2 (Gmail send). Enforce limits before the send feature goes live to any user.

---

### Pitfall 9: Supabase RLS Policies Relying on user_metadata JWT Claims

**What goes wrong:** Supabase's `user_metadata` is user-modifiable. Building RLS policies that check `auth.jwt() -> 'user_metadata' ->> 'plan'` to gate Pro features means any user can set their own plan to "pro" in their JWT and bypass the paywall entirely.

**Why it happens:** It seems natural to put user data in JWT claims for easy access. Supabase's docs even show `user_metadata` in examples, but don't always surface the security implication prominently.

**Consequences:** Stripe subscription bypass. Free users access Pro features. Revenue loss.

**Prevention:**
- Never use `user_metadata` in RLS policies for security-sensitive checks
- Store subscription status in a `profiles` table controlled only by server-side code (Stripe webhook handler)
- Gate Pro features in RLS via: `auth.uid() IN (SELECT user_id FROM profiles WHERE plan = 'pro')`
- The Stripe webhook must use the Supabase service role key (which bypasses RLS) to update the profiles table

**Warning signs:**
- RLS policies referencing `user_metadata`
- Pro features accessible after cancelling Stripe subscription
- Inconsistency between what Stripe says and what the DB allows

**Phase:** Phase 1 (auth + schema setup). Get this right before any feature is built on top of it.

---

### Pitfall 10: Supabase Views Silently Bypassing RLS

**What goes wrong:** SQL views in Supabase are created by the `postgres` superuser by default. This means the view runs with postgres-level permissions and ignores RLS policies on the underlying tables. Any query through the view returns all rows, regardless of which user is authenticated.

**Why it happens:** This is a PostgreSQL default that catches almost every developer who creates views for convenience (e.g., a "contacts_with_stats" view joining contacts + outreach tables).

**Consequences:** Data leakage between users. User A can see User B's contacts and emails through any view that doesn't explicitly set `security_invoker = true`.

**Prevention:**
- In PostgreSQL 15+ (Supabase's default), set `security_invoker = true` on every view:
  ```sql
  CREATE VIEW contacts_with_stats WITH (security_invoker = true) AS ...
  ```
- Audit all views before each deploy
- Prefer materialized views with explicit RLS over convenience views in security-sensitive schemas

**Warning signs:**
- View queries returning more rows than expected for the authenticated user
- RLS policies confirmed on tables but queries via views returning all data

**Phase:** Phase 1 (schema design). Know this before creating the first view.

---

### Pitfall 11: Using Direct Database Port in Serverless (Vercel) — Too Many Connections

**What goes wrong:** Next.js Server Actions and API Routes on Vercel are serverless functions. Each function invocation creates a new PostgreSQL connection. Under any meaningful load (50+ concurrent users), Supabase free tier's 25-connection limit is exceeded and all subsequent requests fail with "too many connections."

**Why it happens:** Developers use the direct connection string (`port 5432`) from Supabase's dashboard, which is correct for long-running servers but wrong for serverless functions.

**Consequences:** Database errors under load. Searches fail. Stripe webhooks fail (can't save subscription updates). User data lost.

**Prevention:**
- Always use the Supabase connection pooler (Supavisor, `port 6543`) in Vercel deployments
- Set `?pgbouncer=true` on the connection string
- Use `SUPABASE_DB_URL` (pooler) not `DATABASE_URL` (direct) in Vercel env vars
- For Prisma/Drizzle: use `directUrl` for migrations, `url` for runtime queries pointing to pooler

**Warning signs:**
- `remaining_pool_size: 0` in Supabase dashboard
- "too many connections" errors in Sentry under load
- Errors spiking exactly when Next.js cold starts happen

**Phase:** Phase 1 (database setup). Configure pooler before first Vercel deploy.

---

### Pitfall 12: Next.js 16 Async Params Breaking Dynamic Routes

**What goes wrong:** In Next.js 16, `params` in dynamic routes (e.g., `app/search/[id]/page.tsx`) is now a Promise. Code that worked in Next.js 14/15 with synchronous `params.id` access fails at runtime with a "params must be awaited" error.

**Why it happens:** A breaking change introduced in Next.js 15 and enforced in Next.js 16. Dozens of tutorials, boilerplates, and Stack Overflow answers still show the old synchronous access pattern.

**Consequences:** Dynamic route pages throw on render. Pipeline status pages, contact detail pages, any route with `[id]` breaks silently in some environments.

**Prevention:**
```typescript
// Next.js 16 required pattern
export default async function SearchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  // ...
}
```

**Warning signs:**
- "params should be awaited" warning in Next.js dev console
- Runtime errors on dynamic routes that work in dev but fail in production
- Params returning undefined unexpectedly

**Phase:** Phase 1 (frontend scaffolding). Set the pattern once in the first dynamic route.

---

### Pitfall 13: Next.js Route Cache Serving Stale Data After Pipeline Completion

**What goes wrong:** Next.js App Router caches route segments aggressively. After a BullMQ job completes and writes results to Supabase, the user's search results page may still show the loading state because the cached route hasn't been invalidated. Users refresh, see stale data, and think the search failed.

**Why it happens:** Next.js 15+ changed fetch caching defaults (no longer cached by default) but route segment caching and client-side router cache still apply. Server Actions can trigger revalidation, but Server Components fetching from Supabase need explicit `revalidatePath` or `revalidateTag` calls.

**Consequences:** Users see incomplete pipeline results after the pipeline has actually finished. Trust in the product drops. Users report "bugs" that aren't bugs.

**Prevention:**
- After BullMQ job completion, trigger a Supabase Realtime broadcast or use polling at the client
- Use `revalidatePath` in the Server Action that receives the job completion webhook
- For real-time pipeline status: use Supabase Realtime subscriptions (free tier: 200 concurrent connections) to push updates to the client, bypassing cache entirely
- Never rely on "the cache will expire soon" as a UX strategy for a pipeline product

**Warning signs:**
- Users reporting searches stuck on "loading" after 30+ seconds
- Supabase DB shows completed results but UI doesn't reflect them
- `cache: 'no-store'` missing on fetch calls to pipeline status endpoints

**Phase:** Phase 1 (pipeline status UI). Design real-time update strategy before building the results page.

---

## Moderate Pitfalls

---

### Pitfall 14: SPF/DKIM/DMARC Not Set on User's Domain — Permanent Gmail Rejection

**What goes wrong:** Google escalated enforcement from soft to hard rejection in November 2025. Emails from senders without proper SPF, DKIM, and DMARC authentication now receive permanent rejection codes, not spam folder placement. A user with a custom domain (common for boot camp grads with a personal brand) who hasn't set up DNS records will have all their Korvo-sent emails rejected.

**Prevention:**
- Add an "Email Authentication" checklist in the Pro onboarding flow with DNS record verification
- Use the Gmail API to verify domain authentication before allowing sends (Google has programmatic DMARC check tools)
- Fallback: recommend users send from their `@gmail.com` address if custom domain auth isn't set up
- Document clearly in the UI: "Emails from unverified custom domains will be rejected"

**Phase:** Phase 2 (Gmail send onboarding).

---

### Pitfall 15: Email Bounce Rate Spiking — Guessed Email Addresses Damaging Sender Reputation

**What goes wrong:** Korvo's Email Guesser agent produces addresses like `first.last@company.com` that may not exist. Each hard bounce hurts the user's Gmail sender reputation. At >2% bounce rate, Google starts routing all mail from that address to spam.

**Prevention:**
- Show confidence badges (green/yellow/red) prominently before any send — already in scope
- In the UI, add a warning before sending yellow/red confidence emails: "This email may not be deliverable. A bounce will affect your Gmail reputation."
- Track per-user bounce rate (via Gmail API post-send status) and warn when approaching 1%
- In V2, NeverBounce verification before send (already planned)

**Phase:** Phase 1 (Email Guesser) for confidence badges; Phase 2 (V2 enrichment) for verification.

---

### Pitfall 16: Australian Spam Act — Missing Unsubscribe Mechanism in Draft Templates

**What goes wrong:** Australia's Spam Act 2003 requires all commercial electronic messages to include a functional unsubscribe mechanism. Korvo drafts outreach emails but doesn't automatically include an unsubscribe link. Users who send Korvo-generated emails to Australian recipients are technically non-compliant.

**Why it matters:** Korvo's primary target market is Australian uni grads contacting Australian companies. ACMA fines can reach AUD 2.2 million/day for repeat corporate offenders. More practically, a recruiter receiving a Korvo-drafted email without an unsubscribe option can mark it as spam.

**Prevention:**
- Add a configurable footer to all email templates: "If you'd prefer not to receive further messages, reply with 'unsubscribe'"
- Document in ToS: user is responsible for compliance with local spam laws
- The Spam Act B2B exception applies (inferred consent when business email is publicly published + message is role-relevant) — lean into this in legal docs
- Never draft emails that look like mass marketing blasts; all Korvo emails are personal, targeted, role-relevant — this is the B2B exception shield

**Phase:** Phase 1 (Email Drafter agent) — include unsubscribe footer in all templates.

---

### Pitfall 17: CAN-SPAM Compliance — Commercial Message Classification Risk

**What goes wrong:** CAN-SPAM applies to emails with a "primary purpose" of commercial advertisement or promotion. Korvo emails are personal networking outreach, not marketing — but if the template language sounds promotional ("I'd love to tell you about my skills..."), it may be classified as commercial, triggering CAN-SPAM requirements (sender identification, opt-out mechanism, physical address).

**Prevention:**
- Email Drafter agent system prompt must explicitly produce personal/relational framing, not commercial/promotional language
- Templates should open with personal connection or genuine curiosity, not a pitch
- Include guidance in the app: "Keep your email personal. Generic pitches are more likely to be flagged as spam."

**Phase:** Phase 1 (Email Drafter agent) — bake this into the system prompt.

---

### Pitfall 18: Supabase supabase-js Client Not Supporting Transactions

**What goes wrong:** The `supabase-js` client does not support database transactions. When the pipeline needs to atomically write multiple records (e.g., create a `searches` row + 3 `contacts` rows — all succeed or all fail), developers either skip transaction safety or try to implement it incorrectly.

**Why it happens:** SQL transaction semantics are invisible in the supabase-js client API. Developers assume a series of `.insert()` calls is equivalent to a transaction.

**Consequences:** If the pipeline crashes between writing the `searches` row and the `contacts` rows, the database has orphaned search records with no contacts. The user sees an empty result with no error.

**Prevention:**
- Use Supabase Edge Functions or PostgreSQL functions (RPC) for any multi-table write that must be atomic
- For the pipeline completion handler: write all results in a single RPC call, not sequential inserts
- Add a `status` field to the `searches` table: `pending | complete | failed`. Only transition to `complete` inside a transaction that also confirms all contact rows were written.

**Phase:** Phase 1 (database schema) — design the atomic write pattern before implementing agent result handlers.

---

## Minor Pitfalls

---

### Pitfall 19: Graceful Shutdown Not Implemented — Stalled BullMQ Jobs on Deploy

**What goes wrong:** Railway restarts Node processes during deploys. Without SIGTERM handling, active BullMQ jobs are killed mid-execution. BullMQ marks them as "stalled" after the lock expires (default: 30 seconds) and retries. During a deploy, users may see their search "retry" unexpectedly or get duplicate results.

**Prevention:**
```typescript
process.on('SIGTERM', async () => {
  await worker.close();         // Stop accepting new jobs, finish current
  await queueScheduler.close();
  process.exit(0);
});
```

**Phase:** Phase 1 (worker setup).

---

### Pitfall 20: Streaming Claude Responses — Error Handling After 200 OK

**What goes wrong:** When using the Claude streaming API, an error can occur AFTER the initial 200 response is sent. Standard HTTP error handling (check status code) misses these mid-stream errors. The pipeline receives a partial response and may parse it as complete.

**Prevention:**
- Always handle SSE error events, not just HTTP status codes, when using streaming
- For BullMQ jobs, non-streaming is safer: use `.create()` with `await`, handle the full response atomically
- If streaming is used for UX purposes (progressive email draft display), treat any stream interruption as a failure and re-run the full call

**Phase:** Phase 1 (agent implementation).

---

### Pitfall 21: "use client" Over-Annotation Bloating JavaScript Bundle

**What goes wrong:** Every component annotated with `"use client"` ships its entire dependency tree to the browser. If Korvo's pipeline results page (which involves research cards, email drafts, and scoring badges) is annotated `"use client"` at the root, the entire component tree — including heavy Markdown renderers or charting libraries — ships to the browser unnecessarily.

**Prevention:**
- Default to Server Components. Only annotate components that use browser APIs, hooks, or event listeners
- Push `"use client"` annotations as deep (leaf-node) as possible
- Run `next build --analyze` to inspect bundle composition before each phase launch

**Phase:** Phase 2 (results UI polish).

---

### Pitfall 22: LinkedIn Scraping Creep — Tool Calls Attempting LinkedIn URLs

**What goes wrong:** The Contact Finder agent uses web search to find people. Web search results often include LinkedIn profile URLs. If the agent's tool implementation follows LinkedIn URLs and scrapes profile pages, Korvo enters the legal risk zone (Proxycurl lawsuit precedent) even though the intent was just to use Google-indexed data.

**Why it happens:** Claude follows URLs returned by search tools if not explicitly constrained. A LinkedIn URL in a search result looks identical to a company team page URL to the agent.

**Consequences:** LinkedIn sends cease-and-desist or files suit. User accounts that authenticated via Google may be exposed. App gets pulled.

**Prevention:**
- Blocklist LinkedIn domains in the web search tool implementation: reject any URL containing `linkedin.com` before fetching
- Add to Contact Finder system prompt: "Never access linkedin.com URLs. Use only company websites, GitHub, conference talks, and press releases."
- Log all URLs fetched by the agent and alert on any linkedin.com access

**Warning signs:**
- `linkedin.com` URLs appearing in agent tool call logs
- Web search results for people returning primarily LinkedIn links

**Phase:** Phase 1 (Contact Finder agent). Block this at tool implementation, not just prompt level.

---

## Phase-Specific Warning Matrix

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1 | Redis setup | maxmemory-policy wrong, jobs vanish | Set noeviction before first job |
| Phase 1 | BullMQ workers | maxRetriesPerRequest missing, workers crash | Worker connection config separate from queue config |
| Phase 1 | Agent implementation | No step limit, runaway API calls | Hard limits on every agent before prod deploy |
| Phase 1 | Supabase schema | RLS on user_metadata, subscription bypass | Pro gate via profiles table, not JWT claims |
| Phase 1 | Supabase views | Views bypass RLS, data leak | security_invoker = true on all views |
| Phase 1 | Vercel + Supabase | Direct connection port, too many connections | Pooler port 6543 from day 1 |
| Phase 1 | Next.js 16 | Async params breaking dynamic routes | Await params, set pattern on first route |
| Phase 1 | Pipeline status UI | Stale cache showing wrong state | Supabase Realtime or polling, not cache expiry |
| Phase 1 | Email Drafter | No unsubscribe footer, Spam Act breach | Include unsubscribe text in all templates |
| Phase 1 | Contact Finder | Agent accessing LinkedIn URLs | Domain blocklist in tool implementation |
| Phase 2 | Gmail OAuth | Refresh token exhaustion (100 limit) | Replace on new grant, handle invalid_grant |
| Phase 2 | Gmail send | No enforced daily limits, user Gmail suspended | Redis counter per user, enforced in job layer |
| Phase 2 | Email deliverability | SPF/DKIM/DMARC not verified | Auth check in onboarding before first send |
| Phase 2 | Prompt caching | Cache writes costing more than saves | Freeze prompts first, track hit rate |
| Phase 2 | Email bounces | Guessed addresses damaging sender rep | Confidence badge warnings before send |
| Phase 3 | Job retention | Redis memory fills, pipeline stops | removeOnComplete config from Phase 1 |

---

## Sources

- [BullMQ Going to Production](https://docs.bullmq.io/guide/going-to-production) — Redis noeviction requirement, worker connection config
- [BullMQ Connections](https://docs.bullmq.io/guide/connections) — maxRetriesPerRequest requirement
- [Avoiding Redis Crashes with BullMQ](https://dev.to/lbd/avoiding-redis-crashes-with-bullmq-memory-monitoring-basics-2848) — Memory monitoring
- [BullMQ Failing Fast When Redis Is Down](https://docs.bullmq.io/patterns/failing-fast-when-redis-is-down) — Queue vs Worker connection strategy
- [Claude API Errors](https://platform.claude.com/docs/en/api/errors) — 429 vs 529 error types, streaming error handling
- [Claude Rate Limits](https://platform.claude.com/docs/en/api/rate-limits) — ITPM/OTPM rate limit structure
- [Claude Prompt Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) — Cache write pricing, TTL behavior
- [Gmail API Quota](https://developers.google.com/workspace/gmail/api/reference/quota) — 250 quota units/second, 100 units per send
- [Why Gmail API Breaks AI Agents](https://cli.nylas.com/guides/why-gmail-api-breaks-ai-agents) — Refresh token limits, OAuth edge cases
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) — user_metadata security warning
- [Supabase Pitfalls](https://hrekov.com/blog/supabase-common-mistakes) — Common setup mistakes
- [Supabase RLS Performance](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) — View security invoker requirement
- [Supabase Edge Functions Transactions](https://marmelab.com/blog/2025/12/08/supabase-edge-function-transaction-rls.html) — supabase-js transaction limitation
- [Next.js App Router Pitfalls 2026](https://ecosire.com/blog/nextjs-16-app-router-production) — Async params, caching issues
- [Australia Spam Act Email Marketing](https://sprintlaw.com.au/articles/email-marketing-laws/) — Consent, unsubscribe, ACMA penalties
- [Cold Email Deliverability 2025](https://supersend.io/blog/cold-email-deliverability-best-practices-2025) — Warm-up, bounce rates, spam filters
- [Cold Email Sending Limits](https://www.topo.io/blog/safe-sending-limits-cold-email) — Daily volume recommendations
- [LinkedIn Scraping Legal Risks](https://www.tracker-rms.com/blog/scraping-isnt-sourcing-the-hidden-risks-of-using-data-extraction-tools/) — Account bans, legal exposure
