import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import prisma from '../config/database'
import logger from '../config/logger'

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const tokenFromCookie = req.cookies?.accessToken
  const tokenFromHeader = req.headers.authorization?.split(' ')[1]
  
  const token = tokenFromCookie || tokenFromHeader
  
  if (!token) {
    logger.warn({
      event_action: 'auth_unauthorized',
      path: req.path,
      clientIp: req.ip,
      reason: 'no_token',
    }, 'No token provided')
    res.status(401).json({ success: false, message: 'No token provided' })
    return
  }

  try {
    const decoded = verifyToken(token) as { id: string; email: string; type: string }

    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        deletedAt: null,
      }
    })

    if (!user) {
      logger.warn({
        event_action: 'auth_unauthorized',
        path: req.path,
        clientIp: req.ip,
        reason: 'user_not_found_or_deleted',
      }, 'User not found or deleted')
      return res.status(401).json({ message: 'Unauthorized' })
    }

    req.user = decoded
    next()
  } catch {
    logger.warn({
      event_action: 'auth_unauthorized',
      path: req.path,
      clientIp: req.ip,
      reason: 'invalid_expired_token',
    }, 'Invalid or expired token')
    res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}