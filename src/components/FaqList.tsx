import { faqAnswer, faqs } from "@/lib/content";
import { getSettings } from "@/lib/site";

// Question-and-answer list. Opens and closes with no JavaScript. `limit` shows only the first few (Home page).
export default async function FaqList({ limit }: { limit?: number }) {
  const settings = await getSettings();
  const items = limit ? faqs.slice(0, limit) : faqs;
  return (
    <div className="divide-y divide-line-subtle rounded-2xl border border-line bg-charcoal">
      {items.map((f) => (
        <details key={f.q} className="group px-5">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-ivory marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="font-semibold">{f.q}</span>
            <span className="text-xl text-gold transition-transform group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <p className="pb-5 text-sm leading-relaxed text-muted">{faqAnswer(f.a, settings)}</p>
        </details>
      ))}
    </div>
  );
}
