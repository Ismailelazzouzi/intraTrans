
import { Server } from 'socket.io'
import type { Server as HttpServer } from 'http'
import { env } from './env'
import { socketConnectedClients, socketClientsInRoom } from './metrics'

let io: Server

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true
    }
  })

  io.on('connection', (socket) => {
    socketConnectedClients.set(io.engine.clientsCount)

    socket.on('disconnect', () => {
      socketConnectedClients.set(io.engine.clientsCount)
      updateRoomCounts()
    })
  })

  return io
}

function updateRoomCounts() {
  if (!io) return

  const trackedRooms = ['role:PROVIDER']

  for (const room of trackedRooms) {
    const roomInstance = io.sockets.adapter.rooms.get(room)
    const count = roomInstance ? roomInstance.size : 0
    socketClientsInRoom.set({ room }, count)
  }
}

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}