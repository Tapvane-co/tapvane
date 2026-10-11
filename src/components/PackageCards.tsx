import Link from "next/link";
import { formatNaira, getProducts, type Product } from "@/lib/site";

type Card = {
  key: string;
  name: string;
  price: string;
  description: string;
  audience: string;
  button: string;
  href: string;
  popular?: boolean;
};

function buildCards(products: Product[]): Card[] {
  const by = new Map(products.map((p) => [p.slug, p]));
  const cards: Card[] = [];

  const basic = by.get("basic");
  if (basic) {
    cards.push({
      key: "basic",
      name: "Basic",
      price: formatNaira(basic.price),
      description: "1 PVC NFC card + digital profile.",
      audience: "For: individuals getting started.",
      button: "Choose Basic",
      href: "/customise?package=basic",
    });
  }

  const pro = by.get("pro");
  if (pro) {
    cards.push({
      key: "pro",
      name: "Pro",
      price: formatNaira(pro.price),
      description:
        "1 matte-finish NFC card + custom digital profile with your own colours and cover image.",
      audience: "For: professionals who want to stand out.",
      button: "Choose Pro",
      href: "/customise?package=pro",
      popular: true,
    });
  }

  const business = products.filter((p) => p.type === "business").sort((a, b) => a.cardsIncluded - b.cardsIncluded);
  if (business.length) {
    const options = business.map((p) => `${p.cardsIncluded} cards for ${formatNaira(p.price)}`).join(" or ");
    cards.push({
      key: "business",
      name: "Business",
      price: `from ${formatNaira(Math.min(...business.map((p) => p.price)))}`,
      description: `${options}, each with its own digital profile. Manage your whole team from one dashboard.`,
      audience: "For: small businesses and teams.",
      button: "Choose Business",
      href: "/customise?package=business",
    });
  }

  const tag = by.get("tag");
  if (tag) {
    cards.push({
      key: "tag",
      name: "NFC Tag",
      price: formatNaira(tag.price),
      description:
        "A Tapvane sticker for your shop counter, table or phone. Customers tap to see your business, WhatsApp and socials.",
      audience: "",
      button: "Get a tag",
      href: "/customise?package=tag",
    });
  }
  return cards;
}

// The four package cards. Prices come from the database, so a price change in admin shows here.
export default async function PackageCards() {
  const products = await getProducts();
  if (!products) {
    return (
      <p className="rounded-2xl border border-line bg-charcoal p-6 text-muted">
        Prices are not available right now. Please check back shortly or chat with us on WhatsApp.
      </p>
    );
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {buildCards(products).map((c) => (
        <li
          key={c.key}
          className={`relative flex flex-col rounded-2xl border bg-charcoal p-6 ${c.popular ? "border-gold" : "border-line"}`}
        >
          {c.popular && (
            <span className="absolute -top-3 left-6 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-onyx">
              Most Popular
            </span>
          )}
          <h3 className="font-display text-2xl text-ivory">{c.name}</h3>
          <p className="mt-1 font-display text-3xl text-gold">{c.price}</p>
          <p className="mt-4 text-sm text-muted">{c.description}</p>
          {c.audience && <p className="mt-3 text-sm text-stone">{c.audience}</p>}
          <div className="mt-auto pt-6">
            <Link
              href={c.href}
              className={`flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold ${
                c.popular ? "bg-gold text-onyx" : "border border-line text-ivory hover:border-gold"
              }`}
            >
              {c.button}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
