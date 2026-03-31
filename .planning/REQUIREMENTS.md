# Requirements: VP-Planilla

**Defined:** 2026-03-31
**Core Value:** Calcular y generar planillas correctas conforme a la ley laboral costarricense, con datos seguros y auditables.

## v1.1 Requirements

### Tests Unitarios

- [ ] **TESTS-01**: Developer puede ejecutar tests de EmployeeService con cobertura de crear, listar, obtener por ID, actualizar y desactivar empleados
- [ ] **TESTS-02**: Developer puede ejecutar tests de ClockLogService con cobertura de registrar entrada, registrar salida y listar logs por empleado
- [ ] **TESTS-03**: Developer puede ejecutar tests de DeductionService con cobertura de asignar deducción a empleado y calcular montos
- [ ] **TESTS-04**: Developer puede ejecutar tests de AuthService con cobertura de login, logout y validación de token
- [ ] **TESTS-05**: `jest --coverage` reporta ≥60% en statements/branches combinados en módulos de servicio

### UI — Design System

- [ ] **UI-01**: Usuario ve colores, tipografía y espaciado consistentes en todas las vistas mediante design tokens CSS (dark mode aplicado globalmente)
- [ ] **UI-02**: Usuario navega con un sidebar dark moderno que muestra estado activo, colapsa en mobile y es visualmente coherente con el resto del sistema
- [ ] **UI-03**: Usuario ve tablas de datos con hover, estados vacíos y paginación con estilo dark moderno — sin tablas que parezcan de sistema diferente
- [ ] **UI-04**: Usuario completa formularios e inputs con estilo dark consistente, feedback visual de validación y estados de error visibles
- [ ] **UI-05**: Usuario ve modales de confirmación/advertencia antes de acciones destructivas o críticas (eliminar, desactivar, cerrar sesión)

### Integración Frontend-Backend

- [ ] **INTEG-01**: Developer verifica que los campos enviados por cada formulario del frontend coinciden exactamente con los schemas Zod del backend (audit de contratos)
- [ ] **INTEG-02**: Usuario ve mensajes de error concretos del backend (no "algo salió mal") cuando una operación falla
- [ ] **INTEG-03**: Todos los hooks de datos exponen `isLoading` y `error` con UI que los refleja (spinners, estados vacíos, mensajes de error)

## v2 Requirements

### Tests de Frontend

- **FE-TEST-01**: Tests de componentes React con Vitest + Testing Library
- **FE-TEST-02**: Tests E2E con Playwright para flujos críticos

### TypeScript

- **TS-01**: Corregir 27 errores TypeScript pre-existentes en controllers
- **TS-02**: Migrar bcrypt v6 pre-release → v5.1.1 estable

## Out of Scope

| Feature | Reason |
|---------|--------|
| Tests E2E con Playwright | Alto costo de setup, diferido a v1.2 |
| Tests de componentes React (Vitest) | Diferido — primero arreglar UI, luego testearla |
| Migración bcrypt v5 | Deuda técnica sin urgencia funcional en v1.1 |
| Corrección TypeScript controllers | Deuda pre-existente, no bloquea funcionalidad v1.1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TESTS-01 | Phase 9 | Pending |
| TESTS-02 | Phase 9 | Pending |
| TESTS-03 | Phase 10 | Pending |
| TESTS-04 | Phase 10 | Pending |
| TESTS-05 | Phase 10 | Pending |
| UI-01 | Phase 11 | Pending |
| UI-02 | Phase 11 | Pending |
| UI-03 | Phase 12 | Pending |
| UI-04 | Phase 12 | Pending |
| UI-05 | Phase 12 | Pending |
| INTEG-01 | Phase 13 | Pending |
| INTEG-02 | Phase 13 | Pending |
| INTEG-03 | Phase 13 | Pending |

**Coverage:**
- v1.1 requirements: 13 total
- Mapped to phases: 13 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 — traceability mapped after roadmap creation*
