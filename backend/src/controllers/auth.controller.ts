import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import * as authService from '../services/auth.service'
import { env } from '../config/env'


//cookie options
const accessTokenOptions = {
  httpOnly : true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 15 * 60 * 1000  
}

const refreshTokenOptions = {
  httpOnly : true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body)

  res.cookie('accessToken', result.accessToken, accessTokenOptions)
  res.cookie('refreshToken', result.refreshToken, refreshTokenOptions)

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: { user : result.user}
  })
})

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body)

  res.cookie('accessToken', result.accessToken, accessTokenOptions)
  res.cookie('refreshToken', result.refreshToken, refreshTokenOptions)

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: { user : result.user},
  })
})

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.getMe(req.user!.id)

  res.status(200).json({
    success: true,
    message: 'User fetched successfully',
    data: result
  })
})

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken 

  const result = await authService.refresh(token)

  res.cookie('accessToken', result.accessToken, accessTokenOptions)
  res.cookie('refreshToken', result.refreshToken, refreshTokenOptions)

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {}
  })
})

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken 

  await authService.logout(token)

  const clearOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  }

  res.clearCookie('accessToken', clearOptions)
  res.clearCookie('refreshToken', clearOptions)

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: null
  })
})

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {

  const user = req.user as any

  if (!user) {
    res.redirect(`${env.FRONTEND_URL}/login?error=google_auth_failed`)
    return
  }

  const result = await authService.googleAuth(user)

  res.cookie('accessToken', result.accessToken, accessTokenOptions)
  res.cookie('refreshToken', result.refreshToken, refreshTokenOptions)

  // serve HTML page from localhost:3000
  // cookies are committed on this domain
  // then JS redirects to frontend
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="refresh" content="0;url=${env.FRONTEND_URL}/auth/callback">
      </head>
      <body></body>
    </html>
  `)
})

export const googleFinalize = asyncHandler(async (req: Request, res: Response) => {
  const accessToken = req.cookies?.accessToken
  const refreshToken = req.cookies?.refreshToken

  if (!accessToken || !refreshToken) {
    res.status(401).json({ success: false, message: 'No session found' })
    return
  }

  res.status(200).json({ success: true, message: 'Session established' })
})