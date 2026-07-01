import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import * as userService from '../services/user.service'

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.updateUser(req.user!.id, req.body);

  res.status(200).json({
    success: true,
    message: "User updated",
    data: result,
  });
});


export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.getAllUsers(req.user!.type)

  res.status(200).json({
    success: true,
    data: result,
  });
})




export const getById = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.getUserById(req.params.id as string)
  res.status(200).json({ success: true, data: result })
})