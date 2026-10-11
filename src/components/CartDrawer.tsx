"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { onOpenCart } from "@/lib/cart";

// The cart list is only downloaded the first time someone opens the cart.
const CartContents = dynamic(() => import("@/components/CartContents"), {
  ssr: false,
  loading: () => <p className="py-6 text-muted">Loading…</p>,
});

// The cart side panel, opened from the cart icon in the menu (or after "Add to cart").
export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => onOpenCart(() => setOpen(true)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-onyx"
      >
        <div className="flex items-center justify-between border-b border-line-subtle px-6 py-4">
          <h2 className="font-display text-2xl text-ivory">Your cart</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ivory hover:text-gold"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-2">
          <CartContents onNavigate={() => setOpen(false)} />
        </div>
      </aside>
    </div>
  );
}
