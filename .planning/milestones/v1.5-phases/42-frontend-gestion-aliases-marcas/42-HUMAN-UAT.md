---
status: partial
phase: 42-frontend-gestion-aliases-marcas
source: [42-VERIFICATION.md]
started: 2026-04-18T00:00:00Z
updated: 2026-04-18T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Alias chips load on modal open
expected: Aliases de Reloj section renders in EditEmployeeModal, chips appear after loading state resolves
result: [pending]

### 2. Add alias via Enter key and button
expected: Type alias text, press Enter or click Agregar — chip appears, input clears, API call fires
result: [pending]

### 3. Optimistic delete
expected: Click × on a chip — chip disappears immediately (before API response returns)
result: [pending]

### 4. Duplicate 409 error
expected: Add an alias that already exists — red inline error "Este alias ya está registrado para este empleado" appears, input is NOT cleared
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
