import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2, ShoppingBag, CheckCircle2, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { StoreNav } from "@/components/StoreNav";
import { useCart } from "@/hooks/useCart";
import type { Order } from "@shared/schema";

const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 75;
const SHIPPING_FEE = 9.99;

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
}

const EMPTY_FORM: CheckoutForm = {
  firstName: "", lastName: "", email: "", phone: "",
  address1: "", city: "", state: "", zip: "",
};

export default function Cart() {
  const { cart, updateQuantity, removeItem, subtotal, clearCart } = useCart();
  const qc = useQueryClient();
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  const checkout = useMutation({
    mutationFn: () => apiRequest<{ order: Order }>("/storefront/checkout", {
      method: "POST",
      body: JSON.stringify({
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        customer: { ...form, country: "US" },
      }),
    }),
    onSuccess: (result) => {
      setPlacedOrder(result.order);
      clearCart();
      qc.invalidateQueries({ queryKey: ["storefront-products"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  const formValid = form.firstName && form.lastName && form.email.includes("@") &&
    form.address1 && form.city && form.state && form.zip;

  // Success screen
  if (placedOrder) {
    return (
      <div className="min-h-screen bg-[var(--color-background)]">
        <StoreNav />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-success)]/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[var(--color-success)]" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Order placed!</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Your order <span className="font-mono font-semibold text-[var(--color-text)]">{placedOrder.orderNumber}</span> is confirmed.
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Total: {formatCurrency(placedOrder.total)}</p>

          <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left">
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">Now test Aria 🎯</p>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Head to the Admin panel and ask Aria:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-[var(--color-accent)]">
              <li>"Show me the most recent orders"</li>
              <li>"What did {form.firstName} {form.lastName} order?"</li>
              <li>"Mark order {placedOrder.orderNumber} as shipped"</li>
            </ul>
            <Link
              href="/admin"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white text-xs font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Go to Admin + Aria <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Link href="/" className="mt-4 inline-block text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            ← Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  // Empty cart
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-background)]">
        <StoreNav />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <ShoppingBag className="w-12 h-12 text-[var(--color-border)] mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-[var(--color-text)]">Your cart is empty</h1>
          <Link href="/" className="mt-4 inline-block text-sm text-[var(--color-accent)] hover:underline">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <StoreNav />
      <main className="max-w-4xl mx-auto px-4 py-8 grid md:grid-cols-[1fr_320px] gap-8">
        {/* Cart items + form */}
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text)] mb-4">Your cart</h1>
          <div className="space-y-2 mb-8">
            {cart.map((line) => (
              <div key={line.product.id} className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">{line.product.name}</p>
                  <p className="text-xs text-[var(--color-text-subtle)]">{formatCurrency(line.product.price)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(line.product.id, line.quantity - 1)} className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm text-[var(--color-text)]">{line.quantity}</span>
                  <button onClick={() => updateQuantity(line.product.id, line.quantity + 1)} className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="w-20 text-right text-sm font-medium text-[var(--color-text)]">
                  {formatCurrency(line.product.price * line.quantity)}
                </span>
                <button onClick={() => removeItem(line.product.id)} className="text-[var(--color-text-subtle)] hover:text-[var(--color-danger)]">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">Shipping details</h2>
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
            <FormInput label="Last name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
            <FormInput label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} className="col-span-2" />
            <FormInput label="Phone (optional)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} className="col-span-2" />
            <FormInput label="Address" value={form.address1} onChange={(v) => setForm({ ...form, address1: v })} className="col-span-2" />
            <FormInput label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <div className="grid grid-cols-2 gap-3">
              <FormInput label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
              <FormInput label="ZIP" value={form.zip} onChange={(v) => setForm({ ...form, zip: v })} />
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="md:sticky md:top-20 h-fit rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-4">Order summary</h2>
          <div className="space-y-2 text-sm">
            <Row label="Subtotal" value={formatCurrency(subtotal)} />
            <Row label="Shipping" value={shipping === 0 ? "Free" : formatCurrency(shipping)} />
            <Row label="Tax (8%)" value={formatCurrency(tax)} />
            <div className="border-t border-[var(--color-border)] my-2" />
            <Row label="Total" value={formatCurrency(total)} bold />
          </div>

          {subtotal < FREE_SHIPPING_THRESHOLD && (
            <p className="text-[10px] text-[var(--color-text-subtle)] mt-2">
              Add {formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal)} for free shipping
            </p>
          )}

          {checkout.isError && (
            <p className="text-xs text-[var(--color-danger)] mt-3">
              {(checkout.error as Error).message}
            </p>
          )}

          <button
            onClick={() => checkout.mutate()}
            disabled={!formValid || checkout.isPending}
            className="w-full mt-4 px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {checkout.isPending ? "Placing order…" : `Place order · ${formatCurrency(total)}`}
          </button>
          <p className="text-[10px] text-[var(--color-text-subtle)] text-center mt-2">Demo checkout — no real payment</p>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "font-semibold text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}>{label}</span>
      <span className={bold ? "font-semibold text-[var(--color-text)]" : "text-[var(--color-text)]"}>{value}</span>
    </div>
  );
}

function FormInput({ label, value, onChange, className = "" }: {
  label: string; value: string; onChange: (v: string) => void; className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] text-[var(--color-text-subtle)] uppercase tracking-wide">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] transition-colors"
      />
    </label>
  );
}
