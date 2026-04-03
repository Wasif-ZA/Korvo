---
phase: 3
slug: agent-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                          |
| ---------------------- | ---------------------------------------------- |
| **Framework**          | vitest                                         |
| **Config file**        | vitest.config.ts                               |
| **Quick run command**  | `npx vitest run --reporter=verbose`            |
| **Full suite command** | `npx vitest run --reporter=verbose --coverage` |
| **Estimated runtime**  | ~20 seconds                                    |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type   | Automated Command              | File Exists | Status     |
| ------- | ---- | ---- | ----------- | ----------- | ------------------------------ | ----------- | ---------- |
| TBD     | TBD  | TBD  | AGENT-01    | integration | `npx vitest run tests/agents`  | TBD         | ⬜ pending |
| TBD     | TBD  | TBD  | AGENT-02    | integration | `npx vitest run tests/agents`  | TBD         | ⬜ pending |
| TBD     | TBD  | TBD  | AGENT-03    | integration | `npx vitest run tests/agents`  | TBD         | ⬜ pending |
| TBD     | TBD  | TBD  | AGENT-04    | integration | `npx vitest run tests/agents`  | TBD         | ⬜ pending |
| TBD     | TBD  | TBD  | SCORE-01    | unit        | `npx vitest run tests/scoring` | TBD         | ⬜ pending |
| TBD     | TBD  | TBD  | EMAIL-01    | unit        | `npx vitest run tests/email`   | TBD         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `tests/agents/` — test directory for agent tests
- [ ] `tests/scoring/` — test directory for scoring engine tests
- [ ] `tests/email/` — test directory for email template tests
- [ ] Install `@anthropic-ai/sdk`, `@mendable/firecrawl-js`, `opossum`

_Existing vitest infrastructure covers framework requirements._

---

## Manual-Only Verifications

| Behavior                     | Requirement | Why Manual                                     | Test Instructions                                                 |
| ---------------------------- | ----------- | ---------------------------------------------- | ----------------------------------------------------------------- |
| LinkedIn URL blocklist       | AGENT-09    | Requires real Claude API calls with web search | Run real search, grep output for linkedin.com URLs                |
| Prompt caching reduces costs | AGENT-06    | Requires Claude API billing dashboard          | Check API usage after 2+ searches for cache_read_input_tokens > 0 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
