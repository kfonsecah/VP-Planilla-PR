# Phase 73: Data Integrity & Analytics - Research

**Researched:** 2026-05-13
**Domain:** Data Quality, Payroll Compliance (Costa Rica), Dashboards
**Confidence:** HIGH

## Summary

Phase 73 focuses on implementing a **Data Integrity Dashboard** within the VP-Planilla system. As the system matures (reaching v1.9), ensuring that the accumulated data—employees, clock logs, and payroll runs—is consistent and compliant with Costa Rican labor laws becomes critical.

The primary goal is to detect and visualize "data debt" (missing IDs, incomplete position metadata like INS codes) and "logical debt" (payroll recalculation drift, orphan marks).

**Primary recommendation:** Implement a rule-based **Integrity Engine** in the backend that performs high-performance bulk checks (using optimized Prisma queries or raw SQL where necessary) and exposes them via a specialized API. The frontend will consume this to provide a "Health Score" and actionable alerts for HR administrators.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Data Integrity Engine | API / Backend | — | Logic must run close to the database for performance and consistency. |
| Audit Triggering | Browser / Client | — | Manual "Run Audit" triggers are user-initiated client actions. |
| Dashboard Visualization | Browser / Client | Frontend Server (SSR) | Interactive widgets require React state; initial load uses SSR for speed. |
| Exporting Results | API / Backend | — | CSV/PDF generation for audit reports belongs to the server. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Express | 5.1.0 | Backend API | Project standard [VERIFIED: GEMINI.md] |
| Next.js | 15.5.6 | Frontend framework | Project standard [VERIFIED: GEMINI.md] |
| React | 19.0.0 | UI Library | Project standard [VERIFIED: GEMINI.md] |
| Prisma | ^6.14.0 | ORM | Project standard [VERIFIED: GEMINI.md] |
| Tailwind CSS | ^4 | Styling | Project standard [VERIFIED: GEMINI.md] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| Recharts | ^2.15 | Data Visualization | Displaying integrity trends and score distributions. [CITED: npmjs.com] |
| Lucide React | Latest | Dashboard Icons | Visual status indicators (Warnings, Errors). [CITED: lucide.dev] |

## Architecture Patterns

### Recommended Project Structure
```
src/
├── backend/src/
│   ├── controller/IntegrityController.ts   # Request handling
│   ├── service/IntegrityService.ts         # CORE: Rule engine logic
│   └── routes/integrity.routes.ts          # API endpoints
└── frontend/src/
    ├── app/pages/integrity/
    │   └── dashboard/page.tsx               # Main Dashboard page
    ├── components/integrity/
    │   ├── IntegrityHealthScore.tsx         # Circular progress/score
    │   ├── IntegrityAlertList.tsx           # Grouped alerts
    │   └── IntegrityAuditHistory.tsx        # Past audit logs
    └── services/integrityService.ts         # API wrapper
```

### Pattern 1: Rule-Based Integrity Engine
Implement a registry of rules where each rule executes a specific query and returns a standardized `Alert` object.

**Example Logic (Backend):**
```typescript
// backend/service/IntegrityService.ts
export interface IntegrityAlert {
  code: string;
  severity: 'INFO' | 'WARN' | 'ERROR';
  entity: 'EMPLOYEE' | 'PAYROLL' | 'CLOCK_LOG' | 'POSITION';
  message: string;
  affectedCount: number;
  sampleIds: number[]; // First 5-10 IDs for quick access
}

// Rule Example: Missing INS Risk Class
const checkMissingRiskClass = async () => {
  const positions = await prisma.vpg_positions.findMany({
    where: { 
      OR: [
        { position_risk_class: null },
        { position_risk_class: '' }
      ]
    },
    select: { position_id: true }
  });
  return {
    code: 'POS-002',
    severity: 'ERROR',
    entity: 'POSITION',
    message: 'Posiciones sin Clase de Riesgo (requerido para INS)',
    affectedCount: positions.length,
    sampleIds: positions.map(p => p.position_id).slice(0, 5)
  };
};
```

## Defined Integrity Checks (Costa Rica Context)

| Category | ID | Check Name | Description |
|----------|----|------------|-------------|
| **Employees** | EMP-001 | Missing National ID | Required for CCSS and Hacienda (D-151). |
| **Employees** | EMP-002 | Invalid ID Format | Must match CR patterns (9 digits physical, 10 legal/DIMEX). |
| **Positions** | POS-001 | Missing INS Metadata | Missing `position_occupation_code` or `position_risk_class`. [VERIFIED: Phase 71] |
| **Payroll** | PAY-001 | Calculation Drift | Detects if approved payroll totals don't match sum of their components. |
| **Payroll** | PAY-002 | Missing Snapshot | Approved payrolls missing `vpg_payroll_param_snapshots`. |
| **Clock Logs** | CLK-001 | Orphan Marks | Logs with status `orphan` (no employee match). |
| **Clock Logs** | CLK-002 | Open Sessions | Employees with an IN mark but no OUT for > 16 hours. |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart Rendering | Custom SVG | Recharts | Handles responsiveness and accessibility automatically. |
| Complex Date Math | Native `Date` offsets | `date-fns` | (Optional) consistent timezone and period handling. |
| ID Validation | Custom Regex | Known CR patterns | CR IDs have specific regional prefixes and lengths. |

## Common Pitfalls

### Pitfall 1: Performance Degradation during Audits
**What goes wrong:** Running the integrity engine as a series of sequential loops (N+1 problem).
**Why it happens:** Fetching each employee record one by one to validate.
**How to avoid:** Use aggregate Prisma queries (`count()`, `findMany` with filters) to identify batches of invalid records.

### Pitfall 2: Rounding Noise in Payroll Integrity
**What goes wrong:** PAY-001 (Calculation Drift) flags perfectly valid payrolls as "corrupt" due to `0.000001` differences.
**Why it happens:** Floating point math in JavaScript vs Decimal in PostgreSQL.
**How to avoid:** Always use a `0.01` epsilon (tolerance) for monetary integrity checks.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | INS risk codes are at the position level | Defined Integrity Checks | If they are at the employee level, the check logic needs to move from `vpg_positions` to `vpg_employees`. |
| A2 | National ID format is strictly enforced | Defined Integrity Checks | If DIMEX or other formats are used without standardization, format checks might yield false positives. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | 22.14.0 | — |
| PostgreSQL | Data Store | ✓ | 16.x (Assumed) | — |
| Prisma | ORM | ✓ | 6.14.0 | — |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | Dashboard access must be restricted to `ADMIN` and `HR_MANAGER` roles. |
| V5 Input Validation | yes | Sanitize any user-provided filters for the audit queries. |

## Sources

### Primary (HIGH confidence)
- `src/backend/prisma/schema.prisma` - Current table structures.
- `PHASE_CONTRACT.md` - Project architecture and naming rules.
- `src/backend/src/utils/payrollUtils.ts` - Mathematical logic for drift detection.

### Secondary (MEDIUM confidence)
- Costa Rica Labor Law research - CCSS/INS/Hacienda requirements for data reporting. [VERIFIED via WebSearch]

## Metadata
**Research date:** 2026-05-13
**Valid until:** 2026-06-13
