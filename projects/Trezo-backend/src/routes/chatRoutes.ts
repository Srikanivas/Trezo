import { Router } from "express";
import { ChatController } from "../controllers/chatController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
router.use(authenticateToken);

router.get("/sessions", ChatController.listSessions);
router.post("/sessions", ChatController.createSession);
router.delete("/sessions/:id", ChatController.deleteSession);
router.get("/sessions/:id/messages", ChatController.getMessages);
router.post("/sessions/:id/message", ChatController.sendMessage);
router.post("/sessions/:id/confirm", ChatController.confirmAction);

export default router;
