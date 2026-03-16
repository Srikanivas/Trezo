import { Request, Response } from "express";
import { ChatRepository } from "../repositories/chatRepository";
import { parseIntent, buildReport, executeAction, handleReadQuery, IntentType } from "../services/chatService";
import { getOpenAIResponse, ConversationMessage } from "../services/openaiService";
import { logger } from "../utils/logger";

const READ_INTENTS: IntentType[] = ["CHECK_BALANCE", "LIST_INVOICES", "LIST_BUDGETS"];

export class ChatController {
  // GET /api/v1/chat/sessions
  static async listSessions(req: Request, res: Response): Promise<void> {
    const companyId = (req as any).companyId;
    const sessions = await ChatRepository.listSessions(companyId);
    res.json({ success: true, data: sessions });
  }

  // POST /api/v1/chat/sessions
  static async createSession(req: Request, res: Response): Promise<void> {
    const companyId = (req as any).companyId;
    const session = await ChatRepository.createSession(companyId);
    res.status(201).json({ success: true, data: session });
  }

  // DELETE /api/v1/chat/sessions/:id
  static async deleteSession(req: Request, res: Response): Promise<void> {
    const companyId = (req as any).companyId;
    await ChatRepository.deleteSession(parseInt(req.params.id), companyId);
    res.json({ success: true });
  }

  // GET /api/v1/chat/sessions/:id/messages
  static async getMessages(req: Request, res: Response): Promise<void> {
    const companyId = (req as any).companyId;
    const sessionId = parseInt(req.params.id);
    const session = await ChatRepository.getSession(sessionId, companyId);
    if (!session) {
      res.status(404).json({ success: false, error: "Session not found" });
      return;
    }
    const messages = await ChatRepository.getMessages(sessionId, companyId);
    res.json({ success: true, data: messages });
  }

  // POST /api/v1/chat/sessions/:id/message  — user sends a message
  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const sessionId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content?.trim()) {
        res.status(400).json({ success: false, error: "Message content required" });
        return;
      }

      const session = await ChatRepository.getSession(sessionId, companyId);
      if (!session) {
        res.status(404).json({ success: false, error: "Session not found" });
        return;
      }

      // Save user message
      await ChatRepository.addMessage({ session_id: sessionId, company_id: companyId, role: "user", content });

      // Auto-title session from first message
      if (session.title === "New Chat") {
        const title = content.slice(0, 50).trim();
        await ChatRepository.updateSessionTitle(sessionId, title);
      }

      // Parse intent
      const parsed = parseIntent(content);

      let replyContent: string;
      let intent: string = parsed.intent;
      let actionData: any = null;

      if (parsed.intent === "UNKNOWN" || parsed.intent === "HELP") {
        // Route through OpenAI for conversational responses
        const allMessages = await ChatRepository.getMessages(sessionId, companyId);
        // Build history excluding the message we just saved (last one)
        const history: ConversationMessage[] = allMessages
          .slice(0, -1) // exclude the user message we just added
          .slice(-12) // last 12 messages for context
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

        replyContent = await getOpenAIResponse(content, history);
      } else if (READ_INTENTS.includes(parsed.intent)) {
        // Read-only — answer immediately
        replyContent = await handleReadQuery(parsed.intent, companyId);
        if (!replyContent) replyContent = "I didn't understand that. Type **help** to see what I can do.";
      } else if (parsed.missingFields.length > 0) {
        // Missing required fields — ask for them
        replyContent = `I need a bit more info to proceed:\n${parsed.missingFields.map((f) => `• Missing: **${f}**`).join("\n")}\n\nPlease provide the missing details and try again.`;
      } else {
        // Build action report
        const report = await buildReport(parsed, companyId);
        actionData = report;

        if (report.errors.length > 0) {
          replyContent = `⚠️ I found some issues with your request:\n${report.errors.map((e) => `• ${e}`).join("\n")}\n\nPlease correct these and try again.`;
        } else {
          // Format confirmation report
          const warningBlock = report.warnings.length > 0 ? `\n\n⚠️ **Warnings:**\n${report.warnings.map((w) => `• ${w}`).join("\n")}` : "";
          const detailLines = Object.entries(report.details)
            .filter(([k]) => !["receiverCompanyId"].includes(k))
            .map(([k, v]) => `• **${k}**: ${v}`)
            .join("\n");
          replyContent = `📋 **Action Report**\n\n**${report.summary}**\n\n${detailLines}${warningBlock}\n\n---\nReply **confirm** to execute, or **cancel** to abort.`;
        }
      }

      const assistantMsg = await ChatRepository.addMessage({
        session_id: sessionId,
        company_id: companyId,
        role: "assistant",
        content: replyContent,
        intent,
        action_data: actionData,
      });

      res.json({ success: true, data: assistantMsg });
    } catch (err) {
      logger.error("sendMessage error:", err);
      res.status(500).json({ success: false, error: "Failed to process message" });
    }
  }

  // POST /api/v1/chat/sessions/:id/confirm  — user confirms pending action
  static async confirmAction(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const sessionId = parseInt(req.params.id);

      // Find the last assistant message with a pending action
      const messages = await ChatRepository.getMessages(sessionId, companyId);
      const lastAction = [...messages].reverse().find((m) => m.role === "assistant" && m.action_data && !m.tx_result);

      if (!lastAction?.action_data) {
        const msg = await ChatRepository.addMessage({
          session_id: sessionId,
          company_id: companyId,
          role: "assistant",
          content: "No pending action to confirm.",
        });
        res.json({ success: true, data: msg });
        return;
      }

      const report = lastAction.action_data;
      const result = await executeAction(report, companyId);

      // Update the action message with tx_result
      await (
        await import("../config/database")
      ).pool.query(`UPDATE chat_messages SET tx_result = $1 WHERE id = $2`, [JSON.stringify(result), lastAction.id]);

      let replyContent = result.message;
      if (result.txId) {
        replyContent += `\n\n🔗 **Transaction ID:** \`${result.txId}\`\n[View on Explorer](${result.explorerUrl})`;
      }

      const assistantMsg = await ChatRepository.addMessage({
        session_id: sessionId,
        company_id: companyId,
        role: "assistant",
        content: replyContent,
        intent: "EXECUTED",
        tx_result: result,
      });

      res.json({ success: true, data: assistantMsg });
    } catch (err) {
      logger.error("confirmAction error:", err);
      res.status(500).json({ success: false, error: "Execution failed" });
    }
  }
}
