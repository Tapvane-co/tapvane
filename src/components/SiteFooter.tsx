import Link from "next/link";
import { getCurrentYear } from "@/lib/site";

const links = [
  { href: "/packages", label: "Packages" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export default async function SiteFooter() {
  const year = await getCurrentYear();
  return (
    <footer className="mt-24 border-t border-line-subtle">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 pb-24">
        <p className="font-display text-lg uppercase tracking-[0.3em] text-gold">Tapvane</p>
        <p className="mt-1 text-sm text-muted">Tap. Share. Connect.</p>
        <nav aria-label="Footer" className="mt-6 flex flex-wrap gap-x-6">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="flex min-h-11 items-center text-sm text-ivory hover:text-gold">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="mt-6 text-xs text-stone">
          Made in Makurdi, Benue State, Nigeria. © {year} Tapvane. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
