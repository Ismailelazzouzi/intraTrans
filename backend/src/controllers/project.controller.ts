import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import * as projectService from '../services/project.service'

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectService.getProjectById(req.params.id as string, req.user!.id)
  res.status(200).json({ success: true, data: result })
})

export const getMyAsClient = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectService.getMyProjectsAsClient(req.user!.id)
  res.status(200).json({ success: true, data: result })
})

export const getMyAsProvider = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectService.getMyProjectsAsProvider(req.user!.id)
  res.status(200).json({ success: true, data: result })
})

export const complete = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectService.completeProject(req.params.id as string, req.user!.id)
  res.status(200).json({ success: true, message: result.message })
})

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const result = await projectService.cancelProject(req.params.id as string, req.user!.id)
  res.status(200).json({ success: true, message: result.message })
})