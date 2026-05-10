---
status: testing
phase: 23-debug-y-correcion-marcas
source: 23-01-SUMMARY.md, 23-02-SUMMARY.md
started: 2026-04-09T14:00:00Z
updated: 2026-04-09T14:00:00Z
---

## Current Test

number: 1
name: Importar Excel de marcas
expected: |
  1. Ir a http://localhost:3000/attendance
  2. Importar archivo attendance_sample_valid.xlsx
  3. Verificar que la importación fue exitosa (mensaje de éxito)
awaiting: user response

## Tests

### 1. Importar Excel de marcas
expected: |
  1. Ir a http://localhost:3000/attendance
  2. Importar archivo attendance_sample_valid.xlsx
  3. Verificar que la importación fue exitosa (mensaje de éxito)
result: pending

### 2. Marcas persisten al recargar
expected: |
  1. Recargar la página /attendance
  2. Consultar marcas para fecha 6/4/26
  3. Las marcas importadas deben aparecer
result: pending

### 3. Sesión visible en panel
expected: |
  1. Ir a http://localhost:3000/clock-logs
  2. Verificar panel de sesiones de importación
  3. La sesión de la carga anterior debe aparecer
result: pending

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

- truth: "Las horas del Excel se importan exactamente como están"
  status: failed
  reason: "Las horas del Excel no coinciden con las del sistema. Ej: 7:12am en Excel → 7:14am en sistema. error de precisión flotante en Math.round()"
  severity: major
  test: 1