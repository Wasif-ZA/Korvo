# TODOs

Prioritized work queue for Korvo. Order is by health-audit impact then by gating effect on subsequent tasks.

## Gate decision: SETTLED

**Decision: A (portfolio walkthrough only)**, per `../../05 Meta/claude-context.md` line 45 (settled 2026-04-23, propagated here 2026-04-26): _"Frozen as portfolio piece only ... Do not polish further unless warm lead asks for a walkthrough."_

The 2026-04-25 demo-mode commits are anticipatory polish ahead of Hudl / ACU / Atlassian outcomes. v2 reset Phase 0 triage and Phases 1-5 are **out of scope** until further notice (see "v2 reset Phase 0 triage" and "v2 build" sections below; kept for reference, not for action).

Active scope is **maintenance + walkthrough-readiness only**: T1 done, T2 (failing tests) and T3 (TS errors) recommended only because the broken state could embarrass during a walkthrough. T4 (knip) is deferred since dead-code detection isn't load-bearing for portfolio mode.

## Health-audit remediations (in priority order)

### T1. ESLint config: ignore generated + vendor dirs (DONE 2026-04-26)

**Impact**: 1236 problems → 57 (95% reduction). Lint runs 7s instead of 68s.

- [x] Added `'generated/**'`, `'.claude/**'`, `'.github/**'` to `globalIgnores` in `eslint.config.mjs`.
- [x] Re-ran `npm run lint`. Result: 7 errors + 50 warnings remaining.
  - 5 explicit-any in `worker/agents/*` (real, low priority for portfolio mode).
  - 2 react/jsx-no-comment-textnodes (real, low priority).
  - 50 underscore-prefix unused-vars warnings, almost all in `lib/demo/mocks.ts` (configurable away with `argsIgnorePattern: '^_'` if you want a cleaner pass).

### T2. Fix the 11 failing vitest cases

**Impact**: Tests score 7/10 → 10/10. ~1-2 hours.

- [ ] `tests/auth/auth-guard.test.ts` (4 cases): redirect target moved from `/` to `/login`. Decide canonical target, update either tests or `proxy.ts`.
- [ ] `tests/ui/button.test.tsx` (3 cases): assert against semantic Tailwind class (`bg-accent`, `bg-error`), not hardcoded `bg-teal-600` / `bg-red-600`.
- [ ] `tests/queue/worker.test.ts` (3 cases): mock BullMQ Redis connection so the gmail-send-worker imports don't time out at 5 s.
- [ ] `tests/ui/email-preview.test.tsx`: update test to query for new "PIPELINE_OUTPUT" copy (the demo-mode rewrite changed the prose).
- [ ] `tests/api/search-route.test.ts`: pipeline mock called when test expected it not to be; align test with current Phase 2 logic.

### T3. Resolve 36 TypeScript errors

**Impact**: Typecheck score 4/10 → 10/10. ~1-3 hours, depending on whether we restore or delete.

- [ ] Decide whether `app/page.tsx` chat-style landing is canonical. If yes, restore the missing `@/components/chat/*` modules (`ChatLayout`, `ChatWindow`, `ChatInput`, `HeroPrompt`, `ThinkingIndicator`, `SystemMessage`, `AuthGate`, `PipelineView`, `SettingsView`, `PricingView`). If no, delete `app/page.tsx` chat content and replace with the demo-mode landing.
- [ ] Restore or delete `@/components/app/SlideOver`, `ResearchCard`, `SkeletonCard`, `PipelineColumn` referenced from `app/(app)/dashboard/page.tsx`, `app/(app)/page.tsx`, `app/(app)/search/[id]/page.tsx`, `components/app/ContactCard.tsx`, `components/app/PipelineBoard.tsx`.
- [ ] Fix `instrumentation.ts:10` `@sentry/nextjs` no longer exports `onRequestError`. Sentry SDK upgrade landed silently; either pin the old version or migrate to the new API.
- [ ] Fix `lib/db/prisma.ts:13` `datasourceUrl` not in PrismaClient options type. Prisma type drift; check installed version vs used API.
- [ ] Fix `worker/agents/contact-finder.ts:114` `max_uses` not in Anthropic SDK `Tool` type. SDK API drift; check the changelog.
- [ ] Fix `worker/lib/firecrawl.ts` references to `@mendable/firecrawl-js` not installed; either install or remove.
- [ ] Fix `components/pricing/PricingCard.tsx:69` and `tests/ui/button.test.tsx:33`: `'secondary'` is not in the Button variant union. Either add it or rename the call site.
- [ ] Fix `worker/orchestrator/pipeline.ts:99` `ScoringSignals` doesn't satisfy Prisma's `InputJsonObject` index signature; cast or restructure.

### T4. Wire `knip` for dead-code detection

**Impact**: Adds the 5th category to `/gstack-health` (currently SKIPPED with weight redistribution).

- [ ] `npm i -D knip`
- [ ] Add `knip.json` with appropriate entry points for Next.js + worker.
- [ ] Re-run `/gstack-health` to confirm the score updates.

## v2 reset Phase 0 triage (DEFERRED, gate decision = A)

Carried from `.planning/PROGRESS.md` for reference. Out of scope under portfolio-only mode. If gate decision changes, re-promote.

- Fix TypeScript error in `lib/gmail/send-quota.ts` (`RedisLike.decr`).
- Clean orphaned files: `db_output.log`, `output.log`, `test-failures.log`, `query_db.ts`, `.git_workflow.py`.
- Resolve duplicate components (app/ vs chat/).
- Decide UI pattern: chat UI vs pages vs hybrid.
- Verify all API routes are callable.

## v2 build (DEFERRED, gate decision = A)

Phases from `.planning/PROGRESS.md`. Out of scope. If portfolio mode ends, re-promote.

- Phase 1: Contact Discovery (Contact Finder agent + LinkedIn blocklist + prompt caching)
- Phase 2: Email Guessing (pattern detection + ConfidenceBadge UI)
- Phase 3: Research & Drafting (Research Agent + Drafter on the validated 5-sentence template)
- Phase 4: Pipeline Wiring (BullMQ DAG)
- Phase 5: Auth & Guest Access (guest first search free + Google OAuth + 5 searches/month rate limit)

## Maintenance debt (in scope under portfolio mode)

- [x] Reconcile claude-context.md status: already correct at line 45 (settled 2026-04-23).
- [ ] Update `.planning/STATE.md` `last_updated` field; currently still `2026-04-05T04:34:43.494Z`. (Cosmetic; do during the next walkthrough prep pass.)
- [ ] Audit `lib/demo/mocks.ts` underscore-prefixed unused vars: configure ESLint `argsIgnorePattern: '^_'` (would drop ~50 of the remaining 50 warnings, leaving lint near-clean). 5-min fix when convenient.
