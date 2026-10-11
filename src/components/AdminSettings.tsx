"use client";

import { useEffect, useMemo, useState } from "react";
import { inputClass } from "@/components/AuthForms";
import { saveSettings } from "@/lib/admin-actions";
import { createClient } from "@/lib/supabase/client";

type Field = { key: string; label: string; hint?: string; placeholder?: string; multiline?: boolean; numeric?: boolean };

const groups: { title: string; intro?: string; fields: Field[] }[] = [
  {
    title: "Contact",
    intro: "Shown on the Contact page, the footer, the WhatsApp button, checkout and in the Terms and Privacy pages. Change it once here and it changes everywhere.",
    fields: [
      { key: "whatsapp_number", label: "WhatsApp number", hint: "With the country code, like +234 902 591 8252." },
      { key: "contact_email", label: "Contact email", hint: "Also used as the reply-to address on automatic emails." },
      { key: "instagram_handle", label: "Instagram", placeholder: "@yourhandle", hint: "Leave blank to hide it on the Contact page." },
      { key: "opening_hours", label: "Opening hours", placeholder: "Monday–Saturday, 9am–6pm", hint: "Leave blank to hide them. Also used in the \"ready for pickup\" email." },
    ],
  },
  {
    title: "Business details",
    intro: "Shown in the Terms of Service and Privacy Policy.",
    fields: [
      { key: "legal_business_name", label: "Registered business name and RC/BN number", placeholder: "Example Ventures (BN 1234567)", hint: "Leave blank if you are not registered yet; the pages will then just say Tapvane." },
    ],
  },
  {
    title: "Pickup and delivery",
    fields: [
      { key: "pickup_address", label: "Pickup address", multiline: true },
      { key: "delivery_fee_makurdi", label: "Delivery within Makurdi (₦)", numeric: true, hint: "Use 0 for free." },
      { key: "delivery_fee_nationwide", label: "Delivery outside Makurdi (₦)", numeric: true },
    ],
  },
  {
    title: "Bank details for transfers",
    intro: "Customers who choose bank transfer see these at checkout, once they are logged in. Fill in all three, or leave all three blank to switch bank transfer off.",
    fields: [
      { key: "bank_name", label: "Bank name" },
      { key: "bank_account_name", label: "Account name" },
      { key: "bank_account_number", label: "Account number", numeric: true },
    ],
  },
];

export default function AdminSettings() {
  const supabase = useMemo(() => createClient(), []);
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    supabase.from("settings").select("key, value").then(({ data }) => {
      setValues(Object.fromEntries((data ?? []).map((r) => [r.key as string, String(r.value ?? "")])));
    });
  }, [supabase]);

  function set(key: string, value: string) {
    setNote(null);
    setValues((v) => ({ ...(v ?? {}), [key]: value }));
  }

  async function save() {
    if (!values) return;
    setBusy(true);
    const r = await saveSettings(values);
    setBusy(false);
    setNote({ ok: r.ok, text: r.ok ? (r.message ?? "Saved.") : r.error });
  }

  if (!values) return <p className="text-muted">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-ivory">Settings</h1>
      {groups.map((g) => (
        <section key={g.title} className="mt-8 rounded-2xl border border-line bg-charcoal p-6">
          <h2 className="font-display text-2xl text-ivory">{g.title}</h2>
          {g.intro && <p className="mt-1 text-sm text-muted">{g.intro}</p>}
          <div className="mt-4 flex flex-col gap-4">
            {g.fields.map((f) => (
              <label key={f.key} className="flex flex-col gap-2 text-sm text-muted">
                {f.label}
                {f.multiline ? (
                  <textarea value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} rows={2} maxLength={300} className={`${inputClass} py-3`} />
                ) : (
                  <input
                    value={values[f.key] ?? ""}
                    onChange={(e) => set(f.key, f.numeric ? e.target.value.replace(/[^0-9 ]/g, "") : e.target.value)}
                    inputMode={f.numeric ? "numeric" : undefined}
                    placeholder={f.placeholder}
                    className={inputClass}
                  />
                )}
                {f.hint && <span className="text-xs text-stone">{f.hint}</span>}
              </label>
            ))}
          </div>
        </section>
      ))}

      {note && (
        <p role={note.ok ? "status" : "alert"} className={`mt-6 rounded-xl border px-4 py-3 text-sm ${note.ok ? "border-gold text-ivory" : "border-red-900 text-red-300"}`}>{note.text}</p>
      )}
      <button type="button" disabled={busy} onClick={save} className="mt-6 flex min-h-12 items-center justify-center rounded-full bg-gold px-10 font-semibold text-onyx hover:brightness-110 disabled:opacity-50">
        {busy ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
