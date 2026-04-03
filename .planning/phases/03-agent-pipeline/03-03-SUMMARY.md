---
phase: 03-agent-pipeline
plan: 03
subsystem: ai
tags: [scoring, pure-function, tdd, vitest, typescript, tone-mapping]

# Dependency graph
requires:
  - phase: 03-agent-pipeline
    provides: shared/types/agents.ts type contracts (ScoringSignals, ScoreResult, ContactResult, CompanyEnrichmentData)
provides:
  - scoreContact pure function: sums 5 signals, clamps 0-100, maps tone (direct/curious/value_driven)
  - scoreTitleMatch: keyword overlap scoring with stop-word filtering
  - scoreSeniority: title seniority tier mapping (VP=5, manager=12, junior=10, mid=15, senior IC=20)
  - extractSignals: composes all 5 ScoringSignals from ContactResult + CompanyEnrichmentData
  - 28-test suite covering all boundary conditions and edge cases
affects:
  [03-04, 03-05, 03-06, 03-07, 03-08, email-drafter, pipeline-orchestrator]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure function scoring: all 4 exports are stateless, deterministic, no side effects"
    - "TDD red-green cycle: failing tests committed before implementation"
    - "Stop-word filtering for keyword matching: removes of/the/and/at/etc before comparison"
    - "Seniority regex matching with VP/C-suite early return before senior IC check"

key-files:
  created:
    - worker/scoring/scoring-engine.ts
    - tests/scoring/scoring-engine.test.ts
    - shared/types/agents.ts
  modified: []

key-decisions:
  - "scoreTitleMatch uses 4-tier overlap: 0%=0, 25%=10, 50%=20, 75%=25, 100%=30 — discrete tiers chosen for predictability over continuous scoring"
  - "hiringSignalScore uses keyword overlap (not exact match) so 'Software Engineer' matches 'Senior Software Engineer' in hiringRoles"
  - "Tone boundary: 75+ direct, 45-74 curious, 0-44 value_driven — matches D-10 spec exactly"
  - "shared/types/agents.ts created as deviation (plan 03-01 dependency not yet executed in this worktree)"

patterns-established:
  - "Scoring engine pattern: extractSignals composes raw signals, scoreContact computes total — two-step pipeline"
  - "Tone mapping: always call mapTone(total) after clamping, never before"

requirements-completed: [SCORE-01, SCORE-02, SCORE-03, SCORE-04]

# Metrics
duration: 10min
completed: 2026-04-03
---

# Phase 03 Plan 03: Scoring Engine Summary

**Pure TypeScript scoring engine with 28-test TDD suite: 5-signal weighted scoring, tone mapping (direct/curious/value_driven), and keyword-based title/seniority analysis**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-03T13:35:19Z
- **Completed:** 2026-04-03T13:45:33Z
- **Tasks:** 2 (RED + GREEN, no refactor needed)
- **Files modified:** 3

## Accomplishments

- Built `scoreContact` pure function: sums 5 weighted signals, clamps to [0,100], maps tone per D-10
- Built `scoreTitleMatch`: extracts keywords (stop-word filtered), computes overlap ratio, returns 0/10/20/25/30 tier score
- Built `scoreSeniority`: regex-based title classification across 5 tiers (VP=5 through senior IC=20)
- Built `extractSignals`: composes all 5 signals from `ContactResult` + `CompanyEnrichmentData | null`
- 28 tests covering all behavior cases, boundary conditions (score=75, score=45, clamp at 100/0), and edge cases

## Task Commits

Each task was committed atomically:

1. **RED: Failing tests** - `ff52a52` (test) — 25 test cases + shared/types/agents.ts
2. **GREEN: Implementation** - `d70da16` (feat) — scoring-engine.ts, all 28 tests passing

_Note: TDD tasks have two commits (test → feat). No refactor commit needed — code was clean after lint/format._

## Files Created/Modified

- `worker/scoring/scoring-engine.ts` — scoring engine: scoreContact, extractSignals, scoreTitleMatch, scoreSeniority
- `tests/scoring/scoring-engine.test.ts` — 28 test cases across 4 describe blocks
- `shared/types/agents.ts` — type contracts for all agent I/O (deviation: plan 03-01 dependency)

## Decisions Made

- `scoreTitleMatch` uses discrete overlap tiers (0/10/20/25/30) not continuous scoring — predictable, debuggable, easier to tune
- `hiringSignalScore` uses keyword overlap (not exact match) so partial role names match (e.g. "Software Engineer" matches "Senior Software Engineer" in hiringRoles)
- VP/C-suite regex check runs before senior IC regex check to prevent VP being classified as senior (both contain "senior" sometimes)
- `shared/types/agents.ts` created as deviation since plan 03-01 (which creates it) had not yet been executed in this worktree

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created shared/types/agents.ts (plan 03-01 dependency)**

- **Found during:** RED phase (test file creation)
- **Issue:** `shared/types/agents.ts` is specified as created by plan 03-01, but plan 03-01 had not been executed in this worktree. Tests import from this file.
- **Fix:** Created `shared/types/agents.ts` with all type contracts from the plan specification (ContactResult, EmailGuess, ResearchCard, DraftResult, ScoringSignals, ScoreResult, Tone, TemplateType, CompanyEnrichmentData, PipelineResponse). Used main repo's existing version as reference.
- **Files modified:** shared/types/agents.ts
- **Verification:** Tests import and compile successfully
- **Committed in:** ff52a52 (RED phase commit)

---

**Total deviations:** 1 auto-fixed (1 blocking dependency)
**Impact on plan:** Required to unblock test compilation. No scope creep — file matches plan 03-01 spec exactly.

## Issues Encountered

- First commit attempt used wrong scope (`03-03`) — commitlint requires scopes from enum list. Fixed to use `ai` scope.
- Files were initially created in wrong directory (main repo instead of worktree). Corrected by creating files in `/worktrees/agent-a8ed9693/`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Scoring engine is ready for consumption by pipeline orchestrator (plan 03-06/03-07)
- `extractSignals` + `scoreContact` can be called directly from the pipeline worker after contact discovery
- Tone output drives email drafter template selection (plan 03-05/03-08)
- No blockers

## Self-Check: PASSED

- worker/scoring/scoring-engine.ts: FOUND
- tests/scoring/scoring-engine.test.ts: FOUND
- shared/types/agents.ts: FOUND
- .planning/phases/03-agent-pipeline/03-03-SUMMARY.md: FOUND
- Commit ff52a52 (RED phase): FOUND
- Commit d70da16 (GREEN phase): FOUND

---

_Phase: 03-agent-pipeline_
_Completed: 2026-04-03_
