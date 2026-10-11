import { parseCart, type CartItem } from "@/lib/shop";

// The cart is kept in the visitor's browser until checkout (PRD 7.3). It stores only WHAT was chosen
// (package, design, card text). Prices are always looked up from the database when the cart is shown.
export const CART_KEY = "tapvane-cart";
const CHANGED = "tapvane-cart-changed";
const OPEN = "tapvane-cart-open";

export function readCartRaw(): string {
  try {
    return localStorage.getItem(CART_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function readCart(): CartItem[] {
  return parseCart(readCartRaw());
}

export function readCartCount(): number {
  return readCart().reduce((sum, i) => sum + i.quantity, 0);
}

function writeCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // Storage blocked (private window): the cart just won't be remembered.
  }
  window.dispatchEvent(new Event(CHANGED));
}

export function subscribeCart(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

// Tags with no design are merged into one line; cards always get their own line.
export function addToCart(item: Omit<CartItem, "id">) {
  const items = readCart();
  const same = !item.design && items.find((i) => i.slug === item.slug && !i.design);
  if (same) same.quantity = Math.min(99, same.quantity + item.quantity);
  else items.push({ ...item, id: crypto.randomUUID() });
  writeCart(items);
}

export function setQuantity(id: string, quantity: number) {
  writeCart(readCart().map((i) => (i.id === id ? { ...i, quantity: Math.min(99, Math.max(1, quantity)) } : i)));
}

export function removeFromCart(id: string) {
  writeCart(readCart().filter((i) => i.id !== id));
}

export function openCart() {
  window.dispatchEvent(new Event(OPEN));
}

export function onOpenCart(handler: () => void) {
  window.addEventListener(OPEN, handler);
  return () => window.removeEventListener(OPEN, handler);
}
