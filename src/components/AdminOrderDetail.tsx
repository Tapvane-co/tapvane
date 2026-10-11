"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusPill } from "@/components/AdminOrders";
import { OrderThumb } from "@/components/OrderView";
import { changeOrderStatus } from "@/lib/admin-actions";
import { deliveryLabel, orderRef, phoneToWhatsapp, rowToOrder, statusLabel, type Order, type OrderStatus } from "@/lib/orders";
import { formatNaira } from "@/lib/shop";
import { createClient } from "@/lib/supabase/client";

type Raw = { customer_name: string; email: string; paid_at: string | null; proof_url: string | null };

type Step = { label: string; status: OrderStatus; confirm?: string; danger?: boolean };

// The one or two buttons that make sense next, for the order's current status.
function nextSteps(o: Order): Step[] {
  const cancel: Step = { label: "Cancel order", status: "cancelled", confirm: "Cancel this order? The customer will be emailed.", danger: true };
  switch (o.status) {
    case "awaiting_confirmation":
      return [{ label: "Confirm payment received", status: "paid", confirm: `Confirm that you have received ${formatNaira(o.total)} for this order?` }, cancel];
    case "awaiting_payment":
      return [{ label: "Mark as paid", status: "paid", confirm: `Mark this order as paid (${formatNaira(o.total)})? Only do this if you have the money.` }, cancel];
    case "paid":
      return [{ label: "Start production", status: "in_production" }, cancel];
    case "in_production":
      return [o.deliveryOption === "pickup" ? { label: "Ready for pickup", status: "ready_for_pickup" } : { label: "Mark as shipped", status: "shipped" }, cancel];
    case "ready_for_pickup":
    case "shipped":
      return [{ label: "Mark as delivered", status: "delivered" }];
    default:
      return [];
  }
}

const allStatuses = Object.keys(statusLabel) as OrderStatus[];
const button = "min-h-12 rounded-full px-6 text-sm font-semibold disabled:opacity-50";

export default function AdminOrderDetail({ number }: { number: number }) {
  const supabase = useMemo(() => createClient(), []);
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [raw, setRaw] = useState<Raw | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [manual, setManual] = useState<OrderStatus>("paid");

  const load = useCallback(async () => {
    const { data } = await supabase.from("orders").select("*").eq("order_number", number).maybeSingle();
    if (!data) return setOrder(null);
    setOrder(rowToOrder(data));
    setRaw({ customer_name: data.customer_name, email: data.email, paid_at: data.paid_at, proof_url: data.proof_url });
    setManual(data.status);
    if (data.proof_url) {
      const { data: signed } = await supabase.storage.from("payment-proofs").createSignedUrl(data.proof_url, 600);
      setProofUrl(signed?.signedUrl ?? "");
    } else {
      setProofUrl("");
    }
  }, [supabase, number]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function change(status: OrderStatus, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setError("");
    setMessage("");
    const result = await changeOrderStatus(number, status);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setMessage(
      result.emailed === true
        ? `Status changed to ${statusLabel[status]}. The customer has been emailed.`
        : result.emailed === false
          ? `Status changed to ${statusLabel[status]}. The email could not be sent (emails are not set up yet), so please let the customer know.`
          : `Status changed to ${statusLabel[status]}.`,
    );
    await load();
  }

  if (order === undefined) return <p className="text-muted">Loading…</p>;
  if (order === null || !raw) return <p className="text-muted">We could not find that order.</p>;

  const steps = nextSteps(order);
  const o = order;

  return (
    <div className="max-w-3xl">
      <Link href="/admin/orders" className="text-sm text-gold underline-offset-4 hover:underline">&larr; All orders</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-ivory">Order {orderRef(o.orderNumber)}</h1>
        <StatusPill status={o.status} />
      </div>
      <p className="mt-1 text-xs text-stone">
        Placed {new Date(o.createdAt).toLocaleString("en-NG", { dateStyle: "long", timeStyle: "short" })}
      </p>

      {/* What to do next */}
      <section className="mt-6 rounded-2xl border border-gold bg-charcoal p-5">
        <h2 className="font-display text-xl text-ivory">Next step</h2>
        {o.status === "awaiting_confirmation" && (
          <p className="mt-1 text-sm text-muted">
            The customer says they have paid by bank transfer.{" "}
            {raw.proof_url ? "They uploaded a receipt (see below)." : "No receipt uploaded yet; they may send it on WhatsApp."} Check your bank account, then confirm.
          </p>
        )}
        {steps.length === 0 && <p className="mt-1 text-sm text-muted">This order is finished. Nothing more to do.</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          {steps.map((s) => (
            <button key={s.status} type="button" disabled={busy} onClick={() => change(s.status, s.confirm)}
              className={`${button} ${s.danger ? "border border-red-900 text-red-300 hover:border-red-400" : "bg-gold text-onyx hover:brightness-110"}`}>
              {busy ? "Please wait…" : s.label}
            </button>
          ))}
        </div>
        <details className="mt-5 text-sm">
          <summary className="min-h-11 cursor-pointer text-muted">Set the status by hand (to correct a mistake)</summary>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <select value={manual} onChange={(e) => setManual(e.target.value as OrderStatus)} aria-label="Status" className="min-h-11 rounded-xl border border-line bg-onyx px-3 text-ivory">
              {allStatuses.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
            </select>
            <button type="button" disabled={busy || manual === o.status} onClick={() => change(manual, `Change the status to "${statusLabel[manual]}"?`)} className="min-h-11 rounded-full border border-line px-5 text-ivory hover:border-gold disabled:opacity-50">
              Change
            </button>
          </div>
        </details>
        {message && <p role="status" className="mt-4 rounded-xl border border-gold px-4 py-3 text-sm text-ivory">{message}</p>}
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-900 px-4 py-3 text-sm text-red-300">{error}</p>}
      </section>

      {/* Customer, delivery, payment */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <section className="rounded-2xl border border-line bg-charcoal p-5 text-sm">
          <h2 className="font-display text-lg text-ivory">Customer</h2>
          <p className="mt-2 text-ivory">{raw.customer_name || "—"}</p>
          <a href={`mailto:${raw.email}`} className="block break-all text-gold underline-offset-4 hover:underline">{raw.email}</a>
          <p className="mt-2 text-muted">{o.phone}</p>
          <div className="mt-2 flex gap-3">
            <a href={`tel:${o.phone}`} className="flex min-h-11 items-center text-gold underline-offset-4 hover:underline">Call</a>
            <a href={phoneToWhatsapp(o.phone)} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center text-gold underline-offset-4 hover:underline">WhatsApp</a>
          </div>
        </section>
        <section className="rounded-2xl border border-line bg-charcoal p-5 text-sm">
          <h2 className="font-display text-lg text-ivory">Delivery</h2>
          <p className="mt-2 text-ivory">{deliveryLabel[o.deliveryOption]}</p>
          {o.deliveryOption !== "pickup" && (
            <p className="mt-1 text-muted">{[o.address, o.city, o.state].filter(Boolean).join(", ")}</p>
          )}
        </section>
        <section className="rounded-2xl border border-line bg-charcoal p-5 text-sm">
          <h2 className="font-display text-lg text-ivory">Payment</h2>
          <p className="mt-2 text-ivory">{o.paymentMethod === "paystack" ? "Paystack" : "Bank transfer"}</p>
          <p className="mt-1 text-muted">
            {raw.paid_at ? `Paid ${new Date(raw.paid_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}` : "Not paid yet"}
          </p>
          {o.paymentMethod === "transfer" && (
            proofUrl ? (
              <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex min-h-11 items-center text-gold underline-offset-4 hover:underline">
                View payment proof
              </a>
            ) : (
              <p className="mt-1 text-stone">No receipt uploaded</p>
            )
          )}
        </section>
      </div>

      {/* Items */}
      <section className="mt-6 rounded-2xl border border-line bg-charcoal p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl text-ivory">What to make</h2>
          <Link href={`/admin/orders/${o.orderNumber}/print`} target="_blank" className="flex min-h-11 items-center rounded-full border border-line px-5 text-sm text-ivory hover:border-gold">
            Print design details
          </Link>
        </div>
        <ul className="mt-2 divide-y divide-line-subtle">
          {o.items.map((line, i) => (
            <li key={i} className="flex items-start gap-4 py-4">
              <OrderThumb line={line} />
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-ivory">{line.name}{line.quantity > 1 && <span className="text-muted"> × {line.quantity}</span>}</p>
                {line.design && (
                  <>
                    <p className="text-xs text-muted">
                      {line.design.template.name} · {line.design.colour.name} · {line.design.finish === "matte" ? "Matte" : "Standard"}
                    </p>
                    {line.design.details_later ? (
                      <p className="mt-1 text-xs text-gold">Customer will add card details later from their dashboard.</p>
                    ) : (
                      <ol className="mt-1 list-inside list-decimal text-xs text-muted">
                        {line.design.cards.map((c, k) => (
                          <li key={k}>{[c.name, c.title, c.company].filter(Boolean).join(" · ")}</li>
                        ))}
                      </ol>
                    )}
                  </>
                )}
              </div>
              <span className="text-gold">{formatNaira(line.line_total)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="text-ivory">{formatNaira(o.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="text-ivory">{o.deliveryFee === 0 ? "Free" : formatNaira(o.deliveryFee)}</dd></div>
          <div className="flex justify-between text-base"><dt className="text-ivory">Total</dt><dd className="font-display text-xl text-gold">{formatNaira(o.total)}</dd></div>
        </dl>
      </section>
    </div>
  );
}
