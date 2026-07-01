import prisma from "../config/database";
import { TrustedRelationStatus, UserType } from "@prisma/client";
import { Request, Response } from "express";
import logger from "../config/logger";
import { asyncHandler } from "../utils/asyncHandler";

export const relationRequest = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const providerId = req.params.providerId as string;

    // Validate providerId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(providerId)) {
        return res.status(400).json({message: "Invalid provider ID format"});
    }

    // Check if target provider exists
    const provider = await prisma.provider.findUnique({
        where: { id: providerId },
    });
    if (!provider) {
        return res.status(404).json({message: "Provider not found"});
    }
    if (provider.userId === userId) {
        return res.status(400).json({message: "Cannot send a trusted relation request to yourself"});
    }

    const relation = await prisma.trustedRelation.findUnique({
        where: {
            userId_providerId: {
                userId,
                providerId
            },
        }
    });
    if (relation) {
        if (relation.blockedById) {
            logger.warn({
                event_action: "trusted_relation_request_blocked",
                sender_id: userId,
                provider_id: providerId,
                reason: "relation_blocked",
            });
            return (res.status(400).json({message: "the relation is blocked"}));
        }
        if (relation.status === TrustedRelationStatus.REJECTED) {
            await prisma.trustedRelation.update({
                where: {
                    id: relation.id,
                },
                data: {
                    status: TrustedRelationStatus.PENDING,
                    updatedAt: new Date()
                }
            });
            logger.info({
                event_action: "trusted_relation_request",
                sender_id: userId,
                provider_id: providerId,
                status: "re_requested",
            });
            return (res.status(200).json({message: "request sent successfully"}));
        }
        if (relation.status === TrustedRelationStatus.ACCEPTED) {
            return (res.status(400).json({message: "already in relations list"}));
        }
        if (relation.status === TrustedRelationStatus.PENDING) {
            return (res.status(400).json({message: "the request already sent and is waiting for provider response"}));
        }
    }
    await prisma.trustedRelation.create({
        data: {
            userId,
            providerId,
            status: TrustedRelationStatus.PENDING,
        }
    });

    logger.info({
        event_action: "trusted_relation_request",
        sender_id: userId,
        provider_id: providerId,
        status: "sent",
    });

    res.status(201).json({message: "relation requested successfully"});
});

export const getSendedRequests = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    if (req.user!.type != UserType.CLIENT)
        return (res.status(403).json({message: "the provider cannot send a request"}));
    const relationRequests = await prisma.trustedRelation.findMany({
        where: {
            userId: userId,
            status: TrustedRelationStatus.PENDING,
            blockedById: null
        }
    });
    res.status(200).json({relationRequests});
});

export const getReceivedRequests = asyncHandler(async (req: Request, res: Response) => {
    if (req.user!.type != UserType.PROVIDER)
        return (res.status(403).json({message: "the user cannot receive a request"}));
    const provider = await prisma.provider.findUnique({
        where: {
            userId: req.user!.id,
        }
    });
    if (!provider)
        return (res.status(403).json({message: "not a provider"}));
    const providerId = provider.id;
    const relationRequests = await prisma.trustedRelation.findMany({
        where: {
            providerId,
            status: TrustedRelationStatus.PENDING,
            blockedById: null
        }
    });
    res.status(200).json({relationRequests});
});

export const acceptRequest = asyncHandler(async (req: Request, res: Response) => {
    const relationId = req.params.relationId as string;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(relationId)) {
        return res.status(400).json({message: "Invalid relation ID format"});
    }
    if (req.user!.type != UserType.PROVIDER)
        return (res.status(403).json({message: "the client cannot accept a relation request"}));
    const relation = await prisma.trustedRelation.findUnique({
        where: {
            id: relationId
        }
    });
    if (!relation)
        return (res.status(404).json({message: "relation request not found"}));
    // Verify ownership: only the targeted provider can accept
    const provider = await prisma.provider.findUnique({
        where: { userId: req.user!.id }
    });
    if (!provider || provider.id !== relation.providerId)
        return (res.status(403).json({message: "you are not the target provider of this request"}));
    if (relation.blockedById)
        return (res.status(400).json({message: "the relation is blocked"}));
    if (relation.status != TrustedRelationStatus.PENDING)
        return (res.status(400).json({message: "the request is not in pending status"}));
    const updatedRelation = await prisma.trustedRelation.update({
        where: {
            id: relationId
        },
        data: {
            status: TrustedRelationStatus.ACCEPTED,
            updatedAt: new Date(),
        }
    });

    logger.info({
        event_action: "trusted_relation_accepted",
        relation_id: relationId,
        user_id: req.user!.id,
    });

    return (res.status(200).json({updatedRelation}));
});

export const rejectRequest = asyncHandler(async (req: Request, res: Response) => {
    const relationId = req.params.relationId as string;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(relationId)) {
        return res.status(400).json({message: "Invalid relation ID format"});
    }
    if (req.user!.type != UserType.PROVIDER)
        return (res.status(403).json({message: "the client cannot reject a relation request"}));
    const relation = await prisma.trustedRelation.findUnique({
        where: {
            id: relationId
        }
    });
    if (!relation)
        return (res.status(404).json({message: "relation request not found"}));
    // Verify ownership
    const provider = await prisma.provider.findUnique({
        where: { userId: req.user!.id }
    });
    if (!provider || provider.id !== relation.providerId)
        return (res.status(403).json({message: "you are not the target provider of this request"}));
    if (relation.blockedById)
        return (res.status(400).json({message: "the relation is blocked"}));
    if (relation.status != TrustedRelationStatus.PENDING)
        return (res.status(400).json({message: "the request is not in pending status"}));
    const updatedRelation = await prisma.trustedRelation.update({
        where: {
            id: relationId
        },
        data: {
            status: TrustedRelationStatus.REJECTED,
            updatedAt: new Date(),
        }
    });

    logger.info({
        event_action: "trusted_relation_rejected",
        relation_id: relationId,
        user_id: req.user!.id,
    });

    return (res.status(200).json({updatedRelation}));
});

export const cancelRequest = asyncHandler(async (req: Request, res: Response) => {
    const relationId = req.params.relationId as string;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(relationId)) {
        return res.status(400).json({message: "Invalid relation ID format"});
    }
    if (req.user!.type != UserType.CLIENT)
        return (res.status(403).json({message: "the provider cannot cancel a request"}));
    const relation = await prisma.trustedRelation.findFirst({
        where: {
            id: relationId,
            userId: req.user!.id,
            status: TrustedRelationStatus.PENDING
        }
    });
    if (!relation)
        return (res.status(404).json({message: "the request not found or wrong user"}));
    if (relation.blockedById)
        return (res.status(400).json({message: "the relation is blocked"}));
    await prisma.trustedRelation.delete({
        where: {
            id: relationId
        }
    });

    logger.info({
        event_action: "trusted_relation_cancelled",
        relation_id: relationId,
        user_id: req.user!.id,
    });

    res.status(200).json({message: "the request canceled successfully"});
});

export const cancelRelation = asyncHandler(async (req: Request, res: Response) => {
    const relationId = req.params.relationId as string;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(relationId)) {
        return res.status(400).json({message: "Invalid relation ID format"});
    }
    const provider = await prisma.provider.findUnique({
        where: {
            userId: req.user!.id,
        }
    });
    if (!provider)
        return (res.status(403).json({message: "providers only"}));
    const providerId = provider?.id;
    const relation = await prisma.trustedRelation.findFirst({
        where: {
            id: relationId,
            providerId,
            status: TrustedRelationStatus.ACCEPTED
        }
    });
    if (!relation)
        return (res.status(404).json({message: "the relation not found or wrong provider"}));
    if (relation.blockedById)
        return (res.status(400).json({message: "the relation is blocked"}));
    await prisma.trustedRelation.delete({
        where: {
            id: relationId
        }
    });

    logger.info({
        event_action: "trusted_relation_cancelled",
        relation_id: relationId,
        user_id: req.user!.id,
    });

    res.status(200).json({message: "the relation canceled successfully"});
});

export const userRelations = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    if (req.user!.type != UserType.CLIENT)
        return(res.status(403).json({message: "clients only"}));

    const acceptedRelation = await prisma.trustedRelation.findMany({
        where: {
            userId,
            status: TrustedRelationStatus.ACCEPTED,
            blockedById: null,
        }
    });
    return (res.status(200).json({acceptedRelation}));
});

export const providerRelations = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const provider = await prisma.provider.findUnique({
        where: {
            userId
        }
    });
    if (!provider)
        return (res.status(403).json({message: "providers only"}));
    const providerId = provider?.id;
    const acceptedRelation = await prisma.trustedRelation.findMany({
        where: {
            providerId,
            status: TrustedRelationStatus.ACCEPTED,
            blockedById: null,
        }
    });
    return (res.status(200).json({acceptedRelation}));
});

export const blockRelation = asyncHandler(async (req: Request, res: Response) => {
    const relationId = req.params.relationId as string;
    const userId = req.user!.id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(relationId)) {
        return res.status(400).json({message: "Invalid relation ID format"});
    }

    const relation = await prisma.trustedRelation.findFirst({
        where : {
            id: relationId,
            userId,
        }
    });
    if (!relation)
        return (res.status(404).json({message: "relation not found or you do not own this relation"}));
    if (relation.blockedById)
        return (res.status(400).json({message: "the relation is already blocked"}));
    const updatedRelation = await prisma.trustedRelation.update({
        where:{
            id: relationId,
        },
        data:{
            blockedById: userId,
        }
    });

    logger.info({
        event_action: "user_blocked_relation",
        relation_id: relationId,
        user_id: userId,
    });

    return (res.status(200).json({updatedRelation}));
});

export const deblockedRelation = asyncHandler(async (req: Request, res: Response) => {
    const relationId = req.params.relationId as string;
    const userId = req.user!.id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(relationId)) {
        return res.status(400).json({message: "Invalid relation ID format"});
    }

    const relation = await prisma.trustedRelation.findFirst({
        where : {
            id: relationId,
            userId,
        }
    });
    if (!relation)
        return (res.status(404).json({message: "relation not found or you do not own this relation"}));
    const updatedRelation = await prisma.trustedRelation.update({
        where:{
            id: relationId,
        },
        data:{
            blockedById: null
        }
    });

    logger.info({
        event_action: "user_unblocked_relation",
        relation_id: relationId,
        user_id: userId,
    });

    return (res.status(200).json({updatedRelation}));
});

export const bolcedrelations = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const relations = await prisma.trustedRelation.findMany({
        where: {
            blockedById: userId,
        }
    });
    return (res.status(200).json({relations}));
});
