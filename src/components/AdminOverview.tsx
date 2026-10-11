"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Counts = { profiles: number; cards: number; unassigned: number; active: number; disabled: number };

export default function AdminOverview() {
  const supabase = useMemo(() => createClient(), []);
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    (async () => {
      const count = async (table: "profiles" | "cards", status?: string) => {
        let q = supabase.from(table).select("id", { count: "exact", head: true });
        if (status) q = q.eq("status", status);
        const { count: n } = await q;
        return n ?? 0;
      };
      const [profiles, cards, unassigned, active, disabled] = await Promise.all([
        count("profiles"),
        count("cards"),
        count("cards", "unassigned"),
        count("cards", "active"),
        count("cards", "disabled"),
      ]);
      setCounts({ profiles, cards, unassigned, active, disabled });
    })();
  }, [supabase]);

  const tiles = [
    { label: "Profiles", value: counts?.profiles, href: "/admin/profiles" },
    { label: "Cards made", value: counts?.cards, href: "/admin/cards" },
    { label: "Cards in use", value: counts?.active, href: "/admin/cards" },
    { label: "Cards not yet assigned", value: counts?.unassigned, href: "/admin/cards" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory">Overview</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="rounded-2xl border border-line bg-charcoal p-5 hover:border-gold">
            <p className="font-display text-4xl text-gold">{t.value ?? "–"}</p>
            <p className="mt-2 text-sm text-muted">{t.label}</p>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-sm text-stone">
        Orders, payments, stock and revenue will appear here once the shop is built (Stages 8 and 9).
      </p>
    </div>
  );
}
