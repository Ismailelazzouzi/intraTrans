import express from "express";
import {switcher} from "../controllers/switch.controller"
import { getProvider } from "../controllers/getProvider.controller";

import validation_middl from "../middleware/provider_validate.middleware"
import upload_middl from "../middleware/upload.middleware"
import { authMiddleware } from '../middleware/auth.middleware'


const router = express.Router();

router.post("/apply", authMiddleware, upload_middl, validation_middl, switcher);
router.get("/me", authMiddleware, getProvider);

export default router;
