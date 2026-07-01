/*
  Warnings:

  - You are about to alter the column `license` on the `providers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(500)` to `VarChar(100)`.

*/
-- AlterTable
ALTER TABLE "providers" ALTER COLUMN "license" SET DATA TYPE VARCHAR(100);
