"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { inputClass } from "@/components/AuthForms";
import { orderRef, statusLabel, type OrderStatus } from "@/lib/orders";
import { formatNaira } from "@/lib/shop";
import { createClient } from "@/lib/supabase/client";

type Row = {
  order_number: number;
  status: OrderStatus;
  customer_name: string;
  email: string;
  total: number;
  payment_method: "paystack" | "transfer";
  delivery_option: string;
  created_at: string;
  items: { name: string; quantity: number }[];
};

const order: OrderStatus[] = [
  "awaiting_confirmation", "awaiting_payment", "paid", "in_production",
  "ready_for_pickup", "shipped", "delivered", "cancelled",
];

export function StatusPill({ status }: { status: OrderStatus }) {
  const tone =
    status === "cancelled" ? "border-red-900 text-red-300"
    : status === "awaiting_confirmation" || status === "awaiting_payment" ? "border-gold text-gold"
    : "border-line text-ivory";
  return <span className={`inline-block rounded-full border px-3 py-0.5 text-xs ${tone}`}>{statusLabel[status]}</span>;
}

// All orders, newest first. Filter by status (bank transfers waiting to be confirmed come first).
export default function AdminOrders() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("order_number, status, customer_name, email, total, payment_method, delivery_option, created_at, items")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) setError("We could not load orders. Please refresh the page.");
      setRows((data as unknown as Row[]) ?? []);
    })();
  }, [supabase]);

  const counts = useMemo(() => {
    const c: Partial<Record<OrderStatus, number>> = {};
    (rows ?? []).forEach((r) => (c[r.status] = (c[r.status] ?? 0) + 1));
    return c;
  }, [rows]);

  const q = search.trim().toLowerCase().replace(/^#/, "");
  const shown = (rows ?? []).filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      (!q || String(r.order_number).includes(q) || r.customer_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)),
  );

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory">Orders</h1>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}
          className={`min-h-11 rounded-full px-4 text-sm ${filter === "all" ? "bg-gold font-semibold text-onyx" : "border border-line text-ivory hover:border-gold"}`}>
          All ({rows?.length ?? 0})
        </button>
        {order.filter((s) => counts[s]).map((s) => (
          <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)}
            className={`min-h-11 rounded-full px-4 text-sm ${filter === s ? "bg-gold font-semibold text-onyx" : "border border-line text-ivory hover:border-gold"}`}>
            {statusLabel[s]} ({counts[s]})
          </button>
        ))}
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order number, name or email" aria-label="Search orders" className={`${inputClass} mt-4 max-w-md`} />
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-900 px-4 py-3 text-sm text-red-300">{error}</p>}

      {rows === null ? (
        <p className="mt-6 text-muted">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="mt-6 text-muted">{rows.length === 0 ? "No orders yet." : "No orders match."}</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {shown.map((r) => (
            <li key={r.order_number}>
              <Link href={`/admin/orders/${r.order_number}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-charcoal p-4 hover:border-gold">
                <div className="min-w-0">
                  <p className="text-ivory">
                    {orderRef(r.order_number)} · {r.customer_name || r.email}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {new Date(r.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                    {r.items.map((i) => (i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name)).join(", ")} ·{" "}
                    {r.payment_method === "paystack" ? "Paystack" : "Bank transfer"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gold">{formatNaira(r.total)}</p>
                  <StatusPill status={r.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
