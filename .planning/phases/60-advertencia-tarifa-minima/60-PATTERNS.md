# Phase 60: Advertencia de Tarifa Mínima en Planilla - Pattern Map

**Mapped:** 2026-04-26
**Files analyzed:** 3
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/frontend/src/services/legalParamService.ts` | service | request-response | `src/frontend/src/services/enterpriseService.ts` | exact |
| `src/frontend/src/hooks/usePayrollWizard.ts` | hook | request-response | `src/frontend/src/hooks/usePayrollWizard.ts` | exact |
| `src/frontend/src/app/pages/payroll/wizard/page.tsx` | component | request-response | `src/frontend/src/app/pages/payroll/wizard/page.tsx` | exact |

## Pattern Assignments

### `src/frontend/src/services/legalParamService.ts` (service, request-response)

**Analog:** `src/frontend/src/services/enterpriseService.ts`

**Imports pattern** (lines 1-1):
```typescript
import { http } from './http';
```

**Service definition pattern** (lines 20-33):
```typescript
export const EnterpriseService = {
  /**
   * Retrieves the current enterprise configuration.
   * @returns {Promise<EnterpriseConfig>} The enterprise configuration.
   */
  getConfig: async (): Promise<EnterpriseConfig> => {
    return http.get('/enterprise/config');
  },
};
```
*Note: Use this to map calls to `/legal-params?key=GLOBAL_MIN_WAGE_RATE` and `/legal-params?key=MIN_WAGE_CHECK_ENABLED`.*

---

### `src/frontend/src/hooks/usePayrollWizard.ts` (hook, request-response)

**Analog:** `src/frontend/src/hooks/usePayrollWizard.ts`

**Imports pattern** (lines 1-1):
```typescript
import { useState, useCallback } from 'react';
```

**State pattern** (lines 40-45):
```typescript
export function usePayrollWizard() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedPeriod, setSelectedPeriod] = useState<WizardState['selectedPeriod']>(null);
  // Pattern to add new state for parameters
}
```

---

### `src/frontend/src/app/pages/payroll/wizard/page.tsx` (component, request-response)

**Analog:** `src/frontend/src/app/pages/payroll/wizard/page.tsx`

**Imports pattern** (lines 3-8):
```typescript
import React, { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { usePayrollWizard } from '@/hooks/usePayrollWizard';
import { NomineeService } from '@/services/nomineeService';
import { PayrollService } from '@/services/payrollService';
```

**Effect/Fetch pattern** (lines 53-61):
```typescript
  // ── Load employees when entering Step 2 ──────────────────────────────────
  useEffect(() => {
    if (currentStep !== 2) return;
    setLoadingEmployees(true);
    getEmployees()
      .then((list) => setEmployees(list))
      .catch(() => toast.error('Error cargando empleados'))
      .finally(() => setLoadingEmployees(false));
  }, [currentStep]);
```
*Note: Mimic this pattern to trigger legal parameter fetching when entering the relevant step.*

## Shared Patterns

### Non-Blocking UI Warnings (Tooltip)
**Source:** `src/frontend/src/components/ui/Tooltip.tsx`
**Apply to:** Wizard steps (e.g., Step 2 employee list)
```tsx
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';

// UI Wrapper pattern for salary warning
<TooltipProvider>
  <Tooltip content={`Salario inferior a la tarifa mínima global (₡${globalMinWageRate})`} side="top">
    <span className="text-yellow-500 cursor-help">⚠️</span>
  </Tooltip>
</TooltipProvider>
```

### Type Conversions for Salary Comparison
**Source:** Phase 60 Research
**Apply to:** Wizard components comparing salaries
```typescript
const isBelowMinimum = minWageCheckEnabled === 1 
  && Number(employee.base_salary) < Number(globalMinWageRate);
```

## Metadata

**Analog search scope:** `src/frontend/src/services/`, `src/frontend/src/hooks/`, `src/frontend/src/app/`
**Files scanned:** ~150 frontend files
**Pattern extraction date:** 2026-04-26
