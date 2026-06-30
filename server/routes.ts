import { Router } from "express";
import * as storage from "./storage";
import { runAgentStream } from "./agent/index";

export const router = Router();

// ── Conversations ──────────────────────────────────────────────────────────────

router.get("/conversations", async (_req, res) => {
  const convos = await storage.getConversations();
  res.json(convos);
});

router.post("/conversations", async (_req, res) => {
  const convo = await storage.createConversation();
  res.json(convo);
});

router.delete("/conversations/:id", async (req, res) => {
  await storage.deleteConversation(Number(req.params.id));
  res.json({ success: true });
});

router.get("/conversations/:id/messages", async (req, res) => {
  const messages = await storage.getMessages(Number(req.params.id));
  res.json(messages);
});

// ── Agent streaming endpoint ───────────────────────────────────────────────────

router.post("/agent/chat", async (req, res) => {
  const { conversationId, message } = req.body as { conversationId: number; message: string };

  if (!conversationId || !message?.trim()) {
    res.status(400).json({ error: "conversationId and message are required" });
    return;
  }

  const convo = await storage.getConversation(conversationId);
  if (!convo) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  await runAgentStream(conversationId, message.trim(), res);
});

// ── Products ───────────────────────────────────────────────────────────────────

router.get("/products", async (req, res) => {
  const products = await storage.searchProducts({
    query: req.query.q as string | undefined,
    category: req.query.category as string | undefined,
    status: req.query.status as string | undefined,
    lowStock: req.query.lowStock === "true",
  });
  res.json(products);
});

// ── Orders ─────────────────────────────────────────────────────────────────────

router.get("/orders", async (req, res) => {
  const orders = await storage.searchOrders({
    status: req.query.status as string | undefined,
    limit: 20,
  });
  res.json(orders);
});

// ── Analytics ─────────────────────────────────────────────────────────────────

router.get("/analytics", async (_req, res) => {
  const analytics = await storage.getAnalytics();
  res.json(analytics);
});

// ── Health ─────────────────────────────────────────────────────────────────────

router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
