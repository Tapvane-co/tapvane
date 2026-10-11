"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { inputClass } from "@/components/AuthForms";
import { saveProduct, saveStock } from "@/lib/admin-actions";
import { formatNaira } from "@/lib/shop";
import { createClient } from "@/lib/supabase/client";

type P = { slug: string; name: string; price: string; cards: string; active: boolean };
type S = { itemType: "pvc" | "premium" | "tag"; quantity: string; low: string };

const stockLabel = { pvc: "PVC cards", premium: "Matte cards", tag: "NFC tags" } as const;
const small = "min-h-11 rounded-full px-5 text-sm font-semibold disabled:opacity-50";

// Edit prices and what each package includes, and count the cards and tags you have in stock.
export default function AdminProducts() {
  const supabase = useMemo(() => createClient(), []);
  const [products, setProducts] = useState<P[] | null>(null);
  const [stock, setStock] = useState<S[] | null>(null);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState<{ key: string; ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const [p, s] = await Promise.all([
      supabase.from("products").select("slug, name, price, cards_included, is_active").order("sort_order"),
      supabase.from("stock").select("item_type, quantity, low_threshold").order("item_type"),
    ]);
    setProducts((p.data ?? []).map((r) => ({ slug: r.slug, name: r.name, price: String(r.price), cards: String(r.cards_included), active: r.is_active })));
    const order = ["pvc", "premium", "tag"];
    setStock(
      (s.data ?? [])
        .sort((a, b) => order.indexOf(a.item_type) - order.indexOf(b.item_type))
        .map((r) => ({ itemType: r.item_type, quantity: r.quantity === null ? "" : String(r.quantity), low: String(r.low_threshold) })),
    );
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function setP(slug: string, patch: Partial<P>) {
    setNote(null);
    setProducts((ps) => ps?.map((p) => (p.slug === slug ? { ...p, ...patch } : p)) ?? null);
  }
  function setS(itemType: S["itemType"], patch: Partial<S>) {
    setNote(null);
    setStock((ss) => ss?.map((s) => (s.itemType === itemType ? { ...s, ...patch } : s)) ?? null);
  }

  async function onSaveProduct(p: P) {
    setBusy(p.slug);
    const r = await saveProduct({ slug: p.slug, name: p.name, price: Number(p.price), cardsIncluded: Number(p.cards), isActive: p.active });
    setBusy("");
    setNote({ key: p.slug, ok: r.ok, text: r.ok ? (r.message ?? "Saved.") : r.error });
  }

  async function onSaveStock() {
    if (!stock) return;
    setBusy("stock");
    const r = await saveStock(
      stock.map((s) => ({
        itemType: s.itemType,
        quantity: s.quantity.trim() === "" ? null : Number(s.quantity),
        lowThreshold: Number(s.low),
      })),
    );
    setBusy("");
    setNote({ key: "stock", ok: r.ok, text: r.ok ? (r.message ?? "Saved.") : r.error });
  }

  const noteFor = (key: string) =>
    note?.key === key && (
      <p role={note.ok ? "status" : "alert"} className={`mt-3 rounded-xl border px-4 py-2 text-sm ${note.ok ? "border-gold text-ivory" : "border-red-900 text-red-300"}`}>
        {note.text}
      </p>
    );

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl text-ivory">Products &amp; stock</h1>

      <h2 className="mt-8 font-display text-2xl text-ivory">Packages and prices</h2>
      <p className="mt-1 text-sm text-muted">Prices are in Naira. A change shows on the website straight away. Switching a package off hides it from the shop.</p>
      {products === null ? (
        <p className="mt-4 text-muted">Loading…</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {products.map((p) => (
            <li key={p.slug} className="rounded-2xl border border-line bg-charcoal p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-2 text-sm text-muted sm:col-span-3">
                  Name
                  <input value={p.name} onChange={(e) => setP(p.slug, { name: e.target.value })} maxLength={40} className={inputClass} />
                </label>
                <label className="flex flex-col gap-2 text-sm text-muted">
                  Price (₦)
                  <input value={p.price} onChange={(e) => setP(p.slug, { price: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className={inputClass} />
                  <span className="text-xs text-stone">{Number(p.price) ? formatNaira(Number(p.price)) : ""}</span>
                </label>
                <label className="flex flex-col gap-2 text-sm text-muted">
                  Cards included
                  <input value={p.cards} onChange={(e) => setP(p.slug, { cards: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className={inputClass} />
                </label>
                <label className="flex min-h-11 items-center gap-3 self-end text-sm text-ivory">
                  <input type="checkbox" checked={p.active} onChange={(e) => setP(p.slug, { active: e.target.checked })} className="h-4 w-4 accent-[#C9A34E]" />
                  Shown in the shop
                </label>
              </div>
              <button type="button" disabled={busy === p.slug} onClick={() => onSaveProduct(p)} className={`${small} mt-4 bg-gold text-onyx`}>
                {busy === p.slug ? "Saving…" : "Save"}
              </button>
              {noteFor(p.slug)}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-12 font-display text-2xl text-ivory">Stock</h2>
      <p className="mt-1 text-sm text-muted">
        How many of each you have. Leave a box <strong className="text-ivory">blank</strong> if you are not counting yet (it can always be ordered).
        When the number reaches &ldquo;few left&rdquo; the shop shows <em>Few left</em>; at 0 it shows <em>Out of stock</em> and stops orders. Paid orders take stock off automatically.
      </p>
      {stock === null ? (
        <p className="mt-4 text-muted">Loading…</p>
      ) : (
        <div className="mt-4 rounded-2xl border border-line bg-charcoal p-5">
          <div className="grid gap-4">
            {stock.map((s) => (
              <div key={s.itemType} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr]">
                <p className="text-ivory sm:pb-3">{stockLabel[s.itemType]}</p>
                <label className="flex flex-col gap-2 text-sm text-muted">
                  In stock
                  <input value={s.quantity} onChange={(e) => setS(s.itemType, { quantity: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="not counting" className={inputClass} />
                </label>
                <label className="flex flex-col gap-2 text-sm text-muted">
                  &ldquo;Few left&rdquo; at or below
                  <input value={s.low} onChange={(e) => setS(s.itemType, { low: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className={inputClass} />
                </label>
              </div>
            ))}
          </div>
          <button type="button" disabled={busy === "stock"} onClick={onSaveStock} className={`${small} mt-5 bg-gold text-onyx`}>
            {busy === "stock" ? "Saving…" : "Save stock"}
          </button>
          {noteFor("stock")}
        </div>
      )}
    </div>
  );
}
