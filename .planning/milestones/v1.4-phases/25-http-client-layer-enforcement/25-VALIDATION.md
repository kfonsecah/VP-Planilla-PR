---
phase: 25
slug: http-client-layer-enforcement
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-11
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x |
| **Config file** | `src/frontend/jest.config.js` |
| **Quick run command** | `cd src/frontend && npm test -- clientEnforcement.test.ts --runInBand` |
| **Full suite command** | `cd src/frontend && npm test -- clientEnforcement.test.ts http.auth.test.ts --runInBand` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 25-01-01 | 01 | 1 | HTTP-01 | T-25-02 | Audit/Branch services use http.ts | unit | `npm test -- clientEnforcement.test.ts` | ✅ | ✅ green |
| 25-01-02 | 01 | 1 | HTTP-01 | T-25-02 | PayrollEmployeesService uses http.ts | unit | `npm test -- clientEnforcement.test.ts` | ✅ | ✅ green |
| 25-02-01 | 02 | 2 | HTTP-03 | T-25-01 | externalHttp used for weather | manual | — | ✅ | ✅ verified |
| 25-02-02 | 02 | 2 | HTTP-01 | — | Final fetch audit passed | manual | `grep -r "fetch(" ...` | ✅ | ✅ green |

---

## Wave 0 Requirements

- [x] `src/frontend/src/__tests__/services/clientEnforcement.test.ts` — validation for service refactor

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| weather.ts uses externalHttp | HTTP-03 | Involves process.env and geolocation | Inspect code or monitor network tab for no Auth header to OpenWeatherMap. |
| Zero unauthorized fetch calls | HTTP-01 | Static analysis via grep | Run `grep -r "fetch(" src/frontend/src/services src/frontend/src/utils` and ensure only http.ts and externalHttp.ts appear. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-11

---

## Validation Audit 2026-04-11
| Metric | Count |
|--------|-------|
| Gaps found | 1 |
| Resolved | 1 |
| Escalated | 0 |
