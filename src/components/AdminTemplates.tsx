"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { inputClass } from "@/components/AuthForms";
import CardMockup, { noirGold } from "@/components/CardMockup";
import { saveColour, saveTemplate } from "@/lib/admin-actions";
import type { CardColours, CardLayout } from "@/lib/shop";
import { createClient } from "@/lib/supabase/client";

type T = { id?: string; name: string; layout: CardLayout; tier: "standard" | "premium"; active: boolean; sort: string };
type C = {
  id?: string; name: string; frontBg: string; frontText: string; accent: string; backBg: string; backText: string; active: boolean; sort: string;
};

const small = "min-h-11 rounded-full px-5 text-sm font-semibold disabled:opacity-50";
const layouts: { value: CardLayout; label: string }[] = [
  { value: "classic", label: "Classic (name bottom-left)" },
  { value: "centred", label: "Centred (name in the middle)" },
  { value: "monogram", label: "Monogram (big initial behind)" },
];

function toColours(c: C): CardColours {
  const ok = (h: string, fallback: string) => (/^#[0-9A-Fa-f]{6}$/.test(h) ? h : fallback);
  return {
    slug: "preview", name: c.name,
    frontBg: ok(c.frontBg, noirGold.frontBg), frontText: ok(c.frontText, noirGold.frontText), accent: ok(c.accent, noirGold.accent),
    backBg: ok(c.backBg, noirGold.backBg), backText: ok(c.backText, noirGold.backText),
  };
}

function Note({ n }: { n: { ok: boolean; text: string } | null }) {
  return n ? (
    <p role={n.ok ? "status" : "alert"} className={`mt-3 rounded-xl border px-4 py-2 text-sm ${n.ok ? "border-gold text-ivory" : "border-red-900 text-red-300"}`}>{n.text}</p>
  ) : null;
}

function ColourInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const valid = /^#[0-9A-Fa-f]{6}$/.test(value);
  return (
    <label className="flex flex-col gap-2 text-sm text-muted">
      {label}
      <span className="flex items-center gap-2">
        <input type="color" value={valid ? value : "#000000"} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-label={`${label} colour picker`} className="h-11 w-11 cursor-pointer rounded-lg border border-line bg-transparent p-1" />
        <input value={value} onChange={(e) => onChange(e.target.value)} maxLength={7} aria-label={`${label} code`} className={`${inputClass} font-mono`} />
      </span>
    </label>
  );
}

function TemplateRow({ initial, colours, onSaved }: { initial: T; colours: CardColours; onSaved: () => void }) {
  const [t, setT] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (patch: Partial<T>) => { setNote(null); setT((o) => ({ ...o, ...patch })); };

  async function save() {
    setBusy(true);
    const r = await saveTemplate({ id: t.id, name: t.name, layout: t.layout, tier: t.tier, isActive: t.active, sortOrder: Number(t.sort) || 0 });
    setBusy(false);
    setNote({ ok: r.ok, text: r.ok ? "Saved." : r.error });
    if (r.ok) onSaved();
  }

  return (
    <li className="grid gap-5 rounded-2xl border border-line bg-charcoal p-5 sm:grid-cols-[200px_1fr]">
      <div><CardMockup layout={t.layout} colours={colours} name="Your Name" title="Job title" company="Company" /></div>
      <div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-muted sm:col-span-2">
            Name
            <input value={t.name} onChange={(e) => set({ name: e.target.value })} maxLength={40} className={inputClass} />
          </label>
          <label className="flex flex-col gap-2 text-sm text-muted">
            Layout
            <select value={t.layout} onChange={(e) => set({ layout: e.target.value as CardLayout })} className={inputClass}>
              {layouts.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-muted">
            Available to
            <select value={t.tier} onChange={(e) => set({ tier: e.target.value as T["tier"] })} className={inputClass}>
              <option value="standard">All packages (standard)</option>
              <option value="premium">Pro only (premium)</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-muted">
            Order in the list
            <input value={t.sort} onChange={(e) => set({ sort: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className={inputClass} />
          </label>
          <label className="flex min-h-11 items-center gap-3 self-end text-sm text-ivory">
            <input type="checkbox" checked={t.active} onChange={(e) => set({ active: e.target.checked })} className="h-4 w-4 accent-[#C9A34E]" />
            Shown to customers
          </label>
        </div>
        <button type="button" disabled={busy} onClick={save} className={`${small} mt-4 bg-gold text-onyx`}>{busy ? "Saving…" : t.id ? "Save" : "Add template"}</button>
        <Note n={note} />
      </div>
    </li>
  );
}

function ColourRow({ initial, onSaved }: { initial: C; onSaved: () => void }) {
  const [c, setC] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (patch: Partial<C>) => { setNote(null); setC((o) => ({ ...o, ...patch })); };

  async function save() {
    setBusy(true);
    const r = await saveColour({ id: c.id, name: c.name, frontBg: c.frontBg, frontText: c.frontText, accent: c.accent, backBg: c.backBg, backText: c.backText, isActive: c.active, sortOrder: Number(c.sort) || 0 });
    setBusy(false);
    setNote({ ok: r.ok, text: r.ok ? "Saved." : r.error });
    if (r.ok) onSaved();
  }

  const colours = toColours(c);
  return (
    <li className="rounded-2xl border border-line bg-charcoal p-5">
      <div className="grid gap-5 sm:grid-cols-[200px_200px_1fr]">
        <div><CardMockup colours={colours} name="Your Name" title="Job title" /></div>
        <div><CardMockup side="back" colours={colours} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-muted sm:col-span-2">
            Name
            <input value={c.name} onChange={(e) => set({ name: e.target.value })} maxLength={40} className={inputClass} />
          </label>
          <ColourInput label="Front background" value={c.frontBg} onChange={(v) => set({ frontBg: v })} />
          <ColourInput label="Front text" value={c.frontText} onChange={(v) => set({ frontText: v })} />
          <ColourInput label="Accent (logo, icon)" value={c.accent} onChange={(v) => set({ accent: v })} />
          <ColourInput label="Back background" value={c.backBg} onChange={(v) => set({ backBg: v })} />
          <ColourInput label="Back text" value={c.backText} onChange={(v) => set({ backText: v })} />
          <label className="flex flex-col gap-2 text-sm text-muted">
            Order in the list
            <input value={c.sort} onChange={(e) => set({ sort: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className={inputClass} />
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm text-ivory sm:col-span-2">
            <input type="checkbox" checked={c.active} onChange={(e) => set({ active: e.target.checked })} className="h-4 w-4 accent-[#C9A34E]" />
            Shown to customers
          </label>
        </div>
      </div>
      <button type="button" disabled={busy} onClick={save} className={`${small} mt-4 bg-gold text-onyx`}>{busy ? "Saving…" : c.id ? "Save" : "Add colour set"}</button>
      <Note n={note} />
    </li>
  );
}

export default function AdminTemplates() {
  const supabase = useMemo(() => createClient(), []);
  const [templates, setTemplates] = useState<T[] | null>(null);
  const [colours, setColours] = useState<C[] | null>(null);
  const [newKey, setNewKey] = useState({ t: 0, c: 0 });

  const load = useCallback(async () => {
    const [t, c] = await Promise.all([
      supabase.from("card_templates").select("*").order("sort_order"),
      supabase.from("card_colours").select("*").order("sort_order"),
    ]);
    setTemplates((t.data ?? []).map((r) => ({ id: r.id, name: r.name, layout: r.layout, tier: r.tier, active: r.is_active, sort: String(r.sort_order) })));
    setColours((c.data ?? []).map((r) => ({
      id: r.id, name: r.name, frontBg: r.front_bg, frontText: r.front_text, accent: r.accent, backBg: r.back_bg, backText: r.back_text, active: r.is_active, sort: String(r.sort_order),
    })));
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const previewColours = colours?.[0] ? toColours(colours[0]) : noirGold;
  const nextSort = (list: { sort: string }[] | null) => String(Math.max(0, ...(list ?? []).map((x) => Number(x.sort) || 0)) + 1);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl text-ivory">Card templates &amp; colours</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        What customers can choose in the card designer. Orders already placed keep the design they were made with, so changing something here never alters an old order.
        Colours are shown as codes like #C9A34E; click the small square to pick one.
      </p>

      <h2 className="mt-8 font-display text-2xl text-ivory">Templates</h2>
      {templates === null ? <p className="mt-4 text-muted">Loading…</p> : (
        <ul className="mt-4 flex flex-col gap-4">
          {templates.map((t) => <TemplateRow key={t.id} initial={t} colours={previewColours} onSaved={load} />)}
          <TemplateRow
            key={`new-t-${newKey.t}`}
            initial={{ name: "", layout: "classic", tier: "standard", active: true, sort: nextSort(templates) }}
            colours={previewColours}
            onSaved={() => { setNewKey((k) => ({ ...k, t: k.t + 1 })); load(); }}
          />
        </ul>
      )}

      <h2 className="mt-12 font-display text-2xl text-ivory">Colour sets</h2>
      {colours === null ? <p className="mt-4 text-muted">Loading…</p> : (
        <ul className="mt-4 flex flex-col gap-4">
          {colours.map((c) => <ColourRow key={c.id} initial={c} onSaved={load} />)}
          <ColourRow
            key={`new-c-${newKey.c}`}
            initial={{ name: "", frontBg: "#0B0B0C", frontText: "#EDE6D6", accent: "#C9A34E", backBg: "#C9A34E", backText: "#0B0B0C", active: true, sort: nextSort(colours) }}
            onSaved={() => { setNewKey((k) => ({ ...k, c: k.c + 1 })); load(); }}
          />
        </ul>
      )}
    </div>
  );
}
