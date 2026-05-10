# Phase 67: Tabs Funcionales en el Perfil de Empleado — Research

**Researched:** 2026-05-09
**Domain:** Employee profile UI, Express REST endpoints, Prisma ORM, Next.js component architecture
**Confidence:** HIGH

## Summary

Phase 67 converts three placeholder tabs (Planillas, Eventos, Documentos) in the employee profile page into fully functional views. All upstream dependencies are verified in place: the tab shell (`EmployeeProfileTabs.tsx`, `ProfileTab` type) exists and works, `vpg_payroll_employee` and `vpg_employee_labor_event` tables have the exact fields needed, and — critically — `vpg_employee_documents` already exists in the database from the `0_init` migration with a different shape than what CONTEXT.md proposed. No new Prisma migration is needed for the documents table; the planner must adapt the service to the real schema.

The backend work is three new service methods (two short additions to existing services, one new service) and five new routes, all following the established `asyncHandler` + `AuthMiddleware.verifyToken` pattern. The frontend work is three new tab components + three new hooks + service additions, each following the `useAguinaldo` / `aguinaldoService` pattern exactly.

**Primary recommendation:** Start with the backend (Plan 01: documents service, Plan 02: payroll + events methods), then wire the frontend (Plan 03: hooks + services, Plan 04: components + page integration). No schema migrations needed.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Tab Planillas: tabla historial de planillas via join `vpg_payroll_employee` → `vpg_payrolls`. Columnas: período, tipo, estado (badge), salario bruto, deducciones, salario neto, horas totales. Acción: descargar comprobante (`GET /api/payment-receipts/:payrollId/employee/:employeeId`).
- Backend: nuevo endpoint `GET /api/employees/:id/payrolls` en `EmployeeController` / `EmployeeService`
- Tab Eventos: lista de eventos del empleado filtrada por `employee_id`. Columnas: nombre, fecha inicio, fecha fin, estado. Acciones: asignar nuevo (modal), eliminar asignación.
- Backend: `LaborEventsService.getLaborEventsByEmployee(employeeId)` + nueva ruta `GET /api/labor-events/employee/:id`
- Tab Documentos: CRUD básico sin upload de archivos binarios. UI: lista + modal para agregar (nombre + tipo) + eliminar.
- Todos los endpoints usan `asyncHandler` + `AuthMiddleware.verifyToken`
- Todos los API calls en frontend pasan por `http.ts`
- Modales usan `AnimatePresence` + `motion.div`
- Formularios usan `react-hook-form` + `zodResolver`

### Claude's Discretion
- Nombre de los tipos TypeScript para el response de `getPayrollsByEmployee`
- Orden exacto de columnas dentro del tab Planillas (badge styling)
- Empty-state copy dentro de los tres tabs nuevos
- Si el modal de asignación de eventos en `EmployeeEventsTab` reutiliza el `LaborEventModal` existente (con `employee_id` pre-fijado) o es un modal más simple

### Deferred Ideas (OUT OF SCOPE)
- Subir archivos binarios al servidor (FileSystem / S3)
- Cambiar tabs Resumen o Aguinaldo
- Paginación en las listas
</user_constraints>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Historial de planillas del empleado | API / Backend | Database | Join `vpg_payroll_employee` → `vpg_payrolls`; lógica de filtrado y serialización en servicio |
| Descarga de comprobante PDF | API / Backend (existente) | — | `PaymentReceiptRoute` ya provee el endpoint; frontend solo necesita link con los IDs correctos |
| Eventos laborales por empleado | API / Backend | Database | Filtrado con `WHERE employee_labor_event_employee_id = ?`; catálogo join ya demostrado en `getAllEmployeeLaborEvents` |
| Asignación de evento en perfil | Frontend + API | — | El modal reutiliza el endpoint existente `POST /api/labor-events/assign`; la nueva ruta `GET /api/labor-events/employee/:id` es de lectura |
| CRUD de documentos | API / Backend (nuevo servicio) + Database | — | `EmployeeDocumentService` opera sobre tabla existente `vpg_employee_documents` |
| Tab rendering | Frontend (componentes) | — | Tres nuevos componentes `Employee*Tab.tsx`; la página solo pasa `employeeId` como prop |
| Estado / fetch por tab | Frontend (hooks) | — | Tres hooks `use*` siguen el patrón `useAguinaldo` — fetch en mount, re-fetch en acción |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma ORM | ^6.14.0 | Consultas DB + migraciones | [VERIFIED: schema.prisma] Todos los modelos usan Prisma; singleton `import { prisma } from '../lib/prisma'` |
| TypeScript | 5.8.3 / 5.9.3 | Tipado estricto backend/frontend | [VERIFIED: CLAUDE.md] No `any` en firmas de métodos públicos |
| Express 5 | 5.1.0 | Rutas HTTP + middleware | [VERIFIED: index.ts] Patrón `router.use(AuthMiddleware.verifyToken)` + `asyncHandler` |
| Next.js 15 | 15.5.6 | Frontend SSR + routing | [VERIFIED: CLAUDE.md] `"use client"` en componentes interactivos |
| React 19 | 19.0.0 | UI components | [VERIFIED: CLAUDE.md] `React.FC<Props>` + props interface en mismo archivo |
| react-hook-form | ^7.62.0 | Formulario del modal documentos | [VERIFIED: CLAUDE.md] Obligatorio para todos los formularios |
| Zod | ^4.0.17 | Validación schema del formulario | [VERIFIED: CLAUDE.md] Siempre con `zodResolver` |
| framer-motion | ^12.x | Animaciones de modales | [VERIFIED: LaborEventModal.tsx] Patrón `AnimatePresence` + `motion.div` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @heroicons/react | 24/outline | Iconos en tab components | Igual que en ProfileSummaryTab y page.tsx |
| sonner (toast) | (ya instalado) | Notificaciones de éxito/error en acciones | Tras create/delete documentos, delete evento |
| formatCRC | utils/number.ts | Formatear montos en planillas tab | `import { formatCRC } from '@/utils/number'` |
| formatDateDisplay | utils/formatters.ts | Formatear fechas en los tres tabs | `import { formatDateDisplay } from '@/utils/formatters'` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reutilizar `LaborEventModal` con `employee_id` pre-fijado | Modal simple ad-hoc | El modal existente pide selección de empleado — pre-fijar `employee_id` + ocultar el selector es más simple que duplicar; recomendado |
| Nuevo endpoint `DELETE /api/labor-events/employee/:id` | Reutilizar endpoint existente (no existe DELETE por assignment id en ruta) | El controller `deleteEmployeeLaborEvent` ya existe pero NO está registrado en `LaborEventsRoute.ts`; hay que añadir la ruta |

---

## Critical Finding: vpg_employee_documents ya existe en DB

[VERIFIED: 0_init/migration.sql + schema.prisma]

La tabla `vpg_employee_documents` fue creada en la migración inicial y ya existe en la base de datos real. Su esquema actual es:

```sql
CREATE TABLE "vpg_employee_documents" (
  "employee_documents_id"           SERIAL PRIMARY KEY,
  "employee_documents_employee_id"  INTEGER NOT NULL,
  "employee_documents_file_path"    VARCHAR(255) NOT NULL,   -- nombre o path del doc
  "employee_documents_document_type" VARCHAR(50) NOT NULL,
  "employee_documents_uploaded_at"  TIMESTAMP(6) NOT NULL
);
```

El modelo Prisma en `schema.prisma` ya lo refleja exactamente. El modelo TypeScript `src/backend/src/model/employeeDocuments.ts` también existe:

```typescript
export interface EmployeeDocument {
  id: number;
  employee_id: number;
  file_path: string;       // usado como "nombre" del documento en scope mínimo
  document_type: string;
  uploaded_at: Date;
  version: number;         // NOTE: campo "version" NO existe en la tabla real
}
```

**Implicacion para el planner:** El campo `version` del interface no existe en la tabla. El `EmployeeDocumentService` debe usar los campos reales: `employee_documents_file_path` (se usará como nombre del documento), `employee_documents_document_type`, `employee_documents_uploaded_at`. NO se necesita migración. El scope de "nombre + tipo" del CONTEXT.md se mapea como: nombre → `file_path`, tipo → `document_type`.

**NO hay campo `employee_document_name` separado.** El `file_path` cumple ese rol en el scope mínimo (no hay upload binario).

---

## Architecture Patterns

### System Architecture Diagram

```
Perfil empleado (page.tsx)
        |
        +---> [activeTab === 'planillas'] --> EmployeePayrollsTab (employeeId)
        |             |                              |
        |         useEmployeePayrolls(id)        employeeService.getPayrollsByEmployee(id)
        |                                            |
        |                             GET /api/employees/:id/payrolls
        |                                            |
        |                             EmployeeController.getPayrollsByEmployee
        |                                            |
        |                             EmployeeService.getPayrollsByEmployee(id)
        |                                            |
        |                         prisma.vpg_payroll_employee.findMany({
        |                           where: { payroll_employee_employee_id: id },
        |                           include: { vpg_payrolls: true }
        |                         })
        |
        +---> [activeTab === 'eventos']  --> EmployeeEventsTab (employeeId)
        |             |                              |
        |         useEmployeeEvents(id)          laborEventsService.getByEmployee(id)
        |                                            |
        |                             GET /api/labor-events/employee/:id
        |                                            |
        |                             LaborEventsController.getLaborEventsByEmployee
        |                                            |
        |                             LaborEventsService.getLaborEventsByEmployee(id)
        |                              (filtro de getAllEmployeeLaborEvents existente)
        |
        +---> [activeTab === 'documentos'] --> EmployeeDocumentsTab (employeeId)
                      |                              |
                  useEmployeeDocuments(id)       employeeDocumentService.*
                                                     |
                                    GET  /api/employees/:id/documents
                                    POST /api/employees/:id/documents
                                    DELETE /api/employees/:id/documents/:docId
                                                     |
                                    EmployeeController.{getDocuments, createDocument, deleteDocument}
                                                     |
                                    EmployeeDocumentService.{getAll, create, delete}
                                                     |
                                    prisma.vpg_employee_documents.*
```

### Recommended Project Structure

```
src/backend/src/
├── service/
│   ├── EmployeeService.ts          # + getPayrollsByEmployee(employeeId)
│   ├── LaborEventsService.ts       # + getLaborEventsByEmployee(employeeId)
│   └── EmployeeDocumentService.ts  # NUEVO: create, getAll, delete
├── controller/
│   ├── EmployeeController.ts       # + getPayrollsByEmployee, getDocuments, createDocument, deleteDocument
│   └── LaborEventsController.ts    # + getLaborEventsByEmployee, deleteEmployeeLaborEvent (ruta faltante)
├── routes/
│   ├── EmployeeRoute.ts            # + GET /:id/payrolls, GET/POST/DELETE /:id/documents
│   └── LaborEventsRoute.ts         # + GET /employee/:id, DELETE /assign/:id (ya existia en controller)

src/frontend/src/
├── hooks/
│   ├── useEmployeePayrolls.ts      # NUEVO
│   ├── useEmployeeEvents.ts        # NUEVO
│   └── useEmployeeDocuments.ts     # NUEVO
├── services/
│   ├── employeeService.ts          # + getPayrollsByEmployee()
│   ├── laborEventsService.ts       # + getByEmployee(), deleteAssignment()
│   └── employeeDocumentService.ts  # NUEVO: getAll, create, delete
├── components/
│   ├── EmployeePayrollsTab.tsx     # NUEVO
│   ├── EmployeeEventsTab.tsx       # NUEVO
│   └── EmployeeDocumentsTab.tsx    # NUEVO
├── types/
│   └── employeeDocument.ts         # NUEVO: EmployeeDocument interface frontend
```

### Pattern 1: Hook Pattern (useAguinaldo exacto)

Todos los hooks nuevos siguen este patrón verificado:

```typescript
// Source: src/frontend/src/hooks/useAguinaldo.ts [VERIFIED]
import { useState, useEffect, useCallback } from 'react';
import { someService } from '@/services/someService';
import { SomeType } from '@/types/someType';

export function useEmployeePayrolls(employeeId: number | string | undefined) {
  const [data, setData] = useState<EmployeePayrollRow[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await employeeService.getPayrollsByEmployee(Number(employeeId));
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando planillas');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, isLoading, error, refresh: fetch };
}
```

Para `useEmployeeDocuments` que tiene mutaciones, agregar actions:

```typescript
// Retorna:
return { data, isLoading, error, refresh, createDocument, deleteDocument };
// createDocument y deleteDocument son useCallback que llaman al servicio y luego refresh()
```

### Pattern 2: Service Pattern (aguinaldoService exacto)

```typescript
// Source: src/frontend/src/services/aguinaldoService.ts [VERIFIED]
import { http } from './http';

export const employeeDocumentService = {
  getAll: (employeeId: number): Promise<EmployeeDocument[]> =>
    http.get(`/employees/${employeeId}/documents`),

  create: (employeeId: number, data: { file_path: string; document_type: string }): Promise<EmployeeDocument> =>
    http.post(`/employees/${employeeId}/documents`, data),

  delete: (employeeId: number, docId: number): Promise<void> =>
    http.delete(`/employees/${employeeId}/documents/${docId}`),
};
```

**Note:** `http.get/post/delete` ya maneja el Bearer token, error parsing, y el unwrapping de `{ success: true, data: ... }`. [VERIFIED: http.ts lines 280-288]

### Pattern 3: Backend Service Method (LaborEventsService exacto)

```typescript
// Pattern tomado de getAllEmployeeLaborEvents [VERIFIED: LaborEventsService.ts:111]
static async getLaborEventsByEmployee(employeeId: number): Promise<EmployeeLaborEvent[]> {
  const prismaEvents = await prisma.vpg_employee_labor_event.findMany({
    where: { employee_labor_event_employee_id: employeeId },
    include: { vpg_labor_events: true },
    orderBy: { employee_labor_event_start_date: 'desc' },
  });

  return prismaEvents.map((pe) => ({
    id: pe.employee_labor_event_id,
    employee_id: pe.employee_labor_event_employee_id,
    labor_event_id: pe.employee_labor_event_labor_event_id,
    start_date: pe.employee_labor_event_start_date,
    end_date: pe.employee_labor_event_end_date,
    status: pe.employee_labor_event_status,
    version: pe.employee_labor_event_version,
    labor_event_name: pe.vpg_labor_events?.labor_events_name || null,
    labor_event_description: pe.vpg_labor_events?.labor_events_description || null,
  } as any));
}
```

### Pattern 4: Backend Route Registration

```typescript
// Pattern de EmployeeRoute.ts [VERIFIED]
router.get("/employees/:id/payrolls", asyncHandler(EmployeeController.getPayrollsByEmployee));
router.get("/employees/:id/documents", asyncHandler(EmployeeController.getDocuments));
router.post("/employees/:id/documents", asyncHandler(EmployeeController.createDocument));
router.delete("/employees/:id/documents/:docId", asyncHandler(EmployeeController.deleteDocument));
```

La ruta `GET /api/labor-events/employee/:id` va en `LaborEventsRoute.ts`:
```typescript
router.get("/labor-events/employee/:id", asyncHandler(LaborEventsController.getLaborEventsByEmployee));
```

**IMPORTANTE:** El método `deleteEmployeeLaborEvent` ya existe en `LaborEventsController` [VERIFIED: LaborEventsController.ts:162] pero NO está registrado en `LaborEventsRoute.ts`. Hay que añadir:
```typescript
router.delete("/labor-events/assign/:id", asyncHandler(LaborEventsController.deleteEmployeeLaborEvent));
```

### Pattern 5: Modal de Asignación de Evento (reutilizar LaborEventModal)

`LaborEventModal` [VERIFIED: LaborEventModal.tsx:18-25] recibe:
- `employees: Employee[]` — pasar array con solo el empleado actual
- `laborEventCatalog: LaborEvent[]` — necesita el catálogo completo
- `employee_id` se pre-fija en el reset del form

Estrategia recomendada: En `EmployeeEventsTab`, pasar `employees={[currentEmployee]}` para que el selector muestre solo ese empleado pre-seleccionado. El catálogo se obtiene con `http.get('/labor-events')` que ya devuelve `{ laborEvents, employeeEvents }`.

### Pattern 6: Tab Layout (ProfileSummaryTab pattern)

Todos los tabs nuevos deben seguir el layout de tarjeta verificado en `ProfileSummaryTab.tsx`:

```tsx
// Container con border-b header [VERIFIED: ProfileSummaryTab.tsx:72-74]
<div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
  <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <SomeIcon className="w-4 h-4 text-green-700 dark:text-green-400" />
      <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
        Título Sección
      </h3>
    </div>
    {/* Acción opcional a la derecha */}
  </div>
  <div className="p-5">
    {/* Contenido */}
  </div>
</div>
```

### Anti-Patterns to Avoid

- **No usar `new PrismaClient()`** — siempre `import { prisma } from '../lib/prisma'` [VERIFIED: CLAUDE.md]
- **No `fetch` directo en componentes** — toda llamada pasa por `http.ts` [VERIFIED: CLAUDE.md]
- **No useState para campos de formulario** — siempre `react-hook-form` [VERIFIED: CLAUDE.md]
- **No importar LaborEventModal con empleados de toda la empresa** — filtrar a `[currentEmployee]`
- **No crear nueva tabla `vpg_employee_documents`** — ya existe; usar esquema real

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP con auth + token refresh | fetch() directo | `http.ts` | Ya maneja Bearer token, 401/refresh, error parsing, `{ data: ... }` unwrap |
| Animaciones de modal | CSS transitions | `AnimatePresence` + `motion.div` | Patrón establecido en LaborEventModal, EditEmployeeModal |
| Formateo de montos CRC | `toLocaleString` inline | `formatCRC` de `@/utils/number` | Consistencia visual en todo el sistema |
| Formateo de fechas | `new Date().toLocaleDateString()` inline | `formatDateDisplay` de `@/utils/formatters` | Ya maneja UTC, locale es-CR, undefined/null |
| Validación de formulario | if/else manual | Zod schema + `zodResolver` | Requerido por CLAUDE.md; reutilizar patrón de LaborEventModal |
| Delete confirmation | `window.confirm()` personalizado | `window.confirm()` | LaborEventModal ya usa este patrón; mantener consistencia |

**Key insight:** El 90% de la infraestructura ya existe. Los tres tabs son principalmente wiring: conectar datos existentes a componentes UI nuevos.

---

## Common Pitfalls

### Pitfall 1: vpg_employee_documents schema mismatch
**What goes wrong:** El CONTEXT.md propone campos `employee_document_name`, `employee_document_url`, `employee_document_uploaded_at` con convención diferente. El schema REAL usa `employee_documents_file_path`, `employee_documents_document_type`, `employee_documents_uploaded_at` — sin campo `name` separado y sin `url`.
**Why it happens:** La tabla fue diseñada para file paths, no para metadata standalone.
**How to avoid:** El `EmployeeDocumentService` debe usar los campos reales del Prisma model `vpg_employee_documents`. El "nombre" del documento se guarda en `employee_documents_file_path` (en el scope mínimo sin upload real).
**Warning signs:** TypeScript error en `prisma.vpg_employee_documents.create({ data: { employee_document_name: ... } })` — ese campo no existe.

### Pitfall 2: deleteEmployeeLaborEvent endpoint faltante
**What goes wrong:** El Tab Eventos necesita eliminar asignaciones. `LaborEventsController.deleteEmployeeLaborEvent` existe pero la ruta `DELETE /labor-events/assign/:id` NO está registrada en `LaborEventsRoute.ts`.
**Why it happens:** El método fue añadido al controller pero nunca se terminó de registrar.
**How to avoid:** Añadir `router.delete("/labor-events/assign/:id", asyncHandler(LaborEventsController.deleteEmployeeLaborEvent))` en `LaborEventsRoute.ts` como parte del Plan 02.
**Warning signs:** 404 al intentar eliminar una asignación de evento desde el tab.

### Pitfall 3: Confundir la ruta /employee vs /employees en backend
**What goes wrong:** El backend actual usa `/employee/:id` (singular) para el CRUD de empleado, pero usa `/employees/:id/aguinaldo` (plural) para el endpoint de aguinaldo. Los nuevos endpoints del perfil deben usar `/employees/:id/...` (plural) por consistencia con el patrón existente.
**Why it happens:** Inconsistencia histórica en el naming de rutas.
**How to avoid:** Seguir el patrón de `EmployeeRoute.ts` línea 192: `router.get("/employees/:id/aguinaldo", ...)` — plural para sub-recursos por empleado.
**Warning signs:** 404 si se usa `/employee/:id/payrolls` en lugar de `/employees/:id/payrolls`.

### Pitfall 4: getAllEmployeeLaborEvents devuelve TODOS los eventos
**What goes wrong:** El `EmployeeEventsTab` usa `getAllEmployeeLaborEvents()` sin filtro y muestra todos los eventos de todos los empleados.
**Why it happens:** No existe todavía un método filtrado por `employee_id`.
**How to avoid:** Crear `getLaborEventsByEmployee(employeeId)` que agrega `where: { employee_labor_event_employee_id: employeeId }` al query.

### Pitfall 5: Descargar comprobante cuando planilla está en BORRADOR
**What goes wrong:** El botón de comprobante aparece para planillas en estado BORRADOR, que puede no tener datos completos o generar un PDF vacío.
**Why it happens:** El tab Planillas muestra todas las planillas del empleado sin distinguir estado.
**How to avoid:** Mostrar el botón de descarga solo cuando `payroll.status === 'APROBADA' || payroll.status === 'PAGADA'`. Para BORRADOR, mostrar un badge de estado sin acción de descarga.

### Pitfall 6: version field en EmployeeDocument model
**What goes wrong:** `src/backend/src/model/employeeDocuments.ts` declara `version: number` pero la tabla `vpg_employee_documents` NO tiene columna `version`.
**Why it happens:** El modelo fue escrito anticipando el campo pero la tabla no lo incluye.
**How to avoid:** No incluir `version` en el payload de create ni en el type response. Corregir el interface o ignorar ese campo.

---

## Key Data Shapes

### getPayrollsByEmployee — Response Shape

```typescript
// Cada fila que devuelve el join vpg_payroll_employee + vpg_payrolls:
interface EmployeePayrollRow {
  payroll_id: number;                    // vpg_payrolls.payrolls_id
  period_start: Date;                    // vpg_payrolls.payrolls_period_start
  period_end: Date;                      // vpg_payrolls.payrolls_period_end
  status: 'BORRADOR' | 'APROBADA' | 'PAGADA';  // PayrollStatus enum
  payroll_type_id: number;               // vpg_payrolls.payrolls_payroll_type_id
  period_type: string;                   // 'quincenal' | 'mensual' | 'rango_libre'
  total_hours: number | null;            // payroll_employee_total_hours
  overtime_hours: number | null;         // payroll_employee_overtime_hours
  gross_salary: number;                  // payroll_employee_gross_salary
  total_deductions: number;              // payroll_employee_total_deductions
  net_salary: number;                    // payroll_employee_net_salary
  is_manually_adjusted: boolean;         // payroll_employee_is_manually_adjusted
}
```

### getLaborEventsByEmployee — Response Shape

```typescript
// Idéntico a getAllEmployeeLaborEvents pero filtrado:
interface EmployeeLaborEventRow {
  id: number;
  employee_id: number;
  labor_event_id: number;
  start_date: Date;
  end_date: Date | null;
  status: string;
  version: number;
  labor_event_name: string | null;        // del join vpg_labor_events
  labor_event_description: string | null;
}
```

### vpg_employee_documents — Real Prisma Shape

```typescript
// Lo que Prisma realmente puede guardar/leer:
prisma.vpg_employee_documents.create({
  data: {
    employee_documents_employee_id: employeeId,
    employee_documents_file_path: nombre,     // usamos como "nombre del documento"
    employee_documents_document_type: tipo,
    employee_documents_uploaded_at: new Date(),
  }
});
// Nota: NO existe employee_documents_version ni employee_documents_url ni employee_documents_name
```

---

## Code Examples

### Backend: EmployeeService.getPayrollsByEmployee

```typescript
// Source: Pattern de PayrollService.getAllPayrolls [VERIFIED: PayrollService.ts:46]
static async getPayrollsByEmployee(employeeId: number) {
  const rows = await prisma.vpg_payroll_employee.findMany({
    where: { payroll_employee_employee_id: employeeId },
    include: { vpg_payrolls: true },
    orderBy: { vpg_payrolls: { payrolls_period_start: 'desc' } },
  });

  return rows.map((r) => ({
    payroll_id: r.payroll_employee_payroll_id,
    period_start: r.vpg_payrolls.payrolls_period_start,
    period_end: r.vpg_payrolls.payrolls_period_end,
    status: r.vpg_payrolls.payrolls_status,
    period_type: r.vpg_payrolls.payrolls_period_type,
    total_hours: r.payroll_employee_total_hours ? Number(r.payroll_employee_total_hours) : null,
    overtime_hours: r.payroll_employee_overtime_hours ? Number(r.payroll_employee_overtime_hours) : null,
    gross_salary: Number(r.payroll_employee_gross_salary),
    total_deductions: Number(r.payroll_employee_total_deductions),
    net_salary: Number(r.payroll_employee_net_salary),
    is_manually_adjusted: r.payroll_employee_is_manually_adjusted,
  }));
}
```

### Backend: EmployeeDocumentService.create

```typescript
// Source: Schema real verificado en 0_init/migration.sql [VERIFIED]
static async create(employeeId: number, data: { file_path: string; document_type: string }) {
  const doc = await prisma.vpg_employee_documents.create({
    data: {
      employee_documents_employee_id: employeeId,
      employee_documents_file_path: data.file_path,
      employee_documents_document_type: data.document_type,
      employee_documents_uploaded_at: new Date(),
    },
  });
  return {
    id: doc.employee_documents_id,
    employee_id: doc.employee_documents_employee_id,
    file_path: doc.employee_documents_file_path,
    document_type: doc.employee_documents_document_type,
    uploaded_at: doc.employee_documents_uploaded_at,
  };
}
```

### Frontend: Botón de descarga de comprobante

```typescript
// Source: PaymentReceiptRoute.ts línea 44 [VERIFIED]
// El endpoint devuelve un PDF (Content-Type: application/pdf)
// http.ts solo maneja JSON, por lo tanto se debe usar http.raw() o window.open()
const downloadReceipt = (payrollId: number, employeeId: number) => {
  // Abrir en nueva pestaña dispara la descarga del PDF
  window.open(`${API_BASE}/payment-receipts/${payrollId}/employee/${employeeId}`, '_blank');
};
// O usar http.raw() con responseType blob si se necesita control fino
```

**Nota:** `http.get()` llama `requestJson()` que espera JSON. Para PDF binary, usar `http.raw()` o `window.open()`. Dado que el scope no requiere streaming, `window.open()` es suficiente.

### Frontend: Zod schema para modal de documentos

```typescript
// Source: Pattern de laborEventSchema [VERIFIED: LaborEventModal.tsx:58]
const documentSchema = z.object({
  file_path: z.string().min(1, 'El nombre del documento es requerido').max(255),
  document_type: z.string().min(1, 'El tipo es requerido').max(50),
});
type DocumentFormData = z.infer<typeof documentSchema>;
```

---

## Environment Availability

Step 2.6: SKIPPED — Phase 67 es puramente code/config changes sobre stack ya operativo (Node.js, PostgreSQL via Prisma, Next.js). No hay dependencias externas nuevas.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | El campo `version` en el modelo TypeScript `EmployeeDocument` no existe en la DB real | Critical Finding | Si la DB tiene `version`, el service fallaría al no incluirlo; verificar con `\d vpg_employee_documents` en psql |
| A2 | `window.open()` es suficiente para descargar el comprobante PDF | Code Examples | Si el endpoint requiere Authorization header (necesita Bearer token), `window.open()` fallará con 401. En ese caso usar `http.raw()` + Blob URL |

**Nota sobre A2:** El endpoint PDF usa `AuthMiddleware.verifyToken` [VERIFIED: PaymentReceiptRoute.ts:8]. `window.open()` no envía el Bearer token. La solución correcta es usar `http.raw()` para obtener el Blob y crear un Object URL. El planner debe asignar esta complejidad explícitamente.

---

## Open Questions

1. **Descarga de comprobante con auth**
   - Lo que sabemos: El endpoint `GET /api/payment-receipts/:payrollId/employee/:employeeId` requiere Bearer token (ruta usa `AuthMiddleware.verifyToken`)
   - Lo que no está claro: `window.open()` no envía el token. Necesita `http.raw()` + `URL.createObjectURL(blob)` + `a.click()`
   - Recomendación: El planner debe incluir este flujo explícitamente en el Plan 04 del componente `EmployeePayrollsTab`

2. **Tipo de planilla display**
   - Lo que sabemos: `vpg_payrolls.payrolls_payroll_type_id` es una FK a `vpg_payroll_types` con `name` como texto (ej: "Planilla Regular")
   - Lo que no está claro: ¿Incluir el join a `vpg_payroll_types` en el response o mostrar solo el period_type string?
   - Recomendación: Incluir `vpg_payroll_types: true` en el include del query para tener `payroll_type_name` disponible sin N+1

---

## Validation Architecture

**nyquist_validation: true** — Sección requerida.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + ts-jest |
| Config file | `src/backend/jest.config.js` |
| Quick run command | `npm test -- --testPathPattern="EmployeeDocument\|LaborEvents" --no-coverage` |
| Full suite command | `npm test` (546+ tests, 0 failures) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| 67-TAB-01 | `getPayrollsByEmployee(id)` devuelve solo las planillas del empleado correcto | unit | `npm test -- --testPathPattern="EmployeeService"` | ❌ Wave 0 |
| 67-TAB-02 | `getLaborEventsByEmployee(id)` filtra por employee_id e incluye nombre del evento | unit | `npm test -- --testPathPattern="LaborEventsService"` | ❌ Wave 0 |
| 67-TAB-03 | `EmployeeDocumentService.create` persiste con los campos reales de la tabla | unit | `npm test -- --testPathPattern="EmployeeDocumentService"` | ❌ Wave 0 |
| 67-TAB-04 | `EmployeeDocumentService.delete` elimina el documento correcto y lanza 404 si no existe | unit | `npm test -- --testPathPattern="EmployeeDocumentService"` | ❌ Wave 0 |
| 67-TAB-05 | `EmployeeDocumentService.getAll` devuelve solo documentos del employee_id solicitado | unit | `npm test -- --testPathPattern="EmployeeDocumentService"` | ❌ Wave 0 |
| 67-TAB-06 | Tab Planillas muestra fila por planilla con período, estado badge, salario neto | manual | Cargar perfil empleado con planillas aprobadas, verificar tabla | — |
| 67-TAB-07 | Botón descargar comprobante descarga PDF con Bearer token | manual | Click botón en planilla APROBADA; verificar descarga en red | — |
| 67-TAB-08 | Tab Eventos muestra solo eventos del empleado con nombre del catálogo | manual | Cargar perfil empleado con eventos; verificar que no aparecen eventos de otros | — |
| 67-TAB-09 | Asignar nuevo evento desde el tab Eventos crea la asignación y refresca lista | manual | Abrir modal, seleccionar evento, guardar; verificar aparece en lista | — |
| 67-TAB-10 | Eliminar evento desde tab Eventos remueve la asignación | manual | Click eliminar en evento; confirmar; verificar desaparece | — |
| 67-TAB-11 | Tab Documentos muestra lista de documentos del empleado | manual | Empleado con documentos previos; verificar lista | — |
| 67-TAB-12 | Agregar documento desde modal crea registro y refresca lista | manual | Click "Agregar documento", llenar form, guardar | — |
| 67-TAB-13 | Eliminar documento remueve registro | manual | Click eliminar en documento; verificar desaparece | — |

### Sampling Rate
- **Por task commit:** `npm test -- --testPathPattern="EmployeeDocument\|LaborEventsService\|EmployeeService" --no-coverage`
- **Por wave merge:** `npm test` (suite completa, 546+ tests sin regresiones)
- **Phase gate:** Suite completa verde antes de `/gsd-verify-work`

### Wave 0 Gaps (tests a crear en Plan 01 / Plan 02)
- [ ] `src/backend/__tests__/unit/services/EmployeeDocumentService.test.ts` — cubre REQ 67-TAB-03, 67-TAB-04, 67-TAB-05
- [ ] `src/backend/__tests__/unit/services/EmployeeService.getPayrollsByEmployee.test.ts` — cubre REQ 67-TAB-01
- [ ] `src/backend/__tests__/unit/services/LaborEventsService.getLaborEventsByEmployee.test.ts` — cubre REQ 67-TAB-02

Los tests de frontend (hooks / componentes) son opcional para esta fase — el proyecto no tiene test de React hasta el momento (Jest está configurado solo para backend).

---

## Sources

### Primary (HIGH confidence)
- `src/backend/prisma/schema.prisma` — Modelos exactos de `vpg_payroll_employee`, `vpg_payrolls`, `vpg_employee_labor_event`, `vpg_labor_events`, `vpg_employee_documents`
- `src/backend/prisma/migrations/0_init/migration.sql` — Confirmación de que `vpg_employee_documents` ya existe en DB con esquema real
- `src/backend/src/service/LaborEventsService.ts` — Patrón exacto para `getAllEmployeeLaborEvents` y el join pattern
- `src/backend/src/routes/EmployeeRoute.ts` — Patrón de registro de rutas con `asyncHandler` + `AuthMiddleware`
- `src/frontend/src/hooks/useAguinaldo.ts` — Patrón canónico de hook
- `src/frontend/src/services/aguinaldoService.ts` — Patrón canónico de service
- `src/frontend/src/services/http.ts` — API de `http.get/post/delete` y `http.raw()`
- `src/backend/src/controller/LaborEventsController.ts` — `deleteEmployeeLaborEvent` ya existe sin ruta

### Secondary (MEDIUM confidence)
- `src/backend/src/model/employeeDocuments.ts` — Modelo existente con discrepancia `version` field

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified contra CLAUDE.md y código real
- Architecture / data shapes: HIGH — verificado contra schema.prisma y migrations
- Pitfalls: HIGH — basados en hallazgos concretos del código (tabla existente, ruta faltante, interface con campo extra)
- Test map: HIGH — basado en patrones de test existentes en el proyecto

**Research date:** 2026-05-09
**Valid until:** 2026-06-09 (stack estable; solo invalida si hay migraciones que modifiquen `vpg_employee_documents`)
