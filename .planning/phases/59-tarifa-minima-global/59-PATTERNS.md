# Phase 59: Tarifa Mínima Global (Opcional) - Pattern Map

**Mapped:** 2026-04-26
**Files analyzed:** 3
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/backend/prisma/seed.ts` | migration/seed | DB insertion | `src/backend/prisma/seed.ts` | exact |
| `src/backend/src/service/LegalParamService.ts` | service | database read | `src/backend/src/service/LegalParamService.ts` | exact |
| `src/backend/src/__tests__/unit/services/LegalParamService.test.ts` | test | test assertions | `src/backend/src/__tests__/unit/services/LegalParamService.test.ts` | exact |

## Pattern Assignments

### `src/backend/prisma/seed.ts` (migration/seed, DB insertion)

**Analog:** `src/backend/prisma/seed.ts`

**Seeding pattern** (lines 8-22):
```typescript
// validFrom dates: use real decree date for CCSS; today as baseline for others
const TODAY = new Date('2026-01-01T00:00:00.000Z');

const legalParams = [
  {
    key: 'WORKDAY_DIURNA_DAILY',
    value: 8,
    description: 'Horas diarias jornada diurna ordinaria',
    category: 'WORKDAY',
    validFrom: TODAY,
    isCritical: false,
    source_decree: 'Art. 136 CT',
  },
// ...
```

**Upsert loop pattern** (lines 142-159):
```typescript
  for (const param of legalParams) {
    await prisma.vpgLegalParam.upsert({
      where: {
        id: `seed-${param.key}`,
      },
      update: {},
      create: {
        id: `seed-${param.key}`,
        key: param.key,
        value: param.value,
        description: param.description,
        category: param.category,
        validFrom: param.validFrom,
        validUntil: null,
        isActive: true,
        isCritical: param.isCritical,
        source_decree: param.source_decree ?? null,
        createdBy: SYSTEM_USER,
        updatedBy: null,
      },
    });
  }
```

---

### `src/backend/src/service/LegalParamService.ts` (service, database read)

**Analog:** `src/backend/src/service/LegalParamService.ts`

**Imports pattern** (lines 1-6):
```typescript
import { MinuteRoundingPolicy } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';
import { CreateLegalParamDto, VpgLegalParam } from '../model/VpgLegalParam';
import { LegalParamSet } from '../types/payroll.types';

export class LegalParamService {
```

**Core retrieval pattern** (lines 48-60):
```typescript
  /**
   * Get the full VpgLegalParam record in effect at a given date.
   * Uses effective-date rule: most recent record where validFrom <= date and isActive = true.
   * @param key - Parameter key
   * @param date - Target date
   * @returns The VpgLegalParam record, or null if not found
   * @throws Error if the Prisma query fails
   */
  static async getParamAtDate(key: string, date: Date): Promise<VpgLegalParam | null> {
    const param = await prisma.vpgLegalParam.findFirst({
      where: {
        key,
        validFrom: { lte: date },
        isActive: true,
      },
      orderBy: { validFrom: 'desc' },
    });
    return param ?? null;
  }
```

---

### `src/backend/src/__tests__/unit/services/LegalParamService.test.ts` (test, test assertions)

**Analog:** `src/backend/src/__tests__/unit/services/LegalParamService.test.ts`

**Imports & Setup pattern** (lines 1-13):
```typescript
import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { Decimal } from '@prisma/client/runtime/library';
import { LegalParamService } from '../../../service/LegalParamService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');
```

**Mock object factory pattern** (lines 14-29):
```typescript
const makeParam = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'cuid-1',
  key: 'OT_FACTOR',
  value: new Decimal('1.5'),
  description: 'OT multiplier',
  category: 'OVERTIME',
  validFrom: new Date('2026-01-01'),
  validUntil: null,
  isActive: true,
  isCritical: true,
  source_decree: 'Art. 139 CT',
  createdBy: 'system',
  updatedBy: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});
```

**Service method test pattern** (lines 60-70):
```typescript
  describe('getParam', () => {
    it('returns the Decimal value when param exists', async () => {
      const param = makeParam({ value: new Decimal('1.5') });
      prisma.vpgLegalParam.findFirst.mockResolvedValue(param as any);

      const result = await LegalParamService.getParam('OT_FACTOR', new Date());

      expect(result?.toString()).toBe('1.5');
    });
```

## Shared Patterns

### Date-Effective Parameter Access
**Source:** `src/backend/src/service/LegalParamService.ts`
**Apply to:** `getGlobalMinWageRate` implementation
```typescript
static async getParamAtDate(key: string, date: Date): Promise<VpgLegalParam | null> {
  // Finds most recent parameter where validFrom <= targetDate
  return await prisma.vpgLegalParam.findFirst({ ... });
}
```

## No Analog Found

None.

## Metadata

**Analog search scope:** `**/LegalParamService.{ts,js}`, `**/seed.{ts,js}`, `**/LegalParamService.test.{ts,js}`
**Files scanned:** 3
**Pattern extraction date:** 2026-04-26
