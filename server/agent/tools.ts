import * as storage from "../storage";

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const TOOLS: ToolDefinition[] = [
  {
    name: "search_products",
    description: "Search and filter products in the store catalog. Use this to find products by name, category, price range, or stock status.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search by product name, SKU, or description" },
        category: { type: "string", description: "Filter by category (e.g. Footwear, Electronics, Clothing, Bags, Fitness, Kitchen)" },
        status: { type: "string", enum: ["active", "draft", "archived"], description: "Filter by product status" },
        min_price: { type: "number", description: "Minimum price filter" },
        max_price: { type: "number", description: "Maximum price filter" },
        low_stock: { type: "boolean", description: "If true, only return products at or below low stock threshold" },
        limit: { type: "number", description: "Max results to return (default 20)" },
      },
    },
  },
  {
    name: "get_product_details",
    description: "Get full details for a specific product by its ID or SKU.",
    input_schema: {
      type: "object",
      properties: {
        product_id: { type: "number", description: "Product ID" },
        sku: { type: "string", description: "Product SKU" },
      },
    },
  },
  {
    name: "update_product",
    description: "Update product information such as price, description, status, or stock threshold.",
    input_schema: {
      type: "object",
      required: ["product_id"],
      properties: {
        product_id: { type: "number", description: "Product ID to update" },
        name: { type: "string" },
        description: { type: "string" },
        price: { type: "number" },
        compare_price: { type: "number" },
        status: { type: "string", enum: ["active", "draft", "archived"] },
        low_stock_threshold: { type: "number" },
        tags: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "manage_inventory",
    description: "Update stock levels for a product. Use this to restock, reduce, or set stock to a specific quantity.",
    input_schema: {
      type: "object",
      required: ["product_id", "action"],
      properties: {
        product_id: { type: "number", description: "Product ID" },
        action: {
          type: "string",
          enum: ["set", "add", "subtract"],
          description: "'set' sets stock to exact value, 'add' increases stock, 'subtract' decreases stock",
        },
        quantity: { type: "number", description: "Quantity to set/add/subtract" },
      },
    },
  },
  {
    name: "search_orders",
    description: "Search and filter orders. Use this to find orders by status, customer, or order number.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search by order number or customer email" },
        status: {
          type: "string",
          enum: ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"],
        },
        payment_status: { type: "string", enum: ["pending", "paid", "refunded", "failed"] },
        customer_email: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "get_order_details",
    description: "Get full details for a specific order including items, customer, shipping, and payment info.",
    input_schema: {
      type: "object",
      properties: {
        order_id: { type: "number" },
        order_number: { type: "string", description: "e.g. ORD-2024-0001" },
      },
    },
  },
  {
    name: "update_order_status",
    description: "Update the status of an order. Can also add a tracking number when marking as shipped.",
    input_schema: {
      type: "object",
      required: ["order_id", "status"],
      properties: {
        order_id: { type: "number" },
        status: {
          type: "string",
          enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        },
        tracking_number: { type: "string", description: "Add tracking number (use when marking as shipped)" },
        notes: { type: "string", description: "Internal notes about this status change" },
      },
    },
  },
  {
    name: "process_refund",
    description: "Process a refund for a cancelled or returned order.",
    input_schema: {
      type: "object",
      required: ["order_id"],
      properties: {
        order_id: { type: "number" },
        reason: { type: "string", description: "Reason for the refund" },
      },
    },
  },
  {
    name: "search_customers",
    description: "Search for customers by name, email, or phone number.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search by name, email, or phone" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "get_customer_details",
    description: "Get a customer's profile including their order history and total spend.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "number" },
        email: { type: "string" },
      },
    },
  },
  {
    name: "send_customer_notification",
    description: "Send an email notification to a customer (e.g. order update, shipping confirmation, promotion).",
    input_schema: {
      type: "object",
      required: ["customer_email", "subject", "message"],
      properties: {
        customer_email: { type: "string" },
        subject: { type: "string" },
        message: { type: "string", description: "Email body (can use markdown formatting)" },
      },
    },
  },
  {
    name: "get_analytics",
    description: "Get store analytics including revenue, order stats, top products, and inventory summary.",
    input_schema: {
      type: "object",
      properties: {
        include_recent_orders: { type: "boolean", description: "Include last 5 orders in results" },
      },
    },
  },
  {
    name: "create_discount_code",
    description: "Create a new discount code for customers.",
    input_schema: {
      type: "object",
      required: ["code", "type", "value"],
      properties: {
        code: { type: "string", description: "Discount code (will be uppercased)" },
        type: { type: "string", enum: ["percentage", "fixed"], description: "'percentage' for % off, 'fixed' for $ off" },
        value: { type: "number", description: "Discount amount (e.g. 10 for 10% or $10)" },
        min_order_amount: { type: "number", description: "Minimum order total required" },
        usage_limit: { type: "number", description: "Max total uses (optional)" },
        expires_at: { type: "string", description: "Expiry date ISO string (optional)" },
      },
    },
  },
  {
    name: "get_discounts",
    description: "List all discount codes in the store.",
    input_schema: {
      type: "object",
      properties: {
        active_only: { type: "boolean", description: "Only return active discount codes" },
      },
    },
  },
  {
    name: "create_product",
    description: "Add a brand-new product to the catalog.",
    input_schema: {
      type: "object",
      required: ["sku", "name", "category", "price"],
      properties: {
        sku: { type: "string", description: "Unique stock-keeping unit" },
        name: { type: "string" },
        description: { type: "string" },
        category: { type: "string" },
        price: { type: "number" },
        compare_price: { type: "number", description: "Original/'was' price for showing a discount" },
        stock: { type: "number", description: "Initial stock quantity (default 0)" },
        low_stock_threshold: { type: "number" },
        status: { type: "string", enum: ["active", "draft", "archived"], description: "Default draft" },
        tags: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "delete_product",
    description: "Permanently delete a product from the catalog. Use archive (update_product status) for a reversible option.",
    input_schema: {
      type: "object",
      required: ["product_id"],
      properties: { product_id: { type: "number" } },
    },
  },
  {
    name: "duplicate_product",
    description: "Create a draft copy of an existing product (stock reset to 0, new SKU). Useful as a template for a variant.",
    input_schema: {
      type: "object",
      required: ["product_id"],
      properties: { product_id: { type: "number" } },
    },
  },
  {
    name: "bulk_update_prices",
    description: "Change prices for many products at once, optionally scoped to a category. E.g. increase all footwear by 10%.",
    input_schema: {
      type: "object",
      required: ["change_type", "value"],
      properties: {
        category: { type: "string", description: "Limit to this category; omit for all products" },
        change_type: { type: "string", enum: ["percentage", "fixed", "set"], description: "'percentage'/'fixed' adjust, 'set' overwrites" },
        value: { type: "number" },
        direction: { type: "string", enum: ["increase", "decrease"], description: "For percentage/fixed (default increase)" },
      },
    },
  },
  {
    name: "create_collection",
    description: "Create a product collection (a named grouping of products, like a Shopify custom collection).",
    input_schema: {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        product_ids: { type: "array", items: { type: "number" }, description: "Optional initial product IDs" },
      },
    },
  },
  {
    name: "add_products_to_collection",
    description: "Add one or more products to an existing collection.",
    input_schema: {
      type: "object",
      required: ["collection_id", "product_ids"],
      properties: {
        collection_id: { type: "number" },
        product_ids: { type: "array", items: { type: "number" } },
      },
    },
  },
  {
    name: "list_collections",
    description: "List all product collections and how many products each contains.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "create_customer",
    description: "Create a new customer record.",
    input_schema: {
      type: "object",
      required: ["email", "first_name", "last_name"],
      properties: {
        email: { type: "string" },
        first_name: { type: "string" },
        last_name: { type: "string" },
        phone: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "update_customer",
    description: "Update a customer's details, tags, or notes.",
    input_schema: {
      type: "object",
      required: ["customer_id"],
      properties: {
        customer_id: { type: "number" },
        first_name: { type: "string" },
        last_name: { type: "string" },
        phone: { type: "string" },
        tags: { type: "array", items: { type: "string" }, description: "Replaces existing tags" },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "get_top_customers",
    description: "Get the highest-spending customers (for VIP targeting, loyalty, etc.).",
    input_schema: {
      type: "object",
      properties: { limit: { type: "number", description: "How many (default 5)" } },
    },
  },
  {
    name: "fulfill_order",
    description: "Fulfill an order — marks it shipped and fulfilled, optionally attaching a tracking number.",
    input_schema: {
      type: "object",
      required: ["order_id"],
      properties: {
        order_id: { type: "number" },
        tracking_number: { type: "string" },
      },
    },
  },
  {
    name: "cancel_order",
    description: "Cancel an order, optionally restocking its items back into inventory.",
    input_schema: {
      type: "object",
      required: ["order_id"],
      properties: {
        order_id: { type: "number" },
        restock: { type: "boolean", description: "Return the ordered quantities to stock (default false)" },
        reason: { type: "string" },
      },
    },
  },
  {
    name: "add_order_note",
    description: "Append an internal note to an order.",
    input_schema: {
      type: "object",
      required: ["order_id", "note"],
      properties: {
        order_id: { type: "number" },
        note: { type: "string" },
      },
    },
  },
  {
    name: "tag_order",
    description: "Add tags to an order (e.g. 'priority', 'gift', 'wholesale') for organisation.",
    input_schema: {
      type: "object",
      required: ["order_id", "tags"],
      properties: {
        order_id: { type: "number" },
        tags: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "set_discount_active",
    description: "Activate or deactivate a discount code.",
    input_schema: {
      type: "object",
      required: ["code", "active"],
      properties: {
        code: { type: "string" },
        active: { type: "boolean" },
      },
    },
  },
  {
    name: "delete_discount",
    description: "Permanently delete a discount code.",
    input_schema: {
      type: "object",
      required: ["code"],
      properties: { code: { type: "string" } },
    },
  },
  {
    name: "get_sales_report",
    description: "Sales report over a time window, optionally broken down by category.",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Look-back window in days (default 30)" },
        by_category: { type: "boolean", description: "Include per-category revenue breakdown" },
      },
    },
  },
];

// Tool executor — maps tool names to storage calls
export async function executeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "search_products":
      return storage.searchProducts({
        query: input.query as string | undefined,
        category: input.category as string | undefined,
        status: input.status as string | undefined,
        minPrice: input.min_price as number | undefined,
        maxPrice: input.max_price as number | undefined,
        lowStock: input.low_stock as boolean | undefined,
        limit: input.limit as number | undefined,
      });

    case "get_product_details": {
      if (input.product_id) return storage.getProduct(input.product_id as number);
      if (input.sku) return storage.getProductBySku(input.sku as string);
      return { error: "Provide product_id or sku" };
    }

    case "update_product": {
      const id = input.product_id as number;
      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.price !== undefined) updates.price = input.price;
      if (input.compare_price !== undefined) updates.comparePrice = input.compare_price;
      if (input.status !== undefined) updates.status = input.status;
      if (input.low_stock_threshold !== undefined) updates.lowStockThreshold = input.low_stock_threshold;
      if (input.tags !== undefined) updates.tags = input.tags;
      return storage.updateProduct(id, updates as Parameters<typeof storage.updateProduct>[1]);
    }

    case "manage_inventory": {
      const product = await storage.getProduct(input.product_id as number);
      if (!product) return { error: "Product not found" };
      const qty = input.quantity as number;
      let newStock = product.stock;
      if (input.action === "set") newStock = qty;
      else if (input.action === "add") newStock = product.stock + qty;
      else if (input.action === "subtract") newStock = Math.max(0, product.stock - qty);
      return storage.updateProduct(product.id, { stock: newStock });
    }

    case "search_orders":
      return storage.searchOrders({
        query: input.query as string | undefined,
        status: input.status as string | undefined,
        paymentStatus: input.payment_status as string | undefined,
        customerEmail: input.customer_email as string | undefined,
        limit: input.limit as number | undefined,
      });

    case "get_order_details": {
      if (input.order_id) return storage.getOrder(input.order_id as number);
      if (input.order_number) return storage.getOrderByNumber(input.order_number as string);
      return { error: "Provide order_id or order_number" };
    }

    case "update_order_status": {
      const updates: Record<string, unknown> = { status: input.status };
      if (input.tracking_number) updates.trackingNumber = input.tracking_number;
      if (input.notes) updates.notes = input.notes;
      return storage.updateOrder(input.order_id as number, updates as Parameters<typeof storage.updateOrder>[1]);
    }

    case "process_refund": {
      const order = await storage.getOrder(input.order_id as number);
      if (!order) return { error: "Order not found" };
      return storage.updateOrder(order.id, {
        status: "refunded",
        paymentStatus: "refunded",
        notes: input.reason ? `Refund reason: ${input.reason}` : order.notes ?? undefined,
      });
    }

    case "search_customers":
      return storage.searchCustomers({
        query: input.query as string | undefined,
        limit: input.limit as number | undefined,
      });

    case "get_customer_details": {
      let customer;
      if (input.customer_id) customer = await storage.getCustomer(input.customer_id as number);
      else if (input.email) customer = await storage.getCustomerByEmail(input.email as string);
      if (!customer) return { error: "Customer not found" };
      const orders = await storage.searchOrders({ customerId: customer.id, limit: 10 });
      return { ...customer, orders };
    }

    case "send_customer_notification": {
      const customer = await storage.getCustomerByEmail(input.customer_email as string);
      await storage.logNotification({
        customerId: customer?.id,
        customerEmail: input.customer_email as string,
        type: "email",
        subject: input.subject as string,
        message: input.message as string,
      });
      return {
        success: true,
        message: `Email sent to ${input.customer_email}`,
        subject: input.subject,
      };
    }

    case "get_analytics":
      return storage.getAnalytics();

    case "create_discount_code":
      return storage.createDiscount({
        code: (input.code as string).toUpperCase(),
        type: input.type as string,
        value: input.value as number,
        minOrderAmount: input.min_order_amount as number | undefined,
        usageLimit: input.usage_limit as number | undefined,
        active: true,
        expiresAt: input.expires_at ? new Date(input.expires_at as string) : undefined,
      });

    case "get_discounts":
      return storage.getDiscounts(input.active_only as boolean | undefined);

    case "create_product":
      return storage.createProduct({
        sku: input.sku as string,
        name: input.name as string,
        description: input.description as string | undefined,
        category: input.category as string,
        price: input.price as number,
        comparePrice: input.compare_price as number | undefined,
        stock: (input.stock as number | undefined) ?? 0,
        lowStockThreshold: (input.low_stock_threshold as number | undefined) ?? 10,
        status: (input.status as string | undefined) ?? "draft",
        tags: input.tags as string[] | undefined,
      });

    case "delete_product":
      return storage.deleteProduct(input.product_id as number);

    case "duplicate_product":
      return storage.duplicateProduct(input.product_id as number);

    case "bulk_update_prices":
      return storage.bulkUpdatePrices({
        category: input.category as string | undefined,
        changeType: input.change_type as "percentage" | "fixed" | "set",
        value: input.value as number,
        direction: input.direction as "increase" | "decrease" | undefined,
      });

    case "create_collection":
      return storage.createCollection(
        input.title as string,
        input.description as string | undefined,
        (input.product_ids as number[] | undefined) ?? [],
      );

    case "add_products_to_collection":
      return storage.addProductsToCollection(
        input.collection_id as number,
        input.product_ids as number[],
      );

    case "list_collections":
      return storage.listCollections();

    case "create_customer":
      return storage.createCustomer({
        email: input.email as string,
        firstName: input.first_name as string,
        lastName: input.last_name as string,
        phone: input.phone as string | undefined,
        tags: input.tags as string[] | undefined,
        notes: input.notes as string | undefined,
      });

    case "update_customer": {
      const updates: Record<string, unknown> = {};
      if (input.first_name !== undefined) updates.firstName = input.first_name;
      if (input.last_name !== undefined) updates.lastName = input.last_name;
      if (input.phone !== undefined) updates.phone = input.phone;
      if (input.tags !== undefined) updates.tags = input.tags;
      if (input.notes !== undefined) updates.notes = input.notes;
      return storage.updateCustomer(input.customer_id as number, updates as Parameters<typeof storage.updateCustomer>[1]);
    }

    case "get_top_customers":
      return storage.getTopCustomers(input.limit as number | undefined);

    case "fulfill_order":
      return storage.fulfillOrder(input.order_id as number, input.tracking_number as string | undefined);

    case "cancel_order":
      return storage.cancelOrder(input.order_id as number, {
        restock: input.restock as boolean | undefined,
        reason: input.reason as string | undefined,
      });

    case "add_order_note":
      return storage.addOrderNote(input.order_id as number, input.note as string);

    case "tag_order":
      return storage.tagOrder(input.order_id as number, input.tags as string[]);

    case "set_discount_active":
      return storage.setDiscountActive(input.code as string, input.active as boolean);

    case "delete_discount":
      return storage.deleteDiscount(input.code as string);

    case "get_sales_report":
      return storage.getSalesReport(
        input.days as number | undefined,
        input.by_category as boolean | undefined,
      );

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
