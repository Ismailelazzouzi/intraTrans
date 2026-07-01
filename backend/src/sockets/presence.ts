import prisma from '../config/database'

const onlineUsers = new Map<string, Set<string>>()

export const presenceService = {
  addConnection(userId: string, socketId: string): boolean {
    const wasOffline = !onlineUsers.has(userId)
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set())
    }
    onlineUsers.get(userId)!.add(socketId)
    return wasOffline
  },

  removeConnection(userId: string, socketId: string): boolean {
    const sockets = onlineUsers.get(userId)
    if (!sockets) return false
    sockets.delete(socketId)
    if (sockets.size === 0) {
      onlineUsers.delete(userId)
      return true
    }
    return false
  },

  isOnline(userId: string): boolean {
    return onlineUsers.has(userId)
  },

  filterOnline(userIds: string[]): string[] {
    return userIds.filter(id => onlineUsers.has(id))
  },
}
export async function getRelatedUserIds(userId: string): Promise<string[]> {
  const [asUser, providerRecord] = await Promise.all([
    prisma.trustedRelation.findMany({
      where: { userId, status: 'ACCEPTED' },
      include: { provider: { select: { userId: true } } },
    }),
    prisma.provider.findUnique({
      where: { userId },
      select: {
        trustedRelations: {
          where: { status: 'ACCEPTED' },
          select: { userId: true },
        },
      },
    }),
  ])

  const ids = new Set<string>()
  asUser.forEach(r => ids.add(r.provider.userId))
  providerRecord?.trustedRelations.forEach(r => ids.add(r.userId))
  return [...ids]
}