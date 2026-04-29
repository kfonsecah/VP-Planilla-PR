-- AlterTable
ALTER TABLE "vpg_notifications" ADD COLUMN     "notifications_acknowledged_at" TIMESTAMP(6),
ADD COLUMN     "notifications_acknowledged_by" INTEGER,
ADD COLUMN     "notifications_metadata" JSONB,
ADD COLUMN     "notifications_requires_acknowledgment" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "vpg_notifications" ADD CONSTRAINT "vpg_notifications_notifications_acknowledged_by_fkey" FOREIGN KEY ("notifications_acknowledged_by") REFERENCES "vpg_users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;
