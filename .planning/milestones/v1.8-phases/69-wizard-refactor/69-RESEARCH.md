# Phase 69: Wizard Refactor - Research

**Researched:** 2026-05-09
**Domain:** Frontend / Payroll Management
**Confidence:** HIGH

## Summary

The current `PayrollWizard` implementation in `src/frontend/src/app/pages/payroll/wizard/page.tsx` is a monolithic file (~52KB, 900+ lines) that handles everything from period selection to final approval. This research identifies the necessary steps to decompose this monolith into modular, type-safe, and maintainable sub-components while adding a refined employee selection step and ensuring support for Aguinaldo flows.

The refactor will adopt a step-based architecture where a parent orchestrator manages the global state (via `usePayrollWizard`) and delegates UI and local logic to dedicated step components.

**Primary recommendation:** Decompose the monolith into 4 distinct step components located in a new `steps/` subdirectory, utilizing the existing `usePayrollWizard` hook for shared state and ensuring all transient data (like manual adjustments) is properly managed to avoid data loss between steps.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Wizard State Management | Browser (React Hook) | — | Maintains current step, selected period, and employee IDs. |
| Period Selection Logic | Browser (Component) | — | UI for selecting quincenas, months, or custom ranges. |
| Employee Selection | Browser (Component) | API (Employee List) | Multi-select UI with min-wage validation. |
| Payroll Calculation | API (Nominee Service) | — | Business logic for hours, deductions, and gross/net calculation. |
| Review & Adjustments | Browser (Component) | API (Payroll Employee Update) | UI for reviewing results and applying manual overrides. |
| Final Approval | API (Payroll Approval) | Browser (Component) | Persistent change of payroll status to 'PAGADA'. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.6 | Frontend Framework | Project standard for App Router. [VERIFIED: package.json] |
| React | 19.0.0 | UI Library | Latest stable with support for modern hooks. [VERIFIED: package.json] |
| Tailwind CSS | ^4 | Styling | Utility-first styling for modern UI. [VERIFIED: package.json] |
| Framer Motion | ^12.23.12 | Animations | Smooth transitions between wizard steps. [VERIFIED: package.json] |
| Lucide React / Heroicons | ^1.7.0 / ^2.2.0 | Icons | Standard icon sets for the project. [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Sonner | ^2.0.7 | Notifications | Toast feedback for API actions. [VERIFIED: package.json] |
| Zod | ^4.0.17 | Validation | Schema validation for form data. [VERIFIED: package.json] |

## Architecture Patterns

### Recommended Project Structure
```
src/frontend/src/app/pages/payroll/wizard/
├── page.tsx               # Orchestrator (Main Container)
└── steps/                 # Sub-components for each step
    ├── Step1Period.tsx    # Period Selection
    ├── Step2Employees.tsx # Employee Selection (Refined)
    ├── Step3Review.tsx    # Calculation & Review (Monolith extraction)
    └── Step4Approve.tsx   # Final Approval (Refined Step 3)
```

### Pattern: Controlled Wizard with Shared Hook
The `usePayrollWizard` hook already exists and manages the main state. The Orchestrator will pass down specific state and setters to each step.

**Example Step Component Pattern:**
```typescript
interface StepProps {
  onNext: (data: any) => void;
  onBack?: () => void;
  initialData?: any;
}

export default function StepX({ onNext, onBack, initialData }: StepProps) {
  // Local UI state
  // Call onNext when finished
}
```

### Anti-Patterns to Avoid
- **State Fragmentation:** Avoid keeping critical wizard state (like selected employees) only in the Step component. If the component unmounts, the selection is lost. Always sync to the parent or a shared hook.
- **Direct Fetching in Page:** Steps should handle their own data fetching (e.g., Step 2 fetching employees) to keep the Orchestrator clean.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date Parsing/Formatting | Custom string splitting | `formatDateDisplay` util | Consistency with Costa Rica locale. |
| Form Validation | Manual `if` checks | `zod` + `react-hook-form` | Scalable and type-safe validation. |
| Step Transitions | Manual opacity hacks | `AnimatePresence` + `motion` | Native support for entry/exit animations. |

## Common Pitfalls

### Pitfall 1: Transient Data Loss
**What goes wrong:** Manual adjustments made in the Review step are lost if the user goes back to the Employee step and then returns to Review.
**Why it happens:** Review step component remounts and `handleCalculate` is re-triggered, fetching fresh (unadjusted) data from the API.
**How to avoid:** The Review step should detect if a `payrollId` already exists and decide whether to fetch fresh calculations or just show existing `vpg_payroll_employee` records.

### Pitfall 2: Hook Dependency Loops
**What goes wrong:** `useEffect` triggers `handleCalculate` repeatedly.
**Why it happens:** `handleCalculate` depends on `mapToWizardResult` or other unstable callbacks.
**How to avoid:** Ensure all helper functions used in `useCallback` or `useEffect` are properly memoized or defined outside the component.

## Code Examples

### Refined Type Mapping (Removing `any`)
```typescript
// Source: src/frontend/src/types/payrollTypes.ts
const mapToWizardResult = (res: PayrollCalculationResult): CalculationResult => {
  return {
    period: { ... },
    employees: res.employees.map(emp => ({
      id: Number(emp.id ?? emp.employee_id ?? emp.employeeId),
      name: emp.name ?? emp.employeeName ?? emp.employee_name ?? 'Empleado',
      grossSalary: emp.grossSalary ?? emp.gross_salary ?? 0, // Using snake_case alias in interface
      netSalary: emp.netSalary ?? emp.net_salary ?? 0,
      deductions: (emp.deductionsBreakdown ?? []).map(d => ({
        type: d.type,
        amount: d.amount
      })),
      inconsistencies: (emp.inconsistencies ?? []).map(i => i.message)
    })),
    // ...
  };
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic wizard page | Modular Step Components | Phase 69 | Easier maintenance, cleaner testing. |
| Inline `any` casting | Interface-based mapping | Phase 69 | Better type safety and IDE support. |
| Fixed 3-step flow | Dynamic 4-step flow | Phase 69 | Better UX for employee selection. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `EmployeePayroll` interface is sufficient for mapping | Code Examples | Might need more snake_case fields for full API coverage. |
| A2 | `usePayrollWizard` can support Aguinaldo without major changes | Aguinaldo Flow | Might need to extend the hook state with `wizardType`. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | 22.14.0 | — |
| TypeScript | Type Safety | ✓ | 5.9.3 (FE) | — |
| Tailwind CSS | Styling | ✓ | ^4 | — |
| PostgreSQL | Data Layer | ✓ | 15+ | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest |
| Config file | `src/frontend/jest.config.js` |
| Quick run command | `npm test` (in backend) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| WIZ-01.1 | Decomposition into 4 steps | Integration | Manual UI verification |
| WIZ-01.2 | No `any` casting in mapping | Static | `npx tsc --noEmit` |
| QUAL-01.1 | Zero linting warnings | Lint | `npx next lint` |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Zod validation for period dates and adjustments. |
| V4 Access Control | yes | `AuthMiddleware` verifies JWT before calculation. |

## Sources

### Primary (HIGH confidence)
- `src/frontend/src/app/pages/payroll/wizard/page.tsx` - Current monolithic implementation.
- `src/frontend/src/hooks/usePayrollWizard.ts` - Shared state management.
- `src/frontend/src/types/payrollTypes.ts` - Interface definitions for calculation results.

### Secondary (MEDIUM confidence)
- `src/frontend/src/components/PayrollWizard.tsx` - Legacy/Alternative wizard implementation found in codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified in `package.json`.
- Architecture: HIGH - Based on React best practices for wizards.
- Pitfalls: MEDIUM - Based on common React state management issues.

**Research date:** 2026-05-09
**Valid until:** 2026-06-09
