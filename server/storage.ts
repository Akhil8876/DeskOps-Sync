import { eq, desc, like, and, gte, lte, or, sql, ilike } from "drizzle-orm";
import { db } from "./db";
import {
  conversations, messages, products, customers, orders, discounts, notifications,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type Product, type InsertProduct,
  type Customer, type InsertCustomer,
  type Order, type InsertOrder,
  type Discount, type InsertDiscount,
} from "@shared/schema";

// ── Conversations ──────────────────────────────────────────────────────────────

export async function createConversation(data?: Partial<InsertConversation>): Promise<Conversation> {
  const [row] = await db.insert(conversations).values({ title: "New Conversation", ...data }).returning();
  return row;
}

export async function getConversations(): Promise<Conversation[]> {
  return db.select().from(conversations).orderBy(desc(conversations.updatedAt));
}

export async function getConversation(id: number): Promise<Conversation | undefined> {
  const [row] = await db.select().from(conversations).where(eq(conversations.id, id));
  return row;
}

export async function updateConversationTitle(id: number, title: string): Promise<void> {
  await db.update(conversations).set({ title, updatedAt: new Date() }).where(eq(conversations.id, id));
}

export async function deleteConversation(id: number): Promise<void> {
  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));
}

// ── Messages ───────────────────────────────────────────────────────────────────

export async function addMessage(data: InsertMessage): Promise<Message> {
  const [row] = await db.insert(messages).values(data).returning();
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, data.conversationId));
  return row;
}

export async function getMessages(conversationId: number): Promise<Message[]> {
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}

// ── Products ───────────────────────────────────────────────────────────────────

export interface ProductFilters {
  query?: string;
  category?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  lowStock?: boolean;
  limit?: number;
}

export async function searchProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const conditions = [];

  if (filters.query) {
    conditions.push(or(
      ilike(products.name, `%${filters.query}%`),
      ilike(products.sku, `%${filters.query}%`),
      ilike(products.description, `%${filters.query}%`),
    ));
  }
  if (filters.category) conditions.push(eq(products.category, filters.category));
  if (filters.status) conditions.push(eq(products.status, filters.status));
  if (filters.minPrice !== undefined) conditions.push(gte(products.price, filters.minPrice));
  if (filters.maxPrice !== undefined) conditions.push(lte(products.price, filters.maxPrice));
  if (filters.lowStock) {
    conditions.push(sql`${products.stock} <= ${products.lowStockThreshold}`);
  }

  const query = db.select().from(products);
  const result = conditions.length > 0
    ? await query.where(and(...conditions)).limit(filters.limit ?? 20)
    : await query.limit(filters.limit ?? 20);

  return result;
}

export async function getProduct(id: number): Promise<Product | undefined> {
  const [row] = await db.select().from(products).where(eq(products.id, id));
  return row;
}

export async function getProductBySku(sku: string): Promise<Product | undefined> {
  const [row] = await db.select().from(products).where(eq(products.sku, sku));
  return row;
}

export async function updateProduct(id: number, data: Partial<Omit<Product, "id" | "createdAt">>): Promise<Product> {
  const [row] = await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id)).returning();
  return row;
}

export async function createProduct(data: InsertProduct): Promise<Product> {
  const [row] = await db.insert(products).values(data).returning();
  return row;
}

// ── Customers ──────────────────────────────────────────────────────────────────

export interface CustomerFilters {
  query?: string;
  limit?: number;
}

export async function searchCustomers(filters: CustomerFilters = {}): Promise<Customer[]> {
  if (filters.query) {
    return db.select().from(customers).where(
      or(
        ilike(customers.email, `%${filters.query}%`),
        ilike(customers.firstName, `%${filters.query}%`),
        ilike(customers.lastName, `%${filters.query}%`),
        ilike(customers.phone, `%${filters.query}%`),
      )
    ).limit(filters.limit ?? 10);
  }
  return db.select().from(customers).limit(filters.limit ?? 10);
}

export async function getCustomer(id: number): Promise<Customer | undefined> {
  const [row] = await db.select().from(customers).where(eq(customers.id, id));
  return row;
}

export async function getCustomerByEmail(email: string): Promise<Customer | undefined> {
  const [row] = await db.select().from(customers).where(eq(customers.email, email));
  return row;
}

export async function updateCustomer(id: number, data: Partial<Omit<Customer, "id" | "createdAt">>): Promise<Customer> {
  const [row] = await db.update(customers).set(data).where(eq(customers.id, id)).returning();
  return row;
}

// ── Orders ─────────────────────────────────────────────────────────────────────

export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  customerId?: number;
  customerEmail?: string;
  query?: string;
  limit?: number;
}

export async function searchOrders(filters: OrderFilters = {}): Promise<Order[]> {
  const conditions = [];
  if (filters.status) conditions.push(eq(orders.status, filters.status));
  if (filters.paymentStatus) conditions.push(eq(orders.paymentStatus, filters.paymentStatus));
  if (filters.customerId) conditions.push(eq(orders.customerId, filters.customerId));
  if (filters.customerEmail) conditions.push(ilike(orders.customerEmail, `%${filters.customerEmail}%`));
  if (filters.query) {
    conditions.push(or(
      ilike(orders.orderNumber, `%${filters.query}%`),
      ilike(orders.customerEmail, `%${filters.query}%`),
    ));
  }

  const query = db.select().from(orders).orderBy(desc(orders.createdAt));
  return conditions.length > 0
    ? await query.where(and(...conditions)).limit(filters.limit ?? 20)
    : await query.limit(filters.limit ?? 20);
}

export async function getOrder(id: number): Promise<Order | undefined> {
  const [row] = await db.select().from(orders).where(eq(orders.id, id));
  return row;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
  const [row] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
  return row;
}

export async function updateOrder(id: number, data: Partial<Omit<Order, "id" | "createdAt">>): Promise<Order> {
  const [row] = await db.update(orders).set({ ...data, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
  return row;
}

// ── Discounts ──────────────────────────────────────────────────────────────────

export async function createDiscount(data: InsertDiscount): Promise<Discount> {
  const [row] = await db.insert(discounts).values(data).returning();
  return row;
}

export async function getDiscounts(activeOnly = false): Promise<Discount[]> {
  if (activeOnly) {
    return db.select().from(discounts).where(eq(discounts.active, true));
  }
  return db.select().from(discounts);
}

export async function getDiscountByCode(code: string): Promise<Discount | undefined> {
  const [row] = await db.select().from(discounts).where(eq(discounts.code, code.toUpperCase()));
  return row;
}

// ── Notifications ──────────────────────────────────────────────────────────────

export async function logNotification(data: {
  customerId?: number;
  customerEmail: string;
  type: string;
  subject?: string;
  message: string;
}): Promise<void> {
  await db.insert(notifications).values(data);
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function getAnalytics() {
  const [orderStats] = await db.select({
    totalOrders: sql<number>`count(*)`,
    totalRevenue: sql<number>`sum(${orders.total})`,
    avgOrderValue: sql<number>`avg(${orders.total})`,
  }).from(orders).where(eq(orders.paymentStatus, "paid"));

  const [productStats] = await db.select({
    totalProducts: sql<number>`count(*)`,
    activeProducts: sql<number>`count(*) filter (where ${products.status} = 'active')`,
    lowStockCount: sql<number>`count(*) filter (where ${products.stock} <= ${products.lowStockThreshold})`,
  }).from(products);

  const [customerStats] = await db.select({
    totalCustomers: sql<number>`count(*)`,
  }).from(customers);

  const recentOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(5);

  const topProductsSql = await db.select({
    items: orders.items,
  }).from(orders).where(eq(orders.paymentStatus, "paid")).limit(100);

  // Aggregate top products from order items
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  for (const order of topProductsSql) {
    const items = order.items as Array<{ name: string; quantity: number; total: number }>;
    if (Array.isArray(items)) {
      for (const item of items) {
        if (!productSales[item.name]) {
          productSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[item.name].quantity += item.quantity;
        productSales[item.name].revenue += item.total;
      }
    }
  }
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const ordersByStatus = await db.select({
    status: orders.status,
    count: sql<number>`count(*)`,
  }).from(orders).groupBy(orders.status);

  return {
    orders: {
      total: Number(orderStats?.totalOrders ?? 0),
      revenue: Number(orderStats?.totalRevenue ?? 0),
      avgOrderValue: Number(orderStats?.avgOrderValue ?? 0),
      byStatus: ordersByStatus,
    },
    products: {
      total: Number(productStats?.totalProducts ?? 0),
      active: Number(productStats?.activeProducts ?? 0),
      lowStock: Number(productStats?.lowStockCount ?? 0),
    },
    customers: {
      total: Number(customerStats?.totalCustomers ?? 0),
    },
    topProducts,
    recentOrders,
  };
}

// ── Seed data ──────────────────────────────────────────────────────────────────

export async function seedDemoData(): Promise<void> {
  const existingProducts = await db.select().from(products).limit(1);
  if (existingProducts.length > 0) return; // already seeded

  // Products
  const productData: InsertProduct[] = [
    { sku: "SHOE-NK-AIR-001", name: "Nike Air Max 270", category: "Footwear", price: 149.99, comparePrice: 179.99, stock: 87, lowStockThreshold: 10, status: "active", tags: ["nike", "running", "popular"] },
    { sku: "SHOE-AD-UB-002", name: "Adidas Ultraboost 23", category: "Footwear", price: 189.99, comparePrice: 220.00, stock: 43, lowStockThreshold: 10, status: "active", tags: ["adidas", "running"] },
    { sku: "SHOE-NB-574-003", name: "New Balance 574", category: "Footwear", price: 89.99, stock: 6, lowStockThreshold: 10, status: "active", tags: ["classic", "casual"] },
    { sku: "APPL-IPHONE-004", name: "iPhone 15 Pro Case", category: "Accessories", price: 39.99, stock: 215, lowStockThreshold: 20, status: "active", tags: ["phone", "protection"] },
    { sku: "APPL-AIRPODS-005", name: "AirPods Pro (2nd Gen)", category: "Electronics", price: 249.99, comparePrice: 279.99, stock: 34, lowStockThreshold: 15, status: "active", tags: ["apple", "audio", "wireless"] },
    { sku: "SHIRT-POLO-006", name: "Classic Polo Shirt", category: "Clothing", price: 49.99, stock: 128, lowStockThreshold: 20, status: "active", tags: ["shirt", "casual"] },
    { sku: "SHIRT-LOGO-007", name: "Logo Graphic Tee", category: "Clothing", price: 29.99, stock: 8, lowStockThreshold: 15, status: "active", tags: ["tshirt", "casual"] },
    { sku: "BAG-BACKP-008", name: "Urban Commuter Backpack", category: "Bags", price: 79.99, comparePrice: 99.99, stock: 52, lowStockThreshold: 10, status: "active", tags: ["bag", "travel"] },
    { sku: "WATCH-SMART-009", name: "SmartWatch Series X", category: "Electronics", price: 299.99, comparePrice: 349.99, stock: 19, lowStockThreshold: 5, status: "active", tags: ["watch", "fitness", "wearable"] },
    { sku: "HEADPH-SONY-010", name: "Sony WH-1000XM5 Headphones", category: "Electronics", price: 349.99, comparePrice: 399.99, stock: 0, lowStockThreshold: 5, status: "active", tags: ["audio", "sony", "noise-cancelling"] },
    { sku: "GYM-BANDS-011", name: "Resistance Bands Set", category: "Fitness", price: 24.99, stock: 340, lowStockThreshold: 30, status: "active", tags: ["gym", "workout"] },
    { sku: "COFFEE-MUG-012", name: "Insulated Travel Mug", category: "Kitchen", price: 34.99, stock: 3, lowStockThreshold: 10, status: "active", tags: ["coffee", "travel"] },
  ];

  const insertedProducts = await db.insert(products).values(productData).returning();

  // Customers
  const customerData: InsertCustomer[] = [
    { email: "sarah.johnson@email.com", firstName: "Sarah", lastName: "Johnson", phone: "+1-555-0101", totalOrders: 8, totalSpent: 1249.50, tags: ["vip", "loyal"] },
    { email: "mike.chen@email.com", firstName: "Mike", lastName: "Chen", phone: "+1-555-0102", totalOrders: 3, totalSpent: 389.97 },
    { email: "emily.davis@email.com", firstName: "Emily", lastName: "Davis", phone: "+1-555-0103", totalOrders: 12, totalSpent: 2100.00, tags: ["vip"] },
    { email: "james.wilson@email.com", firstName: "James", lastName: "Wilson", phone: "+1-555-0104", totalOrders: 1, totalSpent: 149.99 },
    { email: "lisa.thompson@email.com", firstName: "Lisa", lastName: "Thompson", phone: "+1-555-0105", totalOrders: 5, totalSpent: 750.00 },
    { email: "david.martinez@email.com", firstName: "David", lastName: "Martinez", phone: "+1-555-0106", totalOrders: 2, totalSpent: 299.98 },
  ];

  const insertedCustomers = await db.insert(customers).values(customerData).returning();

  // Orders
  const orderData: InsertOrder[] = [
    {
      orderNumber: "ORD-2024-0001",
      customerId: insertedCustomers[0].id,
      customerEmail: "sarah.johnson@email.com",
      status: "delivered",
      paymentStatus: "paid",
      items: [
        { productId: insertedProducts[0].id, sku: "SHOE-NK-AIR-001", name: "Nike Air Max 270", quantity: 1, price: 149.99, total: 149.99 },
        { productId: insertedProducts[5].id, sku: "SHIRT-POLO-006", name: "Classic Polo Shirt", quantity: 2, price: 49.99, total: 99.98 },
      ],
      subtotal: 249.97, shipping: 9.99, tax: 20.00, discount: 0, total: 279.96,
      shippingAddress: { name: "Sarah Johnson", address1: "123 Main St", city: "Austin", state: "TX", zip: "78701", country: "US" },
      trackingNumber: "1Z999AA10123456784",
    },
    {
      orderNumber: "ORD-2024-0002",
      customerId: insertedCustomers[1].id,
      customerEmail: "mike.chen@email.com",
      status: "shipped",
      paymentStatus: "paid",
      items: [
        { productId: insertedProducts[4].id, sku: "APPL-AIRPODS-005", name: "AirPods Pro (2nd Gen)", quantity: 1, price: 249.99, total: 249.99 },
      ],
      subtotal: 249.99, shipping: 0, tax: 20.00, discount: 0, total: 269.99,
      shippingAddress: { name: "Mike Chen", address1: "456 Oak Ave", city: "San Francisco", state: "CA", zip: "94102", country: "US" },
      trackingNumber: "1Z999AA10123456785",
    },
    {
      orderNumber: "ORD-2024-0003",
      customerId: insertedCustomers[2].id,
      customerEmail: "emily.davis@email.com",
      status: "processing",
      paymentStatus: "paid",
      items: [
        { productId: insertedProducts[8].id, sku: "WATCH-SMART-009", name: "SmartWatch Series X", quantity: 1, price: 299.99, total: 299.99 },
        { productId: insertedProducts[7].id, sku: "BAG-BACKP-008", name: "Urban Commuter Backpack", quantity: 1, price: 79.99, total: 79.99 },
      ],
      subtotal: 379.98, shipping: 0, tax: 30.40, discount: 25.00, total: 385.38,
      shippingAddress: { name: "Emily Davis", address1: "789 Pine Rd", city: "New York", state: "NY", zip: "10001", country: "US" },
    },
    {
      orderNumber: "ORD-2024-0004",
      customerId: insertedCustomers[3].id,
      customerEmail: "james.wilson@email.com",
      status: "pending",
      paymentStatus: "pending",
      items: [
        { productId: insertedProducts[0].id, sku: "SHOE-NK-AIR-001", name: "Nike Air Max 270", quantity: 1, price: 149.99, total: 149.99 },
      ],
      subtotal: 149.99, shipping: 9.99, tax: 12.00, discount: 0, total: 171.98,
      shippingAddress: { name: "James Wilson", address1: "321 Elm St", city: "Chicago", state: "IL", zip: "60601", country: "US" },
    },
    {
      orderNumber: "ORD-2024-0005",
      customerId: insertedCustomers[4].id,
      customerEmail: "lisa.thompson@email.com",
      status: "cancelled",
      paymentStatus: "refunded",
      items: [
        { productId: insertedProducts[9].id, sku: "HEADPH-SONY-010", name: "Sony WH-1000XM5 Headphones", quantity: 1, price: 349.99, total: 349.99 },
      ],
      subtotal: 349.99, shipping: 0, tax: 28.00, discount: 0, total: 377.99,
      shippingAddress: { name: "Lisa Thompson", address1: "654 Maple Dr", city: "Seattle", state: "WA", zip: "98101", country: "US" },
      notes: "Customer requested cancellation - item out of stock",
    },
    {
      orderNumber: "ORD-2024-0006",
      customerId: insertedCustomers[2].id,
      customerEmail: "emily.davis@email.com",
      status: "delivered",
      paymentStatus: "paid",
      items: [
        { productId: insertedProducts[1].id, sku: "SHOE-AD-UB-002", name: "Adidas Ultraboost 23", quantity: 1, price: 189.99, total: 189.99 },
        { productId: insertedProducts[10].id, sku: "GYM-BANDS-011", name: "Resistance Bands Set", quantity: 2, price: 24.99, total: 49.98 },
      ],
      subtotal: 239.97, shipping: 0, tax: 19.20, discount: 0, total: 259.17,
      shippingAddress: { name: "Emily Davis", address1: "789 Pine Rd", city: "New York", state: "NY", zip: "10001", country: "US" },
      trackingNumber: "1Z999AA10123456786",
    },
  ];

  await db.insert(orders).values(orderData);

  // Discounts
  await db.insert(discounts).values([
    { code: "WELCOME10", type: "percentage", value: 10, minOrderAmount: 50, usageLimit: 100, usageCount: 23, active: true },
    { code: "SAVE25", type: "fixed", value: 25, minOrderAmount: 100, usageLimit: 50, usageCount: 12, active: true },
    { code: "SUMMER20", type: "percentage", value: 20, minOrderAmount: 75, usageLimit: 200, usageCount: 87, active: false },
    { code: "VIP50", type: "fixed", value: 50, minOrderAmount: 200, usageLimit: 20, usageCount: 5, active: true },
  ]);
}
