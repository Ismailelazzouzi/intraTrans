import prisma from '../config/database'
import { getIO } from '../config/socket'
import logger from '../config/logger'

// ─── GET ONE ──────────────────────────────────────────────────────────────────

export const getProjectById = async (projectId: string, userId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
      broadcast: {
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          type: true,
          status: true,
        }
      },
      providers: {
        select: {
          role: true,
          status: true,
          provider: {
            select: {
              id: true,
              profession: true,
              description: true,
              user: { select: { id: true, firstName: true, lastName: true, imageUrl: true } }
            }
          }
        }
      }
    }
  })

  if (!project) throw { status: 404, message: 'Project not found' }

  const isClient = project.clientId === userId
  const isProvider = project.providers.some(
    pp => pp.provider.user.id === userId
  )

  if (!isClient && !isProvider)
    throw { status: 403, message: 'You are not part of this project' }

  return project
}

// ─── GET MY PROJECTS (client) ─────────────────────────────────────────────────

export const getMyProjectsAsClient = async (userId: string) => {
  return prisma.project.findMany({
    where: { clientId: userId },
    include: {
      broadcast: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
        }
      },
      providers: {
        select: {
          role: true,
          status: true,
          provider: {
            select: {
              id: true,
              profession: true,
              user: { select: { id: true, firstName: true, lastName: true, imageUrl: true } }
            }
          }
        }
      },
      _count: { select: { providers: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// ─── GET MY PROJECTS (provider) ───────────────────────────────────────────────

export const getMyProjectsAsProvider = async (userId: string) => {
  const provider = await prisma.provider.findUnique({
    where: { userId }
  })

  if (!provider) throw { status: 403, message: 'You must be a registered provider' }

  return prisma.project.findMany({
    where: {
      providers: {
        some: { providerId: provider.id }
      }
    },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
      broadcast: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
        }
      },
      providers: {
        where: { providerId: provider.id },
        select: {
          role: true,
          status: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// ─── COMPLETE (client) ────────────────────────────────────────────────────────

export const completeProject = async (projectId: string, clientId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      providers: {
        include: { provider: { select: { userId: true } } }
      }
    }
  })

  if (!project) throw { status: 404, message: 'Project not found' }
  if (project.clientId !== clientId) throw { status: 403, message: 'Not your project' }
  if (project.status === 'COMPLETED') throw { status: 400, message: 'Project already completed' }
  if (project.status === 'CANCELLED') throw { status: 400, message: 'Project is cancelled' }

  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'COMPLETED' }
  })

  await prisma.projectProvider.updateMany({
    where: { projectId, status: 'ACTIVE' },
    data: { status: 'COMPLETED' }
  })

  logger.info({
    event: 'project_completed',
    projectId,
    clientId,
  }, 'Project marked as completed')

  for (const pp of project.providers) {
    try {
      getIO().to(`user:${pp.provider.userId}`).emit('project-completed', {
        projectId,
        message: 'Client marked the project as completed'
      })
    } catch (err) {
      logger.error({
        event: 'ws_emit_failure',
        eventName: 'project-completed',
        projectId,
        error: err instanceof Error ? err.message : String(err),
      }, 'Socket emit failed')
    }
  }

  return { message: 'Project marked as completed' }
}

// ─── CANCEL (client) ──────────────────────────────────────────────────────────

export const cancelProject = async (projectId: string, clientId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      providers: {
        include: { provider: { select: { userId: true } } }
      }
    }
  })

  if (!project) throw { status: 404, message: 'Project not found' }
  if (project.clientId !== clientId) throw { status: 403, message: 'Not your project' }
  if (project.status === 'COMPLETED') throw { status: 400, message: 'Project already completed' }
  if (project.status === 'CANCELLED') throw { status: 400, message: 'Project already cancelled' }

  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'CANCELLED' }
  })

  await prisma.projectProvider.updateMany({
    where: { projectId, status: 'ACTIVE' },
    data: { status: 'REMOVED' }
  })

  logger.info({
    event: 'project_cancelled',
    projectId,
    clientId,
  }, 'Project cancelled')

  for (const pp of project.providers) {
    try {
      getIO().to(`user:${pp.provider.userId}`).emit('project-cancelled', {
        projectId,
        message: 'Client cancelled the project'
      })
    } catch (err) {
      logger.error({
        event: 'ws_emit_failure',
        eventName: 'project-cancelled',
        projectId,
        error: err instanceof Error ? err.message : String(err),
      }, 'Socket emit failed')
    }
  }

  return { message: 'Project cancelled' }
}