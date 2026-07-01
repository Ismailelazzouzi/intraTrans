import { getIO } from '../config/socket'
import { verifyToken } from '../utils/jwt'
import prisma from '../config/database'
import logger from '../config/logger'
import { presenceService, getRelatedUserIds } from './presence'

export const registerSocketHandlers = () => {
  const io = getIO()

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie
      const token = cookieHeader
        ?.split(';')
        ?.find(c => c.trim().startsWith('accessToken='))
        ?.split('=')[1]

      if (!token) return next(new Error('Unauthorized'))

      const decoded = verifyToken(token) as { id: string; email: string; type: string }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id, deletedAt: null },
        select: { id: true, email: true, type: true }
      })

      if (!user) return next(new Error('Unauthorized'))

      socket.data.user = user
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', async (socket) => {
    const user = socket.data.user
    let joinCount = 0

    const justCameOnline = presenceService.addConnection(user.id, socket.id)

    socket.join(`user:${user.id}`)

    if (user.type === 'PROVIDER') {
      socket.join('role:PROVIDER')
    }

    logger.info({
      event_action: 'ws_connected',
      socketId: socket.id,
      user_id: user.id,
      user_type: user.type,
    }, 'Socket connected')

    try {
      const relatedUserIds = await getRelatedUserIds(user.id)

      if (justCameOnline) {
        relatedUserIds.forEach(id => {
          io.to(`user:${id}`).emit('presence:update', { userId: user.id, isOnline: true })
        })
      }

      socket.emit(
        'presence:initial',
        relatedUserIds.map(id => ({ userId: id, isOnline: presenceService.isOnline(id) }))
      )
    } catch (err) {
      logger.error({
        event_action: 'ws_presence_init_failed',
        socketId: socket.id,
        user_id: user.id,
        err,
      }, 'Failed to initialize presence for socket')
    }

    socket.on('joinConversation', async (conversationId) => {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          participants: {
            some: { userId: user.id }
          }
        }
      })
      if (!conversation) return
      socket.join(`conversation:${conversationId}`)
    })

    socket.on('join-broadcast', (broadcastId: unknown) => {
      if (typeof broadcastId !== 'string') return
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(broadcastId)) return
      if (joinCount >= 10) return
      socket.join(`broadcast:${broadcastId}`)
      joinCount++

      logger.info({
        event_action: 'ws_join_room',
        socketId: socket.id,
        user_id: user.id,
        room: `broadcast:${broadcastId}`,
      }, 'User joined broadcast room')
    })

    socket.on('leave-broadcast', (broadcastId: unknown) => {
      if (typeof broadcastId !== 'string') return
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(broadcastId)) return
      socket.leave(`broadcast:${broadcastId}`)
      if (joinCount > 0) joinCount--
    })

    socket.on('disconnect', async (reason) => {
      const justWentOffline = presenceService.removeConnection(user.id, socket.id)

      if (justWentOffline) {
        try {
          const relatedUserIds = await getRelatedUserIds(user.id)
          relatedUserIds.forEach(id => {
            io.to(`user:${id}`).emit('presence:update', { userId: user.id, isOnline: false })
          })
        } catch (err) {
          logger.error({
            event_action: 'ws_presence_disconnect_failed',
            socketId: socket.id,
            user_id: user.id,
            err,
          }, 'Failed to broadcast offline presence')
        }
      }

      logger.info({
        event_action: 'ws_disconnected',
        socketId: socket.id,
        user_id: user.id,
        reason,
      }, 'Socket disconnected')
    })
  })
}