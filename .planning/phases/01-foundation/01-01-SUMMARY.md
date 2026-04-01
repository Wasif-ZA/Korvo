---
phase: 01-foundation
plan: 01
subsystem: ui
tags: [nextjs, tailwindcss, typescript, vitest, react, cva, tailwind-merge, supabase, stripe]

# Dependency graph
requires: []
provides:
  - Next.js 16.2.2 project with App Router, TailwindCSS 4, TypeScript strict mode
  - All Phase 1 npm dependencies installed (prisma, @supabase/ssr, stripe, zod, cva, clsx, tailwind-merge, lucide-react, react-hot-toast)
  - 4 base UI components (Button, Input, Card, Modal) matching UI-SPEC
  - cn() utility with clsx + tailwind-merge
  - Vitest configured with v8 coverage, 11 tests passing
  - proxy.ts stub at project root (auth guard added in Plan 03)
  - .env.local.example documenting all required env vars
  - shared/ and worker/ directories per D-17
affects:
  - 01-02 (database schema — needs project structure)
  - 01-03 (auth — needs proxy.ts stub and @supabase/ssr installed)
  - 01-04 (landing page — uses Button, Input, Card, Modal components)
  - 01-05 (payments — uses Button, Card and stripe installed)
  - 01-06 (settings page — uses Button, Card, Modal components)

# Tech tracking
tech-stack:
  added:
    - next@16.2.2
    - react@19.2.4
    - tailwindcss@4.x
    - typescript@5.x
    - prisma@7.6.0
    - "@supabase/ssr@0.10.0"
    - "@supabase/supabase-js@2.101.1"
    - stripe@21.0.1
    - zod@4.3.6
    - class-variance-authority@0.7.1
    - clsx@2.1.1
    - tailwind-merge@3.5.0
    - lucide-react@1.7.0
    - react-hot-toast@2.6.0
    - vitest@4.x
    - "@vitest/coverage-v8@4.x"
    - "@testing-library/react@16.x"
    - "@testing-library/jest-dom@6.x"
    - jsdom@29.x
  patterns:
    - cn() utility pattern (clsx + tailwind-merge) for Tailwind class composition
    - CVA (class-variance-authority) for component variant management
    - Named exports from components/ui/* (not default exports)
    - proxy.ts at project root (not middleware.ts) per Next.js 16 pattern

key-files:
  created:
    - package.json
    - tsconfig.json
    - app/layout.tsx
    - app/page.tsx
    - app/globals.css
    - proxy.ts
    - ".env.local.example"
    - lib/utils/cn.ts
    - components/ui/Button.tsx
    - components/ui/Input.tsx
    - components/ui/Card.tsx
    - components/ui/Modal.tsx
    - vitest.config.ts
    - tests/setup.ts
    - tests/utils/cn.test.ts
    - tests/ui/button.test.tsx
    - shared/.gitkeep
    - worker/.gitkeep
  modified:
    - .gitignore

key-decisions:
  - "Used proxy.ts (not middleware.ts) per Next.js 16 pattern documented in RESEARCH.md"
  - "TailwindCSS 4 CSS-native config via @theme directive — no tailwind.config.js required"
  - "Vitest v4 node environment for utils, jsdom per-file for component tests"
  - "Modal dismissable prop defaults to false per D-03 (guest modal must not be dismissable)"
  - "Geist font loaded with weights 400 and 600 only — matches UI-SPEC 2-weight palette"

patterns-established:
  - "cn() utility: always use cn() for class composition — never string concatenation"
  - "CVA variants: define with cva(), export interface extending VariantProps"
  - "Component exports: named exports only (export function X, not export default)"
  - "Test mocks: centralized in tests/setup.ts, per-file env override with @vitest-environment"

requirements-completed: [FOUND-01]

# Metrics
duration: 10min
completed: 2026-04-01
---

# Phase 01 Plan 01: Scaffold + Design System Summary

**Next.js 16.2.2 + TailwindCSS 4 scaffold with 4 CVA-based UI components (Button/Input/Card/Modal), cn() utility, and Vitest running 11 passing tests**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-01T12:21:07Z
- **Completed:** 2026-04-01T12:31:39Z
- **Tasks:** 3
- **Files modified:** 19 files created, 1 modified

## Accomplishments
- Scaffolded Next.js 16.2.2 with all Phase 1 deps (prisma, @supabase/ssr, stripe, zod, cva) in a single npm install
- Created 4 base UI components (Button with 4 variants + isLoading spinner, Input with error state, Card with highlighted prop, Modal with mobile bottom sheet pattern) matching UI-SPEC exactly
- Vitest configured with v8 coverage, 11 tests passing (5 cn() utility tests + 6 Button smoke tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 16 project** - `11eda37` (feat)
2. **Task 2: Design system base components + cn() utility** - `5791529` (feat)
3. **Task 3: Vitest config + test utilities + smoke tests** - `b23c6dd` (feat)

## Files Created/Modified
- `package.json` - Project manifest with all Phase 1 deps, test scripts
- `app/globals.css` - TailwindCSS 4 @theme with custom tokens (--color-warm-white: #FAFAF8, --color-warm-muted: #F4F3F0, --color-border: #E5E4E0, --color-text-primary: #1C1C1A)
- `app/layout.tsx` - Geist font (400/600), Toaster, Korvo metadata
- `app/page.tsx` - Minimal placeholder (will be replaced in Plan 04)
- `proxy.ts` - Auth pass-through stub (auth guard added in Plan 03)
- `.env.local.example` - All required env vars documented
- `lib/utils/cn.ts` - clsx + tailwind-merge composition utility
- `components/ui/Button.tsx` - CVA variants: primary/secondary/ghost/destructive, isLoading spinner, 44px touch targets
- `components/ui/Input.tsx` - 44px default / 52px hero, error state with red-600, disabled state
- `components/ui/Card.tsx` - rounded-xl, highlighted prop for Pro pricing card
- `components/ui/Modal.tsx` - bg-black/40 backdrop, dismissable=false default, mobile bottom sheet
- `vitest.config.ts` - v8 coverage, node env, @ alias
- `tests/setup.ts` - Supabase SSR and Stripe mock stubs
- `tests/utils/cn.test.ts` - 5 cn() utility tests
- `tests/ui/button.test.tsx` - 6 Button smoke tests
- `shared/.gitkeep` / `worker/.gitkeep` - Single-repo structure per D-17
- `.gitignore` - Excludes .next/, node_modules/, .env*.local, next-env.d.ts

## Decisions Made
- Used `proxy.ts` (not `middleware.ts`) per Next.js 16 pattern — this is a critical Next.js 16 distinction per RESEARCH.md pitfall documentation
- Vitest 4 uses `node` environment globally, `@vitest-environment jsdom` per-file for React component tests (avoids jsdom overhead on non-component tests)
- `Modal.tsx` ships as a client component (`"use client"`) since it uses `useEffect` for body scroll lock — server components cannot use browser APIs

## Deviations from Plan

None - plan executed exactly as written. The create-next-app scaffolding required manual file copying to avoid "directory not empty" error (existing .planning/ directory), but this produced identical output.

## Issues Encountered
- `npx create-next-app@latest .` failed because the worktree directory contained `.planning/` and `CLAUDE.md`. Resolution: scaffolded into `/tmp/korvo-scaffold` and copied files to worktree. No impact on output quality.

## User Setup Required
None - no external service configuration required for this plan. Supabase, Stripe, and other services are scaffolded but configured in Plan 02-03.

## Known Stubs
- `app/page.tsx`: Minimal placeholder returning `<h1>Korvo</h1>`. This is intentional — the landing page is built in Plan 04. Not a missing feature for Plan 01's goal.
- `proxy.ts`: Pass-through function with no auth logic. Intentional — auth guard added in Plan 03.

## Next Phase Readiness
- Plan 02 (Prisma schema + RLS): Project structure ready, Prisma installed, DATABASE_URL documented in .env.local.example
- Plan 03 (Auth + guest flow): @supabase/ssr installed, proxy.ts stub in place, Supabase env vars documented
- Plans 04-06 (Landing/Pricing/Settings UI): All 4 base UI components ready for composition

## Self-Check: PASSED

All created files confirmed present:
- lib/utils/cn.ts: FOUND
- components/ui/Button.tsx: FOUND
- components/ui/Input.tsx: FOUND
- components/ui/Card.tsx: FOUND
- components/ui/Modal.tsx: FOUND
- vitest.config.ts: FOUND
- tests/setup.ts: FOUND
- tests/utils/cn.test.ts: FOUND
- tests/ui/button.test.tsx: FOUND
- proxy.ts: FOUND
- .env.local.example: FOUND

All task commits confirmed present:
- 11eda37 (Task 1 - scaffold): FOUND
- 5791529 (Task 2 - components): FOUND
- b23c6dd (Task 3 - tests): FOUND

---
*Phase: 01-foundation*
*Completed: 2026-04-01*
