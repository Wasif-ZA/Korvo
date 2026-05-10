# Codex Changes: Korvo Production Readiness Slice

Generated: 2026-05-09T13:32+10:00  
Surface: codex  
Scope: bounded production-readiness fixes, no v2 feature work

## Summary

Codex fixed the highest-signal issues that could be safely handled in a short pass:

- TypeScript now passes.
- Vitest now passes all suites.
- Next production build now completes.
- ESLint has zero errors, with warnings still left as lower-priority cleanup.

This does not unfreeze Korvo as a product. The work keeps the project in portfolio/walkthrough mode while making the codebase less brittle.

## Changes Made

### Restored missing app UI primitives

Added:

- `components/app/SlideOver.tsx`
- `components/app/ResearchCard.tsx`
- `components/app/SkeletonCard.tsx`

Reason: authenticated dashboard/search routes imported these components but the files were missing, breaking typecheck and production build.

### Fixed component/type drift

Changed:

- `components/ui/Button.tsx`: added a `secondary` variant expected by pricing and tests.
- `components/app/PipelineCard.tsx`: accepted `isOverlay` prop used by drag overlay rendering.
- `components/app/UserMenu.tsx`: replaced `any` profile/user state with typed shapes.
- `components/auth/AuthForm.tsx`: replaced `catch (error: any)` with `unknown` plus safe message extraction.

### Fixed integration type drift

Changed:

- `lib/db/prisma.ts`: removed invalid Prisma client option usage so Prisma 7 client construction typechecks.
- `worker/agents/contact-finder.ts`: kept Claude web-search server tool while casting through `unknown` because the SDK `Tool` type only exposes custom tools.
- `worker/lib/firecrawl.ts`: added safer circuit-breaker wrapper and Prisma JSON casts.
- `worker/orchestrator/pipeline.ts`: cast scoring breakdown through `unknown` before Prisma JSON input.
- `types/firecrawl.d.ts`: added a local declaration for `@mendable/firecrawl-js` so typecheck does not depend on missing package-local types.

### Fixed lint errors

Changed:

- `app/not-found.tsx`
- `components/marketing/Badge.tsx`

Reason: JSX text containing `//` tripped `react/jsx-no-comment-textnodes`.

### Fixed tests that contradicted current behavior

Changed:

- `tests/auth/auth-guard.test.ts`: protected routes now expect `/login`, matching current `proxy.ts`.
- `tests/api/search-route.test.ts`: guest search now expects a BullMQ enqueue, matching DEC-008/current API behavior.
- `tests/ui/button.test.tsx`: asserts semantic classes (`bg-accent`, `bg-error`, `bg-surface-alt`) instead of stale literal color classes.
- `tests/ui/email-preview.test.tsx`: asserts current marketing labels.
- `tests/queue/worker.test.ts`: mocks Redis/Gmail/OAuth/Prisma dependencies so worker import tests do not hang or reach real services.

### Fixed production build failure

Changed:

- `app/(app)/dashboard/page.tsx`

Reason: Next.js production prerender failed because `useSearchParams()` was used without a Suspense boundary. The page now wraps its client content in `Suspense`.

### Reduced Redis import-time noise

Changed:

- `lib/queue/redis.ts`
- `lib/gmail/redis-client.ts`
- `worker/lib/redis.ts`

Reason: local production build imports route modules without Redis running. Connections now have guarded error handlers instead of unhandled ioredis error events.

## Verification

Commands run from repo root:

- `npm run type-check`: pass
- `npm run lint`: pass with 45 warnings, 0 errors
- `npm run test`: pass, 34 files, 313 tests
- `npm run build`: pass

## Remaining Warnings / Follow-Up

- ESLint still reports 45 warnings, mostly unused variables and hook dependency warnings.
- `npm run build` still warns that `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is optional but missing in local env.
- Sentry requests `onRouterTransitionStart` export from `instrumentation-client.ts`.
- Local build still logs Redis unavailable warnings because Redis is not running at `127.0.0.1:6379`. This is now handled and non-fatal, but a cleaner production pattern would lazy-create Redis clients only inside runtime paths.

## Not Done

- No schema or RLS edits.
- No prompt changes.
- No OAuth setup.
- No Stripe setup.
- No v2 feature work.
