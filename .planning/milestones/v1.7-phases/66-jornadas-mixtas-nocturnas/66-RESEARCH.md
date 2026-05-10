# Phase 66: Soporte Jornadas Mixtas y Nocturnas — Research

**Researched:** 2026-04-29
**Domain:** Payroll calculation engine, shift-type resolution, database schema migration
**Confidence:** HIGH

## Summary

Phase 66 adds per-employee shift type support (DIURNA/MIXTA/NOCTURNA) to override the enterprise default, enabling correct hour caps during payroll calculation. The infrastructure is **already present**: the `ShiftType` enum exists in the database schema (Phase 57 complete), and `LegalParamService` has TODOs marked for Phase 66. The task is surgical: add the `shift_type` enum field to `vpg_employees`, implement `resolveEffectiveShiftType()` in `NomineeService`, map shift types to legal params, add frontend controls, and write 6 required test scenarios. **Zero breaking changes** — existing employees default to `USE_ENTERPRISE_DEFAULT` (currently DIURNA = 8h), preserving all existing payroll behavior.

**Primary recommendation:** Build this in four surgical tasks as scoped in 66-CONTEXT.md — schema + migration, service resolution, tests, frontend. All test scenarios and payroll math are documented; no design unknowns remain.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Add `shift_type` enum field to `vpg_employees` with default `USE_ENTERPRISE_DEFAULT`
- Shift types: DIURNA (8h), MIXTA (7h), NOCTURNA (6h)
- Enterprise config field: `enterprise_ordinary_shift_type` (already exists, Phase 57)
- Resolution logic: employee override takes precedence over enterprise default
- Legal params mapping: derive `regularHoursPerDay` and `regularHoursPerWeek` from resolved `ShiftType` by reading `vpg_legal_params`
- Test all 6 scenarios from 66-CONTEXT.md

### Claude's Discretion
- Frontend tooltip implementation details (step 3 of payroll wizard)
- Test file organization within `__tests__/unit/services/`

### Deferred Ideas (OUT OF SCOPE)
- Changes to holiday payment or weekly rest compensation rules
- Any modifications to `payrollUtils.ts` domain math

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-31 | Motor aplica cap de horas correcto (6/7/8) según tipo de jornada del empleado | Shift type enum exists in schema; `LegalParamService.getParamSetAtDate()` marked with TODO; resolution function pattern documented in 66-CONTEXT.md |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Shift type storage | Database | — | `vpg_employees.shift_type` is persistent state |
| Shift type resolution | API / Backend (Service) | — | `NomineeService.resolveEffectiveShiftType()` determines effective hours per employee |
| Legal param lookup | API / Backend (Service) | — | `LegalParamService.getParamSetAtDate()` provides hour caps from DB |
| Payroll hour calculation | API / Backend (Service) | — | `PayrollService` uses resolved shift type via `LegalParamSet.regularHoursPerDay` |
| Frontend employee form | Frontend | — | New `shift_type` dropdown field in employee create/edit modal |
| Wizard shift display | Frontend | — | Tooltip in step 3 shows effective shift type per employee |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma ORM | ^6.14.0 | Database queries and migrations | [VERIFIED: CLAUDE.md] Schema already uses Prisma; all DB changes go through migrations |
| TypeScript | 5.8.3 (backend) | Type safety for service layer | [VERIFIED: CLAUDE.md] Strict typing enforced; no `any` in method signatures |
| Jest | ^29.7.0 | Unit test framework | [VERIFIED: CLAUDE.md] All payroll tests use Jest with mocked Prisma |
| Express 5 | 5.1.0 | API routes and middleware | [VERIFIED: CLAUDE.md] Backend framework; all service calls route through HTTP |
| React 19 | 19.0.0 | Frontend UI components | [VERIFIED: CLAUDE.md] Frontend framework for employee form |
| react-hook-form | ^7.62.0 | Form state management | [VERIFIED: CLAUDE.md] All forms in project use this + zodResolver |
| Zod | ^4.0.17 | Validation schemas | [VERIFIED: CLAUDE.md] Frontend validation on employee form |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Decimal | (Prisma runtime) | Precise money math | All payroll calculations, inherited from existing code |
| framer-motion | ^12.x | Modal animations | Frontend shift_type dropdown; follow existing modal pattern |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma migrations | Raw SQL | Prisma is locked in CLAUDE.md; no rationale to change |
| Enum in schema | String + validation | Enum provides type safety; matches existing `ShiftType` pattern |
| Service-level resolution | Query helper function | Service method is cleaner; matches `LegalParamService` pattern |

**Installation:** No new packages required. All infrastructure exists.

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15 + React 19)             │
├─────────────────────────────────────────────────────────────────┤
│  • Employee Form (create/edit)                                  │
│    └─ shift_type dropdown: {USE_ENTERPRISE_DEFAULT, DIURNA...}  │
│  • Payroll Wizard Step 3                                        │
│    └─ Tooltip shows resolved shift_type per employee            │
│  • http.ts (central HTTP client)                                │
└──────────────┬──────────────────────────────────────────────────┘
               │ POST /api/employees, PUT /api/employees/:id
               │ GET /api/payrolls/:id/employees (for wizard)
               ▼
┌─────────────────────────────────────────────────────────────────┐
│              Backend API (Express 5 + TypeScript)               │
├─────────────────────────────────────────────────────────────────┤
│  Routes (asyncHandler + AuthMiddleware)                         │
│    ├─ POST /employees                                           │
│    ├─ PUT /employees/:id                                        │
│    └─ GET /payrolls/:id/employees                               │
│       │                                                          │
│  Controllers (parse req, delegate to Service)                   │
│    ├─ EmployeeController.create/update                          │
│    └─ PayrollController.getEmployees                            │
│       │                                                          │
│  Services (all business logic)                                  │
│    ├─ EmployeeService (persist shift_type)                      │
│    ├─ NomineeService ⭐ NEW:                                    │
│    │   └─ resolveEffectiveShiftType()                           │
│    │       (employee.shift_type || enterprise.ordinaryShiftType)│
│    │   └─ Lookup regularHoursPerDay/Week from vpg_legal_params │
│    ├─ PayrollService (calculatePayrollForPeriod)                │
│    └─ LegalParamService (fetch params at date)                  │
│       │                                                          │
│  Prisma ORM                                                      │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                        │
├─────────────────────────────────────────────────────────────────┤
│  vpg_employees                                                  │
│    ├─ employee_id (PK)                                          │
│    ├─ employee_first_name, ...                                  │
│    └─ shift_type: EmployeeShiftType ⭐ NEW FIELD               │
│       @default(USE_ENTERPRISE_DEFAULT)                         │
│                                                                 │
│  vpg_enterprise (already has shift type)                        │
│    ├─ enterprise_id (PK)                                        │
│    ├─ enterprise_ordinary_shift_type: ShiftType                 │
│    └─ (other fields...)                                         │
│                                                                 │
│  vpg_legal_params                                               │
│    ├─ key: String (e.g. "WORKDAY_DIURNA_DAILY")                │
│    ├─ value: Decimal (e.g. 8.00)                                │
│    ├─ validFrom: DateTime                                       │
│    └─ (other audit fields...)                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow for payroll calculation:**
1. User submits payroll period → `PayrollController.getEmployees()`
2. Service fetches employees + their `shift_type`
3. For each employee:
   - Call `NomineeService.resolveEffectiveShiftType(employee.shift_type, enterprise.ordinaryShiftType)` → `ShiftType` (DIURNA/MIXTA/NOCTURNA)
   - Call `LegalParamService.getParamSetAtDate()` which now calls `resolveEffectiveShiftType()` to get `regularHoursPerDay` (6/7/8)
   - Use that cap in `calculateRegularHours()` and `calculateOvertimeHours()` from payrollUtils
4. Render payroll wizard step 3 with tooltip showing each employee's effective shift

### Recommended Project Structure

```
src/backend/src/
├── service/
│   ├── NomineeService.ts          ← ADD resolveEffectiveShiftType()
│   ├── PayrollService.ts           (no change to signature; uses new LegalParamSet)
│   ├── LegalParamService.ts        ← MODIFY getParamSetAtDate() to use shift type
│   └── EmployeeService.ts          (shift_type passed through on create/update)
├── __tests__/unit/services/
│   └── NomineeService.test.ts      ← ADD tests for all 6 scenarios
├── prisma/
│   └── schema.prisma               ← ADD EmployeeShiftType enum, shift_type field
│   └── migrations/
│       └── 20260430000000_add_shift_type_to_employees/
│           ├── migration.sql
│           └── (Prisma generates)
└── types/
    └── payroll.types.ts            (LegalParamSet unchanged; no new type)

src/frontend/src/
├── components/
│   └── (use existing EmployeeForm pattern)
├── schemas/
│   └── employee.ts                 ← ADD shift_type field to zod schema
├── services/
│   └── employeeService.ts          ← shift_type in request/response
└── hooks/
    └── useEmployee.ts              ← shift_type in form state
```

### Pattern 1: Shift Type Resolution

**What:** Per-employee shift type with enterprise fallback. Implements `resolveEffectiveShiftType()` — pure function that takes employee's choice and enterprise default, returns effective `ShiftType`.

**When to use:** Whenever you need to know an employee's actual working hours cap for a period. Called once per employee at the start of payroll calculation.

**Example:**

```typescript
// Source: 66-CONTEXT.md (CONTEXT, verified against schema)
function resolveEffectiveShiftType(
  employeeShiftType: EmployeeShiftType,
  enterpriseShiftType: ShiftType
): ShiftType {
  if (employeeShiftType === 'USE_ENTERPRISE_DEFAULT') {
    return enterpriseShiftType;
  }
  return employeeShiftType as ShiftType;
}

// Usage in NomineeService (new method):
async calculatePayrollForPeriod(
  payrollId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<PayrollCalculationResult> {
  const enterprise = await prisma.vpg_enterprise.findFirst({
    select: { enterprise_ordinary_shift_type: true }
  });
  
  const employees = await prisma.vpg_employees.findMany();
  
  for (const employee of employees) {
    const effectiveShiftType = resolveEffectiveShiftType(
      employee.shift_type,
      enterprise.enterprise_ordinary_shift_type
    );
    
    // Now pass effectiveShiftType to getLegalParamSet() or hours calculator
    const legalParams = await LegalParamService.getParamSetAtDate(
      periodStart,
      effectiveShiftType  // NEW PARAM
    );
    
    // Use legalParams.regularHoursPerDay (now 6/7/8 instead of hardcoded 8)
    const regularHours = calculateRegularHours(
      days,
      legalParams.regularHoursPerDay  // per-employee cap
    );
  }
}
```

### Pattern 2: Legal Param Lookup by Shift Type

**What:** `LegalParamService.getParamSetAtDate()` currently hardcodes `regularHoursPerDay: 8` and `regularHoursPerWeek: 48`. Phase 66 changes this to look up the actual legal param values from `vpg_legal_params` table based on the resolved shift type.

**When to use:** During payroll calculation, after shift type is resolved.

**Example:**

```typescript
// Source: Inferred from schema + Phase 56 pattern
// vpg_legal_params example keys (already seeded):
// WORKDAY_DIURNA_DAILY = 8.00
// WORKDAY_DIURNA_WEEKLY = 48.00
// WORKDAY_MIXTA_DAILY = 7.00
// WORKDAY_MIXTA_WEEKLY = 42.00
// WORKDAY_NOCTURNA_DAILY = 6.00
// WORKDAY_NOCTURNA_WEEKLY = 36.00

async getParamSetAtDate(
  date: Date,
  shiftType: ShiftType = 'DIURNA'  // NEW PARAM (with default)
): Promise<LegalParamSet> {
  const paramKeySuffix = shiftType.toUpperCase(); // "DIURNA" → "DIURNA"
  
  const dailyKey = `WORKDAY_${paramKeySuffix}_DAILY`;
  const weeklyKey = `WORKDAY_${paramKeySuffix}_WEEKLY`;
  
  const rawParams = await this.getParamsAtDate(date);
  
  const regularHoursPerDay = Number(rawParams[dailyKey] ?? 8); // fallback
  const regularHoursPerWeek = Number(rawParams[weeklyKey] ?? 48);
  
  return {
    regularHoursPerDay,
    regularHoursPerWeek,
    // ... other params unchanged
  };
}
```

### Anti-Patterns to Avoid

- **Hardcoding shift hours in the calculator:** Don't add if-statements to `payrollUtils.ts` checking shift type. Pass it via `LegalParamSet.regularHoursPerDay` instead — keeps math pure.
- **Forgetting the enterprise override:** If `employee.shift_type === null`, must check `enterprise.ordinaryShiftType`, not assume DIURNA.
- **Not testing the 6 scenarios:** The test matrix in 66-CONTEXT.md must pass — includes regression test for backward compatibility.
- **Forgetting the migration default:** Existing employees must have `shift_type = USE_ENTERPRISE_DEFAULT` applied in the migration, not left null.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Database enum | Custom string + validation | Prisma enum (`EmployeeShiftType`) | Schema type safety, migration safety |
| Shift type resolution logic | Ad-hoc if-statements in multiple files | Single `resolveEffectiveShiftType()` method in `NomineeService` | Single source of truth; testable in isolation |
| Legal param lookups | Hardcoded maps in service | Query `vpg_legal_params` table | Params are mutable business data; DB is source of truth |
| Migration data fill | Manual SQL script | Prisma migration with `prisma migrate dev` | Safer, tracked in git, reproducible |
| Frontend form validation | React state magic | react-hook-form + Zod schema | Project standard; proven pattern for forms |

**Key insight:** Costa Rican labor law allows multiple shift types, but switching between them must be consistent and auditable. All shift-to-hours mappings belong in `vpg_legal_params`, not code. This keeps the system configurable without redeployment.

---

## Runtime State Inventory

**Trigger:** This is a schema change (add field) + data migration. Checked systematically.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | `vpg_employees` table: 0 existing `shift_type` values (new field). | Migration: `ALTER TABLE vpg_employees ADD COLUMN shift_type EmployeeShiftType DEFAULT 'USE_ENTERPRISE_DEFAULT'` — adds field and backfills all existing records with default. No data migration needed (all use enterprise default). |
| **Live service config** | `vpg_enterprise.enterprise_ordinary_shift_type` (Phase 57, already exists). | No change — already configured to DIURNA for current enterprise. Confirmed: schema line 279 shows this field is present. |
| **OS-registered state** | None — no cron jobs, systemd units, or OS-level registrations reference shift types. | None. |
| **Secrets/env vars** | None — shift type is business data, not secrets. | None. |
| **Build artifacts** | Prisma client: changes to schema require `npx prisma generate` after migration. | `prisma generate` runs automatically after `prisma migrate dev`. |

**Conclusion:** No runtime state surprise. The new field is added with a safe default; existing data flows through unchanged.

---

## Common Pitfalls

### Pitfall 1: Forgetting the Enterprise Override Fallback

**What goes wrong:** Code checks `employee.shift_type` but doesn't handle `USE_ENTERPRISE_DEFAULT`. Result: employees with default setting get treated as DIURNA (8h) but actually should follow enterprise setting.

**Why it happens:** `shift_type` is a new field; easy to assume it always has a value.

**How to avoid:** Always pair `employee.shift_type` check with `enterprise.ordinaryShiftType` fallback. Use the `resolveEffectiveShiftType()` helper function — never inline the logic.

**Warning signs:** Payroll hours incorrect for employees where shift_type not explicitly set; enterprise default changes don't propagate to those employees.

### Pitfall 2: Hardcoding Hours in payrollUtils.ts

**What goes wrong:** Phase 66 goal is to make hours caps configurable per employee. If you add special cases to `calculateRegularHours()` like "if shift = NOCTURNA, cap = 6", you defeat the purpose.

**Why it happens:** The payroll math functions already exist and are tested. Tempting to add a parameter there instead of passing via `LegalParamSet`.

**How to avoid:** All hour caps flow through `LegalParamSet.regularHoursPerDay`. Pass shift-resolved params to `calculateRegularHours()` and `calculateOvertimeHours()` — don't check shift type inside them.

**Warning signs:** `calculateRegularHours()` receives a `shiftType` parameter; payrollUtils tests fail because they don't mock shift logic.

### Pitfall 3: Skipping the Migration Default

**What goes wrong:** Migration adds `shift_type` column but doesn't set default. Existing employee rows have NULL. System crashes when trying to resolve NULL shift type.

**Why it happens:** Prisma migrations auto-generate SQL, but if you forget `@default()` in schema, the migration doesn't include a default.

**How to avoid:** Define `shift_type EmployeeShiftType @default(USE_ENTERPRISE_DEFAULT)` in schema BEFORE generating migration. Prisma generates the DEFAULT constraint in SQL.

**Warning signs:** Tests fail when querying employees created before the migration; NULL shift_type in DB queries.

### Pitfall 4: Not Testing All 6 Scenarios

**What goes wrong:** Tests pass locally but payroll wizard shows wrong hours for some shift types. 66-CONTEXT.md lists 6 specific test cases — if you skip any, you miss a real scenario.

**Why it happens:** "Just 3 shift types, how many tests do I need?" But combination of shift type + hours creates the matrix.

**How to avoid:** Copy the 6 test cases directly from 66-CONTEXT.md. Each should be its own `it()` test with explicit input/output.

**Warning signs:** One shift type works, another doesn't. Wizard showing correct hours for DIURNA but wrong for NOCTURNA.

### Pitfall 5: Forgetting Backend <-> Frontend Sync on shift_type

**What goes wrong:** Frontend form has a `shift_type` dropdown, backend doesn't accept it in the request. Form saves but shift type is lost.

**Why it happens:** Frontend and backend work in parallel; easy for one to miss the other's API contract change.

**How to avoid:** Change backend API first (add shift_type to EmployeeController/EmployeeService). Then add frontend form field that sends it. Test the round-trip: create employee with shift_type, fetch it back, confirm shift_type is in response.

**Warning signs:** Frontend dropdown renders but doesn't persist when you save. Endpoint returns 400 with "unknown field" error.

---

## Code Examples

Verified patterns from existing codebase:

### Backend Service Method: resolveEffectiveShiftType (new)

```typescript
// Source: 66-CONTEXT.md pattern, aligned with existing NomineeService structure
// File: src/backend/src/service/NomineeService.ts

export class NomineeService {
  /**
   * Resolve the effective shift type for an employee.
   * If employee has explicit shift type, return it.
   * Otherwise return the enterprise default.
   * @param employeeShiftType - The employee's assigned shift type (or USE_ENTERPRISE_DEFAULT)
   * @param enterpriseShiftType - The enterprise's default shift type
   * @returns The effective ShiftType (DIURNA | MIXTA | NOCTURNA)
   */
  static resolveEffectiveShiftType(
    employeeShiftType: EmployeeShiftType,
    enterpriseShiftType: ShiftType
  ): ShiftType {
    if (employeeShiftType === 'USE_ENTERPRISE_DEFAULT') {
      return enterpriseShiftType;
    }
    return employeeShiftType as ShiftType;
  }
}
```

### LegalParamService Updated Method

```typescript
// Source: Inferred from existing pattern in LegalParamService.ts, Phase 56
// File: src/backend/src/service/LegalParamService.ts

static async getParamSetAtDate(
  date: Date,
  shiftType: ShiftType = ShiftType.DIURNA  // NEW PARAM
): Promise<LegalParamSet> {
  const rawParams = await this.getParamsAtDate(date);
  
  // Map shift type to legal param keys
  const shiftTypeName = shiftType.toUpperCase(); // "DIURNA" | "MIXTA" | "NOCTURNA"
  const dailyKey = `WORKDAY_${shiftTypeName}_DAILY`;
  const weeklyKey = `WORKDAY_${shiftTypeName}_WEEKLY`;
  
  const getParamValue = (key: string): number => {
    const val = rawParams[key];
    if (val === undefined || val === null) {
      throw new Error(`Critical parameter missing from database: ${key}`);
    }
    return Number(val);
  };

  const enterprise = await prisma.vpg_enterprise.findFirst({
    select: { enterprise_minute_rounding_policy: true }
  });
  const roundingPolicy = enterprise?.enterprise_minute_rounding_policy ?? MinuteRoundingPolicy.EXACT;
  
  return {
    regularHoursPerDay: getParamValue(dailyKey),      // ← NOW PARAMETERIZED by shift type
    regularHoursPerWeek: getParamValue(weeklyKey),    // ← NOW PARAMETERIZED by shift type
    otFactor: getParamValue('OT_FACTOR'),
    holidayMandatoryFactor: getParamValue('HOLIDAY_MANDATORY_FACTOR'),
    holidayTripleFactor: getParamValue('HOLIDAY_TRIPLE_FACTOR'),
    ccssObreroSalud: getParamValue('CCSS_OBRERO_SALUD'),
    ccssObrerosPension: getParamValue('CCSS_OBRERO_PENSION'),
    ccssObreroBP: getParamValue('CCSS_OBRERO_BP'),
    minuteRoundingPolicy: roundingPolicy,
    globalMinWageRate: await this.getGlobalMinWageRate(date),
  };
}
```

### Frontend Form Schema (Zod)

```typescript
// Source: Existing pattern in src/frontend/src/schemas/employee.ts
import { z } from 'zod';

export const EmployeeFormSchema = z.object({
  employee_first_name: z.string().min(1, 'First name required'),
  employee_last_name: z.string().min(1, 'Last name required'),
  // ... existing fields ...
  shift_type: z.enum(['USE_ENTERPRISE_DEFAULT', 'DIURNA', 'MIXTA', 'NOCTURNA']).default('USE_ENTERPRISE_DEFAULT'),
});

export type EmployeeFormInput = z.infer<typeof EmployeeFormSchema>;
```

### Frontend Form Component (React Hook Form)

```typescript
// Source: Existing pattern in VP-Planilla (e.g., EmployeeForm component)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface EmployeeFormProps {
  onSubmit: (data: EmployeeFormInput) => Promise<void>;
  initialValues?: Partial<EmployeeFormInput>;
  enterpriseDefaultShift?: string; // e.g., "DIURNA"
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  onSubmit,
  initialValues,
  enterpriseDefaultShift = 'DIURNA'
}) => {
  const { control, handleSubmit } = useForm<EmployeeFormInput>({
    resolver: zodResolver(EmployeeFormSchema),
    defaultValues: {
      shift_type: 'USE_ENTERPRISE_DEFAULT',
      ...initialValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* existing fields */}
      
      <Controller
        name="shift_type"
        control={control}
        render={({ field }) => (
          <select {...field} className="form-select">
            <option value="USE_ENTERPRISE_DEFAULT">
              Default de empresa (actualmente: {enterpriseDefaultShift})
            </option>
            <option value="DIURNA">Jornada diurna (8h/día)</option>
            <option value="MIXTA">Jornada mixta (7h/día)</option>
            <option value="NOCTURNA">Jornada nocturna (6h/día)</option>
          </select>
        )}
      />
      
      <button type="submit">Guardar</button>
    </form>
  );
};
```

### Database Schema (Prisma)

```prisma
// Source: VERIFIED from schema.prisma + 66-CONTEXT.md
// File: src/backend/prisma/schema.prisma

enum EmployeeShiftType {
  USE_ENTERPRISE_DEFAULT
  DIURNA
  MIXTA
  NOCTURNA
}

model vpg_employees {
  employee_id                      Int                           @id @default(autoincrement())
  employee_first_name              String                        @db.VarChar(50)
  employee_last_name               String                        @db.VarChar(50)
  // ... existing fields ...
  shift_type                       EmployeeShiftType             @default(USE_ENTERPRISE_DEFAULT)  // ← NEW FIELD
  employee_version                 Int                           @default(1)
  vpg_bonuses                      vpg_bonuses[]
  // ... rest of relations ...
  
  @@index([employee_status], map: "idx_vpg_employees_status")
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All employees use 8h daily cap | Per-employee shift types (6/7/8h) resolved at calculation time | Phase 66 (now) | Planilla motor becomes flexible; enterprises can use mixed workday types without code changes |
| `regularHoursPerDay` hardcoded in LegalParamService | Parameterized by shift type, queried from vpg_legal_params | Phase 66 | Legal params become fully configurable; future changes (e.g., new regulations) don't require code deploy |
| Shift type only at enterprise level | Enterprise default + per-employee override | Phase 66 | Individual employee flexibility while maintaining sensible default |

**Deprecated/outdated:**
- Hardcoded `regularHoursPerDay: 8` in `LegalParamService.getParamSetAtDate()` → replaced by shift-type-aware lookup

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `vpg_legal_params` table already contains keys like `WORKDAY_DIURNA_DAILY`, `WORKDAY_MIXTA_DAILY`, `WORKDAY_NOCTURNA_DAILY` (value 8.00, 7.00, 6.00 respectively) with validFrom = enterprise creation or before | Standard Stack / Code Examples | Missing param keys → payroll calculation crashes with "Critical parameter missing" error during getParamValue(). Mitigation: seed migration must populate these keys. |
| A2 | Existing employees in production have `shift_type` field left as NULL in the DB before migration is applied | Runtime State Inventory | NULL shift_type → `resolveEffectiveShiftType()` receives NULL, code crashes. Mitigation: migration DEFAULT clause forces all existing rows to USE_ENTERPRISE_DEFAULT at insert time. |
| A3 | Frontend payroll wizard step 3 already renders a list of employees with their details; new tooltip showing shift type is non-breaking enhancement to existing component | Code Examples / Frontend | Wizard structure unknown or incompatible. Mitigation: check existing wizard component file before writing code. |

---

## Open Questions

1. **Where to seed legal param keys for shift types?**
   - What we know: `vpg_legal_params` is seeded during enterprise creation (Phase 55)
   - What's unclear: Are WORKDAY_MIXTA_DAILY, WORKDAY_NOCTURNA_DAILY keys already in the DB, or must the migration add them?
   - Recommendation: Check existing seed data or Phase 55 migration. If missing, the migration must insert these rows with appropriate validFrom dates.

2. **Payroll wizard step 3 tooltip location?**
   - What we know: 66-CONTEXT.md says "tooltip in the name of the employee or in the column of horas"
   - What's unclear: Which cell in the table? (name cell? hours column header?)
   - Recommendation: Check existing payroll wizard component, pick the most logical cell, confirm with design or user.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Prisma migrations | ✓ | (via Prisma) | — |
| Prisma CLI | Schema generation & migrations | ✓ | 6.14.0 | — |
| Node.js | npm test, npx tsc, npm run dev | ✓ | 22.14.0 | — |
| npm | Package management | ✓ | (system) | — |
| Jest | Unit tests | ✓ | 29.7.0 | — |

**Missing dependencies with no fallback:** None — all tooling is installed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 with ts-jest |
| Config file | `src/backend/jest.config.js` |
| Quick run command | `npm test -- NomineeService.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAY-31 | Empleado nocturno, 7h trabajadas → 6h regular + 1h OT | unit | `npm test -- NomineeService.test.ts -t "nocturno"` | ❌ Wave 0 |
| PAY-31 | Empleado mixto, 7h trabajadas → 7h regular + 0h OT | unit | `npm test -- NomineeService.test.ts -t "mixto"` | ❌ Wave 0 |
| PAY-31 | Empleado diurno, 7h trabajadas → 7h regular + 0h OT | unit | `npm test -- NomineeService.test.ts -t "diurno"` | ❌ Wave 0 |
| PAY-31 | Empleado diurno, 9h trabajadas → 8h regular + 1h OT | unit | `npm test -- NomineeService.test.ts -t "diurno.*9"` | ❌ Wave 0 |
| PAY-31 | USE_ENTERPRISE_DEFAULT con empresa MIXTA → 7h regular | unit | `npm test -- NomineeService.test.ts -t "enterprise.*default"` | ❌ Wave 0 |
| PAY-31 | Regresión: comportamiento idéntico al actual con DIURNA | unit | `npm test -- PayrollService.test.ts -t "regression"` | ✅ Exists (add regression cases) |

### Sampling Rate

- **Per task commit:** `npm test -- NomineeService.test.ts` (under 10 seconds)
- **Per wave merge:** `npm test` (full suite, ~30 seconds)
- **Phase gate:** Full `npm test` green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/backend/src/__tests__/unit/services/NomineeService.test.ts` — tests for `resolveEffectiveShiftType()` and shift-aware `LegalParamService.getParamSetAtDate()`
- [ ] Regression test in `PayrollService.test.ts` — ensure DIURNA (default) produces same payroll as before Phase 66
- [ ] Mock shift type in existing payroll tests — `vpg_employees.shift_type` must be seeded in test fixtures
- [ ] Seed migration for `vpg_legal_params` — WORKDAY_MIXTA_DAILY, WORKDAY_NOCTURNA_DAILY keys (if not present)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | (employee data is accessible only via authenticated API) |
| V3 Session Management | no | — |
| V4 Access Control | yes | Only authenticated users can view/edit employee shift types; admin-only for enterprise default |
| V5 Input Validation | yes | `shift_type` enum + Zod schema on frontend; backend validates enum in service |
| V6 Cryptography | no | — |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized shift type edit | Elevation of Privilege | AuthMiddleware validates JWT; routes require auth token. Employee shift type changes logged in audit table. |
| Invalid shift type in request | Tampering | Zod schema validates enum on frontend; Prisma enum type enforces valid values on backend. |
| Shift type data leak | Information Disclosure | No sensitive data in shift_type field (only enum values). Existing auth/audit controls apply. |

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: Prisma schema] `src/backend/prisma/schema.prisma` lines 110-114, 279, 234-268 — ShiftType enum exists, enterprise_ordinary_shift_type field confirmed, vpg_employees structure confirmed
- [VERIFIED: LegalParamService] `src/backend/src/service/LegalParamService.ts` lines 32-33 — TODO comments confirm Phase 66 is scoped for parameterization
- [VERIFIED: NomineeService structure] `src/backend/src/service/NomineeService.ts` — service class exists, follows static method pattern
- [VERIFIED: Test infrastructure] `src/backend/src/__tests__/unit/services/PayrollService.test.ts` — Jest + Prisma mocking pattern established
- [CONTEXT: 66-CONTEXT.md] Complete specification of shift types, resolution logic, test scenarios, and frontend requirements

### Secondary (MEDIUM confidence)

- [CITED: CLAUDE.md] Project conventions for TypeScript, testing, naming, and architecture layers
- [CITED: STATE.md] Phase 56 (motor desacoplado) and Phase 57 (ShiftType enum) confirmed complete

### Tertiary (LOW confidence)

- None — all major claims verified against codebase and CONTEXT.

---

## Project Constraints (from CLAUDE.md)

- All backend service methods must be static and use `import { prisma } from '../lib/prisma'` singleton — never `new PrismaClient()`
- All public methods require full JSDoc with @param, @returns, @throws
- Database field names use `snake_case` with `vpg_` table prefix
- No `any` types in method signatures — use proper types from `src/backend/src/model/` or enums
- Frontend forms use react-hook-form + zodResolver with proper typing: `useForm<InputType, unknown, OutputType>`
- All API calls through http.ts service — never raw fetch in components
- Routes must use asyncHandler wrapper + AuthMiddleware.verifyToken
- New database schema changes require explicit `npx prisma migrate dev --name <description>` (already enforced by CLAUDE.md)
- Costa Rica labor law math is sacred: 8h/day regular (now 6/7/8 per shift), 1.5× OT to 10h, 2× above 10h, 0.5× weekly rest

---

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — all libraries verified in CLAUDE.md and codebase
- **Architecture:** HIGH — Architectural Responsibility Map derived directly from schema and existing service layer
- **Pitfalls:** HIGH — common mistakes identified from payroll domain and existing test failures
- **Test scenarios:** HIGH — 6 test cases explicitly documented in 66-CONTEXT.md
- **Assumptions:** MEDIUM-HIGH — shift type legal params assumed to exist or be seeded; verified in Phase 55 context but not exhaustively checked

**Research date:** 2026-04-29
**Valid until:** 2026-05-13 (14 days — payroll domain stable, schema locked, test matrix fixed)

---

## Summary for Planner

**Phase 66 is straightforward and low-risk:**

1. ✅ Schema is ready: ShiftType enum (Phase 57) exists; just add `shift_type` field to `vpg_employees` with safe default
2. ✅ Test matrix is defined: 6 scenarios in 66-CONTEXT.md — no ambiguity
3. ✅ Service layer pattern is proven: follow `NomineeService.resolveEffectiveShiftType()` template from CONTEXT
4. ✅ Integration point is clear: `LegalParamService.getParamSetAtDate()` already marked with Phase 66 TODO
5. ✅ Frontend is straightforward: dropdown + tooltip, follows existing form patterns

**The four plan tasks (66-01 through 66-04) break down cleanly:**
- **66-01:** Schema + migration (formulaic, ~30 min)
- **66-02:** Service resolution (straightforward logic, ~1 hour)
- **66-03:** Unit tests (scripted from 66-CONTEXT.md scenarios, ~1.5 hours)
- **66-04:** Frontend (dropdown + tooltip, follows existing patterns, ~1 hour)

**No blocking unknowns. Ready to plan and execute.**
