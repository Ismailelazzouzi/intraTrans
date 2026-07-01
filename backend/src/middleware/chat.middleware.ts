import prisma from "../config/database";
import { UserType } from "@prisma/client";
import { groupChat_schema , message_schema} from "../utils/zod_shema"
import { Request, Response, NextFunction} from "express"

export const groupChatValidation = (req: Request, res: Response, next: NextFunction) => {
    const result = groupChat_schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid group chat request"
        });
    }
    req.body = result.data;
    next();
}

export const contentValidation = (req: Request, res: Response, next: NextFunction) => {
    if (req.file)
        return next();

    const result = message_schema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: result.error.issues[0].message
        });
    }

    next();
};

export const checkBlock = async (req: Request, res: Response, next: NextFunction) => {
    const targetId = req.params.targetId as string;
    const userId = req.user!.id;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }
    const provider = await prisma.provider.findFirst({
        where: {
            OR: [
                {userId},
                {userId: targetId}
            ]
        }
    });
    if (!provider)
        return (res.status(400).json({message: "it should be at least one provider"}));
    const userRelationId = (req.user!.type === UserType.CLIENT ? userId: targetId);
    const providerId = provider.id;
    const blocked = await prisma.trustedRelation.findFirst({
        where: {
            blockedById: {not: null},
            userId: userRelationId,
            providerId,
        }
    });
    if (blocked) {
        return res.status(403).json({
            message: "You blocked this user"
        });
    }
    return (next());
}

export const checkBlockGroup = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const {participantIds} = req.body;
    const providers = await prisma.provider.findMany({
        where: {
            userId: {in: participantIds.filter((id: string) => id !== userId)}
        }
    });
    const expectedCount = participantIds.filter((id: string) => id !== userId).length;
    if (providers.length !== expectedCount)
        return (res.status(400).json({message: "All participants must be providers"}));
    const providerIds = providers.map(p => p.id);
    const blocked = await prisma.trustedRelation.findFirst({
        where: {
            userId,
            providerId: {in: providerIds},
            blockedById: { not: null }
        }
    });
    if (blocked)
        return (res.status(403).json({message: "You cannot add blocked provider to the group", blockedId: blocked.providerId}));
    return next();
}

export const checkPrivateChatBlock = async (req: Request, res: Response, next: NextFunction) => {
    const currentUserId = req.user!.id;
    const conversationId = req.params.conversationId as string;

    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: true }
    });
    if (!conversation)
        return res.status(404).json({ message: "Conversation not found" });
    if (conversation.isGroup)
        return next();

    const other = conversation.participants.find(
        (p) => p.userId !== currentUserId
    );
    if (!other)
        return res.status(400).json({ message: "Invalid conversation" });

    const currentUserProvider = await prisma.provider.findUnique({ where: { userId: currentUserId } });
    const otherProvider = await prisma.provider.findUnique({ where: { userId: other.userId } });
    if (!currentUserProvider && !otherProvider)
        return next();
    const clientId = currentUserProvider ? other.userId : currentUserId;
    const providerId = currentUserProvider ? currentUserProvider.id : otherProvider!.id;
    const blocked = await prisma.trustedRelation.findFirst({
        where: {
            userId: clientId,
            providerId,
            blockedById: { not: null }
        }
    });
    if (blocked) {
        return res.status(403).json({ message: "This conversation is blocked" });
    }
    return next();
};
