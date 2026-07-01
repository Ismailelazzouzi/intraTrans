import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";

import {
    relationRequest,
    getSendedRequests,
    getReceivedRequests,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    cancelRelation,
    userRelations,
    providerRelations,
    blockRelation,
    deblockedRelation,
    bolcedrelations
} from "../controllers/trustedRelation.controller";

const router = express.Router();

router.post("/request/:providerId", authMiddleware, relationRequest);
router.get("/request/sent", authMiddleware, getSendedRequests);
router.get("/request/received", authMiddleware, getReceivedRequests);

router.patch("/request/:relationId/accept", authMiddleware, acceptRequest);
router.patch("/request/:relationId/reject", authMiddleware, rejectRequest);
router.delete("/request/:relationId/cancel", authMiddleware, cancelRequest);

router.get("/relations", authMiddleware, userRelations);
router.get("/providerRelations", authMiddleware, providerRelations);
router.delete("/relations/:relationId", authMiddleware, cancelRelation);

router.post("/block/:relationId", authMiddleware, blockRelation);
router.post("/unblock/:relationId", authMiddleware, deblockedRelation);
router.get("/block/list", authMiddleware, bolcedrelations);


export default router;