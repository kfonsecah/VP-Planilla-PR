-- CreateEnum: ClockLogSource (needed by vpg_clock_import_sessions; guard handles duplicate if enum migration already ran)
DO $$ BEGIN
  CREATE TYPE "ClockLogSource" AS ENUM ('java_import', 'excel_import', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable: vpg_clock_import_sessions
CREATE TABLE "vpg_clock_import_sessions" (
    "import_sessions_id" SERIAL NOT NULL,
    "import_sessions_started_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "import_sessions_completed_at" TIMESTAMP(6),
    "import_sessions_source" "ClockLogSource" NOT NULL,
    "import_sessions_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "import_sessions_total_records" INTEGER NOT NULL DEFAULT 0,
    "import_sessions_created_count" INTEGER NOT NULL DEFAULT 0,
    "import_sessions_skipped_count" INTEGER NOT NULL DEFAULT 0,
    "import_sessions_anomaly_count" INTEGER NOT NULL DEFAULT 0,
    "import_sessions_created_by" INTEGER NOT NULL,

    CONSTRAINT "vpg_clock_import_sessions_pkey" PRIMARY KEY ("import_sessions_id")
);

-- CreateIndex
CREATE INDEX "idx_vpg_clock_import_sessions_started_at" ON "vpg_clock_import_sessions"("import_sessions_started_at");

-- CreateIndex
CREATE INDEX "idx_vpg_clock_import_sessions_status" ON "vpg_clock_import_sessions"("import_sessions_status");

-- CreateIndex
CREATE INDEX "idx_vpg_clock_import_sessions_source" ON "vpg_clock_import_sessions"("import_sessions_source");

-- CreateIndex
CREATE INDEX "idx_vpg_clock_import_sessions_created_by" ON "vpg_clock_import_sessions"("import_sessions_created_by");

-- AddForeignKey: vpg_clock_import_sessions -> vpg_users
ALTER TABLE "vpg_clock_import_sessions" ADD CONSTRAINT "fk_vpg_clock_import_sessions_users_25" FOREIGN KEY ("import_sessions_created_by") REFERENCES "vpg_users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AlterTable: Add import_session_id FK to vpg_clock_logs
ALTER TABLE "vpg_clock_logs" ADD COLUMN "clock_logs_import_session_id" INTEGER;

-- CreateIndex
CREATE INDEX "idx_vpg_clock_logs_import_session_id" ON "vpg_clock_logs"("clock_logs_import_session_id");

-- AddForeignKey: vpg_clock_logs -> vpg_clock_import_sessions
ALTER TABLE "vpg_clock_logs" ADD CONSTRAINT "fk_vpg_clock_logs_import_sessions_26" FOREIGN KEY ("clock_logs_import_session_id") REFERENCES "vpg_clock_import_sessions"("import_sessions_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey: vpg_clock_logs version increment index (already exists)
