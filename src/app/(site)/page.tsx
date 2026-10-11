import Link from "next/link";
import { Suspense } from "react";
import FaqList from "@/components/FaqList";
import PackageCards from "@/components/PackageCards";
import TapDemo from "@/components/TapDemo";
import { homeSteps, trustStrip, whyTapvane } from "@/lib/content";

export const metadata = {
  title: "Tapvane | Tap. Share. Connect.",
  description:
    "The smart business card for Nigerian professionals and businesses. One tap shares your phone number, WhatsApp, socials and more. No app needed.",
};

const primaryLink =
  "flex min-h-12 items-center justify-center rounded-full bg-gold px-8 font-semibold text-onyx hover:brightness-110";
const secondaryLink =
  "flex min-h-12 items-center justify-center rounded-full border border-gold px-8 font-semibold text-ivory hover:bg-gold/10";

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-12 pt-12 lg:grid-cols-2 lg:pt-20">
        <div>
          <h1 className="font-display text-5xl leading-tight text-ivory md:text-6xl">Tap. Share. Connect.</h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            The smart business card for Nigerian professionals and businesses. One tap shares your phone number,
            WhatsApp, socials and more. No app needed.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/packages" className={primaryLink}>
              Get your Tapvane card
            </Link>
            <Link href="/p/demo" className={secondaryLink}>
              See a live profile
            </Link>
          </div>
        </div>
        <TapDemo />
      </section>

      {/* Trust strip */}
      <section className="border-y border-line-subtle">
        <p className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-x-4 gap-y-1 px-6 py-5 text-center text-sm text-muted sm:flex-row">
          {trustStrip.map((t, i) => (
            <span key={t}>
              {i > 0 && <span className="mr-4 hidden sm:inline">·</span>}
              {t}
            </span>
          ))}
        </p>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-20">
        <h2 className="font-display text-3xl text-ivory md:text-4xl">As easy as one tap</h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {homeSteps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-line bg-charcoal p-6">
              <span className="font-display text-3xl text-gold">{i + 1}</span>
              <h3 className="mt-3 font-semibold text-ivory">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Why Tapvane */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-20">
        <h2 className="font-display text-3xl text-ivory md:text-4xl">One card. Endless first impressions.</h2>
        <ul className="mt-8 grid gap-x-10 gap-y-6 md:grid-cols-2">
          {whyTapvane.map((w) => (
            <li key={w.title} className="border-l border-gold pl-5">
              <h3 className="font-semibold text-ivory">{w.title}</h3>
              <p className="mt-1 text-sm text-muted">{w.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Packages */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-20">
        <h2 className="font-display text-3xl text-ivory md:text-4xl">Choose your package</h2>
        <div className="mt-10">
          <Suspense fallback={<div className="h-72 rounded-2xl border border-line-subtle" />}>
            <PackageCards />
          </Suspense>
        </div>
      </section>

      {/* For small businesses */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-20">
        <div className="rounded-3xl border border-line bg-charcoal p-8 md:p-12">
          <h2 className="font-display text-3xl text-ivory md:text-4xl">Turn every tap into a customer</h2>
          <p className="mt-4 max-w-3xl text-muted">
            Put a Tapvane tag on your counter, reception desk or restaurant table. Customers tap with their phone to
            chat with you on WhatsApp, follow you on Instagram, or save your number. Give your staff matching Tapvane
            cards so every team member represents your brand.
          </p>
          <Link href="/packages" className={`${secondaryLink} mt-8 inline-flex`}>
            See business packages
          </Link>
        </div>
      </section>

      {/* Live profile demo */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-20">
        <h2 className="font-display text-3xl text-ivory md:text-4xl">See what people see when you tap</h2>
        <p className="mt-4 max-w-2xl text-muted">
          Open a sample Tapvane profile on your phone. This is exactly what your contacts will get.
        </p>
        <Link href="/p/demo" className={`${primaryLink} mt-8 inline-flex`}>
          Open sample profile
        </Link>
      </section>

      {/* FAQ preview */}
      <section className="mx-auto w-full max-w-3xl px-6 pt-20">
        <h2 className="font-display text-3xl text-ivory md:text-4xl">Frequently asked questions</h2>
        <div className="mt-8">
          <Suspense fallback={<div className="h-72 rounded-2xl border border-line-subtle" />}>
            <FaqList limit={4} />
          </Suspense>
        </div>
        <Link href="/faq" className="mt-6 inline-flex min-h-11 items-center text-gold underline-offset-4 hover:underline">
          See all questions →
        </Link>
      </section>

      {/* Final call to action */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-20 text-center">
        <h2 className="font-display text-3xl text-ivory md:text-4xl">Ready to make a lasting first impression?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Order your Tapvane card today. Pickup in Makurdi or delivery anywhere in Nigeria.
        </p>
        <Link href="/packages" className={`${primaryLink} mt-8 inline-flex`}>
          Get your Tapvane card
        </Link>
      </section>
    </main>
  );
}
