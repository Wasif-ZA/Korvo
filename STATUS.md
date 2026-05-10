# Korvo Status

Weekly status. Updated when state changes (not strictly Sundays, since Korvo isn't on a build-in-public cadence).

## 2026-04-26 (post-unfreeze health audit + ESLint config fix)

Korvo was frozen 2026-04-23 as a portfolio piece, then unfrozen 2026-04-25 with two commits landing demo-mode infrastructure (`1689915` 20:46 demo-mode, `19b12ed` 20:49 gitignore + worktree cleanup). Working tree now clean.

**Scope (already settled in `../../05 Meta/claude-context.md` line 45)**: Korvo is a portfolio piece. The 2026-04-25 demo-mode commits are consistent with the standing rule "do not polish further unless warm lead asks for a walkthrough", presumably anticipatory polish ahead of Hudl / ACU / Atlassian outcomes. Not back in active product development. v2 reset (Phases 0-5 in `.planning/PROGRESS.md`) is out of scope until further notice.

### Health audit (2026-04-26, composite 4.1 / 10, NEEDS WORK)

| Category   | Tool           | Score   | Status         | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------- | -------------- | ------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type check | `tsc --noEmit` | 4 / 10  | NEEDS WORK     | 36 errors, mostly TS2307 (`Cannot find module '@/components/chat/*' / '@/components/app/*'`) from the demo-mode landing-page rewrite. Components were renamed/deleted; imports were not updated.                                                                                                                                                                                                                                                                              |
| Lint       | `eslint .`     | 0 / 10  | CRITICAL       | **Pre-fix**: 590 errors + 646 warnings (1236 total). **Post-fix** (added `generated/**`, `.claude/**`, `.github/**` to globalIgnores): **57 total (7 errors, 50 warnings), 95% reduction**. Score still 0 by the rubric (>=20 warnings) but qualitatively dramatically better. Remaining: 5 explicit-any in `worker/agents/*`, 2 react/jsx-no-comment-textnodes, ~50 underscore-prefix unused-vars in `lib/demo/mocks.ts` (configurable away with `argsIgnorePattern: '^_'`). |
| Tests      | `vitest run`   | 7 / 10  | WARNING        | 302 / 313 passed (96.5%). 11 failures clustered in: auth-guard redirect target drift (`/login` vs `/`), button variant Tailwind class drift (`bg-accent` vs `bg-teal-600`), gmail-send worker mock timeouts, demo-card text drift (`PIPELINE_OUTPUT` terminal style vs prose).                                                                                                                                                                                                |
| Dead code  | `knip`         | SKIPPED | not configured | knip not in package.json.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Shell lint | `shellcheck`   | SKIPPED | not installed  | no `*.sh` files in src; only the activity-log helper sits in the vault.                                                                                                                                                                                                                                                                                                                                                                                                       |

Composite weights redistributed: typecheck 33.3%, lint 26.7%, test 40%. Score will only move once test or typecheck improves, since the lint rubric is warnings-driven and 50 warnings is still in the 0/10 tier even after the 95% reduction. Practical improvement is real even though the rubric doesn't reward it.

### Top remediations (priority order)

1. **DONE 2026-04-26**: Added `generated/**`, `.claude/**`, `.github/**` to `eslint.config.mjs` globalIgnores. Lint problems dropped 1236 → 57 (95% reduction). The rubric score didn't move (50 warnings still trips the >=20 threshold) but the actionable noise went from "drown the signal" to "tractable in 30 min".
2. **Fix the 11 failing tests.** They flag real drift between the demo-mode landing-page rewrite and the test suite:
   - `tests/auth/auth-guard.test.ts`: 4 cases. Redirect target moved from `/` to `/login`. Decide which is canonical, update the other.
   - `tests/ui/button.test.tsx`: 3 cases. Tailwind variant classes changed (`bg-teal-600` → `bg-accent`, `bg-red-600` → `bg-error`, `bg-[#F4F3F0]` → no class). Test the semantic class, not the literal color.
   - `tests/queue/worker.test.ts`: 3 cases. Gmail-send worker imports timeout (5s); BullMQ Redis is not mocked.
   - `tests/ui/email-preview.test.tsx`: 1 case. DemoCard renders new "PIPELINE_OUTPUT" terminal-style copy instead of old "Pipeline Output" prose.
   - `tests/api/search-route.test.ts`: 1 case. Pipeline mock called when not expected (Phase 2 logic changed).
3. **Resolve the 36 TypeScript errors.** Most are TS2307 missing-module errors against `@/components/chat/*` and `@/components/app/*`. Either restore the components, update the imports, or delete the dead pages.
4. **Scope decided 2026-04-26**: portfolio walkthrough only, per `../../05 Meta/claude-context.md` line 45 ("Frozen as portfolio piece only 2026-04-23; ... Do not polish further unless warm lead asks for a walkthrough"). The 2026-04-25 demo-mode commits are the anticipatory polish. v2 reset and Phase 0 triage are out of scope until further notice.

### Surprises worth flagging

- The `lib/demo/mocks.ts` file has many `_underscore` prefixed unused vars that ESLint catches. Common pattern in mocks; either configure `argsIgnorePattern: '^_'` in the ESLint TS rules or stop using the underscore convention here.
- `instrumentation.ts` imports `onRequestError` from `@sentry/nextjs` but the SDK no longer exports it. SDK upgrade landed silently.
- `lib/db/prisma.ts` uses `datasourceUrl` which is not in the Prisma client options type. Either Prisma was downgraded or the type is wrong.
- `worker/agents/contact-finder.ts` calls `Tool` with a `max_uses` property that does not exist on the type. Anthropic SDK API drift.

These are all symptoms of "the codebase moved while frozen, dependencies kept moving, then we unfroze." None are catastrophic; all are concrete fixes.

## 2026-04-25 (unfreeze)

- Commits `1689915` (20:46) and `19b12ed` (20:49) shipped demo-mode infra and gitignore/worktree cleanup.
- Working tree was 175 dirty files; cleaned to 4 by 13:37 next day via `korvo-gitignore-and-worktree-cleanup` claude-code session.

## 2026-04-23 (freeze)

- Marked frozen as portfolio piece. Active focus shifted to Conduit (vault `claude-context.md` Active focus #4, dated 2026-04-23).

## Pre-2026-04-23 history

- v1 milestone shipped 2026-04-04 / 2026-04-05 (9 phases complete; see `.planning/STATE.md`).
- v2 reset planning started after v1; Phase 0 (triage) listed in `.planning/PROGRESS.md`. Triage items partially overlap with the post-unfreeze TS errors (specifically: "Resolve duplicate components (app/ vs chat/)").

## Metrics to track (when active)

- GitHub stars (weekly delta)
- Pro tier signups (weekly delta)
- Searches per active user (weekly median)
- Email send completion rate (sent / drafted)
- Cold-email reply rate (the actual product metric)
- Cost per search in Anthropic spend
- Health audit composite score (track via `~/.gstack/projects/Wasif-ZA-Korvo/health-history.jsonl`)
