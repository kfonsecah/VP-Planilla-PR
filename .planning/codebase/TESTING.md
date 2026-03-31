# Testing Patterns

**Analysis Date:** 2026-03-31

## Test Framework

**Runner:**
- Jest ^29.7.0 with ts-jest preset
- Config: `src/backend/jest.config.js`
- Environment: Node.js (testEnvironment: 'node')

**Assertion Library:**
- Jest built-in expect() API

**Run Commands:**
```bash
# From src/backend/ directory
npm test              # Run all tests
npm test -- --watch  # Watch mode (inferred from jest.config.js)
npm test -- --coverage  # Coverage report
```

**Coverage:**
- No hard coverage requirements enforced
- Collected from: `src/**/*.ts` excluding `*.d.ts` and `src/index.ts`
- Reports: text, lcov, html formats to `coverage/` directory

## Test File Organization

**Location:**
- `src/backend/src/__tests__/` directory (co-located at test root, not alongside source)
- Subdirectories: `unit/` (service/utility tests), `integration/` (HTTP layer tests), `setup/` (fixtures)

**Naming:**
- `*.test.ts` suffix required by jest.config.js
- Files match tested module names: `NomineeService.test.ts` for `NomineeService.ts`, `payrollUtils.test.ts` for `payrollUtils.ts`

**Structure:**
```
src/backend/src/__tests__/
├── unit/
│   ├── NomineeService.test.ts          # Service logic tests
│   ├── payrollUtils.test.ts            # Pure utility function tests
│   └── services/
│       └── PayrollService.test.ts      # Complex service tests
├── integration/
│   └── payroll.integration.test.ts     # HTTP endpoint tests
└── setup/
    └── prisma-mock.ts                  # Mocking utilities
```

## Test Structure

**Suite Organization:**
```typescript
describe('NomineeService — REQ 8.1 Normal 8h/day', () => {
  it('should calculate 48 regular hours, 0 overtime for 6 days at 8h each', async () => {
    // Arrange
    const clockLogs = [/* test data */];
    setUpMocks(mockEmployee, clockLogs, []);

    // Act
    const result = await service.calculatePayrollForPeriod(
      new Date('2026-02-02'),
      new Date('2026-02-07')
    );

    // Assert
    expect(result.employees).toHaveLength(1);
    expect(result.employees[0].regularHours).toBe(48);
    expect(result.employees[0].overtimeHours).toBe(0);
  });
});
```

**Patterns:**
- Setup: `beforeEach()` clears mocks and sets default return values
- Teardown: No explicit teardown; Jest auto-restores via `clearMocks: true`, `resetMocks: true`, `restoreMocks: true`
- Assertion: Expectation-driven with domain-specific matchers (`.toHaveLength()`, `.toBeCloseTo()`, `.toBe()`)

## Mocking

**Framework:** `jest-mock-extended` with `mockDeep()`

**Patterns:**

Mocking Prisma:
```typescript
import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';

jest.mock('../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../lib/prisma');
```

Mocking Services:
```typescript
jest.mock('../../service/EmployeeService');
const { EmployeeService } = require('../../service/EmployeeService');

beforeEach(() => {
  jest.mocked(EmployeeService.getActiveEmployeesForPeriod).mockResolvedValue([]);
});
```

Mock Setup:
```typescript
function setUpMocks(employee: any, clockLogs: any[], deductions: any[]) {
  jest.mocked(EmployeeService.getActiveEmployeesForPeriod).mockResolvedValue([employee]);
  prisma.vpg_clock_logs.findMany.mockResolvedValue(clockLogs);
  prisma.vpg_positions.findMany.mockResolvedValue([mockPosition]);
  prisma.vpg_deductions_per_employee.findMany.mockResolvedValue(deductions);
}
```

**What to Mock:**
- Database layer (Prisma): Always mock to isolate service logic from DB
- External services: Mock dependent services to test in isolation
- Keep mocks synchronized with actual return types from database

**What NOT to Mock:**
- Pure utility functions: Test `payrollUtils.ts` functions without mocks
- Internal domain logic: Test service methods with mocked Prisma, not the service itself
- Helper functions within same module: No need to mock

## Fixtures and Factories

**Test Data:**
```typescript
const BASE_HOURLY = 1680;

const mockPosition = {
  position_id: 1,
  position_base_salary: BASE_HOURLY,
  position_name: 'Developer',
  position_description: 'Test position',
  position_version: 1,
};

const mockEmployee = {
  id: 1,
  name: 'Test Employee',
  national_id: '1-1234-5678',
  position_id: 1,
  required_hours_biweekly: null,
};

function makeClockLogPair(date: string, localInHour: number, localOutHour: number, empId = 1) {
  const UTC_OFFSET_HOURS = 6;
  const utcInHour = localInHour - UTC_OFFSET_HOURS;
  const utcOutHour = localOutHour - UTC_OFFSET_HOURS;
  const inDate = new Date(`${date}T${String(utcInHour).padStart(2, '0')}:00:00.000Z`);
  const outDate = new Date(`${date}T${String(utcOutHour).padStart(2, '0')}:00:00.000Z`);
  return [
    {
      clock_logs_id: Math.random(),
      clock_logs_employee_id: empId,
      clock_logs_timestamp: inDate,
      clock_logs_log_type: 'IN',
    },
    {
      clock_logs_id: Math.random(),
      clock_logs_employee_id: empId,
      clock_logs_timestamp: outDate,
      clock_logs_log_type: 'OUT',
    },
  ];
}
```

**Location:**
- Defined at top of test file (no separate fixtures directory)
- Constants: shared across multiple tests
- Factory functions: `makeClockLogPair()`, `setUpMocks()` for parameterized test data

## Integration Tests

**Scope:** HTTP layer, auth middleware, route wiring, response shape

**Framework:** `supertest` with Express app

**Example Pattern:**
```typescript
import request from 'supertest';
import app from '../../index';

describe('POST /api/nominee/calculate-payroll — integration', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app)
      .post('/api/nominee/calculate-payroll')
      .send({ payroll_id: 1 });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  it('returns 401 when an invalid token is provided', async () => {
    const res = await request(app)
      .post('/api/nominee/calculate-payroll')
      .set('Authorization', 'Bearer invalid-token-xyz')
      .send({ payroll_id: 1 });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });
});
```

Location: `src/backend/src/__tests__/integration/payroll.integration.test.ts`

**Coverage:** Auth middleware behavior, HTTP status codes, response shapes — NOT business logic (that's in unit tests)

## Unit Test Types

**Service Logic Tests:**
- Location: `src/backend/src/__tests__/unit/`
- Scope: Business logic, domain calculations
- Approach: Mock Prisma, test service methods in isolation
- Example: `NomineeService.test.ts` tests payroll calculation logic with mocked Prisma

**Utility Function Tests:**
- Location: `src/backend/src/__tests__/unit/`
- Scope: Pure functions, no side effects
- Approach: No mocking; test with real inputs/outputs
- Example: `payrollUtils.test.ts` tests Costa Rica holiday detection, working day counting

## Test Examples

**Domain Logic (Payroll Calculation):**
```typescript
describe('NomineeService — REQ 8.2 Overtime 1.5x', () => {
  it('should calculate 48 regular + 12 overtime hours for 6 days at 10h each', async () => {
    const clockLogs = [
      ...makeClockLogPair('2026-02-02', 8, 18),
      ...makeClockLogPair('2026-02-03', 8, 18),
      ...makeClockLogPair('2026-02-04', 8, 18),
      ...makeClockLogPair('2026-02-05', 8, 18),
      ...makeClockLogPair('2026-02-06', 8, 18),
      ...makeClockLogPair('2026-02-07', 8, 18),
    ];
    setUpMocks(mockEmployee, clockLogs, []);

    const result = await service.calculatePayrollForPeriod(
      new Date('2026-02-02'),
      new Date('2026-02-07')
    );

    expect(result.employees).toHaveLength(1);
    const ep = result.employees[0];
    expect(ep.regularHours).toBe(48);
    expect(ep.overtimeHours).toBe(12);
    expect(ep.overtimePay).toBeCloseTo(30240, 2);
  });
});
```

**Pure Utility Tests:**
```typescript
describe('payrollUtils - Costa Rica Holidays', () => {
  describe('isCRHoliday', () => {
    it('returns true for January 1 (Año Nuevo) 2026', () => {
      expect(isCRHoliday(new Date('2026-01-01'), 2026)).toBe(true);
    });

    it('returns true for May 1 (Día del Trabajo) 2026', () => {
      expect(isCRHoliday(new Date('2026-05-01'), 2026)).toBe(true);
    });

    it('returns false for regular day (May 2, 2026)', () => {
      expect(isCRHoliday(new Date('2026-05-02'), 2026)).toBe(false);
    });
  });
});
```

## Async Testing

**Pattern:**
```typescript
it('should calculate payroll for period', async () => {
  const result = await service.calculatePayrollForPeriod(
    new Date('2026-02-02'),
    new Date('2026-02-07')
  );

  expect(result.employees).toHaveLength(1);
});
```

**Approach:**
- Async test functions marked with `async` keyword
- Await promises before assertions
- Jest automatically waits for promise resolution

## Error Testing

**Pattern:**
```typescript
it('throws error when required field is missing', async () => {
  try {
    await EmployeeService.createEmployee(invalidData);
    fail('Should have thrown');
  } catch (error) {
    expect(error).toBeDefined();
  }
});
```

**Approach:**
- Use try-catch or `.rejects` matcher
- Verify error is thrown on invalid input
- No custom error types; plain Error objects

## Configuration

**jest.config.js settings:**
```javascript
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
}
```

**Key Points:**
- `clearMocks: true` — auto-clear before each test
- `resetMocks: true` — reset mock implementations
- `restoreMocks: true` — restore original functions
- `testTimeout: 10000` — 10 second timeout per test

## Frontend Testing

**Status:** No frontend tests detected. Frontend uses React 19, Next.js 15, react-hook-form, but no Jest/Vitest configuration found in `src/frontend/`.

**Observed patterns in code structure ready for testing:**
- Hooks: `useEmployeeList.ts` contains async data fetching and state logic — good candidate for testing
- Services: `employeeService.ts`, `http.ts` with mocked dependencies — testable pattern
- Components: Props-based, FSC pattern — testable with React Testing Library

---

*Testing analysis: 2026-03-31*
