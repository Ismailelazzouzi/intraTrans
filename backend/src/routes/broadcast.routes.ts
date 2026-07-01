import { Router } from 'express'
import { z } from 'zod'
import * as broadcastController from '../controllers/broadcast.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import { validate } from '../middleware/validate.middleware'

const router = Router()

const createSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(['NORMAL', 'GROUP']).default('NORMAL'),
  maxProviders: z.number().int().positive().optional(),
})

const respondSchema = z.object({
  message: z.string().optional(),
  price: z.number().positive('Price must be positive').max(9999).optional(),
  task: z.string().optional(),
})

router.post('/', authMiddleware, requireRole('CLIENT'), validate(createSchema), broadcastController.create)
router.get('/', authMiddleware, requireRole('PROVIDER'), broadcastController.getOpenAndInProgress)
router.get('/my', authMiddleware, requireRole('CLIENT'), broadcastController.getMy)
router.get('/responded', authMiddleware, requireRole('PROVIDER'), broadcastController.getResponded)
router.get('/:id', authMiddleware, broadcastController.getOne)
router.post('/:id/respond', authMiddleware, requireRole('PROVIDER'), validate(respondSchema), broadcastController.respond)
router.put('/:id/confirm/:responseId', authMiddleware, requireRole('CLIENT'), broadcastController.confirm)
router.put('/:id/cancel', authMiddleware, requireRole('CLIENT'), broadcastController.cancel)
router.put('/:id/close', authMiddleware, requireRole('CLIENT'), broadcastController.close)
router.delete('/:id/responses', authMiddleware, requireRole('PROVIDER'), broadcastController.withdraw)

export default router