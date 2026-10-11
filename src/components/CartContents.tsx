"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import CardMockup, { noirGold } from "@/components/CardMockup";
import { readCartRaw, removeFromCart, setQuantity, subscribeCart } from "@/lib/cart";
import { loadShopData } from "@/lib/shop-actions";
import { formatNaira, parseCart, unitsUsed, type CartItem, type ShopData } from "@/lib/shop";

export function Thumb({ item, data }: { item: CartItem; data: ShopData }) {
  const d = item.design;
  if (!d) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold bg-charcoal text-center">
        <span className="font-display text-[8px] uppercase tracking-[0.2em] text-gold">Tag</span>
      </div>
    );
  }
  const template = data.templates.find((t) => t.slug === d.template);
  const colours = data.colours.find((c) => c.slug === d.colour) ?? noirGold;
  const first = d.detailsLater ? undefined : d.cards[0];
  return (
    <div className="w-24 shrink-0">
      <CardMockup
        layout={template?.layout}
        colours={colours}
        finish={d.finish}
        name={first?.name ?? ""}
        title={first?.title ?? ""}
        company={first?.company ?? ""}
      />
    </div>
  );
}

// The list of items in the cart, with prices from the database. Used in the side panel and on /cart.
export default function CartContents({ onNavigate }: { onNavigate?: () => void }) {
  const raw = useSyncExternalStore(subscribeCart, readCartRaw, () => "[]");
  const items = useMemo(() => parseCart(raw), [raw]);
  const [data, setData] = useState<ShopData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadShopData()
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <p className="font-display text-2xl text-ivory">Your cart is empty</p>
        <Link href="/packages" onClick={onNavigate} className="flex min-h-12 items-center justify-center rounded-full bg-gold px-8 font-semibold text-onyx">
          Browse packages
        </Link>
      </div>
    );
  }

  if (failed) return <p className="py-6 text-muted">We could not load your cart. Please refresh the page.</p>;
  if (!data) return <p className="py-6 text-muted">Loading…</p>;

  const products = data.products;
  if (!products) {
    return <p className="py-6 text-muted">Prices are not available right now. Please check back shortly or chat with us on WhatsApp.</p>;
  }

  const used = unitsUsed(items, products);
  const short = data.stock.filter((s) => s.quantity !== null && used[s.itemType] > s.quantity);
  const lines = items.map((item) => ({ item, product: products.find((p) => p.slug === item.slug) }));
  const subtotal = lines.reduce((sum, l) => sum + (l.product ? l.product.price * l.item.quantity : 0), 0);
  const blocked = short.length > 0 || lines.some((l) => !l.product);

  return (
    <div>
      <ul className="divide-y divide-line-subtle">
        {lines.map(({ item, product }) => {
          const d = item.design;
          const template = d && data.templates.find((t) => t.slug === d.template)?.name;
          const colour = d && data.colours.find((c) => c.slug === d.colour)?.name;
          const isTag = !d;
          return (
            <li key={item.id} className="flex gap-4 py-5">
              <Thumb item={item} data={data} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ivory">{product ? product.name : "No longer available"}</p>
                {d && (
                  <p className="mt-1 text-xs text-muted">
                    {[template, colour, d.finish === "matte" ? "Matte" : "Standard"].filter(Boolean).join(" · ")}
                  </p>
                )}
                {d && (
                  <p className="mt-1 truncate text-xs text-muted">
                    {d.detailsLater
                      ? "Details to be added later"
                      : d.cards.length > 1
                        ? `${d.cards.length} cards`
                        : d.cards[0]?.name}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  {isTag ? (
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label="Fewer" onClick={() => setQuantity(item.id, item.quantity - 1)} className="h-11 w-11 rounded-full border border-line text-ivory hover:border-gold">−</button>
                      <span className="w-8 text-center text-sm text-ivory">{item.quantity}</span>
                      <button type="button" aria-label="More" onClick={() => setQuantity(item.id, item.quantity + 1)} className="h-11 w-11 rounded-full border border-line text-ivory hover:border-gold">+</button>
                    </div>
                  ) : (
                    <span />
                  )}
                  <span className="text-gold">{product ? formatNaira(product.price * item.quantity) : "–"}</span>
                </div>
                <button type="button" onClick={() => removeFromCart(item.id)} className="mt-1 min-h-11 text-sm text-stone underline-offset-4 hover:text-ivory hover:underline">
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {short.length > 0 && (
        <p role="alert" className="mb-4 rounded-xl border border-red-900 px-4 py-3 text-sm text-red-300">
          Some items are not available in the amount you chose. Please remove or reduce them to continue.
        </p>
      )}

      <div className="flex items-center justify-between border-t border-line pt-4 text-ivory">
        <span>Subtotal</span>
        <span className="font-display text-2xl text-gold">{formatNaira(subtotal)}</span>
      </div>
      <p className="mt-1 text-xs text-stone">Delivery is chosen at checkout.</p>

      <div className="mt-5 flex flex-col gap-3">
        {blocked ? (
          <span aria-disabled="true" className="flex min-h-12 items-center justify-center rounded-full bg-gold/40 px-6 font-semibold text-onyx">
            Continue to checkout
          </span>
        ) : (
          <Link href="/checkout" onClick={onNavigate} className="flex min-h-12 items-center justify-center rounded-full bg-gold px-6 font-semibold text-onyx hover:brightness-110">
            Continue to checkout
          </Link>
        )}
        <Link href="/packages" onClick={onNavigate} className="flex min-h-12 items-center justify-center rounded-full border border-line px-6 text-sm text-ivory hover:border-gold">
          Add another item
        </Link>
      </div>
    </div>
  );
}
