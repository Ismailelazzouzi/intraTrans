import prisma from "../config/database";
import { Request, Response } from "express";
import { getIO } from "../config/socket";
import { MessageType } from "@prisma/client";
import logger from "../config/logger";
import { asyncHandler } from "../utils/asyncHandler";
import path from "path"

export const openConversation = asyncHandler(async (req: Request, res: Response) => {
    const senderId = req.user!.id;
    const targetId = req.params.targetId as string;

    const targetUser = await prisma.user.findUnique({
        where: {
            id: targetId,
            deletedAt: null
        }
    });
    if (!targetUser) {
        return res.status(404).json({
            message: "User not found"
        });
    }
    if (senderId === targetId) {
        return res.status(400).json({
            message: "Cannot open conversation with yourself"
        });
    }
    const conversation = await prisma.conversation.findFirst({
        where:{
            isGroup: false,
            AND: [
                {
                    participants: {
                        some: {userId: senderId}
                    }
                },
                {
                    participants: {
                        some: {userId: targetId}
                    }
                }
            ]
        },
        include: {
            messages: {
                orderBy: {
                    createdAt: "asc"
                }
            }
        }
    });
    if (conversation) {
        return (res.status(200).json({conversationId: conversation.id , messages: conversation.messages}));
    }
    const newConversation = await prisma.conversation.create({
        data: {
            isGroup:false,
            participants: {
                create: [
                    {userId: senderId},
                    {userId: targetId},
                ]
            }
        },
    });
    const io = getIO();
    io.to(`user:${targetId}`).emit("newConversation", newConversation);

    logger.info({
        event_action: "chat_conversation_created",
        user_id: senderId,
        target_id: targetId,
        conversation_id: newConversation.id,
    });

    res.status(201).json({message: "the new conversation created",
        conversationId: newConversation.id
    });
});

export const groupConversation = asyncHandler(async (req: Request, res: Response) => {
    const {name, participantIds} = req.body;
    
    const conversation = await prisma.conversation.create({
        data: {
            name,
            isGroup: true,
        }
    });
    if (!conversation) {
        logger.error({
            event_action: "group_chat_creation_failed",
            user_id: req.user!.id,
            reason: "conversation_not_created",
        });
        return (res.status(500).json({message: "the conversation not created"}));
    }
    const allParticipantIds = Array.from(new Set(
        [
            req.user!.id,
            ...participantIds
        ]
    ));
    await prisma.conversationParticipant.createMany({
        data: allParticipantIds.map((id:string)=>({
            conversationId: conversation.id,
            userId:id
        }))
    });
    const io = getIO();

    for (const participantId of participantIds) {
        io.to(`user:${participantId}`)
            .emit("newConversation", conversation);
    }
    logger.info({
        event_action: "group_chat_created",
        creator_id: req.user!.id,
        conversation_id: conversation.id,
        participant_count: allParticipantIds.length,
    });
    res.status(201).json({message: "the group chat created successfully", conversationId: conversation.id});
});

export const messageSender = asyncHandler(async (req: Request, res: Response) => {
    const conversationId = req.params.conversationId as string;
    const userId = req.user!.id;

    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            participants: {
                some: { userId }
            }
        }
    });
    if (!conversation) {
        return res.status(403).json({
            message: "You are not allowed in this conversation"
        });
    }
    const isFile = !!req.file;
    if (!isFile && !req.body.content) {
        return res.status(400).json({ message: "Message is empty" });
    }
    const messageType = isFile ? MessageType.FILE : MessageType.TEXT;
    const message = await prisma.message.create({
        data: {
            conversationId,
            senderId: userId,
            type: messageType,
            content: isFile ? req.file!.filename : req.body.content
        }
    });
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
    });
    const io = getIO();
    io.to(`conversation:${conversationId}`).emit("newMessage", message);

    logger.info({
        event_action: "chat_message_sent",
        sender_id: userId,
        conversation_id: conversationId,
        message_type: messageType,
    });

    return res.status(201).json({
        message: "sent successfully",
        data: message
    });
});

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const conversations = await prisma.conversation.findMany({
        where: {
            participants: {
                some: {
                    userId: req.user!.id
                }
            }
        },
        include: {
            participants: {
                select: {
                    userId: true
                }
            },
            messages: {
                orderBy: {
                    createdAt: "desc"
                },
                take: 1
            }
        },
        orderBy: {
            updatedAt: "desc"
        }
    });
    res.status(200).json({conversations});
});

export const getConversationMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const conversationId = req.params.conversationId as string;

    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            participants: {
                some: {
                    userId: userId
                }
            }
        },
        include: {
            messages: {
                orderBy: {
                    createdAt: "asc"
                }
            }
        }
    });

    if (!conversation) {
        return res.status(403).json({
            message: "You are not allowed to access this conversation"
        });
    }

    return res.status(200).json({
        messages: conversation.messages
    });
});

export const getUploadFile = async (req: Request, res: Response) => {
    const fileName = path.basename(req.params.filename as string);
    const filePath = path.join(__dirname, "../../uploads", fileName);
    const conversationId = req.params.conversationId as string;
    const userId = req.user!.id;

    const participant = await prisma.conversationParticipant.findFirst({
        where: {
            conversationId,
            userId
        }
    });
    if (!participant)
        return res.status(403).send("Forbidden");
    const message = await prisma.message.findFirst({
        where: {
            conversationId,
            type: MessageType.FILE,
            content: fileName
        }
    });
    if (!message)
        return (res.status(404).send("File not found"));
    res.sendFile(filePath, (err) => {
        if (err) {
            return res.status(404).send("File not found");
        }
    });
}
