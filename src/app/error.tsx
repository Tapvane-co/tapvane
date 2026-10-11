"use client";

import Link from "next/link";

// Shown if something unexpected breaks on a page, instead of a blank screen.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span className="font-display text-xl uppercase tracking-[0.3em] text-gold">Tapvane</span>
      <h1 className="font-display text-3xl text-ivory">Something went wrong</h1>
      <p className="text-muted">Please try again. If it keeps happening, chat with us on WhatsApp.</p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reset} className="flex min-h-12 items-center justify-center rounded-full bg-gold px-8 font-semibold text-onyx">
          Try again
        </button>
        <Link href="/" className="flex min-h-12 items-center justify-center rounded-full border border-line px-8 text-ivory hover:border-gold">
          Back to home
        </Link>
      </div>
    </main>
  );
}
