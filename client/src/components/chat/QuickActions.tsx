import { TrendingUp, Package, ShoppingCart, Users, Tag, AlertTriangle } from "lucide-react";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: <TrendingUp className="w-4 h-4" />,
    label: "Store analytics",
    prompt: "Give me a full analytics overview of the store — revenue, top products, and order stats.",
  },
  {
    icon: <AlertTriangle className="w-4 h-4" />,
    label: "Low stock alert",
    prompt: "Show me all products that are running low on stock and need restocking.",
  },
  {
    icon: <ShoppingCart className="w-4 h-4" />,
    label: "Pending orders",
    prompt: "Show me all pending and processing orders that need attention.",
  },
  {
    icon: <Users className="w-4 h-4" />,
    label: "Top customers",
    prompt: "Who are my top customers by total spend? Show me their details.",
  },
  {
    icon: <Package className="w-4 h-4" />,
    label: "Product catalog",
    prompt: "Show me all active products in the catalog with their prices and stock levels.",
  },
  {
    icon: <Tag className="w-4 h-4" />,
    label: "Active discounts",
    prompt: "List all currently active discount codes and their usage stats.",
  },
];

interface Props {
  onSelect: (prompt: string) => void;
}

export function QuickActions({ onSelect }: Props) {
  return (
    <div className="px-4 pb-4">
      <p className="text-xs text-[var(--color-text-subtle)] mb-3 text-center">Quick actions</p>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onSelect(action.prompt)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] text-left text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text)] hover:border-[var(--color-border)] transition-all group"
          >
            <span className="text-[var(--color-accent)] shrink-0 group-hover:scale-110 transition-transform">
              {action.icon}
            </span>
            <span className="font-medium text-xs leading-tight">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
