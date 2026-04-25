# Phase 36: Backend State Machine de Planilla + Aguinaldo - Research

**Researched:** 2026-04-15
**Domain:** Node.js/Express backend, Payroll lifecycle, Costa Rica labor law
**Confidence:** HIGH

## Summary

This phase implements the payroll state machine (BORRADOR → APROBADA → PAGADA) and the aguinaldo calculation per Costa Rican labor law. The Prisma schema already contains the necessary fields (`PayrollStatus` enum, `payrolls_approved_by`, `payrolls_approved_at`, `payrolls_reopened_at`, `payrolls_reopen_reason`) and a dedicated table for recalculations (`vpg_payroll_recalculations`). No external state machine library is required—the simple FSM can be implemented directly in PayrollService following the existing patterns.

The aguinaldo calculation conforms to Article 196 of the Costa Rican Labor Code: sum of gross salaries from December 1 to November 30 divided by 12. For periods less than 12 months, the same formula applies proportionally.

**Primary recommendation:** Extend `PayrollService` with state transition methods (`approvePayroll`, `markAsPaid`, `reopenPayroll`, `recalculatePayroll`) and add a `calculateAguinaldo` method. Use the existing schema fields—no schema changes needed.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|------------|
| Node.js | 20.x+ | Runtime | Current LTS |
| Express | 4.x | HTTP layer | Already in use |
| Prisma | 5.x | Database ORM | Already in use |
| Jest | 29.x | Testing | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| — | — | No external FSM library needed | Simple state transitions |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| XState | Custom implementation | XState is overkill for 3-state FSM; adds complexity without benefit |
| finity | Custom implementation | Archived library (last update 2018) |
| @edium/fsm | Custom implementation | Adds dependency for what Prisma schema already supports |

**Installation:** No additional packages required.

---

## Architecture Patterns

### Recommended Project Structure
```
src/backend/src/
├── service/
│   ├── PayrollService.ts      # Existing — extend with state methods
│   └── NomineeService.ts   # Existing — update to use effective marks
├── controller/
│   └── PayrollController.ts # Add new endpoints
```

### Pattern 1: State Transition Service Methods

**What:** Methods on PayrollService that enforce valid state transitions with validation and audit trails.

**When to use:** Always for payroll lifecycle management.

**Example:**
```typescript
// Source: Based on existing PayrollService.ts patterns
enum PayrollStatus {
  BORRADOR = 'BORRADOR',
  APROBADA = 'APROBADA',
  PAGADA = 'PAGADA'
}

export class PayrollService {
  /**
   * Approve a payroll — transition from BORRADOR to APROBADA
   */
  static async approvePayroll(payrollId: number, userId: number): Promise<Payroll> {
    const payroll = await prisma.vpg_payrolls.findUnique({
      where: { payrolls_id: payrollId }
    });
    if (!payroll) throw new Error('Payroll not found');
    if (payroll.payrolls_status !== PayrollStatus.BORRADOR) {
      throw new Error('Only BORRADOR payrolls can be approved');
    }
    
    const updated = await prisma.vpg_payrolls.update({
      where: { payrolls_id: payrollId },
      data: {
        payrolls_status: PayrollStatus.APROBADA,
        payrolls_approved_by: userId,
        payrolls_approved_at: new Date(),
        payrolls_version: payroll.payrolls_version + 1
      }
    });
    
    return this.mapToPayroll(updated);
  }

  /**
   * Mark a payroll as paid — transition from APROBADA to PAGADA
   */
  static async markAsPaid(payrollId: number): Promise<Payroll> {
    const payroll = await prisma.vpg_payrolls.findUnique({
      where: { payrolls_id: payrollId }
    });
    if (!payroll) throw new Error('Payroll not found');
    if (payroll.payrolls_status !== PayrollStatus.APROBADA) {
      throw new Error('Only APROBADA payrolls can be marked as paid');
    }
    
    const updated = await prisma.vpg_payrolls.update({
      where: { payrolls_id: payrollId },
      data: {
        payrolls_status: PayrollStatus.PAGADA,
        payrolls_version: payroll.payrolls_version + 1
      }
    });
    
    // Lock clock log adjustments for this payroll period
    await this.lockAdjustmentsForPayroll(payrollId, payroll.payrolls_period_start, payroll.payrolls_period_end);
    
    return this.mapToPayroll(updated);
  }

  /**
   * Reopen a payroll — transition from APROBADA to BORRADOR with audit trail
   */
  static async reopenPayroll(payrollId: number, userId: number, reason: string): Promise<Payroll> {
    const payroll = await prisma.vpg_payrolls.findUnique({
      where: { payrolls_id: payrollId }
    });
    if (!payroll) throw new Error('Payroll not found');
    if (payroll.payrolls_status !== PayrollStatus.APROBADA) {
      throw new Error('Only APROBADA payrolls can be reopened');
    }
    if (!reason || reason.length < 10) {
      throw new Error('Reopening requires a reason (minimum 10 characters)');
    }
    
    const [updated] = await prisma.$transaction([
      prisma.vpg_payrolls.update({
        where: { payrolls_id: payrollId },
        data: {
          payrolls_status: PayrollStatus.BORRADOR,
          payrolls_reopened_at: new Date(),
          payrolls_reopen_reason: reason,
          payrolls_approved_by: null,
          payrolls_approved_at: null,
          payrolls_version: payroll.payrolls_version + 1
        }
      }),
      prisma.vpg_audit_logs.create({
        data: {
          audit_logs_user_id: userId,
          audit_logs_action: 'REOPEN_PAYROLL',
          audit_logs_entity: 'payroll',
          audit_logs_entity_id: payrollId,
          audit_logs_timestamp: new Date(),
          audit_logs_details: JSON.stringify({ reason, previous_status: PayrollStatus.APROBADA })
        }
      })
    ]);
    
    return this.mapToPayroll(updated);
  }

  /**
   * Recalculate a payroll in BORRADOR state — saves snapshot before recalculation
   */
  static async recalculatePayroll(payrollId: number, userId: number, reason: string): Promise<Payroll> {
    const payroll = await prisma.vpg_payrolls.findUnique({
      where: { payrolls_id: payrollId },
      include: { vpg_payroll_employee: true }
    });
    if (!payroll) throw new Error('Payroll not found');
    if (payroll.payrolls_status !== PayrollStatus.BORRADOR) {
      throw new Error('Only BORRADOR payrolls can be recalculated');
    }
    
    // Save current snapshot before recalculating
    await prisma.vpg_payroll_recalculations.create({
      data: {
        recalc_payroll_id: payrollId,
        recalc_reason: reason,
        recalc_created_by: userId,
        recalc_data_snapshot: JSON.stringify(payroll)
      }
    });
    
    // TODO: Call NomineeService to recalculate employee salaries
    // This will be implemented in the execution phase
    
    // Increment version
    const updated = await prisma.vpg_payrolls.update({
      where: { payrolls_id: payrollId },
      data: {
        payrolls_version: payroll.payrolls_version + 1
      }
    });
    
    return this.mapToPayroll(updated);
  }

  /**
   * Calculate aguinaldo proportional for an employee
   * Based on Costa Rica Labor Code Article 196
   * Period: December 1 to November 30
   * Formula: (sum of gross salaries) / 12
   */
  static async calculateAguinaldo(
    employeeId: number,
    year: number
  ): Promise<{ total: number; months: number; promedio: number }> {
    const periodStart = new Date(`${year - 1}-12-01`);
    const periodEnd = new Date(`${year}-11-30`);
    
    // Get all payrolls in the period
    const payrolls = await prisma.vpg_payrolls.findMany({
      where: {
        payrolls_period_end: { gte: periodStart },
        payrolls_period_end: { lte: periodEnd },
        payrolls_status: { in: [PayrollStatus.APROBADA, PayrollStatus.PAGADA] }
      },
      include: {
        vpg_payroll_employee: {
          where: { payroll_employee_employee_id: employeeId }
        }
      }
    });
    
    // Sum gross salaries
    let totalGross = 0;
    let monthsWithSalary = 0;
    
    for (const payroll of payrolls) {
      for (const emp of payroll.vpg_payroll_employee) {
        totalGross += Number(emp.payroll_employee_gross_salary || 0);
        if (Number(emp.payroll_employee_gross_salary || 0) > 0) {
          monthsWithSalary++;
        }
      }
    }
    
    // Aguinaldo formula: sum / 12 (even for partial years)
    const aguinaldo = totalGross / 12;
    
    return {
      total: aguinaldo,
      months: monthsWithSalary,
      promedio: monthsWithSalary > 0 ? totalGross / monthsWithSalary : 0
    };
  }
}
```

### Anti-Patterns to Avoid

- **Hand-rolling state validation:** Do not write custom validation for state transitions. Use the methods above which enforce the rules explicitly.
- **Directly updating status bypassing service:** Always use the service methods—do not allow direct Prisma updates that bypass validation.
- **Forgetting audit trail:** Reopening must create an audit log entry (handled in `reopenPayroll`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|------------|-------------|-----|
| State validation | Custom FSM logic | Service methods above | Simple 3-state machine is clearer as explicit methods |
| Payroll status enum | Create new enum | Use Prisma `PayrollStatus` | Already defined in schema.prisma |
| Audit trail | Create custom tables | Use `vpg_audit_logs` | Already exists in schema |
| Recalculation history | Create new table | Use `vpg_payroll_recalculations` | Already exists in schema |

**Key insight:** The Prisma schema already contains all necessary fields and tables. This phase only adds service methods and HTTP endpoints.

---

## Common Pitfalls

### Pitfall 1: Attempting to modify locked payroll
**What goes wrong:** Trying to modify a PAGADA payroll causes data inconsistency.
**Why it happens:** No validation before update operations.
**How to avoid:** Check status in every operation. ClockLogAdjustmentService already blocks adjustments for PAGADA payrolls.
**Warning signs:** "Cannot modify PAGADA payroll" errors after approval.

### Pitfall 2: Missing recalculation snapshots
**What goes wrong:** Recalculating without saving previous version loses audit trail.
**Why it happens:** Forgetting to save snapshot before recalculation.
**How to avoid:** Always save to `vpg_payroll_recalculations` before recalculating.
**Warning signs:** Missing historical data when investigating past calculations.

### Pitfall 3: Incorrect aguinaldo period
**What goes wrong:** Using calendar year instead of December-November period.
**Why it happens:** Not knowing Costa Rica law specifies Dec 1 - Nov 30.
**How to avoid:** Use the dates specified in calculateAguinaldo method above.
**Warning signs:** Incorrect aguinaldo amounts inDecember.

### Pitfall 4: No approval user tracking
**What goes wrong:** Not recording who approved makes accountability impossible.
**Why it happens:** Missing approved_by field.
**How to avoid:** Use existing `payrolls_approved_by` and `payrolls_approved_at` fields.
**Warning signs:** Audit investigations unable to identify approver.

---

## Code Examples

### API Endpoints
```typescript
// Source: Based on existing controller patterns
import { Router } from 'express';
import { PayrollService } from '../service/PayrollService';

const router = Router();

// POST /payroll/:id/approve
router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const payroll = await PayrollService.approvePayroll(Number(id), userId);
    res.json(payroll);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /payroll/:id/pay
router.post('/:id/pay', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await PayrollService.markAsPaid(Number(id));
    res.json(payroll);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /payroll/:id/reopen
router.post('/:id/reopen', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;
    const payroll = await PayrollService.reopenPayroll(Number(id), userId, reason);
    res.json(payroll);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /payroll/:id/recalculate
router.post('/:id/recalculate', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;
    const payroll = await PayrollService.recalculatePayroll(Number(id), userId, reason);
    res.json(payroll);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /aguinaldo/:employeeId/:year
router.get('/aguinaldo/:employeeId/:year', authenticate, async (req, res) => {
  try {
    const { employeeId, year } = req.params;
    const aguinaldo = await PayrollService.calculateAguinaldo(
      Number(employeeId),
      Number(year)
    );
    res.json(aguinaldo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No state tracking | FSM with BORRADOR/APROBADA/PAGADA | This phase | Full payroll lifecycle |
| Raw clock logs for calculation | Use EffectiveMarksService | This phase | Accurate calculation with adjustments |
| Manual aguinaldo | Automatic calculation | This phase | Law-compliant, proportional |

**Deprecated/outdated:**
- Direct payroll status updates without validation — replaced by service methods
- Raw clock log consumption for payroll calculation — replaced by effective marks

---

## Open Questions

1. **NomineeService Integration**
   - What we know: NomineeService calculates employee salaries for a period
   - What's unclear: How to integrate effective marks consumption
   - Recommendation: Update NomineeService to use ClockLogEffectiveService before calculating payroll

2. **Frontend State Display**
   - What we know: Payroll list shows status
   - What's unclear: How to show state transitions in UI (dialogs, confirmations)
   - Recommendation: UX-02 in requirements addresses this — confirm explicit confirmation dialogs

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Backend | ✓ | 20.x | — |
| PostgreSQL | Database | ✓ | 15.x | — |
| Prisma | ORM | ✓ | 5.x | — |
| Jest | Testing | ✓ | 29.x | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest |
| Config file | jest.config.js |
| Quick run command | `npm test -- --testPathPattern="PayrollService" --verbose` |
| Full suite command | `npm test -- --verbose` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLANILLA-04 | State machine transitions | Unit | `npm test -- --testPathPattern="PayrollService.test" --testNamePattern="approvePayroll"` | ✅ PayrollService.test.ts |
| PLANILLA-04 | Reopen creates audit log | Unit | `npm test -- --testPathPattern="PayrollService.test" --testNamePattern="reopenPayroll"` | ✅ PayrollService.test.ts |
| PLANILLA-04 | Recalculate saves snapshot | Unit | `npm test -- --testPathPattern="PayrollService.test" --testNamePattern="recalculatePayroll"` | ✅ PayrollService.test.ts |
| PLANILLA-05 | Aguinaldo calculation | Unit | `npm test -- --testPathPattern="PayrollService.test" --testNamePattern="calculateAguinaldo"` | ❌ Add to PayrollService.test.ts |

### Sampling Rate
- **Per task commit:** Quick run for affected tests
- **Per wave merge:** Full suite
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] Test cases for `calculateAguinaldo` — covers PLANILLA-05
- [ ] Test cases for state transition methods (`approvePayroll`, `markAsPaid`, `reopenPayroll`, `recalculatePayroll`)
- [ ] Test for audit log creation on reopen

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

---

## Sources

### Primary (HIGH confidence)
- Prisma schema.prisma — PayrollStatus enum, payrolls table fields
- PayrollService.ts — existing patterns to extend
- Costa Rica Labor Code Article 196 — aguinaldo calculation

### Secondary (MEDIUM confidence)
- WebSearch: Costa Rica aguinaldo calculation formulas
- El Financiero CR: "Calculadora de aguinaldo en Costa Rica 2025"
- Talentify CR: "Aguinaldo en Costa Rica — derecho laboral"

### Tertiary (LOW confidence)
- WebSearch only for state machine libraries (XState, finity) — but custom implementation preferred

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — only uses existing project dependencies
- Architecture: HIGH — extends existing service patterns
- Pitfalls: HIGH — well-understood from existing Phase 33/34 learnings
- Aguinaldo law: HIGH — verified multiple sources

**Research date:** 2026-04-15
**Valid until:** 90 days (labor law is stable)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLANILLA-02 | Calculation using EffectiveMarksService | Service methods updated to consume effective marks |
| PLANILLA-04 | State machine BORRADOR→APROBADA→PAGADA | approvePayroll, markAsPaid, reopenPayroll, recalculatePayroll methods |
| PLANILLA-05 | Aguinaldo proportional calculation | calculateAguinaldo method with December-November period |
| PLANILLA-06 | Recalculation traceability | vpg_payroll_recalculations table usage |
</phase_requirements>