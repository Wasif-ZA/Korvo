---
phase: 03-agent-pipeline
plan: "01"
subsystem: ai
tags: [packages, schema, types, agents, pipeline]
dependency_graph:
  requires: []
  provides:
    - shared/types/agents.ts (all agent I/O type contracts)
    - CompanyEnrichment Prisma model
    - scoreBreakdown column on Contact
  affects:
    - worker/agents/*.ts (import type from shared/types/agents)
    - All subsequent Phase 3 plans
tech_stack:
  added:
    - "@anthropic-ai/sdk@0.82.0 — Anthropic direct API client for 4 specialized agents"
    - "@mendable/firecrawl-js@4.18.1 — Firecrawl web extraction for company research"
    - "opossum@9.0.0 — Circuit breaker for resilient external API calls"
    - "p-retry@8.0.0 — Retry wrapper with exponential backoff"
  patterns:
    - "All agent type contracts in shared/types/agents.ts — single source of truth"
    - "PipelineResponse re-exported from jobs.ts for single import point"
key_files:
  created:
    - shared/types/agents.ts
  modified:
    - shared/types/jobs.ts (added PipelineResponse re-export)
    - prisma/schema.prisma (CompanyEnrichment model + scoreBreakdown column already in place)
    - package.json (packages already installed)
decisions:
  - "All agent I/O types in shared/types/agents.ts to avoid duplication across worker agents"
  - "PipelineResponse re-exported from jobs.ts so callers have single import location"
  - "Tone and TemplateType defined as union types (not enum) per TypeScript style guide"
  - "ScoringSignals fields commented with 0-N ranges to document weighting at type level"
metrics:
  duration: "8min"
  completed: "2026-04-03T13:40:52Z"
  tasks_completed: 2
  files_modified: 2
---

# Phase 03 Plan 01: Agent Pipeline Foundation Summary

**One-liner:** Package installation and type contract foundation for the 4-agent Korvo pipeline — ContactResult, EmailGuess, ResearchCard, DraftResult, ScoringSignals, CompanyEnrichmentData, and PipelineResponse all defined in shared/types/agents.ts.

## What Was Built

### Task 1: Install packages and update Prisma schema

All 4 required packages were verified installed (`@anthropic-ai/sdk`, `@mendable/firecrawl-js`, `opossum`, `p-retry`). The Prisma schema already contained the `CompanyEnrichment` model and `scoreBreakdown` column (added in a prior worktree session). Ran `npx prisma generate` to confirm client regeneration succeeds.

- Commit: `ef366f8` (packages + schema already in previous commit from worktree)

### Task 2: Define shared agent type contracts

Created `shared/types/agents.ts` with all agent I/O type contracts:

- `ContactResult` — Contact Finder output per contact
- `EmailGuess` — Email Guesser output with confidence levels
- `ResearchCard` — Research Agent output with background/askThis/mentionThis/hooks
- `DraftResult` — Email Drafter output with templateType union
- `ScoringSignals` — 5 weighted scoring signals (title, seniority, public activity, email confidence, hiring signal)
- `ScoreResult` — Total 0-100 score with tone and breakdown
- `Tone` — union type for direct/curious/value_driven
- `TemplateType` — union type with 5 values including followup_1/followup_2
- `CompanyEnrichmentData` — JSON shape stored in company_enrichments.data
- `PipelineResponse` — Frontend-facing shape matching D-14 spec

Added `PipelineResponse` re-export to `shared/types/jobs.ts`.

- Commit: `64c7d31`

## Deviations from Plan

None — plan executed exactly as written. The schema and packages were found pre-installed from a prior worktree session, which is expected in a parallel execution context.

## Known Stubs

None — this plan creates type contracts only. No data flows or UI rendering involved.

## Self-Check: PASSED

- `shared/types/agents.ts` — FOUND
- `shared/types/jobs.ts` contains PipelineResponse re-export — FOUND
- `prisma/schema.prisma` contains `model CompanyEnrichment` — FOUND
- `prisma/schema.prisma` Contact model contains `scoreBreakdown` — FOUND
- `npm list @anthropic-ai/sdk` exits 0 — VERIFIED
- Commit `ef366f8` — FOUND
- Commit `64c7d31` — FOUND
