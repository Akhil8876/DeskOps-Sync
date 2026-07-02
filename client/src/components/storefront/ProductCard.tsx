import { Plus, Check, Package } from "lucide-react";
import { useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import type { Product } from "@shared/schema";

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;

  const handleAdd = () => {
    if (outOfStock) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;

  return (
    <div className="group flex flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden hover:border-[var(--color-accent)] transition-colors">
      {/* Image placeholder */}
      <div className="relative aspect-square bg-[var(--color-surface-2)] flex items-center justify-center overflow-hidden">
        <Package className="w-16 h-16 text-[var(--color-border)] group-hover:scale-110 transition-transform" />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-[var(--color-danger)] text-white text-[10px] font-bold px-2 py-1 rounded-full">
            -{discount}%
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-[var(--color-background)]/70 flex items-center justify-center">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Out of stock</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3 gap-1">
        <p className="text-[10px] text-[var(--color-text-subtle)] uppercase tracking-wide">{product.category}</p>
        <h3 className="text-sm font-medium text-[var(--color-text)] leading-tight line-clamp-2">{product.name}</h3>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-base font-semibold text-[var(--color-text)]">{formatCurrency(product.price)}</span>
          {discount > 0 && (
            <span className="text-xs text-[var(--color-text-subtle)] line-through">
              {formatCurrency(product.comparePrice!)}
            </span>
          )}
        </div>

        {!outOfStock && product.stock <= (product.lowStockThreshold ?? 10) && (
          <p className="text-[10px] text-[var(--color-warning)]">Only {product.stock} left</p>
        )}

        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className={cn(
            "mt-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium transition-all",
            outOfStock
              ? "bg-[var(--color-surface-2)] text-[var(--color-text-subtle)] cursor-not-allowed"
              : added
                ? "bg-[var(--color-success)] text-white"
                : "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
          )}
        >
          {added ? <><Check className="w-3.5 h-3.5" /> Added</> : <><Plus className="w-3.5 h-3.5" /> Add to cart</>}
        </button>
      </div>
    </div>
  );
}
