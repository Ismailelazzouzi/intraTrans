import prisma from '../config/database'


export const updateUser = async (
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    imageUrl?: string;
  }
) => {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== undefined)
  );

  return await prisma.user.update({
    where: { id: userId },
    data: cleanData,
  });
};

//get all users
export const getAllUsers = async (requesterType: string) => {
  if (requesterType === 'CLIENT' || requesterType === 'PENDING') {
    return await prisma.user.findMany({
      where: { type: 'PROVIDER', deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        type: true,
        createdAt: true,
        provider: {
          select: { id: true, profession: true, isVerified: true }
        }
      }
    })
  }
  return await prisma.user.findMany({
    where: { type: { in: ['CLIENT', 'PENDING'] }, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
      type: true,
      createdAt: true,
    }
  })
}


export const getUserById = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
      type: true,
      createdAt: true,
      broadcastsCreated: {
        where: {
          status: 'CLOSED',
          project: { isNot: null }
        },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          status: true,
          type: true,
          createdAt: true,
          project: {
            select: {
              id: true,
              status: true,
            }
          }
        }
      },
      provider: {
        select: {
          id: true,
          profession: true,
          description: true,
          isVerified: true,
          broadcastResponses: {
            where: {
              status: 'ACCEPTED',
              broadcast: { status: 'CLOSED' }
            },
            select: {
              id: true,
              task: true,
              price: true,
              broadcast: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  location: true,
                  status: true,
                  createdAt: true,
                }
              }
            }
          }
        }
      }
    }
  })

  if (!user) throw { status: 404, message: 'User not found' }
  return user
}