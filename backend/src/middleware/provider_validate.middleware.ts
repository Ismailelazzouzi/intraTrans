import { body_schema } from "../utils/zod_shema"
import { Request, Response, NextFunction } from "express"


const v_middleware = (req: Request, res: Response, next: NextFunction) => {

    const result = body_schema.safeParse(req.body);

    if (!result.success)
    {
        return (res.status(400).json({error: "something wrong in the request body"}));
    }
    req.body = result.data;
    next();
}

export default v_middleware;