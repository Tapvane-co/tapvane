"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { inputClass } from "@/components/AuthForms";
import { chipUrl, generateCardCode, type CardStatus, type CardType } from "@/lib/cards";
import { createClient } from "@/lib/supabase/client";

type CardRow = {
  id: string;
  card_code: string;
  type: CardType;
  status: CardStatus;
  profile_id: string | null;
  profile: { username: string; full_name: string } | null;
};
type ProfileOption = { id: string; username: string; full_name: string };

const typeLabel: Record<CardType, string> = { pvc: "PVC card", premium: "Matte card", tag: "NFC tag" };
const statusLabel: Record<CardStatus, string> = { unassigned: "Not assigned", active: "In use", disabled: "Disabled" };
const smallButton = "min-h-11 rounded-full border border-line px-4 text-sm text-ivory hover:border-gold disabled:opacity-60";

function csvCell(v: string) {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export default function AdminCards() {
  const supabase = useMemo(() => createClient(), []);
  const [cards, setCards] = useState<CardRow[] | null>(null);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [filter, setFilter] = useState<"all" | CardStatus>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [type, setType] = useState<CardType>("pvc");
  const [quantity, setQuantity] = useState(10);
  const [generating, setGenerating] = useState(false);

  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignName, setAssignName] = useState("");

  async function load() {
    const [c, p] = await Promise.all([
      supabase
        .from("cards")
        .select("id, card_code, type, status, profile_id, profile:profiles(username, full_name)")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase.from("profiles").select("id, username, full_name").order("username").limit(1000),
    ]);
    if (c.error || p.error) setError("We could not load cards. Please refresh the page.");
    setCards((c.data as unknown as CardRow[]) ?? []);
    setProfiles(p.data ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onGenerate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    const n = Math.floor(quantity);
    if (!(n >= 1 && n <= 200)) return setError("Please choose between 1 and 200 cards.");

    setGenerating(true);
    for (let attempt = 0; attempt < 3; attempt++) {
      const codes = new Set<string>();
      while (codes.size < n) codes.add(generateCardCode());
      const { error } = await supabase.from("cards").insert([...codes].map((card_code) => ({ card_code, type })));
      if (!error) {
        setNotice(`Made ${n} new ${typeLabel[type].toLowerCase()}${n === 1 ? "" : "s"}.`);
        setGenerating(false);
        return load();
      }
      if (error.code !== "23505") break; // 23505 = a code already existed; try again with new codes
    }
    setGenerating(false);
    setError("We could not make the cards. Please try again.");
  }

  async function update(card: CardRow, changes: { status: CardStatus; profile_id?: string | null }) {
    setError("");
    setNotice("");
    const { error } = await supabase.from("cards").update(changes).eq("id", card.id);
    if (error) return setError("We could not change that card. Please try again.");
    await load();
  }

  async function onAssign(card: CardRow) {
    const wanted = assignName.trim().toLowerCase().replace(/^@/, "");
    const profile = profiles.find((p) => p.username === wanted);
    if (!profile) return setError(`No profile has the username "${wanted}". Pick one from the list.`);
    await update(card, { status: "active", profile_id: profile.id });
    setAssigningId(null);
    setAssignName("");
    setNotice(`${card.card_code} now opens /p/${profile.username}.`);
  }

  const q = search.trim().toUpperCase();
  const shown = (cards ?? []).filter(
    (c) =>
      (filter === "all" || c.status === filter) &&
      (!q || c.card_code.includes(q) || (c.profile?.username ?? "").toUpperCase().includes(q)),
  );

  function exportCsv() {
    const header = ["card_code", "type", "status", "assigned_profile", "chip_url"];
    const lines = shown.map((c) =>
      [c.card_code, c.type, c.status, c.profile?.username ?? "", chipUrl(c.card_code)].map(csvCell).join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\r\n") + "\r\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tapvane-cards-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory">Cards</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Each card or tag has a code. Write <span className="text-ivory">tapvane.com/c/CODE</span> onto the chip, then assign the card to a profile here.
        If a card is lost or a staff member leaves, reassign it. The chip never needs rewriting.
      </p>

      <form onSubmit={onGenerate} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-charcoal p-4">
        <label className="flex flex-col gap-2 text-sm text-muted">
          Type
          <select value={type} onChange={(e) => setType(e.target.value as CardType)} className={`${inputClass} min-w-40`}>
            <option value="pvc">PVC card</option>
            <option value="premium">Matte card</option>
            <option value="tag">NFC tag</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-muted">
          How many
          <input
            type="number"
            min={1}
            max={200}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className={`${inputClass} w-28`}
          />
        </label>
        <button type="submit" disabled={generating} className="min-h-12 rounded-full bg-gold px-6 font-semibold text-onyx disabled:opacity-60">
          {generating ? "Making…" : "Make new codes"}
        </button>
      </form>

      {error && <p role="alert" className="mt-4 rounded-xl border border-red-900 px-4 py-3 text-sm text-red-300">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl border border-gold px-4 py-3 text-sm text-ivory">{notice}</p>}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code or username"
          aria-label="Search cards"
          className={`${inputClass} max-w-xs`}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Filter by status" className={`${inputClass} max-w-44`}>
          <option value="all">All cards</option>
          <option value="unassigned">Not assigned</option>
          <option value="active">In use</option>
          <option value="disabled">Disabled</option>
        </select>
        <button onClick={exportCsv} disabled={shown.length === 0} className={smallButton}>
          Export CSV ({shown.length})
        </button>
      </div>

      {cards === null ? (
        <p className="mt-6 text-muted">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="mt-6 text-muted">{cards.length === 0 ? "No cards yet. Make some codes above." : "No cards match."}</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {shown.map((c) => (
            <li key={c.id} className="rounded-2xl border border-line bg-charcoal p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono tracking-widest text-ivory">{c.card_code}</p>
                  <p className="mt-1 text-sm text-muted">
                    {typeLabel[c.type]} ·{" "}
                    <span className={c.status === "active" ? "text-gold" : c.status === "disabled" ? "text-red-300" : ""}>
                      {statusLabel[c.status]}
                    </span>
                    {c.profile ? ` · opens /p/${c.profile.username} (${c.profile.full_name})` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={smallButton}
                    onClick={() => {
                      setAssigningId(assigningId === c.id ? null : c.id);
                      setAssignName("");
                    }}
                  >
                    {c.profile_id ? "Reassign" : "Assign"}
                  </button>
                  {c.profile_id && c.status !== "disabled" && (
                    <button className={smallButton} onClick={() => update(c, { status: "unassigned", profile_id: null })}>
                      Unassign
                    </button>
                  )}
                  {c.status === "disabled" ? (
                    <button className={smallButton} onClick={() => update(c, { status: c.profile_id ? "active" : "unassigned" })}>
                      Enable
                    </button>
                  ) : (
                    <button className={smallButton} onClick={() => update(c, { status: "disabled" })}>
                      Disable
                    </button>
                  )}
                </div>
              </div>

              {assigningId === c.id && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line-subtle pt-3">
                  <input
                    list="profile-usernames"
                    value={assignName}
                    onChange={(e) => setAssignName(e.target.value)}
                    placeholder="Type a profile username"
                    aria-label="Profile username"
                    className={`${inputClass} max-w-xs`}
                  />
                  <button className="min-h-11 rounded-full bg-gold px-5 text-sm font-semibold text-onyx" onClick={() => onAssign(c)}>
                    Save
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <datalist id="profile-usernames">
        {profiles.map((p) => (
          <option key={p.id} value={p.username}>
            {p.full_name}
          </option>
        ))}
      </datalist>
    </div>
  );
}
