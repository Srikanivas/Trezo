import OpenAI from "openai";
import { logger } from "../utils/logger";

const client = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

const SYSTEM_PROMPT = `You are the AI CFO Agent for Trezo — a Web3 corporate treasury management platform built on the Algorand blockchain.

Your ONLY scope is:
- Trezo platform features: treasury wallets, ALGO/ASA transactions, asset opt-in, invoices, budgets, payment history
- Algorand blockchain concepts: accounts, transactions, ASAs (Algorand Standard Assets), opt-in mechanics, fees, TestNet vs MainNet, block explorers
- General treasury/finance concepts as they relate to the Trezo platform

You MUST REFUSE any question outside this scope with exactly:
"I'm your Trezo AI CFO — I can only help with treasury management, Algorand transactions, invoices, and budgets."

Do NOT answer questions about: general coding, other blockchains, news, politics, personal advice, math problems, or anything unrelated to Trezo/Algorand treasury management.

When explaining Trezo features, be concise and practical. Use plain language. You can explain:
- How to send ALGO or ASA tokens
- What asset opt-in means and why it's required on Algorand
- How invoices and budgets work in Trezo
- What transaction fees look like on Algorand
- How to read a transaction ID or use the block explorer
- Treasury management best practices within the platform

Keep responses short and focused. Do not repeat yourself. Do not make up transaction data or balances — direct users to use the actual commands (e.g. "Show my balance") to get live data.`;

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export async function getOpenAIResponse(userMessage: string, history: ConversationMessage[] = []): Promise<string> {
  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      // Include last 10 messages for context (5 turns)
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userMessage },
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 400,
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content?.trim() ?? "I couldn't generate a response. Please try again.";
  } catch (err: any) {
    logger.error("OpenAI error:", err?.message);
    // Graceful fallback — don't crash the chat
    if (err?.status === 401) return "AI service authentication error. Please check the API key configuration.";
    if (err?.status === 429) return "AI service is rate limited. Please try again in a moment.";
    return "AI service is temporarily unavailable. You can still use commands like 'show my balance', 'send ALGO', etc.";
  }
}
