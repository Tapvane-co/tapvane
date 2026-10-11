"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/profiles", label: "Profiles" },
  { href: "/admin/cards", label: "Cards" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/settings", label: "Settings" },
];

// Wraps every /admin page. The real protection is in the database (only admins can read or change
// this data); this just shows a friendly screen to anyone who isn't an admin.
export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<"checking" | "admin" | "denied">("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.replace("/login");
      const { data } = await supabase.rpc("is_admin");
      if (!cancelled) setState(data === true ? "admin" : "denied");
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (state === "checking") {
    return <main className="flex flex-1 items-center justify-center text-muted">Loading…</main>;
  }

  if (state === "denied") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-3xl text-ivory">Admins only</h1>
        <p className="text-muted">This area is only for Tapvane admins.</p>
        <Link href="/dashboard" className="flex min-h-12 items-center justify-center rounded-full bg-gold px-6 font-semibold text-onyx">
          Go to my profile
        </Link>
      </main>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link href="/admin" className="font-display text-gold uppercase tracking-[0.3em] text-lg">
          Tapvane <span className="ml-2 text-xs tracking-widest text-stone">Admin</span>
        </Link>
        <button onClick={signOut} className="min-h-11 rounded-full border border-line px-5 text-sm text-ivory hover:border-gold">
          Log out
        </button>
      </header>
      <nav className="mt-6 flex flex-wrap gap-2 border-b border-line-subtle pb-4 print:hidden">
        {nav.map((n) => {
          const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex min-h-11 items-center rounded-full px-5 text-sm ${
                active ? "bg-gold font-semibold text-onyx" : "border border-line text-ivory hover:border-gold"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8">{children}</div>
    </div>
  );
}
