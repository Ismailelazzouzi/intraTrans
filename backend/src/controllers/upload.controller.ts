import { Request, Response } from "express";
import prisma from "../config/database";
import path from "path"
import { UserType } from "@prisma/client";

export const getUploadFile = async (req: Request, res: Response) => {
    const fileName = path.basename(req.params.filename as string);
    const filePath = path.join(__dirname, "../../uploads", fileName);
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        }
    });
    if (user?.type === UserType.ADMIN || user?.type === UserType.ROOT)
        return (res.sendFile(filePath));
    const isProfilePicture = await prisma.user.findFirst({
        where: {
            imageUrl: fileName
        }
    });
    if (isProfilePicture)
        return (res.sendFile(filePath));
    const provider = await prisma.provider.findFirst({
        where: {
            userId,
            OR: [
                {idVerificationImg: fileName},
                {license: fileName}
            ]
        }
    });
    if (provider)
        return (res.sendFile(filePath));
    return (res.status(404).send("File not found"));
}

