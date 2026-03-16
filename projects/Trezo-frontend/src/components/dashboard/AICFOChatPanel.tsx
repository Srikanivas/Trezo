import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { chatAPI, ChatSession, ChatMessage } from "../../services/api";
import { Bot, Send, Plus, Trash2, ChevronLeft, Loader2, CheckCircle, XCircle, ExternalLink, MessageSquare, Sparkles } from "lucide-react";

export interface AICFOChatPanelHandle {
  prefill: (text: string) => void;
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
function renderContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) => (p.startsWith("**") ? <strong key={j}>{p.slice(2, -2)}</strong> : p));
    // Inline code `text`
    const withCode = parts.flatMap((p, j) =>
      typeof p === "string"
        ? p.split(/(`[^`]+`)/g).map((s, k) =>
            s.startsWith("`") ? (
              <code key={`${j}-${k}`} className="bg-gray-100 text-indigo-700 px-1 rounded text-xs font-mono">
                {s.slice(1, -1)}
              </code>
            ) : (
              s
            ),
          )
        : [p],
    );
    // Explorer links
    const withLinks = withCode.flatMap((p, j) => {
      if (typeof p !== "string") return [p];
      const m = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/.exec(p);
      if (!m) return [p];
      const [full, label, url] = m;
      const idx = p.indexOf(full);
      return [
        p.slice(0, idx),
        <a
          key={j}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-indigo-600 hover:underline text-xs"
        >
          {label} <ExternalLink className="h-3 w-3" />
        </a>,
        p.slice(idx + full.length),
      ];
    });
    return (
      <p key={i} className={line.startsWith("---") ? "border-t border-gray-200 my-2" : "leading-relaxed"}>
        {withLinks}
      </p>
    );
  });
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble: React.FC<{ msg: ChatMessage; onConfirm: () => void; onCancel: () => void; isPending: boolean }> = ({
  msg,
  onConfirm,
  onCancel,
  isPending,
}) => {
  const isUser = msg.role === "user";
  const hasAction = !!msg.action_data && !msg.tx_result && msg.content.includes("Reply **confirm**");
  const isExecuted = msg.intent === "EXECUTED" || !!msg.tx_result;

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold
        ${isUser ? "bg-indigo-600" : "bg-gradient-to-br from-purple-600 to-indigo-600"}`}
      >
        {isUser ? "U" : <Bot className="h-3.5 w-3.5" />}
      </div>

      <div className={`max-w-[82%] space-y-1.5 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm space-y-0.5
          ${
            isUser
              ? "bg-indigo-600 text-white rounded-tr-sm"
              : isExecuted
                ? "bg-green-50 border border-green-200 text-gray-800 rounded-tl-sm"
                : hasAction
                  ? "bg-amber-50 border border-amber-200 text-gray-800 rounded-tl-sm"
                  : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
          }`}
        >
          {renderContent(msg.content)}
        </div>

        {/* Confirm / Cancel buttons */}
        {hasAction && !isPending && (
          <div className="flex gap-2 mt-1">
            <button
              onClick={onConfirm}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Confirm & Execute
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        )}
        {hasAction && isPending && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Executing...
          </div>
        )}

        <span className="text-xs text-gray-400 px-1">
          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Show my balance",
  "Send 1 ALGO to ...",
  "Opt in to USDC",
  "Create invoice for 50 ALGO to CompanyName for services",
  "Create monthly budget of 200 ALGO",
  "Show my invoices",
];

// ─── Main Panel ───────────────────────────────────────────────────────────────
const AICFOChatPanel = forwardRef<AICFOChatPanelHandle>((_, ref) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  useImperativeHandle(ref, () => ({
    prefill: (text: string) => {
      setInput(text);
      inputRef.current?.focus();
    },
  }));

  const loadSessions = useCallback(async () => {
    const res = await chatAPI.listSessions();
    if (res.success && res.data) setSessions(res.data);
  }, []);

  const loadMessages = useCallback(async (sessionId: number) => {
    const res = await chatAPI.getMessages(sessionId);
    if (res.success && res.data) {
      setMessages(res.data);
      setTimeout(scrollToBottom, 50);
    }
  }, []);

  useEffect(() => {
    loadSessions().then(async () => {
      // Auto-open last session or create one
      const res = await chatAPI.listSessions();
      if (res.data && res.data.length > 0) {
        setActiveSession(res.data[0]);
        loadMessages(res.data[0].id);
      } else {
        const newRes = await chatAPI.createSession();
        if (newRes.data) {
          setActiveSession(newRes.data);
          setSessions([newRes.data]);
        }
      }
    });
  }, [loadSessions, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const newSession = async () => {
    const res = await chatAPI.createSession();
    if (res.data) {
      setActiveSession(res.data);
      setMessages([]);
      setSessions((s) => [res.data!, ...s]);
      setShowSidebar(false);
    }
  };

  const switchSession = async (s: ChatSession) => {
    setActiveSession(s);
    setShowSidebar(false);
    await loadMessages(s.id);
  };

  const deleteSession = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await chatAPI.deleteSession(id);
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (activeSession?.id === id) {
      if (updated.length > 0) {
        setActiveSession(updated[0]);
        loadMessages(updated[0].id);
      } else {
        const r = await chatAPI.createSession();
        if (r.data) {
          setActiveSession(r.data);
          setMessages([]);
          setSessions([r.data]);
        }
      }
    }
  };

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || !activeSession || sending) return;
    setInput("");
    setSending(true);

    // Optimistic user bubble
    const tempUser: ChatMessage = {
      id: Date.now(),
      session_id: activeSession.id,
      company_id: 0,
      role: "user",
      content,
      intent: null,
      action_data: null,
      tx_result: null,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, tempUser]);

    try {
      const res = await chatAPI.sendMessage(activeSession.id, content);
      if (res.data) {
        setMessages((m) => [...m.filter((x) => x.id !== tempUser.id), tempUser, res.data!]);
        // Refresh session list for title update
        loadSessions();
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const confirmAction = async () => {
    if (!activeSession || confirming) return;
    setConfirming(true);
    try {
      const res = await chatAPI.confirmAction(activeSession.id);
      if (res.data) setMessages((m) => [...m, res.data!]);
    } finally {
      setConfirming(false);
    }
  };

  const cancelAction = async () => {
    if (!activeSession) return;
    const res = await chatAPI.sendMessage(activeSession.id, "cancel");
    if (res.data) setMessages((m) => [...m, res.data!]);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Find last pending action message
  const lastPendingAction = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.action_data && !m.tx_result && m.content.includes("Reply **confirm**"));

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col" style={{ height: "520px" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setShowSidebar((v) => !v)} className="p-1 rounded-lg hover:bg-white/60 transition-colors">
            <MessageSquare className="h-4 w-4 text-indigo-600" />
          </button>
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 leading-none">AI CFO Agent</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{activeSession?.title ?? "..."}</p>
          </div>
        </div>
        <button
          onClick={newSession}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> New Chat
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        {showSidebar && (
          <div className="absolute inset-y-0 left-0 w-56 bg-white border-r border-gray-100 z-10 flex flex-col shadow-lg">
            <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Chat History</span>
              <button onClick={() => setShowSidebar(false)}>
                <ChevronLeft className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => switchSession(s)}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 group ${activeSession?.id === s.id ? "bg-indigo-50" : ""}`}
                >
                  <span
                    className={`text-xs truncate flex-1 ${activeSession?.id === s.id ? "text-indigo-700 font-medium" : "text-gray-700"}`}
                  >
                    {s.title}
                  </span>
                  <button
                    onClick={(e) => deleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="bg-indigo-100 p-4 rounded-2xl">
                <Sparkles className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">AI CFO Agent</p>
                <p className="text-xs text-gray-400 mt-1">Ask me to send payments, create invoices, manage budgets, or opt-in to assets.</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-xs">
                {SUGGESTIONS.slice(0, 4).map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-full hover:bg-indigo-100 transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onConfirm={confirmAction}
              onCancel={cancelAction}
              isPending={confirming && lastPendingAction?.id === msg.id}
            />
          ))}

          {sending && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-3 py-3 flex-shrink-0 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask AI CFO... (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-24 overflow-y-auto"
            style={{ minHeight: "40px" }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
});

AICFOChatPanel.displayName = "AICFOChatPanel";

export default AICFOChatPanel;
