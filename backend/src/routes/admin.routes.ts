import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { rev_middleware } from "../middleware/review.middleware";
import { adminOnly , rootOnly} from "../middleware/adminOnly.middleware";
import { adminStats, getUsers , getAdmins, checkUser, 
    reviewProvider, becomeAdmin, deleteUser, getLOgs, removeProvider} from "../controllers/admin.controller";

const router = express.Router();

router.get("/dashboard/stats", authMiddleware, adminOnly, adminStats);
router.get("/dashboard/users", authMiddleware, adminOnly, getUsers);
router.get("/dashboard/admins", authMiddleware, adminOnly, getAdmins);
router.get("/dashboard/users/:id/check", authMiddleware, adminOnly, checkUser);
router.get("/dashboard/logs", authMiddleware, rootOnly, getLOgs);
router.patch("/dashboard/users/:id/check/review", authMiddleware, adminOnly, rev_middleware, reviewProvider);
router.patch("/dashboard/users/:id/becomeAdmin", authMiddleware, rootOnly, becomeAdmin);
router.delete("/dashboard/providers/:id/delete", authMiddleware, adminOnly, removeProvider);
router.delete("/dashboard/users/:id/delete", authMiddleware, adminOnly, deleteUser);


export default router;