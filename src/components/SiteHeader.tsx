"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { openCart, readCartCount, subscribeCart } from "@/lib/cart";

// Whether a login cookie is present. (Checking this directly means the whole login library
// does not have to be downloaded on every page just to choose between "Log in" and "My account".)
const noopSubscribe = () => () => {};
const hasLoginCookie = () => /(?:^|;\s*)sb-[^=]*-auth-token/.test(document.cookie);

const links = [
  { href: "/", label: "Home" },
  { href: "/packages", label: "Packages" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

function CartIcon() {
  const count = useSyncExternalStore(subscribeCart, readCartCount, () => 0);
  return (
    <button
      type="button"
      onClick={openCart}
      aria-haspopup="dialog"
      aria-label={count ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart, empty"}
      className="relative flex h-11 w-11 items-center justify-center rounded-full text-ivory hover:text-gold"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 4h2.5l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.2" />
        <circle cx="9.5" cy="19.5" r="1.2" />
        <circle cx="17" cy="19.5" r="1.2" />
      </svg>
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-semibold text-onyx">
          {count}
        </span>
      )}
    </button>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const loggedIn = useSyncExternalStore(noopSubscribe, hasLoginCookie, () => false);

  const account = loggedIn ? { href: "/dashboard", label: "My account" } : { href: "/login", label: "Log in" };

  return (
    <header className="sticky top-0 z-40 border-b border-line-subtle bg-onyx">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex min-h-11 items-center font-display text-lg uppercase tracking-[0.3em] text-gold">
          Tapvane
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-full px-4 text-sm hover:text-gold ${
                pathname === l.href ? "text-gold" : "text-ivory"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <CartIcon />
          <Link href={account.href} className="hidden min-h-11 items-center rounded-full px-4 text-sm text-ivory hover:text-gold sm:flex">
            {account.label}
          </Link>
          <Link href="/packages" className="hidden min-h-11 items-center rounded-full bg-gold px-5 text-sm font-semibold text-onyx sm:flex">
            Get your card
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ivory hover:text-gold lg:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-line-subtle bg-onyx px-6 pb-6 pt-2 lg:hidden">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-12 items-center border-b border-line-subtle text-base ${
                    pathname === l.href ? "text-gold" : "text-ivory"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={account.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center border-b border-line-subtle text-base text-ivory">
                {account.label}
              </Link>
            </li>
          </ul>
          <Link
            href="/packages"
            onClick={() => setOpen(false)}
            className="mt-5 flex min-h-12 items-center justify-center rounded-full bg-gold px-6 font-semibold text-onyx"
          >
            Get your card
          </Link>
        </nav>
      )}
    </header>
  );
}
