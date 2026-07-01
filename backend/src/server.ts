
////

import http from 'http'
import { env, initEnv } from './config/env'
import { activeBroadcasts, usersTotal } from './config/metrics'
import logger from './config/logger'

const start = async () => {
  try {
    await initEnv()
    logger.info({ event_action: 'vault_secrets_loaded' }, 'Secrets loaded from Vault')

    // All imports below are deferred until after initEnv() so that every
    // module that reads env.X at load time sees the Vault-populated values.
    const { default: app } = await import('./app')
    const { initSocket } = await import('./config/socket')
    const { registerSocketHandlers } = await import('./sockets/index')
    const { default: prisma } = await import('./config/database')

    async function updateGaugeMetrics() {
      try {
        const broadcastCounts = await prisma.broadcast.groupBy({
          by: ['status'],
          _count: true,
        })

        for (const status of ['OPEN', 'IN_PROGRESS', 'CLOSED', 'CANCELLED']) {
          activeBroadcasts.set({ status }, 0)
        }
        for (const row of broadcastCounts) {
          activeBroadcasts.set({ status: row.status }, row._count)
        }

        const userCounts = await prisma.user.groupBy({
          by: ['type'],
          where: { deletedAt: null },
          _count: true,
        })

        for (const type of ['PENDING', 'CLIENT', 'PROVIDER', 'ADMIN', 'ROOT']) {
          usersTotal.set({ type }, 0)
        }
        for (const row of userCounts) {
          usersTotal.set({ type: row.type }, row._count)
        }
      } catch (err) {
        logger.error({
          event_action: 'metrics_update_fail',
          error_message: err instanceof Error ? err.message : String(err),
        }, 'Failed to update gauge metrics')
      }
    }

    const httpServer = http.createServer(app)
    initSocket(httpServer)
    registerSocketHandlers()

    await prisma.$connect()
    logger.info({ event_action: 'db_connected' }, 'Database connected')

    httpServer.listen(env.PORT, () => {
      logger.info({
        event_action: 'process_start',
        port: env.PORT,
        nodeVersion: process.version,
        environment: env.NODE_ENV,
      }, `Server running on port ${env.PORT}`)

      updateGaugeMetrics()
      setInterval(updateGaugeMetrics, 30_000)
    })
  } catch (error) {
    logger.error({
      event_action: 'db_connection_fail',
      error_message: error instanceof Error ? error.message : error,
    }, 'Failed to start server')
    process.exit(1)
  }
}

process.on('uncaughtException', (err) => {
  logger.error({
    event_action: 'process_uncaught_ex',
    error_message: err.message,
    stack: err.stack,
  }, 'Uncaught exception')
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  logger.error({
    event_action: 'process_unhandled_rej',
    error_message: String(reason),
  }, 'Unhandled rejection')
})

start()
