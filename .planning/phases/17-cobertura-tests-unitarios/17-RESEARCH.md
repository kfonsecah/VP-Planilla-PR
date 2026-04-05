# Phase 17: Cobertura Tests Unitarios - Research

**Researched:** 2026-04-04
**Domain:** Jest + ts-jest unit testing, Prisma mock patterns, TypeScript service testing
**Confidence:** HIGH

---

## Summary

Phase 17 targets raising backend test coverage from ~32% to ~60% statements/lines by adding unit
tests for 11 services and filling gaps in payrollUtils.ts and NomineeService.ts. The existing test
infrastructure is mature and consistent: all tests in `src/__tests__/unit/services/` use `jest-mock-extended`
`mockDeep<PrismaClient>()` against the `../../../lib/prisma` singleton, with `jest.clearAllMocks()` in
`beforeEach`. The pattern has been applied successfully to EmployeeService (97%) and DeductionsService
(90%), confirming it works with no friction.

The services targeted are structurally similar: each wraps Prisma queries and maps DB rows to domain
model objects. With the exception of UserService (has bcrypt-adjacent concerns via audit log writes),
AuditLogsService (uses `Promise.all` + `include`), and NotificationService (pagination pattern), all
services are simple CRUD. NomineeService is an outlier — it is an instance-based class with 12
pre-loader static methods plus the main `calculatePayrollForPeriod` orchestration — but the uncovered
lines (38-233, 308-317) are narrower than the full class.

The ~60% target is achievable: adding full coverage for the 9 simple services (~740 statements) plus
the targeted NomineeService gaps and remaining payrollUtils functions projects to approximately 1,000
new covered statements, pushing totals past 1,700/2,184 (~78%). Even at 70% realization that exceeds
the 60% goal.

**Primary recommendation:** Execute in three plan files. Plan 1 covers the five simplest CRUD
services. Plan 2 covers the three services with moderate complexity plus EmployeeDeductions. Plan 3
covers payrollUtils remaining functions and AuditLogsService. NomineeService gaps are carved into
Plan 2 as a separate describe block.

---

## Project Constraints (from CLAUDE.md)

- Test framework: Jest + ts-jest `^29.7.0`, run with `npm test` from `src/backend/`
- All Prisma access must use singleton: `import { prisma } from '../lib/prisma'` — `new PrismaClient()` is forbidden
- No changes to `src/backend/src/utils/payrollUtils.ts` logic — tests only verify existing behavior
- No changes to `src/backend/src/types/payroll.types.ts`
- TypeScript must pass: `npx tsc --noEmit` in `src/backend/`
- Files use PascalCase naming; test files follow `ServiceName.test.ts` pattern
- No `any` in test method signatures where avoidable

---

## Confirmed Test Pattern

### How `prisma-mock.ts` Is Used

The file at `src/__tests__/setup/prisma-mock.ts` exports a `prismaMock` proxy built with
`mockDeep<PrismaClient>()`, but **no existing service test imports this file directly**. All service
tests use a self-contained inline mock pattern instead:

```typescript
// Pattern used in ALL existing service tests
jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');
```

`prisma-mock.ts` is present but unused by the service tests — it appears to be leftover scaffolding
for a `setupFilesAfterFramework` integration path. Do NOT import it in new service tests. Use the
inline `jest.mock` pattern shown above.

### Standard Test File Structure

```typescript
import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { XyzService } from '../../../service/XyzService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

// 1. Define mock Prisma row (snake_case, matches DB schema)
const mockPrismaRecord = { ... };

// 2. Define domain model factory (camelCase/domain fields)
function makeRecord(input = {}) { return { ...defaults, ...input }; }

// 3. beforeEach: clearAllMocks + default mock responses
beforeEach(() => {
  jest.clearAllMocks();
  prisma.vpg_table.findUnique.mockResolvedValue(null);
  prisma.vpg_table.findMany.mockResolvedValue([]);
  prisma.vpg_table.create.mockResolvedValue(mockPrismaRecord);
  // ...
});

describe('XyzService', () => {
  describe('methodName', () => {
    it('should ...', async () => { ... });
    it('should throw if database fails', async () => { ... });
  });
});
```

### Key Observations

- `jest.clearAllMocks()` in `beforeEach` resets call counts — rely on this, do not call `mockReset`
- `jest.mock(...)` factory runs once; `prisma` reference obtained via `require` after the mock is established
- Mock Prisma rows use the full `vpg_tablename_fieldname` snake_case column naming
- Domain model factories use the short domain-model field names matching the `src/model/` interfaces
- Prisma error codes (e.g., `P2025`) are simulated by attaching `.code` to an `Error` instance
- `expect.objectContaining({...})` is used when only verifying a subset of the `create`/`update` call's `data`

---

## Service Analysis

### Plan 1 Services — Simple CRUD

#### VacationService.ts (8% coverage, lines 11-145)

| Method | Prisma model | Complexity |
|--------|-------------|------------|
| `getVacationById` | `vpg_vacations.findUnique` | Low — null check + map |
| `getAllVacations` | `vpg_vacations.findMany` | Low + special: swallows `P2021`/`does not exist` error |
| `createVacation` | `vpg_vacations.create` | Low |
| `updateVacation` | `vpg_vacations.update` | Low — increments version |
| `deleteVacation` | `vpg_vacations.delete` | Low — returns boolean |

Special case: `getAllVacations` catches errors whose message contains `'does not exist'` or `'p2021'`
and silently returns `[]`. This branch needs a dedicated test.

**Estimated statements:** ~60 (full coverage from ~5 to ~65).

#### BonusesService.ts (9.52% coverage, lines 11-135)

| Method | Prisma model | Complexity |
|--------|-------------|------------|
| `createBonus` | `vpg_bonuses.create` | Low — `Decimal` via `Number()` cast |
| `updateBonus` | `vpg_bonuses.findUnique` + `vpg_bonuses.update` | Medium — returns null if not found, version increment |
| `deleteBonus` | `vpg_bonuses.findUnique` + `vpg_bonuses.delete` | Medium — returns null if not found |
| `getBonusById` | `vpg_bonuses.findUnique` | Low |

Note: `bonuses_amount` is a `Decimal` in Prisma — the mock must return a plain number or the `Number(prismaBonus.bonuses_amount)` cast must be exercised. Use a plain `number` in the mock Prisma row (Decimal is only needed for real DB results).

**Estimated statements:** ~85 (from ~13 to ~98).

#### PayrollTypeService.ts (10.52% coverage, lines 12-91)

| Method | Prisma model | Complexity |
|--------|-------------|------------|
| `createPayrollType` | `vpg_payroll_types.create` | Low — wraps in try/catch, calls `prisma.$disconnect()` in `finally` |
| `updatePayrollType` | `vpg_payroll_types.update` | Low |
| `getPayrollTypeById` | `vpg_payroll_types.findUnique` | Low |
| `getAllPayrollTypes` | `vpg_payroll_types.findMany` | Low |

Special case: `createPayrollType` has a `finally { await prisma.$disconnect() }` block. The mock
must include `prisma.$disconnect.mockResolvedValue(undefined)` in `beforeEach` or the test will fail
with "not a function".

**Estimated statements:** ~65 (from ~10 to ~75).

#### PositionService.ts (10.52% coverage, lines 12-116)

| Method | Prisma model | Complexity |
|--------|-------------|------------|
| `getPositionById` | `vpg_positions.findUnique` | Low — calls `.toDecimalPlaces(2).toNumber()` on Decimal |
| `getAllPositions` | `vpg_positions.findMany` | Low — same Decimal mapping |
| `createPosition` | `vpg_positions.create` | Low |
| `updatePosition` | `vpg_positions.updateMany` | Medium — uses `updateMany` with version check; calls `this.getPositionById` after |
| `deletePosition` | `vpg_positions.deleteMany` | Low — returns `count > 0` |

Critical mock detail: `position_base_salary` is a Prisma `Decimal` — the mock Prisma row must return
an object with a `.toDecimalPlaces(2).toNumber()` method chain. Use:

```typescript
const mockDecimal = {
  toDecimalPlaces: (_: number) => ({ toNumber: () => 1500.00 }),
};
```

`updatePosition` internally calls `this.getPositionById` after `updateMany` — this requires the
`findUnique` mock to be set up to return a valid row (or the second mock call to return the updated
row).

**Estimated statements:** ~80 (from ~12 to ~92).

#### EmployeeDeductionsService.ts (33.33% coverage, lines 17-45)

| Method | Prisma model | Complexity |
|--------|-------------|------------|
| `assignDeductionToEmployee` | `vpg_deductions_per_employee.create` | Low — composite key |
| `removeDeductionFromEmployee` | `vpg_deductions_per_employee.delete` | Low — composite unique key in `where` |

The `where` clause for delete uses the composite key pattern:
```typescript
where: {
  deductions_per_employee_employee_id_deductions_per_employee_deduction_id: {
    deductions_per_employee_employee_id: employeeId,
    deductions_per_employee_deduction_id: deductionId,
  }
}
```
The mock must be set up with `prisma.vpg_deductions_per_employee.delete.mockResolvedValue(...)`.

**Estimated statements:** ~28 (from ~15 to ~43, full coverage).

### Plan 2 Services — Moderate Complexity

#### NotificationService.ts (10% coverage, lines 12-148)

| Method | Prisma model | Complexity |
|--------|-------------|------------|
| `createNotification` | `vpg_notifications.create` | Low |
| `getNotificationsByUserId` | `vpg_notifications.findMany` + `count` (Promise.all) | Medium — pagination (skip/take) |
| `getUnreadCount` | `vpg_notifications.count` | Low |
| `markAsRead` | `vpg_notifications.findFirst` + `update` | Medium — ownership check returns null |
| `markAllAsRead` | `vpg_notifications.updateMany` | Low — returns `result.count` |
| `deleteNotification` | `vpg_notifications.findFirst` + `delete` | Medium — throws if not found |

`getNotificationsByUserId` uses `Promise.all([findMany, count])` — both mocks must be set up.
`markAsRead` returns `null` (not throws) when not found. `deleteNotification` throws `'Notification not found or access denied'`.

**Estimated statements:** ~100 (from ~15 to ~115).

#### UserService.ts (17.14% coverage, lines 69-165)

| Method/function | Complexity |
|-----------------|------------|
| `getRoleCatalog()` | Trivial — returns static array |
| `mapUser()` (private) | Medium — `findRoleDefinition` lookup, fallback label |
| `listUsers()` | Low — `findMany` + map |
| `updatePermissions()` | High — validates role, checks user exists, updates, optionally writes audit log |

The `ROLE_DEFINITIONS` constant and `findRoleDefinition`/`buildFullName`/`fallbackRoleLabel` helpers
are module-level functions — they are exercised by testing the public methods; no direct import needed.

`updatePermissions` has three error paths:
1. Invalid role (400 with `error.statusCode`)
2. User not found (404 with `error.statusCode`)
3. Happy path with `actorId` (writes to `vpg_audit_logs.create`)
4. Happy path without `actorId` (no audit log write)

The mock must set up both `prisma.vpg_users.findUnique`, `prisma.vpg_users.update`, and
`prisma.vpg_audit_logs.create`.

**Estimated statements:** ~80 (from ~27 to ~107).

#### LaborEventsService.ts (6% coverage, lines 14-203)

| Method | Prisma model | Complexity |
|--------|-------------|------------|
| `createLaborEvent` | `vpg_labor_events.create` | Low |
| `updateLaborEvent` | `vpg_labor_events.update` | Low — note: post-null check is dead code (Prisma throws on not-found, `if (!prismaEvent)` never true) |
| `deleteLaborEvent` | `vpg_labor_events.delete` | Low — same dead-code null check |
| `getAllLaborEvents` | `vpg_labor_events.findMany` | Low |
| `getAllEmployeeLaborEvents` | `vpg_employee_labor_event.findMany` with `include` | Medium — nested relation mapping |
| `assignLaborEventsToEmployee` | `vpg_employee_labor_event.create` | Low |
| `deleteEmployeeLaborEvent` | `vpg_employee_labor_event.delete` | Low — catches error, returns null |

`getAllEmployeeLaborEvents` includes `vpg_labor_events` relation. The mock `findMany` result must
include a nested `vpg_labor_events` object (or `null`) to exercise both branches of `pe.vpg_labor_events?.labor_events_name || null`.

```typescript
// Mock row with relation
{
  employee_labor_event_id: 1,
  employee_labor_event_employee_id: 1,
  employee_labor_event_labor_event_id: 1,
  employee_labor_event_start_date: new Date('2026-01-01'),
  employee_labor_event_end_date: null,
  employee_labor_event_status: 'active',
  employee_labor_event_version: 1,
  vpg_labor_events: {
    labor_events_name: 'Incapacidad',
    labor_events_description: 'Baja médica',
  },
}
```

**Estimated statements:** ~155 (from ~12 to ~167).

#### NomineeService.ts — Targeted Gap Tests (51.32% baseline)

NomineeService is an **instance-based class** (non-static methods), which differs from all other
services. Tests must instantiate: `const service = new NomineeService()`.

Uncovered lines identified: 38-233, 308-317 (plus preloader statics).

The preloader static methods (`preloadClockLogs`, `preloadVacations`, `preloadLaborEvents`,
`preloadBonuses`, `preloadDeductions`, `preloadPositions`) are the main uncovered area in 38-233.
These each call a single Prisma `findMany` and group results into a `Map`. They can be tested
independently of `calculatePayrollForPeriod`.

Lines 308-317 appear to be the fallback path in `calculatePayrollForPeriod` when no active
employees are found (calls `getAllEmployees` and pushes a message). This can be tested by mocking
`EmployeeService.getActiveEmployeesForPeriod` to return `[]` and `EmployeeService.getAllEmployees`
to return a non-empty array.

**Estimated additional statements:** ~60 (preloaders) + ~20 (fallback path) = ~80.

### Plan 3 — payrollUtils Remaining + AuditLogsService

#### payrollUtils.ts (56.6% baseline)

Currently covered: `isCRHoliday`, `getCRHolidays`, `countWorkingDaysInPeriod`.

Uncovered functions (all pure — no Prisma, no mocking needed):

| Function | Complexity | Test approach |
|----------|------------|---------------|
| `calculateHoursBetween` | Low — subtraction + rounding | Multiple inputs |
| `isDateInRange` | Low — boolean comparisons | Boundary values |
| `formatDateString` | Low | Known date → string |
| `parseDateString` | Low — `isNaN` branch | Valid + invalid string |
| `generateDateRange` | Low | Start == end, multi-day |
| `roundToMoney` | Low | Edge cases (0, negative) |
| `validateClockLogPairs` | High — 5 branches: empty, 1 log, odd count, IN/OUT type mismatch, out <= in | Dedicated test per branch |
| `calculateTotalHoursFromPairs` | Low | Empty + multi-pair |
| `hasOverlappingPairs` | Medium — nested comparison | No overlap, with overlap |
| `applyPercentageDeduction` | Low | 0%, 100%, typical |
| `calculateNetSalary` | Low — `Math.max(0,...)` | Positive + negative gross |
| `validatePayrollPeriod` | Medium — 4 validation branches | Each invalid case |
| `calculateRegularHours` | Low | 0h, 8h, >8h days |
| `calculateOvertimeHours` | Low | 0h, >8h days |
| `calculateOvertimeHoursBiweekly` | Low | worked < required, worked > required |
| `getWeeklyRestDays` | Medium — filters vacation/Sunday | Various combos |
| `getSundaysInPeriod` | Low | Period with 0, 1, 2 Sundays |
| `calculateScheduledHours` | Low — delegates to countWorkingDays | Short period |
| `calculateWeeklyRestHours` | Low — formula check | Known input → expected output |
| `calculateOvertimePay` | Low | 0h, some OT |
| `calculateWeeklyRestPay` | Low | Delegates to helpers |
| `calculateGrossSalary` | Medium — composition | Full scenario |
| `hasAYear` | Low — date comparison | Before/after anniversary |
| `averageOfSalaries` | Low — `[]` guard + sum/12 | Empty array, non-empty |

`validateClockLogPairs` is the most complex — it has 5 distinct exit paths and requires structured
`{ timestamp, log_type }` input objects.

**Estimated statements gained:** ~160 (payrollUtils goes from ~56% to ~95% on ~180 total statements).

#### AuditLogsService.ts (8.69% coverage, lines 24-133)

| Method | Prisma model | Complexity |
|--------|-------------|------------|
| `getAuditLogs(filters)` | `vpg_audit_logs.findMany` + `count` (Promise.all) with `include` + `where` builder | High — 6 conditional `where` branches |
| `createAuditLog(params)` | `vpg_audit_logs.create` | Low |
| `getAuditLogById(id)` | `vpg_audit_logs.findUnique` with `include` | Low — null check |

`getAuditLogs` dynamically builds a `where` object based on 6 optional filter fields. Each branch
needs a test, but they share the same mock setup. The `findMany` result must include a nested
`vpg_users` object matching the `include` shape.

```typescript
const mockAuditLogRow = {
  audit_logs_id: 1,
  audit_logs_user_id: 1,
  audit_logs_action: 'CREATE',
  audit_logs_entity: 'vpg_employees',
  audit_logs_entity_id: 5,
  audit_logs_timestamp: new Date('2026-01-01'),
  audit_logs_details: '{}',
  vpg_users: {
    user_id: 1,
    user_username: 'admin',
    user_email: 'admin@vp.com',
  },
};
```

**Estimated statements:** ~100 (from ~11 to ~111).

---

## Coverage Gap Analysis — Statements Per Test Effort

| Service | Uncovered stmts (est.) | Test files needed | Effort |
|---------|----------------------|-------------------|--------|
| VacationService | ~55 | 1 | Low |
| BonusesService | ~75 | 1 | Low |
| PayrollTypeService | ~58 | 1 | Low |
| PositionService | ~70 | 1 | Low-Med |
| EmployeeDeductions | ~28 | 1 | Low |
| NotificationService | ~95 | 1 | Med |
| UserService | ~75 | 1 | Med |
| LaborEventsService | ~145 | 1 | Med |
| NomineeService (gaps) | ~80 | 1 (additions to existing file) | Med |
| payrollUtils (remaining) | ~160 | 1 (additions to existing file) | Low-Med |
| AuditLogsService | ~100 | 1 | Med |
| **TOTAL** | **~941** | **10 files** | |

Baseline covered statements: 690
Projected after phase: 690 + 941 = **1,631 / 2,184 = ~74.7% statements**

At 70% realization (accounting for miscounts): 690 + 659 = **1,349 / 2,184 = ~61.8%**

The 60% target is achievable even with a ~25% reduction in projected gains.

---

## Recommended Plan Breakdown

### Plan 1: Simple CRUD Services

Files to create:
- `src/__tests__/unit/services/VacationService.test.ts`
- `src/__tests__/unit/services/BonusesService.test.ts`
- `src/__tests__/unit/services/PayrollTypeService.test.ts`
- `src/__tests__/unit/services/PositionService.test.ts`
- `src/__tests__/unit/services/EmployeeDeductionsService.test.ts`

Expected coverage delta: +286 statements (~13 percentage points)
After Plan 1: ~44% coverage

### Plan 2: Moderate Complexity + NomineeService Gaps

Files to create/extend:
- `src/__tests__/unit/services/NotificationService.test.ts`
- `src/__tests__/unit/services/UserService.test.ts`
- `src/__tests__/unit/services/LaborEventsService.test.ts`
- `src/__tests__/unit/NomineeService.test.ts` (extend existing file with preloader describes)

Expected coverage delta: +395 statements (~18 percentage points)
After Plan 2: ~62% coverage — target achieved here

### Plan 3: payrollUtils Remaining + AuditLogsService

Files to create/extend:
- `src/__tests__/unit/payrollUtils.test.ts` (extend with all remaining functions)
- `src/__tests__/unit/services/AuditLogsService.test.ts`

Expected coverage delta: +260 statements (~12 percentage points)
After Plan 3: ~74% coverage — provides buffer above target

---

## Mock Strategy

### Standard Mock (all CRUD services)

```typescript
jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});
const { prisma } = require('../../../lib/prisma');

beforeEach(() => {
  jest.clearAllMocks();
});
```

### Prisma Decimal Mock (PositionService, BonusesService)

`position_base_salary` and `bonuses_amount` are Prisma `Decimal` types. The service calls
`.toDecimalPlaces(2).toNumber()` or `Number(value)` respectively. In mocks:

```typescript
// PositionService — requires method chain
const mockDecimal = {
  toDecimalPlaces: (_n: number) => ({ toNumber: () => 1500.00 }),
};
const mockPrismaPosition = {
  position_id: 1,
  position_name: 'Desarrollador',
  position_description: null,
  position_base_salary: mockDecimal,
  position_version: 1,
};

// BonusesService — Number() cast on raw value works with plain number
const mockPrismaBonus = {
  bonuses_amount: 5000, // plain number works because Number(5000) === 5000
  ...
};
```

### PayrollTypeService — $disconnect Mock

`createPayrollType` calls `prisma.$disconnect()` in `finally`. Add to `beforeEach`:

```typescript
prisma.$disconnect.mockResolvedValue(undefined);
```

Without this, tests throw `TypeError: prisma.$disconnect is not a function`.

### Promise.all Mock (NotificationService, AuditLogsService)

When `Promise.all([findMany, count])` is used, set up both mocks independently — they resolve in
parallel but the mock system handles each call independently:

```typescript
prisma.vpg_notifications.findMany.mockResolvedValue([mockNotificationRow]);
prisma.vpg_notifications.count.mockResolvedValue(1);
```

### Include/Relation Mock (LaborEventsService, AuditLogsService)

When `findMany` uses `include`, the mock must return rows with the nested relation object:

```typescript
prisma.vpg_employee_labor_event.findMany.mockResolvedValue([{
  ...mockEmployeeLaborEventRow,
  vpg_labor_events: { labor_events_name: 'Test', labor_events_description: null },
}]);
```

### UserService — No bcrypt

UserService does NOT use bcrypt directly — that is in AuthService. The `updatePermissions` method
writes to `vpg_audit_logs` via Prisma. The audit log write only happens when `actorId` is provided.
No special module mocking beyond the standard Prisma mock is needed.

```typescript
// Test both branches of actorId
await UserService.updatePermissions(1, 'analyst', 5);  // with actorId → audit log written
await UserService.updatePermissions(1, 'analyst');      // without actorId → no audit log
```

### NomineeService — Instance Instantiation

NomineeService methods are **non-static** instance methods. Tests must instantiate the class:

```typescript
const service = new NomineeService();
await service.calculatePayrollForPeriod(startDate, endDate);
```

Static preloaders (`preloadClockLogs`, etc.) are static and can be called directly:

```typescript
const map = await NomineeService.preloadClockLogs(startDate, endDate);
```

### PositionService — updatePosition Dual Mock

`updatePosition` calls `updateMany` then internally calls `this.getPositionById` (which calls
`findUnique`). Both must be mocked in sequence:

```typescript
prisma.vpg_positions.updateMany.mockResolvedValue({ count: 1 });
prisma.vpg_positions.findUnique.mockResolvedValue(mockPrismaPosition);
// updatePosition will return the result of findUnique
```

For the "no rows updated" case (version mismatch):
```typescript
prisma.vpg_positions.updateMany.mockResolvedValue({ count: 0 });
// findUnique should not be called; result is null
```

---

## Common Pitfalls

### Pitfall 1: Prisma Decimal Type in Mocks
**What goes wrong:** `position_base_salary.toDecimalPlaces is not a function` at test runtime.
**Why it happens:** Prisma `Decimal` fields are `Decimal` objects in real queries, but mocks return
plain objects. Services that call `.toDecimalPlaces(2).toNumber()` will throw if the mock returns a
plain number.
**How to avoid:** Always use a chainable mock object for Decimal fields: `{ toDecimalPlaces: (_) => ({ toNumber: () => value }) }`.
**Warning signs:** Test passes with a `mockResolvedValue` but crashes on the mapping step.

### Pitfall 2: Missing $disconnect Mock
**What goes wrong:** `TypeError: prisma.$disconnect is not a function` in PayrollTypeService tests.
**Why it happens:** `mockDeep` creates a proxy but `$disconnect` is on the PrismaClient instance;
`clearMocks` in `beforeEach` may not auto-configure it.
**How to avoid:** Add `prisma.$disconnect.mockResolvedValue(undefined)` in `beforeEach`.

### Pitfall 3: Include Shapes Not Matching
**What goes wrong:** `cannot read properties of undefined` when mapping nested `log.vpg_users.user_username`.
**Why it happens:** The mock `findMany` returns rows without the nested `vpg_users` object.
**How to avoid:** Mirror the exact `include` shape in mock data.

### Pitfall 4: Dead-Code Null Checks Post-Update/Delete
**What goes wrong:** Writing a test for the `if (!prismaEvent)` branch in `LaborEventsService.updateLaborEvent` — this branch is unreachable because Prisma throws `P2025` before returning.
**Why it happens:** The service has a defensive null check after `prisma.update()` that can never be `null` (Prisma throws, not returns null, on not-found for `update`/`delete`).
**How to avoid:** Do not write tests for these unreachable branches. Test the Prisma throw path instead. Coverage will not include the dead-code `if (!prismaEvent)` line — that is acceptable and normal.

### Pitfall 5: NomineeService Non-Static Methods
**What goes wrong:** `NomineeService.calculatePayrollForPeriod is not a function` when calling it as static.
**Why it happens:** Unlike all other services in the codebase, NomineeService uses instance methods.
**How to avoid:** Always `const service = new NomineeService()` before calling instance methods.

### Pitfall 6: VacationService getAllVacations Error Swallowing
**What goes wrong:** Forgetting to test the `'does not exist'` error path returns `[]`.
**Why it happens:** This is a unique defensive branch not present in other services.
**How to avoid:** Add a specific test: mock `findMany` to throw `new Error('Table does not exist')` and assert result is `[]`.

---

## Code Examples

### Full Standard Pattern (reference for all Plan 1 files)

```typescript
// Source: confirmed from EmployeeService.test.ts and DeductionsService.test.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { VacationService } from '../../../service/VacationService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

const mockPrismaVacation = {
  vacations_id: 1,
  vacations_employee_id: 10,
  vacations_start_date: new Date('2026-06-01'),
  vacations_end_date: new Date('2026-06-15'),
  vacations_total_days: 15,
  vacations_paid: true,
  vacations_status: 'approved',
  vacations_version: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.vpg_vacations.findUnique.mockResolvedValue(null);
  prisma.vpg_vacations.findMany.mockResolvedValue([]);
  prisma.vpg_vacations.create.mockResolvedValue(mockPrismaVacation);
  prisma.vpg_vacations.update.mockResolvedValue(mockPrismaVacation);
  prisma.vpg_vacations.delete.mockResolvedValue(mockPrismaVacation);
});

describe('VacationService', () => {
  describe('getVacationById', () => {
    it('should return vacation when found', async () => {
      prisma.vpg_vacations.findUnique.mockResolvedValue(mockPrismaVacation);
      const result = await VacationService.getVacationById(1);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
    });
    it('should return null when not found', async () => {
      const result = await VacationService.getVacationById(999);
      expect(result).toBeNull();
    });
  });

  describe('getAllVacations', () => {
    it('should return empty array when table does not exist', async () => {
      prisma.vpg_vacations.findMany.mockRejectedValue(new Error('Table does not exist'));
      const result = await VacationService.getAllVacations();
      expect(result).toEqual([]);
    });
  });
});
```

### Decimal Mock Pattern (PositionService)

```typescript
// Source: derived from PositionService.ts Decimal usage analysis
const mockDecimal = {
  toDecimalPlaces: (_: number) => ({ toNumber: () => 1500.00 }),
};
const mockPrismaPosition = {
  position_id: 1,
  position_name: 'Analista',
  position_description: 'Analista de sistemas',
  position_base_salary: mockDecimal,
  position_version: 1,
};
```

### payrollUtils Pure Function Tests (no mocking)

```typescript
// Source: derived from payrollUtils.ts analysis
import {
  calculateHoursBetween,
  validateClockLogPairs,
  calculateGrossSalary,
  hasAYear,
} from '../../utils/payrollUtils';

describe('calculateHoursBetween', () => {
  it('calculates 8 hours between 08:00 and 16:00', () => {
    const start = new Date('2026-01-05T08:00:00Z');
    const end = new Date('2026-01-05T16:00:00Z');
    expect(calculateHoursBetween(start, end)).toBe(8);
  });
});

describe('validateClockLogPairs', () => {
  it('returns valid for empty log array', () => {
    expect(validateClockLogPairs([])).toEqual({ isValid: true, messages: [], pairs: [] });
  });
  it('returns invalid for single log', () => {
    const result = validateClockLogPairs([{ log_type: 'IN', timestamp: '2026-01-05T08:00:00Z' }]);
    expect(result.isValid).toBe(false);
  });
  it('returns invalid for odd number of logs', () => {
    const logs = [
      { log_type: 'IN', timestamp: '2026-01-05T08:00:00Z' },
      { log_type: 'OUT', timestamp: '2026-01-05T16:00:00Z' },
      { log_type: 'IN', timestamp: '2026-01-05T17:00:00Z' },
    ];
    expect(validateClockLogPairs(logs).isValid).toBe(false);
  });
});
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + ts-jest |
| Config file | `src/backend/jest.config.js` |
| Quick run command | `npm test -- --testPathPattern="VacationService"` |
| Full suite command | `npm test -- --coverage` |

### Phase Requirements to Test Map

| Area | Behavior | Test Type | Automated Command |
|------|----------|-----------|-------------------|
| VacationService | CRUD + error swallowing | unit | `npm test -- --testPathPattern="VacationService"` |
| BonusesService | CRUD + null-on-not-found | unit | `npm test -- --testPathPattern="BonusesService"` |
| PayrollTypeService | CRUD + $disconnect | unit | `npm test -- --testPathPattern="PayrollTypeService"` |
| PositionService | CRUD + Decimal + updateMany | unit | `npm test -- --testPathPattern="PositionService"` |
| EmployeeDeductions | assign + remove composite key | unit | `npm test -- --testPathPattern="EmployeeDeductionsService"` |
| NotificationService | CRUD + pagination + mark-read | unit | `npm test -- --testPathPattern="NotificationService"` |
| UserService | listUsers + updatePermissions branches | unit | `npm test -- --testPathPattern="UserService"` |
| LaborEventsService | CRUD + assignEmployee + include | unit | `npm test -- --testPathPattern="LaborEventsService"` |
| NomineeService preloaders | Static Map-builders | unit | `npm test -- --testPathPattern="NomineeService"` |
| payrollUtils remaining | All pure functions | unit | `npm test -- --testPathPattern="payrollUtils"` |
| AuditLogsService | getAuditLogs filter branches | unit | `npm test -- --testPathPattern="AuditLogsService"` |
| Coverage gate | >= 60% statements | coverage | `npm test -- --coverage` |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="<ServiceName>"` (< 10 seconds)
- **Per plan merge:** `npm test -- --coverage` (full suite with coverage report)
- **Phase gate:** Full suite green + statements >= 60% before marking phase complete

### Wave 0 Gaps
None — the test infrastructure (`jest.config.js`, `ts-jest`, `jest-mock-extended`) is fully
installed. No new dependencies are needed. All new test files are additions to the existing
`__tests__/unit/services/` directory.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is code-only (adding test files). No external services, databases,
or CLI tools beyond the already-verified Jest + ts-jest setup are required.

---

## Sources

### Primary (HIGH confidence)
- Direct file analysis: `EmployeeService.test.ts` — confirmed mock pattern
- Direct file analysis: `DeductionsService.test.ts` — confirmed delete pattern
- Direct file analysis: `prisma-mock.ts` — confirmed it is NOT used by service tests
- Direct file analysis: all 9 service files — confirmed Prisma table names and method signatures
- Direct file analysis: `payrollUtils.ts` — confirmed all function signatures and branches
- Direct file analysis: `jest.config.js` — confirmed no coverage thresholds set

### Secondary (MEDIUM confidence)
- `jest-mock-extended` behavior with `$disconnect`: inferred from mockDeep proxy behavior and confirmed by `clearMocks: true` in jest config

### Tertiary (LOW confidence)
- Statement count estimates: derived by manual line count; actual Istanbul counts may vary by ±10%

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from existing test files
- Mock patterns: HIGH — confirmed by reading all 5 existing service test files
- Service analysis: HIGH — all service files read directly
- Statement estimates: MEDIUM — manual approximation; exact counts from `npx jest --coverage` after implementation
- Coverage projection: MEDIUM — 70% realization factor applied conservatively

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (stable pattern — valid until service files change)
