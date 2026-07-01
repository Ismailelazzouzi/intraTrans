-- CreateEnum
CREATE TYPE "AdminAction" AS ENUM ('PROVIDER_APPROVED', 'PROVIDER_REJECTED', 'USER_PROMOTED_TO_ADMIN', 'USER_DELETED');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" "AdminAction" NOT NULL,
    "performedBy" TEXT NOT NULL,
    "targetId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
