"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMyOrders } from "@/lib/checkout-actions";
import { orderRef, statusLabel, type Order } from "@/lib/orders";
import { formatNaira } from "@/lib/shop";

// The customer's list of orders with their status (PRD 7.4).
export default function OrdersList() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    getMyOrders().then((list) => (list === null ? router.replace("/login?next=/dashboard/orders") : setOrders(list)));
  }, [router]);

  if (orders === null) return <p className="mt-8 text-muted">Loading…</p>;
  if (orders.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-start gap-4">
        <p className="text-muted">You have not placed an order yet.</p>
        <Link href="/packages" className="flex min-h-12 items-center justify-center rounded-full bg-gold px-8 font-semibold text-onyx">
          Browse packages
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-8 flex flex-col gap-3">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/dashboard/orders/${o.orderNumber}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-charcoal p-5 hover:border-gold">
            <div>
              <p className="text-ivory">Order {orderRef(o.orderNumber)}</p>
              <p className="text-xs text-muted">
                {new Date(o.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                {o.items.map((i) => (i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name)).join(", ")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gold">{formatNaira(o.total)}</p>
              <span className="mt-1 inline-block rounded-full border border-gold px-3 py-0.5 text-xs text-gold">{statusLabel[o.status]}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
