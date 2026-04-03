# Enrichment Service Module

## Overview

The Enrichment Service sits between lead discovery (Apollo/manual) and outreach drafting. It uses Firecrawl to scrape target company websites and extract structured context that feeds into the Claude API for hyper-personalized cold email generation.

## Purpose

- Scrape company websites for personalization signals (tech stack, recent news, values, hiring activity)
- Provide structured enrichment data to the outreach drafter
- Reduce manual research time per lead from ~10 min to near-zero

## Pipeline Position

```
Lead Found (Apollo / Manual)
  → Enrichment Service (this module)
    → Firecrawl scrapes company URL
    → Claude extracts structured context
  → Email Drafter (receives enriched lead data)
```

## Inputs

- `companyUrl` (string) — target company's website URL
- `leadData` (object) — existing lead info from Apollo or manual entry
  - `name`, `title`, `company`, `email` (guessed or confirmed)

## Outputs

- `enrichedLead` (object) — original lead data + enrichment context:
  - `techStack` (string[]) — technologies/frameworks mentioned on site
  - `recentNews` (string[]) — blog posts, press releases, announcements from last 90 days
  - `companyValues` (string[]) — mission/values/culture signals
  - `hiringRoles` (string[]) — active job listings relevant to SWE
  - `teamSize` (string) — estimated team/company size if available
  - `personalizationHooks` (string[]) — top 3 talking points for outreach

## Implementation

### 1. Firecrawl Integration

```typescript
// lib/firecrawl.ts
import FirecrawlApp from "@mendable/firecrawl-js";

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

export async function scrapeCompany(url: string) {
  // Scrape key pages
  const pages = await firecrawl.crawlUrl(url, {
    limit: 10,
    includePaths: ["/about*", "/careers*", "/blog*", "/team*", "/jobs*"],
    excludePaths: ["/login*", "/signup*", "/privacy*", "/terms*"],
    scrapeOptions: {
      formats: ["markdown"],
    },
  });

  return pages;
}

export async function extractCompanyData(url: string) {
  // Use Firecrawl extract mode with schema
  const result = await firecrawl.scrapeUrl(url, {
    formats: ["extract"],
    extract: {
      schema: {
        type: "object",
        properties: {
          techStack: {
            type: "array",
            items: { type: "string" },
            description: "Technologies, frameworks, and tools used by the company",
          },
          recentNews: {
            type: "array",
            items: { type: "string" },
            description: "Recent announcements, blog posts, or press mentions",
          },
          companyValues: {
            type: "array",
            items: { type: "string" },
            description: "Company mission, values, and culture signals",
          },
          hiringRoles: {
            type: "array",
            items: { type: "string" },
            description: "Active engineering or technical job listings",
          },
          teamSize: {
            type: "string",
            description: "Estimated company or engineering team size",
          },
        },
        required: ["techStack", "recentNews", "companyValues"],
      },
    },
  });

  return result.extract;
}
```

### 2. Personalization Hook Generator

After Firecrawl returns structured data, pass it to Claude to generate the top personalization hooks:

```typescript
// lib/enrichment.ts
export async function generatePersonalizationHooks(
  enrichmentData: CompanyEnrichment,
  leadData: LeadData
): Promise<string[]> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Given this company data and lead info, generate 3 specific personalization hooks for a cold networking email from a junior SWE.

Company data: ${JSON.stringify(enrichmentData)}
Lead: ${leadData.name}, ${leadData.title} at ${leadData.company}

Return as JSON array of 3 strings. Each hook should be specific, genuine, and reference something concrete from the company data.`,
      },
    ],
  });

  return JSON.parse(response.content[0].text);
}
```

### 3. BullMQ Job Integration

Enrichment runs as an async job in the existing BullMQ pipeline:

```typescript
// jobs/enrichment.job.ts
import { Queue, Worker } from "bullmq";
import { scrapeCompany, extractCompanyData } from "@/lib/firecrawl";
import { generatePersonalizationHooks } from "@/lib/enrichment";

const enrichmentQueue = new Queue("enrichment", { connection: redis });

// Add to queue after lead is found
export async function enqueueEnrichment(lead: LeadData) {
  await enrichmentQueue.add("enrich-lead", { lead }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
}

// Worker processes enrichment jobs
const worker = new Worker("enrichment", async (job) => {
  const { lead } = job.data;

  // Step 1: Extract structured company data
  const companyData = await extractCompanyData(lead.companyUrl);

  // Step 2: Generate personalization hooks
  const hooks = await generatePersonalizationHooks(companyData, lead);

  // Step 3: Update lead record in Supabase
  await supabase
    .from("leads")
    .update({
      enrichment_data: companyData,
      personalization_hooks: hooks,
      enriched_at: new Date().toISOString(),
    })
    .eq("id", lead.id);

  return { companyData, hooks };
}, { connection: redis });
```

## Database Changes

Add to `leads` table in Supabase:

```sql
ALTER TABLE leads ADD COLUMN enrichment_data jsonb;
ALTER TABLE leads ADD COLUMN personalization_hooks text[];
ALTER TABLE leads ADD COLUMN enriched_at timestamptz;
```

## Environment Variables

```
FIRECRAWL_API_KEY=fc-xxxxx
```

## Rate Limits & Costs

- Firecrawl free tier: 500 credits/month (1 credit per page scraped)
- Extract mode uses additional credits
- Budget: ~50 leads/month with 10 pages crawled each = 500 credits (fits free tier)
- Fallback: if credits exhausted, skip enrichment and draft with Apollo data only

## Error Handling

- If Firecrawl fails (rate limit, site blocks): log warning, continue pipeline with unenriched lead
- If extraction returns sparse data: still pass to drafter, hooks generator will work with whatever's available
- Retry logic handled by BullMQ (3 attempts, exponential backoff)

## Dependencies

- `@mendable/firecrawl-js` — Firecrawl SDK
- Existing: `bullmq`, `@anthropic-ai/sdk`, `@supabase/supabase-js`

## Future Enhancements

- Cache enrichment data per company domain (avoid re-scraping for multiple contacts at same company)
- Add LinkedIn company page scraping as secondary source
- Scrape job listings to auto-match with user's skills/resume
- Webhook to trigger re-enrichment when company publishes new blog/news
