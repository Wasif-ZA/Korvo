# Firecrawl Integration — Architecture Addendum

## System Architecture Update

This document supplements the main `architecture.md` to describe how the Firecrawl-powered Enrichment Service integrates into the existing Korvo pipeline.

## Updated Pipeline Flow

```
┌─────────────────────────────────────────────────────────┐
│                    KORVO PIPELINE                        │
│                                                         │
│  1. LEAD FINDER (Apollo API / Manual)                   │
│     └─→ Discovers contacts: name, title, company, URL   │
│                                                         │
│  2. EMAIL GUESSER                                       │
│     └─→ Generates probable email from name + domain     │
│                                                         │
│  3. ENRICHMENT SERVICE (NEW — Firecrawl)                │
│     └─→ Scrapes company site for context                │
│     └─→ Extracts: tech stack, news, values, hiring      │
│     └─→ Claude generates personalization hooks           │
│                                                         │
│  4. OUTREACH DRAFTER (Claude API)                       │
│     └─→ Receives enriched lead data                     │
│     └─→ Drafts personalized cold email                  │
│                                                         │
│  5. REVIEW & SEND                                       │
│     └─→ User reviews draft in UI                        │
│     └─→ Sends or saves to Gmail drafts                  │
└─────────────────────────────────────────────────────────┘
```

## Service Communication

```
Lead Finder ──(lead)──▶ BullMQ Queue
                            │
                    ┌───────┴───────┐
                    │               │
              Email Guesser   Enrichment Service
                    │               │
                    └───────┬───────┘
                            │
                    Enriched Lead Record
                      (Supabase)
                            │
                    Outreach Drafter
                            │
                    Draft Email (UI)
```

## Key Design Decisions

- **Async enrichment**: Runs via BullMQ so it doesn't block the main flow. Lead appears in UI immediately; enrichment populates in background.
- **Graceful degradation**: If Firecrawl fails or returns sparse data, the drafter still works — it just produces a less personalized email (same as current behavior without enrichment).
- **Company-level caching**: Enrichment data is stored per company domain. Multiple contacts at the same company share the same enrichment data (no redundant scrapes).
- **Credit-conscious**: Targets 10 pages per company max. Fits Firecrawl free tier for ~50 companies/month.

## New Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| `@mendable/firecrawl-js` | Firecrawl SDK for scraping/extraction | latest |

## New Environment Variables

| Variable | Description |
|----------|-------------|
| `FIRECRAWL_API_KEY` | API key from firecrawl.dev |

## Files Added/Modified

| File | Action | Description |
|------|--------|-------------|
| `lib/firecrawl.ts` | NEW | Firecrawl client, scrape & extract functions |
| `lib/enrichment.ts` | NEW | Personalization hook generator |
| `jobs/enrichment.job.ts` | NEW | BullMQ worker for async enrichment |
| `lib/supabase/schema.sql` | MODIFIED | Add enrichment columns to leads table |
| `.env.local` | MODIFIED | Add FIRECRAWL_API_KEY |
