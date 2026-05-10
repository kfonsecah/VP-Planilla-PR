---
phase: 49
slug: persistencia-vista
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-24
---

# Phase 49 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x |
| **Config file** | src/frontend/package.json (jest) |
| **Quick run command** | `npm test src/frontend/src/__tests__/pages/clock-logs/page.persistence.test.tsx` |
| **Full suite command** | `npm test` (from src/frontend) |
| **Estimated runtime** | ~3 seconds |

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
| 49-01-T1 | 01 | 1 | UX-11 | — | `activeTab` se sincroniza con el parámetro `tab` de la URL | unit | `npm test page.persistence.test.tsx` | ✅ | ✅ green |
| 49-01-T2 | 01 | 1 | UX-12 | — | `expandedEmployees` se sincroniza con el parámetro `expanded` de la URL | unit | `npm test page.persistence.test.tsx` | ✅ | ✅ green |
| 49-01-T3 | 01 | 1 | UX-12 | — | El parámetro `expanded` se limpia automáticamente al cambiar filtros de fecha | unit | `npm test page.persistence.test.tsx` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/frontend/src/__tests__/pages/clock-logs/page.persistence.test.tsx` — Tests de persistencia en URL

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| N/A | — | — | — |

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-24
