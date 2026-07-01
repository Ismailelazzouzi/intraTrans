import { Request, Response, NextFunction } from "express";
import { UserType } from "@prisma/client";

export const rootOnly = async (req: Request, res: Response, next: NextFunction) => {
    if (req.user!.type != UserType.ROOT)
        return (res.status(403).json({message: "root admin only"}));
    next();
}


export const adminOnly = async (req: Request, res: Response, next: NextFunction) => {
    if (req.user!.type != UserType.ADMIN && req.user!.type != UserType.ROOT)
        return (res.status(403).json({message: "admins only"}));
    next();
}
