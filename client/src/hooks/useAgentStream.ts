import { useState, useCallback, useRef } from "react";

export interface StreamEvent {
  type: "text" | "tool_start" | "tool_result" | "done" | "error";
  content?: string;
  toolName?: string;
  toolInput?: unknown;
  toolResult?: unknown;
  messageId?: number;
  error?: string;
}

export interface ToolCall {
  name: string;
  input: unknown;
  result?: unknown;
  status: "running" | "done";
}

export interface AssistantMessage {
  id: string;
  text: string;
  toolCalls: ToolCall[];
  streaming: boolean;
  error?: string;
}

export function useAgentStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (
      conversationId: number,
      message: string,
      onEvent: (event: StreamEvent, accumulated: string) => void
    ): Promise<void> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, message }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event: StreamEvent = JSON.parse(line.slice(6));
              if (event.type === "text") accumulated += event.content ?? "";
              onEvent(event, accumulated);
            } catch {
              // ignore malformed events
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          onEvent({ type: "error", error: (err as Error).message }, "");
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    []
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { sendMessage, isStreaming, abort };
}
