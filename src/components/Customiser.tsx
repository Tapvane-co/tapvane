"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { inputClass } from "@/components/AuthForms";
import CardMockup from "@/components/CardMockup";
import { addToCart, openCart, readCartRaw, subscribeCart } from "@/lib/cart";
import {
  LIMITS,
  emptyCard,
  formatNaira,
  isPro,
  parseCart,
  stockStatus,
  unitsUsed,
  type CardText,
  type Finish,
  type Product,
  type ShopData,
} from "@/lib/shop";

const STEPS = ["Template", "Colour & finish", "Your details", "Review"];

function ProBadge() {
  return <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-onyx">Pro</span>;
}

const pill = (active: boolean, disabled = false) =>
  `flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm ${
    active ? "border-gold bg-gold/10 text-ivory" : "border-line text-muted hover:border-gold"
  } ${disabled ? "cursor-not-allowed opacity-50 hover:border-line" : ""}`;

const ghostButton = "flex min-h-12 items-center justify-center rounded-full border border-line px-6 text-sm text-ivory hover:border-gold disabled:opacity-50";
const goldButton = "flex min-h-12 items-center justify-center rounded-full bg-gold px-8 font-semibold text-onyx hover:brightness-110 disabled:opacity-50";

// "business" in the address means the first business package.
function pickPackage(products: Product[], wanted: string) {
  return (
    products.find((p) => p.slug === wanted) ??
    (wanted === "business" ? products.find((p) => p.type === "business") : undefined) ??
    products.find((p) => p.slug === "basic") ??
    products[0]
  );
}

export default function Customiser({ data, initialPackage }: { data: ShopData; initialPackage: string }) {
  const { templates, colours, stock } = data;
  const products = useMemo(() => data.products ?? [], [data.products]);

  const cartRaw = useSyncExternalStore(subscribeCart, readCartRaw, () => "[]");
  const used = useMemo(() => unitsUsed(parseCart(cartRaw), products), [cartRaw, products]);

  const [slug, setSlug] = useState(() => pickPackage(products, initialPackage)?.slug ?? "");
  const [step, setStep] = useState(0);
  const [templateSlug, setTemplateSlug] = useState(templates.find((t) => t.tier === "standard")?.slug ?? templates[0]?.slug ?? "");
  const [colourSlug, setColourSlug] = useState(colours[0]?.slug ?? "");
  const [finish, setFinish] = useState<Finish>("standard");
  const [cards, setCards] = useState<CardText[]>(() => {
    const first = pickPackage(products, initialPackage);
    const count = !first || first.type === "tag" ? 0 : first.cardsIncluded;
    return Array.from({ length: count }, () => ({ ...emptyCard }));
  });
  const [active, setActive] = useState(0);
  const [detailsLater, setDetailsLater] = useState(false);
  const [side, setSide] = useState<"front" | "back">("front");
  const [tagQty, setTagQty] = useState(1);
  const [message, setMessage] = useState("");
  const [added, setAdded] = useState(false);

  if (!data.products || products.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-charcoal p-6 text-muted">
        The card designer is not available right now. Please check back shortly or chat with us on WhatsApp.
      </p>
    );
  }

  const product = pickPackage(products, slug)!;
  const isTag = product.type === "tag";
  const isBusiness = product.type === "business";
  const pro = isPro(product);
  const status = stockStatus(stock, product, used, isTag ? tagQty : 1);

  const template = templates.find((t) => t.slug === templateSlug) ?? templates[0];
  const colour = colours.find((c) => c.slug === colourSlug) ?? colours[0];
  const card = cards[active] ?? emptyCard;
  const shown = detailsLater ? emptyCard : card;

  function choosePackage(next: Product) {
    setSlug(next.slug);
    setAdded(false);
    setMessage("");
    // Premium designs and the matte finish belong to Pro only.
    if (!isPro(next)) {
      setFinish("standard");
      const current = templates.find((t) => t.slug === templateSlug);
      if (current?.tier === "premium") setTemplateSlug(templates.find((t) => t.tier === "standard")?.slug ?? "");
    }
    const count = next.type === "tag" ? 0 : next.cardsIncluded;
    setCards((old) => Array.from({ length: count }, (_, i) => old[i] ?? { ...emptyCard }));
    setActive(0);
    setStep(0);
  }

  function editCard(field: keyof CardText, value: string) {
    setAdded(false);
    setCards((old) => old.map((c, i) => (i === active ? { ...c, [field]: value.slice(0, LIMITS[field]) } : c)));
  }

  function detailsProblem() {
    if (detailsLater) return "";
    if (isBusiness) {
      const missing = cards.findIndex((c) => !c.name.trim());
      return missing >= 0 ? `Please enter a name for card ${missing + 1}, or choose to add details later.` : "";
    }
    return card.name.trim() ? "" : "Please enter the full name for your card.";
  }

  function next() {
    if (step === 2) {
      const problem = detailsProblem();
      if (problem) return setMessage(problem);
    }
    setMessage("");
    setStep((s) => Math.min(3, s + 1));
  }

  function add() {
    if (status === "out") return setMessage("Sorry, that is out of stock right now.");
    if (isTag) {
      addToCart({ slug: product.slug, quantity: tagQty });
    } else {
      const problem = detailsProblem();
      if (problem) {
        setStep(2);
        return setMessage(problem);
      }
      addToCart({
        slug: product.slug,
        quantity: 1,
        design: { template: template.slug, colour: colour.slug, finish, cards, detailsLater },
      });
    }
    setMessage("");
    setAdded(true);
    openCart();
  }

  const previewName = shown.name.trim() || "";
  const total = product.price * (isTag ? tagQty : 1);

  return (
    <div>
      {/* Package */}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Package">
        {products.map((p) => {
          const out = stockStatus(stock, p, used, 1) === "out";
          return (
            <button
              key={p.slug}
              type="button"
              role="radio"
              aria-checked={p.slug === product.slug}
              disabled={out}
              onClick={() => choosePackage(p)}
              className={pill(p.slug === product.slug, out)}
            >
              {p.name} · {formatNaira(p.price)}
              {out && <span className="text-xs text-red-300">Out of stock</span>}
            </button>
          );
        })}
      </div>
      {status === "few" && <p className="mt-3 text-sm text-gold">Few left</p>}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_420px]">
        <div className="order-2 lg:order-1">
          {isTag ? (
            <section className="rounded-2xl border border-line bg-charcoal p-6">
              <h2 className="font-display text-2xl text-ivory">NFC Tag</h2>
              <p className="mt-2 text-sm text-muted">
                A hard NFC tag for your shop counter, table or phone. Customers tap to see your business, WhatsApp and socials.
              </p>
              <p className="mt-6 text-sm text-muted">Quantity</p>
              <div className="mt-2 flex items-center gap-3">
                <button type="button" aria-label="Fewer tags" onClick={() => setTagQty((q) => Math.max(1, q - 1))} className="h-11 w-11 rounded-full border border-line text-lg text-ivory hover:border-gold">−</button>
                <span className="w-8 text-center text-lg text-ivory" aria-live="polite">{tagQty}</span>
                <button type="button" aria-label="More tags" onClick={() => setTagQty((q) => Math.min(99, q + 1))} className="h-11 w-11 rounded-full border border-line text-lg text-ivory hover:border-gold">+</button>
              </div>
            </section>
          ) : (
            <>
              {/* Step labels */}
              <ol className="flex flex-wrap gap-2" aria-label="Steps">
                {STEPS.map((label, i) => (
                  <li key={label}>
                    <button
                      type="button"
                      disabled={i > step}
                      onClick={() => { setMessage(""); setStep(i); }}
                      aria-current={i === step ? "step" : undefined}
                      className={`min-h-11 rounded-full px-4 text-sm ${
                        i === step ? "bg-gold font-semibold text-onyx" : i < step ? "border border-gold text-ivory" : "border border-line-subtle text-stone"
                      }`}
                    >
                      {i + 1}. {label}
                    </button>
                  </li>
                ))}
              </ol>

              <div className="mt-6">
                {step === 0 && (
                  <fieldset>
                    <legend className="font-display text-2xl text-ivory">Choose a template</legend>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {templates.map((t) => {
                        const locked = t.tier === "premium" && !pro;
                        return (
                          <button
                            key={t.slug}
                            type="button"
                            disabled={locked}
                            aria-pressed={t.slug === template.slug}
                            onClick={() => { setTemplateSlug(t.slug); setAdded(false); }}
                            className={`flex flex-col gap-2 rounded-2xl border p-3 text-left ${
                              t.slug === template.slug ? "border-gold bg-gold/10" : "border-line hover:border-gold"
                            } ${locked ? "cursor-not-allowed opacity-60 hover:border-line" : ""}`}
                          >
                            <CardMockup layout={t.layout} colours={colour} finish={finish} name={previewName} title={shown.title} company={shown.company} />
                            <span className="flex items-center gap-2 text-sm text-ivory">
                              {t.name} {t.tier === "premium" && <ProBadge />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {templates.some((t) => t.tier === "premium") && !pro && (
                      <p className="mt-3 text-sm text-muted">Premium templates come with the Pro package.</p>
                    )}
                  </fieldset>
                )}

                {step === 1 && (
                  <div className="flex flex-col gap-8">
                    <fieldset>
                      <legend className="font-display text-2xl text-ivory">Card colour</legend>
                      <div className="mt-4 flex flex-wrap gap-3">
                        {colours.map((c) => (
                          <button
                            key={c.slug}
                            type="button"
                            aria-pressed={c.slug === colour.slug}
                            onClick={() => { setColourSlug(c.slug); setAdded(false); }}
                            className={`flex min-h-11 items-center gap-3 rounded-full border py-1 pl-1 pr-4 text-sm ${
                              c.slug === colour.slug ? "border-gold bg-gold/10 text-ivory" : "border-line text-muted hover:border-gold"
                            }`}
                          >
                            <span
                              className="h-9 w-9 rounded-full border border-line"
                              style={{ background: `linear-gradient(135deg, ${c.frontBg} 50%, ${c.backBg} 50%)` }}
                              aria-hidden="true"
                            />
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset>
                      <legend className="font-display text-2xl text-ivory">Finish</legend>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button type="button" aria-pressed={finish === "standard"} onClick={() => setFinish("standard")} className={pill(finish === "standard")}>
                          Standard
                        </button>
                        <button
                          type="button"
                          aria-pressed={finish === "matte"}
                          disabled={!pro}
                          title="The matte finish comes with the Pro package."
                          onClick={() => setFinish("matte")}
                          className={pill(finish === "matte", !pro)}
                        >
                          Matte <ProBadge />
                        </button>
                      </div>
                      {!pro && <p className="mt-3 text-sm text-muted">The matte finish comes with the Pro package.</p>}
                    </fieldset>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h2 className="font-display text-2xl text-ivory">Your details</h2>
                    {isBusiness && (
                      <>
                        <p className="mt-2 text-sm text-muted">
                          Add details for each card now, or skip and add them later from your dashboard.
                        </p>
                        <label className="mt-4 flex min-h-11 items-center gap-3 text-sm text-ivory">
                          <input
                            type="checkbox"
                            checked={detailsLater}
                            onChange={(e) => { setDetailsLater(e.target.checked); setAdded(false); }}
                            className="h-4 w-4 accent-[#C9A34E]"
                          />
                          Skip for now, add details later
                        </label>
                        {!detailsLater && (
                          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Choose a card">
                            {cards.map((c, i) => (
                              <button key={i} type="button" onClick={() => setActive(i)} aria-pressed={i === active} className={pill(i === active)}>
                                Card {i + 1} {c.name.trim() && <span className="text-gold">✓</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <div className="mt-5 flex flex-col gap-4">
                      {(
                        [
                          ["name", "Full name", true],
                          ["title", "Job title", false],
                          ["company", "Company (optional)", false],
                        ] as const
                      ).map(([field, label, required]) => (
                        <label key={field} className="flex flex-col gap-2 text-sm text-muted">
                          {label}
                          <input
                            value={card[field]}
                            disabled={detailsLater}
                            required={required}
                            maxLength={LIMITS[field]}
                            onChange={(e) => editCard(field, e.target.value)}
                            className={`${inputClass} disabled:opacity-50`}
                          />
                        </label>
                      ))}
                      <p className="text-xs text-stone">Keep it short so it fits nicely on the card.</p>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h2 className="font-display text-2xl text-ivory">Review</h2>
                    <dl className="mt-4 divide-y divide-line-subtle rounded-2xl border border-line bg-charcoal text-sm">
                      {[
                        ["Package", product.name],
                        ["Template", template.name],
                        ["Colour", colour.name],
                        ["Finish", finish === "matte" ? "Matte" : "Standard"],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 px-5 py-3">
                          <dt className="text-muted">{k}</dt>
                          <dd className="text-ivory">{v}</dd>
                        </div>
                      ))}
                      <div className="flex justify-between gap-4 px-5 py-3">
                        <dt className="text-muted">{isBusiness ? "Cards" : "Card text"}</dt>
                        <dd className="text-right text-ivory">
                          {detailsLater ? (
                            "Details to be added later"
                          ) : (
                            cards.map((c, i) => (
                              <span key={i} className="block">
                                {c.name}
                                {[c.title, c.company].filter(Boolean).length ? ` · ${[c.title, c.company].filter(Boolean).join(" · ")}` : ""}
                              </span>
                            ))
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Messages and buttons */}
          {message && <p role="alert" className="mt-5 rounded-xl border border-red-900 px-4 py-3 text-sm text-red-300">{message}</p>}
          {added && <p role="status" className="mt-5 rounded-xl border border-gold px-4 py-3 text-sm text-ivory">Added to your cart.</p>}
          {status === "out" && <p role="alert" className="mt-5 rounded-xl border border-red-900 px-4 py-3 text-sm text-red-300">Out of stock</p>}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!isTag && step > 0 && (
              <button type="button" onClick={() => { setMessage(""); setStep((s) => s - 1); }} className={ghostButton}>
                Back
              </button>
            )}
            {!isTag && step < 3 ? (
              <button type="button" onClick={next} className={goldButton}>
                Next
              </button>
            ) : (
              <button type="button" onClick={add} disabled={status === "out"} className={goldButton}>
                Add to cart · {formatNaira(total)}
              </button>
            )}
          </div>
        </div>

        {/* Live preview */}
        <aside className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <h2 className="sr-only">Live preview</h2>
          {isTag ? (
            <div className="mx-auto flex h-48 w-48 flex-col items-center justify-center rounded-full border border-gold bg-charcoal text-center shadow-2xl shadow-black/60">
              <span className="font-display text-sm uppercase tracking-[0.3em] text-gold">Tapvane</span>
              <span className="mt-2 text-[10px] uppercase tracking-[0.25em] text-muted">Tap to connect</span>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-sm lg:max-w-none">
              <CardMockup side={side} layout={template.layout} colours={colour} finish={finish} name={previewName} title={shown.title} company={shown.company} />
              <div className="mt-4 flex justify-center gap-2" role="group" aria-label="Preview side">
                {(["front", "back"] as const).map((s) => (
                  <button key={s} type="button" aria-pressed={side === s} onClick={() => setSide(s)} className={pill(side === s)}>
                    {s === "front" ? "Front" : "Back"}
                  </button>
                ))}
              </div>
              {isBusiness && !detailsLater && (
                <p className="mt-3 text-center text-xs text-stone">Showing card {active + 1} of {cards.length}</p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
