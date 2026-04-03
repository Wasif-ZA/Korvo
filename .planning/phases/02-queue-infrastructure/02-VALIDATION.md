---
phase: 2
slug: queue-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | ORCH-01 | integration | `npx vitest run tests/worker` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | ORCH-02 | unit | `npx vitest run tests/worker` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | ORCH-03 | unit | `npx vitest run tests/worker` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | ORCH-04 | integration | `npx vitest run tests/worker` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | ORCH-05 | unit | `npx vitest run tests/worker` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | ORCH-06 | unit | `npx vitest run tests/worker` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/worker/` — test directory for worker tests
- [ ] `tests/worker/pipeline.test.ts` — stubs for ORCH-01, ORCH-05
- [ ] `tests/worker/redis.test.ts` — stubs for ORCH-03, ORCH-06
- [ ] `tests/worker/rate-limit.test.ts` — stubs for ORCH-04

*Existing vitest infrastructure covers framework requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Worker runs on Railway (not Vercel) | ORCH-02 | Requires deployed Railway service | Deploy worker to Railway, submit job via API, verify worker log shows processing |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
