# Summary 05-01 — Eliminar Ruta Deprecated

**Plan:** 05-01-PLAN.md  
**Phase:** 05 — Funcionalidad de Negocio Faltante  
**Executed:** 2026-03-27  

---

## Changes Made

### 1. NomineeRoute.ts
- Removed lines 78-97: swagger comment block + route registration for `POST /nominee/calculate`

### 2. NomineeController.ts
- Removed lines 56-76: `calculateNominee` method

### 3. NomineeService.ts
- Removed lines 102-158: `calculateNominee` method (including hardcoded `employeeSalary = 1000`)

## Verification

```bash
# Route removed
grep -r "calculateNominee" src/backend/src/  # → 0 results

# TypeScript check
cd src/backend && npx tsc --noEmit  # → pre-existing errors only
```

## Success Criteria

- [x] Route returns 404 after removal
- [x] `npx tsc --noEmit` passes (pre-existing errors unchanged)
- [x] No references to `calculateNominee` remain in codebase

## Notes

- The deprecated route was previously marked with `@deprecated` in the service
- Replacement route `POST /api/nominee/calculate-payroll` remains intact
- No functional impact on existing payroll calculation flow
