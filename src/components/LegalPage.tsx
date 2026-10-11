import type { ReactNode } from "react";

export type LegalSection = { title: string; body?: ReactNode; bullets?: ReactNode[] };

// A numbered legal page (Terms or Privacy).
export default function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="font-display text-4xl text-ivory md:text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-stone">Last updated: {updated}</p>
      <ol className="mt-10 flex flex-col gap-7">
        {sections.map((s, i) => (
          <li key={s.title} className="flex gap-4">
            <span className="w-7 shrink-0 font-display text-xl text-gold" aria-hidden="true">{i + 1}.</span>
            <div className="min-w-0">
              <h2 className="font-semibold text-ivory">{s.title}</h2>
              {s.body && <p className="mt-1 leading-relaxed text-muted">{s.body}</p>}
              {s.bullets && (
                <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 leading-relaxed text-muted marker:text-gold">
                  {s.bullets.map((b, k) => <li key={k}>{b}</li>)}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
