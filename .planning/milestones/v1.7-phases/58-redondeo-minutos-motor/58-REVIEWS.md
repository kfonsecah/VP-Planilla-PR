---
phase: 58
reviewers: [gemini, opencode]
reviewed_at: 2026-04-26T22:30:00Z
plans_reviewed: [58-01-PLAN.md, 58-02-PLAN.md]
---

# Cross-AI Plan Review — Phase 58: Redondeo de Minutos en Motor

## Gemini Review

### Summary
The implementation strategy for Phase 58 is logically structured and adheres strictly to the research recommendations and domain requirements. By splitting the work into a "Foundation" plan (58-01: Types, Utils, and Data Loading) and an "Integration" plan (58-02: Service logic and Testing), the team ensures that the core mathematical logic is validated before being wired into the production payroll engine. The approach of rounding at the **daily aggregation level** (rather than per-log) is technically sound as it prevents the "compounding rounding error" problem.

### Strengths
*   **Mathematical Precision:** Proposed formulas using integer-based divisions (15-minute quarters) are standard industry practice.
*   **Separation of Concerns:** Rounding logic as a pure function in `payrollUtils.ts` makes the code highly testable.
*   **Adherence to Research:** Decision to apply rounding to *daily minutes* before converting to decimal hours follows the primary recommendation.
*   **Layered Implementation:** Loading the policy via `LegalParamService` keeps `NomineeService` focused on orchestration.

### Concerns
*   **Missing Default Policy Handling (LOW):** If the `vpg_enterprise` table has a null value, the motor might behave unpredictably.
*   **Floating Point Safety (MEDIUM):** Risk of precision issues (e.g., 7.99999999 mins) before the rounding function is called.
*   **Overtime Interaction (MEDIUM):** Unclear if rounding applies before or after splitting regular hours from overtime.
*   **Integration Test Gap (LOW):** Lacks a service-level integration test verifying policy retrieval and application.

### Suggestions
*   **Defensive Defaults:** Ensure `LegalParamService` defaults to `EXACT`.
*   **Input Sanitization:** Add `Math.floor()` or `Math.round()` inside `applyMinuteRounding` for the input `totalMinutes`.
*   **Edge Case Tests:** Add a test case for the "Half-Quarter" mark (7.5 minutes).
*   **Traceability:** Include the selected rounding policy in logs or responses.

---

## OpenCode Review (Nemotron-3-Super-Free)

### Summary
Plan 58-01 establishes the foundational technical infrastructure. It correctly identifies the three required rounding modalities. Plan 58-02 correctly focuses on applying rounding to daily totals before conversion to decimal hours, which aligns with the requirement to prevent floating-point accumulation errors.

### Strengths
*   **Clear separation of concerns:** types, utility function, and service integration.
*   **Proper use of TypeScript enums:** ensures type safety via Prisma client.
*   **Integer-based minute calculation:** avoids floating-point precision issues.
*   **Comprehensive unit tests:** covers exact examples from Payroll.md §4.

### Concerns
*   **API signature change (MEDIUM):** Modifying `calculateDailyHours` to accept a policy parameter may affect other callers.
*   **Input Validation (MEDIUM):** Doesn't explicitly mention handling negative minutes or extremely large values.
*   **Regression check clarity (LOW):** Verification mentions checking for regressions but doesn't specify coverage.

### Suggestions
*   **Caller Audit:** Perform a thorough search for all usages of `calculateDailyHours`.
*   **Default Parameters:** Consider a default value for the policy parameter to minimize breaking changes.
*   **Boundary tests:** Add tests for exact quarter-hour boundaries.

---

## Consensus Summary

### Agreed Strengths
*   **Daily Aggregation Strategy:** Both reviewers strongly support rounding the daily total minutes rather than per-interval to avoid cumulative errors.
*   **Architecture:** Separation of pure logic (Utils) from data fetching (LegalParamService) and orchestration (NomineeService) is considered high quality.
*   **TDD Focus:** The inclusion of specific test cases from `Payroll.md` is a key strength.

### Agreed Concerns
*   **Fallback Logic:** Both reviewers highlight the need for a robust default (`EXACT`) if the policy is missing or null in the database.
*   **Precision/Sanitization:** Both point out potential floating-point noise from timestamp subtraction and suggest sanitizing the input to the rounding function.
*   **API Stability:** The change to `calculateDailyHours` signature is a point of concern regarding potential side effects on other callers.

### Divergent Views
*   **OT Logic:** Gemini specifically raised the question of whether rounding happens before or after the regular/OT split. This is a critical domain detail that should be confirmed.
*   **Input Validation:** OpenCode emphasized validation for negative or extreme values, whereas Gemini focused more on mathematical precision/float drift.

## Actionable Recommendations for Implementation
1.  **Verify Callers:** Before modifying `calculateDailyHours`, audit `NomineeService` and other files for any other usages.
2.  **Add Fallback:** Explicitly implement `policy || MinuteRoundingPolicy.EXACT` in the service layer.
3.  **Sanitize Minutes:** Ensure `totalMinutes` passed to `applyMinuteRounding` is an integer via `Math.round()` or `Math.floor()`.
4.  **Confirm OT Flow:** Verify that rounding is applied to the daily total *before* the 8h/10h/etc. split logic.
