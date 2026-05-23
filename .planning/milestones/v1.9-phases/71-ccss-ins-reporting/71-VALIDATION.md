# Validation Plan: Phase 71 — CCSS/INS Detailed Reporting

## Overview
This phase implements institutional reporting for CCSS (SICERE) and INS (Riesgos del Trabajo). Validation focuses on data accuracy, format compliance (CSV/SICERE standards), and logic correctness regarding "worked days".

## Validation Dimensions

### 1. Data Accuracy (CCSS/SICERE)
- **Criterion**: The sum of "worked days" must include both physical clock marks and approved vacations.
- **Verification**: Cross-reference unit tests for `NomineeService` comparing the `worked_days` field with a manual count of logs + vacations in a control payroll.
- **Gate**: Unit tests pass for 5+ edge cases (full quincena, only vacations, zero work, partial overlap).

### 2. Format Integrity
- **Criterion**: CSV outputs must match the exact column ordering and header naming required by SICERE and INS portals.
- **Verification**: Generate sample CSVs for a test payroll and verify structure using a regex-based format validator in Jest.
- **Gate**: `ReportsService` integration tests pass CSV structural checks.

### 3. Metadata Persistence
- **Criterion**: INS occupation codes and risk classes must be correctly persisted and retrieved from the position record.
- **Verification**: UI manual verification of the Position Management form + Prisma schema check.
- **Gate**: Form saves/loads values correctly; database columns match the migration.

### 4. Integration
- **Criterion**: Manual adjustments in the Payroll Wizard must be reflected in the institutional reports.
- **Verification**: Adjust a gross salary in Step 3 of the Wizard and verify the corresponding CSV value.
- **Gate**: Report totals match `vpg_payroll_employee` adjusted values.

## Testing Strategy
- **Unit Tests**: `NomineeService.ts` for worked days logic.
- **Integration Tests**: `ReportsService.ts` for CSV generation and file persistence.
- **E2E/UI**: Manual verification of institutional export downloads in the Reports page.
