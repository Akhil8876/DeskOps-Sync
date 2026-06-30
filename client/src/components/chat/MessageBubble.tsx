import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolCallCard } from "./ToolCallCard";
import { TypingIndicator } from "./TypingIndicator";
import type { ToolCall } from "@/hooks/useAgentStream";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  streaming?: boolean;
  error?: string;
}

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={cn("message-enter flex gap-3 py-4 px-4", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center shrink-0 mt-0.5",
        isUser
          ? "bg-[var(--color-accent)] text-white"
          : "bg-[var(--color-surface-3)] text-[var(--color-accent)]"
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className={cn("flex flex-col gap-1 max-w-[80%]", isUser ? "items-end" : "items-start")}>
        {isUser ? (
          <div className="bg-[var(--color-accent)] text-white rounded-[var(--radius-lg)] rounded-tr-[var(--radius-sm)] px-4 py-2.5 text-sm leading-relaxed">
            {message.content}
          </div>
        ) : (
          <div className="w-full">
            {/* Tool calls */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="mb-2">
                {message.toolCalls.map((tool, i) => (
                  <ToolCallCard key={i} tool={tool} />
                ))}
              </div>
            )}

            {/* Typing indicator while streaming with no text yet */}
            {message.streaming && !message.content && (!message.toolCalls || message.toolCalls.every(t => t.status === "done")) && (
              <div className="bg-[var(--color-surface-2)] rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)] px-2 py-1">
                <TypingIndicator />
              </div>
            )}

            {/* Text response */}
            {message.content && (
              <div className={cn(
                "bg-[var(--color-surface-2)] rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)] px-4 py-3 text-sm leading-relaxed",
                "prose prose-invert prose-sm max-w-none",
                message.streaming && "streaming-cursor"
              )}>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-[var(--color-text)]">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-[var(--color-text)]">{children}</strong>,
                    code: ({ children }) => (
                      <code className="bg-[var(--color-surface-3)] text-[var(--color-accent)] px-1.5 py-0.5 rounded text-xs font-mono">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-[var(--color-surface-3)] rounded-[var(--radius-md)] p-3 overflow-x-auto text-xs mb-2">
                        {children}
                      </pre>
                    ),
                    h3: ({ children }) => <h3 className="font-semibold text-sm mb-1 mt-3">{children}</h3>,
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-2">
                        <table className="text-xs border-collapse w-full">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-[var(--color-border)] px-2 py-1 text-left bg-[var(--color-surface-3)] font-medium">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-[var(--color-border)] px-2 py-1">{children}</td>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Error */}
            {message.error && (
              <div className="bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] border border-[var(--color-danger)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-danger)]">
                {message.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
