---
phase: 57
slug: enterprise-config
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-26
---

# Phase 57 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Focus on payroll configuration integrity and legal compliance safeguards.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest + ts-jest (Backend) |
| **Config file** | `src/backend/jest.config.js` |
| **Quick run command** | `npm test -- src/backend/src/__tests__/unit/services/EnterpriseService.test.ts` |
| **Full suite command** | `cd src/backend && npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit` (Frontend/Backend) and `npx next lint` (Frontend).
- **After every logic change in EnterpriseService:** Run `npm test -- EnterpriseService.test.ts`
- **After every plan wave:** Run full backend test suite
- **Before `/gsd-verify-work`:** 100% green on all automated checks
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 57-01-01 | 01 | 1 | PAY-22 | — | enterprise_ prefix used for fields | Schema | `npx prisma validate --schema=src/backend/prisma/schema.prisma` | ✅ | ⬜ pending |
| 57-01-02 | 01 | 1 | PAY-22 | T-57-01 | Schema versioning | Schema | `npx prisma status --schema=src/backend/prisma/schema.prisma` | ✅ | ⬜ pending |
| 57-02-00 | 02 | 2 | PAY-22 | — | TDD scaffold for enterprise rules | Unit | `ls src/backend/src/__tests__/unit/services/EnterpriseService.test.ts` | ❌ W0 | ⬜ pending |
| 57-02-01 | 02 | 2 | PAY-22 | T-57-02-02 | Partial updates and audit entity 'enterprise_config' | Unit | `npm test -- src/backend/src/__tests__/unit/services/EnterpriseService.test.ts` | ✅ | ⬜ pending |
| 57-02-02 | 02 | 2 | PAY-22 | T-57-02-01 | Role-based PATCH access | Integration | `npx tsc --noEmit --project src/backend/tsconfig.json` | ✅ | ⬜ pending |
| 57-02-03 | 02 | 2 | PAY-22 | T-57-02-02 | Payload validation (Enums/Booleans) | Typecheck | `npx tsc --noEmit --project src/backend/tsconfig.json` | ✅ | ⬜ pending |
| 57-03-01 | 03 | 3 | PAY-22 | T-57-03-01 | Verbatim legal disclaimer text | Lint | `npx next lint` | ✅ | ⬜ pending |
| 57-03-02 | 03 | 3 | PAY-22 | T-57-03-01 | Forced acknowledgment for NEAREST_QUARTER | Typecheck | `npx tsc --noEmit --project src/frontend/tsconfig.json` | ✅ | ⬜ pending |
| 57-03-03 | 03 | 3 | PAY-22 | — | UI State Sync on Modal Cancel | Manual | See Sampling Protocol below | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/backend/src/__tests__/unit/services/EnterpriseService.test.ts` — Stubs for `updateConfig` logic:
    - Test: Persists fields with `enterprise_` prefix.
    - Test: Verifies that fields not in payload (like `enterprise_image`) are NOT modified.
    - Test: Verifies `vpg_audit_logs` entry is created with `entity_name: 'enterprise_config'`.
    - Test: Verifies `enterprise_rounding_policy_acknowledged` is reset to `false` when policy changes from `NEAREST_QUARTER` to any other.

---

## Manual-Only Verifications (Sampling Protocol)

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| High-Stakes Modal Trigger | PAY-22 | Visual/UX Check | 1. Open Enterprise Config page.<br>2. Select `NEAREST_QUARTER` in Rounding Policy.<br>3. Click Save.<br>4. Verify `LegalRoundingModal` appears with verbatim text. |
| Modal Cancellation Sync | PAY-22 | UI/State Sync | 1. Open Modal.<br>2. Click "Cancelar".<br>3. Verify the policy dropdown reverts to its original value and NO data is saved. |
| Modal Verbatim | PAY-22 | Compliance | 1. Verify header is exactly "**⚠️ Advertencia legal — Redondeo bidireccional**".<br>2. Verify buttons are "Cancelar" and "Confirmo, activar Modalidad C". |
| Final Persistence | PAY-22 | Data Integrity | 1. Confirm acknowledgment in Modal.<br>2. Verify "Configuración guardada" toast.<br>3. Refresh page and verify values persist. |

---

## Success Thresholds

1. **Backend Integrity:** 100% pass rate for `EnterpriseService` unit tests in `src/backend/src/__tests__/unit/services/`.
2. **Audit Accountability:** Every configuration update must produce an audit log with entity `enterprise_config`.
3. **Partial Update Safety:** PATCH requests must not overwrite fields omitted from the payload (e.g., logos/images).
4. **Legal Compliance:** Frontend must use specified Spanish verbatim and block `NEAREST_QUARTER` without acknowledgment.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
