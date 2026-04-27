-- CreateEnum
CREATE TYPE "MinuteRoundingPolicy" AS ENUM ('EXACT', 'ALWAYS_UP', 'NEAREST_QUARTER');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('DIURNA', 'MIXTA', 'NOCTURNA');

-- AlterTable
ALTER TABLE "vpg_enterprise" ADD COLUMN     "enterprise_is_commercial_activity" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enterprise_minute_rounding_policy" "MinuteRoundingPolicy" NOT NULL DEFAULT 'EXACT',
ADD COLUMN     "enterprise_ordinary_shift_type" "ShiftType" NOT NULL DEFAULT 'DIURNA',
ADD COLUMN     "enterprise_rounding_policy_acknowledged" BOOLEAN NOT NULL DEFAULT false;
