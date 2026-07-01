import {Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware';
import * as userController from '../controllers/user.controller'
import {z} from 'zod'
import { validate } from '../middleware/validate.middleware';
import uploadImgMiddleware from "../middleware/uploadImg.middleware"
import { requireRole } from '../middleware/role.middleware';
const router  =Router();


export const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z
  .string()
  .regex(/^\d{10}$/, "Phone number must contain exactly 10 digits")
  .optional(),
  imageUrl: z.string().optional(),
});


router.patch('/me',authMiddleware,uploadImgMiddleware,validate(updateUserSchema),userController.updateMe)
router.get('/', authMiddleware, requireRole('CLIENT', 'PROVIDER', 'PENDING'), userController.getAllUsers)
router.get('/:id', authMiddleware, requireRole('CLIENT', 'PROVIDER', 'PENDING','ADMIN','ROOT'), userController.getById)

export default router 