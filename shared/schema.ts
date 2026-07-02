import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("New Conversation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  toolCalls: jsonb("tool_calls"), // array of tool call results
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  price: real("price").notNull(),
  comparePrice: real("compare_price"),
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(10),
  status: text("status").notNull().default("active"), // active | draft | archived
  imageUrl: text("image_url"),
  tags: text("tags").array(),
  weight: real("weight"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Customers
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  totalOrders: integer("total_orders").default(0),
  totalSpent: real("total_spent").default(0),
  tags: text("tags").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  customerEmail: text("customer_email").notNull(),
  status: text("status").notNull().default("pending"), // pending | processing | shipped | delivered | cancelled | refunded
  paymentStatus: text("payment_status").notNull().default("pending"), // pending | paid | refunded | failed
  items: jsonb("items").notNull(),
  subtotal: real("subtotal").notNull(),
  discount: real("discount").default(0),
  shipping: real("shipping").default(0),
  tax: real("tax").default(0),
  total: real("total").notNull(),
  shippingAddress: jsonb("shipping_address"),
  trackingNumber: text("tracking_number"),
  fulfillmentStatus: text("fulfillment_status").default("unfulfilled"), // unfulfilled | partial | fulfilled
  tags: text("tags").array(),
  notes: text("notes"),
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Collections (Shopify-style manual product groupings)
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  handle: text("handle").notNull().unique(),
  description: text("description"),
  productIds: jsonb("product_ids").$type<number[]>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Discounts
export const discounts = pgTable("discounts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // percentage | fixed
  value: real("value").notNull(),
  minOrderAmount: real("min_order_amount"),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  active: boolean("active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications log
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  customerEmail: text("customer_email").notNull(),
  type: text("type").notNull(), // email | sms
  subject: text("subject"),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

// Insert schemas
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDiscountSchema = createInsertSchema(discounts).omit({ id: true, createdAt: true });
export const insertCollectionSchema = createInsertSchema(collections).omit({ id: true, createdAt: true });

// Types
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Discount = typeof discounts.$inferSelect;
export type InsertDiscount = z.infer<typeof insertDiscountSchema>;
export type Collection = typeof collections.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;

// Order item type
export interface OrderItem {
  productId: number;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

// Shipping address type
export interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}
