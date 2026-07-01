import jwt from 'jsonwebtoken'
import { env } from '../config/env'

// original — keep this, still used
export const signToken = (payload: {
  id: string
  email: string
  type: string
}): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' })
}

// new — short lived, used for protected requests
export const signAccessToken = (payload: {
  id: string
  email: string
  type: string
}): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' })
}

// new — long lived, used only to get new access token
export const signRefreshToken = (payload: {
  id: string
}): string => {
  return jwt.sign(payload, env.REFRESH_SECRET, { expiresIn: '30d' })
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] })
}

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, env.REFRESH_SECRET, { algorithms: ['HS256'] })
}