# Phase 46: Rediseño Motor de Reconocimiento de Marcas — Research

**Researched:** 2026-04-20
**Domain:** Excel parsing, time-window classification, audit UI, PostgreSQL schema extension
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Parser Excel**
- D-01: Detección automática de columnas por contenido — el sistema analiza patrones de cada celda (formato de fecha, hora, texto de nombre) para inferir el rol de cada columna. El admin no configura nada antes de importar.
- D-02: Parseo automático de formatos de fecha+hora — soportar los formatos comunes sin intervención del admin: `DD/MM/YYYY HH:MM`, `YYYY-MM-DD HH:MM:SS`, timestamps numéricos de Excel, fecha y hora en celda combinada.
- D-03: Filas no reconocidas → saltar + reporte — las filas que el parser no puede interpretar se omiten, la importación continúa, y al final se presenta un reporte con el contenido de cada fila omitida.
- D-04: Vista previa obligatoria antes de confirmar — después del parseo, el admin ve una tabla con los datos detectados (nombre resuelto, fecha, hora, tipo inferido). Solo al confirmar se guardan los registros.

**Clasificación por Ventanas de Tiempo**
- D-05: Ventanas de tiempo configurables en UI — el admin define rangos horarios desde la pantalla de configuración del sistema.
- D-06: Marcas en zona ambigua → estado 'dudosa' + escalada — cuando un timestamp cae fuera de todas las ventanas o en zona de solapamiento, se clasifica con confianza baja y se destaca en la UI de auditoría.
- D-07: Nivel de confianza visible en UI con color/ícono — verde = alta confianza, amarillo = probable, rojo = dudosa.

**UI de Auditoría por Jornada**
- D-08: Organización jerárquica: Empleado → Día → Marcas
- D-09: Filtros disponibles: Rango de fechas + "Solo con problemas"
- D-10: Confirmación por día con clic explícito — botón/checkbox "Confirmar día"
- D-11: Horas calculadas siempre visibles en la vista colapsada del día

**Flujo de Corrección Asistida**
- D-12: Sugerencia de tipo y hora cuando falta una marca
- D-13: Coexistencia con ADD/EDIT/VOID — llama mismos endpoints `POST /clock-logs/adjust`
- D-14: Corrección de tipo por clic inline — guardar como ajuste EDIT con justificación requerida

### Claude's Discretion
- Algoritmo exacto para inferencia de hora sugerida cuando falta una marca (promedio histórico, última ocurrencia, etc.)
- Diseño visual exacto del indicador de confianza (badge, dot, borde de color, etc.)
- Paginación o scroll infinito en la lista de empleados de auditoría
- Estrategia de persistencia del estado "Confirmado" por día (nueva tabla vs. campo en adjustments)

### Deferred Ideas (OUT OF SCOPE)
- Aprendizaje de patrones por empleado (historial de horarios)
- Soporte para marcas de dispositivo en tiempo real (`source: device`)
- Bulk confirmation masiva por rango de fechas
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MARCAS-01 | Vista agrupada empleado → día → par entrada/salida | ClockLogEffectiveService.getPaginatedEffectiveMarks ya proporciona esta estructura; la nueva UI extiende EmployeeCard y DailyRow |
| MARCAS-02 | Agregar marca faltante con justificación obligatoria | ClockLogAdjustmentService.createAdjustment (ADD) sin cambios; nueva UI lo llama desde el flujo de corrección asistida |
| MARCAS-03 | Editar marca incorrecta (ajuste no destructivo) | ClockLogAdjustmentService (EDIT) sin cambios; MarkTypeSelector inline llama el mismo endpoint |
| MARCAS-04 | Eliminar marca errónea (soft delete con justificación) | ClockLogAdjustmentService (VOID) sin cambios |
| MARCAS-05 | Audit trail completo para toda corrección | vpg_audit_logs ya integrado en ClockLogAdjustmentService vía AuditLogsService; sin cambios |
| MARCAS-06 | Motor de marcas efectivas (original + ajustes) | ClockLogEffectiveService ya implementado; Phase 46 lo extiende para exponer confianza |
| D-01..D-04 | Parser Excel robusto con detección automática | ExcelJS ^4.4.0 instalado en frontend (no en backend); arquitectura de parsing en frontend pre-procesa, backend recibe JSON — ver sección Parser Architecture |
| D-05..D-07 | Clasificación por ventanas de tiempo configurables | Nueva tabla vpg_time_windows en Prisma + servicio TimeWindowService + endpoint de configuración |
| D-08..D-11 | UI de auditoría por jornada con confirmación por día | Extiende EmployeeCard/DailyRow; nueva tabla vpg_day_confirmations o campo en adjustments |
| D-12..D-14 | Corrección asistida con sugerencias | Nuevo endpoint de sugerencia + AuditDayRow con MarkTypeSelector inline |
</phase_requirements>

---

## Summary

La fase 46 rediseña el pipeline de importación Excel y agrega una capa de auditoría por jornada sobre la infraestructura de marcas efectivas ya existente. El sistema actual ya tiene el backend de ajustes (ADD/EDIT/VOID), el motor de marcas efectivas, y la vista jerárquica por empleado; lo que falta es: (1) un parser Excel inteligente en el frontend que clasifique las marcas por ventanas de tiempo antes de enviarlas al backend, (2) ventanas de tiempo configurables persistidas en la base de datos, (3) indicadores de confianza en las marcas, y (4) confirmación por día con sugerencia de corrección.

La decisión arquitectónica clave es dónde ejecutar el parser Excel. Como `exceljs ^4.4.0` ya está instalado en el frontend y no en el backend, y porque la vista previa obligatoria (D-04) requiere que el cliente vea los datos antes de confirmar, el parsing es naturalmente un proceso del cliente: el frontend lee el archivo con ExcelJS, clasifica las marcas por ventanas, genera la vista previa, y al confirmar envía el JSON ya estructurado al endpoint existente `POST /clock-logs/import`. Esto evita la necesidad de multipart/form-data en el backend y mantiene el patrón actual de importación.

El estado "Confirmado" por día (D-10) se persistirá en una nueva tabla `vpg_day_confirmations` (estrategia preferida), separada de `vpg_clock_log_adjustments` para no mezclar la semántica de corrección con la semántica de revisión administrativa. Las ventanas de tiempo se persistirán en una nueva tabla `vpg_time_windows` accesible vía API REST con los patrones CRUD existentes.

**Primary recommendation:** Parsear Excel en el frontend con ExcelJS (ya instalado), enviar JSON estructurado al backend existente, agregar 2 tablas nuevas (vpg_time_windows, vpg_day_confirmations) con migraciones Prisma, y extender la UI existente de marcas.

---

## Project Constraints (from CLAUDE.md)

| Directive | Constraint |
|-----------|------------|
| Architecture layers | Frontend: Page → Hook → Service → http.ts → Backend API — nunca saltarse capas |
| ORM | Siempre `import { prisma } from '../lib/prisma'` — nunca `new PrismaClient()` |
| Schema changes | Requieren `npx prisma migrate dev --name <description>` + `npx prisma generate` |
| Table naming | Prefijo `vpg_` + snake_case; campos: `tablename_fieldname` |
| Frontend HTTP | Solo a través de `http.ts` — nunca raw `fetch` en componentes o hooks |
| Forms | Siempre `react-hook-form` + `zodResolver` — nunca raw `useState` para campos |
| Modals | `AnimatePresence` + `motion.div` con `backdropVariants` / `modalVariants` |
| New routes | Deben usar `asyncHandler` + `AuthMiddleware.verifyToken` |
| Never touch | `payrollUtils.ts`, `schema.prisma` sin migración, `http.ts`, `asyncHandler.ts` |
| TypeScript | `npx tsc --noEmit` debe pasar en backend y frontend antes de cada commit |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Lectura y parsing del archivo Excel | Browser/Client | — | ExcelJS ya instalado en frontend; D-04 requiere preview antes de confirmar — todo el parse ocurre localmente antes de enviar al servidor |
| Detección automática de columnas (D-01) | Browser/Client | — | Análisis de patrones de celdas; no requiere acceso a BD |
| Parsing de formatos de fecha/hora (D-02) | Browser/Client | — | Lógica de normalización; va con el parsing del archivo |
| Clasificación IN/OUT por ventanas de tiempo (D-05..D-07) | Browser/Client | API/Backend | Frontend aplica las ventanas al parsear; ventanas provienen del backend vía API |
| Persistencia de ventanas de tiempo | API/Backend | Database/Storage | Nueva tabla vpg_time_windows + servicio + endpoint CRUD |
| Confirmación de importación (D-04) | API/Backend | Database/Storage | Frontend envía JSON ya parseado; backend usa endpoint existente POST /clock-logs/import |
| Estado "Confirmado" por día (D-10) | API/Backend | Database/Storage | Nueva tabla vpg_day_confirmations; frontend llama endpoint nuevo |
| Sugerencia de hora faltante (D-12) | API/Backend | — | Requiere consulta al historial de marcas del empleado — lógica en servicio backend |
| Corrección inline de tipo de marca (D-14) | Browser/Client | API/Backend | Dropdown en UI llama endpoint existente POST /clock-logs/adjust |
| Vista de auditoría Empleado → Día → Marcas (D-08..D-11) | Browser/Client | — | Extensión de EmployeeCard/DailyRow existentes |

---

## Standard Stack

### Core (ya instalado — verificado)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| exceljs | ^4.4.0 | Leer archivos .xlsx/.xls en el frontend | [VERIFIED: npm registry] — instalado en `src/frontend/package.json` |
| zod | ^4.3.6 (backend) / ^4.0.17 (frontend) | Validación de schemas para ventanas de tiempo y confirmaciones | [VERIFIED: codebase grep] |
| prisma | ^6.14.0 | ORM para las nuevas tablas | [VERIFIED: codebase] |
| framer-motion | ^12.x | Animaciones en nuevos componentes | [VERIFIED: CLAUDE.md] |
| react-hook-form | ^7.62.0 | Formulario de configuración de ventanas | [VERIFIED: CLAUDE.md] |

### Necesita instalar en backend

| Library | Version | Purpose | Action |
|---------|---------|---------|--------|
| NO REQUIERE xlsx/exceljs en backend | — | El parsing ocurre completamente en el frontend | — |
| NO REQUIERE multer en backend | — | El endpoint /clock-logs/import ya acepta JSON; no hay upload de archivo al servidor | — |

**Nota crítica:** [VERIFIED: backend package.json] — No hay `xlsx`, `exceljs`, `multer` ni `busboy` instalados en el backend. El diseño correcto mantiene el parsing en el frontend (donde ExcelJS ya existe) y envía JSON al backend.

### Versiones actuales verificadas

```bash
# ExcelJS ya en frontend
exceljs: "^4.4.0"  — npm registry versión actual: 4.4.0 [VERIFIED: npm view exceljs version]

# xlsx (alternativa) — NO usar, no instalado
xlsx: 0.18.5 en npm — pero ExcelJS ya está en el proyecto, no agregar dependencias nuevas
```

---

## Architecture Patterns

### System Architecture Diagram

```
[Archivo Excel / CSV]
         |
         v
[Browser: ExcelJS parser]
  - detectColumnRoles()      detecta columnas por contenido de celda
  - parseDateFormats()       normaliza DD/MM/YYYY, YYYY-MM-DD, timestamps numéricos
  - classifyByTimeWindows()  IN/OUT según ventanas cargadas del API
  - buildPreviewRows()       genera filas con {name, date, time, type, confidence}
         |
         v (preview en ClockImportModal)
[Admin confirma o descarta]
         |
         v
[Frontend Service: clockLogsService.importLogs(rows)]
  via http.ts → POST /api/clock-logs/import
         |
         v
[Backend: ClockLogsController.import()]
  → ClockLogsImportService.processImport(logs, source, userId)
    (sin cambios — ya acepta {employee_name, timestamp, log_type})
         |
         v
[vpg_clock_logs] + [vpg_clock_import_sessions]
         |
         v
[GET /api/clock-logs/effective] → ClockLogEffectiveService
  (ahora incluye confidence_level en respuesta)
         |
         v
[Frontend: AuditPage → EmployeeCard → AuditDayRow → MarkConfidenceBadge]
                                              |
                                              v
                              [POST /api/clock-logs/adjust] (ADD/EDIT/VOID — sin cambios)
                              [POST /api/clock-logs/confirm-day] (NUEVO)
                              [GET  /api/clock-logs/suggest-mark] (NUEVO)
                              [GET/POST/PUT/DELETE /api/time-windows] (NUEVO)
```

### Recommended Project Structure — Cambios y Adiciones

```
Backend — nuevos archivos:
src/backend/src/
├── service/
│   ├── TimeWindowService.ts          # CRUD para vpg_time_windows
│   ├── DayConfirmationService.ts     # Confirmar día (D-10)
│   └── MarkSuggestionService.ts      # Sugerir marca faltante (D-12)
├── controller/
│   ├── TimeWindowController.ts       # GET/POST/PUT/DELETE ventanas
│   └── DayConfirmationController.ts  # POST confirmar día, GET estado confirmaciones
├── routes/
│   └── TimeWindowRoute.ts            # /api/time-windows
├── schemas/
│   ├── TimeWindowSchema.ts           # Zod validación ventanas
│   └── DayConfirmationSchema.ts      # Zod validación confirmación
└── prisma/
    └── schema.prisma                 # +vpg_time_windows, +vpg_day_confirmations

Frontend — nuevos archivos:
src/frontend/src/
├── features/clock-logs/
│   └── parser/
│       ├── excelColumnDetector.ts    # Detectar columnas por contenido (D-01)
│       ├── dateFormatParser.ts       # Normalizar formatos de fecha (D-02)
│       └── timeWindowClassifier.ts  # Clasificar IN/OUT por ventanas (D-05..D-07)
├── hooks/
│   ├── useClockAudit.ts              # Hook principal de auditoría (extiende useEffectiveMarks)
│   └── useTimeWindows.ts             # Hook CRUD ventanas de tiempo
├── services/
│   ├── timeWindowService.ts          # API calls ventanas
│   └── dayConfirmationService.ts     # API calls confirmaciones
└── components/
    ├── ClockImportModal.tsx           # Upload + parse preview (D-04)
    ├── TimeWindowConfig.tsx           # Panel de configuración de ventanas (D-05)
    ├── AuditDayRow.tsx                # Extiende DailyRow con confirmación (D-10/D-11)
    ├── MarkConfidenceBadge.tsx        # Badge verde/amarillo/rojo (D-07)
    ├── MarkTypeSelector.tsx           # Dropdown inline IN/OUT (D-14)
    └── AuditFilters.tsx               # Sidebar filtros + toggle "Solo problemas" (D-09)
```

---

## Schema Additions — Nuevas Tablas Prisma

### vpg_time_windows (D-05)

```prisma
// Fuente: diseño para Phase 46 según decisiones D-05..D-07
model vpg_time_windows {
  time_window_id          Int      @id @default(autoincrement())
  time_window_label       String   @db.VarChar(100)  // ej: "Entrada mañana"
  time_window_log_type    ClockLogType                // IN o OUT
  time_window_start_hour  Int                         // 0-23 (inclusive)
  time_window_start_min   Int      @default(0)        // 0-59
  time_window_end_hour    Int                         // 0-23 (inclusive)
  time_window_end_min     Int      @default(0)        // 0-59
  time_window_active      Boolean  @default(true)
  time_window_version     Int      @default(1)
  time_window_created_at  DateTime @default(now()) @db.Timestamp(6)

  @@index([time_window_active], map: "idx_vpg_time_windows_active")
  @@index([time_window_log_type], map: "idx_vpg_time_windows_log_type")
}
```

### vpg_day_confirmations (D-10)

```prisma
// Estrategia: tabla separada — no mezcla semántica de ajuste con semántica de revisión
model vpg_day_confirmations {
  confirmation_id           Int           @id @default(autoincrement())
  confirmation_employee_id  Int
  confirmation_date         DateTime      @db.Date        // YYYY-MM-DD
  confirmation_confirmed_by Int
  confirmation_confirmed_at DateTime      @default(now()) @db.Timestamp(6)
  confirmation_version      Int           @default(1)
  vpg_employees             vpg_employees @relation(fields: [confirmation_employee_id], references: [employee_id], onDelete: NoAction, onUpdate: NoAction, map: "fk_vpg_day_confirmations_employees_34")
  vpg_users                 vpg_users     @relation(fields: [confirmation_confirmed_by], references: [user_id], onDelete: NoAction, onUpdate: NoAction, map: "fk_vpg_day_confirmations_users_35")

  @@unique([confirmation_employee_id, confirmation_date], map: "uq_vpg_day_confirmations_emp_date")
  @@index([confirmation_employee_id], map: "idx_vpg_day_confirmations_employee_id")
  @@index([confirmation_date], map: "idx_vpg_day_confirmations_date")
}
```

**Alternativa descartada:** Almacenar el estado confirmado como un campo en `vpg_clock_log_adjustments`. Razón: `vpg_clock_log_adjustments` modela correcciones a marcas individuales; la confirmación es una operación sobre un día completo de un empleado — semánticas distintas. [ASSUMED]

---

## ExcelJS — Parser Architecture

### Detección de columnas (D-01)

El archivo Excel puede tener columnas en cualquier orden y con cualquier encabezado. El parser debe analizar el **contenido de las primeras N filas** (no los encabezados) para inferir el rol de cada columna.

```typescript
// Fuente: patrón propio — ASSUMED basado en características de ExcelJS ^4.4.0
// ExcelJS lee celdas como: worksheet.getCell(row, col)

// Tipos de detección por contenido de celda:
// - Columna de nombre: string no-numérico, no-fecha, con espacios (ej: "Maria Rodriguez")
// - Columna de timestamp combinado: Date object de Excel, o string que matchea múltiples formatos
// - Columna de fecha separada: Date sin componente de hora, o string DD/MM/YYYY
// - Columna de hora separada: string HH:MM o número de fracción de día (0.5 = 12:00)

// Cada columna recibe un score por tipo y se elige el rol con mayor score
type ColumnRole = 'name' | 'datetime' | 'date' | 'time' | 'type' | 'unknown';
```

### Formatos de fecha soportados (D-02)

| Formato | Ejemplo | Método de parse |
|---------|---------|-----------------|
| `DD/MM/YYYY HH:MM` | `05/04/2026 08:30` | String split + constructor Date |
| `YYYY-MM-DD HH:MM:SS` | `2026-04-05 08:30:00` | new Date(string) |
| Timestamp numérico Excel | 46116.354 | `(value - 25569) * 86400000` — ver nota |
| Celda combinada Date de ExcelJS | `Date object` | `.toISOString()` directo |
| Fecha en una celda + hora en otra | `05/04/2026` + `08:30` | Combinar ambas celdas |

**Nota sobre timestamps numéricos Excel:** Excel almacena fechas como número de días desde 1900-01-01 (con bug del año 1900 bisiesto). La conversión es `(serialValue - 25569) * 86400 * 1000` para obtener ms Unix. [VERIFIED: ExcelJS docs — el objeto Cell retorna Date directamente cuando `type === CellType.Date`, pero las celdas sin formato correcto pueden llegar como número]

### Clasificación por ventanas de tiempo (D-05..D-07)

```typescript
// Fuente: diseño Phase 46
// Confianza: HIGH = marca dentro de ventana, MEDIUM = dentro de 30 min del borde, LOW = fuera de todas

type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

interface TimeWindow {
  label: string;
  logType: 'IN' | 'OUT';
  startHour: number; startMin: number;
  endHour: number; endMin: number;
}

function classifyMark(timeMinutes: number, windows: TimeWindow[]): {
  logType: 'IN' | 'OUT' | null;
  confidence: ConfidenceLevel;
  windowLabel: string | null;
} {
  // 1. Buscar ventana que contenga el tiempo
  // 2. Si ninguna: buscar ventana más cercana (< 30 min de borde) → MEDIUM
  // 3. Si ninguna en 30 min: LOW (dudosa)
}
```

**Caso de solapamiento de ventanas:** Si dos ventanas de distintos tipos cubren el mismo rango, la marca es automáticamente LOW (ambigua). El admin debe decidir manualmente.

---

## API Endpoints — Nuevos

### Ventanas de Tiempo

```
GET    /api/time-windows         → lista todas las ventanas activas
POST   /api/time-windows         → crear ventana nueva
PUT    /api/time-windows/:id     → actualizar ventana
DELETE /api/time-windows/:id     → desactivar ventana (soft delete)
```

### Confirmación de Día

```
POST   /api/clock-logs/confirm-day
  Body: { employee_id: number, date: string }  // date: YYYY-MM-DD
  Returns: { success: true, confirmation_id: number }

DELETE /api/clock-logs/confirm-day
  Body: { employee_id: number, date: string }
  Returns: { success: true }

GET    /api/clock-logs/day-confirmations?initDate=&endDate=&employee_id=
  Returns: { data: Array<{employee_id, date, confirmed_at, confirmed_by}> }
```

### Sugerencia de Marca Faltante (D-12)

```
GET    /api/clock-logs/suggest-mark?employee_id=&date=&missing_type=IN|OUT
  Returns: { suggested_time: string, method: 'historical_avg' | 'last_seen' | 'window_center' }
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Leer archivos Excel/XLSX | Parser propio de bytes | `exceljs` (ya instalado en frontend) | Maneja formatos xls/xlsx/csv, timestamps numéricos, celdas merged, encoding |
| Subir archivo al servidor para parsear | multer + streaming | ExcelJS en el browser (File API) | Mantiene el patrón actual: frontend parsea, backend recibe JSON |
| Validación de esquemas API | Validación manual | Zod (ya instalado) | Patrones establecidos en el proyecto |
| Animaciones de colapso/expansión | CSS transitions manuales | framer-motion `AnimatePresence` (ya usado) | Patrón establecido en BranchGroup/EmployeeCard |
| HTTP calls en componentes | raw fetch() | http.ts service layer (regla absoluta del proyecto) | Arquitectura del proyecto — NUNCA bypass |

**Key insight:** El parsing de Excel en el browser con ExcelJS evita añadir `multer` al backend, mantiene el endpoint `/clock-logs/import` sin cambios, y permite la vista previa obligatoria (D-04) sin roundtrip al servidor.

---

## Common Pitfalls

### Pitfall 1: Timestamps numéricos de Excel sin conversión
**What goes wrong:** ExcelJS puede devolver valores numéricos (ej: `46116.354`) cuando la celda tiene formato de número en lugar de fecha.
**Why it happens:** Excel almacena fechas como números; si la celda no tiene tipo Date aplicado, ExcelJS lo devuelve como `number`.
**How to avoid:** En `dateFormatParser.ts`, verificar `typeof cell.value === 'number'` además de `instanceof Date`. Aplicar la fórmula de conversión `(n - 25569) * 86400000`.
**Warning signs:** Fechas del año 1970 o 1900 en la vista previa — señal de que el número no se convirtió.

### Pitfall 2: Solapamiento de ventanas → tipo asignado incorrectamente
**What goes wrong:** Si dos ventanas (ej: OUT tarde y IN almuerzo) se solapan entre 13:00 y 14:00, el clasificador puede asignar un tipo incorrecto con confianza HIGH.
**Why it happens:** El algoritmo verifica si el tiempo está dentro de una ventana, pero no verifica unicidad.
**How to avoid:** Al clasificar, si el tiempo cae en múltiples ventanas de tipos distintos → forzar LOW (dudosa) independientemente del centro de la ventana.
**Warning signs:** Marcas de almuerzo clasificadas como "Salida tarde" con alta confianza.

### Pitfall 3: Unique constraint en vpg_clock_logs al reimportar
**What goes wrong:** `uq_vpg_clock_logs_emp_ts_type` (`employee_id`, `timestamp`, `log_type`) genera error si se vuelve a importar el mismo archivo.
**Why it happens:** El constraint es intencional para evitar duplicados, pero el usuario puede intentar reimportar.
**How to avoid:** `ClockLogsService.bulkCreate` ya maneja este caso con `skipDuplicates: true` en Prisma. Asegurarse de que el nuevo flujo de importación también pase `skipDuplicates`.
**Warning signs:** Error 500 con mensaje de constraint violation al reimportar.

### Pitfall 4: Inferencia de columnas falla con archivos vacíos o con solo encabezados
**What goes wrong:** El parser analiza las primeras N filas de datos para inferir columnas, pero si el archivo tiene solo encabezados, el análisis retorna undefined.
**Why it happens:** La detección por contenido requiere datos, no solo headers.
**How to avoid:** Si el análisis de las primeras 5 filas no produce un mapping confiable, mostrar error específico (D-03) en lugar de continuar.
**Warning signs:** Vista previa muestra 0 filas válidas.

### Pitfall 5: Timezone ambigüedad en marcas de Costa Rica
**What goes wrong:** Los timestamps del Excel no tienen timezone; si se parsean como UTC, las marcas de 08:00 CR aparecen como 14:00 UTC.
**Why it happens:** `new Date('2026-04-05 08:30')` en JavaScript se interpreta como local time del browser, pero si el servidor está en UTC, los timestamps guardados quedan desplazados.
**How to avoid:** Normalizar todas las marcas a Costa Rica timezone (`America/Costa_Rica`, UTC-6) antes de enviar al backend. Verificar con el patrón existente en `DailyRow.tsx` → `formatCRTime`.
**Warning signs:** Marcas de "08:00" aparecen como "14:00" en la vista de auditoría.

### Pitfall 6: Estado confirmado no refleja cambios posteriores de marcas
**What goes wrong:** Un día se marca como "Revisado" pero después el admin agrega/edita/anula una marca de ese día. El estado "Confirmado" queda obsoleto.
**Why it happens:** `vpg_day_confirmations` solo registra la confirmación; no hay trigger para invalidarla cuando las marcas del día cambian.
**How to avoid:** La UI de auditoría debe mostrar el badge "Revisado" como informativo, no como estado final. Al renderizar un día confirmado, comparar el `confirmation_confirmed_at` con el `adjustment_created_at` más reciente del día. Si hay ajustes posteriores → mostrar "Revisado (con cambios recientes)".
**Warning signs:** Admin confirma día, luego edita una marca, y el día sigue mostrando "Revisado" sin advertencia.

### Pitfall 7: ExcelJS en Next.js 15 — bundle size en cliente
**What goes wrong:** ExcelJS es una librería pesada (~3MB). Si se importa directamente en un componente React, Next.js la incluye en el bundle del cliente.
**Why it happens:** Next.js 15 con Turbopack incluye todas las importaciones estáticas en el bundle.
**How to avoid:** Usar `dynamic import` de Next.js para cargar ExcelJS solo cuando el usuario abre el modal de importación: `const ExcelJS = await import('exceljs')`.
**Warning signs:** LCP (Largest Contentful Paint) degradado en la página de marcas.

---

## Code Examples

### ExcelJS: Leer archivo desde File input

```typescript
// Fuente: ExcelJS ^4.4.0 API [ASSUMED — basado en documentación oficial de ExcelJS]
// Importación dinámica para evitar bundle size en cliente
async function parseExcelFile(file: File): Promise<ParsedRow[]> {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  // ...
}
```

### Inferencia de columnas por contenido de celda

```typescript
// Fuente: diseño Phase 46 [ASSUMED]
function detectColumnRoles(worksheet: Worksheet): Map<number, ColumnRole> {
  const scores = new Map<number, Record<ColumnRole, number>>();
  // Sample primeras 10 filas (skip header row 1)
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    if (rowNumber > 11) return; // only sample 10 rows
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const role = inferCellRole(cell.value);
      scores.get(colNumber)?.[role]++;
    });
  });
  // Return role with highest score per column
}
```

### Confirmación de día — endpoint nuevo

```typescript
// Fuente: patrón del proyecto [VERIFIED: ClockLogAdjustmentService pattern]
// POST /api/clock-logs/confirm-day
static async confirmDay(employeeId: number, date: string, userId: number) {
  const dateObj = new Date(date);
  return await prisma.vpg_day_confirmations.upsert({
    where: {
      uq_vpg_day_confirmations_emp_date: {
        confirmation_employee_id: employeeId,
        confirmation_date: dateObj,
      }
    },
    create: {
      confirmation_employee_id: employeeId,
      confirmation_date: dateObj,
      confirmation_confirmed_by: userId,
    },
    update: {
      confirmation_confirmed_by: userId,
      confirmation_confirmed_at: new Date(),
    }
  });
}
```

### MarkConfidenceBadge component

```tsx
// Fuente: UI-SPEC.md + patrón del proyecto [VERIFIED: UI-SPEC.md colores]
interface MarkConfidenceBadgeProps {
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'PENDING';
}

const CONFIDENCE_STYLES = {
  HIGH: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  LOW: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PENDING: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

const CONFIDENCE_LABELS = {
  HIGH: 'Alta confianza',
  MEDIUM: 'Probable',
  LOW: 'Dudosa',
  PENDING: 'Pendiente',
};
```

---

## Reusable Assets — Inventario del Código Existente

| Asset | Archivo | Reutilizable | Cómo |
|-------|---------|-------------|------|
| `ClockLogAdjustmentService` | `src/backend/src/service/ClockLogAdjustmentService.ts` | Sin cambios | La nueva UI llama `POST /clock-logs/adjust` para EDIT inline (D-14) y sugerencia aceptada (D-12) |
| `ClockLogEffectiveService.getPaginatedEffectiveMarks` | `src/backend/src/service/ClockLogEffectiveService.ts` | Sin cambios | Base de la vista de auditoría; agregar `confidence_level` al shape de retorno es opcional en Phase 46 |
| `ClockLogsImportService.processImport` | `src/backend/src/service/ClockLogsImportService.ts` | Sin cambios | El nuevo parser frontend envía el mismo formato JSON esperado |
| `ClockAliasService.resolveEmployeeByAlias` | Backend service | Sin cambios | Ya resuelve nombres de Excel a employee_id |
| `inferLogTypeBySequence` | `src/backend/src/utils/clockLogNormalization.ts` | Sin cambios (pero se usa menos) | Fallback si no hay ventanas configuradas |
| `useEffectiveMarks` hook | `src/frontend/src/hooks/useEffectiveMarks.ts` | Extender | `useClockAudit.ts` extiende este hook agregando confirmaciones y filtro "solo problemas" |
| `BranchGroup.tsx` | `src/frontend/src/components/BranchGroup.tsx` | Reusar tal cual | Wraps los EmployeeCard de auditoría |
| `EmployeeCard.tsx` | `src/frontend/src/components/EmployeeCard.tsx` | Extender | Agregar props: `confirmed_days`, `total_days` para badge de progreso |
| `DailyRow.tsx` | `src/frontend/src/components/DailyRow.tsx` | Extender → `AuditDayRow.tsx` | Agregar: hours calculadas siempre visible, botón "Confirmar Día", badge de confianza |
| `EditClockLogModal.tsx` | `src/frontend/src/components/EditClockLogModal.tsx` | Reusar tal cual | Ya implementado; `MarkTypeSelector` lo abre para cambio de tipo (D-14) |
| `AddClockLogModal.tsx` | `src/frontend/src/components/AddClockLogModal.tsx` | Reusar tal cual | Se abre cuando admin acepta sugerencia de marca faltante (D-12) con datos pre-llenados |
| `FormModal.tsx` | `src/frontend/src/components/ui/FormModal.tsx` | Reusar como base | `ClockImportModal` lo extiende con file input + tabla de preview |
| `Table.tsx` | `src/frontend/src/components/ui/Table.tsx` | Reusar | Preview table de importación (D-04) |
| `Tooltip.tsx` | `src/frontend/src/components/ui/Tooltip.tsx` | Reusar | Tooltip en `MarkConfidenceBadge` |
| `Select.tsx` | `src/frontend/src/components/ui/Select.tsx` | Reusar | Dropdown en `MarkTypeSelector` inline |

---

## State of the Art

| Old Approach | Current Approach | Change | Impact |
|--------------|------------------|--------|--------|
| Inferir IN/OUT por secuencia (odd=IN, even=OUT) | Clasificación por ventanas de tiempo configurables | Phase 46 | Más preciso para turnos no-estándar; el admin define las ventanas |
| El admin exporta a Excel, corrige manualmente y recalcula | Sistema muestra jornadas con problemas y sugiere correcciones | Phase 46 | Elimina el flujo manual de Excel |
| Parser recibe JSON pre-procesado del cliente sin tipado | Parser detecta automáticamente columnas del Excel crudo | Phase 46 | El admin solo sube el archivo, no configura nada |

---

## Runtime State Inventory

No aplica — Phase 46 es greenfield de funcionalidades nuevas, no un rename/refactor. Sin embargo, se deben verificar:

| Categoría | Estado | Acción |
|-----------|--------|--------|
| Stored data | No hay registros en `vpg_time_windows` ni `vpg_day_confirmations` (tablas nuevas) | Las tablas se crean vacías via migración Prisma — el admin configura ventanas en el primer uso |
| Live service config | Backend en puerto 3001, frontend en puerto 3000 — sin cambios | Ninguna |
| OS-registered state | No aplica | — |
| Secrets/env vars | `DATABASE_URL`, `JWT_SECRET` — sin cambios | Ninguna |
| Build artifacts | `npx prisma generate` requerido después de la migración | Ejecutar en Wave 0 (setup) |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| ExcelJS | Parser Excel en frontend | ✓ | ^4.4.0 | — (ya instalado) |
| Node.js | Backend + Frontend | ✓ | 22.14.0 | — |
| PostgreSQL | Prisma + nuevas tablas | ✓ | via Prisma | — |
| Prisma CLI | Migraciones nuevas tablas | ✓ | ^6.14.0 | — |
| Jest + ts-jest | Tests unitarios parser/clasificador | ✓ | ^29.7.0 | — |

**Missing dependencies with no fallback:** Ninguna.

**Missing dependencies with fallback:** Ninguna.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + ts-jest |
| Config file | `src/backend/jest.config.js` |
| Quick run command | `cd src/backend && npm test -- --testPathPattern="clockLog" --no-coverage` |
| Full suite command | `cd src/backend && npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-01 | detectColumnRoles identifica nombre/fecha/hora por contenido de celda | unit | `npm test -- --testPathPattern="excelColumnDetector"` | ❌ Wave 0 |
| D-02 | parseDateFormats normaliza todos los formatos soportados | unit | `npm test -- --testPathPattern="dateFormatParser"` | ❌ Wave 0 |
| D-05..D-07 | classifyByTimeWindows asigna HIGH/MEDIUM/LOW correctamente | unit | `npm test -- --testPathPattern="timeWindowClassifier"` | ❌ Wave 0 |
| D-10 | confirmDay crea/actualiza registro en vpg_day_confirmations | unit | `npm test -- --testPathPattern="DayConfirmationService"` | ❌ Wave 0 |
| D-12 | MarkSuggestionService retorna hora sugerida basada en historial | unit | `npm test -- --testPathPattern="MarkSuggestionService"` | ❌ Wave 0 |
| MARCAS-06 | ClockLogEffectiveService no rompe con cambios de Phase 46 | unit | `npm test -- --testPathPattern="ClockLogEffective"` | ✅ existente |

**Nota:** Los tests del parser Excel (D-01, D-02, D-05..D-07) se ejecutan en el backend como lógica pura (no hay DOM). Los módulos de clasificación `excelColumnDetector.ts` y `timeWindowClassifier.ts` deben ser funciones puras sin dependencias de browser, ubicadas en `src/backend/src/utils/` o en un paquete compartido. Alternativamente, los tests del parser pueden vivir en el frontend con Jest configurado para Node.js environment.

**Decisión de testing del parser:** [ASSUMED] Los módulos de parsing (`excelColumnDetector.ts`, `dateFormatParser.ts`, `timeWindowClassifier.ts`) se implementarán como módulos TypeScript puros (sin imports de React ni browser APIs) para que puedan testearse en el backend Jest sin necesidad de jsdom.

### Sampling Rate
- **Per task commit:** `cd src/backend && npm test -- --no-coverage --testPathPattern="clockLog|timeWindow|dayConfirmation|markSuggestion" --passWithNoTests`
- **Per wave merge:** `cd src/backend && npm test`
- **Phase gate:** Full suite green antes de `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/backend/src/__tests__/unit/utils/excelColumnDetector.test.ts` — cubre D-01
- [ ] `src/backend/src/__tests__/unit/utils/dateFormatParser.test.ts` — cubre D-02
- [ ] `src/backend/src/__tests__/unit/utils/timeWindowClassifier.test.ts` — cubre D-05..D-07
- [ ] `src/backend/src/__tests__/unit/services/TimeWindowService.test.ts` — cubre CRUD ventanas
- [ ] `src/backend/src/__tests__/unit/services/DayConfirmationService.test.ts` — cubre D-10
- [ ] `src/backend/src/__tests__/unit/services/MarkSuggestionService.test.ts` — cubre D-12
- [ ] Migración Prisma: `npx prisma migrate dev --name add_time_windows_and_day_confirmations`
- [ ] `npx prisma generate` después de la migración

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `AuthMiddleware.verifyToken` en todos los endpoints nuevos |
| V3 Session Management | no | Sin cambios en sesiones |
| V4 Access Control | yes | `AuthMiddleware.requireRole(['admin'])` en endpoints de configuración de ventanas |
| V5 Input Validation | yes | Zod en `TimeWindowSchema.ts` y `DayConfirmationSchema.ts` — validar rangos 0-23 para horas |
| V6 Cryptography | no | Sin cambios en crypto |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Excel con macros VBA maliciosas | Tampering | ExcelJS no ejecuta macros — solo lee datos de celdas; el archivo nunca llega al servidor |
| Archivo Excel extremadamente grande (>10MB) | DoS | Validar tamaño en FileInput antes de parsear (10MB limit definido en UI-SPEC.md) |
| SQL injection via employee_name en Excel | Tampering | Prisma ORM con queries parametrizadas; resolveEmployeeByAlias ya usa Prisma |
| Ventanas de tiempo con rangos inválidos (hora > 23) | Tampering | Zod validation: `z.number().int().min(0).max(23)` |
| Confirmación de día en período de planilla APROBADA | Elevation of Privilege | Verificar payroll lock en DayConfirmationService (misma lógica que ClockLogAdjustmentService) |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | La estrategia óptima es parsear Excel en el frontend (browser) y enviar JSON al backend | Architecture Patterns | Si hay requerimientos futuros de parsing server-side (auditoría, logs de importación con el archivo original), se necesitaría migrar a multer + exceljs en backend |
| A2 | `vpg_day_confirmations` como tabla separada (no campo en `vpg_clock_log_adjustments`) es la mejor estrategia de persistencia | Schema Additions | Si la tabla separada introduce complejidad innecesaria de JOIN, se podría usar un enum field en adjustments. La decisión está marcada como "Claude's Discretion" en CONTEXT.md |
| A3 | Los módulos de parsing (excelColumnDetector, timeWindowClassifier) se implementan como lógica pura testeable en Node.js, sin browser APIs | Validation Architecture | Si ExcelJS requiere APIs de browser para leer el File object, los tests necesitan jsdom; el parsing debería separarse en dos fases: (1) leer bytes del File en el componente React, (2) parsear buffer (pura) |
| A4 | La hora sugerida para marca faltante (D-12) se calcula como promedio de las últimas N marcas del mismo tipo del empleado | Code Examples | Si el historial es escaso (empleados nuevos), el promedio puede no ser representativo; alternativa: usar el centro de la ventana configurada para ese tipo |
| A5 | ExcelJS en Next.js 15 con Turbopack soporta `dynamic import` para tree-shaking | Common Pitfalls (Pitfall 7) | Si dynamic import falla en el build, necesita `next.config.js` con `transpilePackages: ['exceljs']` o mover el parsing a una API route de Next.js |

---

## Open Questions

1. **¿Cómo manejar `confidence_level` en el endpoint `GET /clock-logs/effective`?**
   - What we know: `ClockLogEffectiveService.getPaginatedEffectiveMarks` retorna `EffectiveClockLog` que no incluye `confidence_level`
   - What's unclear: El nivel de confianza se calcula durante el parsing del Excel (frontend), pero al ver la vista de auditoría de importaciones pasadas, ¿debe recalcularse contra las ventanas actuales?
   - Recommendation: Para Phase 46, guardar el `confidence_level` inferido en `clock_logs_remarks` (campo ya existente, nullable) con un prefijo `conf:HIGH|MEDIUM|LOW`. Evitar cambiar el schema de `vpg_clock_logs`. Si en el futuro se necesita filtrar por confianza en SQL, se puede migrar a un campo dedicado.

2. **¿Dónde vive la pantalla de configuración de ventanas de tiempo?**
   - What we know: CONTEXT.md D-05 dice "pantalla de configuración del sistema"
   - What's unclear: ¿Es una sección dentro de la pantalla de marcas actual, o una nueva ruta `/configuracion/ventanas`?
   - Recommendation: Crear una nueva sección en la página de configuración existente (si hay) o una modal `TimeWindowConfig.tsx` accesible desde la página de auditoría. Esta decisión está en Claude's Discretion.

3. **¿`useClockAudit` es un hook nuevo o extiende `useEffectiveMarks`?**
   - What we know: `useEffectiveMarks` tiene lógica de paginación y filtros bien establecida
   - What's unclear: Agregar estado de confirmaciones a `useEffectiveMarks` puede aumentar su responsabilidad
   - Recommendation: Crear `useClockAudit` como hook compositor que llama `useEffectiveMarks` + `useDayConfirmations`. Patrón más limpio, menos side effects.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: codebase] `src/backend/src/service/ClockLogsImportService.ts` — interfaz actual del pipeline de importación
- [VERIFIED: codebase] `src/backend/src/service/ClockLogEffectiveService.ts` — motor de marcas efectivas completo
- [VERIFIED: codebase] `src/backend/prisma/schema.prisma` — tablas existentes y convenciones de naming
- [VERIFIED: codebase] `src/backend/src/routes/ClockLogsRoute.ts` — endpoints existentes de clock logs
- [VERIFIED: codebase] `src/frontend/package.json` — exceljs ^4.4.0 instalado en frontend
- [VERIFIED: npm registry] `npm view exceljs version` → 4.4.0
- [VERIFIED: codebase] `src/backend/package.json` — sin exceljs/xlsx/multer en backend

### Secondary (MEDIUM confidence)
- [CITED: CONTEXT.md] Decisiones D-01..D-14 bloqueadas por el usuario
- [CITED: 46-UI-SPEC.md] Especificaciones visuales y de interacción verificadas

### Tertiary (LOW confidence / ASSUMED)
- ExcelJS dynamic import en Next.js 15 — comportamiento verificado en entrenamiento, no probado en esta sesión
- Estrategia de persistencia `vpg_day_confirmations` — diseño propio basado en patrones del proyecto

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — ExcelJS verificado instalado; resto del stack sin cambios
- Architecture: HIGH — Basado en código existente real; parser en frontend evita cambios al backend
- Pitfalls: MEDIUM — Casos reales de Excel parsing; timezone y unique constraint verificados en código
- Schema additions: MEDIUM — Diseño basado en convenciones del proyecto, pero requiere decisión final sobre `confidence_level`

**Research date:** 2026-04-20
**Valid until:** 2026-05-20 (stack estable; ExcelJS, Prisma, Next.js sin cambios mayores esperados)
