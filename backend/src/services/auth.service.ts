import prisma from '../config/database'
import { hashPassword, comparePassword } from '../utils/hash'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt'
import crypto from 'crypto'
import { UserType } from '@prisma/client'
import { authOperations } from '../config/metrics'
import logger from '../config/logger'

const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export const register = async (data: {
  firstName: string
  lastName: string
  email: string
  password: string
}) => {
  const user_role = await prisma.user.count() === 0 ? UserType.ROOT : UserType.CLIENT
  const existing = await prisma.user.findUnique({
    where: { email: data.email }
  })

  if (existing) {
    authOperations.inc({ operation: 'register', result: 'duplicate_email' })
    logger.warn({
      event_action: 'auth_register_duplicate',
      email: data.email,
    }, 'Registration failed — email already exists')
    throw { status: 409, message: 'Email already exists' }
  }

  const hashed = await hashPassword(data.password)

  
  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashed,
      type: user_role,
    }
  })

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    type: user.type
  })

  const refreshToken = signRefreshToken({ id: user.id })
await prisma.refreshToken.deleteMany({ where: { userId: user.id } })
  await prisma.refreshToken.create({
    data: {
      token: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  })

  authOperations.inc({ operation: 'register', result: 'success' })
  logger.info({
    event_action: 'auth_register',
    user_id: user.id,
    email: user.email,
    user_type: user.type,
  }, 'New user registered')

  return { user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, type: user.type }, accessToken, refreshToken }
}


export const login = async (data: {
  email: string
  password: string
}) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email }
  })

  if (!user || !user.password) {
    authOperations.inc({ operation: 'login', result: 'invalid_credentials' })
    logger.warn({
      event_action: 'auth_login_failure',
      email_attempted: data.email,
      reason: 'invalid_credentials',
    }, 'Login failed')
    throw { status: 401, message: 'Invalid email or password' }
  }

  if (user.deletedAt) {
    authOperations.inc({ operation: 'login', result: 'deleted_user' })
    logger.warn({
      event_action: 'auth_login_failure',
      email_attempted: data.email,
      reason: 'deleted_user',
    }, 'Login attempt on deleted account')
    throw { status: 401, message: 'Invalid email or password' }
  }


  const isMatch = await comparePassword(data.password, user.password)

  if (!isMatch) {
    authOperations.inc({ operation: 'login', result: 'invalid_credentials' })
    logger.warn({
      event_action: 'auth_login_failure',
      email_attempted: data.email,
      reason: 'invalid_credentials',
    }, 'Login failed — wrong password')
    throw { status: 401, message: 'Invalid email or password' }
  }

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    type: user.type
  })

  const refreshToken = signRefreshToken({ id: user.id })

  await prisma.refreshToken.deleteMany({ where: { userId: user.id } })
  await prisma.refreshToken.create({
    data: {
      token: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  })

  authOperations.inc({ operation: 'login', result: 'success' })
  logger.info({
    event_action: 'auth_login_success',
    user_id: user.id,
    email: user.email,
    auth_provider: 'local',
  }, 'User logged in')

  return { user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, type: user.type }, accessToken, refreshToken }
}


export const getMe = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id }
  })

  if (!user) {
    throw { status: 404, message: 'User not found' }
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    type: user.type,
    phoneNumber: user.phoneNumber,
    imageUrl: user.imageUrl,
  }
}


export const refresh = async (token: string) => {
  if (!token) {
    authOperations.inc({ operation: 'refresh', result: 'no_token' })
    throw { status: 401, message: 'No refresh token provided' }
  }

  const hashedToken = hashToken(token)

  const stored = await prisma.refreshToken.findUnique({
    where: { token: hashedToken },
    include: { user: true }
  })

  if (!stored) {
    authOperations.inc({ operation: 'refresh', result: 'invalid_token' })
    throw { status: 401, message: 'Invalid refresh token' }
  }

  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { token: hashedToken } })
    authOperations.inc({ operation: 'refresh', result: 'expired' })
    throw { status: 401, message: 'Refresh token expired' }
  }

  try {
    verifyRefreshToken(token)
  } catch {
    await prisma.refreshToken.delete({ where: { token: hashedToken } })
    authOperations.inc({ operation: 'refresh', result: 'invalid_token' })
    throw { status: 401, message: 'Invalid refresh token' }
  }

  await prisma.refreshToken.delete({ where: { token: hashedToken } })

  const newRefreshToken = signRefreshToken({ id: stored.user.id })

  await prisma.refreshToken.create({
    data: {
      token: hashToken(newRefreshToken),
      userId: stored.user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  })

  const accessToken = signAccessToken({
    id: stored.user.id,
    email: stored.user.email,
    type: stored.user.type
  })

  authOperations.inc({ operation: 'refresh', result: 'success' })
  logger.info({
    event_action: 'auth_token_refresh',
    user_id: stored.user.id,
  }, 'Token refreshed')

  return { accessToken, refreshToken: newRefreshToken }
}


export const logout = async (token: string) => {
  if (!token) {
    return { message: 'Logged out successfully' }
  }

  await prisma.refreshToken.deleteMany({
    where: { token: hashToken(token) }
  })

  return { message: 'Logged out successfully' }
}


export const googleAuth = async (user: {
  id: string
  email: string
  type: string
  firstName: string
  lastName: string
}) => {
  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    type: user.type
  })

  const refreshToken = signRefreshToken({ id: user.id })
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } })
  await prisma.refreshToken.create({
    data: {
      token: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  })

  authOperations.inc({ operation: 'google_auth', result: 'success' })
  logger.info({
    event_action: 'auth_login_success',
    user_id: user.id,
    email: user.email,
    auth_provider: 'google',
  }, 'Google auth success')

  return { accessToken, refreshToken, user }
}