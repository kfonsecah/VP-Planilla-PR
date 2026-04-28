# Roadmap: v1.6 Mejoras en Auditoría de Marcas y UX

**Milestone Goal:** Refinar el flujo de auditoría de marcas permitiendo edición directa, corrigiendo la lógica de nivel de confianza y mejorando la persistencia y comodidad de la interfaz.

| Phase | Name | Requirements | Success Criteria | Status |
|-------|------|--------------|------------------|--------|
| 49 | Persistencia de Vista (CachÃ© de UI) | UX-11, UX-12 | Complete    | 2026-04-26 |
| 50 | CorrecciÃ³n LÃ³gica de Nivel de Confianza y Estatus | AUDIT-02, AUDIT-03 | 2 | Completed |
| 52 | Persistencia Robusta (LocalStorage) | UX-11, UX-12 | 2 | Completed |
| 51 | EdiciÃ³n Directa de Marcas en AuditorÃ­a | AUDIT-01 | 3 | Not Started |
| 54 | Rediseño del Flujo de Planilla | PAY-11, PAY-12, PAY-13 | 5 | Completed |
| 55 | Fundación vpg_legal_params | PAY-20 | 3 | Completed |
| 56 | Motor de Cálculo Desacoplado | PAY-21 | 4 | Completed |
| 57 | Enterprise Config — Campos Faltantes | PAY-22 | 3 | Complete | 2026-04-26 |
| 58 | Redondeo de Minutos en Motor | PAY-23 | 3 | Complete | 2026-04-26 |
| 59 | Tarifa Mínima Global (Opcional) | PAY-24 | 2 | Completed |
| 60 | Advertencia de Tarifa Mínima en Planilla | PAY-25 | 3 | Completed |
| 61 | Alertas Persistentes Parámetros Legales | PAY-26 | 5 | Not Started |
| 62 | Confirmación Contraseña Params Críticos | PAY-27 | 2 | Not Started |
| 63 | Panel Admin Parámetros Legales UI | PAY-28 | 5 | Not Started |
| 64 | Snapshot de Params en Planilla Cerrada | PAY-29 | 3 | Not Started |
| 65 | Proyección de Aguinaldo en UI | PAY-30 | 4 | Not Started |
| 66 | Soporte Jornadas Mixtas y Nocturnas | PAY-31 | 4 | Not Started |


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
1/1 plans complete
- 54-02 (Wave 2): Backend API — selectedEmployeeIds filter + PATCH override endpoint
- 54-03 (Wave 3): Frontend — /pages/payroll/wizard 4-step page + usePayrollWizard extension
- 54-04 (Wave 3): Frontend — PayrollEmployeeAdjustModal + payrollService.saveEmployeeOverride()
- 54-05 (Wave 4): Integration — Sidebar link + /calculate redirect

### Phase 55: Fundación vpg_legal_params
**Goal:** Crear la tabla vpg_legal_params con su capa completa de backend y migrar todas las constantes hardcodeadas de payrollUtils.ts a registros en BD con fecha de vigencia.
**Requirements:** PAY-20
**Success Criteria:**
1. Modelo VpgLegalParam existe en schema.prisma con todos los campos requeridos y migración generada.
2. Seed ejecutado: 20+ parámetros iniciales en BD incluyendo jornadas, multiplicadores OT, tasas CCSS y MIN_WAGE_CHECK_ENABLED.
3. LegalParamService.getParamAtDate('OT_FACTOR', new Date()) retorna 1.5.
**Status:** Completed

**Plans:** 3 plans
- [ ] 55-01-PLAN.md — Schema + migration + seed (Wave 1)
- [ ] 55-02-PLAN.md — LegalParamService + unit tests (Wave 2)
- [ ] 55-03-PLAN.md — LegalParamController + LegalParamRoute + index.ts registration (Wave 3)

### Phase 56: Motor de Cálculo Desacoplado
**Goal:** Eliminar literales numéricos de payrollUtils.ts y hacer que NomineeService cargue parámetros desde vpg_legal_params. Los resultados de planilla no cambian — solo el origen de los valores.
**Requirements:** PAY-21
**Success Criteria:**
1. payrollUtils.ts no contiene literales 1.5, 2.0, 3.0, 8, 48 — todos vienen del LegalParamSet recibido como argumento.
2. npm test pasa sin regresiones.
3. Calcular con OT_FACTOR=2.0 en params produce horas extra al doble.
**Status:** Completed

### Phase 57: Enterprise Config — Campos Faltantes
**Goal:** Agregar minuteRoundingPolicy, roundingPolicyAcknowledged, isCommercialActivity y ordinaryShiftType a vpg_enterprise con UI de configuración.
**Requirements:** PAY-22
**Success Criteria:**
1. Enums MinuteRoundingPolicy y ShiftType existen en schema.prisma con migración generada.
2. PATCH /enterprise/config persiste los nuevos campos.
3. Seleccionar NEAREST_QUARTER en UI muestra modal legal y registra acknowledgment en vpg_audit_logs.
**Status:** Complete (2026-04-26)

**Plans:**
- [x] 57-01-PLAN.md — Wave 1: Schema & Migration
- [x] 57-02-PLAN.md — Wave 2: Backend API & Service
- [x] 57-03-PLAN.md — Wave 3: Frontend UI & Compliance Modal

### Phase 58: Redondeo de Minutos en Motor
**Goal:** Implementar las 3 modalidades de redondeo (EXACT, ALWAYS_UP, NEAREST_QUARTER) en payrollUtils.ts.
**Requirements:** PAY-23
**Success Criteria:**
1. applyMinuteRounding(431, 'ALWAYS_UP') retorna 7.25.
2. applyMinuteRounding(424, 'NEAREST_QUARTER') retorna 7.00 (4 min descartados).
3. npm test pasa con todos los casos del Payroll.md §4.
**Status:** Complete (2026-04-26)

**Plans:**
- [x] 58-01-PLAN.md — Technical base & LegalParamService (Wave 1)
- [x] 58-02-PLAN.md — Engine integration & Unit Tests (Wave 2)

### Phase 59: Tarifa Mínima Global (Opcional)
**Goal:** Añadir un parámetro global en vpg_legal_params para definir una tarifa mínima por hora de referencia. Esto simplifica la administración para el cliente, evitando el uso de un catálogo complejo de categorías ocupacionales del MTSS.
**Requirements:** PAY-24
**Success Criteria:**
1. vpg_legal_params incluye el parámetro GLOBAL_MIN_WAGE_RATE con los valores del decreto MTSS (2024, 2025).
2. LegalParamService.getGlobalMinWageRate(date) retorna el valor correcto.
**Status:** Completed

**Plans:** 2 plans
- [x] 59-01-PLAN.md — Seed del parámetro GLOBAL_MIN_WAGE_RATE en vpg_legal_params (Wave 1)
- [x] 59-02-PLAN.md — getGlobalMinWageRate en LegalParamService (Wave 2)

### Phase 60: Advertencia de Tarifa Mínima en Planilla
**Goal:** Proveer validación visual y auditoría (no bloqueante) si un empleado gana menos del salario mínimo global. Incluye toggle MIN_WAGE_CHECK_ENABLED.
**Requirements:** PAY-25
**Success Criteria:**
1. El Wizard del frontend muestra advertencias visuales si un empleado está bajo el mínimo (si el toggle está activo).
2. Aprobar planilla con advertencias registra el evento en vpg_audit_logs.
3. MIN_WAGE_CHECK_ENABLED=0 omite validaciones y logs de auditorÃ­a por este motivo.
**Status:** Completed


**Plans:** 3 plans
- [x] 60-01-PLAN.md â€” Infraestructura: legalParamService + Hook extension + Backend Audit (Wave 1)      
- [x] 60-02-PLAN.md â€” UI: Advertencias visuales en el Payroll Wizard (Wave 2)
- [x] 60-03-PLAN.md â€” ConfiguraciÃ³n: Toggle UI en Enterprise Config (Wave 2)


### Phase 61: Alertas Persistentes Parámetros Legales
**Goal:** Cada cambio a vpg_legal_params genera alerta persistente en dashboard visible para admins hasta ser marcada como revisada. Mensajes específicos por parámetro desactivado.
**Requirements:** PAY-26
**Success Criteria:**
1. Modificar OT_FACTOR crea notificación LEGAL_PARAM_CHANGE para todos los usuarios admin/payroll_manager.
2. Banner en dashboard aparece y desaparece al marcar como revisado.
3. Cambiar MIN_WAGE_CHECK_ENABLED a 0 muestra mensaje "Verificación de salario mínimo DESACTIVADA".
**Status:** Not Started

### Phase 62: Confirmación Contraseña Params Críticos
**Goal:** Modificar cualquier parámetro con isCritical=true requiere re-ingreso de contraseña antes de guardar.
**Requirements:** PAY-27
**Success Criteria:**
1. PATCH /legal-params/OT_FACTOR sin confirmationPassword retorna 400.
2. Con contraseña incorrecta retorna 403 y el valor no cambia en BD.
3. Con contraseña correcta guarda el valor y registra password_confirmed:true en vpg_audit_logs.
**Status:** Not Started

### Phase 63: Panel Admin Parámetros Legales UI
**Goal:** Página dedicada /pages/configuracion/parametros-legales/ para ver, editar e historializar todos los parámetros legales.
**Requirements:** PAY-28
**Success Criteria:**
1. Admin puede navegar a la página y ver todos los params agrupados por categoría.
2. Editar un param crítico abre PasswordConfirmModal antes de guardar.
3. Non-admin recibe redirect/403.
4. Modal de historial muestra timeline de cambios de un parámetro.
**Status:** Not Started

### Phase 64: Snapshot de Params en Planilla Cerrada
**Goal:** Cada planilla aprobada captura en BD los valores exactos de los parámetros legales vigentes en su período para trazabilidad CCSS/MTSS.
**Requirements:** PAY-29
**Success Criteria:**
1. Aprobar una planilla crea registros en vpg_payroll_param_snapshots por cada parámetro.
2. Detalle de planilla muestra sección "Parámetros utilizados" con valores históricos.
3. Planilla histórica muestra snapshot correcto aunque los parámetros actuales sean distintos.
**Status:** Not Started

### Phase 65: Proyección de Aguinaldo en UI
**Goal:** Perfil de empleado y wizard de planilla muestran aguinaldo acumulado proporcional en tiempo real.
**Requirements:** PAY-30
**Success Criteria:**
1. GET /employees/:id/aguinaldo retorna accrued calculado correctamente.
2. Perfil de empleado muestra card con monto acumulado y barra de progreso del año.
3. Wizard paso 3 muestra columna "Aguinaldo acum." por empleado.
**Status:** Not Started

### Phase 66: Soporte Jornadas Mixtas y Nocturnas
**Goal:** El motor aplica el cap de horas correcto (6/7/8) según el tipo de jornada asignado al empleado individualmente.
**Requirements:** PAY-31
**Success Criteria:**
1. Empleado con shift_type=NOCTURNA: 7h trabajadas produce 6h regular + 1h OT.
2. Empleado con USE_ENTERPRISE_DEFAULT hereda el ShiftType de vpg_enterprise.
3. npm test pasa con los 6 escenarios de jornada definidos en 66-CONTEXT.md.
**Status:** Not Started

### Phase 52: UI de Drag and Drop para Ventanas de Tiempo por Empleado
**Goal:** Allow administrators to intuitively manage, assign, and visualize time windows per employee through a drag-and-drop interface within the sidebar views.
**Requirements:** UX-13
**Success Criteria:**
1. Administrators can interact with graphical time blocks mapped to employees.
2. Interface updates sync to backend settings reliably.
**Status:** Not Started
through a drag-and-drop interface within the sidebar views.
**Requirements:** UX-13
**Success Criteria:**
1. Administrators can interact with graphical time blocks mapped to employees.
2. Interface updates sync to backend settings reliably.
**Status:** Not Started
