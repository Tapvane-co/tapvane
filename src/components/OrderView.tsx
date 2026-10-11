"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import CardMockup from "@/components/CardMockup";
import {
  getMyOrder,
  getOrderContact,
  recordTransferProof,
  startPayment,
  verifyPayment,
} from "@/lib/checkout-actions";
import { deliveryLabel, orderRef, statusLabel, type Order, type OrderLine } from "@/lib/orders";
import { formatNaira, whatsappLink } from "@/lib/shop";
import { createClient } from "@/lib/supabase/client";

type Contact = Awaited<ReturnType<typeof getOrderContact>>;

const goldButton = "flex min-h-12 items-center justify-center rounded-full bg-gold px-8 font-semibold text-onyx hover:brightness-110 disabled:opacity-50";

export function OrderThumb({ line }: { line: OrderLine }) {
  const d = line.design;
  if (!d) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold bg-charcoal">
        <span className="font-display text-[8px] uppercase tracking-[0.2em] text-gold">Tag</span>
      </div>
    );
  }
  const first = d.details_later ? undefined : d.cards[0];
  return (
    <div className="w-24 shrink-0">
      <CardMockup
        layout={d.template.layout}
        finish={d.finish}
        colours={{
          slug: d.colour.slug,
          name: d.colour.name,
          frontBg: d.colour.front_bg,
          frontText: d.colour.front_text,
          accent: d.colour.accent,
          backBg: d.colour.back_bg,
          backText: d.colour.back_text,
        }}
        name={first?.name ?? ""}
        title={first?.title ?? ""}
        company={first?.company ?? ""}
      />
    </div>
  );
}

// One order: what was bought, where it stands, and (for bank transfers) how to send proof.
// `reference` is set when the customer has just come back from Paystack's payment page.
export default function OrderView({ number, thankYou = false, reference }: { number: number; thankYou?: boolean; reference?: string | null }) {
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [contact, setContact] = useState<Contact | null>(null);
  const [checking, setChecking] = useState(Boolean(reference));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const returning = Boolean(reference);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [o, c] = await Promise.all([getMyOrder(number), getOrderContact()]);
      if (cancelled) return;
      setOrder(o);
      setContact(c);

      // Just back from Paystack: ask Paystack whether the payment went through (the webhook may be a moment behind).
      if (o && returning && o.status === "awaiting_payment" && o.paymentMethod === "paystack") {
        for (let i = 0; i < 8 && !cancelled; i++) {
          const status = await verifyPayment(number);
          if (cancelled) return;
          if (status && status !== "awaiting_payment") {
            const fresh = await getMyOrder(number);
            if (!cancelled) setOrder(fresh);
            break;
          }
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [number, returning]);

  if (order === undefined) return <p className="py-10 text-muted">Loading…</p>;
  if (order === null) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <p className="font-display text-2xl text-ivory">We could not find that order</p>
        <p className="text-muted">If you have just paid, please log in with the account you used to order.</p>
        <Link href={`/login?next=/dashboard/orders/${number}`} className="flex min-h-12 items-center justify-center rounded-full bg-gold px-8 font-semibold text-onyx">
          Log in
        </Link>
      </div>
    );
  }

  async function payNow() {
    setBusy(true);
    setError("");
    const result = await startPayment(number);
    if (!result.ok) {
      setBusy(false);
      return setError(result.error);
    }
    window.location.assign(result.payUrl);
  }

  async function onProof(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !contact) return;
    setError("");
    setMessage("");
    const okType = ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type);
    if (!okType) return setError("Please choose a photo (JPG, PNG or WebP) or a PDF.");
    if (file.size > 5 * 1024 * 1024) return setError("That file is too big. Please choose one under 5 MB.");

    setBusy(true);
    const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
    const path = `${contact.userId}/${number}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file, { contentType: file.type });
    const saved = upErr ? { ok: false } : await recordTransferProof(number, path);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!saved.ok) return setError("We could not upload that file. Please try again, or send it on WhatsApp.");
    setMessage("Thanks! We have your proof of payment.");
    setOrder(await getMyOrder(number));
  }

  const o = order;
  const waProof = contact ? whatsappLink(contact.whatsappNumber, `Hi Tapvane, here is my payment proof for order ${orderRef(o.orderNumber)}.`) : "#";

  let title = thankYou ? "Thank you! Your order is in." : `Order ${orderRef(o.orderNumber)}`;
  let intro: string | null = null;
  if (o.status === "awaiting_confirmation") {
    title = "We're confirming your payment";
    intro = "Thanks for your transfer. We'll confirm it within 24 hours and email you once your order is in production.";
  } else if (o.status === "awaiting_payment") {
    title = checking ? "Confirming your payment…" : "Waiting for your payment";
    intro = checking ? "This only takes a moment." : "Your order will start once your payment is confirmed.";
  } else if (o.status === "cancelled") {
    title = "This order was cancelled";
  }
  const showProfileCta = thankYou && o.status !== "awaiting_payment" && o.status !== "cancelled";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl text-ivory">{title}</h1>
      {intro && <p className="mt-3 text-muted">{intro}</p>}
      {thankYou && o.status !== "awaiting_confirmation" && o.status !== "awaiting_payment" && (
        <p className="mt-3 text-muted">
          Order number: {orderRef(o.orderNumber)}.{" "}
          {contact?.emails ? "We've sent the details to your email. " : ""}
          Next, set up your digital profile so it&apos;s ready when your card arrives.
        </p>
      )}
      {thankYou && o.status === "awaiting_confirmation" && <p className="mt-3 text-muted">Order number: {orderRef(o.orderNumber)}.</p>}

      {showProfileCta && (
        <Link href="/dashboard" className={`${goldButton} mt-6 inline-flex`}>
          Set up my profile
        </Link>
      )}

      {/* Pay now */}
      {o.status === "awaiting_payment" && o.paymentMethod === "paystack" && !checking && contact?.paystack && (
        <div className="mt-6">
          <button type="button" onClick={payNow} disabled={busy} className={goldButton}>
            {busy ? "Please wait…" : `Pay ${formatNaira(o.total)}`}
          </button>
        </div>
      )}

      {/* Bank transfer */}
      {o.paymentMethod === "transfer" && o.status === "awaiting_confirmation" && contact && (
        <section className="mt-8 rounded-2xl border border-line bg-charcoal p-6">
          <h2 className="font-display text-2xl text-ivory">Send us your proof of payment</h2>
          {contact.bank && (
            <dl className="mt-4 divide-y divide-line-subtle rounded-xl border border-line text-sm">
              {[
                ["Bank", contact.bank.name],
                ["Account name", contact.bank.accountName],
                ["Account number", contact.bank.accountNumber],
                ["Amount", formatNaira(o.total)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right text-ivory">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={onProof} hidden />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={`${goldButton} sm:w-auto`}>
              {busy ? "Uploading…" : o.proofUploaded ? "Upload a different receipt" : "Upload my receipt"}
            </button>
            <a href={waProof} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center rounded-full border border-line px-8 text-ivory hover:border-gold">
              Send proof on WhatsApp
            </a>
          </div>
          {o.proofUploaded && !message && <p className="mt-3 text-sm text-gold">✓ We have your proof of payment.</p>}
        </section>
      )}

      {message && <p role="status" className="mt-5 rounded-xl border border-gold px-4 py-3 text-sm text-ivory">{message}</p>}
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-900 px-4 py-3 text-sm text-red-300">{error}</p>}

      {/* The order */}
      <section className="mt-8 rounded-2xl border border-line bg-charcoal p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl text-ivory">Order {orderRef(o.orderNumber)}</h2>
          <span className="rounded-full border border-gold px-3 py-1 text-xs text-gold">{statusLabel[o.status]}</span>
        </div>
        <p className="mt-1 text-xs text-stone">{new Date(o.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p>

        <ul className="mt-4 divide-y divide-line-subtle">
          {o.items.map((line, i) => (
            <li key={i} className="flex items-center gap-4 py-4">
              <OrderThumb line={line} />
              <div className="min-w-0 flex-1">
                <p className="text-ivory">
                  {line.name}
                  {line.quantity > 1 && <span className="text-muted"> × {line.quantity}</span>}
                </p>
                {line.design && (
                  <p className="text-xs text-muted">
                    {[line.design.template.name, line.design.colour.name, line.design.finish === "matte" ? "Matte" : "Standard"].join(" · ")}
                  </p>
                )}
                {line.design && (
                  <p className="truncate text-xs text-muted">
                    {line.design.details_later
                      ? "Details to be added later"
                      : line.design.cards.length > 1
                        ? `${line.design.cards.length} cards`
                        : line.design.cards[0]?.name}
                  </p>
                )}
              </div>
              <span className="text-gold">{formatNaira(line.line_total)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-2 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="text-ivory">{formatNaira(o.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">{deliveryLabel[o.deliveryOption]}</dt><dd className="text-ivory">{o.deliveryFee === 0 ? "Free" : formatNaira(o.deliveryFee)}</dd></div>
          <div className="flex justify-between text-base"><dt className="text-ivory">Total</dt><dd className="font-display text-2xl text-gold">{formatNaira(o.total)}</dd></div>
        </dl>

        <p className="mt-5 text-sm text-muted">
          {o.deliveryOption === "pickup"
            ? `Pickup: ${contact?.pickupAddress ?? "Makurdi"}`
            : `Deliver to: ${[o.address, o.city, o.state].filter(Boolean).join(", ")}`}
        </p>
      </section>

      <p className="mt-6 text-sm">
        <Link href="/dashboard/orders" className="text-gold underline-offset-4 hover:underline">All my orders</Link>
      </p>
    </div>
  );
}
