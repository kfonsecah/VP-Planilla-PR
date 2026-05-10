# Phase 37: Frontend Wizard de Planilla Quincenal - Research

**Researched:** 2026-04-15
**Domain:** React/Next.js frontend, Multi-step wizard UI, Payroll state machine integration
**Confidence:** HIGH

## Summary

Phase 37 implements a guided 3-step wizard to replace the current flat calculation page. The wizard walks the user through: (1) selecting a pre-calculated biweekly period card, (2) reviewing calculation results with expandable employee details, and (3) approving with a confirmation dialog that triggers the Phase 36 backend state machine.

**Primary recommendation:** Build a `PayrollWizard` parent component that manages wizard state (current step, selected period, calculated data) and delegates to child components. Reuse existing `PayrollResults` for Step 2 and `ConfirmDialog` for Step 3. No new libraries required.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x | UI framework | Already in use |
| Next.js | 14.x | App framework | Already in use |
| @heroicons/react | 2.x | Icons | Already in use |
| sonner | 1.x | Toasts | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| — | — | No new libraries needed | Wizard uses existing components |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom wizard library | Build custom with useState | Existing codebase pattern is simple state - no library needed |
| Multi-page flow | Single-page wizard | Single-page wizard provides better UX and preserves calculation data |
| External stepper component | Build custom stepper | Simpler to extend existing ConfirmDialog pattern |

**Installation:** No additional packages required.

---

## Architecture Patterns

### Recommended Project Structure
```
src/frontend/src/
├── components/
│   ├── PayrollWizard.tsx      # NEW - Parent wizard container
│   ├── PayrollWizardStep1.tsx # NEW - Period selection cards
│   ├── PayrollWizardStep2.tsx  # NEW - Review calculation (wraps PayrollResults)
│   ├── PayrollWizardStep3.tsx  # NEW - Confirm and approve
│   ├── PayrollPeriodCard.tsx  # NEW - Individual period card
│   └── ExecutiveSummary.tsx  # NEW - Step 3 summary component
├── hooks/
│   └── usePayrollWizard.ts    # NEW - Wizard state management
└── app/pages/payroll/
    ├── calculate/page.tsx    # UPDATE - Replace with wizard entry
    └── wizard/page.tsx         # NEW - Dedicated wizard route (optional)
```

### Pattern 1: Wizard State Management

**What:** Centralized state for wizard progression, selected period, and calculated data.

**When to use:** Always for multi-step flows that need to preserve data between steps.

**Example:**
```typescript
// Source: Based on existing phase patterns
interface WizardState {
  currentStep: 1 | 2 | 3;
  selectedPeriod: {
    start: string;
    end: string;
    label: string; // e.g., "1ª Quincena Abril 2026"
    preCalculated?: boolean;
  } | null;
  calculationData: CalculationResult | null;
  payrollId: number | null;
}

export const usePayrollWizard = () => {
  const [state, setState] = useState<WizardState>({
    currentStep: 1,
    selectedPeriod: null,
    calculationData: null,
    payrollId: null
  });

  const selectPeriod = (period: WizardState['selectedPeriod']) => {
    setState(prev => ({ ...prev, selectedPeriod: period }));
  };

  const goToStep = (step: WizardState['currentStep']) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  const setCalculationData = (data: CalculationResult) => {
    setState(prev => ({ ...prev, calculationData: data }));
  };

  const setPayrollId = (id: number) => {
    setState(prev => ({ ...prev, payrollId: id }));
  };

  return { state, selectPeriod, goToStep, setCalculationData, setPayrollId };
};
```

### Pattern 2: Period Card Selection (Step 1)

**What:** Interactive cards showing pre-calculated biweekly periods.

**When to use:** For PLANILLA-01 requirement - " Cards pre-calculados con períodos quincenales disponibles".

**Example:**
```typescript
// Source: Based on existing UI patterns from PayrollCalculatePage
interface PayrollPeriodCardProps {
  period: {
    start: Date;
    end: Date;
    label: string;
    isCurrent?: boolean;
    hasData?: boolean;
  };
  isSelected: boolean;
  onSelect: (period: PayrollPeriod) => void;
}

function PayrollPeriodCard({ period, isSelected, onSelect }: PayrollPeriodCardProps) {
  const formatDateRange = (start: Date, end: Date) => {
    const startDay = start.getDate();
    const endDay = end.getDate();
    const month = start.toLocaleDateString('es-CR', { month: 'long' });
    return `${startDay} - ${endDay} ${month}`;
  };

  return (
    <button
      onClick={() => onSelect(period)}
      className={cn(
        "p-4 rounded-xl border-2 text-left transition-all",
        isSelected 
          ? "border-green-600 bg-green-50 dark:bg-green-900/20" 
          : "border-zinc-200 dark:border-zinc-700 hover:border-green-400"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <CalendarIcon className={cn("w-5 h-5", isSelected ? "text-green-600" : "text-zinc-400")} />
        {period.isCurrent && (
          <span className="text-xs font-medium text-green-700 dark:text-green-400">
            Actual
          </span>
        )}
      </div>
      <p className="font-semibold text-zinc-800 dark:text-zinc-100">
        {period.label}
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {formatDateRange(period.start, period.end)}
      </p>
    </button>
  );
}
```

### Pattern 3: Wrapped PayrollResults (Step 2)

**What:** Reuse existing `PayrollResults` component with simplified summary + expandible employee rows.

**When to use:** For PLANILLA-03 requirement - "Resumen de revisión por empleado antes de aprobar".

**Example:**
```typescript
// Source: Based on existing PayrollResults.tsx patterns
import PayrollResults from '@/components/PayrollResults';

interface WizardStep2Props {
  data: CalculationResult;
  onBack: () => void;
  onNext: () => void;
  onConfirm: () => void;
}

function WizardStep2({ data, onBack, onNext, onConfirm }: WizardStep2Props) {
  const hasInconsistencies = data.employees.some(emp => 
    emp.inconsistencies?.length > 0
  );

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary">
          ← Cambiar período
        </button>
        <button onClick={onNext} className="btn-primary">
          Revisar y continuar →
        </button>
      </div>

      {/* Warning if has inconsistencies */}
      {hasInconsistencies && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            ⚠️ Algunos empleados tienen inconsistencias. Revise los detalles antes de aprobar.
          </p>
        </div>
      )}

      {/* Reuse existing component */}
      <PayrollResults 
        data={data} 
        onCreate={onConfirm} // Step 3 trigger
      />
    </div>
  );
}
```

### Pattern 4: Executive Summary + Confirmation (Step 3)

**What:** Compact summary with confirmation dialog using Phase 36 state machine.

**When to use:** For PLANILLA-04 requirement - "Estado machine de planilla (Borrador → Aprobada → Pagada)".

**Example:**
```typescript
// Source: Based on existing ConfirmDialog.tsx + Phase 36 API
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { PayrollService } from '@/services/payrollService';

interface WizardStep3Props {
  payrollId: number;
  calculationData: CalculationResult;
  onApprove: (payrollId: number) => Promise<void>;
}

function WizardStep3({ payrollId, calculationData, onApprove }: WizardStep3Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const totalNet = calculationData.employees.reduce((sum, emp) => sum + emp.netSalary, 0);

  const handleApprove = async () => {
    if (confirmText !== 'APROBAR') return;
    
    setIsLoading(true);
    try {
      await PayrollService.approvePayroll(payrollId);
      await onApprove(payrollId);
      toast.success('Planilla aprobada exitosamente');
    } catch (error) {
      toast.error('Error al aprobar planilla');
    } finally {
      setIsLoading(false);
    }
  };

  // Use existing ConfirmDialog with text input
  return (
    <>
      <div className="bg-green-700 rounded-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-4">Resumen Ejecutivo</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-green-200 text-sm">Período</p>
            <p className="font-semibold">{calculationData.period.label}</p>
          </div>
          <div>
            <p className="text-green-200 text-sm">Empleados</p>
            <p className="font-semibold">{calculationData.employees.length}</p>
          </div>
          <div>
            <p className="text-green-200 text-sm">Total Bruto</p>
            <p className="font-semibold">₡{formatCRC(totalGross)}</p>
          </div>
          <div>
            <p className="text-green-200 text-sm">Total Neto</p>
            <p className="font-semibold">₡{formatCRC(totalNet)}</p>
          </div>
        </div>

        <button 
          onClick={() => setShowConfirm(true)}
          className="w-full py-3 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors"
        >
          Aprobar Planilla
        </button>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="¿Aprobar Planilla?"
        description="Esta acción approval la planilla y no podrá modificarse sin reopen."
        onCancel={() => {
          setShowConfirm(false);
          setConfirmText('');
        }}
        onConfirm={handleApprove}
      >
        {/* Custom confirmation input - user must type APROBAR */}
        <div className="mt-4">
          <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Escriba "APROBAR" para confirmar
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg"
            placeholder="APROBAR"
          />
        </div>
      </ConfirmDialog>
    </>
  );
}
```

### Anti-Patterns to Avoid

- **Losing calculation data between steps:** Don't re-fetch data on each step - pass data through wizard state.
- **Bypassing state machine:** Always use Phase 36 endpoints (`/payroll/:id/approve`) not direct status updates.
- **Skipping confirmation:** UX-02 requirement mandates explicit confirmation for approve/mark-as-paid.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|------------|-------------|-----|
| Wizard state | Custom complex state machine | Simple useState with context | Simple 3-step flow doesn't need XState |
| Confirmation dialog | Build custom modal | Reuse existing ConfirmDialog component | Already has correct UX-02 patterns |
| Results display | Build custom table | Reuse existing PayrollResults component | Already handles expandible rows |
| Period generation | Hard-code periods | Generate from current date | Auto-generate biweekly periods |
| Text input confirmation | Simple button | Use text input requiring "APROBAR" | Matches UX-02 requirement |

**Key insight:** This phase is primarily integration and UX improvement - existing components cover 70% of the work.

---

## Common Pitfalls

### Pitfall 1: Calculation data loss on navigation
**What goes wrong:** Navigating between wizard steps loses the calculated payroll data.
**Why it happens:** Not persisting state, re-fetching on each step.
**How to avoid:** Keep all wizard state in single `usePayrollWizard` hook; don't re-fetch between steps.
**Warning signs:** "Data not found" errors when returning to Step 2 from Step 3.

### Pitfall 2: Missing payroll ID linking
**What goes wrong:** Step 3 can't approve because payroll record wasn't created.
**Why it happens:** Creating payroll in Step 2 but not linking to calculation results.
**How to save:** Create payroll record in Step 2 using `PayrollCreateModal` pattern, pass ID to Step 3.
**Warning signs:** "Payroll not found" errors in approval.

### Pitfall 3: Inconsistent validation
**What goes wrong:** Different validation rules between wizard and standalone page.
**Why it happens:** Reusing `PayrollCalculatePage` without validation alignment.
**How to avoid:** Use same validation functions from Phase 36 backend.
**Warning signs:** Validation errors that don't appear in both modes.

---

## Code Examples

### Backend Integration (Phase 36 Endpoints)

```typescript
// Source: Based on Phase 36 RESEARCH.md
import { http } from './http';

// Approve payroll - transitions from BORRADOR to APROBADA
export const PayrollService = {
  async approvePayroll(payrollId: number): Promise<Payroll> {
    return await http.post(`/payroll/${payrollId}/approve`, {});
  },

  // Mark as paid - transitions from APROBADA to PAGADA
  async markAsPaid(payrollId: number): Promise<Payroll> {
    return await http.post(`/payroll/${payrollId}/pay`, {});
  },

  // Reopen payroll - requires reason
  async reopenPayroll(payrollId: number, reason: string): Promise<Payroll> {
    return await http.post(`/payroll/${payrollId}/reopen`, { reason });
  },

  // Get payroll list
  async getPayrolls(): Promise<Payroll[]> {
    return await http.get('/payrolls');
  }
};
```

### Period Generation Utility

```typescript
// Source: Based on PayrollCalculatePage patterns
interface BiweeklyPeriod {
  start: Date;
  end: Date;
  label: string;
  isCurrent: boolean;
}

export const generateBiweeklyPeriods = (monthsBack: number = 2): BiweeklyPeriod[] => {
  const periods: BiweeklyPeriod[] = [];
  const today = new Date();

  for (let i = 0; i < monthsBack * 2; i++) {
    // Calculate month
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    // First quincena: 1-15
    const q1Start = new Date(year, month, 1);
    const q1End = new Date(year, month, 15);

    // Second quincena: 16-last day
    const q2Start = new Date(year, month, 16);
    const q2End = new Date(year, month + 1, 0);

    const monthName = monthDate.toLocaleDateString('es-CR', { month: 'long' });

    periods.push({
      start: q1Start,
      end: q1End,
      label: `1ª Quincena ${monthName}`,
      isCurrent: i === 0 && today.getDate() <= 15
    });

    periods.push({
      start: q2Start,
      end: q2End,
      label: `2ª Quincena ${monthName}`,
      isCurrent: i === 0 && today.getDate() > 15
    });
  }

  return periods;
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat calculation form | 3-step wizard | This phase | Guided UX, PLANILLA-01 fulfilled |
| Manual date selection | Pre-calculated period cards | This phase | Fewer errors, faster selection |
| Save then approve separately | Integrated approval in Step 3 | This phase | Streamlined workflow |
| No state machine on frontend | Phase 36 FSM integration | This phase | PLANILLA-04 fulfilled |

**Deprecated/outdated:**
- Flat calculation form — replaced by wizard
- Manual period selection — replaced by smart period cards
- Manual save flow — integrated into wizard Step 2

---

## Open Questions

1. **Save vs. Calculate First**
   - What we know: Current flow has separate calculate → save buttons
   - What's unclear: Should wizard calculate automatically when period is selected?
   - Recommendation: Calculate automatically on Step 1 → show Step 2 results

2. **Existing Payroll Handling**
   - What we know: User may want to review an already saved payroll
   - What's unclear: Should wizard also allow loading existing payrolls?
   - Recommendation: Add "Cargar planilla existente" option alongside new calculation

3. **Mark as Paid Flow**
   - What we know: PLANILLA-04 includes PAGADA state
   - What's unclear: Should wizard include option to mark as paid in Step 3?
   - Recommendation: After approve, show "Mark as paid" option but separate from core wizard

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Frontend | ✓ | 20.x | — |
| React 18 | UI | ✓ | 18.x | — |
| Next.js 14 | App | ✓ | 14.x | — |
| @heroicons/react | Icons | ✓ | 2.x | — |
| Phase 36 Backend | State machine | ✓ Implemented | — | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (existing) |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- PayrollWizard` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLANILLA-01 | Period selection wizard | Unit | `npm test -- PayrollWizard.test` | ❌ Create |
| PLANILLA-01 | Period card generation | Unit | `npm test -- generateBiweeklyPeriods.test` | ❌ Create |
| PLANILLA-03 | Expandable employee review | Integration | `npm test -- PayrollResults.test` | ✅ Exists |
| PLANILLA-04 | Approve payroll FSM | Integration | `npm test -- payrollApproval.test` | ❌ Create |
| UX-02 | Confirmation dialog | Unit | `npm test -- ConfirmDialog.test` | ✅ Exists |

### Sampling Rate
- **Per task commit:** Quick run for affected component
- **Per wave merge:** Full suite
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `PayrollWizard.test.tsx` — covers wizard state transitions
- [ ] `generateBiweeklyPeriods.test.ts` — covers period generation
- [ ] `payrollApproval.test.ts` — covers Phase 36 integration

---

## Sources

### Primary (HIGH confidence)
- Phase 36 RESEARCH.md — State machine API endpoints
- PayrollResults.tsx — Existing results component
- ConfirmDialog.tsx — Existing confirmation component
- PayrollCalculatePage.tsx — Existing period logic

### Secondary (MEDIUM confidence)
- Phase 35 UI-SPEC.md — Modal patterns and validation
- v1.5-REQUIREMENTS.md — PLANILLA-01 through PLANILLA-04
- FLUJO_GUARDADO_PLANILLA.md — Save and calculate flow

### Tertiary (LOW confidence)
- WebSearch: React wizard patterns 2025

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — only uses existing project dependencies
- Architecture: HIGH — follows existing patterns from Phases 34-36
- Pitfalls: HIGH — well-understood from existing learnings
- Backend integration: HIGH — Phase 36 provides exact endpoints

**Research date:** 2026-04-15
**Valid until:** 90 days

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLANILLA-01 | Wizard guiado de 3 pasos | PayrollWizard component with step management |
| PLANILLA-01 | Period cards pre-calculados | PayrollPeriodCard + generateBiweeklyPeriods |
| PLANILLA-03 | Resumen por empleado expandible | Reuses existing PayrollResults component |
| PLANILLA-04 | State machine FSM integration | Phase 36 endpoints via PayrollService |
| UX-02 | Confirmación explícita | Uses ConfirmDialog with text input |
</phase_requirements>