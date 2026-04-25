-- Capture schema drift from Phase 46 db push operations.
-- This migration is registered as already-applied (prisma migrate resolve --applied)
-- because all three tables already exist in the live database.

-- 1. vpg_company_holidays (added via db push during Phase 46)
CREATE TABLE "vpg_company_holidays" (
  "company_holidays_id"           SERIAL PRIMARY KEY,
  "company_holidays_name"         VARCHAR(100) NOT NULL,
  "company_holidays_date"         DATE NOT NULL,
  "company_holidays_is_mandatory" BOOLEAN NOT NULL DEFAULT false,
  "company_holidays_is_triple"    BOOLEAN NOT NULL DEFAULT false,
  "company_holidays_status"       VARCHAR(20) NOT NULL DEFAULT 'active',
  "company_holidays_version"      INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX "idx_vpg_company_holidays_date" ON "vpg_company_holidays"("company_holidays_date");

-- 2. vpg_time_windows (added via db push during Phase 46)
CREATE TABLE "vpg_time_windows" (
  "time_window_id"         SERIAL PRIMARY KEY,
  "company_id"             INTEGER NOT NULL,
  "time_window_name"       TEXT NOT NULL,
  "time_window_type"       TEXT NOT NULL,
  "time_window_start_hour" TEXT NOT NULL,
  "time_window_end_hour"   TEXT NOT NULL,
  "time_window_active"     BOOLEAN NOT NULL DEFAULT true,
  "created_at"             TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updated_at"             TIMESTAMP(3) NOT NULL
);

-- 3. vpg_day_confirmations (added via db push during Phase 46)
CREATE TABLE "vpg_day_confirmations" (
  "confirmation_id"    SERIAL PRIMARY KEY,
  "employee_id"        INTEGER NOT NULL,
  "confirmation_date"  DATE NOT NULL,
  "confirmed_by"       INTEGER NOT NULL,
  "confirmation_notes" TEXT,
  "created_at"         TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "vpg_day_confirmations_employee_id_confirmation_date_key"
  ON "vpg_day_confirmations"("employee_id", "confirmation_date");
