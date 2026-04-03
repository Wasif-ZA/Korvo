---
phase: 4
slug: ui-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                          |
| ---------------------- | ---------------------------------------------- |
| **Framework**          | vitest                                         |
| **Config file**        | vitest.config.ts                               |
| **Quick run command**  | `npx vitest run --reporter=verbose`            |
| **Full suite command** | `npx vitest run --reporter=verbose --coverage` |
| **Estimated runtime**  | ~25 seconds                                    |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 25 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command          | File Exists | Status     |
| ------- | ---- | ---- | ----------- | --------- | -------------------------- | ----------- | ---------- |
| TBD     | TBD  | TBD  | UI-01       | unit      | `npx vitest run tests/ui`  | TBD         | ⬜ pending |
| TBD     | TBD  | TBD  | UI-02       | unit      | `npx vitest run tests/ui`  | TBD         | ⬜ pending |
| TBD     | TBD  | TBD  | DASH-01     | unit      | `npx vitest run tests/ui`  | TBD         | ⬜ pending |
| TBD     | TBD  | TBD  | DASH-02     | unit      | `npx vitest run tests/ui`  | TBD         | ⬜ pending |
| TBD     | TBD  | TBD  | EMAIL-04    | unit      | `npx vitest run tests/api` | TBD         | ⬜ pending |
| TBD     | TBD  | TBD  | EMAIL-05    | unit      | `npx vitest run tests/api` | TBD         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] No new packages needed (all already installed)

_Existing vitest infrastructure covers framework requirements._

---

## Manual-Only Verifications

| Behavior                       | Requirement | Why Manual                       | Test Instructions                               |
| ------------------------------ | ----------- | -------------------------------- | ----------------------------------------------- |
| Drag-and-drop works on desktop | DASH-02     | Requires browser interaction     | Open dashboard, drag contact between columns    |
| Mobile responsive layout       | UI-09       | Requires device/viewport testing | Test on iPhone SE viewport (375px)              |
| Warm approachable aesthetic    | UI-08       | Subjective visual assessment     | Compare against UI-SPEC color/typography tokens |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 25s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
