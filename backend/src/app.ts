import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import routes from './routes/index'
import { errorMiddleware } from './middleware/error.middleware'
import cookieParser from 'cookie-parser'
import passport from './config/passport'
import { env } from './config/env'
import { metricsMiddleware } from './middleware/metrics.middleware'
import metricsRoute from './routes/metrics.routes'
import path from "path";

import pinoHttp from 'pino-http'
import logger from './config/logger'
import { apiLimiter } from './middleware/rateLimiter.middleware'


const app = express()

app.set('trust proxy', 1)

// security
app.use(helmet())

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}))

// app.use(metricsMiddleware)
// app.use(metricsRoute)

// parse request body as json
app.use(express.json())
app.use(cookieParser())   
///
app.use(pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      user_id: req.raw?.user?.id,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
}))

app.use(passport.initialize())


// metrics after auth setup
app.use(metricsMiddleware)
app.use(metricsRoute)


// health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' })
})

// all routes
app.use('/api', apiLimiter, routes)

// error handler — must be last
app.use(errorMiddleware)

export default app