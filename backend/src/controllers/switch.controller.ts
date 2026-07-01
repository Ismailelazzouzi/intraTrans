import prisma from "../config/database"
import { VerificationStatus } from "@prisma/client";
import { UserType } from "@prisma/client";
import { Request, Response } from "express";
import logger from "../config/logger";
import { asyncHandler } from "../utils/asyncHandler";

const switcher = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const {license, idVerificationImg, profession, description} = req.body;

    if (!license || !idVerificationImg || !profession) {
        logger.warn({
            event_action: "provider_application_failed",
            user_id: userId,
            reason: "missing_required_fields",
        });
        return res.status(400).json({error: "Missing required fields: license, idVerificationImg, and profession are required"});
    }

    // Check for existing provider application
    const is_exist = await prisma.provider.findUnique({
        where: {
            userId: userId,
        },
    });
    
    if (is_exist) {
        if (is_exist.isVerified == VerificationStatus.PENDING) {
            logger.warn({
                event_action: "provider_application_failed",
                user_id: userId,
                reason: "already_has_pending_application",
            });
            return (res.status(400).json({error: "waiting to be approved for role switching"}));
        }
        else if (is_exist.isVerified == VerificationStatus.VERIFIED) {
            logger.warn({
                event_action: "provider_application_failed",
                user_id: userId,
                reason: "already_provider",
            });
            return (res.status(400).json({error: "this user is already a service provider"}));
        }
    }

    await prisma.user.update({
        where : {
            id: req.user!.id,
        },
        data : {
            type: UserType.PENDING,
        }
    });

    const user = await prisma.provider.create({
        data : {
            userId: userId,
            license: license,
            idVerificationImg: idVerificationImg,
            profession: profession,
            isVerified: VerificationStatus.PENDING,
            description: description,
        },
    });

    logger.info({
        event_action: "provider_application_created",
        user_id: userId,
        status: "PENDING",
        profession: user.profession,
    });

    res.status(201).json({
        data: {
            id: user.id,
            VerificationStatus: "PENDING",
            profession: user.profession,
            license: user.license,
            idVerificationImg: user.idVerificationImg,
        },
    });
});

export {switcher}; 
