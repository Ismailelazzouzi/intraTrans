import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import * as broadcastService from '../services/broadcast.service'



export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await broadcastService.createBroadcast(req.user!.id, req.body)
  res.status(201).json({ success: true, message: 'Broadcast created', data: result })
})

export const getOpenAndInProgress = asyncHandler(async (req: Request, res: Response) => {
  const result = await broadcastService.getOpenAndInProgressBroadcasts();
  res.status(200).json({ success: true, data: result })
})




export const getMy = asyncHandler(async (req: Request, res: Response) => {
  const result = await broadcastService.getMyBroadcasts(req.user!.id);
  res.status(200).json({ success: true, data: result })
})


export const getResponded = asyncHandler(async (req: Request, res: Response) => {
  const { prisma } = await import('../config/database').then(m => ({ prisma: m.default }))
  const provider = await prisma.provider.findUnique({ where: { userId: req.user!.id } })
  if (!provider) throw { status: 403, message: 'You must be a registered provider' }

  const result = await broadcastService.getRespondedBroadcasts(provider.id)
  res.status(200).json({ success: true, data: result })
})


export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const result = await broadcastService.getBroadcastById(
    req.params.id as string,
    req.user!.id,
    req.user!.type
  )
  res.status(200).json({ success: true, data: result })
})

export const respond = asyncHandler(async (req: Request, res: Response) => {
  // get provider record from user id
  const { prisma } = await import('../config/database').then(m => ({ prisma: m.default }))
  const provider = await prisma.provider.findUnique({ where: { userId: req.user!.id } })
  if (!provider) throw { status: 403, message: 'You must be a registered provider' }

  const result = await broadcastService.respondToBroadcast(req.params.id as string, provider.id, req.body)
  res.status(201).json({ success: true, message: 'Response submitted', data: result })
})

export const confirm = asyncHandler(async (req: Request, res: Response) => {
  const result = await broadcastService.confirmeProvider(
    req.params.id as string,
    req.params.responseId as string,
    req.user!.id
  )
  res.status(200).json({ success: true, message: 'Provider confirmed', data: result })
})

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const result = await broadcastService.cancelBroadcast(req.params.id as string, req.user!.id)
  res.status(200).json({ success: true, message: result.message })
})

export const close = asyncHandler(async (req: Request, res: Response) => {
  const result = await broadcastService.closeBroadcast(req.params.id as string, req.user!.id)
  res.status(200).json({ success: true, message: result.message })
})

export const withdraw = asyncHandler(async (req: Request, res: Response) => {
  const { prisma } = await import('../config/database').then(m => ({ prisma: m.default }))
  const provider = await prisma.provider.findUnique({ where: { userId: req.user!.id } })
  if (!provider) throw { status: 403, message: 'You must be a registered provider' }

  const result = await broadcastService.withdrawResponse(req.params.id as string, provider.id)
  res.status(200).json({ success: true, message: result.message })
})