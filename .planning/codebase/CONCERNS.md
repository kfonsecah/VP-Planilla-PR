# Codebase Concerns

**Analysis Date:** 2025-05-09

## Tech Debt

**Ignored Database Tables:**
- Issue: `vpg_branch_employee` and `vpg_enterprise_branch` are ignored by Prisma because they lack a valid unique identifier (primary key).
- Files: `src/backend/prisma/schema.prisma`
- Impact: Prisma Client cannot perform CRUD operations on these tables. Manual SQL or `prisma.$executeRaw` is required for branch assignments.
- Fix approach: Add an `id` column or a composite primary key to these mapping tables.

**Lock Adjustments Logic:**
- Issue: Logic to mark clock logs as non-adjustable for a period after payroll approval is missing.
- Files: `src/backend/src/service/PayrollService.ts` (L496), `src/backend/src/service/NomineeService.ts`
- Impact: Users could theoretically adjust clock logs of already approved/paid payrolls, leading to inconsistencies.
- Fix approach: Implement Phase 66 (Jornadas/Lock logic) to seal periods.

**Missing Dependencies for Features:**
- Issue: PDF ZIP generation requires an additional library not yet integrated.
- Files: `src/backend/src/controller/PaymentReceiptController.ts` (L128), `src/backend/src/service/PaymentReceiptService.ts`
- Impact: Users cannot download all payment receipts at once as a ZIP.
- Fix approach: Install and integrate `adm-zip` or `jszip`.

**Recalculation vs Manual Overrides:**
- Issue: Employees with `payroll_employee_is_manually_adjusted = true` are skipped during recalculations.
- Files: `src/backend/src/service/NomineeService.ts` (L170)
- Impact: If legal parameters or company-wide bonuses change, manually adjusted employees will remain stale unless manually updated again.
- Fix approach: Implement a "Reset to automatic" feature in the UI or a smarter merge logic for deductions.

## Security Considerations

**Mail Server Credentials:**
- Issue: Mail server password stored in cleartext in the database.
- Files: `src/backend/prisma/schema.prisma` (`vpg_mail_server_settings`), `src/backend/src/service/MailService.ts` (implied)
- Current mitigation: None detected in schema.
- Recommendations: Encrypt the password field at rest using a vault or a project-level secret key.

**Transient Calculation Data:**
- Issue: The `PayrollWizard` uses a `ref` (`nominationTransientRef`) to store calculation details (inconsistencies, breakdowns) that are NOT persisted to the database.
- Files: `src/frontend/src/app/pages/payroll/wizard/page.tsx`
- Current mitigation: Memory-only state.
- Recommendations: Persist calculation "snapshots" or "results" to a temporary JSON column in the database if the wizard needs to survive refreshes.

## Performance Bottlenecks

**Large Component Complexity:**
- Problem: `PayrollWizard` page is over 800 lines with complex multi-step state and transient data merging.
- Files: `src/frontend/src/app/pages/payroll/wizard/page.tsx`
- Cause: Mixing business logic (mapping results), complex state, and large UI sections.
- Improvement path: Decompose the wizard into smaller sub-components for each step and move calculation mapping to a dedicated utility or hook.

## Fragile Areas

**Costa Rica Labor Law Math:**
- Files: `src/backend/src/utils/payrollUtils.ts`
- Why fragile: Extremely dense logic for holiday multipliers, weekly rest formulas (`x 8 / 104 * 2`), and labor event behaviors. A small change can cause massive financial errors.
- Safe modification: Any change must be accompanied by comprehensive unit tests in `payrollUtils.test.ts`.
- Test coverage: Exists but must be strictly enforced for every edge case (e.g., worked holiday on a rest day).

## Scaling Limits

**N+1 Queries in Calculation:**
- Current capacity: NomineeService uses preloading for most entities.
- Limit: Preloading ALL clock logs and ALL bonuses for ALL active employees might hit memory limits if the employee count exceeds 500-1000.
- Scaling path: Implement batch processing or pagination for large payrolls.

## Test Coverage Gaps

**Inconsistency Resolution:**
- What's not tested: The business impact of treating "orphan" clock logs as 0h hours.
- Files: `src/backend/src/service/NomineeService.ts`, `src/backend/src/utils/payrollUtils.ts`
- Risk: If a user misses the "Inconsistency" warning, an employee might be underpaid without a hard block.
- Priority: Medium

---

*Concerns audit: 2025-05-09*
