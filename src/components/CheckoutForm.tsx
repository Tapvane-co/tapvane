"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { inputClass } from "@/components/AuthForms";
import { Thumb } from "@/components/CartContents";
import { clearCart, readCartRaw, subscribeCart } from "@/lib/cart";
import { getCheckoutContext, placeOrder, type CheckoutContext } from "@/lib/checkout-actions";
import { nigerianStates, type DeliveryOption, type PaymentMethod } from "@/lib/orders";
import { formatNaira, parseCart, unitsUsed, whatsappLink } from "@/lib/shop";

const goldButton = "flex min-h-12 w-full items-center justify-center rounded-full bg-gold px-8 font-semibold text-onyx hover:brightness-110 disabled:opacity-50";

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-charcoal p-6">
      <h2 className="font-display text-2xl text-ivory">
        <span className="mr-2 text-gold">{n}.</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Choice({
  checked,
  disabled,
  onSelect,
  title,
  right,
  children,
}: {
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  title: string;
  right?: string;
  children?: ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-4 ${
        checked ? "border-gold bg-gold/10" : "border-line hover:border-gold"
      } ${disabled ? "cursor-not-allowed opacity-50 hover:border-line" : ""}`}
    >
      <span className="flex items-center gap-3">
        <input type="radio" checked={checked} disabled={disabled} onChange={onSelect} className="h-4 w-4 accent-[#C9A34E]" />
        <span className="flex-1 text-ivory">{title}</span>
        {right && <span className="text-gold">{right}</span>}
      </span>
      {children && <span className="pl-7 text-sm text-muted">{children}</span>}
    </label>
  );
}

export default function CheckoutForm() {
  const router = useRouter();
  const raw = useSyncExternalStore(subscribeCart, readCartRaw, () => "[]");
  const items = useMemo(() => parseCart(raw), [raw]);

  const [ctx, setCtx] = useState<CheckoutContext | null>(null);
  const [failed, setFailed] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryOption>("pickup");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCheckoutContext()
      .then(setCtx)
      .catch(() => setFailed(true));
  }, []);

  if (placed) return <p className="py-10 text-center text-muted">Taking you to your order…</p>;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <p className="font-display text-2xl text-ivory">Your cart is empty</p>
        <Link href="/packages" className="flex min-h-12 items-center justify-center rounded-full bg-gold px-8 font-semibold text-onyx">
          Browse packages
        </Link>
      </div>
    );
  }
  if (failed) return <p className="py-10 text-muted">We could not load checkout. Please refresh the page.</p>;
  if (!ctx) return <p className="py-10 text-muted">Loading…</p>;

  const products = ctx.shop.products;
  if (!products) {
    return <p className="py-10 text-muted">Prices are not available right now. Please check back shortly or chat with us on WhatsApp.</p>;
  }

  const lines = items.map((item) => ({ item, product: products.find((p) => p.slug === item.slug) }));
  const subtotal = lines.reduce((s, l) => s + (l.product ? l.product.price * l.item.quantity : 0), 0);
  const fee = delivery === "pickup" ? 0 : delivery === "makurdi" ? ctx.deliveryFeeMakurdi : ctx.deliveryFeeNationwide;
  const total = subtotal + fee;

  const used = unitsUsed(items, products);
  const short = ctx.shop.stock.some((s) => s.quantity !== null && used[s.itemType] > s.quantity);
  const unavailable = lines.some((l) => !l.product);

  const canPaystack = ctx.paystack;
  const canTransfer = ctx.bank !== null;
  const chosen: PaymentMethod | "" = method || (canPaystack ? "paystack" : canTransfer ? "transfer" : "");
  const needsAddress = delivery !== "pickup";

  async function submit() {
    setError("");
    if (!chosen) return setError("Please choose how you would like to pay.");
    if (phone.replace(/\D/g, "").length < 10) return setError("Please enter a phone number we can reach you on.");
    if (needsAddress && (!address.trim() || !city.trim() || !state)) {
      return setError("Please enter your delivery address, town and state.");
    }
    setBusy(true);
    const result = await placeOrder({ items, delivery, phone, address, city, state, method: chosen });
    if (!result.ok) {
      setBusy(false);
      return setError(result.error);
    }
    setPlaced(true);
    clearCart();
    if (result.payUrl) window.location.assign(result.payUrl);
    else router.push(`/checkout/confirmation/${result.orderNumber}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-6">
        {/* 1. Cart review */}
        <Section n={1} title="Your order">
          <ul className="divide-y divide-line-subtle">
            {lines.map(({ item, product }) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                <Thumb item={item} data={ctx.shop} />
                <div className="min-w-0 flex-1">
                  <p className="text-ivory">
                    {product ? product.name : "No longer available"}
                    {item.quantity > 1 && <span className="text-muted"> × {item.quantity}</span>}
                  </p>
                  {item.design && (
                    <p className="truncate text-xs text-muted">
                      {item.design.detailsLater
                        ? "Details to be added later"
                        : item.design.cards.length > 1
                          ? `${item.design.cards.length} cards`
                          : item.design.cards[0]?.name}
                    </p>
                  )}
                </div>
                <span className="text-gold">{product ? formatNaira(product.price * item.quantity) : "–"}</span>
              </li>
            ))}
          </ul>
          <Link href="/packages" className="mt-2 inline-flex min-h-11 items-center text-sm text-gold underline-offset-4 hover:underline">
            Change my order
          </Link>
        </Section>

        {/* 2. Account */}
        {!ctx.signedIn ? (
          <Section n={2} title="Log in or create an account">
            <p className="text-sm text-muted">You need an account so you can follow your order and set up your digital profile. Your cart will be kept.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link href="/login?next=/checkout" className={`${goldButton} sm:w-auto`}>
                Log in
              </Link>
              <Link href="/signup?next=/checkout" className="flex min-h-12 items-center justify-center rounded-full border border-line px-8 text-ivory hover:border-gold">
                Create account
              </Link>
            </div>
          </Section>
        ) : (
          <>
            <Section n={2} title="Delivery">
              <div className="flex flex-col gap-3" role="radiogroup" aria-label="Delivery option">
                <Choice checked={delivery === "pickup"} onSelect={() => setDelivery("pickup")} title="Pickup in Makurdi" right="Free">
                  {ctx.pickupAddress}
                </Choice>
                <Choice checked={delivery === "makurdi"} onSelect={() => setDelivery("makurdi")} title="Delivery within Makurdi" right={formatNaira(ctx.deliveryFeeMakurdi)} />
                <Choice checked={delivery === "nationwide"} onSelect={() => setDelivery("nationwide")} title="Delivery outside Makurdi" right={formatNaira(ctx.deliveryFeeNationwide)} />
              </div>
              <p className="mt-3 text-sm text-muted">Your card is ready within 5–7 business days after your payment is confirmed.</p>

              <div className="mt-5 flex flex-col gap-4">
                <label className="flex flex-col gap-2 text-sm text-muted">
                  Phone number
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" placeholder="0803 000 0000" className={inputClass} />
                </label>
                {needsAddress && (
                  <>
                    <label className="flex flex-col gap-2 text-sm text-muted">
                      Delivery address
                      <input value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" maxLength={200} className={inputClass} />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-2 text-sm text-muted">
                        Town or city
                        <input value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" maxLength={80} className={inputClass} />
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-muted">
                        State
                        <select value={state} onChange={(e) => setState(e.target.value)} className={inputClass}>
                          <option value="">Choose a state</option>
                          {nigerianStates.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </>
                )}
              </div>
            </Section>

            <Section n={3} title="Payment">
              <div className="flex flex-col gap-3" role="radiogroup" aria-label="Payment method">
                <Choice checked={chosen === "paystack"} disabled={!canPaystack} onSelect={() => setMethod("paystack")} title="Pay online (Paystack)">
                  {canPaystack ? "Card, bank transfer or USSD. Your order is confirmed instantly." : "Online payment is coming soon."}
                </Choice>
                <Choice checked={chosen === "transfer"} disabled={!canTransfer} onSelect={() => setMethod("transfer")} title="Direct bank transfer">
                  Transfer to the account below, then upload your receipt or send it on WhatsApp. We&apos;ll confirm within 24 hours.
                </Choice>
              </div>

              {chosen === "transfer" && ctx.bank && (
                <dl className="mt-4 divide-y divide-line-subtle rounded-xl border border-line text-sm">
                  {[
                    ["Bank", ctx.bank.name],
                    ["Account name", ctx.bank.accountName],
                    ["Account number", ctx.bank.accountNumber],
                    ["Amount", formatNaira(total)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 px-4 py-3">
                      <dt className="text-muted">{k}</dt>
                      <dd className="text-right text-ivory">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {!canTransfer && (
                <p className="mt-3 text-sm text-muted">
                  Bank transfer details are not available yet.{" "}
                  <a href={whatsappLink(ctx.whatsappNumber)} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-4">
                    Chat with us on WhatsApp
                  </a>{" "}
                  to arrange payment.
                </p>
              )}
            </Section>
          </>
        )}
      </div>

      {/* Totals */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-line bg-charcoal p-6">
          <h2 className="font-display text-2xl text-ivory">Total</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="text-ivory">{formatNaira(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="text-ivory">{fee === 0 ? "Free" : formatNaira(fee)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="text-ivory">Total</dt>
              <dd className="font-display text-2xl text-gold">{formatNaira(total)}</dd>
            </div>
          </dl>

          {short && <p role="alert" className="mt-4 rounded-xl border border-red-900 px-4 py-3 text-sm text-red-300">Some items are not available in the amount you chose. Please go back and change your order.</p>}
          {unavailable && <p role="alert" className="mt-4 rounded-xl border border-red-900 px-4 py-3 text-sm text-red-300">An item in your cart is no longer available. Please remove it first.</p>}
          {error && <p role="alert" className="mt-4 rounded-xl border border-red-900 px-4 py-3 text-sm text-red-300">{error}</p>}

          {ctx.signedIn && (
            <button
              type="button"
              onClick={submit}
              disabled={busy || short || unavailable || !chosen}
              className={`${goldButton} mt-5`}
            >
              {busy ? "Please wait…" : chosen === "transfer" ? "I've made the transfer" : `Pay ${formatNaira(total)}`}
            </button>
          )}
          <p className="mt-3 text-xs text-stone">Prices are confirmed again when you place your order.</p>
        </div>
      </aside>
    </div>
  );
}
