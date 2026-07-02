import { useState, useEffect, useCallback } from "react";
import type { Product } from "@shared/schema";

export interface CartLine {
  product: Product;
  quantity: number;
}

const STORAGE_KEY = "aria-cart";

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

// Module-level store so all useCart consumers stay in sync
let listeners: Array<() => void> = [];
let cartState: CartLine[] = typeof window !== "undefined" ? loadCart() : [];

function setCart(next: CartLine[]) {
  cartState = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
  listeners.forEach((l) => l());
}

export function useCart() {
  const [, force] = useState(0);

  useEffect(() => {
    const listener = () => force((n) => n + 1);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const addItem = useCallback((product: Product, quantity = 1) => {
    const existing = cartState.find((l) => l.product.id === product.id);
    if (existing) {
      setCart(cartState.map((l) =>
        l.product.id === product.id
          ? { ...l, quantity: Math.min(l.quantity + quantity, product.stock) }
          : l
      ));
    } else {
      setCart([...cartState, { product, quantity: Math.min(quantity, product.stock) }]);
    }
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cartState.filter((l) => l.product.id !== productId));
      return;
    }
    setCart(cartState.map((l) =>
      l.product.id === productId
        ? { ...l, quantity: Math.min(quantity, l.product.stock) }
        : l
    ));
  }, []);

  const removeItem = useCallback((productId: number) => {
    setCart(cartState.filter((l) => l.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const itemCount = cartState.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = cartState.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  return { cart: cartState, addItem, updateQuantity, removeItem, clearCart, itemCount, subtotal };
}
