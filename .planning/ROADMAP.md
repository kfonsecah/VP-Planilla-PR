# Roadmap: v1.6 Mejoras en Auditoría de Marcas y UX

**Milestone Goal:** Refinar el flujo de auditoría de marcas permitiendo edición directa, corrigiendo la lógica de nivel de confianza y mejorando la persistencia y comodidad de la interfaz.

| Phase | Name | Requirements | Success Criteria | Status |
|-------|------|--------------|------------------|--------|
| 49 | Persistencia de Vista (CachÃ© de UI) | UX-11, UX-12 | 2 | Completed |
| 50 | CorrecciÃ³n LÃ³gica de Nivel de Confianza y Estatus | AUDIT-02, AUDIT-03 | 2 | Completed |
| 52 | Persistencia Robusta (LocalStorage) | UX-11, UX-12 | 2 | Completed |
| 51 | EdiciÃ³n Directa de Marcas en AuditorÃ­a | AUDIT-01 | 3 | Not Started |
| 54 | Rediseño del Flujo de Planilla | PAY-11, PAY-12, PAY-13 | 5 | Completed |


---

## Phase Details

### Phase 49: Persistencia de Vista (Caché de UI)
**Goal:** Guarantee that the daily audit view remembers the user's active tab and expanded employee cards across navigations.
**Requirements:** UX-11, UX-12
**Success Criteria:**
1. Navigating away from the audit page and returning via the sidebar correctly restores the previously active tab (e.g. Audit vs Validation).
2. Expanded employee cards remain expanded if the user switches tabs or navigates away and back.
**Status:** Not Started

### Phase 50: Corrección Lógica de Nivel de Confianza y Estatus
**Goal:** Fix false positives in mark confidence evaluation and ensure real-time status UI updates.
**Requirements:** AUDIT-02, AUDIT-03
**Success Criteria:**
1. Valid IN/OUT pairs generated without manipulation are displayed with high confidence indicators instead of "baja confianza".
2. Resolving a problematic mark instantly updates the employee's yellow warning badge to green in the UI without requiring a full page reload.
**Status:** Completed

### Phase 51: Edición Directa de Marcas en Auditoría
**Goal:** Allow users to edit existing entries intuitively from within the daily audit flow.
**Requirements:** AUDIT-01
**Success Criteria:**
1. Users can click on an existing mark row in the audit view to open an inline or modal editor.
2. Saving changes to a mark sends the correction to the backend (`/api/clock-logs/adjust` or similar) and shows a success toast.
3. The UI row is immediately updated with the new time and status, reflecting the database state without a hard refresh.
**Status:** Not Started

### Phase 54: Rediseño del Flujo de Planilla
**Goal:** Rediseñar el cálculo de planilla para usar marcas efectivas auditadas como fuente de verdad, y ofrecer al jefe una UI simple y sin fricción con soporte para planillas personalizadas.
**Requirements:** PAY-11, PAY-12, PAY-13
**Success Criteria:**
1. El cálculo de planilla usa exclusivamente marcas efectivas (`vpg_effective_clock_logs`) — no marcas crudas — y refleja ajustes ADD/EDIT/VOID aplicados.
2. El jefe puede generar una planilla seleccionando manualmente qué empleados incluir (no forzar "todos").
3. El jefe puede ajustar horas calculadas o deducciones individualmente por empleado antes de aprobar.
4. El sistema soporta al menos 3 tipos de período: quincenal (1-15 / 16-fin), mensual, y rango de fechas libre.
5. El flujo completo (seleccionar período → revisar empleados → ajustar → aprobar) es ejecutable en menos de 5 clics sin errores confusos.
**Status:** Planning Complete (5 plans ready — execute waves 1→2→3→4)

**Plans:**
- 54-01 (Wave 1): DB Migration — payrolls_period_type + employee override columns
- 54-02 (Wave 2): Backend API — selectedEmployeeIds filter + PATCH override endpoint
- 54-03 (Wave 3): Frontend — /pages/payroll/wizard 4-step page + usePayrollWizard extension
- 54-04 (Wave 3): Frontend — PayrollEmployeeAdjustModal + payrollService.saveEmployeeOverride()
- 54-05 (Wave 4): Integration — Sidebar link + /calculate redirect

### Phase 52: UI de Drag and Drop para Ventanas de Tiempo por Empleado
**Goal:** Allow administrators to intuitively manage, assign, and visualize time windows per employee through a drag-and-drop interface within the sidebar views.
**Requirements:** UX-13
**Success Criteria:**
1. Administrators can interact with graphical time blocks mapped to employees.
2. Interface updates sync to backend settings reliably.
**Status:** Not Started
