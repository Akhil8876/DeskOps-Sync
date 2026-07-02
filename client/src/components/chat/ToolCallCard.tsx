import { useState } from "react";
import { ChevronDown, ChevronRight, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolCall } from "@/hooks/useAgentStream";

const TOOL_LABELS: Record<string, string> = {
  search_products: "Searching products",
  get_product_details: "Fetching product",
  update_product: "Updating product",
  create_product: "Creating product",
  delete_product: "Deleting product",
  duplicate_product: "Duplicating product",
  bulk_update_prices: "Bulk-updating prices",
  manage_inventory: "Updating inventory",
  create_collection: "Creating collection",
  add_products_to_collection: "Updating collection",
  list_collections: "Fetching collections",
  search_orders: "Searching orders",
  get_order_details: "Fetching order",
  update_order_status: "Updating order status",
  fulfill_order: "Fulfilling order",
  cancel_order: "Cancelling order",
  add_order_note: "Adding order note",
  tag_order: "Tagging order",
  process_refund: "Processing refund",
  search_customers: "Searching customers",
  get_customer_details: "Fetching customer",
  create_customer: "Creating customer",
  update_customer: "Updating customer",
  get_top_customers: "Finding top customers",
  send_customer_notification: "Sending notification",
  get_analytics: "Fetching analytics",
  get_sales_report: "Building sales report",
  create_discount_code: "Creating discount",
  set_discount_active: "Toggling discount",
  delete_discount: "Deleting discount",
  get_discounts: "Fetching discounts",
};

interface Props {
  tool: ToolCall;
}

export function ToolCallCard({ tool }: Props) {
  const [expanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[tool.name] ?? tool.name;
  const isDone = tool.status === "done";

  return (
    <div className="my-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] overflow-hidden text-sm">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-surface-3)] transition-colors"
      >
        {isDone ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" />
        ) : (
          <Zap className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0 tool-running" />
        )}
        <span className={cn("flex-1 font-medium", isDone ? "text-[var(--color-text-muted)]" : "text-[var(--color-accent)]")}>
          {label}
        </span>
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-subtle)]" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-subtle)]" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-[var(--color-border-subtle)] divide-y divide-[var(--color-border-subtle)]">
          {!!tool.input && (
            <div className="px-3 py-2">
              <p className="text-xs text-[var(--color-text-subtle)] mb-1 uppercase tracking-wide">Input</p>
              <pre className="text-xs text-[var(--color-text-muted)] overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(tool.input, null, 2)}
              </pre>
            </div>
          )}
          {!!tool.result && (
            <div className="px-3 py-2">
              <p className="text-xs text-[var(--color-text-subtle)] mb-1 uppercase tracking-wide">Result</p>
              <pre className="text-xs text-[var(--color-text-muted)] overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(tool.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
