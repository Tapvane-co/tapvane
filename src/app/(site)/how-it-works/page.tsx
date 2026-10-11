import Link from "next/link";
import TapDemo from "@/components/TapDemo";
import { howItWorksSteps } from "@/lib/content";

export const metadata = {
  title: "How it works | Tapvane",
  description:
    "Every Tapvane card has a tiny NFC chip inside. Hold it near a phone and your profile opens instantly. No app, no battery, no pairing.",
};

export default function HowItWorksPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <h1 className="font-display text-4xl text-ivory md:text-5xl">How Tapvane works</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Every Tapvane card has a tiny NFC chip inside, the same technology used for contactless payments. When someone
        holds their phone near your card, the chip tells their phone to open your Tapvane profile. No app, no battery,
        no pairing.
      </p>

      <div className="mt-12 grid items-start gap-12 lg:grid-cols-[1fr_380px]">
        <ol className="flex flex-col gap-5">
          {howItWorksSteps.map((s) => (
            <li key={s.title} className="rounded-2xl border border-line bg-charcoal p-6">
              <h2 className="font-display text-xl text-ivory">{s.title}</h2>
              <p className="mt-2 text-sm text-muted">{s.body}</p>
            </li>
          ))}
          <li className="rounded-2xl border border-gold p-6 text-sm text-ivory">
            <span className="font-semibold text-gold">Tip: </span>
            On iPhones, tap near the top of the phone. On Android, make sure NFC is turned on in Settings (it&apos;s on by
            default on most phones).
          </li>
        </ol>
        <TapDemo />
      </div>

      <Link
        href="/packages"
        className="mt-12 inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 font-semibold text-onyx hover:brightness-110"
      >
        Get your Tapvane card
      </Link>
    </main>
  );
}
