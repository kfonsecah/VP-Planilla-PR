---
phase: 3
slug: validacion-de-inputs-y-cors
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-26
validated: 2026-03-26
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + ts-jest |
| **Config file** | `src/backend/jest.config.ts` |
| **Quick run command** | `cd src/backend && npx tsc --noEmit` |
| **Full suite command** | `cd src/backend && npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src/backend && npx tsc --noEmit`
- **After every plan wave:** Run `cd src/backend && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 3-01-01 | 01 | 1 | 3.1 | grep | `grep "cors(" src/backend/src/index.ts` → CORS configured | ✅ green |
| 3-01-02 | 01 | 1 | 3.2 | grep | `grep "validateBody" src/backend/src/middleware/validateBody.ts` → exists | ✅ green |
| 3-02-01 | 02 | 1 | 3.3 | grep | `grep "validateBody" src/backend/src/routes/*.ts` → 8 routes | ✅ green |
| 3-02-02 | 02 | 1 | 3.4 | tsc | `cd src/backend && npx tsc --noEmit` → 0 new errors | ✅ green |

*Status: ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No new test files needed — validation via grep and TypeScript compiler.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CORS blocks cross-origin requests | 3.1 | Requires browser or cross-origin curl | `curl -H "Origin: evil.com" http://localhost:3001/api/employees` — should not include Access-Control-Allow-Origin |
| Invalid body returns 400 | 3.3 | Requires server running | Send POST with malformed JSON to any validated endpoint |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ✅ VALIDATED 2026-03-26

## Validation Audit 2026-03-26

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

### Verification Results

**Phase 03-01 (CORS + Zod Schemas):**
- CORS configured: ✅ Found in src/backend/src/index.ts
- validateBody middleware: ✅ Exists in src/backend/src/middleware/validateBody.ts
- 5 Zod schemas (Employee, Payroll, ClockLog, Deduction, User): ✅ All present

**Phase 03-02 (Route Wiring):**
- EmployeeRoute.ts: validateBody on POST /employee/create (line 57), PUT /employee/:id (line 132) ✅
- PayrollRoutes.ts: validateBody on POST /payroll/create (line 83), PUT /payroll/:id (line 164) ✅
- ClockLogsRoute.ts: validateBody on POST /clock-logs/bulk (line 52) ✅
- DeductionsRoute.ts: validateBody on POST /deduction/create (line 59), PUT /deductions/:id (line 129) ✅
- UserRoute.ts: validateBody AFTER auth middleware (lines 41-43) ✅

**Total: 8 mutation routes now validate bodies with Zod schemas**
