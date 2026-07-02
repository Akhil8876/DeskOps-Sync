import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { StoreNav } from "@/components/StoreNav";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Product } from "@shared/schema";

export default function Storefront() {
  const [category, setCategory] = useState<string | null>(null);

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ["storefront-categories"],
    queryFn: () => apiRequest("/storefront/categories"),
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["storefront-products", category],
    queryFn: () => apiRequest(`/storefront/products${category ? `?category=${encodeURIComponent(category)}` : ""}`),
  });

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <StoreNav />

      {/* Hero */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Shop the collection</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Place an order here, then head to <span className="text-[var(--color-accent)]">Admin + Aria</span> and ask Aria about it.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setCategory(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              category === null
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                category === cat
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-[var(--radius-lg)] bg-[var(--color-surface-2)] animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-sm text-[var(--color-text-muted)] py-16">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
