/*
  Warnings:

  - You are about to drop the column `isBlocked` on the `trusted_relations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "trusted_relations" DROP COLUMN "isBlocked",
ADD COLUMN     "blocked_by" UUID;
