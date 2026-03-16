import { pool } from "../config/database";

export interface ChatSession {
  id: number;
  company_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  company_id: number;
  role: "user" | "assistant";
  content: string;
  intent: string | null;
  action_data: any | null;
  tx_result: any | null;
  created_at: string;
}

export class ChatRepository {
  static async createSession(companyId: number, title = "New Chat"): Promise<ChatSession> {
    const r = await pool.query<ChatSession>(`INSERT INTO chat_sessions (company_id, title) VALUES ($1, $2) RETURNING *`, [
      companyId,
      title,
    ]);
    return r.rows[0];
  }

  static async listSessions(companyId: number): Promise<ChatSession[]> {
    const r = await pool.query<ChatSession>(`SELECT * FROM chat_sessions WHERE company_id = $1 ORDER BY updated_at DESC LIMIT 30`, [
      companyId,
    ]);
    return r.rows;
  }

  static async getSession(id: number, companyId: number): Promise<ChatSession | null> {
    const r = await pool.query<ChatSession>(`SELECT * FROM chat_sessions WHERE id = $1 AND company_id = $2`, [id, companyId]);
    return r.rows[0] ?? null;
  }

  static async touchSession(id: number): Promise<void> {
    await pool.query(`UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`, [id]);
  }

  static async updateSessionTitle(id: number, title: string): Promise<void> {
    await pool.query(`UPDATE chat_sessions SET title = $1, updated_at = NOW() WHERE id = $2`, [title, id]);
  }

  static async getMessages(sessionId: number, companyId: number): Promise<ChatMessage[]> {
    const r = await pool.query<ChatMessage>(
      `SELECT * FROM chat_messages WHERE session_id = $1 AND company_id = $2 ORDER BY created_at ASC`,
      [sessionId, companyId],
    );
    return r.rows;
  }

  static async addMessage(data: {
    session_id: number;
    company_id: number;
    role: "user" | "assistant";
    content: string;
    intent?: string | null;
    action_data?: any;
    tx_result?: any;
  }): Promise<ChatMessage> {
    const r = await pool.query<ChatMessage>(
      `INSERT INTO chat_messages (session_id, company_id, role, content, intent, action_data, tx_result)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        data.session_id,
        data.company_id,
        data.role,
        data.content,
        data.intent ?? null,
        data.action_data ? JSON.stringify(data.action_data) : null,
        data.tx_result ? JSON.stringify(data.tx_result) : null,
      ],
    );
    await this.touchSession(data.session_id);
    return r.rows[0];
  }

  static async deleteSession(id: number, companyId: number): Promise<void> {
    await pool.query(`DELETE FROM chat_sessions WHERE id = $1 AND company_id = $2`, [id, companyId]);
  }
}
