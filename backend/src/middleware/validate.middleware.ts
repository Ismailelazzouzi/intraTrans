import type { Request,Response, NextFunction } from 'express'
import {z} from 'zod'

  export const validate = (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) =>{
    const result = schema.safeParse(req.body)

    if(!result.success){
        res.status(400).json({
            success: false,
            message: 'Validate error',
            errors: result.error.flatten().fieldErrors
        })
        return
    }
    req.body = result.data
    next()
  }
  