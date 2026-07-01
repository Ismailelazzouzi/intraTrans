import prisma from "../config/database";
import { AdminAction } from "@prisma/client";

export const audit = async(action: AdminAction, performedBy: string, targetId: string) => {
    await prisma.auditLog.create({
        data: {
            action,
            performedBy,
            targetId
        },
    });
}
