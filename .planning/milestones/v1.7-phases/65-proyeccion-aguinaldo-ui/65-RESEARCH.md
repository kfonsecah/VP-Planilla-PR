# Phase 65: Proyección de Aguinaldo en UI - Research

**Researched:** 2026-04-29
**Domain:** Full-stack payroll UI — backend aguinaldo calculation + frontend visualization
**Confidence:** HIGH

## Summary

This phase adds real-time aguinaldo accrual visualization across the system: employee profiles display accumulated aguinaldo with year-to-date progress, and the payroll wizard shows per-employee contributions. The backend has a working `calculateAguinaldo()` method that calculates proportional aguinaldo based on gross salaries from APROBADA/PAGADA payrolls in the Dec-Nov fiscal year. The frontend needs (1) a new service to fetch aguinaldo data, (2) integration into the employee profile card layout, (3) column and summary additions to the wizard steps 3 and 4.

**Primary recommendation:** Build backend endpoints `GET /employees/:id/aguinaldo` and `GET /payroll/:id/aguinaldo-summary` first (lean on existing `PayrollService.calculateAguinaldo()`), then add frontend hooks and components to display the data using established patterns (card layout in ProfileSummaryTab, table columns in wizard).

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

- `AguinaldoService.ts` with methods: `calculateAccruedAguinaldo()` and `getAguinaldoSummaryForPayroll()`
- Endpoints: `GET /employees/:id/aguinaldo` and `GET /payroll/:id/aguinaldo-summary`
- Frontend displays in three places:
  1. Employee profile: card with accrued amount + progress bar + projection
  2. Wizard step 3: "Aguinaldo acum." column in employee table
  3. Wizard step 4: summary box showing total commitment

### Claude's Discretion

- Exact card styling and animation (must follow Tailwind/framer-motion patterns from existing code)
- How to calculate `monthsCompleted` and `projectedAnnual` values
- Whether to show tooltips on wizard columns

### Deferred Ideas (OUT OF SCOPE)

- Actual payment of aguinaldo (separate phase)
- Changes to payroll calculation engine
- Redesign of audit or other views

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-30 | Proyección de Aguinaldo en UI | Backend `calculateAguinaldo()` exists; service needs two new public methods; frontend components need creation |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Aguinaldo calculation (sum gross/12) | API / Backend | — | Business logic lives in service layer, never browser |
| Per-employee accrual snapshot at approval time | API / Backend | Database | Captured during approval; needs period context |
| Employee aguinaldo display | Frontend / Browser | API | Read-only data fetch; client-side rendering for card/progress |
| Wizard step 3 table update | Frontend / Browser | API | Display layer adds column; API provides data |
| Wizard step 4 summary | Frontend / Browser | API | Aggregate display of summary data from API |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Express 5 | 5.1.0 | Backend routing, middleware | Project standard framework |
| TypeScript | 5.8.3 (backend) | Type safety | Non-negotiable for payroll calculations |
| Prisma | ^6.14.0 | ORM, database queries | Single source of Prisma in project |
| React 19 | 19.0.0 | Frontend UI | Frontend framework |
| Next.js 15 | 15.5.6 | Frontend routing | SSR + client components |
| Tailwind CSS | ^4 | Styling components | Existing card/progress bar patterns |
| framer-motion | ^12.x | Animations | Used throughout project for modals/transitions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | ^7.62.0 | Form state management | Not needed for Phase 65 (read-only) |
| Zod | ^4.0.17 | Schema validation | Validate API responses if needed |
| Heroicons | (built-in) | Icon library | Progress icon, currency icon in card |
| sonner | (installed) | Toast notifications | Show success/error when fetching aguinaldo |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New `AguinaldoService.ts` | Add methods to `PayrollService` | Reduces files but violates single-responsibility; aguinaldo is distinct from payroll approval |
| Separate fetch hook | Inline fetch in component | Hook is reusable, matches project pattern, testable in isolation |
| Backend stored calculation | Calculate on-demand | On-demand allows real-time "as of" dates; stored would require migration on every payroll |

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 15)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────────────┐                  │
│  │ Employee     │    │ Payroll Wizard       │                  │
│  │ Profile Page │    │ (Steps 3, 4)         │                  │
│  └──────────────┘    └──────────────────────┘                  │
│         │                       │                               │
│         │  useEmployeeProfile() │  usePayrollWizard()           │
│         │  + new hook for       │  + fetch aguinaldo data       │
│         │    aguinaldo          │                               │
│         └───────────────────────┘                               │
│                 │                                               │
│          http.get(/employees/:id/aguinaldo)                   │
│          http.get(/payroll/:id/aguinaldo-summary)             │
│                 │                                               │
└─────────────────┼───────────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────────┐ ┌──────────────────────┐
│ Express 5 Routes │ │ Express 5 Routes     │
│ (AuthMiddleware) │ │ (AuthMiddleware)     │
└──────────────────┘ └──────────────────────┘
        │                   │
        │  req.params.id    │ req.params.id
        ▼                   ▼
┌──────────────────────────────────────────┐
│   PayrollController                      │
│   - calculateAguinaldo(employeeId, year) │
│   - getAguinaldoSummary(payrollId)       │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│   AguinaldoService (NEW)                 │
│   - calculateAccruedAguinaldo()           │
│   - getAguinaldoSummaryForPayroll()       │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│   Prisma ORM                             │
│   SELECT vpg_payrolls, vpg_payroll_      │
│   employee WHERE status IN APROBADA,     │
│   PAGADA & period matches Dec-Nov range  │
└──────────────────────────────────────────┘
        │
        ▼
   PostgreSQL
```

### Recommended Project Structure

```
src/
├── backend/
│   └── src/
│       ├── service/
│       │   ├── PayrollService.ts          (existing, has calculateAguinaldo)
│       │   └── AguinaldoService.ts        (NEW — wrap calculateAguinaldo logic)
│       ├── controller/
│       │   └── PayrollController.ts       (extend with new aguinaldo endpoints)
│       ├── routes/
│       │   └── PayrollRoutes.ts           (add two new routes)
│       ├── model/
│       │   └── AguinaldoAccrual.ts        (NEW — return type for methods)
│       └── __tests__/
│           └── unit/services/
│               └── AguinaldoService.test.ts (NEW — unit tests)
└── frontend/
    └── src/
        ├── services/
        │   ├── payrollService.ts          (extend with new fetch methods)
        │   └── aguinaldoService.ts        (NEW — wrapper for API calls)
        ├── hooks/
        │   ├── useEmployeeProfile.ts      (existing — add aguinaldo state)
        │   ├── usePayrollWizard.ts        (existing — add aguinaldo state)
        │   └── useAguinaldo.ts            (NEW — fetch & memoize)
        └── components/
            ├── ProfileSummaryTab.tsx      (extend — add AguinaldoCard)
            ├── AguinaldoCard.tsx          (NEW)
            ├── PayrollWizardStep3.tsx     (extend — add column)
            └── PayrollWizardStep4.tsx     (extend — add summary box)
```

### Pattern 1: Service Calculation with Wrapping (Backend)

**What:** Backend service encapsulates business logic (calculation), controller delegates all parsing/response mapping.

**When to use:** Always for backend — separates concerns between HTTP layer and business logic.

**Example:**
```typescript
// AguinaldoService.ts
static async calculateAccruedAguinaldo(employeeId: number, asOfDate: Date): Promise<AguinaldoAccrual> {
  const periodStart = new Date(`${asOfDate.getFullYear() - 1}-12-01`);
  const periodEnd = asOfDate > new Date(`${asOfDate.getFullYear()}-11-30`)
    ? new Date(`${asOfDate.getFullYear()}-11-30`)
    : asOfDate;
  
  // Reuse existing PayrollService.calculateAguinaldo or refactor into shared util
  const result = await PayrollService.calculateAguinaldo(employeeId, asOfDate.getFullYear());
  
  // Map to AguinaldoAccrual interface
  return {
    accrued: result.total,
    projectedAnnual: (result.total / monthsCompleted) * 12,
    periodStart,
    periodEnd,
    monthsCompleted,
    payrollsIncluded: payrollCount
  };
}

// PayrollController.ts — endpoint
static async calculateAguinaldo(req: Request, res: Response) {
  try {
    const employeeId = Number(req.params.employeeId);
    const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : new Date();
    const result = await AguinaldoService.calculateAccruedAguinaldo(employeeId, asOfDate);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}
```

**Source:** Project conventions from CLAUDE.md — Backend Layers section

### Pattern 2: Frontend Data Hook Wrapper (Frontend)

**What:** Custom hook encapsulates fetch logic, returns `{ data, isLoading, error }` shape for component consumption.

**When to use:** Any time a component needs data from the API.

**Example:**
```typescript
// useAguinaldo.ts (NEW)
export function useAguinaldo(employeeId: number | null) {
  const [data, setData] = useState<AguinaldoAccrual | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    try {
      const result = await http.get(`/employees/${employeeId}/aguinaldo`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching aguinaldo');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}
```

**Source:** Project conventions from CLAUDE.md — Frontend Layers section

### Pattern 3: Card Component with Progress Bar (Frontend)

**What:** Reusable card component that displays numeric data + visual progress indicator.

**When to use:** Displaying status/percentage alongside currency values.

**Example:**
```typescript
// AguinaldoCard.tsx (NEW)
interface AguinaldoCardProps {
  accrued: number;
  projectedAnnual: number;
  monthsCompleted: number;
  payrollsIncluded: number;
  isLoading?: boolean;
}

export const AguinaldoCard: React.FC<AguinaldoCardProps> = ({
  accrued,
  projectedAnnual,
  monthsCompleted,
  payrollsIncluded,
  isLoading
}) => {
  const progressPercent = Math.min((monthsCompleted / 12) * 100, 100);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">
          Aguinaldo Acumulado
        </h3>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            ₡{formatCRC(accrued)}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Acumulado a {new Date().toLocaleDateString('es-CR')}
          </p>
        </div>
        
        {/* Progress bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              Progreso del año ({monthsCompleted}/12 meses)
            </span>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 dark:bg-green-600 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Meta info */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Planillas incluidas:</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{payrollsIncluded}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Proyectado al 20 dic:</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">₡{formatCRC(projectedAnnual)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Source:** Existing ProfileSummaryTab pattern from `src/frontend/src/components/ProfileSummaryTab.tsx`

### Anti-Patterns to Avoid

- **Calculating aguinaldo in the browser:** Date arithmetic and period detection belong in the backend service, never in React components. The browser cannot be trusted for financial calculations.
- **Storing aguinaldo values in cache without period context:** Aguinaldo is a "as of" calculation. Always fetch with current date or user-specified date. Don't cache without expiration.
- **Hardcoding the Dec-Nov fiscal year:** Always calculate period dynamically from `asOfDate`. Do not hardcode year numbers.
- **Bypassing http.ts service layer:** All API calls go through `@/services/http.ts`. Never use raw `fetch()` in components or hooks.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date arithmetic for Dec-Nov fiscal year | Custom month/year logic in components | `AguinaldoService.ts` method with centralized date logic | Edge cases: leap years, date parsing, timezone issues |
| Percentage progress calculation | Manual `monthsCompleted / 12` | Reusable utility function in service | Precision matters; off-by-one errors accumulate |
| Currency formatting (₡) | `.toLocaleString()` with manual rules | Existing `formatCRC()` util from `@/utils/number` | Already tested, handles edge cases (zero, decimals, negative) |
| API response unwrapping | Manual `response.data` access | Use `http.ts` service layer | Central error handling, token refresh, response mapping |
| Loading state coordination | Multiple `useState` calls | Custom hook with useCallback + useEffect | Prevents race conditions, stale state |

**Key insight:** Aguinaldo calculation (sum/12) looks simple but has hidden complexity: which payrolls count? Which fiscal year? Do you count partial months? These are business rules, not implementation details. The backend service owns them.

---

## Runtime State Inventory

**Scope:** This is a NEW feature (greenfield), not a rename/refactor phase.

✓ **No runtime state migration needed** — aguinaldo is calculated on-demand from existing payroll data. No new tables, no existing records to update.

---

## Common Pitfalls

### Pitfall 1: Fiscal Year Boundary Confusion

**What goes wrong:** Using calendar year (Jan-Dec) instead of payroll fiscal year (Dec-Nov) for period detection, or off-by-one errors on the boundary dates.

**Why it happens:** Costa Rican labor law defines aguinaldo by fiscal year Dec 1 → Nov 30. This conflicts with calendar year. Easy to default to `new Date().getFullYear()`.

**How to avoid:**
- Always compute `periodStart` as Dec 1 of the year *before* the current year if `asOfDate` falls in Dec-Nov
- Use exact dates: Dec 1 (included) through Nov 30 (included)
- Test with dates at boundaries: Nov 30, Dec 1, etc.

**Warning signs:**
- Aguinaldo calculations jump unexpectedly on Dec 1
- Employees show 0 aguinaldo mid-year (missing payrolls from prior December)
- Projections don't match expected annual amount

### Pitfall 2: Not Accounting for Payroll Status Filter

**What goes wrong:** Including BORRADOR or PAGADA-but-not-yet-approved payrolls in the calculation, inflating the accrual.

**Why it happens:** The Prisma query must filter `payrolls_status IN ('APROBADA', 'PAGADA')`. Missing this filter means draft payrolls get counted.

**How to avoid:**
- Always use `.where({ payrolls_status: { in: ['APROBADA', 'PAGADA'] } })`
- Test with payrolls in BORRADOR state — verify they don't affect the accrual

**Warning signs:**
- Aguinaldo amount changes when you save a payroll draft (should only change on approval)
- Test reveals discrepancy between expected and calculated value

### Pitfall 3: Rounding and Precision Loss

**What goes wrong:** Dividing gross salaries by 12 loses cents, or accumulating floating-point errors across multiple employees.

**Why it happens:** Database stores `Decimal(10, 2)`, but JavaScript numbers are IEEE 754 floats. Repeated division rounds down.

**How to avoid:**
- Perform rounding *after* all arithmetic, not before
- Use `Math.round(sum * 100) / 100` to round to cents
- Test with payrolls that have awkward gross amounts (e.g., 1234567.89) that don't divide evenly by 12

**Warning signs:**
- Aguinaldo total off by a few colones
- Discrepancy grows with each new payroll

### Pitfall 4: Stale Wizard Data After Approval

**What goes wrong:** Wizard step 4 still shows "aguinaldo will be ₡X" after approval, instead of showing the actual amount captured.

**Why it happens:** Frontend caches calculation data without refreshing; backend snapshot is captured but frontend doesn't know about it.

**How to avoid:**
- After `approvePayroll()`, refetch aguinaldo summary from API
- Include `useEffect()` dependency on `payrollId` to trigger refetch when payroll changes
- Verify that step 4 summary matches the snapshot stored at approval time

**Warning signs:**
- Frontend shows old projection after approval
- User re-opens wizard and sees inconsistent numbers

---

## Code Examples

Verified patterns from official sources and existing codebase:

### Example 1: Service Method with Full JSDoc

```typescript
// AguinaldoService.ts (NEW)
/**
 * Calculate accumulated aguinaldo for an employee as of a specific date.
 * Based on Costa Rica Labor Code Article 196.
 * Period: December 1 of prior year → asOfDate (capped at Nov 30 if later).
 * Formula: (sum of gross salaries from APROBADA/PAGADA payrolls) / 12
 * 
 * @param employeeId - The employee ID
 * @param asOfDate - Reference date for calculation (default: today)
 * @returns Promise<AguinaldoAccrual> with accrued, projected, period, monthsCompleted
 * @throws Error if employeeId not found or database error
 */
static async calculateAccruedAguinaldo(
  employeeId: number,
  asOfDate: Date = new Date()
): Promise<AguinaldoAccrual> {
  // Implementation
}
```

**Source:** CLAUDE.md — Backend conventions — every public method must have JSDoc with @param, @returns, @throws

### Example 2: Endpoint with asyncHandler + AuthMiddleware

```typescript
// PayrollRoutes.ts — add routes
router.get(
  "/employees/:id/aguinaldo",
  asyncHandler(PayrollController.getEmployeeAguinaldo)
);

router.get(
  "/payroll/:id/aguinaldo-summary",
  asyncHandler(PayrollController.getAguinaldoSummary)
);

// Middleware is applied once at router.use(AuthMiddleware.verifyToken) — no per-route duplication
```

**Source:** PayrollRoutes.ts existing pattern — all routes wrapped in asyncHandler, auth middleware applied once at router level

### Example 3: Frontend Hook with useCallback + useEffect

```typescript
// useAguinaldo.ts (NEW)
export function useAguinaldo(employeeId: number | null, asOfDate: Date = new Date()) {
  const [data, setData] = useState<AguinaldoAccrual | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAguinaldo = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Use http.ts — never raw fetch()
      const result = await http.get(
        `/employees/${employeeId}/aguinaldo?asOfDate=${asOfDate.toISOString()}`
      );
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error fetching aguinaldo';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, asOfDate]);

  useEffect(() => {
    fetchAguinaldo();
  }, [fetchAguinaldo]);

  return { data, isLoading, error, refetch: fetchAguinaldo };
}
```

**Source:** Existing hook patterns in useEmployeeProfile.ts and usePayrollWizard.ts

### Example 4: Component Integration (ProfileSummaryTab)

```typescript
// ProfileSummaryTab.tsx — extend existing component
interface ProfileSummaryTabProps {
  employee: EmployeeProfileData;
  aliases: ClockAlias[];
  vacations: Vacation[];
  onEditClick: () => void;
}

const ProfileSummaryTab: React.FC<ProfileSummaryTabProps> = ({
  employee,
  aliases,
  vacations,
  onEditClick,
}) => {
  // Fetch aguinaldo (NEW)
  const { data: aguinaldo, isLoading: aguinaldoLoading } = useAguinaldo(employee.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Existing cards ... */}
      
      {/* NEW: Aguinaldo card */}
      {aguinaldoLoading ? (
        <AguinaldoCardSkeleton />
      ) : aguinaldo ? (
        <AguinaldoCard
          accrued={aguinaldo.accrued}
          projectedAnnual={aguinaldo.projectedAnnual}
          monthsCompleted={aguinaldo.monthsCompleted}
          payrollsIncluded={aguinaldo.payrollsIncluded}
        />
      ) : null}
    </div>
  );
};
```

**Source:** Existing ProfileSummaryTab.tsx structure with card grid layout

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Aguinaldo calculated only for full fiscal years | Calculate proportionally for any date range | Phase 65 (this phase) | Allows real-time projections and mid-year displays |
| Frontend estimates aguinaldo locally (unreliable) | Backend calculates, frontend fetches (authoritative) | Phase 65 | Single source of truth; auditable |
| Hardcoded Dec-Nov fiscal year in frontend | Dynamic period calculation based on asOfDate | Phase 65 | Correct for all dates, no manual updates needed |

**Deprecated/outdated:**
- None — this is a new feature

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Existing `PayrollService.calculateAguinaldo()` can be reused or refactored as basis for AguinaldoService | Code Examples | If the existing method has bugs or wrong logic, inherited bugs propagate to new feature |
| A2 | `monthsCompleted` can be calculated as `(periodEnd - periodStart) / 30.44` (average days/month) | Context | If calculation is too simple (e.g., doesn't account for partial months), projections are inaccurate |
| A3 | `projectedAnnual` = `(sum / monthsCompleted) * 12` is the correct projection formula | Context | If formula is wrong (e.g., should use different denominator), projections mislead user |
| A4 | `formatCRC()` utility handles all edge cases (negative, zero, large numbers) correctly | Code Examples | If utility has bugs, aguinaldo display shows garbage numbers |

**Validation needed before Phase Planning:**
- Confirm `PayrollService.calculateAguinaldo()` logic is correct for Phase 65 requirements
- Verify Costa Rican labor law interpretation: is `sum / 12` the correct formula? (Per CONTEXT.md, yes, but confirm)
- Confirm `monthsCompleted` calculation method with domain expert

---

## Open Questions

1. **What is `monthsCompleted` exactly?**
   - Is it the number of months *with a salary entry* (payroll count)?
   - Or the approximate calendar months from Dec 1 to asOfDate?
   - Risk: affects projection calculation

2. **How should the system handle employees hired mid-year?**
   - Should aguinaldo start accruing from hire date (not Dec 1)?
   - Or always use Dec 1 even if hired in July?
   - Risk: incorrect accrual for new hires

3. **Does the backend snapshot capture aguinaldo at approval time?**
   - Context.md says step 4 should show "aguinaldo total acumulado al aprobar"
   - Should this be stored in the DB, or fetched on-demand?
   - Risk: historical aguinaldo values become inconsistent if rules change

---

## Environment Availability

✓ **No external dependencies** — Phase 65 uses only existing PostgreSQL, Prisma, Express, and React. No additional tools, runtimes, or third-party services required.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest (backend), no Jest config for frontend (Next.js testing manual or Cypress) |
| Config file | `src/backend/jest.config.js` |
| Quick run command | `cd src/backend && npm test -- AguinaldoService` |
| Full suite command | `cd src/backend && npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAY-30 | `calculateAccruedAguinaldo(employeeId, asOfDate)` returns correct accrued sum/12 | unit | `npm test -- AguinaldoService.test.ts --testNamePattern="accrued"` | ❌ Wave 0 |
| PAY-30 | `getAguinaldoSummaryForPayroll(payrollId)` returns per-employee contributions | unit | `npm test -- AguinaldoService.test.ts --testNamePattern="summary"` | ❌ Wave 0 |
| PAY-30 | `GET /employees/:id/aguinaldo` endpoint returns 200 with AguinaldoAccrual | integration | curl or manual test (no dedicated test) | ❌ Wave 0 |
| PAY-30 | `GET /payroll/:id/aguinaldo-summary` endpoint returns 200 with summary array | integration | curl or manual test (no dedicated test) | ❌ Wave 0 |
| PAY-30 | Employee profile card displays accrued amount + progress bar + projection | e2e | manual (no Cypress e2e for this flow) | ❌ Deferred |
| PAY-30 | Wizard step 3 table includes "Aguinaldo acum." column with correct values | e2e | manual (no Cypress e2e for this flow) | ❌ Deferred |
| PAY-30 | Wizard step 4 shows summary box with total commitment | e2e | manual (no Cypress e2e for this flow) | ❌ Deferred |

### Sampling Rate
- **Per task commit:** `npm test -- AguinaldoService` (unit tests only)
- **Per wave merge:** `npm test` (full backend suite)
- **Phase gate:** Full suite green + manual smoke test of employee profile + wizard

### Wave 0 Gaps
- [ ] `src/backend/src/__tests__/unit/services/AguinaldoService.test.ts` — covers calculateAccruedAguinaldo and getAguinaldoSummaryForPayroll
- [ ] Backend integration tests for GET endpoints (optional, covered by unit tests)
- [ ] Frontend e2e test for profile card (manual only, not automated)
- [ ] Frontend e2e test for wizard (manual only, not automated)

*(Frontend e2e tests deferred until dedicated Cypress suite set up — currently manual verification is sufficient per project practice)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | All endpoints protected by `AuthMiddleware.verifyToken` |
| V3 Session Management | yes | JWT token validation via existing middleware |
| V4 Access Control | yes | Only authenticated users can fetch aguinaldo data |
| V5 Input Validation | yes | employeeId and payrollId validated as positive integers |
| V6 Cryptography | no | No new cryptographic requirements |

### Known Threat Patterns for {TypeScript + Express + Prisma + React}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via employeeId/payrollId | Tampering | Use Prisma parameterized queries (automatic); validate ID as integer before Prisma |
| Unauthorized access to another employee's aguinaldo | Information Disclosure | AuthMiddleware ensures user is logged in; no per-employee RBAC check (assume all users can see all employees' data per existing design) |
| Floating-point precision loss in calculations | Tampering | Use `Decimal(10, 2)` from database; round to cents *after* summing, never before |
| Stale cache of aguinaldo data | Denial of Service | No caching — calculate on-demand; if caching added later, use short TTL (minutes, not hours) |

---

## Sources

### Primary (HIGH confidence)
- **Existing code in src/backend/src/service/PayrollService.ts (lines 547-587)** — `calculateAguinaldo()` method already implemented; forms the basis for AguinaldoService
- **CONTEXT.md (65-CONTEXT.md)** — Full specification of AguinaldoService methods, response types, and frontend requirements
- **CLAUDE.md** — Backend/frontend conventions, layer architecture, testing standards
- **Prisma schema (src/backend/prisma/schema.prisma)** — vpg_payrolls and vpg_payroll_employee tables with gross_salary field

### Secondary (MEDIUM confidence)
- **PayrollService.test.ts** — Existing test patterns for aguinaldo calculation (lines 561-627); shows test structure to follow
- **useEmployeeProfile.ts** — Hook pattern for profile data; reusable for aguinaldo hook
- **ProfileSummaryTab.tsx** — Card layout pattern; template for AguinaldoCard component
- **PayrollWizardStep3.tsx** — Table display pattern; template for adding column

### Tertiary (informational)
- **ROADMAP.md** — Phase 65 listed as v1.7 milestone, no blocking dependencies

---

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — all libraries confirmed in codebase
- Architecture: **HIGH** — existing calculateAguinaldo logic exists; service/controller pattern established
- Backend implementation: **HIGH** — method signature and logic already present; minor refactoring to extract into AguinaldoService
- Frontend implementation: **MEDIUM** — patterns exist (hooks, cards, wizard), but integration points (exact columns, tooltips) require planner discretion
- Testing: **HIGH** — Jest infrastructure ready; test patterns established

**Research date:** 2026-04-29  
**Valid until:** 2026-05-13 (14 days — payroll domain is stable)

---

