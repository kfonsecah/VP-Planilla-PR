-- Capture schema drift from db push operations (never applied via migrate).
-- This migration is registered as already-applied (prisma migrate resolve --applied)
-- because all three changes already exist in the live database.

-- 1. vpg_password_change_request (added via db push, missing from migration history)
CREATE TABLE "vpg_password_change_request" (
  "pcr_id"      SERIAL PRIMARY KEY,
  "pcr_user_id" INTEGER NOT NULL,
  "pcr_code"    VARCHAR(255) NOT NULL,
  "pcr_expires" TIMESTAMP(6) NOT NULL,
  "pcr_used"    BOOLEAN NOT NULL DEFAULT false,
  "pcr_created" TIMESTAMP(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_password_change_request_user_id" ON "vpg_password_change_request"("pcr_user_id");
CREATE INDEX "idx_password_change_request_expires"  ON "vpg_password_change_request"("pcr_expires");

-- 2. vpg_clock_logs unique constraint (added via db push, missing from migration history)
CREATE UNIQUE INDEX "uq_vpg_clock_logs_emp_ts_type"
  ON "vpg_clock_logs"("clock_logs_employee_id", "clock_logs_timestamp", "clock_logs_log_type");

-- 3. vacations_total_days as GENERATED ALWAYS AS stored column (added via db push)
--    Must drop and re-add because PostgreSQL cannot ALTER a plain column to GENERATED.
ALTER TABLE "vpg_vacations" DROP COLUMN "vacations_total_days";
ALTER TABLE "vpg_vacations"
  ADD COLUMN "vacations_total_days" INTEGER
  GENERATED ALWAYS AS ((vacations_end_date - vacations_start_date) + 1) STORED;
