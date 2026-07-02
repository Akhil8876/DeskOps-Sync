import { Router } from "express";
import { z } from "zod";
import * as storage from "./storage";
import { runAgentStream } from "./agent/index";

export const router = Router();

// ── Storefront ─────────────────────────────────────────────────────────────────

router.get("/storefront/products", async (req, res) => {
  const products = await storage.searchProducts({
    query: req.query.q as string | undefined,
    category: req.query.category as string | undefined,
    status: "active",
    limit: 100,
  });
  res.json(products);
});

router.get("/storefront/categories", async (_req, res) => {
  const categories = await storage.getCategories();
  res.json(categories);
});

const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().int().positive(),
  })).min(1),
  customer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    address1: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().optional(),
  }),
});

router.post("/storefront/checkout", async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid checkout data", details: parsed.error.flatten() });
    return;
  }
  try {
    const result = await storage.createOrderFromCheckout(parsed.data.items, parsed.data.customer);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Checkout failed" });
  }
});

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
