-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ClockLogType" AS ENUM ('IN', 'OUT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ClockLogStatus" AS ENUM ('pending', 'valid', 'anomaly', 'corrected', 'orphan');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum (ClockLogSource may already exist from add_clock_import_sessions migration)
DO $$ BEGIN
  CREATE TYPE "ClockLogSource" AS ENUM ('java_import', 'excel_import', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Pre-cleanup: normalize existing log_type values BEFORE enum cast
UPDATE "vpg_clock_logs"
SET "clock_logs_log_type" = CASE
  WHEN LOWER("clock_logs_log_type") IN ('in', 'entrada', 'entry', 'start', 'check_in', 'checkin', 'almuerzo_entrada', 'lunch_in', 'break_in', 'entrada almuerzo') THEN 'IN'
  WHEN LOWER("clock_logs_log_type") IN ('out', 'salida', 'exit', 'end', 'check_out', 'checkout', 'salida final', 'fin turno', 'almuerzo', 'almuerzo_salida', 'lunch_out', 'break_out', 'salida almuerzo') THEN 'OUT'
  ELSE 'IN'
END;

-- AlterTable
ALTER TABLE "vpg_clock_logs" ALTER COLUMN "clock_logs_log_type" TYPE "ClockLogType" USING "clock_logs_log_type"::"ClockLogType";

-- AlterTable: Add status and source with defaults
ALTER TABLE "vpg_clock_logs" ADD COLUMN     "clock_logs_status" "ClockLogStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "clock_logs_source" "ClockLogSource" NOT NULL DEFAULT 'manual';

-- CreateIndex
CREATE INDEX "idx_vpg_clock_logs_status" ON "vpg_clock_logs"("clock_logs_status");

-- CreateIndex
CREATE INDEX "idx_vpg_clock_logs_source" ON "vpg_clock_logs"("clock_logs_source");

-- CreateIndex
CREATE INDEX "idx_vpg_clock_logs_status_source" ON "vpg_clock_logs"("clock_logs_status", "clock_logs_source");
