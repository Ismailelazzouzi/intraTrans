import { pending_review } from "../utils/zod_shema"
import { Request, Response, NextFunction } from "express"

export const rev_middleware = (req: Request, res: Response, next: NextFunction) => {
    try
    {
        req.body = pending_review.parse(req.body);
        next();
    }catch (err: any)
    {
        return res.status(400).json({
            message: "Validation error",
            errors: err.errors,
        });
    }
}
