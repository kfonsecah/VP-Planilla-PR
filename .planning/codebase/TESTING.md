# Testing Patterns

**Analysis Date:** 2026-05-09

## Test Framework

**Runner:**
- **Backend:** Jest ^29.7.0
- **Frontend:** Jest ^29.7.0 (configured with Next.js)

**Assertion Library:**
- Jest (expect)

**Run Commands:**
```bash
# Backend
cd src/backend && npm test             # Run all tests
cd src/backend && npm run test:watch   # Watch mode
cd src/backend && npm run test:coverage # Coverage report

# Frontend
cd src/frontend && npm test            # Run all tests
```

## Test File Organization

**Location:**
- **Backend Unit Tests:** `src/backend/src/__tests__/unit/` (often mirroring `src/` structure).
- **Backend Integration Tests:** `src/backend/src/__tests__/integration/`.
- **Frontend Tests:** `src/frontend/src/__tests__/` (hooks, services, and components).

**Naming:**
- `*.test.ts` or `*.test.tsx` (e.g., `NomineeService.test.ts`).

## Test Structure

**Suite Organization:**
```typescript
import { NomineeService } from '../../service/NomineeService';

const service = new NomineeService();

describe('NomineeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate payroll correctly', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

**Patterns:**
- **Setup pattern:** `beforeEach` to reset mocks and establish common mock return values.
- **Teardown pattern:** `jest.clearAllMocks()` or `jest.resetAllMocks()`.
- **Assertion pattern:** `expect(result).toBe(...)`, `expect(mock).toHaveBeenCalledWith(...)`.

## Mocking

**Framework:**
- `jest` (built-in)
- `jest-mock-extended` (especially for Prisma deep mocking)

**Patterns:**
```typescript
import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';

jest.mock('../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../lib/prisma');
```

**What to Mock:**
- Database calls (via `prisma` mock).
- External service dependencies (e.g., `EmployeeService` when testing `NomineeService`).
- Timers or dates when testing time-sensitive logic.

**What NOT to Mock:**
- Pure utility functions (e.g., `payrollUtils.ts`).
- Data Transformation Objects (DTOs).

## Fixtures and Factories

**Test Data:**
Standard objects defined within the test file or setup in `beforeEach`.
```typescript
const startDate = new Date('2026-02-01T00:00:00Z');
const employees = [{ id: 1, name: 'Employee 1', ... }];
```

**Location:**
Currently co-located within test files or in `__tests__/fixtures` if shared (though many tests define their own).

## Coverage

**Requirements:**
- Coverage is monitored via `npm run test:coverage`.
- No strict global enforcement threshold found, but critical logic (like `payrollUtils.ts` and `NomineeService.ts`) has extensive coverage.

**View Coverage:**
```bash
cd src/backend && npm run test:coverage
```

## Test Types

**Unit Tests:**
- Focus on isolated service logic.
- Extensive mocking of all I/O and dependencies.
- Referenced by Phase/Requirement IDs (e.g., `NomineeService.Phase54.test.ts`).

**Integration Tests:**
- Test lifecycle flows (e.g., `auth.lifecycle.test.ts`, `payroll.integration.test.ts`).
- Test multiple layers working together.

**E2E Tests:**
- Playwright infrastructure detected (`.playwright-cli` folder) but not extensively used in the main `src/` tree tests.

## Common Patterns

**Async Testing:**
- Standard `async/await` in test blocks.
- `expect(promise).resolves` or `await expect(promise).rejects.toThrow()`.

**Error Testing:**
```typescript
it('should throw error if params are missing', async () => {
  await expect(service.getClockLogs(req as any, res as any))
    .rejects.toThrow('initDate and endDate are required');
});
```

## Special Cases: Java Utility

**Status:**
- Documentation (`GEMINI.md`) mentions a Java clock-log parser in `src/Java/` as a standalone utility.
- Currently, no `.java` files were found in the `src/` or root directory.
- Test suite is currently 100% TypeScript/Jest.

---

*Testing analysis: 2026-05-09*
