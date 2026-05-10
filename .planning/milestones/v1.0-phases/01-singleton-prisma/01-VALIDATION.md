---
phase: 1
slug: singleton-prisma
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-25
validated: 2026-03-26
---

# Phase 1 — Validation Strategy

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
| 1-01-01 | 01 | 1 | 1.1 | grep | `grep -r "new PrismaClient()" src/backend/src/service/ \| wc -l` → 0 | ✅ green |
| 1-01-02 | 01 | 1 | 1.2 | typecheck | `cd src/backend && npx tsc --noEmit` exits 0 | ✅ green |
| 1-01-03 | 01 | 1 | 1.3 | grep | `grep -r "from '../lib/prisma'" src/backend/src/service/` → 15 matches | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No new test files needed — validation is purely via grep and TypeScript compiler.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sin cambios de comportamiento observable | 1.3 | Requiere correr el servidor y ejecutar operaciones | Iniciar backend, crear un empleado, verificar que la operación retorna 200 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** ✅ VALIDATED 2026-03-26

## Validation Audit 2026-03-26

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

### Verification Results
- `new PrismaClient()` count: 0 ✅
- `from '../lib/prisma'` count: 15 ✅
