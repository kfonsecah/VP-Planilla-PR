---
phase: 24
slug: auth-token-lifecycle-end-to-end
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-11
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x |
| **Config file** | `src/backend/jest.config.js`, `src/frontend/jest.config.js` |
| **Quick run command** | `cd src/backend && npm test -- AuthMiddleware.test.ts --runInBand` |
| **Full suite command** | `cd src/backend && npm test -- auth.lifecycle.test.ts AuthMiddleware.test.ts AuthService.test.ts --runInBand && cd ../frontend && npm test -- http.auth.test.ts useAuth.logout.test.tsx --runInBand` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 24-01-01 | 01 | 1 | AUTH-08 | — | Canonical auth-error payload | unit | `npm test -- AuthMiddleware.test.ts` | ✅ | ✅ green |
| 24-01-02 | 01 | 1 | AUTH-06, AUTH-08 | — | Unified error mapping | unit | `npm test -- AuthMiddleware.test.ts` | ✅ | ✅ green |
| 24-02-01 | 02 | 2 | AUTH-07 | — | Full auth lifecycle coverage | integration | `npm test -- auth.lifecycle.test.ts` | ✅ | ✅ green |
| 24-02-02 | 02 | 2 | AUTH-07, AUTH-06 | — | Refresh/Logout real logic | unit/int | `npm test -- auth.lifecycle.test.ts AuthService.test.ts` | ✅ | ✅ green |
| 24-03-01 | 03 | 3 | AUTH-05, AUTH-07 | — | Frontend refresh/logout logic | unit | `npm test -- http.auth.test.ts useAuth.logout.test.tsx` | ✅ | ✅ green |
| 24-03-02 | 03 | 3 | AUTH-05, AUTH-08 | — | Contract-based error parsing | unit | `npm test -- http.auth.test.ts` | ✅ | ✅ green |

---

## Wave 0 Requirements

- [x] `src/backend/src/__tests__/unit/middleware/AuthMiddleware.test.ts` — stubs for AUTH-06/08
- [x] `src/backend/src/__tests__/unit/services/AuthService.test.ts` — expanded for blocklist
- [x] `src/backend/src/__tests__/integration/auth.lifecycle.test.ts` — new integration suite

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Manual E2E auth flow | AUTH-05, AUTH-07 | Cross-process browser interaction | Login, wait for refresh, logout, verify 401 on next request. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-11

---

## Validation Audit 2026-04-11
| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
