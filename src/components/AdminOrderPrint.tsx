"use client";

import { useEffect, useMemo, useState } from "react";
import CardMockup from "@/components/CardMockup";
import { orderRef, rowToOrder, type Order, type OrderLine } from "@/lib/orders";
import { createClient } from "@/lib/supabase/client";
import { chipUrl } from "@/lib/cards";

type Design = NonNullable<OrderLine["design"]>;

const colours = (d: Design) => ({
  slug: d.colour.slug,
  name: d.colour.name,
  frontBg: d.colour.front_bg,
  frontText: d.colour.front_text,
  accent: d.colour.accent,
  backBg: d.colour.back_bg,
  backText: d.colour.back_text,
});

const exact = "[print-color-adjust:exact] [-webkit-print-color-adjust:exact]";

// A clean sheet for the printer: the design, the exact colours, and every card's text, at real card size.
export default function AdminOrderPrint({ number }: { number: number }) {
  const supabase = useMemo(() => createClient(), []);
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [customer, setCustomer] = useState("");
  // Free card codes, offered in order so each printed QR matches a chip you can write and assign.
  const [free, setFree] = useState<string[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from("orders").select("*").eq("order_number", number).maybeSingle().then(({ data }) => {
      setOrder(data ? rowToOrder(data) : null);
      setCustomer(data?.customer_name ?? "");
    });
    supabase
      .from("cards")
      .select("card_code")
      .eq("status", "unassigned")
      .neq("type", "tag")
      .order("created_at")
      .then(({ data }) => setFree((data ?? []).map((c) => c.card_code)));
  }, [supabase, number]);

  if (order === undefined) return <p className="text-muted">Loading…</p>;
  if (order === null) return <p className="text-muted">We could not find that order.</p>;

  const lines = order.items.filter((l) => l.design);
  const tags = order.items.filter((l) => !l.design);

  // Every card on this sheet gets one code: the one you typed, or the next free one.
  let counter = 0;
  const codeFor = (key: string, index: number) => (edits[key] ?? free[index] ?? "").trim().toUpperCase();
  const validCode = (c: string) => /^[A-Z0-9-]{6,20}$/.test(c);

  return (
    <div className={`${exact} rounded-2xl bg-white p-6 text-black print:rounded-none print:p-0`}>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-stone">In the print window, turn ON &ldquo;Background graphics&rdquo; so the card colours print. You can also choose &ldquo;Save as PDF&rdquo;.</p>
        <button type="button" onClick={() => window.print()} className="min-h-11 rounded-full bg-black px-6 text-sm font-semibold text-white">
          Print or save as PDF
        </button>
      </div>

      <h1 className="mt-4 font-display text-3xl">Order {orderRef(order.orderNumber)}: production sheet</h1>
      <p className="text-sm">
        {customer || "Customer"} · {order.phone}
      </p>
      <p className="text-sm">
        {order.deliveryOption === "pickup" ? "Pickup in Makurdi" : `Deliver to: ${[order.address, order.city, order.state].filter(Boolean).join(", ")}`}
      </p>

      {lines.map((line, li) => {
        const d = line.design!;
        const c = colours(d);
        return (
          <section key={li} className="mt-8 break-inside-avoid border-t border-neutral-300 pt-6">
            <h2 className="text-xl font-semibold">{line.name}</h2>
            <table className="mt-2 text-sm">
              <tbody>
                <tr><td className="pr-6 text-neutral-600">Template</td><td>{d.template.name} ({d.template.layout})</td></tr>
                <tr><td className="pr-6 text-neutral-600">Colour set</td><td>{d.colour.name}</td></tr>
                <tr><td className="pr-6 text-neutral-600">Finish</td><td>{d.finish === "matte" ? "MATTE" : "Standard (glossy)"}</td></tr>
                <tr><td className="pr-6 text-neutral-600">Front</td><td>background {d.colour.front_bg} · text {d.colour.front_text} · accent {d.colour.accent}</td></tr>
                <tr><td className="pr-6 text-neutral-600">Back</td><td>background {d.colour.back_bg} · text {d.colour.back_text}</td></tr>
                <tr><td className="pr-6 text-neutral-600">Quantity</td><td>{d.details_later ? "Card text to be supplied later" : `${d.cards.length} card${d.cards.length === 1 ? "" : "s"}`}</td></tr>
              </tbody>
            </table>

            <p className="mt-3 text-xs text-neutral-600 print:hidden">
              Each back has its own QR code. It opens the card&apos;s chip address, so it must match the code you write onto that card&apos;s chip. The codes below are the next free ones; change one if you want a different card.
            </p>
            <div className="mt-4 flex flex-col gap-6">
              {(d.details_later ? [{ name: "", title: "", company: "" }] : d.cards).map((card, k) => {
                const index = counter++;
                const key = `${li}-${k}`;
                const code = codeFor(key, index);
                const ok = validCode(code);
                return (
                  <div key={k} className="break-inside-avoid">
                    <div className="flex flex-wrap gap-6">
                      <figure>
                        <div style={{ width: "85.6mm" }}>
                          <CardMockup side="front" colours={c} finish={d.finish} layout={d.template.layout} name={card.name} title={card.title} company={card.company} />
                        </div>
                        <figcaption className="mt-1 text-xs">
                          {d.details_later ? "Front (placeholder: text to be supplied)" : `Card ${k + 1} front: ${[card.name, card.title, card.company].filter(Boolean).join(" · ")}`}
                        </figcaption>
                      </figure>
                      <figure>
                        <div style={{ width: "85.6mm" }}>
                          <CardMockup side="back" colours={c} finish={d.finish} layout={d.template.layout} qrValue={ok ? chipUrl(code) : undefined} />
                        </div>
                        <figcaption className="mt-1 text-xs">
                          {ok ? (
                            <>Back: QR opens <span className="font-mono">{chipUrl(code)}</span></>
                          ) : (
                            <span className="font-semibold text-red-700">No card code yet: this QR is only a sample. Type a code below.</span>
                          )}
                        </figcaption>
                      </figure>
                    </div>
                    <label className="mt-2 flex items-center gap-2 text-xs print:hidden">
                      Card code for this card
                      <input
                        value={edits[key] ?? free[index] ?? ""}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [key]: e.target.value.toUpperCase() }))}
                        spellCheck={false}
                        className="min-h-9 w-44 rounded border border-neutral-400 px-2 font-mono tracking-widest"
                        aria-label={`Card code for card ${k + 1}`}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {tags.length > 0 && (
        <section className="mt-8 border-t border-neutral-300 pt-6">
          <h2 className="text-xl font-semibold">NFC tags</h2>
          <ul className="mt-2 text-sm">
            {tags.map((t, i) => (
              <li key={i}>{t.name} × {t.quantity}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-xs text-neutral-600">Reminder: each chip is written with https://tapvane.com/c/CODE (never the profile address), then assigned to the customer&apos;s profile under Admin → Cards.</p>
    </div>
  );
}
