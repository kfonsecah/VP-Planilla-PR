# Phase 72: Hacienda Export Formats (D-151) - Research

**Researched:** 2026-05-13
**Domain:** Hacienda (Tax) Regulatory Reporting (Costa Rica)
**Confidence:** HIGH

## Summary

As of 2026, reporting to the Costa Rican Ministerio de Hacienda has undergone a significant transition with the full implementation of the **TRIBU-CR** portal (replacing ATV) and the new monthly informative obligations. 

For a payroll system, Hacienda reporting covers two distinct areas:
1. **Informative Declarations (D-151 / D-270)**: Resumen de Clientes, Proveedores y Gastos Específicos. Used for reporting payments to contractors or professional services who are not in the regular payroll (don't have CCSS deductions) and haven't issued an electronic invoice.
2. **Retention Summaries (Historical D-152 / Annual Salary Summary)**: Summary of income tax retentions from regular salaries. These are now reported monthly via TRIBU-CR, but an annual aggregate is required for fiscal reconciliation and for the employee's personal tax records ("Constancia de Salarios").

**Primary recommendation:** Use **CSV/Excel** as the primary export format for compatibility with TRIBU-CR bulk upload templates. Implement an extensible `Exporter` pattern in `ReportsService` to handle the specific column mapping for D-151 and Salary Summaries. [VERIFIED: hacienda.go.cr / TRIBU-CR documentation]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Data Aggregation | API / Backend | — | Service layer must query across multiple payroll periods to sum annual totals. |
| File Generation (Binary/Text) | API / Backend | — | Server-side generation ensures archival consistency and avoids browser-side memory limits for large datasets. |
| Export Triggering | Browser / Client | — | User initiates export via specialized Reports UI. |
| Template Formatting | API / Backend | Frontend (UI) | Backend applies strict Hacienda column order; Frontend handles previewing. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `exceljs` | ^4.4.0 | Excel (.xlsx) generation | Already present in frontend; high performance for large datasets. [VERIFIED: package.json] |
| `xmlbuilder2` | ^3.1.1 | XML generation | Standard for generating structured, schema-compliant XML in Node.js. [CITED: npmjs.com] |
| `csv-writer` | ^1.6.0 | CSV generation | Simplifies header/row mapping and escaping. [CITED: npmjs.com] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `archiver` | ^7.0.1 | ZIP compression | If exporting multiple files (e.g., individual employee summaries). |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `exceljs` | `xlsx` (SheetJS) | `exceljs` provides better styling control for official-looking summaries. |
| `xmlbuilder2` | `fast-xml-parser` | `xmlbuilder2` is more intuitive for *generating* XML from scratch. |

**Installation:**
```bash
# In src/backend/
npm install exceljs xmlbuilder2 csv-writer
```

## Architecture Patterns

### Recommended Project Structure
```
src/backend/src/
├── service/
│   ├── ReportsService.ts       # Main entry point for official reports
│   └── exporters/              # Format-specific logic (Strategy pattern)
│       ├── CsvExporter.ts
│       ├── XmlExporter.ts
│       └── ExcelExporter.ts
```

### Pattern 1: Annual Aggregator (Data Prep)
Before exporting, the service must aggregate data for a specific fiscal year (January–December).
```typescript
// Pattern: Aggregated Salary Summary (D-152 logic)
async function getAnnualAggregation(year: number) {
  return await prisma.vpg_payroll_employee.groupBy({
    by: ['payroll_employee_employee_id'],
    where: {
      vpg_payrolls: {
        payrolls_period_start: { gte: new Date(`${year}-01-01`) },
        payrolls_period_end: { lte: new Date(`${year}-12-31`) },
      }
    },
    _sum: {
      payroll_employee_gross_salary: true,
      payroll_employee_net_salary: true,
      // Total tax withheld must be summed from specific deductions
    }
  });
}
```

### Anti-Patterns to Avoid
- **Hardcoding column orders:** Hacienda templates change frequently. Use a configuration-driven mapping.
- **Client-side only aggregation:** Aggregating thousands of rows in the browser can lead to crashes or data inconsistency if some periods are not loaded.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Excel formatting | Manual binary streams | `exceljs` | Complexities of the OOXML format. |
| XML Escaping | `string.replace()` | `xmlbuilder2` | Handles CDATA, attributes, and special chars safely. |
| CSV escaping | `rows.join(',')` | `csv-writer` | Handles quotes and commas within cell values. |

## Common Pitfalls

### Pitfall 1: Identification Type Codes
**What goes wrong:** Exporting "National ID" as a string without the Hacienda numeric code.
**Why it happens:** Hacienda uses codes: 1=Física, 2=Jurídica, 3=DIMEX, 4=NITE.
**How to avoid:** Map `employee_national_id` pattern to the correct code or add an explicit type field to `vpg_employees`.

### Pitfall 2: Rounding Mismatches
**What goes wrong:** The sum in the report doesn't match the sum of individual payrolls.
**Why it happens:** Inconsistent rounding between periodic calculations and the annual aggregate.
**How to avoid:** Always use `roundToMoney` (2 decimals) at every stage of the aggregation. [VERIFIED: payrollUtils.ts]

### Pitfall 3: ASCII/Latin-1 Encoding
**What goes wrong:** Special characters (ñ, á) appearing as gibberish in legacy Hacienda tools (Declara7).
**Why it happens:** Old CR tools use Latin-1/Windows-1252, but Node.js uses UTF-8.
**How to avoid:** TRIBU-CR (2026) supports UTF-8, but provide an option to encode in `iso-8859-1` if requested.

## Code Examples

### D-151 CSV Generation (TRIBU-CR Format)
```typescript
// Example Strategy for D-151
import { createObjectCsvStringifier } from 'csv-writer';

const csvStringifier = createObjectCsvStringifier({
  header: [
    { id: 'typeId', title: 'Tipo de Cédula' },
    { id: 'id', title: 'Número de Cédula' },
    { id: 'name', title: 'Nombre / Razón Social' },
    { id: 'amount', title: 'Monto Acumulado' },
    { id: 'code', title: 'Código de Operación' },
  ]
});

// Row mapping example
const rows = aggregatedData.map(d => ({
  typeId: mapIdToHaciendaCode(d.nationalId), // 1, 2, 3...
  id: d.nationalId.replace(/-/g, ''), // No hyphens
  name: d.fullName.toUpperCase(),
  amount: d.totalGross.toFixed(2),
  code: 'SP' // Professional Services
}));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| D-151 Annual | D-270 Monthly | 2025/2026 | More frequent filings via TRIBU-CR portal. |
| Declara7 (.txt) | TRIBU-CR (.xlsx/.csv) | 2024-2025 | Standardized web-based uploads. |
| D-152 Annual | Monthly Retentions | Late 2025 | Real-time monitoring of salary taxes. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | D-151 XML is not the official upload format | Summary | Low - Excel/CSV are confirmed for TRIBU-CR; XML is likely for internal use only. |
| A2 | "Annual Salary Summary" refers to Retention Summary | Summary | Medium - Could also mean a simplified report for employees. Implementation should cover both. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | ✓ | 22.14.0 | — |
| Prisma | Data access | ✓ | 6.14.0 | — |
| exceljs | Excel exports | ✓ (Frontend) | 4.4.0 | Install in backend |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest |
| Config file | `src/backend/jest.config.js` |
| Quick run command | `npm test src/backend/tests/service/ReportsService.test.ts` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| REP-01 | D-151 CSV contains correct headers and no hyphens in IDs | Unit | `npm test -t "D-151 format"` |
| REP-02 | Annual Salary Summary sums 12 months correctly | Integration | `npm test -t "Annual aggregation"` |
| REP-03 | Special characters are handled correctly | Unit | `npm test -t "Encoding"` |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Validate `year` and `payrollId` parameters using Zod. |
| V12 File Upload/Download | yes | Sanitize generated filenames to prevent path traversal; restrict download access to authorized roles. |

### Known Threat Patterns for Node.js Exports

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| CSV Injection | Tampering | Prepend `'` to cells starting with `=`, `+`, `-`, `@`. |
| Path Traversal | Information Disclosure | Use `path.basename()` on user-provided filenames. |

## Sources

### Primary (HIGH confidence)
- `hacienda.go.cr` - Official TRIBU-CR portal guides (2025-2026).
- `src/backend/src/service/ReportsService.ts` - Existing report infrastructure.
- `src/backend/prisma/schema.prisma` - DB schema verification.

### Secondary (MEDIUM confidence)
- Accounting blogs (Baker Tilly, Deloitte CR) - Transition from D-151 to D-270.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries are industry standard and already partially used.
- Architecture: HIGH - Follows existing `ReportsService` patterns.
- Pitfalls: HIGH - Based on common CR tax reporting experience.

**Research date:** 2026-05-13
**Valid until:** 2026-06-13
