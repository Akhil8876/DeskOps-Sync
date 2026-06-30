import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
} from "openai/resources/chat/completions";
import { SYSTEM_PROMPT } from "./system-prompt";
import { TOOLS, executeTool } from "./tools";
import type { Response } from "express";
import * as storage from "../storage";

// Points to Ollama by default — swap baseURL/apiKey for any OpenAI-compatible endpoint
const client = new OpenAI({
  baseURL: process.env.AI_BASE_URL ?? "http://localhost:11434/v1",
  apiKey: process.env.AI_API_KEY ?? "ollama",
});

const MODEL = process.env.AI_MODEL ?? "qwen2.5:7b";

// Convert our tool definitions to OpenAI function-calling format
const OPENAI_TOOLS: ChatCompletionTool[] = TOOLS.map((tool) => ({
  type: "function",
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.input_schema as Record<string, unknown>,
  },
}));

export interface StreamEvent {
  type: "text" | "tool_start" | "tool_result" | "done" | "error";
  content?: string;
  toolName?: string;
  toolInput?: unknown;
  toolResult?: unknown;
  messageId?: number;
  error?: string;
}

function sendEvent(res: Response, event: StreamEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

interface PartialToolCall {
  id: string;
  name: string;
  arguments: string;
}

export async function runAgentStream(
  conversationId: number,
  userMessage: string,
  res: Response
): Promise<void> {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    // Save user message
    await storage.addMessage({ conversationId, role: "user", content: userMessage });

    // Build conversation history in OpenAI format
    const history = await storage.getMessages(conversationId);
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m): ChatCompletionMessageParam => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    let fullResponseText = "";
    const toolCallLog: Array<{ name: string; input: unknown; result: unknown }> = [];

    // Agentic loop
    while (true) {
      const stream = await client.chat.completions.create({
        model: MODEL,
        messages,
        tools: OPENAI_TOOLS,
        tool_choice: "auto",
        stream: true,
        temperature: 0.3,
      });

      let currentText = "";
      let stopReason: string | null = null;
      const partialToolCalls: Record<number, PartialToolCall> = {};

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        const finishReason = chunk.choices[0]?.finish_reason;

        // Stream text
        if (delta?.content) {
          currentText += delta.content;
          fullResponseText += delta.content;
          sendEvent(res, { type: "text", content: delta.content });
        }

        // Accumulate tool call chunks (arguments arrive in pieces)
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index;
            if (!partialToolCalls[idx]) {
              partialToolCalls[idx] = { id: "", name: "", arguments: "" };
            }
            if (tc.id) partialToolCalls[idx].id = tc.id;
            if (tc.function?.name) partialToolCalls[idx].name = tc.function.name;
            if (tc.function?.arguments) partialToolCalls[idx].arguments += tc.function.arguments;
          }
        }

        if (finishReason) stopReason = finishReason;
      }

      const toolCalls = Object.values(partialToolCalls);

      // No tool calls — we're done
      if (stopReason !== "tool_calls" || toolCalls.length === 0) {
        break;
      }

      // Add assistant message with tool calls to history
      messages.push({
        role: "assistant",
        content: currentText || null,
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: { name: tc.name, arguments: tc.arguments },
        })),
      });

      // Execute each tool and collect results
      const toolResultMessages: ChatCompletionToolMessageParam[] = [];

      for (const tc of toolCalls) {
        let input: Record<string, unknown> = {};
        try {
          input = JSON.parse(tc.arguments) as Record<string, unknown>;
        } catch {
          input = {};
        }

        sendEvent(res, { type: "tool_start", toolName: tc.name, toolInput: input });

        const result = await executeTool(tc.name, input);
        toolCallLog.push({ name: tc.name, input, result });

        sendEvent(res, { type: "tool_result", toolName: tc.name, toolResult: result });

        toolResultMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }

      // Feed results back and continue the loop
      messages.push(...toolResultMessages);
    }

    // Persist final assistant response
    const savedMessage = await storage.addMessage({
      conversationId,
      role: "assistant",
      content: fullResponseText,
      toolCalls: toolCallLog.length > 0 ? toolCallLog : undefined,
    });

    // Auto-title conversation on first exchange
    const allMessages = await storage.getMessages(conversationId);
    if (allMessages.length <= 3) {
      const title = userMessage.slice(0, 60) + (userMessage.length > 60 ? "…" : "");
      await storage.updateConversationTitle(conversationId, title);
    }

    sendEvent(res, { type: "done", messageId: savedMessage.id });
  } catch (err) {
    console.error("Agent error:", err);
    sendEvent(res, {
      type: "error",
      error: err instanceof Error ? err.message : "Unexpected error",
    });
  } finally {
    res.end();
  }
}
