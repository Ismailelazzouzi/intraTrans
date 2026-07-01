import { Router } from 'express'
import * as projectController from '../controllers/project.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'

const router = Router()

router.get('/my', authMiddleware, requireRole('CLIENT'), projectController.getMyAsClient)
router.get('/assigned', authMiddleware, requireRole('PROVIDER'), projectController.getMyAsProvider)
router.get('/:id', authMiddleware, projectController.getOne)
router.put('/:id/complete', authMiddleware, requireRole('CLIENT'), projectController.complete)
router.put('/:id/cancel', authMiddleware, requireRole('CLIENT'), projectController.cancel)

export default router