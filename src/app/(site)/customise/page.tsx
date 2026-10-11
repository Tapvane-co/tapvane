import Link from "next/link";

export const metadata = {
  title: "Design your card | Tapvane",
  robots: { index: false },
};

// Temporary page. The real card designer with live preview is built in Stage 7.
export default function CustomisePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="font-display text-3xl text-ivory">Design your card</h1>
      <p className="text-muted">The card designer is coming soon. To order now, chat with us on WhatsApp.</p>
      <Link href="/contact" className="flex min-h-12 items-center justify-center rounded-full bg-gold px-8 font-semibold text-onyx">
        Contact us
      </Link>
    </main>
  );
}
