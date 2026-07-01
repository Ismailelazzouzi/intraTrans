import prisma from '../config/database'
import { getIO } from '../config/socket'
import {
  broadcastsCreated,
  broadcastResponses,
  providerConfirmations,
  socketEventsEmitted,
  socketEventsFailed,
} from '../config/metrics'
import logger from '../config/logger'

// ─── CREATE ───────────────────────────────────────────────────────────────────

export const createBroadcast = async(
    userId:string,
    data:{
        title:string,
        description?: string,
        location?: string,
        type?: 'NORMAL' | 'GROUP',
        maxProviders?: number 
    }
)=>{
    const broadcast = await prisma.broadcast.create({
        data:{
            userId,
            title: data.title,
            description: data.description,
            location: data.location,
            type: data.type ?? 'NORMAL',
            maxProviders: data.maxProviders
        },
        include: {user: {select:{id:true, firstName: true, lastName: true}}}
    })

    broadcastsCreated.inc({ type: data.type ?? 'NORMAL' })
    logger.info({
      event: 'broadcast_created',
      broadcastId: broadcast.id,
      clientId: userId,
      type: data.type ?? 'NORMAL',
    }, 'Broadcast created')

    try {
      getIO().to('role:PROVIDER').emit('new-broadcast', broadcast)
      socketEventsEmitted.inc({ event: 'new-broadcast' })
    } catch (err) {
      logger.error({ event: 'ws_emit_failure', eventName: 'new-broadcast', error: err instanceof Error ? err.message : String(err) }, 'Socket emit failed')
      socketEventsFailed.inc({ event: 'new-broadcast' })
    }
    return broadcast
}

// ─── GET ALL OPEN (for providers) ─────────────────────────────────────────────

export const getOpenAndInProgressBroadcasts = async()=>{
    return prisma.broadcast.findMany({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        include: {
            user: {select: {id: true, firstName: true, lastName: true}},
            _count: {select: {responses: true}}
        },
        orderBy: {createdAt: 'desc'}
    })
}

// ─── GET MY BROADCASTS (for client) ───────────────────────────────────────────

export const getMyBroadcasts = async (userId: string) => {
  return prisma.broadcast.findMany({
    where: { userId },
    include: {
      _count: { select: { responses: true } },
      responses: {
        where: { status: { not: 'WITHDRAWN' } },
        include: {
          provider: {
            include: { user: { select: { id: true, firstName: true, lastName: true } } }
          }
        }
      },
      project: {
        select: {
          id: true,
          status: true,
          providers: {
            select: {
              role: true,
              status: true,
              provider: {
                select: {
                  id: true,
                  profession: true,
                  user: { select: { id: true, firstName: true, lastName: true } }
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// ─── GET RESPONDED BROADCASTS (for provider) ──────────────────────────────────

export const getRespondedBroadcasts = async (providerId: string) => {
  return prisma.broadcastResponse.findMany({
    where: { providerId },
    include: {
      broadcast: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          project: {
            select: {
              id: true,
              status: true,
              providers: {
                where: { providerId },
                select: { role: true, status: true }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// ─── GET ONE ──────────────────────────────────────────────────────────────────

export const getBroadcastById = async (id: string, requesterId: string, requesterType: string) => {
  const broadcast = await prisma.broadcast.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      responses: {
        where: { status: { not: 'WITHDRAWN' } },
        include: {
          provider: {
            include: { user: { select: { id: true, firstName: true, lastName: true } } }
          }
        },
        orderBy: { createdAt: 'asc' }
      },
      project: { select: { id: true, status: true } }
    }
  })

  if (!broadcast) throw { status: 404, message: 'Broadcast not found' }

  if (requesterType === 'PROVIDER') {
    broadcast.responses = broadcast.responses.filter(
      r => r.provider.userId === requesterId
    )
  }

  if (requesterType === 'CLIENT' && broadcast.userId !== requesterId) {
    throw { status: 403, message: 'Access denied' }
  }

  return broadcast
}

// ─── RESPOND (provider) ───────────────────────────────────────────────────────

export const respondToBroadcast = async (
  broadcastId: string,
  providerId: string,
  data: { message?: string; price?: number; task?: string }
) => {
  const broadcast = await prisma.broadcast.findUnique({ where: { id: broadcastId } })
  if (!broadcast) throw { status: 404, message: 'Broadcast not found' }
  if (broadcast.status !== 'OPEN' && broadcast.status !== 'IN_PROGRESS') {
    broadcastResponses.inc({ result: 'broadcast_closed' })
    throw { status: 400, message: 'Broadcast is not open' }
  }

  const provider = await prisma.provider.findUnique({ where: { id: providerId } })
  if (provider?.userId === broadcast.userId)
    throw { status: 403, message: 'You cannot respond to your own broadcast' }

  const existing = await prisma.broadcastResponse.findUnique({
    where: { broadcastId_providerId: { broadcastId, providerId } }
  })

  if (existing && existing.status !== 'WITHDRAWN') {
    broadcastResponses.inc({ result: 'duplicate' })
    logger.warn({
      event: 'response_duplicate',
      broadcastId,
      providerId,
    }, 'Provider tried to respond twice')
    throw { status: 409, message: 'You already responded to this broadcast' }
  }

  const response = existing
    ? await prisma.broadcastResponse.update({
        where: { id: existing.id },
        data: { status: 'PENDING', message: data.message, price: data.price, task: data.task },
        include: {
          provider: {
            include: { user: { select: { id: true, firstName: true, lastName: true } } }
          }
        }
      })
    : await prisma.broadcastResponse.create({
        data: { broadcastId, providerId, message: data.message, price: data.price, task: data.task },
        include: {
          provider: {
            include: { user: { select: { id: true, firstName: true, lastName: true } } }
          }
        }
      })

  broadcastResponses.inc({ result: 'created' })
  logger.info({
    event: 'broadcast_response',
    broadcastId,
    providerId,
    price: data.price,
  }, 'Provider responded to broadcast')

  try {
    getIO().to(`user:${broadcast.userId}`).emit('new-response', response)
    socketEventsEmitted.inc({ event: 'new-response' })
  } catch (err) {
    logger.error({ event: 'ws_emit_failure', eventName: 'new-response', error: err instanceof Error ? err.message : String(err) }, 'Socket emit failed')
    socketEventsFailed.inc({ event: 'new-response' })
  }

  return response
}

// ─── CONFIRM PROVIDER ── transaction + maxProviders ───────────────────────────

export const confirmeProvider = async(
    broadcastId:string,
    responseId:string,
    clientId:string
)=>{
    const broadcast = await prisma.broadcast.findUnique({
        where: {id: broadcastId},
        include :{project: true}
    })

    if(!broadcast) throw {status: 404, message : 'Broadcast not found'}
    if(broadcast.userId !== clientId) throw {status: 403, message: 'Not your broadcast'}
    if(broadcast.status === 'CANCELLED') throw { status: 400, message: 'Broadcast is cancelled'}
    if(broadcast.status === 'CLOSED') throw {status: 400, message: 'Broadcast is closed'}

    const response = await prisma.broadcastResponse.findUnique({
        where: {id : responseId}
    })
    if(!response || response.broadcastId !== broadcastId)
        throw { status: 404, message: 'Response not found'}
    if(response.status === 'ACCEPTED') throw {status: 400, message: 'already confirmed'}

    const result = await prisma.$transaction(async (tx) =>{
        if(broadcast.type === 'NORMAL') {
            const alreadyAccepted = await tx.broadcastResponse.findFirst({
                where: {broadcastId, status: 'ACCEPTED'}
            })
            if(alreadyAccepted)
                throw {status: 400, message: 'A provider is already confirmed for this broadcast'}
        }

        if(broadcast.type === 'GROUP' && broadcast.maxProviders !==null){
            const acceptedCount = await tx.broadcastResponse.count({
                where: {broadcastId, status: 'ACCEPTED'}
            })
            if(acceptedCount >= broadcast.maxProviders)
                throw {status: 400, message: 'Maximum providers already reached'}
        }

        const updateResponse = await tx.broadcastResponse.update({
            where:{id: responseId},
            data: {status: 'ACCEPTED'}
        })

        let project = broadcast.project

        if(!project){
            project = await tx.project.create({
                data:{
                    clientId,
                    broadcastId,
                    title: broadcast.title,
                    description: broadcast.description ?? undefined,
                    status: 'ACTIVE'
                }
            })
        }

        await tx.projectProvider.upsert({
            where: {projectId_providerId: {projectId: project.id, providerId:response.providerId}},
            update: {status:'ACTIVE'},
            create:{
                projectId:project.id,
                providerId: response.providerId,
                status: 'ACTIVE',
                role: broadcast.type === 'NORMAL' ? 'LEAD': 'COLLABORATOR'
            }
        })

        if(broadcast.type === 'NORMAL') {
            await tx.broadcast.update({
                where:{id: broadcastId},
                data:{status: 'CLOSED', providerConfirmedId: response.providerId}
            })
            await tx.broadcastResponse.updateMany({
                where: { broadcastId, status: 'PENDING' },
                data: { status: 'REJECTED' }
            })
        } else {
            await tx.broadcast.update({
                where: { id: broadcastId },
                data: { status: 'IN_PROGRESS' }
            })
            if (broadcast.maxProviders !== null) {
                const totalAccepted = await tx.broadcastResponse.count({
                    where: { broadcastId, status: 'ACCEPTED' }
                })
                if (totalAccepted >= broadcast.maxProviders) {
                    await tx.broadcast.update({
                        where: { id: broadcastId },
                        data: { status: 'CLOSED' }
                    })
                    await tx.broadcastResponse.updateMany({
                        where: { broadcastId, status: 'PENDING' },
                        data: { status: 'REJECTED' }
                    })
                }
            }
        }

        return {updateResponse, project}
    })

    providerConfirmations.inc({ broadcast_type: broadcast.type })
    logger.info({
      event: 'broadcast_confirmed',
      broadcastId,
      clientId,
      providerId: response.providerId,
      projectId: result.project.id,
      broadcastType: broadcast.type,
    }, 'Provider confirmed')

    const confirmedProvider = await prisma.provider.findUnique({
        where: { id: response.providerId },
        select: { userId: true }
    })

    try {
        getIO().to(`user:${confirmedProvider?.userId}`).emit('response-confirmed', {
            broadcastId,
            projectId: result.project.id
        })
        socketEventsEmitted.inc({ event: 'response-confirmed' })
    } catch (err) {
        logger.error({ event: 'ws_emit_failure', eventName: 'response-confirmed', error: err instanceof Error ? err.message : String(err) }, 'Socket emit failed')
        socketEventsFailed.inc({ event: 'response-confirmed' })
    }

    const finalBroadcast = await prisma.broadcast.findUnique({ 
        where: { id: broadcastId } 
    })

    if (finalBroadcast?.status === 'CLOSED') {
        try {
            getIO().to(`broadcast:${broadcastId}`).emit('broadcast-closed', {
                broadcastId,
                reason: broadcast.type === 'NORMAL' ? 'Provider selected' : 'Max providers reached'
            })
            socketEventsEmitted.inc({ event: 'broadcast-closed' })
        } catch (err) {
            logger.error({ event: 'ws_emit_failure', eventName: 'broadcast-closed', error: err instanceof Error ? err.message : String(err) }, 'Socket emit failed')
            socketEventsFailed.inc({ event: 'broadcast-closed' })
        }

        const rejectedResponses = await prisma.broadcastResponse.findMany({
            where: { broadcastId, status: 'REJECTED' },
            include: { provider: { select: { userId: true } } }
        })

        for (const r of rejectedResponses) {
            try {
                getIO().to(`user:${r.provider.userId}`).emit('response-rejected', {
                    broadcastId,
                    reason: broadcast.type === 'NORMAL' ? 'Provider selected' : 'Max providers reached'
                })
                socketEventsEmitted.inc({ event: 'response-rejected' })
            } catch (err) {
                logger.error({ event: 'ws_emit_failure', eventName: 'response-rejected', error: err instanceof Error ? err.message : String(err) }, 'Socket emit failed')
                socketEventsFailed.inc({ event: 'response-rejected' })
            }
        }
    }

    return { response: result.updateResponse, project: result.project }
}

// ─── CANCEL (client) ──────────────────────────────────────────────────────────

export const cancelBroadcast = async(broadcastId: string, clientId: string) =>{
    const broadcast = await prisma.broadcast.findUnique({where: {id: broadcastId}})
    if(!broadcast) throw {status: 404, message: 'Broadcast not found'}
    if(broadcast.userId !== clientId) throw {status: 403, message: 'Not your broadcast'}
    if(broadcast.status === 'CLOSED' || broadcast.status === 'CANCELLED')
        throw {status: 400, message: 'Broadcast already closed or canceled'}

    await prisma.broadcast.update({where: {id:broadcastId}, data:{status: 'CANCELLED'}})
    await prisma.broadcastResponse.updateMany({
        where: {broadcastId, status: 'PENDING'},
        data: {status: 'REJECTED'}
    })

    logger.info({
      event: 'broadcast_cancelled',
      broadcastId,
      clientId,
    }, 'Broadcast cancelled')

    try {
        getIO().to(`broadcast:${broadcastId}`).emit('broadcast-cancelled', {broadcastId, reason: 'Cancelled by client' })
        socketEventsEmitted.inc({ event: 'broadcast-cancelled' })
    } catch (err) {
        logger.error({ event: 'ws_emit_failure', eventName: 'broadcast-cancelled', error: err instanceof Error ? err.message : String(err) }, 'Socket emit failed')
        socketEventsFailed.inc({ event: 'broadcast-cancelled' })
    }

    return {message: 'Broadcast cancelled'}
}

// ─── CLOSE GROUP (client) ─────────────────────────────────────────────────────

export const closeBroadcast = async(broadcastId:string, clientId: string)=>{
    const broadcast = await prisma.broadcast.findUnique({where: {id: broadcastId}})
    if(!broadcast) throw {status: 404, message: 'Broadcast not found'}
    if (broadcast.userId !== clientId) throw { status: 403, message: 'Not your broadcast' }
    if(broadcast.type !== 'GROUP') throw {status: 400, message: 'Only group broadcast can be manually closed'}
    if(broadcast.status === 'CLOSED' || broadcast.status === 'CANCELLED')
        throw { status: 400, message: 'Broadcast already closed or cancelled'}

    await prisma.broadcast.update({ where :{id : broadcastId}, data: {status: 'CLOSED'}})
    await prisma.broadcastResponse.updateMany({
        where: {broadcastId, status: 'PENDING'},
        data: {status: 'REJECTED'}
    })

    await prisma.project.updateMany({
        where: {broadcastId},
        data: {status: 'ACTIVE'}
    })

    logger.info({
      event: 'broadcast_closed',
      broadcastId,
      clientId,
    }, 'Group broadcast closed')

    try {
        getIO().to(`broadcast:${broadcastId}`).emit('broadcast-closed', {broadcastId})
        socketEventsEmitted.inc({ event: 'broadcast-closed' })
    } catch (err) {
        logger.error({ event: 'ws_emit_failure', eventName: 'broadcast-closed', error: err instanceof Error ? err.message : String(err) }, 'Socket emit failed')
        socketEventsFailed.inc({ event: 'broadcast-closed' })
    }

    return {message: 'Broadcast closed'}
}

// ─── WITHDRAW RESPONSE ────────────────────────────────────────────────────────

export const withdrawResponse = async (broadcastId: string, providerId: string) => {
  const broadcast = await prisma.broadcast.findUnique({ where: { id: broadcastId } })
  if (!broadcast) throw { status: 404, message: 'Broadcast not found' }
  if (broadcast.status !== 'OPEN' && broadcast.status !== 'IN_PROGRESS')
    throw { status: 400, message: 'Cannot withdraw from a closed or cancelled broadcast' }

  const response = await prisma.broadcastResponse.findUnique({
    where: { broadcastId_providerId: { broadcastId, providerId } }
  })
  if (!response) throw { status: 404, message: 'Response not found' }
  if (response.status === 'ACCEPTED')
    throw { status: 400, message: 'Cannot withdraw an accepted response' }

  await prisma.broadcastResponse.update({
    where: { id: response.id },
    data: { status: 'WITHDRAWN' }
  })

  try {
    getIO().to(`user:${broadcast.userId}`).emit('response-withdrawn', {
      broadcastId,
      responseId: response.id,
      providerId
    })
    socketEventsEmitted.inc({ event: 'response-withdrawn' })
  } catch (err) {
    logger.error({ event: 'ws_emit_failure', eventName: 'response-withdrawn', error: err instanceof Error ? err.message : String(err) }, 'Socket emit failed')
    socketEventsFailed.inc({ event: 'response-withdrawn' })
  }

  return { message: 'Response withdrawn' }
}