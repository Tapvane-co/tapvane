"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusPill } from "@/components/AdminOrders";
import { orderRef, type OrderStatus } from "@/lib/orders";
import { formatNaira } from "@/lib/shop";
import { createClient } from "@/lib/supabase/client";

type O = { order_number: number; status: OrderStatus; total: number; created_at: string; customer_name: string; email: string };
type Low = { label: string; quantity: number };

// Money counts once an order is paid (not while waiting, and not if cancelled).
const earning: OrderStatus[] = ["paid", "in_production", "ready_for_pickup", "shipped", "delivered"];
const stockLabel: Record<string, string> = { pvc: "PVC cards", premium: "Matte cards", tag: "NFC tags" };

export default function AdminOverview() {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<O[] | null>(null);
  const [low, setLow] = useState<Low[]>([]);
  const [totals, setTotals] = useState<{ profiles: number; cards: number; unassigned: number } | null>(null);

  useEffect(() => {
    (async () => {
      const count = async (table: "profiles" | "cards", status?: string) => {
        let q = supabase.from(table).select("id", { count: "exact", head: true });
        if (status) q = q.eq("status", status);
        return (await q).count ?? 0;
      };
      const [o, s, profiles, cards, unassigned] = await Promise.all([
        supabase.from("orders").select("order_number, status, total, created_at, customer_name, email").order("created_at", { ascending: false }).limit(2000),
        supabase.from("stock").select("item_type, quantity, low_threshold"),
        count("profiles"),
        count("cards"),
        count("cards", "unassigned"),
      ]);
      setOrders((o.data as O[]) ?? []);
      setLow(
        (s.data ?? [])
          .filter((r) => r.quantity !== null && r.quantity <= r.low_threshold)
          .map((r) => ({ label: stockLabel[r.item_type] ?? r.item_type, quantity: r.quantity as number })),
      );
      setTotals({ profiles, cards, unassigned });
    })();
  }, [supabase]);

  const stats = useMemo(() => {
    const list = orders ?? [];
    const today = new Date().toDateString();
    return {
      today: list.filter((o) => new Date(o.created_at).toDateString() === today).length,
      pending: list.filter((o) => o.status === "awaiting_confirmation").length,
      production: list.filter((o) => o.status === "paid" || o.status === "in_production").length,
      revenue: list.filter((o) => earning.includes(o.status)).reduce((sum, o) => sum + o.total, 0),
    };
  }, [orders]);

  const v = (n: number | undefined) => (orders ? String(n ?? 0) : "–");
  const tiles = [
    { label: "Orders today", value: v(stats.today), href: "/admin/orders" },
    { label: "Transfers to confirm", value: v(stats.pending), href: "/admin/orders", alert: stats.pending > 0 },
    { label: "Paid, to make or ship", value: v(stats.production), href: "/admin/orders" },
    { label: "Revenue (paid orders)", value: orders ? formatNaira(stats.revenue) : "–", href: "/admin/orders" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory">Overview</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className={`rounded-2xl border bg-charcoal p-5 hover:border-gold ${t.alert ? "border-gold" : "border-line"}`}>
            <p className="font-display text-3xl text-gold">{t.value}</p>
            <p className="mt-2 text-sm text-muted">{t.label}</p>
          </Link>
        ))}
      </div>

      {low.length > 0 && (
        <section className="mt-6 rounded-2xl border border-red-900 bg-charcoal p-5" aria-label="Low stock">
          <h2 className="font-display text-xl text-red-300">Low stock</h2>
          <ul className="mt-2 text-sm text-ivory">
            {low.map((l) => (
              <li key={l.label}>{l.label}: {l.quantity === 0 ? "out of stock" : `${l.quantity} left`}</li>
            ))}
          </ul>
          <Link href="/admin/products" className="mt-2 inline-flex min-h-11 items-center text-sm text-gold underline-offset-4 hover:underline">Update stock</Link>
        </section>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-ivory">Latest orders</h2>
          <Link href="/admin/orders" className="flex min-h-11 items-center text-sm text-gold underline-offset-4 hover:underline">See all</Link>
        </div>
        {orders === null ? (
          <p className="mt-3 text-muted">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="mt-3 text-muted">No orders yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {orders.slice(0, 5).map((o) => (
              <li key={o.order_number}>
                <Link href={`/admin/orders/${o.order_number}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-charcoal p-4 hover:border-gold">
                  <span className="text-ivory">{orderRef(o.order_number)} · {o.customer_name || o.email}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-gold">{formatNaira(o.total)}</span>
                    <StatusPill status={o.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {totals && (
        <p className="mt-8 text-sm text-stone">
          {totals.profiles} profiles · {totals.cards} cards made ({totals.unassigned} not yet assigned) ·{" "}
          <Link href="/admin/cards" className="text-gold underline-offset-4 hover:underline">Cards</Link> ·{" "}
          <Link href="/admin/profiles" className="text-gold underline-offset-4 hover:underline">Profiles</Link>
        </p>
      )}
    </div>
  );
}
