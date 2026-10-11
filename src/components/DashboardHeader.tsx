"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

// The top bar of the customer dashboard: My profile, Orders, Log out.
export default function DashboardHeader({ active }: { active: "profile" | "orders" }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const tab = (isActive: boolean) =>
    `flex min-h-11 items-center rounded-full px-5 text-sm ${
      isActive ? "bg-gold font-semibold text-onyx" : "border border-line text-ivory hover:border-gold"
    }`;

  return (
    <header>
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-lg uppercase tracking-[0.3em] text-gold">Tapvane</Link>
        <button onClick={signOut} className="min-h-11 rounded-full border border-line px-5 text-sm text-ivory hover:border-gold">
          Log out
        </button>
      </div>
      <nav aria-label="Dashboard" className="mt-5 flex gap-2">
        <Link href="/dashboard" aria-current={active === "profile" ? "page" : undefined} className={tab(active === "profile")}>My profile</Link>
        <Link href="/dashboard/orders" aria-current={active === "orders" ? "page" : undefined} className={tab(active === "orders")}>My orders</Link>
      </nav>
    </header>
  );
}
