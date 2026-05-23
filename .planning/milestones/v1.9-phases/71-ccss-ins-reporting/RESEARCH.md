# Research: Phase 71 — CCSS/INS Detailed Reporting

## Overview
Phase 71 aims to provide the necessary reporting tools for social security (CCSS) and occupational risk insurance (INS) compliance in Costa Rica. This involves consolidating payroll data into specific formats (CSV/XML) required by these institutions.

## Technical Analysis

### 1. CCSS (SICERE) Requirements
The SICERE system requires a monthly or biweekly file (usually CSV or fixed-width text) with the following fields per employee:
- **Identification Type**: (e.g., 1 for National, 2 for Foreigner).
- **Identification Number**: `employee_national_id`.
- **Employee Name**: `fullName`.
- **Gross Salary**: `payroll_employee_gross_salary`.
- **Worked Days**: Current DB tracks hours, but SICERE requires discrete days (max 30 per month).
- **Overtime Pay**: `payroll_employee_overtime_pay`.
- **Vacation Pay**: Needs to be extracted from `vpg_vacations` overlaps or logged during calculation.
- **Social Security Code**: `employee_social_code`.

### 2. INS (Riesgos del Trabajo) Requirements
The INS report is used to calculate the insurance premium based on occupational hazards.
- **Occupation Code**: Each position has a specific code (e.g., 1101 for office work).
- **Risk Class**: (Class I to V).
- **Gross Salary**: Similar to CCSS.

### 3. Data Model Gaps
- **vpg_positions**: Missing `position_occupation_code` and `position_risk_class`.
- **vpg_payroll_employee**: We should store `worked_days` count explicitly during calculation to avoid re-computing it from logs for every report.
- **Reporting Service**: Currently only supports per-employee XML generation. Needs logic for consolidated CSV exports.

## Proposed Strategy

### Wave 1: Schema & Metadata
- Update `vpg_positions` to include INS occupation codes and risk classes.
- Update `vpg_payroll_employee` to include `payroll_employee_worked_days`.

### Wave 2: Backend Logic
- Implement `ReportsService.generateCCSSReport(payrollId)`: Generates a CSV formatted for SICERE.
- Implement `ReportsService.generateINSReport(payrollId)`: Generates a CSV for INS Riesgos del Trabajo.
- Refactor `NomineeService` to count and save discrete worked days.

### Wave 3: UI Implementation
- Add "Institutional Exports" section in the Reports page.
- Add fields to the Position management form for INS metadata.

## Verification Plan
## Open Questions (RESOLVED)
- **Q: Should vacation days be counted as worked days for CCSS?**
  - **A:** Yes. According to SICERE standards, any paid day (worked or vacation) must be reported in the days count.
- **Q: Are INS occupation codes standardized in the DB?**
  - **A:** No, they are currently missing. We will add a string field for the code and an enum for risk class to `vpg_positions`.
