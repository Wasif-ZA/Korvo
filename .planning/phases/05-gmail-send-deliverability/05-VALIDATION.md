---
phase: 5
slug: gmail-send-deliverability
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-04
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                       |
| ---------------------- | --------------------------- |
| **Framework**          | Vitest 4.1.2                |
| **Config file**        | `vitest.config.ts` (exists) |
| **Quick run command**  | `npm run test`              |
| **Full suite command** | `npm run test:coverage`     |
| **Estimated runtime**  | ~15 seconds                 |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test:coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Requirement Verification Map

| Req ID  | Behavior                                                                     | Test Type | Automated Command                              | File Exists | Status     |
| ------- | ---------------------------------------------------------------------------- | --------- | ---------------------------------------------- | ----------- | ---------- |
| SEND-01 | Free user: Copy + mailto visible, no Send via Gmail                          | unit      | `npm run test -- tests/api/gmail-send.test.ts` | ❌ W0       | ⬜ pending |
| SEND-02 | Pro + connected user: Send via Gmail button present, enqueues job            | unit      | `npm run test -- tests/api/gmail-send.test.ts` | ❌ W0       | ⬜ pending |
| SEND-03 | Token stored encrypted; decrypts correctly; invalid_grant triggers reconnect | unit      | `npm run test -- tests/api/gmail-send.test.ts` | ❌ W0       | ⬜ pending |
| SEND-04 | Daily limit enforced — 6th send on Day 1 rejected; Day 8 allows 10           | unit      | `npm run test -- tests/api/gmail-send.test.ts` | ❌ W0       | ⬜ pending |
| SEND-05 | Job enqueued with delay in 60-180s range                                     | unit      | `npm run test -- tests/api/gmail-send.test.ts` | ❌ W0       | ⬜ pending |
| SEND-06 | Contact moves to "contacted" stage after send                                | unit      | `npm run test -- tests/api/gmail-send.test.ts` | ❌ W0       | ⬜ pending |
| SEND-07 | Unsubscribe footer appended to all sent emails                               | unit      | `npm run test -- tests/api/gmail-send.test.ts` | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `tests/api/gmail-send.test.ts` — stubs for SEND-01 through SEND-07
- [ ] `tests/lib/gmail-token-encryption.test.ts` — encryption/decryption round-trip tests
- [ ] `tests/lib/deliverability.test.ts` — warm-up ramp, bounce guard, jitter tests

---

## Manual-Only Verifications

| Behavior                            | Requirement | Why Manual                                         | Test Instructions                                                                        |
| ----------------------------------- | ----------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Gmail OAuth consent screen          | SEND-02     | Requires real Google OAuth redirect                | Click "Connect Gmail" in Settings, verify consent screen appears with `gmail.send` scope |
| Email arrives in recipient inbox    | SEND-02     | Requires real Gmail API credentials                | Send test email, verify receipt in target inbox                                          |
| Reconnect prompt after token revoke | SEND-03     | Requires revoking token in Google account settings | Revoke token, trigger send, verify "Reconnect Gmail" prompt                              |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
