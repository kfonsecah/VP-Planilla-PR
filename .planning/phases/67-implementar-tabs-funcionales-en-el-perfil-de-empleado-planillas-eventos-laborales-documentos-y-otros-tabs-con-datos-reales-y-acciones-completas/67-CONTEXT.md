# Phase 67 Context: Tabs Funcionales en el Perfil de Empleado

**Phase:** 67-implementar-tabs-funcionales-en-el-perfil-de-empleado
**Milestone:** v1.7
**Status:** Not Started

## Objective

Convertir los tabs `Planillas`, `Eventos` y `Documentos` del perfil de empleado de placeholders vacíos a vistas funcionales con datos reales. El tab `Aguinaldo` y `Resumen` ya están implementados y no se tocan.

## Estado Actual

En `src/frontend/src/app/pages/employee/[id]/page.tsx`:

- **Resumen** ✅ — implementado (`ProfileSummaryTab`)
- **Aguinaldo** ✅ — implementado (stats + progress bar)
- **Planillas** ❌ — muestra "Historial de planillas próximamente"
- **Eventos** ❌ — muestra "Eventos laborales próximamente"
- **Documentos** ❌ — muestra "Documentos próximamente"

Los tabs están definidos en `EmployeeProfileTabs.tsx` como `ProfileTab = 'resumen' | 'planillas' | 'eventos' | 'documentos' | 'aguinaldo'`.

## Scope

### In Scope

**Tab: Planillas**
- Tabla con historial de planillas donde el empleado participó (join `vpg_payroll_employee` → `vpg_payrolls`)
- Columnas: período, tipo, estado (badge), salario bruto, deducciones, salario neto, horas totales
- Acción: botón para descargar comprobante de pago (ruta existente `GET /api/payment-receipts/:payrollId/employee/:employeeId`)
- Backend: nuevo endpoint `GET /api/employees/:id/payrolls` en `EmployeeController` / `EmployeeService`

**Tab: Eventos Laborales**
- Lista de eventos asignados al empleado (`vpg_employee_labor_event` filtrado por `employee_id`)
- Columnas: nombre del evento, fecha inicio, fecha fin, estado
- Acciones: asignar nuevo evento (modal), eliminar asignación existente
- Backend: `LaborEventsService.getAllEmployeeLaborEvents()` ya existe pero devuelve todos — agregar método filtrado por `employee_id`
- Nueva ruta `GET /api/labor-events/employee/:id`

**Tab: Documentos**
- No existe tabla `vpg_documents` en el schema actual
- Implementar tabla simple en BD: `vpg_employee_documents` (id, employee_id, nombre, tipo, url/path, fecha_subida)
- UI: lista de documentos con opción de agregar (nombre + tipo) y eliminar
- Scope mínimo: CRUD básico de referencias de documentos (sin upload de archivos binarios en esta fase)

### Out of Scope
- Subir archivos binarios reales al servidor (FileSystem / S3) — solo metadata por ahora
- Cambiar los tabs `Resumen` o `Aguinaldo`
- Paginación en las listas (se implementa cuando haya volumen suficiente)

## Arquitectura

### Backend — Nuevos endpoints

```
GET  /api/employees/:id/payrolls              → historial de planillas del empleado
GET  /api/labor-events/employee/:id           → eventos laborales del empleado
POST /api/employees/:id/documents             → agregar documento
GET  /api/employees/:id/documents             → listar documentos
DELETE /api/employees/:id/documents/:docId   → eliminar documento
```

Todos con `asyncHandler` + `AuthMiddleware.verifyToken`.

### Backend — Nuevos métodos de servicio

| Servicio | Método nuevo |
|----------|-------------|
| `EmployeeService` | `getPayrollsByEmployee(employeeId)` → join `vpg_payroll_employee` + `vpg_payrolls` |
| `LaborEventsService` | `getLaborEventsByEmployee(employeeId)` → filter `vpg_employee_labor_event` por `employee_id` |
| `EmployeeDocumentService` (nuevo) | `create`, `getAll`, `delete` sobre `vpg_employee_documents` |

### Schema — Nueva tabla

```prisma
model vpg_employee_documents {
  employee_document_id          Int       @id @default(autoincrement())
  employee_document_employee_id Int
  employee_document_name        String    @db.VarChar(255)
  employee_document_type        String    @db.VarChar(100)
  employee_document_url         String?   @db.Text
  employee_document_uploaded_at DateTime  @default(now())
  vpg_employees                 vpg_employees @relation(fields: [employee_document_employee_id], references: [employee_id], onDelete: Cascade)

  @@index([employee_document_employee_id])
}
```

### Frontend — Nuevos componentes

| Componente | Responsabilidad |
|------------|----------------|
| `EmployeePayrollsTab.tsx` | Tabla de historial de planillas del empleado |
| `EmployeeEventsTab.tsx` | Lista + modal de asignación de eventos laborales |
| `EmployeeDocumentsTab.tsx` | Lista + modal para agregar documento |

### Frontend — Nuevos hooks / servicios

- `useEmployeePayrolls(employeeId)` → llama `GET /api/employees/:id/payrolls`
- `useEmployeeEvents(employeeId)` → llama `GET /api/labor-events/employee/:id`
- `useEmployeeDocuments(employeeId)` → llama `GET/POST/DELETE /api/employees/:id/documents`

Cada hook sigue el patrón `{ data, isLoading, error, ...actions }`.

## Datos disponibles en `vpg_payroll_employee`

```
payroll_employee_total_hours
payroll_employee_overtime_hours
payroll_employee_overtime_pay
payroll_employee_gross_salary
payroll_employee_total_deductions
payroll_employee_net_salary
payroll_employee_is_manually_adjusted
```

Join con `vpg_payrolls` para obtener: período inicio/fin, estado, tipo de planilla.

## Plan Breakdown

| Plan | Descripción | Dependencias |
|------|-------------|-------------|
| 67-01 | Schema `vpg_employee_documents` + migración + `EmployeeDocumentService` + rutas | — |
| 67-02 | `EmployeeService.getPayrollsByEmployee` + ruta + `LaborEventsService.getLaborEventsByEmployee` + ruta | — |
| 67-03 | Frontend: hooks + servicios para los 3 tabs nuevos | 67-01, 67-02 |
| 67-04 | Frontend: componentes `EmployeePayrollsTab`, `EmployeeEventsTab`, `EmployeeDocumentsTab` + integración en page.tsx | 67-03 |

## Dependencies

- **Requiere:** Fase 45 (rediseño perfil empleado — estructura de tabs ya existe)
- **Requiere:** Fase 43 (gestión de eventos laborales — catálogo y asignación ya existen)
- **No tiene dependientes directos**

## Constraints

- `npx tsc --noEmit` pasa en `src/backend/` y `src/frontend/`
- `npx next lint` pasa
- `npm test` pasa sin regresiones (546+ tests)
- Nueva tabla sigue convención `vpg_` prefix + `snake_case`
- Todos los endpoints usan `asyncHandler` + `AuthMiddleware.verifyToken`
- Todos los API calls en frontend pasan por `http.ts` — nunca `fetch` directo
- Modales usan `AnimatePresence` + `motion.div`
- Formularios usan `react-hook-form` + `zodResolver`
