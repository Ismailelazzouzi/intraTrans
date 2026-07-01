import pino from 'pino'

const NODE_ENV = process.env.NODE_ENV ?? 'development'

const logger = pino({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  base: {
    service: 'backend',
    environment: NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['password', 'token', 'authorization', 'accessToken', 'refreshToken', 'content'],
    censor: '[REDACTED]',
  },
})

export default logger
