# Phase 64: Snapshot de Params en Planilla Cerrada - Pattern Map

**Mapped:** 2026-04-29
**Files analyzed:** 7
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/backend/prisma/schema.prisma` + migration | config/schema | CRUD | `src/backend/prisma/schema.prisma` (Phase 55 LegalParamService) | exact |
| `src/backend/src/model/VpgPayrollParamSnapshot.ts` | model | CRUD | `src/backend/src/model/VpgLegalParam.ts` | exact |
| `src/backend/src/service/PayrollService.ts` (modify `approvePayroll` + add `getPayrollWithSnapshot`) | service | CRUD | `src/backend/src/service/PayrollService.ts` + `LegalParamService.ts` | exact |
| `src/backend/src/controller/PayrollController.ts` (add `getPayrollSnapshot` endpoint) | controller | request-response | `src/backend/src/controller/PayrollController.ts` | exact |
| `src/backend/src/routes/PayrollRoutes.ts` (add route) | route | request-response | `src/backend/src/routes/PayrollRoutes.ts` | exact |
| `src/frontend/src/services/payrollService.ts` (add `getPayrollSnapshot` method) | service | request-response | `src/frontend/src/services/payrollService.ts` | exact |
| `src/frontend/src/components/PayrollParamSnapshot.tsx` | component | request-response | `src/frontend/src/components/PayrollCreateModal.tsx` | role-match |
| `src/frontend/src/app/pages/payroll/[id]/page.tsx` (modify to load snapshot) | page | request-response | `src/frontend/src/app/pages/payroll/[id]/page.tsx` | exact |

---

## Pattern Assignments

### `src/backend/src/model/VpgPayrollParamSnapshot.ts` (NEW model interface)

**Analog:** `src/backend/src/model/VpgLegalParam.ts`

**Pattern** (lines 1–22):
```typescript
import { Decimal } from '@prisma/client/runtime/library';

/**
 * TypeScript interface for the vpg_legal_params table.
 * Mirrors the Prisma VpgLegalParam model field-for-field.
 */
export interface VpgLegalParam {
  id: string;
  key: string;
  value: Decimal;
  description: string;
  category: string; // WORKDAY | OVERTIME | CCSS | MIN_WAGE | FEATURE_FLAG
  validFrom: Date;
  validUntil: Date | null;
  isActive: boolean;
  isCritical: boolean;
  source_decree: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Apply to VpgPayrollParamSnapshot:**
Create mirror interface with fields: `id`, `payroll_id`, `param_key`, `param_value` (Decimal), `param_valid_from` (Date), `source_decree` (string | null), `captured_at` (Date).

---

### `src/backend/prisma/schema.prisma` + migration (NEW schema model)

**Analog:** `src/backend/prisma/schema.prisma` (existing models for vpgLegalParam and vpg_payrolls)

**Schema pattern:**
```prisma
model vpgPayrollParamSnapshot {
  id             String   @id @default(cuid())
  payroll_id     Int
  param_key      String
  param_value    Decimal
  param_valid_from DateTime
  source_decree  String?
  captured_at    DateTime @default(now())

  payroll        vpg_payrolls @relation(fields: [payroll_id], references: [payrolls_id])

  @@unique([payroll_id, param_key])
  @@map("vpg_payroll_param_snapshots")
}
```

**Add relation to vpg_payrolls:**
```prisma
model vpg_payrolls {
  // ... existing fields ...
  vpgPayrollParamSnapshots vpgPayrollParamSnapshot[]
}
```

**Migration command:**
```bash
npx prisma migrate dev --name add_vpg_payroll_param_snapshots
```

---

### `src/backend/src/service/PayrollService.ts` (modify approvePayroll + add getPayrollWithSnapshot)

**Analog:** `src/backend/src/service/PayrollService.ts` (lines 261–323) + `LegalParamService.ts` (lines 128–144)

**Imports pattern** (existing at top of file):
```typescript
import { prisma } from '../lib/prisma';
import { Payroll } from "../model/payroll";
import { PayrollStatus } from '@prisma/client';
import { LegalParamService } from './LegalParamService';
import { AuditLogsService } from './AuditLogsService';
```

**approvePayroll method — snapshot capture logic (insert after existing validation, before status update):**

From CONTEXT.md spec — execute in `approvePayroll` after validating BORRADOR status:
```typescript
// Fetch legal parameters EFFECTIVE AT PERIOD START (not now)
const paramsAtPeriodStart = await LegalParamService.getActiveParams(payroll.payrolls_period_start);

// Fetch enterprise config (limitation: not versioned, captures current state)
const enterprise = await prisma.vpg_enterprise.findFirst({
  select: {
    enterprise_minute_rounding_policy: true,
    enterprise_ordinary_shift_type: true,
    enterprise_is_commercial_activity: true
  }
});

// Build snapshot records
const snapshotData = [
  // Legal parameters
  ...paramsAtPeriodStart.map(p => ({
    payroll_id: payrollId,
    param_key: p.key,
    param_value: p.value,
    param_valid_from: p.validFrom,
    source_decree: p.source_decree
  })),
  // Enterprise config as special records
  {
    payroll_id: payrollId,
    param_key: 'ENTERPRISE_MINUTE_ROUNDING_POLICY',
    param_value: String(enterprise?.enterprise_minute_rounding_policy ?? 'EXACT'),
    param_valid_from: new Date(),
    source_decree: null
  },
  {
    payroll_id: payrollId,
    param_key: 'ENTERPRISE_ORDINARY_SHIFT_TYPE',
    param_value: enterprise?.enterprise_ordinary_shift_type ?? 'DIURNA',
    param_valid_from: new Date(),
    source_decree: null
  },
  {
    payroll_id: payrollId,
    param_key: 'ENTERPRISE_IS_COMMERCIAL_ACTIVITY',
    param_value: enterprise?.enterprise_is_commercial_activity ? '1' : '0',
    param_valid_from: new Date(),
    source_decree: null
  }
];

// Use transaction to ensure atomic snapshot + approval
await prisma.$transaction([
  prisma.vpgPayrollParamSnapshot.createMany({
    data: snapshotData,
    skipDuplicates: true  // Safe if re-approving same payroll
  }),
  // ... existing payroll update ...
]);
```

**New method — getPayrollWithSnapshot (add to class after approvePayroll):**
```typescript
/**
 * Get payroll with parameter snapshot
 * @param payrollId - The payroll ID
 * @returns Promise with payroll and parameter snapshot
 * @throws Error if payroll not found
 */
static async getPayrollWithSnapshot(payrollId: number): Promise<{
  payroll: Payroll;
  snapshot: Array<{
    param_key: string;
    param_value: string;
    param_valid_from: Date;
    source_decree?: string | null;
  }>;
}> {
  const payroll = await prisma.vpg_payrolls.findUnique({
    where: { payrolls_id: payrollId }
  });

  if (!payroll) throw new Error('Payroll not found');

  const snapshot = await prisma.vpgPayrollParamSnapshot.findMany({
    where: { payroll_id: payrollId },
    select: {
      param_key: true,
      param_value: true,
      param_valid_from: true,
      source_decree: true
    },
    orderBy: { param_key: 'asc' }
  });

  return {
    payroll: this.mapToPayroll(payroll),
    snapshot: snapshot.map(s => ({
      ...s,
      param_value: s.param_value.toString()
    }))
  };
}
```

---

### `src/backend/src/controller/PayrollController.ts` (NEW endpoint)

**Analog:** `src/backend/src/controller/PayrollController.ts` (lines 71–82: getPayrollById method)

**New controller method** (add after approvePayroll method):
```typescript
/**
 * Get payroll with parameter snapshot
 * GET /payroll/:id/snapshot
 * @param req - Express request object
 * @param res - Express response object
 * @returns Promise<Response> - HTTP response with payroll and snapshot or error
 */
static async getPayrollSnapshot(req: Request, res: Response) {
  try {
    const payrollId = Number(req.params.id);
    const result = await PayrollService.getPayrollWithSnapshot(payrollId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Failed to retrieve payroll snapshot:", error);
    res.status(error instanceof Error && error.message === 'Payroll not found' ? 404 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to retrieve payroll snapshot"
    });
  }
}
```

---

### `src/backend/src/routes/PayrollRoutes.ts` (NEW route)

**Analog:** `src/backend/src/routes/PayrollRoutes.ts` (lines 85–113: GET /payroll/:id route pattern)

**New route** (add after GET /payroll/:id route, before POST /payroll/:id/approve):
```typescript
/**
 * @route   GET /payroll/:id/snapshot
 * @desc    Get payroll with parameter snapshot
 * @access  Private
 */
/**
 * @swagger
 * /api/payroll/{id}/snapshot:
 *   get:
 *     tags:
 *       - Payroll
 *     summary: Get payroll parameter snapshot
 *     description: Retrieve payroll with captured legal parameters at approval time
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payroll ID
 *     responses:
 *       '200':
 *         description: Snapshot retrieved successfully
 *       '404':
 *         description: Payroll not found
 *       '500':
 *         description: Internal server error
 */
router.get("/payroll/:id/snapshot", asyncHandler(PayrollController.getPayrollSnapshot));
```

---

### `src/frontend/src/services/payrollService.ts` (NEW method)

**Analog:** `src/frontend/src/services/payrollService.ts` (lines 42–67: getPayrollById method pattern)

**Interfaces** (add after existing Payroll interface):
```typescript
export interface ParamSnapshot {
  param_key: string;
  param_value: string;
  param_valid_from: string;
  source_decree?: string;
}

export interface PayrollWithSnapshot {
  payroll: Payroll;
  snapshot: ParamSnapshot[];
}
```

**New method** (add to PayrollService object after getPayrollEmployees):
```typescript
async getPayrollSnapshot(payrollId: number): Promise<PayrollWithSnapshot> {
  try {
    const response = await http.get(`/payroll/${payrollId}/snapshot`);
    return response.data || { payroll: null, snapshot: [] };
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Error al obtener parámetros de planilla');
  }
}
```

---

### `src/frontend/src/components/PayrollParamSnapshot.tsx` (NEW collapsible component)

**Analog:** `src/frontend/src/components/PayrollCreateModal.tsx` (lines 1–99: framer-motion animation pattern with AnimatePresence + motion.div)

**Component pattern:**
```typescript
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { ParamSnapshot } from '@/services/payrollService';

interface PayrollParamSnapshotProps {
  snapshots: ParamSnapshot[];
  isLoading?: boolean;
}

export const PayrollParamSnapshot: React.FC<PayrollParamSnapshotProps> = ({ snapshots, isLoading = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!snapshots || snapshots.length === 0) {
    return null; // No snapshot for historical payrolls or error state
  }

  // Group by category: split param_key on first underscore (e.g., CCSS_OBRERO_SALUD → CCSS)
  const groupedByCategory = snapshots.reduce((acc, snap) => {
    const category = snap.param_key.split('_')[0] || 'OTROS';
    if (!acc[category]) acc[category] = [];
    acc[category].push(snap);
    return acc;
  }, {} as Record<string, ParamSnapshot[]>);

  return (
    <div className="border-t border-gray-200 pt-6 mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 font-semibold text-gray-900 hover:text-gray-700"
      >
        <ChevronDownIcon
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
        Parámetros utilizados en el cálculo
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            {isLoading ? (
              <p className="text-gray-600">Cargando parámetros...</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedByCategory).map(([category, params]) => (
                  <div key={category} className="bg-gray-50 rounded p-4">
                    <h4 className="font-semibold text-sm text-gray-900 mb-3">{category}</h4>
                    <table className="w-full text-sm">
                      <thead className="text-xs font-semibold text-gray-700">
                        <tr>
                          <th className="text-left pb-2">Parámetro</th>
                          <th className="text-right pb-2">Valor</th>
                          <th className="text-left pb-2">Vigente desde</th>
                          {params.some(p => p.source_decree) && (
                            <th className="text-left pb-2">Decreto</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {params.map((param) => (
                          <tr key={param.param_key}>
                            <td className="py-2 text-gray-900">{param.param_key}</td>
                            <td className="py-2 text-right text-gray-900 font-mono">
                              {isNaN(Number(param.param_value))
                                ? param.param_value
                                : Number(param.param_value).toFixed(2)}
                            </td>
                            <td className="py-2 text-gray-600">
                              {new Date(param.param_valid_from).toLocaleDateString('es-CR')}
                            </td>
                            {params.some(p => p.source_decree) && (
                              <td className="py-2 text-gray-600 text-sm">
                                {param.source_decree || '—'}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

---

### `src/frontend/src/app/pages/payroll/[id]/page.tsx` (modify to load snapshot)

**Analog:** `src/frontend/src/app/pages/payroll/[id]/page.tsx` (lines 26–62: loadPayrollDetails pattern)

**Modifications:**

1. **Add state** (lines 30–34, add after employees state):
```typescript
const [snapshots, setSnapshots] = useState<ParamSnapshot[]>([]);
const [snapshotsLoading, setSnapshotsLoading] = useState(false);
```

2. **Add import** (top of file):
```typescript
import { PayrollService, Payroll, PayrollEmployee, ParamSnapshot } from '@/services/payrollService';
import { PayrollParamSnapshot } from '@/components/PayrollParamSnapshot';
```

3. **Modify loadPayrollDetails** (lines 48–62):
```typescript
const loadPayrollDetails = async (id: number) => {
  setIsLoading(true);
  setError(null);
  try {
    const payrollData = await PayrollService.getPayrollById(id);
    setPayroll(payrollData);
    const employeesData = await PayrollService.getPayrollEmployees(id);
    setEmployees(employeesData);

    // Load snapshot if payroll is APROBADA or PAGADA
    if (payrollData.status === 'APROBADA' || payrollData.status === 'PAGADA') {
      setSnapshotsLoading(true);
      try {
        const { snapshot } = await PayrollService.getPayrollSnapshot(id);
        setSnapshots(snapshot || []);
      } catch (snapErr) {
        console.warn('Failed to load snapshot:', snapErr);
        // Gracefully degrade — don't fail page if snapshot unavailable
        setSnapshots([]);
      } finally {
        setSnapshotsLoading(false);
      }
    }
  } catch (err) {
    const message = (err as Error)?.message || 'Error al cargar los detalles de la planilla';
    setError(message);
  } finally {
    setIsLoading(false);
  }
};
```

4. **Add component to render** (in JSX, after employee table section):
```typescript
{payroll && (snapshots.length > 0 || payroll.status === 'APROBADA' || payroll.status === 'PAGADA') && (
  <PayrollParamSnapshot snapshots={snapshots} isLoading={snapshotsLoading} />
)}
```

---

## Shared Patterns

### Service Layer Pattern
**Source:** `src/backend/src/service/PayrollService.ts` + `LegalParamService.ts`
**Apply to:** All backend service methods in Phase 64

- All methods are static (no instantiation)
- Use `prisma` singleton import, never `new PrismaClient()`
- Wrap DB errors in try/catch, throw descriptive Error with context
- Use transactions (`prisma.$transaction`) when atomicity is needed (snapshot capture + status update)
- Include full JSDoc comments with `@param`, `@returns`, `@throws`

---

### Frontend Service Pattern
**Source:** `src/frontend/src/services/payrollService.ts`
**Apply to:** `payrollService.ts` new method

- All methods use `http.get|post|put|delete` (never raw `fetch`)
- Wrap in try/catch, throw Error with custom message
- Return properly typed data (use interface exports for types)
- Services are pure object exports with arrow functions, not classes

---

### Frontend Hook Pattern
**Source:** `src/frontend/src/hooks/usePayroll.ts`
**Apply to:** If snapshot loading is extracted to a separate hook

- Use `useState` for data, isLoading, error
- Use `useCallback` for async actions
- Return shape: `{ data, isLoading, error, ...actions }`
- Wrap service calls in try/catch, set error + toast on failure

---

### Component Animation Pattern
**Source:** `src/frontend/src/components/PayrollCreateModal.tsx` (lines 1–99)
**Apply to:** `PayrollParamSnapshot.tsx`

```typescript
// Dynamic import for Framer Motion (SSR safety)
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });
const AnimatePresence = dynamic(() => import('framer-motion').then(mod => mod.AnimatePresence), { ssr: false });

// Use AnimatePresence + motion.div for collapsible sections
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      {/* content */}
    </motion.div>
  )}
</AnimatePresence>
```

---

### Router Pattern
**Source:** `src/backend/src/routes/PayrollRoutes.ts` (lines 10–31, 31–83, 113–164)
**Apply to:** New route in PayrollRoutes

- All routes wrapped in `asyncHandler(ControllerMethod)`
- AuthMiddleware.verifyToken applied globally at router.use (line 10)
- Use validateBody middleware for POST/PUT with Zod schemas
- Swagger JSDoc comments above each route
- RESTful convention: GET = read, POST = action/create, PUT = update, PATCH = partial update

---

### Historical Payroll Handling
**Apply to:** Frontend component graceful degradation

- Check `if (snapshots.length === 0)` → return null (component doesn't render)
- Show "Datos de parámetros no disponibles para planillas anteriores a [fecha]" if needed (optional message)
- Never crash on missing snapshot; degrade gracefully
- Snapshots only exist for payrolls approved after Phase 64 implementation

---

## No Analog Found

All files have matching patterns in the existing codebase.

---

## Metadata

**Analog search scope:**
- Backend: `src/backend/src/service/`, `src/backend/src/controller/`, `src/backend/src/routes/`, `src/backend/src/model/`, `src/backend/prisma/`
- Frontend: `src/frontend/src/services/`, `src/frontend/src/components/`, `src/frontend/src/hooks/`, `src/frontend/src/app/pages/`

**Files scanned:** 40+

**Pattern extraction date:** 2026-04-29

**Key insight:** Phase 64 is a straightforward CRUD extension. Existing PayrollService and PayrollController patterns fully accommodate snapshot capture on approvePayroll. Frontend side-loads snapshot data via new service method and renders in collapsible component using proven framer-motion animation pattern. No architectural changes needed; pure additive feature.
