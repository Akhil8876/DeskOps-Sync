import { Link, useLocation } from "wouter";
import { ShoppingCart, Sparkles, LayoutDashboard, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";

export function StoreNav() {
  const [location] = useLocation();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[var(--color-text)]">Aria Store</p>
            <p className="text-[10px] text-[var(--color-text-subtle)]">Demo shop</p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-colors",
              location === "/" ? "bg-[var(--color-surface-3)] text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            <Store className="w-3.5 h-3.5" /> Shop
          </Link>
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-colors",
              location === "/admin" ? "bg-[var(--color-surface-3)] text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Admin + Aria
          </Link>
          <Link
            href="/cart"
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
