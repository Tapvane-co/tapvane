import { Suspense } from "react";
import PackageCards from "@/components/PackageCards";
import { formatNaira, getProducts, getSettings, whatsappLink } from "@/lib/site";

export const metadata = {
  title: "Packages | Tapvane",
  description:
    "Choose a Tapvane package: Basic, Pro, Business or NFC Tag. Every package includes a digital profile you can edit anytime.",
};

async function ComparisonTable() {
  const products = await getProducts();
  if (!products) return null;
  const price = (slug: string) => {
    const p = products.find((x) => x.slug === slug);
    return p ? formatNaira(p.price) : "–";
  };
  const business = products
    .filter((p) => p.type === "business")
    .sort((a, b) => a.cardsIncluded - b.cardsIncluded)
    .map((p) => `${formatNaira(p.price)} (${p.cardsIncluded})`)
    .join(" / ");

  const rows: { label: string; cells: string[] }[] = [
    { label: "Price", cells: [price("basic"), price("pro"), business || "–", price("tag")] },
    { label: "Card type", cells: ["PVC", "Matte finish", "Standard PVC", "Sticker tag"] },
    { label: "Digital profile", cells: ["Standard", "Custom colours + cover image", "One per card", "Included"] },
    { label: "Templates", cells: ["Standard", "Standard + premium", "Standard", "n/a"] },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-charcoal text-ivory">
            <th className="p-4 font-semibold"><span className="sr-only">Feature</span></th>
            {["Basic", "Pro", "Business", "NFC Tag"].map((h) => (
              <th key={h} className="p-4 font-display text-lg font-normal">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-line-subtle">
              <th scope="row" className="p-4 font-semibold text-ivory">{r.label}</th>
              {r.cells.map((c, i) => (
                <td key={i} className={`p-4 ${r.label === "Price" ? "text-gold" : "text-muted"}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function QuoteNote() {
  const { whatsappNumber } = await getSettings();
  return (
    <p className="mt-4 text-sm text-muted">
      Need more than 10 cards for your company or event?{" "}
      <a href={whatsappLink(whatsappNumber)} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-4">
        Chat with us on WhatsApp
      </a>{" "}
      for a custom quote.
    </p>
  );
}

export default function PackagesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <h1 className="font-display text-4xl text-ivory md:text-5xl">Packages</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Every package includes a Tapvane digital profile you can edit anytime, and free updates.
      </p>

      <div className="mt-12">
        <Suspense fallback={<div className="h-72 rounded-2xl border border-line-subtle" />}>
          <PackageCards heading="h2" />
        </Suspense>
      </div>

      <div className="mt-16">
        <Suspense fallback={<div className="h-64 rounded-2xl border border-line-subtle" />}>
          <ComparisonTable />
        </Suspense>
        <Suspense fallback={null}>
          <QuoteNote />
        </Suspense>
      </div>
    </main>
  );
}
