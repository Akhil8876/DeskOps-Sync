import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Square, Sparkles, Eraser } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAgentStream, type ToolCall } from "@/hooks/useAgentStream";
import { MessageBubble } from "@/components/chat/MessageBubble";
import type { Conversation } from "@shared/schema";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  streaming?: boolean;
  error?: string;
}

const SUGGESTIONS = [
  "Show me the most recent orders",
  "Which products are low on stock?",
  "What's my total revenue?",
];

// Tools that mutate data — refetch the dashboard after these run
const MUTATING_TOOLS = new Set([
  "update_order_status", "process_refund", "manage_inventory",
  "update_product", "create_discount_code", "send_customer_notification",
]);

export function AriaChatPanel() {
  const qc = useQueryClient();
  const { sendMessage, isStreaming, abort } = useAgentStream();
  const [convoId, setConvoId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ensureConversation = useCallback(async (): Promise<number> => {
    if (convoId) return convoId;
    const convo = await apiRequest<Conversation>("/conversations", { method: "POST" });
    setConvoId(convo.id);
    return convo.id;
  }, [convoId]);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isStreaming) return;

    const id = await ensureConversation();
    setInput("");

    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: msg },
      { id: assistantId, role: "assistant", content: "", toolCalls: [], streaming: true },
    ]);

    let didMutate = false;

    await sendMessage(id, msg, (event) => {
      if (event.type === "text") {
        setMessages((prev) => prev.map((m) =>
          m.id === assistantId ? { ...m, content: m.content + (event.content ?? "") } : m));
      } else if (event.type === "tool_start") {
        if (MUTATING_TOOLS.has(event.toolName!)) didMutate = true;
        setMessages((prev) => prev.map((m) =>
          m.id === assistantId
            ? { ...m, toolCalls: [...(m.toolCalls ?? []), { name: event.toolName!, input: event.toolInput, status: "running" as const }] }
            : m));
      } else if (event.type === "tool_result") {
        setMessages((prev) => prev.map((m) =>
          m.id === assistantId
            ? { ...m, toolCalls: (m.toolCalls ?? []).map((t) =>
                t.name === event.toolName && t.status === "running"
                  ? { ...t, result: event.toolResult, status: "done" as const } : t) }
            : m));
      } else if (event.type === "done") {
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m));
        if (didMutate) {
          qc.invalidateQueries({ queryKey: ["analytics"] });
          qc.invalidateQueries({ queryKey: ["admin-orders"] });
          qc.invalidateQueries({ queryKey: ["admin-products"] });
        }
      } else if (event.type === "error") {
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, streaming: false, error: event.error } : m));
      }
    });
  }, [input, isStreaming, ensureConversation, sendMessage, qc]);

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[var(--color-text)]">Aria</p>
            <p className="text-[10px] text-[var(--color-text-subtle)]">{isStreaming ? "Working…" : "Ask about your store"}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setConvoId(null); }}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-subtle)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
            title="New chat"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-4 text-center">
            <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--color-accent-dim)] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[var(--color-accent)]" />
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">Ask me to manage orders, inventory, customers, and more.</p>
            <div className="w-full space-y-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="w-full text-left px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-2">
            {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[var(--color-border)] shrink-0">
        <div className="flex items-end gap-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 focus-within:border-[var(--color-accent)] transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Message Aria…"
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] resize-none outline-none max-h-24 disabled:opacity-50"
          />
          {isStreaming ? (
            <button onClick={abort} className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--color-surface-3)] flex items-center justify-center text-[var(--color-danger)] shrink-0">
              <Square className="w-3 h-3" />
            </button>
          ) : (
            <button onClick={() => handleSend()} disabled={!input.trim()} className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--color-accent)] flex items-center justify-center text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-40 shrink-0">
              <Send className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
