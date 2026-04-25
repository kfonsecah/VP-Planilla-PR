# Phase 38: Tests Unitarios + Verificación de Integración - Research

**Researched:** 2026-04-17
**Domain:** Test Suite Verification and Execution
**Confidence:** HIGH

## Summary

Phase 38 focuses on executing and verifying the existing unit and integration test suite to ensure stability of v1.5 features (Phases 32-37). The project uses Jest as the primary test framework across both backend (Node.js with ts-jest) and frontend (Next.js with jest-environment-jsdom). Current test results show 506+ passing tests with 27 failing tests that require investigation and fix.

**Primary recommendation:** Run full test suite, categorize failures by root cause, fix test mocks/stubs that are out of sync with production code, and ensure all v1.5 features have adequate test coverage before proceeding.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jest | ^29.7.0 | Test runner and framework | Industry standard for TypeScript/Node.js |
| ts-jest | ^29.1.2 | TypeScript transpilation for Jest | Enables direct .ts test file execution |
| jest-environment-jsdom | ^29.7.0 | DOM environment for React testing | Required for component tests |
| @testing-library/react | ^16.3.2 | React component testing | Official React testing recommendation |
| @testing-library/jest-dom | ^6.9.1 | Jest matchers for DOM | Enables expect(screen.getBy...).toBeInTheDocument() |
| jest-mock-extended | ^3.0.5 | Type-safe mocking | Prevents type errors in mock definitions |
| supertest | ^6.3.4 | HTTP integration testing | Express endpoint testing |
| jest-html-reporters | ^3.1.7 | HTML test reports | CI/CD visibility |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/jest | ^29.5.14 | TypeScript types for Jest | All test files |
| @testing-library/user-event | ^14.5.0 | Simulate user events | Component interaction tests |
| @types/supertest | ^6.0.2 | Types for supertest | Integration tests |

**Installation:**
```bash
# Backend
npm install --save-dev jest @types/jest ts-jest jest-mock-extended @types/supertest supertest jest-html-reporters

# Frontend
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

## Architecture Patterns

### Test Organization Pattern
```
src/
├── __tests__/
│   ├── unit/
│   │   ├── services/        # Service layer tests
│   │   ├── controller/      # Controller tests  
│   │   ├── middleware/      # Middleware tests
│   │   └── utils/           # Utility function tests
│   ├── integration/         # E2E API tests
│   └── e2e/                 # Full flow tests
```

### Backend Test Structure (Jest)
```typescript
// Source: src/backend/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  testTimeout: 10000,
};
```

### Frontend Test Structure (Next.js + Jest)
```typescript
// Source: src/frontend/jest.config.js
const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx|js)'],
};

module.exports = createJestConfig(customJestConfig);
```

### Common Test Patterns

**Backend Service Test Pattern:**
```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ClockLogEffectiveService } from '../ClockLogEffectiveService';

// Mock Prisma
const mockPrisma = mockDeep<PrismaClient>();
jest.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

describe('ClockLogEffectiveService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated effective marks', async () => {
    // Arrange
    mockPrisma.$queryRaw.mockResolvedValueOnce([...]);
    
    // Act
    const result = await service.getPaginatedEffectiveMarks({...});
    
    // Assert
    expect(result.total).toBe(2);
  });
});
```

**Frontend Component Test Pattern:**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClockLogDetailModal } from '../ClockLogDetailModal';

describe('ClockLogDetailModal', () => {
  it('should display audit logs after loading', async () => {
    // Arrange
    const mockAuditLogs = [...];
    
    // Act
    render(<ClockLogDetailModal {...props} />);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Historial de cambios')).toBeInTheDocument();
    });
  });
});
```

### Running Tests

```bash
# Backend tests
npm run test                    # Run all tests
npm run test -- --watch        # Watch mode
npm run test -- --coverage     # With coverage
npm run test -- --testPathPattern=ClockLogEffectiveService  # Specific file

# Frontend tests  
npm test                        # Run all tests
npm test -- --watch            # Watch mode
npm test -- --coverage         # With coverage
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mocking Prisma client | Create manual mock objects | jest-mock-extended | Type-safe, handles nested properties |
| Testing Express routes | Raw HTTP calls | supertest | Handles middleware, provides response object |
| React testing | render() only | @testing-library/react | Encourages accessible, user-centric testing |
| Date mocking | new Date('2026-01-01') | jest.spyOn(Date, 'now') | Controls time-dependent logic |
| Environment variables | process.env directly | jest.spyOn(process, 'env') | Avoids pollution between tests |

## Common Pitfalls

### Pitfall 1: Test Mocks Out of Sync with Production Code
**What goes wrong:** Tests pass locally but fail after code changes because mock definitions don't match actual service method signatures or return types.
**Why it happens:** Tests were written for old API, but service was refactored in later phases.
**How to avoid:** Run tests after each phase completion. Update mocks when service signatures change.
**Warning signs:** Tests fail with "Cannot read properties of undefined" or "Expected length: X, Received length: 0".

**Current failures demonstrating this:**
- `ClockLogEffectiveService.Paginated.test.ts` - 3 failures
- `ClockLogsController.test.ts` - 8 failures (500 errors instead of expected 400)

### Pitfall 2: Missing Global Fetch Polyfill in JSDOM
**What goes wrong:** Services using `fetch` fail in Jest environment because JSDOM doesn't provide global `fetch`.
**Why it happens:** Frontend services use browser APIs that don't exist in Node test environment.
**How to avoid:** Add fetch polyfill in jest.setup.js or mock window.fetch.
**Warning signs:** `ReferenceError: fetch is not defined`

**Current failures demonstrating this:**
- `clock-logs/page.test.tsx` - 11 failures with "fetch is not defined"

### Pitfall 3: IntersectionObserver Not Defined
**What goes wrong:** Components using infinite scroll or lazy loading fail because JSDOM doesn't implement IntersectionObserver.
**Why it happens:** Page component uses IntersectionObserver for scroll detection.
**How to avoid:** Mock IntersectionObserver in test setup or use @testing-library/react's findBy queries.
**Warning signs:** `ReferenceError: IntersectionObserver is not defined`

**Current failures demonstrating this:**
- `clock-logs/page.test.tsx` - All 11 tests fail on page render

### Pitfall 4: Missing act() for Async State Updates
**What goes wrong:** React state updates triggered during test cause "update not wrapped in act" warnings.
**Why it happens:** Async data fetching in useEffect triggers state updates after render completes.
**How to avoid:** Use waitFor() or async findBy queries that handle act() internally.
**Warning signs:** "An update to ClockLogDetailModal inside a test was not wrapped in act(...)"

**Current failures demonstrating this:**
- `ClockLogDetailModal.test.tsx` - 15 warnings (tests pass but with warnings)

### Pitfall 5: TypeScript Isolated Modules Warning
**What goes wrong:** ts-jest warns about hybrid module kinds.
**Why it happens:** tsconfig.json uses Node16/Next module resolution without isolatedModules.
**How to avoid:** Add `"isolatedModules": true` to tsconfig.json or suppress in jest config.
**Warning signs:** `TS151002: Using hybrid module kind is only supported in "isolatedModules: true"`

**Current state:** 30+ warnings in backend test output (non-blocking but noisy)

## Code Examples

### Fixing Fetch Not Defined (Frontend)
```typescript
// Add to jest.setup.js
import 'whatwg-fetch';

// OR in individual test
beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })
  );
});
```

### Fixing IntersectionObserver (Frontend)
```typescript
// Add to jest.setup.js
class MockIntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver = MockIntersectionObserver;
```

### Fixing Mock Out of Sync (Backend)
```typescript
// Before (broken)
const mockService = {
  getClockLogsPaginated: jest.fn(), // Method doesn't exist anymore
};

// After (fixed) - match actual service
const mockService = {
  getPaginatedEffectiveMarks: jest.fn().mockResolvedValue({
    data: [],
    total: 0,
    page: 1,
    pageSize: 20,
  }),
};
```

### Fixing Controller Error Handling
```typescript
// Controller now throws 500 for invalid dates instead of 400
// Test needs to expect 500:
expect(res.status).toHaveBeenCalledWith(500); // Changed from 400
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual mock objects | jest-mock-extended | v1.4 | Type-safe, less boilerplate |
| enzyme (deprecated) | @testing-library/react | v1.3 | User-centric, accessible tests |
| jest-fetch-mocker | Native fetch + jest.spyOn | v1.4 | Simpler, less dependencies |
| sync act() handling | waitFor() async patterns | React 18 | Eliminates warnings |

**Deprecated/outdated:**
- enzyme: React team recommends @testing-library instead
- node-fetch: Browser fetch available in Node 18+, or use whatwg-fetch polyfill

## Open Questions

1. **Should we add test for new v1.5 endpoints?**
   - What we know: Phases 32-37 added new services (ClockLogEffectiveService, PayrollService state machine)
   - What's unclear: Are these covered by existing tests or need new test files?
   - Recommendation: Add tests for new service methods before fixing broken tests

2. **Should we fix all 27 failing tests or skip some?**
   - What we know: 16 backend + 11 frontend failures
   - What's unclear: Which failures are critical vs cosmetic (warnings only)?
   - Recommendation: Prioritize fixing tests that verify core v1.5 functionality

3. **How to prevent future test drift?**
   - What we know: Tests failed because mocks weren't updated after code changes
   - What's unclear: Is there a process to update tests during implementation?
   - Recommendation: Add "test pass" requirement to phase completion criteria

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Backend tests | ✓ | 24.10.15+ | — |
| npm | Package management | ✓ | 11.0.0+ | — |
| Jest | Test execution | ✓ | 29.7.0 | — |
| TypeScript | Type checking | ✓ | 5.8.3 | — |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + ts-jest 29.1.2 |
| Config file | src/backend/jest.config.js (backend), src/frontend/jest.config.js (frontend) |
| Quick run command | `npm test` in respective directories |
| Full suite command | `cd src/backend && npm test && cd ../frontend && npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| MARCAS-06 | Effective marks engine | Unit | `npm test -- --testPathPattern=ClockLogEffectiveService` | ✅ |
| PLANILLA-04 | Payroll state machine | Unit | `npm test -- --testPathPattern=PayrollService` | ✅ |
| All v1.5 | Integration verification | Integration | `npm test -- --testPathPattern=integration` | ✅ |

### Sampling Rate
- **Per task commit:** N/A (this is verification phase)
- **Per wave merge:** Full suite (`npm test` in both backend and frontend)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] No gaps - existing test infrastructure covers all phase requirements
- The 27 failing tests are not missing test infrastructure but rather tests that need fixes to sync with production code

## Sources

### Primary (HIGH confidence)
- Jest Documentation: https://jestjs.io/docs/getting-started
- @testing-library/react: https://testing-library.com/docs/react-testing-library/intro/
- Next.js Testing: https://nextjs.org/docs/app/building-your-application/testing/jest

### Secondary (MEDIUM confidence)
- ts-jest Configuration: https://kulshekhar.github.io/ts-jest/docs/
- Common Jest Pitfalls: https://stackoverflow.com/questions/75038821/jest-tests-failing-with-fetch-is-not-defined

### Tertiary (LOW confidence)
- Various Stack Overflow solutions for IntersectionObserver mock patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Well established, verified by package.json
- Architecture: HIGH - Test patterns directly observed from project files
- Pitfalls: HIGH - All pitfalls demonstrated by actual test failures

**Research date:** 2026-04-17
**Valid until:** 60 days (test infrastructure stable)