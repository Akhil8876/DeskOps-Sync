import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./system-prompt";
import { TOOLS, executeTool } from "./tools";
import type { Response } from "express";
import * as storage from "../storage";

const client = new Anthropic();

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

export async function runAgentStream(
  conversationId: number,
  userMessage: string,
  res: Response
): Promise<void> {
  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    // Save user message
    await storage.addMessage({
      conversationId,
      role: "user",
      content: userMessage,
    });

    // Load conversation history
    const history = await storage.getMessages(conversationId);
    const claudeMessages: Anthropic.MessageParam[] = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    let fullResponseText = "";
    const toolCallLog: Array<{ name: string; input: unknown; result: unknown }> = [];

    // Agentic loop
    while (true) {
      const stream = client.messages.stream({
        model: "claude-opus-4-8",
        max_tokens: 8096,
        thinking: { type: "adaptive" },
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: claudeMessages,
      });

      let currentText = "";
      let stopReason: string | null = null;
      const toolUseBlocks: Anthropic.ToolUseBlock[] = [];
      const allContentBlocks: Anthropic.ContentBlock[] = [];

      // Stream text chunks
      for await (const event of stream) {
        if (event.type === "content_block_delta") {
          if (event.delta.type === "text_delta") {
            currentText += event.delta.text;
            fullResponseText += event.delta.text;
            sendEvent(res, { type: "text", content: event.delta.text });
          }
        }
        if (event.type === "message_delta") {
          stopReason = event.delta.stop_reason;
        }
        if (event.type === "message_stop") {
          const msg = await stream.finalMessage();
          stopReason = msg.stop_reason;
          for (const block of msg.content) {
            allContentBlocks.push(block);
            if (block.type === "tool_use") {
              toolUseBlocks.push(block);
            }
          }
        }
      }

      // If no tool calls, we're done
      if (stopReason !== "tool_use" || toolUseBlocks.length === 0) {
        break;
      }

      // Add assistant message with tool_use blocks
      claudeMessages.push({
        role: "assistant",
        content: allContentBlocks,
      });

      // Execute each tool and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolBlock of toolUseBlocks) {
        sendEvent(res, {
          type: "tool_start",
          toolName: toolBlock.name,
          toolInput: toolBlock.input,
        });

        const result = await executeTool(toolBlock.name, toolBlock.input as Record<string, unknown>);
        toolCallLog.push({ name: toolBlock.name, input: toolBlock.input, result });

        sendEvent(res, {
          type: "tool_result",
          toolName: toolBlock.name,
          toolResult: result,
        });

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolBlock.id,
          content: JSON.stringify(result),
        });
      }

      // Add tool results to continue the loop
      claudeMessages.push({
        role: "user",
        content: toolResults,
      });
    }

    // Save complete assistant response
    const savedMessage = await storage.addMessage({
      conversationId,
      role: "assistant",
      content: fullResponseText,
      toolCalls: toolCallLog.length > 0 ? toolCallLog : undefined,
    });

    // Auto-title the conversation after first exchange
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
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    });
  } finally {
    res.end();
  }
}
