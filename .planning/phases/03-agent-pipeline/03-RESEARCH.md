# Phase 03: Agent Pipeline - Research

**Researched:** 2026-04-04
**Domain:** Claude API tool-use loops, Firecrawl web scraping, circuit breaker patterns, scoring engines, cold email template systems
**Confidence:** HIGH

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Contact Finder uses Claude Haiku 4.5 web search ONLY (L1). No external APIs (Hunter.io, Apollo, ATS APIs) for V1.
- **D-02:** Email Guesser uses Claude Haiku 4.5 pattern detection ONLY. Guesses from common patterns (first.last@, firstl@, first@). No Hunter.io for V1.
- **D-03:** Always return 3 contacts, even with sparse data. Flag low-confidence results. Never return an error to the user — best-effort with transparency.
- **D-04:** Firecrawl scrapes /about, /careers, /blog, /team, /jobs — max 10 pages per company. Extracts tech stack, recent news, company values, hiring roles.
- **D-05:** Cache enrichment data per company domain in a `company_enrichments` table. 30-day TTL. Reuse cached data for repeat searches.
- **D-06:** If Firecrawl fails, Research Agent falls back to Claude web search only. Pipeline never fails due to Firecrawl.
- **D-07:** Firecrawl free tier budget: 500 credits/month ~= 50 companies at 10 pages each.
- **D-08:** Scoring weights: title/role match 30%, seniority 20%, public activity/approachability 20%, email confidence 15%, company hiring signals 15%.
- **D-09:** Full score breakdown panel showing each signal's contribution.
- **D-10:** Tone mapping: 75-100 = direct, 45-74 = curious, 0-44 = value-driven.
- **D-11:** Voice: genuine curiosity. Casual, direct, shows research. No corporate speak, no em dashes. 4 sentences max.
- **D-12:** Tone bands vary opening and ask only (not entire structure). Direct: shared connection → coffee chat ask. Curious: research hook → open-ended question. Value-driven: something to offer → low-commitment interaction.
- **D-13:** Template types: referral_ask, hiring_inquiry, value_offer. Follow-ups scaffolded in EMAIL-02 but populated in V3.
- **D-14:** Agent outputs MUST map to the `PipelineResponse` interface the frontend demo expects.
- **D-15:** Each agent writes structured results to the database via Prisma. Orchestrator assembles PipelineResponse from DB rows.
- **D-16:** All agents use `@anthropic-ai/sdk` v0.81.0+ directly with manual tool-use loops (NOT Agent SDK).
- **D-17:** `claude-haiku-4-5-20251001` for all 4 agents. Sonnet 4.6 reserved for V2 prep briefs only.
- **D-18:** Prompt caching on all agent system prompts. Dynamic content in user message only, never in system prompt after cache_control breakpoint.
- **D-19:** LinkedIn domain blocklist — agents must never access LinkedIn directly.
- **D-20:** Retry 3x with exponential backoff per agent step, partial results on final failure.
- **D-21:** 3-minute total pipeline timeout.
- **D-22:** Supabase Realtime Broadcast for 4 coarse progress stages.

### Claude's Discretion

Claude has flexibility on: agent system prompt design, tool definitions for web search, structured output schemas (as long as they map to PipelineResponse), Firecrawl extract vs crawl mode selection, scoring engine implementation details (formula vs ML), circuit breaker library choice (opossum or simpler), database column specifics for company_enrichments table.

### Deferred Ideas (OUT OF SCOPE)

- Hunter.io email verification — deferred to V2 (ENRICH-03: NeverBounce)
- Apollo.io BYO API key — deferred to V2 (ENRICH-01-04)
- ATS API integration (Greenhouse, Lever, Workable) — could be added as L3 data source later
- Follow-up templates (followup_1, followup_2) — scaffolded in EMAIL-02 but populated in V3
- Waitlist endpoint — needed by landing page CTA, not in Phase 3 scope
- Bull Board monitoring dashboard — still deferred
  </user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                                        | Research Support                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| AGENT-01 | Contact Finder agent — finds 3 people via Claude Haiku 4.5 + web search tool, returns structured JSON              | Tool-use loop pattern, web_search tool definition, LinkedIn blocklist implementation |
| AGENT-02 | Email Guesser agent — detects email pattern, guesses addresses with confidence level (high/medium/low)             | Claude tool-use for pattern search, email confidence scoring heuristics              |
| AGENT-03 | Research Agent — finds personalization hooks, outputs structured research card: Background, Ask This, Mention This | Firecrawl scrape integration, Claude extraction from scraped content                 |
| AGENT-04 | Email Drafter agent — drafts 4-sentence cold email using tone mapping from scoring engine                          | Template type selection, tone-driven prompt variation                                |
| AGENT-05 | All agents use `@anthropic-ai/sdk` v0.81.0+ directly with manual tool-use loops                                    | Manual tool-use loop implementation, stop_reason handling                            |
| AGENT-06 | Prompt caching enabled on all agent system prompts                                                                 | cache_control placement, ephemeral TTL behavior                                      |
| AGENT-07 | 4-layer data access waterfall: L1→L2→L3→L4                                                                         | Waterfall implementation pattern (V1: L1 only per D-01)                              |
| AGENT-08 | Circuit breakers per data source with fallback to next layer                                                       | opossum library usage, fallback chain pattern                                        |
| AGENT-09 | LinkedIn domain blocklist — no direct LinkedIn access                                                              | Blocklist in tool fetch implementation                                               |
| SCORE-01 | Response probability scoring (0-100) with weighted signals                                                         | Scoring formula with 5 weighted signals from D-08                                    |
| SCORE-02 | Explainable score breakdown panel showing each signal's contribution                                               | scoreBreakdown field in DB, JSON structure                                           |
| SCORE-03 | Tone mapping: 75-100 = direct, 45-74 = curious, 0-44 = value-driven                                                | Tone mapping function, passed to drafter                                             |
| SCORE-04 | Tone drives email template selection and drafter prompt variation                                                  | Template selection logic keyed to tone                                               |
| EMAIL-01 | Template types: referral_ask, hiring_inquiry, value_offer                                                          | Template type definitions, selection heuristics                                      |
| EMAIL-02 | Follow-up templates scaffolded but NOT populated                                                                   | Schema column present, left empty in V1                                              |
| EMAIL-03 | All emails max 4 sentences, casual/direct tone, no em dashes                                                       | System prompt constraints for Email Drafter                                          |
| EMAIL-04 | Editable subject line + body before send                                                                           | outreach table stores subject + body as separate fields (already in schema)          |
| EMAIL-05 | Regenerate button with different tone/template option                                                              | outreach rows can be re-created; API endpoint needed                                 |

</phase_requirements>

---

## Summary

Phase 3 replaces four stub delays in `worker/orchestrator/pipeline.ts` with real Claude Haiku 4.5 API calls, each implemented as a manual tool-use loop using `@anthropic-ai/sdk`. The SDK is not yet installed in the project (currently only `bullmq`, `ioredis`, Supabase, and Stripe are in package.json). `@anthropic-ai/sdk` latest is 0.82.0 (locked decisions reference 0.81.0 — either is fine, use latest). `@mendable/firecrawl-js` is at 4.18.1. Neither is installed. `opossum` (circuit breaker) is at 9.0.0 and also not installed.

The pipeline architecture is sequential with one parallel step: Contact Finder (Step 1) → Email Guesser + Research Agent in `Promise.all` (Step 2) → Email Drafter (Step 3). The Scoring Engine runs synchronously between Step 2 completion and Email Drafter invocation — it is a pure TypeScript function, not a Claude call. Firecrawl enrichment runs inside the Research Agent step (not a separate queue job) and writes to a new `company_enrichments` table that does not yet exist in the Prisma schema.

The critical schema gap: `contacts` table lacks `score_breakdown` (JSON signal breakdown for SCORE-02), and the `company_enrichments` table does not exist at all. Both need a Prisma migration as Wave 0 of this phase. The `outreach` table has `templateType`, `subject`, `body`, and `tone` columns already — this is sufficient for EMAIL-01 through EMAIL-05.

**Primary recommendation:** Build in this order: (1) install packages + schema migration, (2) Contact Finder with tool-use loop + LinkedIn blocklist, (3) Email Guesser, (4) Scoring Engine pure function, (5) Research Agent with Firecrawl, (6) Email Drafter, (7) PipelineResponse assembly endpoint, (8) prompt caching pass, (9) circuit breaker pass.

---

## Standard Stack

### Core — Already in package.json

| Library        | Version | Purpose                             | Why Standard         |
| -------------- | ------- | ----------------------------------- | -------------------- |
| bullmq         | 5.73.0  | Job queue orchestration             | Installed in Phase 2 |
| ioredis        | 5.10.1  | Redis client                        | Installed in Phase 2 |
| @prisma/client | 7.6.0   | DB writes from worker               | Installed in Phase 1 |
| zod            | 4.3.6   | Schema validation for agent outputs | Installed in Phase 1 |

### Core — Must Install (not in package.json yet)

| Library                | Version | Purpose                                  | Why Standard                                                                  |
| ---------------------- | ------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| @anthropic-ai/sdk      | 0.82.0  | Claude API client — all 4 agents         | Locked in CLAUDE.md; `@anthropic-ai/claude-agent-sdk` is explicitly forbidden |
| @mendable/firecrawl-js | 4.18.1  | Company page scraping for Research Agent | Locked in D-04; free tier 500 credits/month                                   |
| opossum                | 9.0.0   | Circuit breaker per data source          | Required by AGENT-08; graceful fallback pattern                               |
| @types/opossum         | latest  | TypeScript types for opossum             | opossum does not bundle its own types                                         |

### Supporting

| Library | Version | Purpose                    | When to Use                                                         |
| ------- | ------- | -------------------------- | ------------------------------------------------------------------- |
| p-retry | 6.x     | Promise retry with backoff | Wrap each Claude `messages.create` call for 429/529 handling (D-20) |

**Installation:**

```bash
npm install @anthropic-ai/sdk @mendable/firecrawl-js opossum
npm install -D @types/opossum
```

**Version verification (confirmed via npm registry on 2026-04-04):**

- `@anthropic-ai/sdk`: 0.82.0 (latest)
- `@mendable/firecrawl-js`: 4.18.1 (latest)
- `opossum`: 9.0.0 (latest)

---

## Architecture Patterns

### Recommended File Structure (Phase 3 additions)

```
worker/
├── agents/
│   ├── contact-finder.ts       # Agent 1: tool-use loop, returns ContactResult[]
│   ├── email-guesser.ts        # Agent 2: pattern detection, returns EmailGuess[]
│   ├── research-agent.ts       # Agent 3: Firecrawl + hook extraction
│   └── email-drafter.ts        # Agent 4: tone-mapped drafts
├── scoring/
│   └── scoring-engine.ts       # Pure TS function, no Claude call needed
├── lib/
│   ├── firecrawl.ts            # Firecrawl client, scrapeCompany + caching
│   ├── linkedin-blocklist.ts   # Domain blocklist enforced in fetch wrapper
│   └── circuit-breaker.ts      # opossum wrapper factory
└── orchestrator/
    └── pipeline.ts             # Replace stubs with real agent calls
shared/
└── types/
    ├── jobs.ts                 # Already exists; add PipelineResponse type
    └── agents.ts               # NEW: ContactResult, EmailGuess, ResearchCard, Draft
prisma/
└── schema.prisma               # Add company_enrichments model + score_breakdown col
lib/
└── api/
    └── pipeline-response.ts    # Assembles PipelineResponse from Prisma DB rows
app/
└── api/
    └── search/
        └── [id]/
            └── route.ts        # NEW: GET endpoint returns PipelineResponse (Phase 4 may already need this)
```

### Pattern 1: Manual Tool-Use Loop (AGENT-05)

Every agent that needs web search or Firecrawl follows this exact pattern. Do not use the Claude Agent SDK autonomous loop.

```typescript
// Source: @anthropic-ai/sdk 0.82.0 official pattern + project STACK.md
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Tool definition for web search
const webSearchTool: Anthropic.Tool = {
  name: "web_search",
  description:
    "Search the web for public information about people and companies. Never search linkedin.com.",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
    },
    required: ["query"],
  },
};

async function runAgentLoop(
  systemPrompt: string,
  userMessage: string,
  tools: Anthropic.Tool[],
  maxSteps = 5,
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  let steps = 0;
  while (steps < maxSteps) {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" }, // AGENT-06: prompt caching
        },
      ],
      tools,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      // Extract text from final response
      const textBlock = response.content.find((b) => b.type === "text");
      return textBlock?.text ?? "";
    }

    if (response.stop_reason === "tool_use") {
      const assistantMessage: Anthropic.MessageParam = {
        role: "assistant",
        content: response.content,
      };
      messages.push(assistantMessage);

      // Execute each tool call
      const toolResultContent: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        const result = await executeTool(block.name, block.input);
        toolResultContent.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }
      messages.push({ role: "user", content: toolResultContent });
      steps++;
      continue;
    }

    // stop_reason: max_tokens or other — return what we have
    break;
  }
  throw new Error(`Agent loop exceeded ${maxSteps} steps without end_turn`);
}
```

### Pattern 2: LinkedIn Domain Blocklist (AGENT-09)

Enforced in the tool execution layer, not just system prompts. Both layers are required.

```typescript
// worker/lib/linkedin-blocklist.ts
const BLOCKED_DOMAINS = ["linkedin.com", "www.linkedin.com", "lnkd.in"];

export function isBlockedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return BLOCKED_DOMAINS.some((d) => parsed.hostname.endsWith(d));
  } catch {
    return false;
  }
}

export async function safeFetch(url: string): Promise<string> {
  if (isBlockedUrl(url)) {
    return "[blocked: LinkedIn URLs are not permitted per legal policy]";
  }
  // ... actual fetch
}
```

### Pattern 3: Prompt Caching (AGENT-06)

Cache write goes on the LAST system block. Dynamic content (company name, role, contact data) goes in the user message turn ONLY.

```typescript
// CORRECT: system prompt is stable → cached
system: [
  {
    type: "text",
    text: CONTACT_FINDER_SYSTEM_PROMPT, // large, never changes
    cache_control: { type: "ephemeral" },
  },
],
messages: [
  {
    role: "user",
    content: `Find 3 contacts at ${company} for the role: ${role}. Location: ${location}`,
  },
],

// WRONG: do NOT put company/role in system prompt after cache_control
// That invalidates the cache on every request.
```

### Pattern 4: Scoring Engine (SCORE-01, SCORE-02, SCORE-03)

Pure TypeScript function — no Claude call needed. Deterministic, fast, testable.

```typescript
interface ScoringSignals {
  titleMatchScore: number; // 0-30 (role relevance to target role)
  seniorityScore: number; // 0-20 (IC vs manager vs exec)
  publicActivityScore: number; // 0-20 (GitHub stars, talks, blog posts found)
  emailConfidenceScore: number; // 0-15 (high=15, medium=10, low=5, none=0)
  hiringSignalScore: number; // 0-15 (company currently hiring for similar role)
}

interface ScoreResult {
  total: number; // 0-100
  tone: "direct" | "curious" | "value_driven";
  breakdown: ScoringSignals; // stored as JSON in contacts.score_breakdown
}

export function scoreContact(signals: ScoringSignals): ScoreResult {
  const total =
    signals.titleMatchScore +
    signals.seniorityScore +
    signals.publicActivityScore +
    signals.emailConfidenceScore +
    signals.hiringSignalScore;

  const tone =
    total >= 75 ? "direct" : total >= 45 ? "curious" : "value_driven";

  return { total: Math.min(100, Math.max(0, total)), tone, breakdown: signals };
}
```

### Pattern 5: Firecrawl Company Enrichment with Caching (D-04, D-05, D-06)

Check `company_enrichments` table first (30-day TTL). If miss, scrape then cache.

```typescript
// worker/lib/firecrawl.ts
import FirecrawlApp from "@mendable/firecrawl-js";

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

export async function getCompanyEnrichment(
  domain: string,
  prisma: PrismaClient,
): Promise<CompanyEnrichment | null> {
  // 1. Check cache (30-day TTL)
  const cached = await prisma.companyEnrichment.findFirst({
    where: {
      domain,
      cachedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  });
  if (cached) return cached.data as CompanyEnrichment;

  // 2. Scrape via Firecrawl
  try {
    const pages = await firecrawl.crawlUrl(`https://${domain}`, {
      limit: 10,
      includePaths: ["/about*", "/careers*", "/blog*", "/team*", "/jobs*"],
      excludePaths: ["/login*", "/signup*", "/privacy*", "/terms*"],
      scrapeOptions: { formats: ["markdown"] },
    });

    const enrichment = extractEnrichmentFromPages(pages.data ?? []);

    // 3. Cache result
    await prisma.companyEnrichment.upsert({
      where: { domain },
      create: { domain, data: enrichment, cachedAt: new Date() },
      update: { data: enrichment, cachedAt: new Date() },
    });

    return enrichment;
  } catch (err) {
    // D-06: Never fail pipeline due to Firecrawl
    console.warn(`Firecrawl failed for ${domain}:`, err);
    return null;
  }
}
```

### Pattern 6: Circuit Breaker (AGENT-08)

Wrap each data source in opossum. On open circuit, skip that layer and try next.

```typescript
// worker/lib/circuit-breaker.ts
import CircuitBreaker from "opossum";

export function createCircuitBreaker<T>(
  fn: (...args: unknown[]) => Promise<T>,
  name: string,
): CircuitBreaker {
  const cb = new CircuitBreaker(fn, {
    timeout: 10000, // 10s per call
    errorThresholdPercentage: 50,
    resetTimeout: 30000, // 30s before retry after open
    name,
  });

  cb.on("open", () => console.warn(`Circuit breaker OPEN: ${name}`));
  cb.on("halfOpen", () => console.info(`Circuit breaker HALF-OPEN: ${name}`));

  return cb;
}
```

For V1 (Claude-only, no external APIs), the circuit breaker wraps only the Firecrawl call and the Anthropic API call. The waterfall fallback for V1 is: Firecrawl → Claude web search (Research Agent only).

### Pattern 7: PipelineResponse Assembly

The orchestrator writes to DB after each step. A GET endpoint assembles the full response from rows.

```typescript
// lib/api/pipeline-response.ts
export async function assemblePipelineResponse(
  searchId: string,
  prisma: PrismaClient,
): Promise<PipelineResponse> {
  const search = await prisma.search.findUniqueOrThrow({
    where: { id: searchId },
    include: {
      contacts: {
        include: { outreach: { take: 1, orderBy: { createdAt: "desc" } } },
      },
    },
  });

  return {
    company: search.company,
    role: search.role,
    pipeline_status: mapStatus(search.status),
    contacts: search.contacts.map((c) => ({
      name: c.name,
      title: c.title,
      email: c.email ?? "",
      confidence: mapConfidence(c.emailConfidence),
      hooks: [c.researchMentionThis, c.researchAskThis].filter(
        Boolean,
      ) as string[],
    })),
    steps: buildSteps(search.status),
    drafts: search.contacts.flatMap((c) =>
      c.outreach.map((o) => ({
        contact_name: c.name,
        subject: o.subject,
        body: o.body,
        hook_used: c.researchMentionThis ?? "",
      })),
    ),
  };
}
```

### Anti-Patterns to Avoid

- **Agent writes directly to DB:** Return structured JSON to orchestrator; orchestrator owns all Prisma writes (ARCHITECTURE.md Anti-Pattern 4).
- **Dynamic content in system prompt:** Invalidates cache on every request — costs more than no caching (PITFALLS.md #5).
- **LinkedIn URLs in tool execution:** Block at code level, not just prompt level — Claude can follow returned search result URLs (PITFALLS.md #22).
- **No step limit on tool loops:** One search with bad data can consume $5+ in API calls (PITFALLS.md #6). Hard limit: Contact Finder max 5, Research max 3 per contact.
- **Scoring inside Claude:** Deterministic weighted sum runs faster and cheaper in pure TypeScript with no API cost.
- **Firecrawl as separate BullMQ job:** Per D-04/D-06, enrichment runs inline inside Research Agent step. The Phase 1 `enrichment-service.md` spec used a separate queue — that design is superseded by the CONTEXT.md decision to run it inline.
- **Raw `fetch` in tool execution without blocklist:** Must pass all URLs through `isBlockedUrl()` before fetching.

---

## Schema Gaps (Wave 0 Tasks)

The current `prisma/schema.prisma` is missing two things required by this phase:

### Gap 1: `company_enrichments` table (D-05)

New model required:

```prisma
model CompanyEnrichment {
  id        String   @id @default(uuid())
  domain    String   @unique             // e.g. "atlassian.com"
  data      Json                         // CompanyEnrichment struct
  cachedAt  DateTime @map("cached_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("company_enrichments")
}
```

### Gap 2: `contacts.score_breakdown` column (SCORE-02)

The `contacts` table has `score Int?` but lacks the breakdown JSON. Add:

```prisma
model Contact {
  // ... existing fields ...
  scoreBreakdown Json? @map("score_breakdown") // ScoringSignals JSON for SCORE-02 breakdown panel
}
```

Both gaps require `prisma migrate dev` before any agent code runs.

---

## Don't Hand-Roll

| Problem                           | Don't Build                        | Use Instead                                     | Why                                                                                             |
| --------------------------------- | ---------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Web scraping with cheerio         | Custom HTML parser                 | `@mendable/firecrawl-js`                        | Handles JS-rendered pages, respects robots.txt, manages rate limits, returns clean markdown     |
| Retry logic with setTimeout       | Custom retry loop                  | BullMQ's built-in `attempts` + `backoff` config | Already configured in Phase 2 for outer retry; wrap inner Claude calls with p-retry for 429/529 |
| Circuit breaker state machine     | Custom open/half-open/closed state | `opossum` (AGENT-08)                            | 12k GitHub stars, node-certified, handles timeout + error threshold + reset timer               |
| Email pattern inference algorithm | Custom regex library               | Claude Haiku 4.5 via web search tool            | Claude can search job listings and author bios — more accurate than static regex patterns       |
| Scoring calculation in Claude     | Prompt asking Claude to score      | Pure TypeScript weighted sum                    | Deterministic, testable, zero API cost, <1ms latency                                            |
| Response envelope construction    | Custom assembly code               | Single `assemblePipelineResponse` function      | Centralizes DB→API mapping, easier to test                                                      |

**Key insight:** The agents are Claude API calls — everything else (scoring, response assembly, caching, circuit breaking) is plain TypeScript. Don't invoke Claude for tasks that are deterministic.

---

## Common Pitfalls

### Pitfall A: SDK Not Installed — Build Fails Silently

**What goes wrong:** `@anthropic-ai/sdk` is referenced in agent code but not in `package.json`. TypeScript compiles fine (imports look valid) but runtime crashes.
**Prevention:** `npm install @anthropic-ai/sdk @mendable/firecrawl-js opossum` as Wave 0 task, before writing any agent code. Verify with `npm list @anthropic-ai/sdk`.

### Pitfall B: `cache_control` on Wrong Message Turn

**What goes wrong:** Developer puts `cache_control: { type: "ephemeral" }` on the user message or on a message containing the dynamic company name. Cache never hits; costs are higher than without caching.
**Prevention:** Cache goes on the system prompt block ONLY. The user message changes per request (contains company/role/contact data) and must not be cached. See Pattern 3 above.
**Warning signs:** `cache_creation_input_tokens > 0` on every request, `cache_read_input_tokens = 0`.

### Pitfall C: Agent Runaway Loop (Pitfall 6 from PITFALLS.md)

**What goes wrong:** Contact Finder keeps searching for contacts, never reaching `stop_reason: "end_turn"`. 20+ tool calls, $5+ per search.
**Prevention:** Hard `maxSteps` parameter on every agent. Contact Finder: 5, Email Guesser: 3, Research Agent: 3 per contact, Email Drafter: 2. Enforce at the loop level, not just in the system prompt.

### Pitfall D: Firecrawl Credits Exhausted — Orchestrator Crashes

**What goes wrong:** Firecrawl 500-credit limit hit mid-month. Next `crawlUrl` call throws. Pipeline fails.
**Prevention:** Wrap ALL Firecrawl calls in try/catch. On any error, log warning and return `null`. Research Agent proceeds with Claude web search only. Never `throw` from Firecrawl layer.

### Pitfall E: Prisma schema not migrated before pipeline runs

**What goes wrong:** Worker tries to write to `company_enrichments` table that doesn't exist. Prisma throws `P2021: The table 'company_enrichments' does not exist`.
**Prevention:** Migration must run as Wave 0, before any agent implementation. Verify with `prisma migrate status` confirming `CompanyEnrichment` model is deployed.

### Pitfall F: Orchestrator test breaks when stubs are replaced

**What goes wrong:** `tests/queue/orchestrator.test.ts` mocks `runPipeline` as a stub that returns in `100ms`. After replacement, tests either mock agents (and don't test the real pipeline) or hit real Claude API (expensive, non-deterministic).
**Prevention:** Tests for each agent are in separate files and mock the Anthropic SDK. The orchestrator test mocks agent functions at the module level (same vi.mock pattern used for prisma/supabase in Phase 2). The orchestrator test verifies sequencing and DB writes, NOT agent output quality.

### Pitfall G: `stop_reason: "max_tokens"` treated as success

**What goes wrong:** Agent response is truncated by `max_tokens` limit. Structured JSON output is incomplete. `JSON.parse` throws.
**Prevention:** Always check `stop_reason`. If `stop_reason === "max_tokens"`, either increase `max_tokens` or retry. For V1, set `max_tokens: 2048` for all agents except Email Drafter (1024 is enough for a 4-sentence email).

### Pitfall H: LinkedIn URLs in web search results fed back to Claude

**What goes wrong:** Web search tool returns results containing `linkedin.com/in/...` URLs. Claude's next tool call fetches the LinkedIn URL. This violates AGENT-09 and creates legal exposure.
**Prevention:** Filter ALL search result URLs before returning them to Claude. The `executeTool` function for `web_search` must strip LinkedIn URLs from results before feeding them as tool results. Both the system prompt warning AND the code-level filter are required.

### Pitfall I: `company_enrichments` table written per contact, not per domain

**What goes wrong:** Research Agent runs once per contact (3 per search). If three contacts are at Atlassian, Firecrawl is called 3× instead of 1×. 3× credit cost.
**Prevention:** The cache lookup key is `domain` (not `contact_id`). On first contact for a company, scrape and cache. On subsequent contacts, return cached enrichment. The `getCompanyEnrichment` function in Pattern 5 handles this.

---

## Code Examples

### Contact Finder — System Prompt Structure

```typescript
// worker/agents/contact-finder.ts
// Source: @anthropic-ai/sdk 0.82.0 messages.create API

const CONTACT_FINDER_SYSTEM_PROMPT = `You are a professional researcher helping a junior software engineer find relevant contacts at companies to reach out to for networking.

Your goal is to find exactly 3 people at the target company who match the target role. Prioritize:
1. Engineering managers or team leads (not VPs/CTOs — too senior)
2. Senior engineers who hire or mentor
3. Mid-level engineers in the relevant team

CRITICAL RULES:
- Never access linkedin.com URLs. If search returns LinkedIn links, do not fetch them.
- Only use: company team pages, GitHub org pages, engineering blogs, conference speaker lists, press releases, Stack Overflow teams pages
- Always return exactly 3 contacts. If you find fewer, include lower-confidence results with a note.
- Return valid JSON matching the specified schema.

OUTPUT FORMAT: Return a JSON array of exactly 3 objects:
{
  "name": "First Last",
  "title": "Senior Software Engineer",
  "source_url": "https://company.com/team",
  "confidence": "high" | "medium" | "low",
  "public_activity": "brief note on GitHub/blog/talks found"
}`;

// Dynamic content in user message only (never in system after cache_control)
const userMessage = `Find 3 contacts at ${company} relevant to the role: ${role}. Location: ${location ?? "any"}. Return JSON only.`;
```

### Email Guesser — Pattern Inference

```typescript
const EMAIL_GUESSER_SYSTEM_PROMPT = `You are an email pattern detective. Given a person's name and their company domain, you find or infer their business email address.

Strategy (in order):
1. Search for their name + company in blog posts, author bios, GitHub commits, job listing cc fields
2. If direct email found, return with confidence "high"
3. If email pattern for company found (e.g., first@company.com from other employees), apply pattern, return "medium"
4. If no pattern found, return most common patterns (first.last@, firstl@, first@), return "low"

CRITICAL: Never access linkedin.com. Return JSON only.

OUTPUT FORMAT:
{
  "email": "first.last@company.com",
  "confidence": "high" | "medium" | "low",
  "pattern_source": "found in blog author bio" | "inferred from common pattern" | "guessed"
}`;
```

### Scoring Engine — Signals Extraction from Contact Data

The Scoring Engine extracts signals from what the Contact Finder and Research Agent return. Signal extraction heuristics:

```typescript
// worker/scoring/scoring-engine.ts
function extractSignals(
  contact: ContactResult,
  targetRole: string,
  enrichment: CompanyEnrichment | null,
): ScoringSignals {
  return {
    // Title match (0-30): does title relate to target role?
    titleMatchScore: scoreTitleMatch(contact.title, targetRole),

    // Seniority (0-20): IC senior/lead = 20, IC mid = 15, IC junior = 10, exec = 5 (too senior to reply)
    seniorityScore: scoreSeniority(contact.title),

    // Public activity (0-20): GitHub, blog posts, conference talks found
    publicActivityScore: contact.public_activity ? 15 : 5,

    // Email confidence (0-15)
    emailConfidenceScore:
      contact.emailConfidence === "high"
        ? 15
        : contact.emailConfidence === "medium"
          ? 10
          : 5,

    // Hiring signals (0-15): is company hiring for this role type?
    hiringSignalScore: enrichment?.hiringRoles?.some((r) =>
      r.toLowerCase().includes(targetRole.toLowerCase().split(" ")[0]),
    )
      ? 15
      : 5,
  };
}
```

### Email Drafter — Tone-Driven System Prompt

```typescript
// worker/agents/email-drafter.ts
function buildDrafterSystemPrompt(
  tone: "direct" | "curious" | "value_driven",
): string {
  const toneInstructions = {
    direct: `Lead with a shared connection or mutual interest. Ask directly for a coffee chat or 30-minute call.`,
    curious: `Lead with something specific you found about their work (blog post, talk, project). Ask an open-ended question about their perspective.`,
    value_driven: `Lead with something you can offer or share (a project, a finding, a perspective). Suggest a low-commitment interaction like sharing a resource.`,
  };

  return `You draft cold networking emails for junior software engineers seeking informational interviews and coffee chats.

VOICE: Genuine, curious, direct. Show that research was done. No corporate speak.
LENGTH: Exactly 4 sentences. No more.
FORBIDDEN: Em dashes (—), "I hope this finds you well", "I wanted to reach out", "synergy", "leverage", "circle back"
TONE: ${toneInstructions[tone]}

Return JSON only:
{
  "subject": "brief, specific subject line (max 8 words)",
  "body": "4 sentences. First sentence: [tone opening]. Second: [specific hook]. Third: [ask/offer]. Fourth: [light sign-off].",
  "template_type": "referral_ask" | "hiring_inquiry" | "value_offer",
  "hook_used": "which personalization hook was used"
}`;
}
```

---

## State of the Art

| Old Approach                     | Current Approach                           | When Changed         | Impact                                                 |
| -------------------------------- | ------------------------------------------ | -------------------- | ------------------------------------------------------ |
| `claude-2` model                 | `claude-haiku-4-5-20251001`                | 2025                 | Faster, cheaper, better instruction following          |
| Agent SDK autonomous loop        | Manual tool-use loop with BullMQ           | CONTEXT.md D-16      | Full quota control, no autonomous behavior             |
| Middleware.ts auth               | proxy.ts auth                              | Phase 1 (Next.js 16) | Already done in Phase 1                                |
| Separate enrichment BullMQ queue | Inline Firecrawl in Research Agent step    | CONTEXT.md D-04      | Simpler, avoids second queue, respects 3-min timeout   |
| FlowProducer DAG                 | Sequential orchestrator with `Promise.all` | Phase 2 D-01         | Phase 2 already established orchestrator-first pattern |

**Deprecated in this project context:**

- `@anthropic-ai/claude-agent-sdk`: Explicitly forbidden in CLAUDE.md and STACK.md. Do not use.
- Phase 1 `enrichment-service.md` / `firecrawl-architecture-addendum.md` BullMQ enrichment queue pattern: Superseded by CONTEXT.md D-04 (inline in Research Agent).

---

## Open Questions

1. **Claude Haiku 4.5 web_search tool availability**
   - What we know: `@anthropic-ai/sdk` 0.82.0 supports `tools` with custom `input_schema`. Claude Haiku 4.5 supports tool_use.
   - What's unclear: Whether `web_search` is a built-in tool (like `computer_use`) or requires a custom implementation (fetch wrapper). STACK.md references "WebSearch (built into Claude Agent SDK)" — but we're NOT using the Agent SDK.
   - Recommendation: Implement `web_search` as a CUSTOM tool whose execution calls a search API or crawls a URL. Use Firecrawl's `search` method or a DuckDuckGo API for the actual search. Anthropic's built-in web_search tool (if it exists for Haiku) requires verification against the 0.82.0 SDK docs before relying on it. LOW confidence on whether it's a native tool.

2. **`opossum` circuit breaker scope for V1**
   - What we know: opossum wraps async functions. For V1, only Firecrawl and the Anthropic API need circuit breakers (no Hunter.io, no ATS APIs per D-01/D-02).
   - What's unclear: Whether opossum should also wrap the entire agent step (outer circuit breaker on Contact Finder as a whole) vs. individual tool calls inside the agent.
   - Recommendation: One circuit breaker per external service call (Firecrawl, Anthropic). Inner circuit breakers. The BullMQ retry (3 attempts, exponential backoff) handles the outer retry layer.

3. **`company_enrichments` domain extraction**
   - What we know: Cache key is the company domain (e.g., `atlassian.com`).
   - What's unclear: The `PipelineJobData` only has `company: string` (name like "Atlassian"), not a URL. Contact Finder must surface a domain so Research Agent can look up enrichment.
   - Recommendation: Contact Finder should include `company_domain` in its structured output (extracted from the `source_url` it finds). If domain cannot be determined, Research Agent uses Claude web search only (graceful degradation).

4. **Regenerate button (EMAIL-05) — new API endpoint needed?**
   - What we know: EMAIL-05 requires a regenerate capability with different tone/template option. The outreach table stores one draft per contact.
   - What's unclear: Is regenerate implemented as "delete existing outreach row + re-run Email Drafter" or "create a new outreach row"? Phase 4 (UI) will wire the button, but the API endpoint must exist in Phase 3.
   - Recommendation: Create `POST /api/search/[id]/regenerate-draft` that accepts `{ contactId, preferredTone }` and runs a single Email Drafter call, upserting the outreach row. Mark as LOW priority for Phase 3 — Phase 4 may own this if the button is part of the UI phase.

---

## Environment Availability

| Dependency                         | Required By      | Available | Version                       | Fallback                                          |
| ---------------------------------- | ---------------- | --------- | ----------------------------- | ------------------------------------------------- |
| Node.js                            | Worker process   | ✓         | 20.x (project requires 20.9+) | —                                                 |
| `@anthropic-ai/sdk`                | All 4 agents     | ✗         | Not installed                 | No fallback — must install                        |
| `@mendable/firecrawl-js`           | Research Agent   | ✗         | Not installed                 | Research Agent uses Claude web search only (D-06) |
| `opossum`                          | Circuit breakers | ✗         | Not installed                 | Simpler try/catch fallback (lower protection)     |
| `ANTHROPIC_API_KEY`                | All agents       | Unknown   | —                             | Blocks all agent execution — must be set          |
| `FIRECRAWL_API_KEY`                | Research Agent   | Unknown   | —                             | Research Agent falls back to Claude-only (D-06)   |
| Redis                              | BullMQ           | ✓         | Phase 2 confirmed running     | —                                                 |
| Supabase                           | Prisma writes    | ✓         | Phase 1 confirmed             | —                                                 |
| Prisma `company_enrichments` table | Research Agent   | ✗         | Not in schema                 | Migration required before worker starts           |

**Missing dependencies with no fallback:**

- `@anthropic-ai/sdk` — must install before any agent code can run
- `ANTHROPIC_API_KEY` env var — must be set in Railway worker service config

**Missing dependencies with fallback:**

- `@mendable/firecrawl-js` — install for full feature; Research Agent gracefully degrades to Claude-only search if missing or failing
- `opossum` — install for full AGENT-08 compliance; simpler try/catch fallback is acceptable in a pinch but does not provide half-open recovery

---

## Validation Architecture

### Test Framework

| Property           | Value                                                          |
| ------------------ | -------------------------------------------------------------- |
| Framework          | Vitest 4.1.2                                                   |
| Config file        | `vitest.config.ts` (project root)                              |
| Quick run command  | `npx vitest run tests/queue/ tests/agents/ --reporter=verbose` |
| Full suite command | `npx vitest run --coverage`                                    |

Note: Vitest environment is `jsdom` globally but `node` env should be specified per-file for worker tests (same pattern as Phase 2 worker tests).

### Phase Requirements → Test Map

| Req ID           | Behavior                                                        | Test Type   | Automated Command                                        | File Exists?            |
| ---------------- | --------------------------------------------------------------- | ----------- | -------------------------------------------------------- | ----------------------- |
| AGENT-01         | Contact Finder returns 3 contacts as structured JSON            | unit        | `npx vitest run tests/agents/contact-finder.test.ts`     | ❌ Wave 0               |
| AGENT-02         | Email Guesser returns email + confidence per contact            | unit        | `npx vitest run tests/agents/email-guesser.test.ts`      | ❌ Wave 0               |
| AGENT-03         | Research Agent returns structured research card                 | unit        | `npx vitest run tests/agents/research-agent.test.ts`     | ❌ Wave 0               |
| AGENT-04         | Email Drafter returns 4-sentence email in correct tone          | unit        | `npx vitest run tests/agents/email-drafter.test.ts`      | ❌ Wave 0               |
| AGENT-05         | All agents use manual tool-use loop (not Agent SDK)             | unit        | covered by agent tests                                   | ❌ Wave 0               |
| AGENT-06         | Prompt caching: cache_control on system block, not user message | unit        | `npx vitest run tests/agents/prompt-caching.test.ts`     | ❌ Wave 0               |
| AGENT-07         | Waterfall falls back from Firecrawl to Claude-only              | unit        | covered in research-agent test                           | ❌ Wave 0               |
| AGENT-08         | Circuit breaker opens on repeated Firecrawl failures            | unit        | `npx vitest run tests/agents/circuit-breaker.test.ts`    | ❌ Wave 0               |
| AGENT-09         | LinkedIn URLs are blocked in tool execution                     | unit        | `npx vitest run tests/agents/linkedin-blocklist.test.ts` | ❌ Wave 0               |
| SCORE-01         | Scoring formula sums 5 signals to 0-100                         | unit        | `npx vitest run tests/scoring/scoring-engine.test.ts`    | ❌ Wave 0               |
| SCORE-02         | Score breakdown persisted as JSON in contacts.score_breakdown   | unit        | covered in scoring test + DB write test                  | ❌ Wave 0               |
| SCORE-03         | Tone mapping: 75→direct, 45→curious, 0→value_driven             | unit        | covered in scoring-engine.test.ts                        | ❌ Wave 0               |
| SCORE-04         | Email Drafter receives tone from scoring output                 | unit        | covered in email-drafter.test.ts                         | ❌ Wave 0               |
| EMAIL-01         | Template type assigned per tone                                 | unit        | covered in email-drafter.test.ts                         | ❌ Wave 0               |
| EMAIL-02         | Follow-up scaffold present but empty                            | unit        | schema migration test                                    | ❌ Wave 0               |
| EMAIL-03         | Email body ≤ 4 sentences, no em dashes                          | unit        | covered in email-drafter.test.ts                         | ❌ Wave 0               |
| EMAIL-04         | subject + body stored as separate DB fields                     | unit        | covered in outreach write test                           | n/a (schema exists)     |
| EMAIL-05         | Regenerate endpoint creates new outreach row                    | integration | `npx vitest run tests/api/regenerate-draft.test.ts`      | ❌ Wave 0               |
| Orchestrator     | Full pipeline runs 4 stages in correct order                    | integration | `npx vitest run tests/queue/orchestrator.test.ts`        | ✅ exists (mocks stubs) |
| PipelineResponse | GET /api/search/[id] returns correct shape                      | integration | `npx vitest run tests/api/pipeline-response.test.ts`     | ❌ Wave 0               |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/agents/ tests/scoring/` (agent and scoring tests only)
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/agents/contact-finder.test.ts` — covers AGENT-01, AGENT-05, AGENT-09
- [ ] `tests/agents/email-guesser.test.ts` — covers AGENT-02
- [ ] `tests/agents/research-agent.test.ts` — covers AGENT-03, AGENT-06, AGENT-07
- [ ] `tests/agents/email-drafter.test.ts` — covers AGENT-04, EMAIL-01, EMAIL-03, SCORE-04
- [ ] `tests/agents/circuit-breaker.test.ts` — covers AGENT-08
- [ ] `tests/agents/linkedin-blocklist.test.ts` — covers AGENT-09
- [ ] `tests/agents/prompt-caching.test.ts` — covers AGENT-06 (verifies cache_control placement)
- [ ] `tests/scoring/scoring-engine.test.ts` — covers SCORE-01, SCORE-02, SCORE-03
- [ ] `tests/api/pipeline-response.test.ts` — covers PipelineResponse assembly
- [ ] `tests/api/regenerate-draft.test.ts` — covers EMAIL-05

Note: All agent tests must mock `@anthropic-ai/sdk` at the module level (same vi.mock pattern as Phase 2's ioredis/BullMQ mocks). No tests should make real Anthropic API calls.

---

## Project Constraints (from CLAUDE.md)

- **Tech stack:** Next.js 16, Supabase, Claude API (`@anthropic-ai/sdk`) — not negotiable
- **AI model:** Haiku 4.5 for high-volume tasks, Sonnet 4.6 only for deep research/prep briefs (V2)
- **Forbidden:** `@anthropic-ai/claude-agent-sdk`, `middleware.ts`, `@supabase/auth-helpers-nextjs`, auto-sending emails, LinkedIn scraping
- **Testing:** Vitest — node env per-file for worker tests, jsdom per-file for React component tests
- **Immutability:** Always return new objects, never mutate
- **Error handling:** Never silently swallow errors; always provide user-friendly messages
- **File size:** 800 lines max per file; 50 lines max per function
- **No `console.log` in production code:** Use structured logging or `console.warn`/`console.error` with context

---

## Sources

### Primary (HIGH confidence)

- `@anthropic-ai/sdk` 0.82.0 — npm registry confirmed 2026-04-04; `messages.create` API with `tools`, `cache_control`, `stop_reason`
- `.planning/research/STACK.md` — verified versions, prompt caching pattern, agent loop pattern
- `.planning/research/PITFALLS.md` — agent runaway loop, prompt cache write costs, LinkedIn scraping exposure
- `.planning/research/ARCHITECTURE.md` — component boundaries, anti-patterns, build order
- `.planning/phases/03-agent-pipeline/03-CONTEXT.md` — locked decisions, all D-01 through D-22
- `prisma/schema.prisma` — confirmed existing columns; identified two schema gaps
- `worker/orchestrator/pipeline.ts` — confirmed 4 stub steps ready for replacement
- `tests/queue/orchestrator.test.ts` — confirmed existing test structure and mock patterns

### Secondary (MEDIUM confidence)

- `.planning/phases/01-foundation/enrichment-service.md` — Firecrawl `crawlUrl` API usage (superseded by CONTEXT.md for queue architecture, but Firecrawl API calls remain valid)
- `opossum` 9.0.0 — npm registry confirmed; circuit breaker options (timeout, errorThresholdPercentage, resetTimeout)
- `@mendable/firecrawl-js` 4.18.1 — npm registry confirmed

### Tertiary (LOW confidence)

- Claude Haiku 4.5 built-in `web_search` tool availability — unverified; may require custom tool implementation. Recommendation: implement as custom tool to avoid dependency.

---

## Metadata

**Confidence breakdown:**

- Standard Stack: HIGH — all packages verified via npm registry on 2026-04-04
- Architecture: HIGH — based on verified prior phase output (pipeline.ts, schema.prisma) and locked CONTEXT.md decisions
- Pitfalls: HIGH — A/B/C/H drawn from verified PITFALLS.md; D/E/F/G/I are phase-specific findings from code inspection
- Schema gaps: HIGH — directly inspected prisma/schema.prisma; `company_enrichments` and `score_breakdown` confirmed missing
- web_search tool availability: LOW — needs verification against 0.82.0 SDK before implementation

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (30 days — stable domain)
