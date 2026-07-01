import { Router } from 'express'
import { z } from 'zod'
import * as authController from '../controllers/auth.controller'
import { validate } from '../middleware/validate.middleware'
import { authMiddleware } from '../middleware/auth.middleware'
import passport from '../config/passport'
import { authLimiter } from '../middleware/rateLimiter.middleware'

const router = Router()

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

// const refreshSchema = z.object({
//   refreshToken: z.string().min(1, 'Refresh token is required'),
// })

// const logoutSchema = z.object({
//   refreshToken: z.string().min(1, 'Refresh token is required'),
// })


router.post('/register', authLimiter, validate(registerSchema), authController.register)
router.post('/login', authLimiter, validate(loginSchema), authController.login)
router.get('/me', authMiddleware, authController.getMe)
router.post('/refresh', authController.refresh) 
router.post('/logout', authController.logout) 
router.get('/google/finalize', authController.googleFinalize)
// router.post('/refresh', validate(refreshSchema), authController.refresh)
// router.post('/logout', validate(logoutSchema), authController.logout)

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['email', 'profile'],
    session: false
  })
)

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
  }),
  authController.googleCallback
)

export default router