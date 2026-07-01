-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_provider_id_fkey";

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
