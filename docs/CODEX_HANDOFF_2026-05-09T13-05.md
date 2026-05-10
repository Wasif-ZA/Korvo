# Codex Handoff to Claude Code: Korvo Walkthrough Recovery

Generated: 2026-05-09T13:05+10:00  
Surface: codex  
Scope: review plus handoff only, no product-code edits

## Ask

Wasif asked Codex to go through Korvo, understand the docs, see what can be done to make the application functional, and write a handoff doc for Claude Code to review.

## Codex Verdict

Korvo should not be treated as active product development. The vault and repo docs agree that Korvo is a portfolio walkthrough piece only. The right recovery target is therefore:

1. `npm run demo` gives a clean zero-key reviewer walkthrough.
2. `npm run type-check`, `npm run lint`, and `npm run test` are clean enough not to embarrass during handoff.
3. Production-only paths remain documented debt unless Wasif explicitly reactivates Korvo.

Do not start v2 feature work, stack changes, schema/RLS changes, or agent prompt changes in this pass.

## Docs Read

- `CLAUDE.md`
- `README.md`
- `docs/SETUP.md`
- `STATUS.md`
- `TODOS.md`
- `GEMINI_FRONTEND.md`
- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/SPEC.md`
- `.planning/STATE.md`
- `.planning/DECISIONS.md`
- `.planning/PROGRESS.md`
- `.planning/AGENTS.md`
- `.planning/research/SUMMARY.md`
- `.planning/phases/09-api-response-deploy-fixes/09-01-SUMMARY.md`

I also listed `.planning-v1/` and confirmed it is archival, large, and mostly superseded by current docs plus `STATUS.md` and `TODOS.md`. Use it only if a missing component needs resurrection context.

## Current Dirty State

`git status` initially failed due dubious ownership. Running with a local safe-directory override showed existing dirty state. Do not revert it blindly.

Notable current changes before this handoff:

- Deleted `.agents/skills/supabase-postgres-best-practices/**`
- Modified `CLAUDE.md`
- Deleted `app/(app)/page.tsx`
- Deleted `app/(auth)/auth/callback/route.ts`
- Deleted `app/(marketing)/page.tsx`
- Modified `eslint.config.mjs`
- Modified `instrumentation.ts`
- Untracked `STATUS.md`
- Untracked `TODOS.md`

This handoff adds only:

- `docs/CODEX_HANDOFF_2026-05-09T13-05.md`

## Health Check Results

Ran from repo root on 2026-05-09T13:05+10:00.

### `npm run type-check`

Failed. Main clusters:

- Stale `.next/types/validator.ts` references deleted routes:
  - `app/pricing/page.js`
  - `app/privacy/page.js`
  - `app/settings/page.js`
  - `app/terms/page.js`
  - `app/api/contacts/[id]/route.js`
  - `app/api/contacts/route.js`
  - `app/api/drafts/[id]/route.js`
- Missing old app components:
  - `components/app/SlideOver`
  - `components/app/ResearchCard`
  - `components/app/SkeletonCard`
- Type drift:
  - `components/app/PipelineBoard.tsx`: passes `isOverlay` to `PipelineCard`, but prop does not exist
  - `components/pricing/PricingCard.tsx`: uses `variant="secondary"`, but `Button` has no `secondary` variant
  - `lib/db/prisma.ts`: `datasourceUrl` is not valid in current Prisma client options
  - `worker/agents/contact-finder.ts`: Anthropic `Tool` type does not accept `max_uses`
  - `worker/lib/firecrawl.ts`: Firecrawl import/type issues
  - `worker/orchestrator/pipeline.ts`: `ScoringSignals` not assignable to Prisma JSON input

### `npm run lint`

Failed with 56 problems: 7 errors and 49 warnings.

Hard errors:

- `app/not-found.tsx`: JSX text comment rule
- `components/marketing/Badge.tsx`: JSX text comment rule
- `components/app/UserMenu.tsx`: 2 explicit `any`
- `components/auth/AuthForm.tsx`: 2 explicit `any`
- `worker/agents/contact-finder.ts`: explicit `any`

Warnings are mostly unused vars, hook deps, and mock underscore args.

### `npm run test`

Failed with 11 tests failing, 302 passing, 313 total.

Failure clusters:

- `tests/auth/auth-guard.test.ts`: expected redirect `/`, current code redirects `/login`
- `tests/api/search-route.test.ts`: test says guest path should not enqueue, current code does enqueue
- `tests/ui/button.test.tsx`: asserts old literal Tailwind classes, current UI uses semantic classes
- `tests/ui/email-preview.test.tsx`: asserts old marketing copy
- `tests/queue/worker.test.ts`: worker imports time out or mocks do not intercept BullMQ creation

These match `STATUS.md` and `TODOS.md`, except typecheck now also shows stale `.next/types` references.

## Product Reality

Docs conflict in age, but the current operating truth is clear:

- Vault `05 Meta/claude-context.md`: Korvo is frozen as portfolio piece only.
- Repo `STATUS.md` and `TODOS.md`: active scope is maintenance plus walkthrough-readiness.
- `.planning/PROGRESS.md`: v2 triage exists, but is deferred by the gate decision.
- `README.md`: intended reviewer path is zero-key demo via `npm run demo`.

So Claude Code should optimize for demo reliability, not production completeness.

## Recommended Claude Code Plan

### Pass 1: Make the health checks truthful

1. Decide whether stale `.next` should be removed before typecheck or whether `tsconfig.json` should stop including generated `.next/types` during direct `tsc --noEmit`.
2. Fix the missing-component type errors by deleting/de-scoping dead app routes or restoring minimal components from `.planning-v1/` only if still reachable.
3. Align `Button` variant API and tests. Prefer adding a `secondary` variant only if current UI actually uses it intentionally.
4. Fix the two JSX comment lint errors, then handle explicit `any` errors.
5. Update tests to match settled behavior:
   - unauthenticated protected routes redirect to `/login`
   - guest searches enqueue because DEC-008 says guest searches use BullMQ
   - button tests assert semantic classes or behavior, not old colors
   - email preview test asserts current copy
6. Mock BullMQ cleanly in `tests/queue/worker.test.ts`, or isolate worker creation behind a factory to avoid import-time connection behavior.

### Pass 2: Verify demo walkthrough path

Use `npm run demo`, then manually verify:

1. Landing chat loads at `/`.
2. Example prompts work for Linear, Canva, Atlassian.
3. Search returns 3 contacts after the simulated poll.
4. `Draft_Email` opens the draft.
5. Copy works.
6. Gmail send in demo does not leave the machine and gives a harmless success state.
7. Pipeline, Settings, and Pricing views do not crash.

If demo works but production paths fail, document that explicitly. Portfolio mode allows that.

### Pass 3: Defer production-only repairs

Do not spend this pass on:

- real Supabase setup
- real Stripe checkout
- real Gmail OAuth
- Firecrawl integration
- prompt upgrades
- `getUser()` to `getClaims()` migration
- new v2 features
- schema/RLS changes

Those are either blocked by external setup, deferred, or outside portfolio mode.

## Specific Files to Inspect First

- `app/page.tsx`: demo/chat orchestration and polling
- `app/api/search/route.ts`: demo short-circuit and guest enqueue behavior
- `app/api/search/[id]/route.ts`: demo result response
- `lib/demo/pipeline-response.ts`: seed response mapper
- `lib/demo/seed.ts`: seeded searches, contacts, drafts
- `components/chat/ContactCard.tsx`: reminder button currently calls real API even in demo
- `components/chat/EmailDraft.tsx`: Gmail status/send behavior in demo
- `components/chat/Sidebar.tsx`: demo history and view switching
- `proxy.ts`: redirect behavior, tests currently disagree with it
- `components/ui/Button.tsx`: variant contract
- `tests/queue/worker.test.ts`: likely import-time side effect problem

## Likely Quick Wins

- Clear stale generated `.next` artifacts before diagnosing missing route validator errors.
- Update `tests/auth/auth-guard.test.ts` from `/` to `/login`, matching current `proxy.ts`.
- Update `tests/api/search-route.test.ts` to expect guest enqueue, matching DEC-008 and current code.
- Update button tests to current semantic class names.
- Fix JSX comment lint errors in under 5 minutes.
- Add ESLint ignore patterns for underscore args only if the team accepts that convention, otherwise rename mock args.

## Risk Notes

- There is an architectural split between page-based app components and chat components. Do not fix type errors by resurrecting the whole old page app unless walkthrough needs it.
- `GEMINI_FRONTEND.md` is stale in places: it mentions `src/app`, `pnpm`, and frontend ownership that does not match the current repo layout/package manager.
- `README.md` says demo mode covers reviewer UX, but health checks currently fail. That mismatch is the main reputational risk.
- `ContactCard` reminder actions call `/api/contacts/[id]/reminder`; demo users may click this during a walkthrough. Either make it demo-safe or hide it in demo.
- `EmailDraft` uses SWR to call `/api/gmail/status` for Pro users. Demo route is safe, but the send route should also be verified before saying Gmail send is demo-safe.

## Definition of Done for Claude Code

- `npm run type-check` passes, or documented remaining failures are production-only and unreachable in demo.
- `npm run lint` has no errors.
- `npm run test` passes, or only explicitly deferred production integration tests fail.
- `npm run demo` starts.
- Reviewer can complete the seeded Linear or Canva flow without env keys.
- `STATUS.md` and `TODOS.md` are updated if Claude Code changes the truth.
- Activity log is appended via the locked helper.
