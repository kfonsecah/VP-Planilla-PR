---
phase: 64-snapshot-params-planilla-cerrada
plan: all
depth: standard
files_reviewed: 11
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues
reviewer: gsd-code-reviewer
reviewed_at: 2026-04-30
---

# Code Review — Phase 64: Snapshot Params Planilla Cerrada

## Summary

La implementación de Phase 64 es sólida en su lógica central: el snapshot capture es atómico, la deduplicación con `skipDuplicates` es correcta, y el frontend degrada elegantemente para planillas históricas. Se encontraron 4 warnings y 3 infos — ningún critical. Los hallazgos principales son: un import no utilizado en `PayrollService.ts`, ausencia de validación de input en el controller de snapshot, y `param_value` siendo `Decimal` en el modelo pero `String` en el runtime del getPayrollSnapshot (inconsistencia de tipos en interfaz pública).

---

## Findings

### WR-01: Import no utilizado — `VpgPayrollParamSnapshot`
- **File**: `src/backend/src/service/PayrollService.ts` (line 8)
- **Severity**: WARNING
- **Category**: quality
- **Issue**: `import { VpgPayrollParamSnapshot } from '../model/VpgPayrollParamSnapshot'` se agrega en la fase pero nunca se referencia en el código del archivo. El tipo nunca se usa para tipar variables, parámetros ni retornos en `PayrollService`. TypeScript no falla en `--noEmit` porque el import sólo carga el módulo sin usarlo, pero provoca ruido y puede indicar código incompleto.
- **Fix**: Eliminar el import. El modelo de dominio `VpgPayrollParamSnapshot` no se necesita en `PayrollService` porque el tipo del snapshot se expresa inline en el return de `getPayrollWithSnapshot`.

---

### WR-02: Sin validación de `payrollId` en `getPayrollSnapshot` controller
- **File**: `src/backend/src/controller/PayrollController.ts` (line 93)
- **Severity**: WARNING
- **Category**: security / quality
- **Issue**: `const payrollId = Number(req.params.id)` sin validar que sea un entero positivo finito. Si `req.params.id` es `"abc"`, `Number("abc")` → `NaN`, que Prisma convierte en una query con `payrolls_id = NaN` causando error de DB con un stack trace expuesto en logs. El mismo patrón existe en otros métodos del controller (deuda técnica preexistente) pero es importante capturar en esta fase.
- **Fix**: Agregar validación antes del call al servicio:
  ```typescript
  const payrollId = Number(req.params.id);
  if (!Number.isInteger(payrollId) || payrollId <= 0) {
    return res.status(400).json({ success: false, error: 'ID de planilla inválido' });
  }
  ```

---

### WR-03: Inconsistencia de tipo `param_value`: `Decimal` en schema/modelo vs `string` en retorno público
- **File**: `src/backend/src/model/VpgPayrollParamSnapshot.ts` (line 12) / `src/backend/src/service/PayrollService.ts` (line 385)
- **Severity**: WARNING
- **Category**: quality / typing
- **Issue**: El modelo `VpgPayrollParamSnapshot` define `param_value: Decimal`, que refleja el schema Prisma (`Decimal`). Sin embargo, `getPayrollWithSnapshot` expone el tipo inline con `param_value: string` (después de `.toString()`). El endpoint devuelve un `string`, pero el modelo de dominio dice `Decimal`. Esto genera confusión para consumers futuros que lean el modelo de dominio y esperen un Decimal.
- **Fix**: Crear una interfaz de respuesta pública separada o actualizar el modelo de dominio para tener `param_value: string` con una nota de que se serializa como string en API responses. Alternativamente, mover el inline type a `VpgPayrollParamSnapshot.ts` como `VpgPayrollParamSnapshotResponse`.

---

### WR-04: `ENTERPRISE_*` keys capturadas con `param_valid_from: new Date()` (tiempo de aprobación) en lugar de timestamp consistente
- **File**: `src/backend/src/service/PayrollService.ts` (lines 335, 343, 350)
- **Severity**: WARNING
- **Category**: bug / consistency
- **Issue**: Las 3 claves ENTERPRISE_* usan `param_valid_from: new Date()` (momento de aprobación). Esto difiere semánticamente del resto de los params legales, cuyo `param_valid_from` es la fecha desde la que el parámetro oficial es vigente. Para un auditor, ver `param_valid_from: 2026-04-30T01:34:00Z` para ENTERPRISE_MINUTE_ROUNDING_POLICY puede ser confuso (¿fue configurado en ese momento?). Además, las tres llamadas a `new Date()` ocurren en instantes levemente distintos durante la construcción del array.
- **Fix**: Capturar la fecha una sola vez antes de construir `snapshotData`:
  ```typescript
  const capturedAt = new Date(); // un solo timestamp consistente
  // luego usar capturedAt para los 3 ENTERPRISE_* entries
  ```
  Y documentar que para ENTERPRISE_* keys, `param_valid_from` representa la fecha de captura (no de vigencia regulatoria).

---

### INFO-01: Snapshot keys ENTERPRISE_* no tienen entrada en `CATEGORY_LABELS` del componente
- **File**: `src/frontend/src/components/PayrollParamSnapshotSection.tsx` (line 18)
- **Severity**: INFO
- **Category**: quality / UX
- **Issue**: `CATEGORY_LABELS` tiene clave `'ENTERPRISE': 'Configuración Empresa'`. Las keys `ENTERPRISE_MINUTE_ROUNDING_POLICY` etc. son agrupadas bajo el prefijo `ENTERPRISE` (primer segmento antes de `_`), lo que funciona correctamente. Sin embargo, keys como `HOLIDAY_MANDATORY_FACTOR` producen prefijo `HOLIDAY` que no está en `CATEGORY_LABELS`, fallback a `'HOLIDAY'` (clave raw). Puede verse feo en UI.
- **Fix**: Agregar entradas faltantes: `HOLIDAY: 'Feriados y Días de Descanso'` (ya existe en el código revisado — ✅ ya implementado). No requiere acción si `HOLIDAY` ya está en el mapa.

---

### INFO-02: Prefijo `CCSS` coincide con claves como `CCSS_OBRERO_SALUD`, `CCSS_OBRERO_PENSION` — fragmentación del prefijo
- **File**: `src/frontend/src/components/PayrollParamSnapshotSection.tsx` (line 55)
- **Severity**: INFO
- **Category**: quality / UX
- **Issue**: `snap.param_key.split('_')[0]` extrae sólo el primer segmento. Para `CCSS_OBRERO_SALUD`, extrae `CCSS`. Para `OT_FACTOR`, extrae `OT`. Esto funciona correctamente. El único riesgo es keys mal nombradas en el futuro, pero actualmente el agrupamiento es correcto para todos los params existentes.
- **Fix**: No requiere acción inmediata. Documentar en el CATEGORY_LABELS comment que el agrupamiento usa solo el primer segmento.

---

### INFO-03: Test de snapshot usa `jest.spyOn(LegalParamService, 'getParam')` sin restaurar el spy
- **File**: `src/backend/src/__tests__/unit/services/PayrollService.test.ts` (line 432)
- **Severity**: INFO
- **Category**: coverage / quality
- **Issue**: El `jest.spyOn` en los tests de snapshot crea spies en el `beforeEach` pero no llama `jest.restoreAllMocks()` en `afterEach`. Los spies de `LegalParamService.getParam` y `getActiveParams` pueden "contaminar" tests que se ejecuten después dentro del mismo describe, aunque Jest usualmente limpia entre `describe` blocks. El risk real es bajo porque cada test re-mockea en su `beforeEach`.
- **Fix**: Agregar `afterEach(() => jest.restoreAllMocks())` al bloque `describe('snapshot capture (PAY-29)')` para ser explícito sobre limpieza de spies:
  ```typescript
  afterEach(() => jest.restoreAllMocks());
  ```

---

## Clean Files

Los siguientes archivos no presentan hallazgos en revisión estándar:

- `src/backend/prisma/schema.prisma` — modelo bien definido, constraint unique correcto, índice apropiado, FK configurada
- `src/backend/prisma/migrations/20260429224927_add_vpg_payroll_param_snapshots/migration.sql` — auto-generado, excluido de revisión
- `src/backend/src/routes/PayrollRoutes.ts` — ruta `/payroll/:id/snapshot` correctamente registrada antes de routes con params similares; Swagger JSDoc completo
- `src/backend/src/__tests__/unit/services/PayrollService.Override.test.ts` — correcciones de Phase 64 correctas (findUnique vs findFirst)
- `src/backend/src/__tests__/unit/controller/LegalParamController.test.ts` — corrección de `id` vs `user_id` en mock auth correcta
- `src/frontend/src/services/payrollService.ts` — interfaces `ParamSnapshot`/`PayrollWithSnapshot` bien definidas, `getPayrollSnapshot` delega correctamente a `http.get` que ya desenvuelve `response.data`
- `src/frontend/src/app/pages/payroll/[id]/page.tsx` — integración condicional correcta, degradación graceful con `console.warn`, sin memoria de snapshots en estado de re-render innecesario
