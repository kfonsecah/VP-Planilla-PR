# Phase 46: Rediseño Motor de Reconocimiento de Marcas — Pattern Map

**Mapped:** 2026-04-20
**Files analyzed:** 19 (nuevos o modificados)
**Analogs found:** 19 / 19

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/backend/src/service/TimeWindowService.ts` | service | CRUD | `src/backend/src/service/ClockLogAdjustmentService.ts` | role-match |
| `src/backend/src/service/DayConfirmationService.ts` | service | CRUD | `src/backend/src/service/ClockLogAdjustmentService.ts` | exact |
| `src/backend/src/service/MarkSuggestionService.ts` | service | request-response | `src/backend/src/service/ClockLogEffectiveService.ts` | role-match |
| `src/backend/src/controller/TimeWindowController.ts` | controller | request-response | `src/backend/src/controller/ClockLogAdjustmentController.ts` | exact |
| `src/backend/src/controller/DayConfirmationController.ts` | controller | request-response | `src/backend/src/controller/ClockLogAdjustmentController.ts` | exact |
| `src/backend/src/routes/TimeWindowRoute.ts` | route | request-response | `src/backend/src/routes/ClockLogsRoute.ts` | exact |
| `src/backend/src/schemas/TimeWindowSchema.ts` | schema/validation | request-response | `src/backend/src/schemas/AdjustmentSchema.ts` | exact |
| `src/backend/src/schemas/DayConfirmationSchema.ts` | schema/validation | request-response | `src/backend/src/schemas/AdjustmentSchema.ts` | exact |
| `src/backend/prisma/schema.prisma` | migration | batch | existing schema conventions | exact |
| `src/frontend/src/features/clock-logs/parser/excelColumnDetector.ts` | utility | transform | `src/backend/src/utils/clockLogNormalization.ts` | role-match |
| `src/frontend/src/features/clock-logs/parser/dateFormatParser.ts` | utility | transform | `src/backend/src/utils/clockLogNormalization.ts` | role-match |
| `src/frontend/src/features/clock-logs/parser/timeWindowClassifier.ts` | utility | transform | `src/backend/src/utils/clockLogNormalization.ts` | exact |
| `src/frontend/src/hooks/useClockAudit.ts` | hook | request-response | `src/frontend/src/hooks/useEffectiveMarks.ts` | exact |
| `src/frontend/src/hooks/useTimeWindows.ts` | hook | CRUD | `src/frontend/src/hooks/useEffectiveMarks.ts` | role-match |
| `src/frontend/src/services/timeWindowService.ts` | service | CRUD | `src/frontend/src/services/effectiveMarksService.ts` | exact |
| `src/frontend/src/services/dayConfirmationService.ts` | service | CRUD | `src/frontend/src/services/clockLogAdjustmentService.ts` | exact |
| `src/frontend/src/components/ClockImportModal.tsx` | component | file-I/O | `src/frontend/src/components/AddClockLogModal.tsx` | role-match |
| `src/frontend/src/components/AuditDayRow.tsx` | component | request-response | `src/frontend/src/components/DailyRow.tsx` | exact |
| `src/frontend/src/components/MarkConfidenceBadge.tsx` | component | transform | `src/frontend/src/components/DailyRow.tsx` (ClockLogStatusBadge sub-pattern) | role-match |
| `src/frontend/src/components/MarkTypeSelector.tsx` | component | request-response | `src/frontend/src/components/AddClockLogModal.tsx` | role-match |
| `src/frontend/src/components/AuditFilters.tsx` | component | request-response | `src/frontend/src/components/DailyRow.tsx` | role-match |
| `src/frontend/src/components/TimeWindowConfig.tsx` | component | CRUD | `src/frontend/src/components/AddClockLogModal.tsx` | role-match |

---

## Pattern Assignments

### `src/backend/src/service/TimeWindowService.ts` (service, CRUD)

**Analog:** `src/backend/src/service/ClockLogAdjustmentService.ts`

**Imports pattern** (lineas 1-10):
```typescript
import { prisma } from '../lib/prisma';
import { CreateTimeWindowInput, UpdateTimeWindowInput } from '../schemas/TimeWindowSchema';
```

**Core CRUD pattern** (lineas 16-98 del analog, adaptado):
```typescript
export class TimeWindowService {
  /**
   * Creates a new time window configuration.
   * @param data - Validated time window data
   * @returns Created time window record
   */
  static async create(data: CreateTimeWindowInput) {
    return await prisma.vpg_time_windows.create({ data: { ... } });
  }

  static async getAll() {
    return await prisma.vpg_time_windows.findMany({
      where: { time_window_active: true },
      orderBy: { time_window_start_hour: 'asc' },
    });
  }

  static async getById(id: number) { ... }
  static async update(id: number, data: UpdateTimeWindowInput) { ... }

  /** Soft delete — sets time_window_active = false */
  static async delete(id: number) {
    return await prisma.vpg_time_windows.update({
      where: { time_window_id: id },
      data: { time_window_active: false },
    });
  }
}
```

**Error handling pattern** (lineas 108-128 del analog):
```typescript
// No prisma.$transaction needed para CRUD simple
// Lanzar Error con mensaje en español para errores de negocio
if (!existing) {
  throw new Error('Ventana de tiempo no encontrada');
}
```

**Method order:** create → getAll → getById → update → delete (regla absoluta de CLAUDE.md)

---

### `src/backend/src/service/DayConfirmationService.ts` (service, CRUD)

**Analog:** `src/backend/src/service/ClockLogAdjustmentService.ts`

**Imports pattern** (lineas 1-10):
```typescript
import { prisma } from '../lib/prisma';
import { PayrollStatus } from '@prisma/client';
// (reusar checkPayrollLock pattern del analog)
```

**Core upsert pattern** — del RESEARCH.md (Code Examples, lineas 477-499):
```typescript
static async confirmDay(employeeId: number, date: string, userId: number) {
  const dateObj = new Date(date);
  // Verificar payroll lock antes de confirmar (mismo patrón que ClockLogAdjustmentService.checkPayrollLock)
  await this.checkPayrollLock(employeeId, dateObj);

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
      confirmation_version: { increment: 1 },
    }
  });
}
```

**checkPayrollLock — copiar directamente** de `ClockLogAdjustmentService.ts` lineas 108-128:
```typescript
private static async checkPayrollLock(employeeId: number, date: Date): Promise<void> {
  const lockedPayroll = await prisma.vpg_payrolls.findFirst({
    where: {
      payrolls_status: { in: [PayrollStatus.PAGADA, PayrollStatus.APROBADA] },
      payrolls_period_start: { lte: date },
      payrolls_period_end: { gte: date },
      vpg_payroll_employee: {
        some: { payroll_employee_employee_id: employeeId }
      }
    }
  });
  if (lockedPayroll) {
    throw new Error(`No se puede confirmar un día de planilla con estado ${lockedPayroll.payrolls_status}`);
  }
}
```

---

### `src/backend/src/service/MarkSuggestionService.ts` (service, request-response)

**Analog:** `src/backend/src/service/ClockLogEffectiveService.ts` — patrón de query histórica

**Core query pattern** (inspirado en `getEffectiveLogs`, lineas 454-533):
```typescript
export class MarkSuggestionService {
  /**
   * Suggests a missing clock mark time based on employee history.
   * @param employeeId - Employee to analyze
   * @param date - Date of the missing mark (YYYY-MM-DD)
   * @param missingType - 'IN' or 'OUT'
   * @returns Suggested time and method used
   */
  static async suggestMark(
    employeeId: number,
    date: string,
    missingType: 'IN' | 'OUT'
  ): Promise<{ suggested_time: string; method: 'historical_avg' | 'last_seen' | 'window_center' }> {
    // Consultar últimas N marcas del mismo tipo para el empleado
    const recentLogs = await prisma.vpg_clock_logs.findMany({
      where: {
        clock_logs_employee_id: employeeId,
        clock_logs_log_type: missingType as ClockLogType,
        // Últimos 30 días
      },
      orderBy: { clock_logs_timestamp: 'desc' },
      take: 14,
    });
    // Calcular promedio de hora → method: 'historical_avg'
    // Fallback: última ocurrencia → method: 'last_seen'
    // Fallback final: centro de ventana configurada → method: 'window_center'
  }
}
```

---

### `src/backend/src/controller/TimeWindowController.ts` (controller, request-response)

**Analog:** `src/backend/src/controller/ClockLogAdjustmentController.ts`

**Imports pattern** (lineas 1-6):
```typescript
import { Request, Response } from 'express';
import { TimeWindowService } from '../service/TimeWindowService';
```

**Core CRUD handler pattern** (lineas 15-30 del analog):
```typescript
export class TimeWindowController {
  /**
   * GET /api/time-windows
   */
  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const windows = await TimeWindowService.getAll();
      return res.json({ success: true, data: windows });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/time-windows
   */
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const result = await TimeWindowService.create(req.body);
      return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<Response> { ... }
  async delete(req: Request, res: Response): Promise<Response> { ... }
}
```

**userId extraction pattern** (linea 16 del analog):
```typescript
const userId: number = (req as any).user?.id ?? (req as any).user?.user_id ?? 1;
```

---

### `src/backend/src/controller/DayConfirmationController.ts` (controller, request-response)

**Analog:** `src/backend/src/controller/ClockLogAdjustmentController.ts`

**Core pattern** — mismo que TimeWindowController, con variante para confirmDay:
```typescript
async confirmDay(req: Request, res: Response): Promise<Response> {
  const userId: number = (req as any).user?.id ?? (req as any).user?.user_id ?? 1;
  const { employee_id, date } = req.body;

  try {
    const result = await DayConfirmationService.confirmDay(employee_id, date, userId);
    return res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    if (error.message.includes('PAGADA') || error.message.includes('APROBADA')) {
      return res.status(403).json({ success: false, error: error.message });
    }
    return res.status(400).json({ success: false, error: error.message });
  }
}
```

**GET day-confirmations pattern** (inspirado en `getEffectiveMarks`, lineas 66-113 del analog):
```typescript
async getDayConfirmations(req: Request, res: Response): Promise<Response> {
  const { employee_id, initDate, endDate } = req.query;
  // Parsear con parseLocalDate / parseLocalDateEnd (importar de ../utils/dateUtils)
  // Retornar { success: true, data: [...] }
}
```

---

### `src/backend/src/routes/TimeWindowRoute.ts` (route, request-response)

**Analog:** `src/backend/src/routes/ClockLogsRoute.ts`

**Complete pattern** (lineas 1-54 del analog):
```typescript
import { Router } from "express";
import { TimeWindowController } from "../controller/TimeWindowController";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { validateBody } from '../middleware/validateBody';
import { createTimeWindowSchema, updateTimeWindowSchema } from '../schemas/TimeWindowSchema';

const router = Router();

router.use(AuthMiddleware.verifyToken);

const controller = new TimeWindowController();

router.get("/time-windows", asyncHandler((req, res) => controller.getAll(req, res)));
router.post("/time-windows",
  AuthMiddleware.requireRole(['admin']),
  validateBody(createTimeWindowSchema),
  asyncHandler((req, res) => controller.create(req, res))
);
router.put("/time-windows/:id",
  AuthMiddleware.requireRole(['admin']),
  validateBody(updateTimeWindowSchema),
  asyncHandler((req, res) => controller.update(req, res))
);
router.delete("/time-windows/:id",
  AuthMiddleware.requireRole(['admin']),
  asyncHandler((req, res) => controller.delete(req, res))
);

export default router;
```

**Nota crítica:** `router.use(AuthMiddleware.verifyToken)` debe ir ANTES de todas las rutas (linea 17 del analog). Los endpoints de configuración requieren `AuthMiddleware.requireRole(['admin'])` (RESEARCH.md, Security Domain).

---

### `src/backend/src/schemas/TimeWindowSchema.ts` (schema/validation, request-response)

**Analog:** `src/backend/src/schemas/AdjustmentSchema.ts`

**Imports + export pattern** (lineas 1-42 del analog):
```typescript
import { z } from 'zod';

export const createTimeWindowSchema = z.object({
  time_window_label: z.string().min(1).max(100),
  time_window_log_type: z.enum(['IN', 'OUT']),
  time_window_start_hour: z.number().int().min(0).max(23),
  time_window_start_min: z.number().int().min(0).max(59).default(0),
  time_window_end_hour: z.number().int().min(0).max(23),
  time_window_end_min: z.number().int().min(0).max(59).default(0),
});

export const updateTimeWindowSchema = createTimeWindowSchema.partial().extend({
  time_window_active: z.boolean().optional(),
});

export type CreateTimeWindowInput = z.infer<typeof createTimeWindowSchema>;
export type UpdateTimeWindowInput = z.infer<typeof updateTimeWindowSchema>;
```

---

### `src/backend/src/schemas/DayConfirmationSchema.ts` (schema/validation, request-response)

**Analog:** `src/backend/src/schemas/AdjustmentSchema.ts`

```typescript
import { z } from 'zod';

export const confirmDaySchema = z.object({
  employee_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date debe ser YYYY-MM-DD'),
});

export type ConfirmDayInput = z.infer<typeof confirmDaySchema>;
```

---

### `src/backend/prisma/schema.prisma` (migration, batch)

**Analog:** convenciones existentes en el schema — leer `src/backend/prisma/schema.prisma` para confirmar el bloque de `generator` y `datasource` antes de agregar modelos.

**Naming conventions** observadas en el schema actual:
- Tabla: `vpg_<nombre>` en snake_case
- Campo: `<tablename_sin_vpg>_<fieldname>` en snake_case
- FK map: `fk_vpg_<tabla>_<referencia>_<n>`
- Index map: `idx_vpg_<tabla>_<campo>`
- Unique map: `uq_vpg_<tabla>_<campos>`

**Modelos a agregar** (del RESEARCH.md, lineas 241-276):
```prisma
model vpg_time_windows {
  time_window_id          Int      @id @default(autoincrement())
  time_window_label       String   @db.VarChar(100)
  time_window_log_type    ClockLogType
  time_window_start_hour  Int
  time_window_start_min   Int      @default(0)
  time_window_end_hour    Int
  time_window_end_min     Int      @default(0)
  time_window_active      Boolean  @default(true)
  time_window_version     Int      @default(1)
  time_window_created_at  DateTime @default(now()) @db.Timestamp(6)

  @@index([time_window_active], map: "idx_vpg_time_windows_active")
  @@index([time_window_log_type], map: "idx_vpg_time_windows_log_type")
}

model vpg_day_confirmations {
  confirmation_id           Int           @id @default(autoincrement())
  confirmation_employee_id  Int
  confirmation_date         DateTime      @db.Date
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

**Comando post-edición:** `npx prisma migrate dev --name add_time_windows_and_day_confirmations` seguido de `npx prisma generate`.

---

### `src/frontend/src/features/clock-logs/parser/excelColumnDetector.ts` (utility, transform)

**Analog:** `src/backend/src/utils/clockLogNormalization.ts`

**Pattern:** funciones puras exportadas, sin dependencias de browser ni React. Tipado explícito sin `any`. Exportar tipos + funciones.

**Imports pattern** (lineas 1-4 del analog):
```typescript
// Sin imports de React, sin imports de ExcelJS — solo tipos puros
export type ColumnRole = 'name' | 'datetime' | 'date' | 'time' | 'type' | 'unknown';

interface ColumnScore {
  name: number; datetime: number; date: number; time: number; type: number;
}
```

**Core scoring pattern** (inspirado en RESEARCH.md Code Examples, lineas 460-472):
```typescript
/**
 * Analyzes worksheet cell content to infer the role of each column.
 * Samples the first 10 data rows (skips header row 1).
 * @param rows - Array of raw row objects (column index → cell value)
 * @returns Map of column index to inferred ColumnRole
 */
export function detectColumnRoles(rows: Array<Record<number, unknown>>): Map<number, ColumnRole> {
  // Score each column by sampling cell content
  // Return highest-score role per column
}

export function inferCellRole(value: unknown): ColumnRole {
  // Date object → 'datetime'
  // typeof number → check if Excel serial (>40000) → 'datetime', else unknown
  // string with spaces, no digits → 'name'
  // string matching HH:MM pattern → 'time'
  // string matching date patterns → 'date'
}
```

**Importante:** Este módulo debe ser testeable con Jest en Node.js (sin jsdom). No importar ExcelJS aquí; el componente React pasa los valores de celda ya extraídos.

---

### `src/frontend/src/features/clock-logs/parser/dateFormatParser.ts` (utility, transform)

**Analog:** `src/backend/src/utils/clockLogNormalization.ts`

**Pattern:** funciones puras, sin `any`, con JSDoc. Misma estructura que `normalizeLogType`.

```typescript
/**
 * Normalizes various date+time formats into a JS Date object.
 * Supports: DD/MM/YYYY HH:MM, YYYY-MM-DD HH:MM:SS, Excel numeric serial, Date objects.
 * All results are in America/Costa_Rica timezone (UTC-6).
 * @throws Error if value cannot be parsed to a valid date
 */
export function parseClockDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    // Excel serial: (n - 25569) * 86400000
    return new Date((value - 25569) * 86400 * 1000);
  }
  if (typeof value === 'string') {
    // Try DD/MM/YYYY HH:MM
    // Try YYYY-MM-DD HH:MM:SS
    // Try new Date(value)
  }
  throw new Error(`Formato de fecha no reconocido: ${String(value)}`);
}
```

**Pitfall a evitar** (RESEARCH.md Pitfall 5): normalizar a `America/Costa_Rica` (UTC-6). Verificar con `formatCRTime` de `DailyRow.tsx` lineas 43-50 — ese es el patrón de referencia del proyecto para mostrar hora CR.

---

### `src/frontend/src/features/clock-logs/parser/timeWindowClassifier.ts` (utility, transform)

**Analog:** `src/backend/src/utils/clockLogNormalization.ts` — misma estructura de función pura exportada.

**Interface + función** (del RESEARCH.md Code Examples, lineas 316-340):
```typescript
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TimeWindow {
  label: string;
  logType: 'IN' | 'OUT';
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
}

/**
 * Classifies a clock mark by matching its time against configured time windows.
 * @param timeMinutes - Minutes since midnight (0-1439)
 * @param windows - Active time windows from API
 * @returns logType inferred + confidence level + window label
 */
export function classifyByTimeWindow(
  timeMinutes: number,
  windows: TimeWindow[]
): { logType: 'IN' | 'OUT' | null; confidence: ConfidenceLevel; windowLabel: string | null } {
  // Solapamiento → forzar LOW (Pitfall 2 de RESEARCH.md)
  // Dentro de ventana clara → HIGH
  // Dentro de 30 min del borde → MEDIUM
  // Ninguna ventana → LOW
}
```

**Pitfall crítico** (RESEARCH.md Pitfall 2): si el tiempo cae en múltiples ventanas de tipos distintos → devolver `{ logType: null, confidence: 'LOW', windowLabel: null }` sin importar cuál ventana esté más centrada.

---

### `src/frontend/src/hooks/useClockAudit.ts` (hook, request-response)

**Analog:** `src/frontend/src/hooks/useEffectiveMarks.ts`

**Imports pattern** (lineas 1-8 del analog):
```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { EffectiveMarksService, EffectiveClockLog, EffectiveMarksFilters } from '@/services/effectiveMarksService';
import { dayConfirmationService } from '@/services/dayConfirmationService';
// (composición — llama useEffectiveMarks internamente o replica su patrón)
```

**Return shape obligatorio** (CLAUDE.md): `{ data, isLoading, error, ...actions }`

**Core pattern** (lineas 32-182 del analog, adaptado):
```typescript
export function useClockAudit() {
  // Copiar estado base de useEffectiveMarks (data, isLoading, error, filters, page, hasMore)
  // Agregar estado propio:
  const [confirmations, setConfirmations] = useState<Map<string, ConfirmationRecord>>(new Map());
  const [onlyProblems, setOnlyProblems] = useState(false);

  // fetchPage — igual a useEffectiveMarks.fetchPage
  // fetchConfirmations — nueva acción, useCallback
  const confirmDay = useCallback(async (employeeId: number, date: string) => {
    await dayConfirmationService.confirmDay(employeeId, date);
    // Actualizar confirmations state localmente
  }, []);

  return {
    data,
    isLoading,
    error,
    filters,
    confirmations,
    onlyProblems,
    setFilters,
    setOnlyProblems,
    confirmDay,
    unconfirmDay,
    loadMore,
    refresh,
  };
}
```

**Anti-patrón a evitar:** no usar `useState` para campos de formulario (CLAUDE.md). Los filtros van en estado pero son controlados por `setFilters` con `useCallback`.

**Race condition guard** (lineas 60-106 del analog): copiar el patrón `lastRequestId.current` para evitar race conditions en fetches concurrentes.

---

### `src/frontend/src/hooks/useTimeWindows.ts` (hook, CRUD)

**Analog:** `src/frontend/src/hooks/useEffectiveMarks.ts` — versión simplificada (sin paginación)

```typescript
export function useTimeWindows() {
  const [data, setData] = useState<TimeWindow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await timeWindowService.getAll();
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { data, isLoading, error, refresh: fetchAll, create, update, remove };
}
```

---

### `src/frontend/src/services/timeWindowService.ts` (service, CRUD)

**Analog:** `src/frontend/src/services/effectiveMarksService.ts`

**Imports + http pattern** (linea 1 del analog):
```typescript
import { http } from './http';
// NUNCA raw fetch — SIEMPRE http.ts (regla absoluta CLAUDE.md)
```

**Core pattern** (lineas 44-79 del analog, adaptado para CRUD):
```typescript
export const timeWindowService = {
  async getAll(): Promise<TimeWindow[]> {
    return await http.get('/time-windows') as TimeWindow[];
  },

  async create(data: CreateTimeWindowInput): Promise<TimeWindow> {
    return await http.post('/time-windows', data) as TimeWindow;
  },

  async update(id: number, data: UpdateTimeWindowInput): Promise<TimeWindow> {
    return await http.put(`/time-windows/${id}`, data) as TimeWindow;
  },

  async remove(id: number): Promise<void> {
    await http.delete(`/time-windows/${id}`);
  },
};
```

---

### `src/frontend/src/services/dayConfirmationService.ts` (service, CRUD)

**Analog:** `src/frontend/src/services/clockLogAdjustmentService.ts`

**Complete pattern** (lineas 36-82 del analog):
```typescript
import { http } from '@/services/http';
// NOTA: no tiene 'use client' al nivel del módulo — solo componentes tienen 'use client'

export const dayConfirmationService = {
  async confirmDay(employeeId: number, date: string): Promise<{ confirmation_id: number }> {
    return await http.post('/clock-logs/confirm-day', { employee_id: employeeId, date }) as { confirmation_id: number };
  },

  async unconfirmDay(employeeId: number, date: string): Promise<void> {
    await http.delete('/clock-logs/confirm-day', { employee_id: employeeId, date });
  },

  async getDayConfirmations(params: {
    initDate: string;
    endDate: string;
    employee_id?: number;
  }): Promise<DayConfirmation[]> {
    const query = new URLSearchParams({ initDate: params.initDate, endDate: params.endDate });
    if (params.employee_id) query.set('employee_id', String(params.employee_id));
    const raw = await http.raw(`/clock-logs/day-confirmations?${query.toString()}`, { method: 'GET' });
    const json = await raw.json();
    return json.data ?? [];
  },
};
```

---

### `src/frontend/src/components/ClockImportModal.tsx` (component, file-I/O)

**Analog:** `src/frontend/src/components/AddClockLogModal.tsx`

**Modal structure pattern** (lineas 27-37, 154-338 del analog):
```typescript
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), { ssr: false });

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = {
  hidden: { scale: 0.9, opacity: 0, y: 30 },
  visible: {
    scale: 1, opacity: 1, y: 0,
    transition: { type: 'spring' as const, damping: 20, stiffness: 250 },
  },
  exit: { scale: 0.9, opacity: 0, y: 30, transition: { duration: 0.2 } },
};
```

**Dynamic ExcelJS import** (RESEARCH.md Pitfall 7, Code Examples lineas 446-453):
```typescript
// NUNCA import estático de exceljs al nivel del módulo
// Siempre cargar dinámicamente al procesar el archivo:
const handleFileSelected = useCallback(async (file: File) => {
  const { Workbook } = await import('exceljs'); // dynamic import
  const workbook = new Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);
  // ...delegar a excelColumnDetector, dateFormatParser, timeWindowClassifier
}, [timeWindows]);
```

**Reset form on open/close** (lineas 88-96 del analog):
```typescript
useEffect(() => {
  if (!isOpen) {
    setPreviewRows([]);
    setSkippedRows([]);
    setStep('upload'); // 'upload' | 'preview' | 'confirming'
  }
}, [isOpen]);
```

**Props interface** (misma estructura que AddClockLogModalProps):
```typescript
interface ClockImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (sessionId: number, created: number) => void;
}
```

---

### `src/frontend/src/components/AuditDayRow.tsx` (component, request-response)

**Analog:** `src/frontend/src/components/DailyRow.tsx`

**Imports + types** (lineas 1-13 del analog, extendidos):
```typescript
import React from 'react';
import type { EffectiveClockLog } from '@/services/effectiveMarksService';
import MarkConfidenceBadge from '@/components/MarkConfidenceBadge';
import MarkTypeSelector from '@/components/MarkTypeSelector';
import { useState } from 'react';

interface AuditDayRowProps {
  log: EffectiveClockLog;
  isConfirmed: boolean;
  confirmedAt?: string;
  onConfirm: () => void;
  onUnconfirm: () => void;
  onEdit?: (entry: EffectiveClockLog) => void;
  onVoid?: (entry: EffectiveClockLog) => void;
  onAddMissing?: (type: 'in' | 'out', suggestedTime?: string) => void;
}
```

**formatCRTime helper** — copiar EXACTAMENTE de `DailyRow.tsx` lineas 43-50:
```typescript
const formatCRTime = (iso: string | null): string | null => {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('es-CR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Costa_Rica',
  });
};
```

**Horas calculadas siempre visible** (D-11) — usar el patrón de `displayHours` de DailyRow.tsx linea 93, pero en vista colapsada (no solo en el OUT mark).

**Botón Confirmar día** — nuevo elemento junto a los botones Editar/Anular (lineas 178-193 del analog):
```tsx
<button
  onClick={isConfirmed ? onUnconfirm : onConfirm}
  className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
    isConfirmed
      ? 'border-green-400 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
      : 'border-zinc-300 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
  }`}
>
  {isConfirmed ? 'Revisado' : 'Confirmar día'}
</button>
```

---

### `src/frontend/src/components/MarkConfidenceBadge.tsx` (component, transform)

**Analog:** patrón de badge de `ClockLogStatusBadge` (inferido por uso en DailyRow.tsx linea 136)

**Complete pattern** (del RESEARCH.md Code Examples, lineas 503-523):
```typescript
'use client';

import React from 'react';

interface MarkConfidenceBadgeProps {
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'PENDING';
}

const CONFIDENCE_STYLES: Record<MarkConfidenceBadgeProps['confidence'], string> = {
  HIGH: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  LOW: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PENDING: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

const CONFIDENCE_LABELS: Record<MarkConfidenceBadgeProps['confidence'], string> = {
  HIGH: 'Alta confianza',
  MEDIUM: 'Probable',
  LOW: 'Dudosa',
  PENDING: 'Pendiente',
};

const MarkConfidenceBadge: React.FC<MarkConfidenceBadgeProps> = ({ confidence }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CONFIDENCE_STYLES[confidence]}`}>
    {CONFIDENCE_LABELS[confidence]}
  </span>
);

export default MarkConfidenceBadge;
```

---

### `src/frontend/src/components/MarkTypeSelector.tsx` (component, request-response)

**Analog:** `src/frontend/src/components/AddClockLogModal.tsx` — patrón de type selection + submit

**Pattern:** dropdown inline que llama el endpoint EDIT. Requiere justificación (misma validación min 10 chars del modal analog).

```typescript
interface MarkTypeSelectorProps {
  clockLogId: number;
  employeeId: number;
  currentType: 'IN' | 'OUT';
  onSuccess: () => void;
}
```

**No usar `useState` para campo de formulario** si hay validación — usar `react-hook-form` + `zodResolver` (CLAUDE.md). Para este selector inline, dado que es solo 1-2 campos simples, puede usar estado local según criterio de CLAUDE.md ("react-hook-form para formularios"; un dropdown de 1 campo puede ser estado simple con validación manual del justificativo).

**Select component** — usar `@/components/ui/Select` (referenciado en AddClockLogModal.tsx lineas 8, 202-214).

---

### `src/frontend/src/components/AuditFilters.tsx` (component, request-response)

**Analog:** patrón de filtros de `useEffectiveMarks.ts` (lineas 41-44, 122-150 del hook)

```typescript
interface AuditFiltersProps {
  filters: EffectiveMarksFilters;
  onFiltersChange: (filters: Partial<EffectiveMarksFilters>) => void;
  onlyProblems: boolean;
  onOnlyProblemsChange: (value: boolean) => void;
}
```

**Date preset pattern** (lineas 126-150 de `useEffectiveMarks.ts`): reusar los presets `first_half`, `second_half`, `this_month` ya definidos en el hook.

---

### `src/frontend/src/components/TimeWindowConfig.tsx` (component, CRUD)

**Analog:** `src/frontend/src/components/AddClockLogModal.tsx` — patrón de modal con formulario

**Form pattern** (CLAUDE.md, New Frontend Form / Modal):
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTimeWindowSchema, CreateTimeWindowInput } from '@/schemas/TimeWindowSchema';

// useForm tipado:
const form = useForm<CreateTimeWindowInput, unknown, CreateTimeWindowInput>({
  resolver: zodResolver(createTimeWindowSchema),
  defaultValues: { time_window_start_min: 0, time_window_end_min: 0 },
});
```

**AnimatePresence + motion.div** — copiar `backdropVariants` / `modalVariants` exactamente de AddClockLogModal.tsx lineas 27-37.

**Reset on open/close** (lineas 88-96 del analog):
```typescript
useEffect(() => {
  if (isOpen) {
    form.reset();
  }
}, [isOpen, form]);
```

---

## Shared Patterns

### Autenticación y Autorización (backend)
**Source:** `src/backend/src/routes/ClockLogsRoute.ts` lineas 17, 34-35, 45-46
**Apply to:** `TimeWindowRoute.ts`, rutas de `confirm-day` y `suggest-mark` en ClockLogsRoute.ts

```typescript
// Aplicar a TODOS los routers nuevos:
router.use(AuthMiddleware.verifyToken);

// Endpoints de configuración (crear/editar/borrar ventanas):
AuthMiddleware.requireRole(['admin']),
```

### asyncHandler wrapper (backend)
**Source:** `src/backend/src/routes/ClockLogsRoute.ts` lineas 23-31
**Apply to:** Todos los handlers en rutas nuevas

```typescript
asyncHandler((req, res) => controller.method(req, res))
// NUNCA registrar el handler directamente sin asyncHandler
```

### Error response format (backend)
**Source:** `src/backend/src/controller/ClockLogAdjustmentController.ts` lineas 19-29
**Apply to:** Todos los controllers nuevos

```typescript
// Error: { success: false, error: error.message }
// Success: { success: true, data: ... }
// 201 para creación, 200 para reads, 400 para bad request, 403 para lock, 500 para internal
```

### Prisma singleton (backend)
**Source:** `src/backend/src/service/ClockLogAdjustmentService.ts` linea 1
**Apply to:** Todos los servicios backend nuevos

```typescript
import { prisma } from '../lib/prisma';
// NUNCA: new PrismaClient()
```

### http.ts — único cliente HTTP (frontend)
**Source:** `src/frontend/src/services/effectiveMarksService.ts` linea 1; `src/frontend/src/services/clockLogAdjustmentService.ts` linea 3
**Apply to:** `timeWindowService.ts`, `dayConfirmationService.ts`

```typescript
import { http } from '@/services/http';
// o
import { http } from './http';
// NUNCA: fetch() directo, axios, ni otro cliente
```

### framer-motion modal (frontend)
**Source:** `src/frontend/src/components/AddClockLogModal.tsx` lineas 11-37
**Apply to:** `ClockImportModal.tsx`, `TimeWindowConfig.tsx`

```typescript
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), { ssr: false });

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalVariants = {
  hidden: { scale: 0.9, opacity: 0, y: 30 },
  visible: { scale: 1, opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 250 } },
  exit: { scale: 0.9, opacity: 0, y: 30, transition: { duration: 0.2 } },
};
```

### Payroll lock check (backend — servicios de escritura)
**Source:** `src/backend/src/service/ClockLogAdjustmentService.ts` lineas 108-128
**Apply to:** `DayConfirmationService.confirmDay`

Copiar el método `checkPayrollLock` del analog — verifica que no haya planilla PAGADA o APROBADA que cubra la fecha del día a confirmar.

### Test de utilidades puras (backend)
**Source:** `src/backend/src/__tests__/unit/utils/clockLogNormalization.test.ts`
**Apply to:** tests de `excelColumnDetector.ts`, `dateFormatParser.ts`, `timeWindowClassifier.ts`

```typescript
// Estructura:
import { functionName } from '../../../utils/moduleName';

describe('moduleName', () => {
  describe('functionName', () => {
    it('should <expected behavior>', () => {
      expect(functionName(input)).toBe(expectedOutput);
    });

    it('should throw Error with descriptive message for <invalid input>', () => {
      expect(() => functionName(badInput)).toThrow(/mensaje/i);
    });
  });
});
```

**Ruta de import relativa** (3 niveles desde `__tests__/unit/utils/`): `'../../../utils/moduleName'`

Para tests de servicios backend, la ruta es: `'../../../service/ServiceName'`

---

## No Analog Found

No hay archivos sin análogo — todos los nuevos archivos tienen un patrón equivalente en el codebase.

---

## Pitfalls Críticos Para el Planner

Estos pitfalls del RESEARCH.md deben aparecer explícitamente en las acciones de cada plan:

| Pitfall | Archivo afectado | Acción preventiva |
|---|---|---|
| Timestamps numéricos Excel sin conversión | `dateFormatParser.ts` | Verificar `typeof value === 'number'` + fórmula `(n - 25569) * 86400000` |
| Solapamiento de ventanas → tipo incorrecto con HIGH | `timeWindowClassifier.ts` | Si tiempo en múltiples ventanas de tipos distintos → forzar `LOW` |
| Unique constraint al reimportar | `ClockLogsImportService` (sin cambios) | El JSON enviado al backend debe confiar en `skipDuplicates: true` del servicio existente |
| ExcelJS bundle size en Next.js 15 | `ClockImportModal.tsx` | `await import('exceljs')` dentro del handler, NUNCA import estático |
| Timezone CR: marcas de 08:00 aparecen como 14:00 | `dateFormatParser.ts` | Normalizar a `America/Costa_Rica` antes de enviar al backend |
| Estado "Revisado" obsoleto tras ajuste posterior | `AuditDayRow.tsx` | Comparar `confirmation_confirmed_at` vs `adjustment_created_at` más reciente del día |
| FK en vpg_day_confirmations requiere relación en vpg_employees y vpg_users | `schema.prisma` | Verificar que ambos modelos tengan el array de relación inversa agregado |

---

## Metadata

**Analog search scope:** `src/backend/src/{service,controller,routes,schemas,utils,__tests__}`, `src/frontend/src/{hooks,services,components}`
**Files scanned:** 18 archivos leídos completamente
**Pattern extraction date:** 2026-04-20
