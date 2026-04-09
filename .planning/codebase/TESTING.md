# Testing Patterns

**Analysis Date:** 2026-04-09

## Test Framework

**Runner:**
- Jest `^29.7.0` in both backend and frontend (`src/backend/package.json`, `src/frontend/package.json`).
- Backend config: `src/backend/jest.config.js` (Node environment, `ts-jest`).
- Frontend config: `src/frontend/jest.config.js` (Next.js Jest wrapper, JSDOM).

**Assertion Library:**
- Jest `expect` + `@testing-library/jest-dom` matchers (`src/frontend/jest.setup.js`, `src/frontend/src/__tests__/jest.d.ts`).

**Run Commands:**
```bash
cd src/backend && npm test              # Run backend tests
cd src/backend && npm run test:watch    # Backend watch mode
cd src/backend && npm run test:coverage # Backend coverage report

cd src/frontend && npm test             # Run frontend tests
```

## Test File Organization

**Location:**
- Use separate `__tests__` directories instead of co-located tests:
  - Backend: `src/backend/src/__tests__/unit/`, `src/backend/src/__tests__/integration/`, `src/backend/src/__tests__/setup/`
  - Frontend: `src/frontend/src/__tests__/components/`, `src/frontend/src/__tests__/hooks/`, `src/frontend/src/__tests__/pages/`, `src/frontend/src/__tests__/services/`

**Naming:**
- Use `*.test.ts` and `*.test.tsx` (for example `src/backend/src/__tests__/unit/services/EmployeeService.test.ts`, `src/frontend/src/__tests__/pages/clock-logs/page.test.tsx`).

**Structure:**
```
src/backend/src/__tests__/
  setup/prisma-mock.ts
  unit/
    services/*.test.ts
    controller/*.test.ts
    utils/*.test.ts
  integration/*.integration.test.ts

src/frontend/src/__tests__/
  components/*.test.tsx
  hooks/*.test.ts
  pages/**/*.test.tsx
  services/*.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
// Pattern used in src/backend/src/__tests__/unit/services/EmployeeService.test.ts
describe('EmployeeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEmployee', () => {
    it('should create an employee with all fields', async () => {
      // arrange
      // act
      // assert
    });
  });
});
```

**Patterns:**
- Setup pattern: use `beforeEach` to reset all mocks and restub defaults (`src/backend/src/__tests__/unit/services/AuthService.test.ts`, `src/frontend/src/__tests__/hooks/useClockLogs.test.ts`).
- Teardown pattern: implicit via Jest + mock resets (`clearMocks/resetMocks/restoreMocks` enabled in `src/backend/jest.config.js`).
- Assertion pattern: prefer response-shape assertions and call contract assertions (`toHaveBeenCalledWith`, `expect.objectContaining`) as seen in `src/backend/src/__tests__/unit/controller/ClockLogsController.test.ts` and `src/frontend/src/__tests__/services/clockLogsService.test.ts`.

## Mocking

**Framework:** Jest mocks (`jest.mock`, `jest.fn`) + `jest-mock-extended` for Prisma deep mocks.

**Patterns:**
```typescript
// Backend Prisma module mocking pattern
// src/backend/src/__tests__/unit/services/EmployeeService.test.ts
jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

// Frontend service dependency mocking pattern
// src/frontend/src/__tests__/services/clockLogsService.test.ts
jest.mock('@/services/http', () => ({
  http: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), raw: jest.fn() },
}));
```

**What to Mock:**
- Mock DB/client boundaries in unit tests (Prisma client in backend service tests: `src/backend/src/__tests__/unit/services/*.test.ts`).
- Mock service dependencies when testing controllers/hooks/pages (for example `ClockLogsService` in `src/backend/src/__tests__/unit/controller/ClockLogsController.test.ts`, `useClockLogs` in `src/frontend/src/__tests__/pages/clock-logs/page.test.tsx`).
- Mock third-party auth/crypto utilities for deterministic auth tests (bcrypt and jsonwebtoken in `src/backend/src/__tests__/unit/services/AuthService.test.ts`).

**What NOT to Mock:**
- Do not mock internal pure utility logic when unit-testing the utility itself (for example `normalizeLogType` behavior verified directly in `src/backend/src/__tests__/unit/utils/clockLogNormalization.test.ts`).
- Do not mock HTTP middleware stack in integration route tests; exercise real Express app wiring with `supertest` (`src/backend/src/__tests__/integration/payroll.integration.test.ts`).

## Fixtures and Factories

**Test Data:**
```typescript
// Factory/helper pattern from src/backend/src/__tests__/unit/services/EmployeeService.test.ts
function makeEmployee(input: Partial<Employee> = {}): Employee {
  return {
    id: 1,
    name: 'Juan Carlos',
    // ...defaults
    ...input,
  };
}
```

**Location:**
- Keep shared setup helpers under `src/backend/src/__tests__/setup/` (for example `prisma-mock.ts`).
- Keep scenario-specific fixtures inside each test file as `const mock...` objects (backend and frontend test files).

## Coverage

**Requirements:** None enforced (no global thresholds detected in `src/backend/jest.config.js` or `src/frontend/jest.config.js`).

**View Coverage:**
```bash
cd src/backend && npm run test:coverage
```

## Test Types

**Unit Tests:**
- Primary testing style for backend services/controllers and frontend services/hooks/components.
- Backend unit examples:
  - `src/backend/src/__tests__/unit/services/EmployeeService.test.ts`
  - `src/backend/src/__tests__/unit/controller/ClockLogsController.test.ts`
- Frontend unit examples:
  - `src/frontend/src/__tests__/services/clockLogsService.test.ts`
  - `src/frontend/src/__tests__/components/ClockLogStatusBadge.test.tsx`

**Integration Tests:**
- Use `supertest` against actual Express app import (`src/backend/src/__tests__/integration/payroll.integration.test.ts`).
- Current focus is route/auth behavior and HTTP response contract.

**E2E Tests:**
- Not used (no Playwright/Cypress config detected).

## Common Patterns

**Async Testing:**
```typescript
// Backend async rejection assertion
// src/backend/src/__tests__/unit/services/EmployeeService.test.ts
await expect(EmployeeService.createEmployee(input)).rejects.toThrow('DB error');

// Frontend async UI assertion
// src/frontend/src/__tests__/components/ClockLogDetailModal.test.tsx
await waitFor(() => {
  expect(mockedClockLogsService.updateClockLogStatus).toHaveBeenCalledWith(
    mockLog.id,
    'corrected',
    'Valid justification text'
  );
});
```

**Error Testing:**
```typescript
// HTTP/controller error contract checks
// src/backend/src/__tests__/unit/controller/ClockLogsController.test.ts
await controller.getStats(req, res);
expect(res.status).toHaveBeenCalledWith(400);
expect(res.json).toHaveBeenCalledWith(
  expect.objectContaining({ error: expect.any(String) })
);
```

---

*Testing analysis: 2026-04-09*
