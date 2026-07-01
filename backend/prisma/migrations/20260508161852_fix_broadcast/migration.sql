/*
  Warnings:

  - The primary key for the `audit_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `targetId` column on the `audit_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[broadcast_id]` on the table `projects` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `id` on the `audit_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `performedBy` on the `audit_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BroadcastType" AS ENUM ('NORMAL', 'GROUP');

-- AlterTable
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "performedBy",
ADD COLUMN     "performedBy" UUID NOT NULL,
DROP COLUMN "targetId",
ADD COLUMN     "targetId" UUID,
ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "broadcast_responses" ADD COLUMN     "task" VARCHAR(255);

-- AlterTable
ALTER TABLE "broadcasts" ADD COLUMN     "max_providers" INTEGER,
ADD COLUMN     "type" "BroadcastType" NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "broadcast_id" UUID;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "type" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "projects_broadcast_id_key" ON "projects"("broadcast_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_broadcast_id_fkey" FOREIGN KEY ("broadcast_id") REFERENCES "broadcasts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
