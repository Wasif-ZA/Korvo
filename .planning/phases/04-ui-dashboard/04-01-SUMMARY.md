---
phase: 04-ui-dashboard
plan: 01
subsystem: api
tags: [endpoints, vitest, regenerate, reminder, pipeline-response]
dependency_graph:
  requires: []
  provides:
    - POST /api/drafts/[id]/regenerate
    - PATCH /api/contacts/[id]/reminder
    - PipelineResponse with real DB IDs
  affects:
    - components/app/EmailDraft.tsx
    - shared/types/agents.ts
    - lib/api/pipeline-response.ts
tech_stack:
  added: []
  patterns:
    - Supabase auth + Prisma ownership check pattern
    - Claude Haiku 4.5 inline invocation for regeneration
    - Zod schema validation on all route inputs
key_files:
  created:
    - app/api/drafts/[id]/regenerate/route.ts
    - app/api/contacts/[id]/reminder/route.ts
    - tests/api/regenerate-route.test.ts
    - tests/api/reminder-route.test.ts
  modified:
    - shared/types/agents.ts (id + research fields on PipelineResponse)
    - lib/api/pipeline-response.ts (id: c.id, id: o.id, research fields)
decisions:
  - Use Claude Haiku 4.5 directly in regenerate route (no separate agent module to invoke)
  - Store reminder as JSON string in contact.notes field (DASH-05 scaffolded persistence)
  - Derive tone from contact.score at regeneration time (not persisted tone)
metrics:
  duration: 15m
  completed: 2026-04-03T16:43:00Z
  tasks_completed: 2
  files_created: 4
  files_modified: 2
---

# Phase 04 Plan 01: Backend Contracts and Missing API Endpoints Summary

**One-liner:** Added real DB IDs to PipelineResponse, created regenerate and reminder endpoints with Claude Haiku 4.5 integration and full vitest coverage.

## What Was Built

### Task 1 (Pre-completed at commit 1e2a8bf)

`shared/types/agents.ts` and `lib/api/pipeline-response.ts` were updated before this execution:

- `PipelineResponse.contacts` now includes `id: string` as first field
- `PipelineResponse.drafts` now includes `id: string` as first field
- Research fields added to contacts: `researchBackground`, `researchAskThis`, `researchMentionThis`
- `assemblePipelineResponse` maps `id: c.id` and `id: o.id` from Prisma results

### Task 2 (commit 1cf0ed0)

**POST /api/drafts/[id]/regenerate**

- Auth gate: Supabase `getUser()` returns 401 if no session
- Ownership check: `outreach.contact.search.userId === user.id` (404 on mismatch)
- Tone derivation: score >= 75 = direct, >= 45 = curious, < 45 = value_driven
- Calls Claude Haiku 4.5 with contact/company/role/hook context
- Parses JSON response from AI, updates outreach record via `prisma.outreach.update`
- Returns `{ success: true, data: { id, subject, body, hook_used } }`

**PATCH /api/contacts/[id]/reminder**

- Zod schema: `{ reminderActive: boolean }` — returns 400 on validation failure
- Auth gate + ownership check pattern identical to other endpoints
- `reminderActive=true`: stores `{ reminder_at: "<ISO +7 days>" }` JSON in `contact.notes`
- `reminderActive=false`: clears by setting `notes: null`
- Returns `{ success: true, data: { id, reminderAt } }`

**EmailDraft.tsx cleanup**

- No `console.log` or `console.warn` found — file was already clean

**Vitest tests (13 total, all passing)**

- `tests/api/regenerate-route.test.ts`: 6 tests (401, 404-not-found, 404-wrong-owner, 200-success, prisma.update called, tone derivation)
- `tests/api/reminder-route.test.ts`: 7 tests (401, 400-missing-field, 400-wrong-type, 404-not-found, 404-wrong-owner, 200-set, 200-clear)

## Deviations from Plan

None - plan executed exactly as written. Task 1 was pre-completed; Task 2 was the active scope for this execution.

## Known Stubs

None. The reminder endpoint uses `contact.notes` for JSON storage as documented in DASH-05 (basic scaffolded persistence, full implementation deferred to V3). This is intentional — the data persists correctly; V3 will add a dedicated `reminder_at` column and automated follow-up drafting.

## Self-Check

- [x] `app/api/drafts/[id]/regenerate/route.ts` exists and exports POST
- [x] `app/api/contacts/[id]/reminder/route.ts` exists and exports PATCH
- [x] `tests/api/regenerate-route.test.ts` has describe block
- [x] `tests/api/reminder-route.test.ts` has describe block
- [x] `shared/types/agents.ts` contains `id: string` in contacts and drafts
- [x] `lib/api/pipeline-response.ts` contains `id: c.id` and `id: o.id`
- [x] No console.log/warn in EmailDraft.tsx
- [x] TypeScript errors in new files: none (pre-existing errors in worker/ are out of scope)
- [x] 13 vitest tests pass

## Self-Check: PASSED
