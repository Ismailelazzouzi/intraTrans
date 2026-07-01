import  express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { openConversation, messageSender, groupConversation, getConversations,
    getConversationMessages, getUploadFile } from "../controllers/chat.controller"
    import chatUploadFile, { validateUploadedFile } from "../middleware/uploadSingleFile.middleware"
import { groupChatValidation, checkBlock , checkBlockGroup, checkPrivateChatBlock, contentValidation} from "../middleware/chat.middleware";

const router = express.Router();

router.post("/conversations/open/:targetId", authMiddleware, checkBlock, openConversation);
router.post("/conversations/:conversationId/message", authMiddleware, checkPrivateChatBlock, chatUploadFile.single("file"), validateUploadedFile, contentValidation, messageSender);
router.post("/groupChat/create", authMiddleware, groupChatValidation, checkBlockGroup, groupConversation);
router.get("/conversations/get", authMiddleware, getConversations);
router.get("/conversations/:conversationId/getMessages", authMiddleware, getConversationMessages);
router.get("/conversations/:conversationId/:filename", authMiddleware, getUploadFile);

export default router;