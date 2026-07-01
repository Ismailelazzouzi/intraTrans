import { Router } from 'express'
import { register } from '../config/metrics'
import { env } from '../config/env'

const router = Router()

router.get('/metrics', (req, res, next) => {
  const token = req.headers['x-metrics-token']
  if (!token || token !== env.METRICS_SECRET) {
    return res.status(403).json({ message: 'Forbidden' })
  }
  next()
}, async (req, res) => {
  try {
    res.set('Content-Type', register.contentType)
    res.end(await register.metrics())
  } catch (err) {
    res.status(500).end(err)
  }
})

export default router