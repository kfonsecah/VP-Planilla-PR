---
phase: 56
reviewers: [gemini, claude, codex, opencode]
reviewed_at: 2026-04-26T19:21:47-06:00
plans_reviewed: [56-01-PLAN.md, 56-02-PLAN.md, 56-03-PLAN.md, 56-04-PLAN.md]
---

# Cross-AI Plan Review — Phase 56

## Gemini Review

**Summary**
The plan for decoupling the calculation engine from hardcoded literals is excellent. The wave breakdown ensures safety by defining the interface first, updating pure functions next, and finally wiring it up to the DB service. 

**Strengths**
- Using `DEFAULT_LEGAL_PARAMS` as a fallback parameter in `payrollUtils.ts` is a very smart approach to prevent massive breakages across existing unit tests.
- Pre-loading parameters exactly once in `calculatePayrollForPeriod` perfectly avoids the N+1 query problem.

**Concerns**
- MEDIUM: What happens in Wave 3 if `LegalParamService.getParamsAtDate(startDate)` returns an empty array (e.g., if the DB is missing parameters)? The plan suggests falling back to `DEFAULT_LEGAL_PARAMS`, but silently falling back might mask configuration errors from the payroll administrator.

**Suggestions**
- If critical parameters are missing from the database, `NomineeService` should explicitly warn the user or halt the calculation rather than silently falling back to defaults.

**Risk Assessment**: LOW

---

## the agent Review

**Summary**
A solid example of refactoring via Dependency Injection. Passing `LegalParamSet` into the pure functions keeps `payrollUtils.ts` deterministic and highly testable.

**Strengths**
- `payrollUtils.ts` remains pure, containing zero Prisma calls.
- Wave 4 adds explicit tests to prove that parameter variance actually alters the output.

**Concerns**
- LOW: In `56-02-PLAN.md`, `calculateWeeklyRestPay` needs to pass `params` down to `calculateRegularHours`. It's easy to miss nested function calls during refactoring.

**Suggestions**
- Ensure that the TypeScript compiler (`tsc --noEmit`) runs strictly after Wave 2 to catch any missed argument passing down the utility call chain.

**Risk Assessment**: LOW

---

## Codex Review

**Summary**
The TypeScript typing strategy is sound. The mapping of the flat `VpgLegalParam` key/value pairs into the strongly-typed `LegalParamSet` struct creates a much safer developer experience.

**Strengths**
- The mapping logic in `NomineeService` cleanly bridges the database schema and the calculation engine domain.

**Concerns**
- LOW: The plan mentions potentially removing `WORKING_DAYS_PER_WEEK`. However, a 6-day work week is a physical calendar property in the context of this specific payroll logic, not necessarily a legal parameter that changes. 

**Suggestions**
- Keep `WORKING_DAYS_PER_WEEK` as a standard `const` in `payrollUtils.ts`. Only decouple properties that are subject to legislative change.

**Risk Assessment**: LOW

---

## OpenCode Review

**Summary**
This refactor sets a highly maintainable foundation for the upcoming feature phases (Phase 58, 59, 66). The boundaries are strictly defined.

**Strengths**
- Good use of `TODO: Phase 66` comments to explicitly block scope creep regarding the `ShiftType` fields which do not exist in the DB yet.

**Concerns**
- MEDIUM: In Wave 3, `NomineeService` constructs the `LegalParamSet`. This mapping logic could become bloated if more parameters are added in the future.

**Suggestions**
- Consider moving the `getParamValue` mapping logic into a static helper method inside `LegalParamService` (e.g., `LegalParamService.getParamSetAtDate()`), keeping `NomineeService` clean.

**Risk Assessment**: LOW

---

## Consensus Summary

The reviewing AIs unanimously approve the plan. The strategy of using a configuration object (`LegalParamSet`) and default fallbacks is robust and prevents testing regressions.

### Agreed Strengths
- Avoids N+1 query performance issues by fetching parameters at the start of the payroll run.
- Maintains the "pure function" nature of `payrollUtils.ts`.
- The `DEFAULT_LEGAL_PARAMS` fallback prevents rewriting hundreds of existing tests.

### Agreed Concerns
- **Error Handling**: Silently falling back to `DEFAULT_LEGAL_PARAMS` in production if the DB is missing records might lead to incorrect payrolls without the admin knowing (raised by Gemini).
- **Mapping Responsibility**: Constructing the `LegalParamSet` manually inside `NomineeService` mixes data mapping with payroll orchestration (raised by OpenCode).

### Divergent Views
- Codex correctly points out that calendar constraints like `WORKING_DAYS_PER_WEEK` should probably remain constant, while other AIs focused purely on the legal variables. The plan accommodates this gracefully.
