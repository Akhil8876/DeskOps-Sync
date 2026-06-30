import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Square, Plus, Trash2, MessageSquare, Sparkles } from "lucide-react";
import { cn, formatRelativeTime, truncate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useAgentStream, type ToolCall } from "@/hooks/useAgentStream";
import { MessageBubble } from "./MessageBubble";
import { QuickActions } from "./QuickActions";
import type { Conversation, Message } from "@shared/schema";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  streaming?: boolean;
  error?: string;
}

export function ChatInterface() {
  const qc = useQueryClient();
  const { sendMessage, isStreaming, abort } = useAgentStream();
  const [activeConvoId, setActiveConvoId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Conversations list
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: () => apiRequest("/conversations"),
  });

  // Load messages when switching conversations
  const { data: serverMessages } = useQuery<Message[]>({
    queryKey: ["messages", activeConvoId],
    queryFn: () => apiRequest(`/conversations/${activeConvoId}/messages`),
    enabled: !!activeConvoId,
  });

  useEffect(() => {
    if (serverMessages) {
      setMessages(
        serverMessages.map((m) => ({
          id: String(m.id),
          role: m.role as "user" | "assistant",
          content: m.content,
          toolCalls: m.toolCalls as ToolCall[] | undefined,
        }))
      );
    }
  }, [serverMessages]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const createConversation = useMutation({
    mutationFn: () => apiRequest<Conversation>("/conversations", { method: "POST" }),
    onSuccess: (convo) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setActiveConvoId(convo.id);
      setMessages([]);
    },
  });

  const deleteConversation = useMutation({
    mutationFn: (id: number) => apiRequest(`/conversations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setActiveConvoId(null);
      setMessages([]);
    },
  });

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isStreaming) return;

    let convoId = activeConvoId;
    if (!convoId) {
      const convo = await createConversation.mutateAsync();
      convoId = convo.id;
    }

    setInput("");

    // Add user message immediately
    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: msg },
      { id: assistantMsgId, role: "assistant", content: "", toolCalls: [], streaming: true },
    ]);

    await sendMessage(convoId, msg, (event) => {
      if (event.type === "text") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: m.content + (event.content ?? "") } : m
          )
        );
      } else if (event.type === "tool_start") {
        const newTool: ToolCall = {
          name: event.toolName!,
          input: event.toolInput,
          status: "running",
        };
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, toolCalls: [...(m.toolCalls ?? []), newTool] }
              : m
          )
        );
      } else if (event.type === "tool_result") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  toolCalls: (m.toolCalls ?? []).map((t) =>
                    t.name === event.toolName && t.status === "running"
                      ? { ...t, result: event.toolResult, status: "done" as const }
                      : t
                  ),
                }
              : m
          )
        );
      } else if (event.type === "done") {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, streaming: false } : m))
        );
        qc.invalidateQueries({ queryKey: ["conversations"] });
        qc.invalidateQueries({ queryKey: ["messages", convoId] });
      } else if (event.type === "error") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, streaming: false, error: event.error }
              : m
          )
        );
      }
    });
  }, [input, isStreaming, activeConvoId, sendMessage, createConversation, qc]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmptyState = messages.length === 0;

  return (
    <div className="flex h-full bg-[var(--color-background)]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[var(--color-text)]">Aria</h1>
              <p className="text-[10px] text-[var(--color-text-subtle)]">AI Commerce Agent</p>
            </div>
          </div>
        </div>

        {/* New chat button */}
        <div className="px-3 py-3">
          <button
            onClick={() => createConversation.mutate()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New conversation
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {conversations.length === 0 && (
            <p className="text-xs text-[var(--color-text-subtle)] text-center py-6 px-4">
              No conversations yet. Start one above.
            </p>
          )}
          {conversations.map((convo) => (
            <div
              key={convo.id}
              className={cn(
                "group flex items-start gap-2 px-2 py-2 rounded-[var(--radius-md)] cursor-pointer transition-colors",
                activeConvoId === convo.id
                  ? "bg-[var(--color-surface-3)] text-[var(--color-text)]"
                  : "hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
              )}
              onClick={() => {
                setActiveConvoId(convo.id);
                setMessages([]);
              }}
            >
              <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--color-text-subtle)]" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{truncate(convo.title, 28)}</p>
                <p className="text-[10px] text-[var(--color-text-subtle)]">{formatRelativeTime(convo.updatedAt)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation.mutate(convo.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--color-surface-3)] text-[var(--color-text-subtle)] hover:text-[var(--color-danger)] transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--color-border)]">
          <p className="text-[10px] text-[var(--color-text-subtle)] text-center">
            Powered by Aria AI
          </p>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              {activeConvoId ? conversations.find(c => c.id === activeConvoId)?.title ?? "Conversation" : "E-Commerce Operations"}
            </h2>
            <p className="text-xs text-[var(--color-text-subtle)]">
              {isStreaming ? "Aria is thinking…" : "Ask me anything about your store"}
            </p>
          </div>
          {isStreaming && (
            <button
              onClick={abort}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)] transition-colors"
            >
              <Square className="w-3 h-3" />
              Stop
            </button>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {isEmptyState ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 px-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-[var(--color-accent-dim)] flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-[var(--color-accent)]" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                  Hi, I'm Aria
                </h2>
                <p className="text-sm text-[var(--color-text-muted)] max-w-sm leading-relaxed">
                  Your AI-powered e-commerce operations assistant. I can manage products, process orders, analyze your store performance, and much more — just ask.
                </p>
              </div>
              <div className="w-full max-w-lg">
                <QuickActions onSelect={handleSend} />
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-4 py-4 border-t border-[var(--color-border)] shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] px-4 py-3 focus-within:border-[var(--color-accent)] transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your store…"
                rows={1}
                disabled={isStreaming}
                className="flex-1 bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] resize-none outline-none leading-relaxed min-h-[24px] max-h-[160px] disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-[var(--color-text-subtle)] text-center mt-2">
              Shift+Enter for new line · Enter to send
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
