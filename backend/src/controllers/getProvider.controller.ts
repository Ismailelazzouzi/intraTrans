import prisma  from "../config/database";
import { Request, Response } from "express";

export const getProvider = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const Provider = await prisma.provider.findUnique({
        where: {
            userId: userId,
        },
    },);
    if (!Provider)
        return res.status(400).json({error: "this user isnt a provider"});
    return (res.status(201).json({
        data: {Provider},
    }));
}
