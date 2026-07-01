import prisma from "../config/database";
import { Request, Response } from "express";
import { UserType } from "@prisma/client";
import { VerificationStatus , AdminAction, ProjectStatus} from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler";
import { audit } from "../utils/audit";
import logger from "../config/logger";

type User = {
    id: string,
    firstName: string,
    lastName: string,
    email: string,
    type: UserType
};

export const adminStats = asyncHandler(async (req: Request, res: Response) => {
    const provider_count = await prisma.user.count({
        where:{
            type: UserType.PROVIDER,
            deletedAt: null
        },
    });
    const users_count = await prisma.user.count({
        where: {
            NOT: {
                type: {
                    in : [UserType.ADMIN, UserType.ROOT],
                }
            },
            deletedAt: null,
        }
    },);
    const users_pending_count = await prisma.user.count({
        where : {
            type: UserType.PENDING,
            deletedAt:null
        },
    });
    const completed_projects = await prisma.project.count({
        where: {
            status: ProjectStatus.COMPLETED
        }
    })
    const client_count = users_count - provider_count;
    let provider_ratio = 0;
    if (users_count)
        provider_ratio = 100 * provider_count / users_count;

    logger.info({
        event_action: "admin_dashboard_stats",
        user_id: req.user!.id,
        admin_type: req.user!.type,
    });

    res.status(200).json({provider_count, provider_ratio, users_pending_count, client_count, completed_projects});
})

function sortDependonType(users: User[])
{
    users.sort((a, b) => {
        const priority = (user: User) => {
            if (user.type === UserType.PENDING)
                return (0);
            else if (user.type === UserType.PROVIDER)
                return (1);
            else
                return (2);
        }
        return (priority(a) - priority(b));
    });
}

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await prisma.user.findMany({
        where: {
            NOT: {
                type: {
                    in: [UserType.ADMIN, UserType.ROOT]
                }
            },
            deletedAt: null
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            type:true,
        },
    });
    sortDependonType(users);
    res.status(200).json({
        data: {users}
    });
})

export const getAdmins = asyncHandler(async (req: Request, res: Response) => {
    const admins = await prisma.user.findMany({
        where : {
            type: {
                in : [UserType.ADMIN, UserType.ROOT]
            },
            deletedAt: null
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            type: true,
        },
    });
    res.status(200).json({
        data: {admins}
    });
})

export const checkUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id as string;

    const checkuser = await prisma.user.findUnique({where: {id:userId}});
    if (!checkuser)
        return (res.status(400).json({message: "user not found"}));
    if (checkuser?.deletedAt != null)
        return (res.status(400).json({message: "user with this id is deleted"}));
    const user = await prisma.provider.findUnique({
        where: {
            userId: userId,
        }
    });
    if (!user)
        return (res.status(400).json({message: "is not in pending status"}));
    res.status(200).json({
        data: {
            id: user?.id,
            license: user?.license,
            idVerificationImg: user?.idVerificationImg,
            profession: user?.profession,
            description: user?.description,
        },
    });
})

export const reviewProvider = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id as string;
    const is_acepted = req.body.status === "ACCEPTED";
    const action = is_acepted ? "approved" : "rejected";

    const user = await prisma.$transaction(async (tx) => {
        const userCheck = await tx.user.findFirst({where: {id: userId, deletedAt: null}});
        if (!userCheck)
            throw { status: 404, message: "User not found" };
        if (userCheck.type != UserType.PENDING)
            throw {status: 403, message: "this user is not in pending status"};
        if (!is_acepted)
        {
            await tx.provider.delete({
                where: {
                    userId,
                }
            });
        }
        else
        {
            await tx.provider.update({
                where: {
                    userId,
                },
                data: {
                    isVerified: VerificationStatus.VERIFIED
                }
            })
        }
        await tx.auditLog.create({
            data: {
                action: is_acepted? AdminAction.PROVIDER_APPROVED : AdminAction.PROVIDER_REJECTED,
                performedBy: req.user!.id,
                targetId: userId
            }
        });
        logger.info({
            event_action: "admin_provider_review",
            admin_id: req.user!.id,
            provider_id: userId,
            action,
        });
        return  (await tx.user.update({
            where: {
                id: userId
            },
            data: {
                type: is_acepted === true ? UserType.PROVIDER : UserType.CLIENT,
            }
        }))
    })
    return (res.status(200).json({
        message: "status and type updated",
        data: {
            id: user.id,
            type:user.type,
        }
    }));
})

export const becomeAdmin = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id as string;

    const target = await prisma.user.findFirst({ where: { id: userId, deletedAt: null} });
    
    if (!target)
        return res.status(404).json({ message: "User not found" });
    if (target.type === UserType.ADMIN)
        return res.status(400).json({ message: "User is already an admin" });
    if (target.type == UserType.PENDING)
        return (res.status(400).json({message: "he is in pending status"}));
    if (req.user!.id == userId)
        return (res.status(400).json({message: "the root admin cannot become an admin"}));

    await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            type: UserType.ADMIN,
        },
    })
    await audit(AdminAction.USER_PROMOTED_TO_ADMIN, req.user!.id, userId);
    logger.info({
        event_action: "user_promoted_admin",
        admin_id: req.user!.id,
        target_user_id: userId,
    });
    res.status(200).json({message: "this user become an admin"});
})

export const deleteUser = asyncHandler( async (req: Request, res: Response) => {
    await prisma.$transaction(async (tx) => {
        const userId = req.params.id as string;
        const user = await tx.user.findFirst({
            where: {
                id: userId,
                deletedAt: null,
            }
        });
        if (!user)
            throw { status: 404, message: "User not found" };
        if (user?.type === UserType.ROOT)
            throw { status: 403, message: "cannot delete a root admin" };
        if (user?.type === UserType.ADMIN && req.user!.type != UserType.ROOT) {
            logger.warn({
                event_action: "admin_unauthorized_action",
                admin_id: req.user!.id,
                attempted_action: "delete_admin",
                target_user_id: userId,
            });
            throw { status: 403, message: "This action is only for the ROOT admin" };
        }
        await tx.user.update({
            where: {
                id: userId
            },
            data: {
                deletedAt: new Date()
            }
        });
        await tx.auditLog.create({
            data: {
                action: AdminAction.USER_DELETED,
                performedBy: req.user!.id,
                targetId: userId
            }
        });
        logger.info({
            event_action: "admin_delete_user",
            admin_id: req.user!.id,
            deleted_user_id: userId,
        });
    })
    res.status(200).json({ message: "User deleted successfully" });
})

export const removeProvider = asyncHandler( async(req:Request, res: Response) => {
    const userId = req.params.id as string;
    const user = await prisma.$transaction(async (tx) => {
        const checkUser = await tx.user.findFirst({
            where: {
                id: userId,
                deletedAt: null,
            }
        })
        if (!checkUser)
            throw { status: 404, message: "User not found" };
        if (checkUser.type != UserType.PROVIDER)
            throw { status: 403, message: "this user is not a provider" };
        await tx.provider.delete({
            where: {
                userId,
            },
        });
        await tx.auditLog.create({
            data: {
                action: AdminAction.PROVIDER_REMOVED,
                performedBy: req.user!.id,
                targetId: userId,
            }
        });
        logger.info({
            event_action: "admin_remove_provider",
            admin_id: req.user!.id,
            provider_id: userId,
        });
        return (await tx.user.update({
            where: {
                id: userId
            },
            data: {
                type: UserType.CLIENT
            }
        }));
    })
    res.status(200).json({message: "Provider successfully converted to client",
        data: {
            id: user.id,
            type: user.type
        }
    });
})

export const getLOgs = asyncHandler(async (req: Request, res: Response) => {
    const logs = await prisma.auditLog.findMany({
        orderBy: {
            createdAt: "desc"
        },
        select: {
            action: true,
            performedBy: true,
            targetId: true,
            createdAt: true
        }
    });

    res.status(200).json({
        data: {logs},
    });
})