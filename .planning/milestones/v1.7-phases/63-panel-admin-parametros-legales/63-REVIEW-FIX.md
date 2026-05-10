---
phase: 63-panel-admin-parametros-legales
fixed_at: 2026-04-29T00:00:00Z
review_path: .planning/phases/63-panel-admin-parametros-legales/63-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 63: Code Review Fix Report

**Fixed at:** 2026-04-29
**Source review:** .planning/phases/63-panel-admin-parametros-legales/63-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6
- Fixed: 6
- Skipped: 0

## Fixed Issues

### CR-01: Auth check allows user with id=0 to bypass authorization

**Files modified:** `src/backend/src/controller/LegalParamController.ts`
**Commit:** `8486a2e0`
**Applied fix:** Replaced the `String(... ?? '')` + falsy check pattern in all three write controller methods (`upsertParam`, `bulkUpsertMinWages`, `patchParam`) with a strict `rawId === undefined || rawId === null` guard before stringifying. This eliminates the false-negative for numeric id=0 while preserving correct rejection of missing user identity.

---

### WR-01: `getParamHistory` service return type does not match consumer expectation

**Files modified:** `src/frontend/src/components/LegalParamHistoryModal.tsx`
**Commit:** `cfefc874`
**Applied fix:** Replaced the `.then((res) => { if (res.success && res.data) { setHistory(res.data); } })` pattern with `.then((data: LegalParam[]) => { setHistory(data ?? []); })`. Because `http.ts` already unwraps the `{ success, data }` envelope, the resolved value is the plain array — the previous condition `res.success` was always `undefined` (falsy) and history was never populated.

---

### WR-02: Bulk update `value` field is not validated as a finite number before DB write

**Files modified:** `src/backend/src/controller/LegalParamController.ts`
**Commit:** `be2d2ed8`
**Applied fix:** Added a per-entry validation loop in `bulkUpsertMinWages` before the password confirmation check. Each entry is validated to have a non-empty string `key` and a non-negative finite `Number(value)`. Invalid entries return 400 with a descriptive error identifying the offending key.

---

### WR-03: `loadParams` is called from `useEffect` but not listed in the dependency array

**Files modified:** `src/frontend/src/app/pages/configuracion/parametros-legales/page.tsx`
**Commit:** `7fcd8cfe`
**Applied fix:** Wrapped `loadParams` in `useCallback(async () => { ... }, [])` (no inner deps — it only calls service and setters) and added `loadParams` to the `useEffect` dependency array `[user, router, loadParams]`. Also added `useCallback` to the React import.

---

### WR-04: `LegalParamDrawer` does not reset modal state on close

**Files modified:** `src/frontend/src/components/LegalParamDrawer.tsx`
**Commit:** `afa825d1`
**Applied fix:** Introduced a `handleClose` function that resets `isConfirming`, `pendingData`, and `passwordError` before calling `onClose()`. Replaced `onClose` with `handleClose` on all three close triggers: the backdrop overlay, the X button, and the Cancelar button. This prevents a stale `isConfirming: true` state from a prior critical-param interaction from leaking into a subsequent drawer open for a non-critical param.

---

### WR-05: `PATCH /legal-params/:key` can match reserved path segment `min-wages`

**Files modified:** `src/backend/src/controller/LegalParamController.ts`
**Commit:** `1f4b1ad1`
**Applied fix:** Added an early guard in `patchParam` that rejects `PATCH /legal-params/min-wages` with a 400 response directing callers to use the bulk endpoint. This closes the authorization logic gap where patching the literal key `"min-wages"` would bypass the `source_decree` requirement enforced by the bulk endpoint.

---

_Fixed: 2026-04-29_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
