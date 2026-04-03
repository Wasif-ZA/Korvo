---
phase: 03-agent-pipeline
verified: 2026-04-04T01:30:00Z
status: gaps_found
score: 4/5 success criteria verified
re_verification: false
gaps:
  - truth: "Searching a company returns 3 contacts with a 0-100 response probability score"
    status: failed
    reason: "PipelineResponse.contacts shape (D-14) only includes confidence: number (0-1) from email confidence — the 0-100 score is computed and stored in DB (Contact.score column) but is not returned in assemblePipelineResponse or the GET /api/search/[id] response. Success criterion 1 requires the score in the returned data."
    artifacts:
      - path: "lib/api/pipeline-response.ts"
        issue: "assemblePipelineResponse maps c.emailConfidence to confidence (0-1) but does not map c.score (0-100) into any response field"
      - path: "shared/types/agents.ts"
        issue: "PipelineResponse.contacts interface has confidence: number (0-1) but no score: number (0-100) field"
    missing:
      - "Add score: number field to PipelineResponse.contacts interface in shared/types/agents.ts"
      - "Map c.score to the score field in assemblePipelineResponse (lib/api/pipeline-response.ts)"
      - "Optionally add scoreBreakdown to expose SCORE-02 data via API (stored as Contact.scoreBreakdown Json column)"
human_verification:
  - test: "Run a real search against live Claude API and confirm no linkedin.com URLs appear in any agent output"
    expected: "Zero LinkedIn URLs in contact names, titles, emails, research cards, or draft bodies"
    why_human: "AGENT-09 blocklist is applied in code but verifying no LinkedIn data slips through system prompts requires live API calls with web search enabled (ANTHROPIC_API_KEY + paid tier)"
  - test: "Run two consecutive identical company searches and verify the second search reuses Firecrawl cache"
    expected: "Second search completes faster; prisma.companyEnrichment.findFirst returns cached data; Firecrawl not called again within 30 days"
    why_human: "Requires live Firecrawl API key and real DB access to verify cachedAt TTL logic"
  - test: "With FIRECRAWL_API_KEY unset, run a search and confirm the pipeline completes without error"
    expected: "Research agent falls back to Claude-only mode (D-06); pipeline status becomes 'completed' not 'failed'"
    why_human: "Requires live worker process to test fallback path; circuit breaker fire() only visible at runtime"
---

# Phase 3: Agent Pipeline Verification Report

**Phase Goal:** Given a company + role + location, the system returns 3 contacts with guessed emails, research cards, response probability scores, and ready-to-send cold email drafts
**Verified:** 2026-04-04T01:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| #   | Truth                                                                                                                                   | Status          | Evidence                                                                                                                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Searching a company returns 3 contacts with names, titles, guessed emails with confidence level, and a 0-100 response probability score | FAILED          | Score computed and stored (Contact.score) but not included in PipelineResponse or GET /api/search/[id] response. contacts[] has only confidence (0-1) from email                                                                                           |
| 2   | Each contact has a structured research card (Background / Ask This / Mention This) with personalization hooks                           | VERIFIED        | ResearchCard type defined; research-agent.ts produces all three fields; pipeline.ts writes researchBackground/researchAskThis/researchMentionThis to DB; pipeline-response.ts exposes hooks[]                                                              |
| 3   | Each contact has a tone-mapped draft email (direct/curious/value_driven) using correct template type                                    | VERIFIED        | email-drafter.ts builds tone-specific system prompt via buildDrafterSystemPrompt(score.tone); tone bands match D-12 spec; Outreach row written with tone column; 3 template types validated                                                                |
| 4   | All four agents use @anthropic-ai/sdk directly with prompt caching — no LinkedIn URLs in agent output                                   | VERIFIED (code) | agent-loop.ts uses claude.messages.create with cache_control ephemeral on system prompts; filterBlockedUrls strips LinkedIn URLs from all tool results; system prompts explicitly prohibit linkedin.com; LinkedIn in-output needs human verification       |
| 5   | If a data source fails, pipeline falls back and completes without returning error to user                                               | VERIFIED (code) | findContacts/guessEmails/researchContacts/draftEmails all have try/catch returning fallbacks; firecrawl.ts catches all errors and returns null; pipeline.ts catches agent errors and marks search failed (not throwing to BullMQ); needs live verification |

**Score:** 4/5 truths verified (1 gap)

---

## Required Artifacts

| Artifact                           | Expected                                                         | Status             | Details                                                                                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `worker/agents/contact-finder.ts`  | Contact Finder agent — Claude Haiku + web search, 3 contacts     | VERIFIED           | 142 lines; real runAgentLoop call; returns exactly 3 ContactResult; pads with placeholders                                                                 |
| `worker/agents/email-guesser.ts`   | Email Guesser agent — pattern detection, confidence levels       | VERIFIED           | 135 lines; real runAgentLoop call; per-contact guessing; fallback email generation                                                                         |
| `worker/agents/research-agent.ts`  | Research Agent — structured ResearchCard with hooks              | VERIFIED           | 100 lines; Firecrawl enrichment via getCompanyEnrichment; fallback on error                                                                                |
| `worker/agents/email-drafter.ts`   | Email Drafter — tone-mapped cold emails, template types          | VERIFIED           | 171 lines; buildDrafterSystemPrompt uses tone from scoring engine; em-dash sanitization                                                                    |
| `worker/scoring/scoring-engine.ts` | Scoring engine — weighted signals, tone mapping, score breakdown | VERIFIED           | 234 lines; 5 weighted signals; mapTone boundaries exact per D-10; extractSignals + scoreContact                                                            |
| `worker/lib/agent-loop.ts`         | Reusable tool-use loop with prompt caching                       | VERIFIED           | 101 lines; cache_control ephemeral on all system prompts; p-retry 3x; filterBlockedUrls                                                                    |
| `worker/lib/linkedin-blocklist.ts` | LinkedIn domain blocklist                                        | VERIFIED           | Blocks linkedin.com, www.linkedin.com, lnkd.in; filterBlockedUrls regex replacement                                                                        |
| `worker/lib/circuit-breaker.ts`    | Circuit breaker factory using opossum                            | VERIFIED           | createCircuitBreaker wraps opossum; used by firecrawl.ts                                                                                                   |
| `worker/lib/firecrawl.ts`          | Firecrawl enrichment with 30-day cache and circuit breaker       | VERIFIED           | getCompanyEnrichment checks prisma cache; firecrawlBreaker wraps scrapeCompanyRaw; D-06 fallback                                                           |
| `worker/lib/claude-client.ts`      | Anthropic SDK singleton with HAIKU_MODEL                         | VERIFIED           | claude singleton + HAIKU_MODEL = "claude-haiku-4-5-20251001"                                                                                               |
| `worker/orchestrator/pipeline.ts`  | Real pipeline replacing stubs — DAG execution, DB writes         | VERIFIED           | findContacts → Promise.all(guessEmails+researchContacts) → scoring → draftEmails; all 4 broadcastProgress stages                                           |
| `lib/api/pipeline-response.ts`     | assemblePipelineResponse — DB to API mapping                     | VERIFIED (partial) | Assembles from DB; maps confidence 0-1; MISSING: score (0-100) not mapped                                                                                  |
| `app/api/search/[id]/route.ts`     | GET endpoint returning PipelineResponse                          | VERIFIED           | Calls assemblePipelineResponse; 404 on P2025; auth check present                                                                                           |
| `shared/types/agents.ts`           | All agent type contracts                                         | VERIFIED           | ContactResult, EmailGuess, ResearchCard, DraftResult, ScoringSignals, ScoreResult, Tone, TemplateType, CompanyEnrichmentData, PipelineResponse all defined |
| `prisma/schema.prisma`             | CompanyEnrichment model + scoreBreakdown on Contact              | VERIFIED           | CompanyEnrichment model with domain unique + data Json; Contact.scoreBreakdown Json column                                                                 |

---

## Key Link Verification

| From                              | To                                 | Via                                       | Status | Details                                                |
| --------------------------------- | ---------------------------------- | ----------------------------------------- | ------ | ------------------------------------------------------ |
| `worker/orchestrator/pipeline.ts` | `worker/agents/contact-finder.ts`  | `import { findContacts }`                 | WIRED  | Line 11: `import { findContacts }`                     |
| `worker/orchestrator/pipeline.ts` | `worker/agents/email-guesser.ts`   | `import { guessEmails }`                  | WIRED  | Line 12: `import { guessEmails }`                      |
| `worker/orchestrator/pipeline.ts` | `worker/agents/research-agent.ts`  | `import { researchContacts }`             | WIRED  | Line 13: `import { researchContacts }`                 |
| `worker/orchestrator/pipeline.ts` | `worker/agents/email-drafter.ts`   | `import { draftEmails }`                  | WIRED  | Line 14: `import { draftEmails }`                      |
| `worker/orchestrator/pipeline.ts` | `worker/scoring/scoring-engine.ts` | `import { extractSignals, scoreContact }` | WIRED  | Line 15: both imported and called in pipeline loop     |
| `worker/agents/*.ts`              | `worker/lib/agent-loop.ts`         | `import { runAgentLoop }`                 | WIRED  | All 4 agents import and call runAgentLoop              |
| `worker/lib/agent-loop.ts`        | `worker/lib/claude-client.ts`      | `import { claude }`                       | WIRED  | Line 2: claude instance used in every API call         |
| `worker/lib/agent-loop.ts`        | `worker/lib/linkedin-blocklist.ts` | `import { filterBlockedUrls }`            | WIRED  | Line 3: applied to all tool results (line 79)          |
| `worker/lib/firecrawl.ts`         | `worker/lib/circuit-breaker.ts`    | `import { createCircuitBreaker }`         | WIRED  | firecrawlBreaker wraps scrapeCompanyRaw                |
| `worker/agents/research-agent.ts` | `worker/lib/firecrawl.ts`          | `import { getCompanyEnrichment }`         | WIRED  | Called once per search on line 38                      |
| `app/api/search/[id]/route.ts`    | `lib/api/pipeline-response.ts`     | `import { assemblePipelineResponse }`     | WIRED  | Line 2: assemblePipelineResponse called in GET handler |

---

## Data-Flow Trace (Level 4)

| Artifact                          | Data Variable         | Source                                    | Produces Real Data                                              | Status                                      |
| --------------------------------- | --------------------- | ----------------------------------------- | --------------------------------------------------------------- | ------------------------------------------- |
| `worker/orchestrator/pipeline.ts` | contacts              | `findContacts()` → Claude API             | Real Claude Haiku web search calls via runAgentLoop             | FLOWING                                     |
| `worker/orchestrator/pipeline.ts` | emailGuesses          | `guessEmails()` → Claude API              | Real Claude Haiku calls per contact                             | FLOWING                                     |
| `worker/orchestrator/pipeline.ts` | researchCards         | `researchContacts()` → Firecrawl + Claude | Firecrawl crawl + Claude research call; fallback to Claude-only | FLOWING                                     |
| `worker/orchestrator/pipeline.ts` | scores                | `extractSignals()` + `scoreContact()`     | Pure functions over real contact/email data                     | FLOWING                                     |
| `worker/orchestrator/pipeline.ts` | drafts                | `draftEmails()` → Claude API              | Real Claude Haiku calls with tone-mapped prompts                | FLOWING                                     |
| `lib/api/pipeline-response.ts`    | PipelineResponse      | `prisma.search.findUniqueOrThrow`         | Real DB query with contacts + outreach included                 | FLOWING                                     |
| `lib/api/pipeline-response.ts`    | contacts[].confidence | `c.emailConfidence` → mapConfidence       | DB value from email guesser output                              | FLOWING                                     |
| `lib/api/pipeline-response.ts`    | contacts[].score      | NOT MAPPED                                | c.score stored in DB but not returned                           | HOLLOW — data exists in DB, not in response |

---

## Behavioral Spot-Checks

Step 7b: SKIPPED — Agents require live ANTHROPIC_API_KEY and Firecrawl credits. Tests are the verification mechanism here.

---

## Requirements Coverage

| Requirement | Source Plan  | Description                                                                                | Status              | Evidence                                                                                                                                                                                             |
| ----------- | ------------ | ------------------------------------------------------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AGENT-01    | 03-04        | Contact Finder agent — finds 3 contacts via Claude Haiku + web search                      | SATISFIED           | `worker/agents/contact-finder.ts`; findContacts returns exactly 3; web_search_20250305 tool used                                                                                                     |
| AGENT-02    | 03-05        | Email Guesser — pattern detection, confidence levels                                       | SATISFIED           | `worker/agents/email-guesser.ts`; high/medium/low confidence; fallback email generation                                                                                                              |
| AGENT-03    | 03-06        | Research Agent — structured research card per contact                                      | SATISFIED           | `worker/agents/research-agent.ts`; background/askThis/mentionThis/hooks fields                                                                                                                       |
| AGENT-04    | 03-07        | Email Drafter — 4-sentence cold email, tone mapping, template type                         | SATISFIED           | `worker/agents/email-drafter.ts`; 3 tone bands; 4-sentence constraint in system prompt                                                                                                               |
| AGENT-05    | 03-01, 03-02 | All agents use @anthropic-ai/sdk v0.81+ directly, not Agent SDK                            | SATISFIED           | `worker/lib/claude-client.ts` uses `import Anthropic from "@anthropic-ai/sdk"`; all agents call runAgentLoop which calls claude.messages.create                                                      |
| AGENT-06    | 03-02, 03-08 | Prompt caching on all agent system prompts                                                 | SATISFIED           | `worker/lib/agent-loop.ts` line 45: `cache_control: { type: "ephemeral" }` on every system prompt                                                                                                    |
| AGENT-07    | 03-04, 03-06 | 4-layer data access waterfall (L1 web search, L2 pattern detection, L3 ATS, L4 enrichment) | PARTIAL — L1 only   | Per CONTEXT.md D-01: L1 only for V1. Contact Finder uses Claude web search (L1). L2 Hunter.io, L3 ATS, L4 enrichment all deferred. Documented in CONTEXT.md and code comments                        |
| AGENT-08    | 03-01, 03-02 | Circuit breakers per data source using opossum                                             | PARTIAL             | `worker/lib/circuit-breaker.ts` factory built; `worker/lib/firecrawl.ts` uses firecrawlBreaker. Claude API calls use p-retry (3x backoff) not circuit breaker — intentional per 03-02-PLAN.md design |
| AGENT-09    | 03-02, 03-08 | LinkedIn domain blocklist in all agent outputs                                             | SATISFIED           | `worker/lib/linkedin-blocklist.ts`; filterBlockedUrls applied in agent-loop.ts to all tool results; system prompts explicitly prohibit linkedin.com                                                  |
| SCORE-01    | 03-03        | Response probability scoring 0-100 with weighted signals                                   | PARTIALLY SATISFIED | scoreContact + extractSignals produce correct 0-100 scores; scores stored in DB; but not returned in PipelineResponse (gap)                                                                          |
| SCORE-02    | 03-01, 03-03 | Explainable score breakdown panel per signal                                               | PARTIALLY SATISFIED | ScoringSignals with 5 components defined; scoreBreakdown stored as JSON in DB; NOT exposed in API response                                                                                           |
| SCORE-03    | 03-03        | Tone mapping: 75-100=direct, 45-74=curious, 0-44=value_driven                              | SATISFIED           | mapTone() in scoring-engine.ts; verified by 7 passing tests including boundary conditions                                                                                                            |
| SCORE-04    | 03-03        | Tone drives email template selection and drafter prompt                                    | SATISFIED           | buildDrafterSystemPrompt(score.tone) in email-drafter.ts; TONE_INSTRUCTIONS map per tone                                                                                                             |
| EMAIL-01    | 03-01, 03-07 | Template types: referral_ask, hiring_inquiry, value_offer                                  | SATISFIED           | DraftResult.templateType union; validateTemplateType function; Outreach.templateType column                                                                                                          |
| EMAIL-02    | 03-01, 03-07 | Follow-up templates scaffolded (followup_1, followup_2)                                    | SATISFIED           | TemplateType union includes followup_1 and followup_2; Outreach.templateType column supports them; agents don't populate them (deferred to V3 per D-13)                                              |
| EMAIL-03    | 03-07        | All emails max 4 sentences, casual/direct tone, no em dashes                               | SATISFIED           | System prompt: "LENGTH: Exactly 4 sentences"; FORBIDDEN list includes em dashes; em-dash sanitization in draftEmails and generateFallbackDraft                                                       |

---

## Anti-Patterns Found

| File                              | Line  | Pattern                                                    | Severity | Impact                                                                                                                     |
| --------------------------------- | ----- | ---------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `worker/orchestrator/pipeline.ts` | 113   | `userName: "there"` hardcoded placeholder                  | Info     | Generic sign-off in email drafts for V1; documented deviation in 03-08-SUMMARY.md; user profile lookup deferred to Phase 4 |
| `worker/orchestrator/pipeline.ts` | 141   | `console.error` for pipeline failure logging               | Info     | Using console.error for error logging — acceptable in worker process until Sentry (Phase 6) is added                       |
| `worker/lib/circuit-breaker.ts`   | 20-21 | `console.warn` / `console.info` for circuit breaker events | Info     | Monitoring-level logs acceptable until Phase 6 Sentry integration                                                          |

No blocker anti-patterns found. All identified patterns are intentional V1 stubs or deferred features with documented rationale.

---

## Human Verification Required

### 1. LinkedIn URL enforcement in live agent output

**Test:** Run a real search with `ANTHROPIC_API_KEY` set (e.g., "Atlassian, Software Engineer, Sydney"), then grep all returned contact names, titles, emails, research hooks, and email bodies for `linkedin.com`
**Expected:** Zero LinkedIn URLs appear in any agent output — they are blocked at the code level by `filterBlockedUrls` and the system prompt prohibition
**Why human:** Requires live Claude API with web_search_20250305 tool enabled; blocklist is correctly coded but end-to-end verification needs real API calls

### 2. Firecrawl fallback with missing API key

**Test:** Run a search with `FIRECRAWL_API_KEY` unset; observe research agent behavior
**Expected:** Pipeline completes with `status: "completed"`; research cards use Claude-only fallback (`enrichmentContext = "No company enrichment available"`); no errors returned to user
**Why human:** Needs live worker process; circuit breaker behavior only visible at runtime

### 3. Prompt caching confirmed in billing dashboard

**Test:** Run 3+ searches for the same company and check Anthropic API billing dashboard for `cache_read_input_tokens > 0`
**Expected:** System prompt tokens are served from cache on repeat calls; confirms `cache_control: { type: "ephemeral" }` is working
**Why human:** Cannot verify caching from code alone; requires API billing metrics

---

## Gaps Summary

One gap found blocking full goal achievement:

**Gap: 0-100 score not returned in PipelineResponse**

ROADMAP success criterion #1 requires the search response to include "a 0-100 response probability score" per contact. The scoring engine correctly computes this value (`scoreContact()` returns `ScoreResult.total: number`) and it is written to the database (`Contact.score Int?`). However, `assemblePipelineResponse()` in `lib/api/pipeline-response.ts` does not map `c.score` into the response, and the `PipelineResponse` interface in `shared/types/agents.ts` does not include a `score` field in `contacts[]` (only `confidence: number (0-1)` from email confidence).

The fix is minimal: add `score: number` to `PipelineResponse.contacts` and map `c.score ?? 0` in `assemblePipelineResponse`. SCORE-02 (breakdown panel) would also benefit from adding `scoreBreakdown` to the response.

All other phase-3 deliverables are fully implemented and verified:

- 4 agents (contact-finder, email-guesser, research-agent, email-drafter) are substantive, wired, and data-flowing
- Scoring engine (pure function) passes all 28 tests including all tone boundary conditions
- Firecrawl enrichment with circuit breaker and 30-day cache implemented
- LinkedIn blocklist applied at agent-loop level to all tool results
- Prompt caching via `cache_control: ephemeral` on all agent system prompts
- 131 tests passing across agents, scoring, and API layers
- AGENT-07 (L1-only per D-01) and AGENT-08 (Firecrawl circuit breaker only; Claude uses p-retry) are partially satisfied per explicit CONTEXT.md decisions

---

_Verified: 2026-04-04T01:30:00Z_
_Verifier: Claude (gsd-verifier)_
