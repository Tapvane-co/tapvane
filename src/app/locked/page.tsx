export const metadata = { title: "Coming soon | Tapvane", robots: { index: false, follow: false } };

// Shown to everyone while the site lock is on (see src/proxy.ts). The password box is for the founder.
export default function Locked() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <span className="font-display text-2xl uppercase tracking-[0.3em] text-gold">Tapvane</span>
      <p className="text-xs uppercase tracking-[0.3em] text-stone">Tap · Share · Connect</p>
      <h1 className="font-display text-4xl text-ivory">Coming soon</h1>
      <p className="text-muted">We&apos;re getting everything ready. Please check back shortly.</p>

      <details className="mt-6 w-full text-left">
        <summary className="mx-auto w-fit cursor-pointer text-sm text-stone">Team access</summary>
        <form action="/api/unlock" method="post" className="mt-3 flex flex-col gap-3">
          <label htmlFor="password" className="sr-only">
            Access password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="off"
            required
            placeholder="Access password"
            className="min-h-12 rounded-xl border border-line bg-charcoal px-4 text-ivory outline-none focus:border-gold"
          />
          <button type="submit" className="min-h-12 rounded-full bg-gold px-8 font-semibold text-onyx">
            Enter
          </button>
        </form>
      </details>
    </main>
  );
}
