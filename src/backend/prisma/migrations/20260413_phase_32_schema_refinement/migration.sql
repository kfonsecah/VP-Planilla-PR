-- Phase 32: Schema Refinement — Adjustment Layer and Payroll State Machine
-- Migration: 20260413_phase_32_schema_refinement

-- Step 1: Add new enum types
CREATE TYPE "ClockLogAdjustmentType" AS ENUM ('ADD', 'EDIT', 'VOID');
CREATE TYPE "ClockLogAdjustmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "PayrollStatus" AS ENUM ('BORRADOR', 'APROBADA', 'PAGADA');

-- Step 2: Add 'device' value to existing ClockLogSource enum
ALTER TYPE "ClockLogSource" ADD VALUE 'device';

-- Step 3: Map existing payrolls_status values to new enum values before type conversion
-- CALCULADO -> BORRADOR (calculated but not yet approved)
-- PAGADO    -> PAGADA   (paid)
UPDATE "vpg_payrolls" SET "payrolls_status" = 'BORRADOR' WHERE "payrolls_status" = 'CALCULADO';
UPDATE "vpg_payrolls" SET "payrolls_status" = 'PAGADA'   WHERE "payrolls_status" = 'PAGADO';

-- Step 4: Alter payrolls_status column from VarChar to PayrollStatus enum
ALTER TABLE "vpg_payrolls"
  ALTER COLUMN "payrolls_status" TYPE "PayrollStatus"
  USING "payrolls_status"::"PayrollStatus";

-- Step 5: Add new approval and audit fields to vpg_payrolls
ALTER TABLE "vpg_payrolls"
  ADD COLUMN "payrolls_approved_by"   INTEGER,
  ADD COLUMN "payrolls_approved_at"   TIMESTAMP(6),
  ADD COLUMN "payrolls_notes"         TEXT,
  ADD COLUMN "payrolls_reopened_at"   TIMESTAMP(6),
  ADD COLUMN "payrolls_reopen_reason" TEXT;

-- Step 6: Add FK constraint for payrolls_approved_by -> vpg_users
ALTER TABLE "vpg_payrolls"
  ADD CONSTRAINT "fk_vpg_payrolls_users_approved_by_30"
  FOREIGN KEY ("payrolls_approved_by")
  REFERENCES "vpg_users"("user_id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Step 7: Create vpg_clock_log_adjustments table
CREATE TABLE "vpg_clock_log_adjustments" (
  "adjustment_id"                 SERIAL PRIMARY KEY,
  "adjustment_clock_log_id"       INTEGER,
  "adjustment_employee_id"        INTEGER NOT NULL,
  "adjustment_type"               "ClockLogAdjustmentType" NOT NULL,
  "adjustment_original_timestamp" TIMESTAMP(6),
  "adjustment_new_timestamp"      TIMESTAMP(6),
  "adjustment_log_type"           "ClockLogType" NOT NULL,
  "adjustment_justification"      TEXT NOT NULL,
  "adjustment_status"             "ClockLogAdjustmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "adjustment_created_by"         INTEGER NOT NULL,
  "adjustment_created_at"         TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "adjustment_version"            INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "fk_vpg_clock_log_adjustments_clock_logs_27"
    FOREIGN KEY ("adjustment_clock_log_id")
    REFERENCES "vpg_clock_logs"("clock_logs_id")
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "fk_vpg_clock_log_adjustments_employees_28"
    FOREIGN KEY ("adjustment_employee_id")
    REFERENCES "vpg_employees"("employee_id")
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "fk_vpg_clock_log_adjustments_users_29"
    FOREIGN KEY ("adjustment_created_by")
    REFERENCES "vpg_users"("user_id")
    ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE INDEX "idx_vpg_clock_log_adjustments_log_status"
  ON "vpg_clock_log_adjustments"("adjustment_clock_log_id", "adjustment_status");

CREATE INDEX "idx_vpg_clock_log_adjustments_employee_id"
  ON "vpg_clock_log_adjustments"("adjustment_employee_id");

-- Step 8: Create vpg_payroll_recalculations table
CREATE TABLE "vpg_payroll_recalculations" (
  "recalc_id"            SERIAL PRIMARY KEY,
  "recalc_payroll_id"    INTEGER NOT NULL,
  "recalc_reason"        TEXT NOT NULL,
  "recalc_timestamp"     TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  "recalc_created_by"    INTEGER NOT NULL,
  "recalc_data_snapshot" JSONB NOT NULL,
  CONSTRAINT "fk_vpg_payroll_recalculations_payrolls_31"
    FOREIGN KEY ("recalc_payroll_id")
    REFERENCES "vpg_payrolls"("payrolls_id")
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT "fk_vpg_payroll_recalculations_users_32"
    FOREIGN KEY ("recalc_created_by")
    REFERENCES "vpg_users"("user_id")
    ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE INDEX "idx_vpg_payroll_recalculations_payroll_id"
  ON "vpg_payroll_recalculations"("recalc_payroll_id");
