# Phase 3: Agent Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 03-agent-pipeline
**Areas discussed:** Data sources & fallback, Scoring engine weights, Email tone & templates, Firecrawl integration depth

---

## Data Sources & Fallback

### Contact Finder Sources

| Option                        | Description                                                                         | Selected |
| ----------------------------- | ----------------------------------------------------------------------------------- | -------- |
| Claude web search only        | Haiku 4.5 with web search tool. L1 in 4-layer architecture. Free, always available. | ✓        |
| Claude web search + ATS APIs  | Add Greenhouse/Lever/Workable as L3. Higher-quality targets but adds complexity.    |          |
| Claude web search + Hunter.io | Add Hunter.io as L2 for email patterns. 25 free searches/month.                     |          |

**User's choice:** Claude web search only

### Email Guesser Sources

| Option                           | Description                                                           | Selected |
| -------------------------------- | --------------------------------------------------------------------- | -------- |
| Claude pattern detection         | Haiku 4.5 searches for patterns on blogs, job listings, GitHub. Free. | ✓        |
| Hunter.io + Claude fallback      | Hunter.io domain search (25 free/month) with Claude fallback.         |          |
| Claude + Hunter.io + NeverBounce | Full validation chain. NeverBounce is V2 per requirements.            |          |

**User's choice:** Claude pattern detection

### Fallback Behavior

| Option                      | Description                                                                  | Selected |
| --------------------------- | ---------------------------------------------------------------------------- | -------- |
| Best-effort with confidence | Always return 3 contacts, flag sparse data with low confidence. Never error. | ✓        |
| Minimum quality threshold   | Only return contacts meeting quality bar. Could return 1-2 instead of 3.     |          |

**User's choice:** Best-effort with confidence

---

## Scoring Engine Weights

### Signal Weights

| Option                    | Description                                                   | Selected |
| ------------------------- | ------------------------------------------------------------- | -------- |
| Role relevance heaviest   | Title 30%, seniority 20%, activity 20%, email 15%, hiring 15% | ✓        |
| Email confidence heaviest | Email 30%, title 25%, seniority 20%, activity 15%, hiring 10% |          |
| Equal weights             | All 5 signals at 20% each                                     |          |

**User's choice:** Role relevance heaviest

### Score Transparency

| Option                  | Description                                  | Selected |
| ----------------------- | -------------------------------------------- | -------- |
| Full breakdown panel    | Show each signal's contribution per SCORE-02 | ✓        |
| Score + top reason only | Number plus strongest signal                 |          |
| You decide              | Claude picks best approach                   |          |

**User's choice:** Full breakdown panel

---

## Email Tone & Templates

### Voice

| Option                | Description                                                          | Selected |
| --------------------- | -------------------------------------------------------------------- | -------- |
| Genuine curiosity     | Casual, direct, shows research. No corporate speak. 4 sentences max. | ✓        |
| Professional but warm | Slightly more formal, cover letter tone                              |          |
| Ultra casual          | Very informal, conversational                                        |          |

**User's choice:** Genuine curiosity

### Tone Band Variation

| Option                | Description                                                                                                     | Selected |
| --------------------- | --------------------------------------------------------------------------------------------------------------- | -------- |
| Vary opening and ask  | Direct: shared connection → coffee chat. Curious: research hook → open question. Value: offer → low-commitment. | ✓        |
| Vary entire structure | Completely different structure per band                                                                         |          |
| You decide            | Claude designs variations                                                                                       |          |

**User's choice:** Vary opening and ask

---

## Firecrawl Integration Depth

### Scraping Depth

| Option                | Description                                                                                 | Selected |
| --------------------- | ------------------------------------------------------------------------------------------- | -------- |
| Targeted pages only   | /about, /careers, /blog, /team, /jobs — max 10 pages. Fits free tier (~50 companies/month). | ✓        |
| Deep crawl            | Up to 25 pages. More comprehensive but eats credits fast.                                   |          |
| Skip Firecrawl for V1 | Claude web search only. Add Firecrawl in V2.                                                |          |

**User's choice:** Targeted pages only

### Caching Strategy

| Option                 | Description                                                                | Selected |
| ---------------------- | -------------------------------------------------------------------------- | -------- |
| Cache per domain       | Store in company_enrichments table. 30-day TTL. Reuse for repeat searches. | ✓        |
| No cache, always fresh | Scrape every time. Current data but wastes credits.                        |          |
| You decide             | Claude picks caching strategy                                              |          |

**User's choice:** Cache per domain

---

## Additional Context (User-Provided)

User provided a landing page aesthetic context document describing:

- Visual redesign to Firecrawl-style light mode
- PipelineResponse interface the frontend demo expects
- Tab system (PIPELINE OUTPUT built, EMAIL PREVIEW and ANALYTICS are future)
- Aspirational SDK API example on landing page

This was incorporated into CONTEXT.md under D-14 (PipelineResponse shape) and specifics section.

## Claude's Discretion

- Agent system prompt design
- Tool definitions for web search
- Structured output schemas (must map to PipelineResponse)
- Firecrawl extract vs crawl mode
- Scoring engine implementation details
- Circuit breaker library choice
- company_enrichments table schema

## Deferred Ideas

- Hunter.io email verification → V2
- Apollo.io BYO API key → V2
- ATS API integration → future L3
- Follow-up templates → V3
- Waitlist endpoint → Phase 6 or ad-hoc
- Bull Board monitoring → deferred
