---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.x |
| **Config file** | vitest.config.ts (Wave 0 creates) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | FOUND-01 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | FOUND-03 | integration | `npx prisma db push --dry-run` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | FOUND-04 | integration | `npx vitest run src/__tests__/rls` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AUTH-01 | e2e | manual | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AUTH-02 | integration | `npx vitest run src/__tests__/auth` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | AUTH-05 | unit | `npx vitest run src/__tests__/limits` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | PAY-01 | integration | `npx vitest run src/__tests__/stripe` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | PAY-02 | integration | `npx vitest run src/__tests__/webhooks` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration with coverage
- [ ] `src/__tests__/` — test directory structure
- [ ] `vitest` + `@vitest/coverage-v8` — dev dependency installation

*Planner will fill exact task-to-test mappings after plans are created.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google OAuth redirect flow | AUTH-02 | Requires real browser + Google consent screen | 1. Click "Continue with Google" 2. Complete OAuth 3. Verify redirect back with session |
| Stripe Checkout completion | PAY-01 | Requires Stripe test mode browser flow | 1. Click upgrade 2. Complete test card 3. Verify plan updated |
| Stripe Customer Portal | PAY-03 | External Stripe-hosted page | 1. Click "Manage subscription" 2. Verify portal loads 3. Test cancel flow |
| Guest search IP rate limiting | AUTH-01 | Requires different IP simulation | 1. Run 3 searches 2. Verify modal appears 3. Clear and verify limit persists |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
