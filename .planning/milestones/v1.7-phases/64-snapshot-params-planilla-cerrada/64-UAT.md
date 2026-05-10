---
status: testing
phase: 64-snapshot-params-planilla-cerrada
source:
  - 64-02-SUMMARY.md
  - 64-03-SUMMARY.md
started: 2026-04-30T01:56:00Z
updated: 2026-04-30T01:56:00Z
---

## Current Test

number: 1
name: Aprobar planilla captura snapshot en DB
expected: |
  Al aprobar una planilla en estado BORRADOR, el sistema graba registros en la tabla
  `vpg_payroll_param_snapshots` con todos los parámetros legales vigentes en el
  `period_start` de la planilla, más las 3 claves ENTERPRISE_*. Si la aprobación
  falla antes de escribir el snapshot, no queda cambio de estado en la planilla.
awaiting: user response

## Tests

### 1. Aprobar planilla captura snapshot en DB
expected: Al aprobar una planilla en estado BORRADOR, el sistema graba registros en la tabla `vpg_payroll_param_snapshots` con todos los parámetros legales vigentes en el `period_start` de la planilla, más las 3 claves ENTERPRISE_*. Si la aprobación falla antes de escribir el snapshot, no queda cambio de estado en la planilla.
result: [pending]

### 2. GET /payroll/:id/snapshot retorna snapshot
expected: Llamar `GET /api/payroll/{id}/snapshot` (con JWT válido) para una planilla aprobada retorna `{ success: true, data: { payroll: {...}, snapshot: [...] } }`. El array `snapshot` contiene objetos con `param_key`, `param_value` (string), `param_valid_from`, `source_decree`. Para una planilla pre-Phase-64 sin snapshot, retorna `snapshot: []` en lugar de error.
result: [pending]

### 3. GET /payroll/:id/snapshot — validación de ID inválido
expected: Llamar `GET /api/payroll/abc/snapshot` retorna HTTP 400 con `{ success: false, error: 'ID de planilla inválido' }` en lugar de un error 500 de Prisma.
result: [pending]

### 4. Sección "Parámetros utilizados" aparece en detalle de planilla aprobada
expected: Al navegar al detalle de una planilla en estado APROBADA o PAGADA (`/pages/payroll/{id}`), se muestra una sección colapsable "Parámetros utilizados en el cálculo" al final de la página, con el contador de parámetros entre paréntesis. La sección NO aparece para planillas en estado BORRADOR.
result: [pending]

### 5. Sección es colapsable con animación
expected: Al hacer clic en el botón "Parámetros utilizados en el cálculo", el panel se expande mostrando la tabla de parámetros con animación suave. Al hacer clic de nuevo, se contrae. El ícono ChevronDown rota 180° cuando está abierto.
result: [pending]

### 6. Tabla de parámetros muestra agrupación por categoría
expected: Dentro de la tabla expandida, los parámetros aparecen agrupados por categoría (filas de sub-encabezado oscuras): "Horas Extraordinarias" para claves OT_*, "Seguridad Social" para CCSS_*, "Configuración Empresa" para ENTERPRISE_*. Los valores ENTERPRISE muestran labels legibles (ej: "Diurna (8h)" en vez de "DIURNA").
result: [pending]

### 7. Degradación graciosa — planilla histórica sin snapshot
expected: Al navegar al detalle de una planilla APROBADA que fue aprobada antes de Phase 64 (sin registros en `vpg_payroll_param_snapshots`), la sección de parámetros NO aparece (retorna null silenciosamente). La página carga sin errores ni pantalla en blanco.
result: [pending]

### 8. Tests unitarios pasan
expected: Ejecutar `npm test -- --testPathPattern=PayrollService.test` en `src/backend/` muestra 26/26 tests pasando. Sin errores de TypeScript (`npx tsc --noEmit` → exit 0 en backend y frontend).
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0

## Gaps

[none yet]
