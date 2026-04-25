---
phase: 41
slug: backend-aliases-marcas-inferencia-in-out
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-17
---

# Phase 41 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x + ts-jest |
| **Config file** | `src/backend/jest.config.js` |
| **Quick run command** | `cd src/backend && npm test -- --testPathPattern=ClockAlias` |
| **Full suite command** | `cd src/backend && npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src/backend && npm test -- --testPathPattern=ClockAlias`
- **After every plan wave:** Run `cd src/backend && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 41-01-01 | 01 | 1 | ALIAS-01 | migration | `cd src/backend && npx prisma migrate dev --name add_clock_aliases` | ⬜ pending |
| 41-01-02 | 01 | 1 | ALIAS-01, ALIAS-02 | typecheck | `cd src/backend && npx tsc --noEmit` | ⬜ pending |
| 41-02-01 | 02 | 2 | ALIAS-03 | typecheck | `cd src/backend && npx tsc --noEmit` | ⬜ pending |
| 41-02-02 | 02 | 2 | ALIAS-03 | typecheck | `cd src/backend && npx tsc --noEmit` | ⬜ pending |
| 41-03-01 | 03 | 3 | ALIAS-04, INFER-01 | typecheck | `cd src/backend && npx tsc --noEmit` | ⬜ pending |
| 41-03-02 | 03 | 3 | INFER-02 | typecheck | `cd src/backend && npx tsc --noEmit` | ⬜ pending |
| 41-04-01 | 04 | 4 | ALIAS-03 | unit | `cd src/backend && npm test -- --testPathPattern=ClockAliasService` | ⬜ pending |
| 41-04-02 | 04 | 4 | ALIAS-04, INFER-01, INFER-02 | unit | `cd src/backend && npm test -- --testPathPattern=ClockLogsImportService` | ⬜ pending |
| 41-04-03 | 04 | 4 | ALIAS-01..04, INFER-01..02 | full suite | `cd src/backend && npm test` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test infrastructure needed — jest + ts-jest already configured.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Alias lookup resolves correct employee on real Excel import | ALIAS-04 | Requires real clock Excel file | Upload sample Excel with partial name → verify correct employee matched via alias |
| IN/OUT alternation correct order on multi-day import | INFER-01 | Multi-day grouping requires real file | Upload file with 3+ records per employee across 2 days → verify each day gets independent alternation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
