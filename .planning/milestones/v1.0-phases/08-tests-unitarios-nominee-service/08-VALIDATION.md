---
phase: 8
slug: tests-unitarios-nominee-service
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 8 — Validation Strategy

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

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-----------------|--------|
| 8-01-01 | 01 | 1 | 8.1 | grep | `grep "8h/day\|normal" NomineeService.test.ts` → exists | ⬜ pending |
| 8-01-02 | 01 | 1 | 8.2 | grep | `grep "overtime.*1.5" NomineeService.test.ts` → exists | ⬜ pending |
| 8-01-03 | 01 | 1 | 8.3 | grep | `grep "overtime.*2" NomineeService.test.ts` → exists | ⬜ pending |
| 8-01-04 | 01 | 1 | 8.4 | grep | `grep "weeklyRest\|descanso" NomineeService.test.ts` → exists | ⬜ pending |
| 8-01-05 | 01 | 1 | 8.5 | grep | `grep "feriado\|holiday" NomineeService.test.ts` → exists | ⬜ pending |
| 8-01-06 | 01 | 1 | 8.6 | grep | `grep "CCSS\|deduction" NomineeService.test.ts` → exists | ⬜ pending |
| 8-02-01 | 02 | 2 | 8.7 | jest | `npm test` → 0 failures | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red*

---

## Validation Sign-Off

- [ ] All tasks have Wave 0 dependencies
- [ ] Sampling continuity maintained
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---

*Generated from 08-RESEARCH.md*
