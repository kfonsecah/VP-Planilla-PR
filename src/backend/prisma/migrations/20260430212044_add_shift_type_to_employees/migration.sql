-- CreateEnum
CREATE TYPE "EmployeeShiftType" AS ENUM ('USE_ENTERPRISE_DEFAULT', 'DIURNA', 'MIXTA', 'NOCTURNA');

-- AlterTable
ALTER TABLE "vpg_employees" ADD COLUMN     "employee_shift_type" "EmployeeShiftType" NOT NULL DEFAULT 'USE_ENTERPRISE_DEFAULT';
