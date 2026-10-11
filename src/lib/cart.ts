// The cart is kept in the visitor's browser until checkout (PRD 7.3). Stage 7 adds items to it.
// For now this only reads how many items are in it, for the number on the cart icon.
export const CART_KEY = "tapvane-cart";

export function readCartCount(): number {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum: number, i: { quantity?: number }) => sum + (Number(i?.quantity) || 1), 0);
  } catch {
    return 0;
  }
}

export function subscribeCart(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("tapvane-cart-changed", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("tapvane-cart-changed", onChange);
  };
}
