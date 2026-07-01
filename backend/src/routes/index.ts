import { Router } from 'express'
import authRoutes from './auth.routes'
import providerRoutes from './switch.routes'
import adminRoutes from './admin.routes'

import { authMiddleware } from '../middleware/auth.middleware'
import { getUploadFile } from '../controllers/upload.controller'
import  broadcastRoutes from './broadcast.routes'
import chatRoutes from './chat.routes'
import  TrustedRelationRoutes  from './trustedRelation.routes'
import userRoutes from './user.routes'
import projectRoutes from './project.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/provider', providerRoutes);
router.use('/admin', adminRoutes);
router.use('/uploads/:filename', authMiddleware, getUploadFile);
router.use('/broadcasts', broadcastRoutes)
router.use('/chat', chatRoutes)
router.use('/TrustedRelation', TrustedRelationRoutes);

router.use('/users', userRoutes)
router.use('/projects', projectRoutes)

export default router