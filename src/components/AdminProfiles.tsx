"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { inputClass } from "@/components/AuthForms";
import { createClient } from "@/lib/supabase/client";

type Row = {
  id: string;
  username: string;
  full_name: string;
  company: string | null;
  owner_user_id: string | null;
  is_active: boolean;
};

export default function AdminProfiles() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, company, owner_user_id, is_active")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) setError("We could not load profiles. Please refresh the page.");
      setRows(data ?? []);
    })();
  }, [supabase]);

  async function toggle(row: Row) {
    setError("");
    const { error } = await supabase.from("profiles").update({ is_active: !row.is_active }).eq("id", row.id);
    if (error) return setError("We could not change that profile. Please try again.");
    setRows((rs) => rs?.map((r) => (r.id === row.id ? { ...r, is_active: !r.is_active } : r)) ?? null);
  }

  const q = search.trim().toLowerCase();
  const shown = (rows ?? []).filter(
    (r) => !q || [r.username, r.full_name, r.company ?? ""].some((v) => v.toLowerCase().includes(q)),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-ivory">Profiles</h1>
        <Link href="/admin/profiles/new" className="flex min-h-11 items-center rounded-full bg-gold px-6 text-sm font-semibold text-onyx">
          New profile
        </Link>
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, username or company"
        aria-label="Search profiles"
        className={`${inputClass} mt-6`}
      />
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-900 px-4 py-3 text-sm text-red-300">{error}</p>}

      {rows === null ? (
        <p className="mt-6 text-muted">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="mt-6 text-muted">{rows.length === 0 ? "No profiles yet." : "No profiles match that search."}</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {shown.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-charcoal p-4">
              <div className="min-w-0">
                <p className="truncate text-ivory">{r.full_name}</p>
                <p className="truncate text-sm text-muted">
                  /p/{r.username}
                  {r.company ? ` · ${r.company}` : ""}
                </p>
                <p className="mt-1 flex gap-2 text-xs">
                  <span className={r.is_active ? "text-gold" : "text-red-300"}>{r.is_active ? "On" : "Switched off"}</span>
                  <span className="text-stone">{r.owner_user_id ? "Has account" : "Walk-in (no account)"}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/p/${r.username}`} target="_blank" className="flex min-h-11 items-center rounded-full border border-line px-4 text-sm text-ivory hover:border-gold">
                  View
                </Link>
                <Link href={`/admin/profiles/${r.id}`} className="flex min-h-11 items-center rounded-full border border-line px-4 text-sm text-ivory hover:border-gold">
                  Edit
                </Link>
                <button onClick={() => toggle(r)} className="min-h-11 rounded-full border border-line px-4 text-sm text-ivory hover:border-gold">
                  {r.is_active ? "Switch off" : "Switch on"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
