import Link from "next/link";

export const metadata = { title: "Page not found | Tapvane", robots: { index: false } };

// CONTENT.md section 9.
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span className="font-display text-xl uppercase tracking-[0.3em] text-gold">Tapvane</span>
      <h1 className="font-display text-3xl text-ivory">Page not found</h1>
      <p className="text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/" className="mt-2 flex min-h-12 items-center justify-center rounded-full bg-gold px-8 font-semibold text-onyx">
        Back to home
      </Link>
    </main>
  );
}
