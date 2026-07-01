import type { Request, Response, NextFunction } from 'express'
import { httpRequestsTotal, httpRequestDuration, httpRequestSize } from '../config/metrics'

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.path === '/metrics') {
    next()
    return
  }

  const startTime = process.hrtime.bigint()

  res.on('finish', () => {
    const endTime = process.hrtime.bigint()
    const durationSeconds = Number(endTime - startTime) / 1e9

    const route = getRoutePattern(req)
    const method = req.method
    const statusCode = res.statusCode.toString()

    httpRequestsTotal.inc({ method, route, status_code: statusCode })
    httpRequestDuration.observe({ method, route, status_code: statusCode }, durationSeconds)

    const contentLength = req.headers['content-length']
    if (contentLength) {
      httpRequestSize.observe({ method, route }, parseInt(contentLength, 10))
    }
  })

  next()
}

function getRoutePattern(req: Request): string {
  if (req.route) {
    return `${req.baseUrl}${req.route.path}`
  }
  return req.path
}