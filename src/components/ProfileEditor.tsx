"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import DeleteAccount from "@/components/DeleteAccount";
import ProfileView from "@/components/ProfileView";
import { inputClass, primaryButton } from "@/components/AuthForms";
import {
  accentPresets,
  defaultAccent,
  isReadableAccent,
  normalizePhone,
  normalizeWebsite,
  reservedUsernames,
  type Profile,
} from "@/lib/profiles";
import { createClient } from "@/lib/supabase/client";

type Form = {
  username: string;
  fullName: string;
  title: string;
  company: string;
  bio: string;
  photoUrl: string;
  coverUrl: string; // Pro only
  accentColor: string; // Pro only, "#RRGGBB" or empty for the default gold
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  location: string;
  instagram: string;
  linkedin: string;
  x: string;
  tiktok: string;
  facebook: string;
  snapchat: string;
};

const empty: Form = {
  username: "", fullName: "", title: "", company: "", bio: "", photoUrl: "", coverUrl: "", accentColor: "", phone: "",
  whatsapp: "", email: "", website: "", location: "", instagram: "", linkedin: "", x: "",
  tiktok: "", facebook: "", snapchat: "",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToForm(r: any): Form {
  return {
    username: r.username, fullName: r.full_name, title: r.title ?? "", company: r.company ?? "",
    bio: r.bio ?? "", photoUrl: r.photo_url ?? "", coverUrl: r.cover_url ?? "", accentColor: r.accent_color ?? "",
    phone: r.phone ?? "", whatsapp: r.whatsapp ?? "",
    email: r.email ?? "", website: r.website ?? "", location: r.location ?? "",
    instagram: r.instagram ?? "", linkedin: r.linkedin ?? "", x: r.x ?? "", tiktok: r.tiktok ?? "",
    facebook: r.facebook ?? "", snapchat: r.snapchat ?? "",
  };
}

function toProfile(f: Form, isPro: boolean): Profile {
  const opt = (v: string) => (v.trim() ? v.trim() : undefined);
  return {
    username: f.username || "preview",
    fullName: f.fullName,
    title: opt(f.title), company: opt(f.company), bio: opt(f.bio), photoUrl: opt(f.photoUrl),
    isPro, coverUrl: opt(f.coverUrl), accentColor: opt(f.accentColor),
    phone: opt(normalizePhone(f.phone)),
    whatsapp: opt(normalizePhone(f.whatsapp).replace("+", "")),
    email: opt(f.email), website: opt(normalizeWebsite(f.website)), location: opt(f.location),
    instagram: opt(f.instagram), linkedin: opt(f.linkedin), x: opt(f.x), tiktok: opt(f.tiktok),
    facebook: opt(f.facebook), snapchat: opt(f.snapchat),
    isActive: true,
  };
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
}

// Crops a chosen picture to the middle, at a fixed size, so profiles load fast on mobile data.
// Photo: 400x400 square. Cover (Pro): 1200x450 banner.
async function resizeImage(file: File, width: number, height: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const scale = Math.max(width / bitmap.width, height / bitmap.height);
  const sw = width / scale;
  const sh = height / scale;
  canvas
    .getContext("2d")!
    .drawImage(bitmap, (bitmap.width - sw) / 2, (bitmap.height - sh) / 2, sw, sh, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("resize failed"))), "image/jpeg", quality),
  );
}

function Field({
  label, name, value, onChange, hint, ...rest
}: {
  label: string; name: keyof Form; value: string; onChange: (n: keyof Form, v: string) => void; hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "name">) {
  return (
    <label className="flex flex-col gap-2 text-sm text-muted">
      {label}
      <input
        {...rest}
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className={inputClass}
      />
      {hint && <span className="text-xs text-stone">{hint}</span>}
    </label>
  );
}

// Customers use this with no props (their own profile). Admin passes adminProfileId:
// a profile's id to edit it, or "new" to create a profile for a walk-in customer.
export default function ProfileEditor({ adminProfileId }: { adminProfileId?: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const isAdminMode = adminProfileId !== undefined;
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  // Admin photos go in their own folder (allowed by the admin rule in the database).
  const adminFolder = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.replace("/login");

      if (isAdminMode) {
        if (adminProfileId === "new") {
          if (cancelled) return;
          setUserId(auth.user.id);
          setLoading(false);
          return;
        }
        const { data: row } = await supabase.from("profiles").select("*").eq("id", adminProfileId).maybeSingle();
        if (cancelled) return;
        if (!row) return router.replace("/admin/profiles");
        setUserId(auth.user.id);
        setProfileId(row.id);
        setIsActive(row.is_active);
        setIsPro(!!row.is_pro);
        setForm(rowToForm(row));
        setFirstName(row.full_name.split(" ")[0] ?? "");
        setLoading(false);
        return;
      }

      const meta = (auth.user.user_metadata?.full_name as string | undefined) ?? "";
      const { data: rows } = await supabase
        .from("profiles")
        .select("*")
        .eq("owner_user_id", auth.user.id)
        .order("created_at")
        .limit(1);
      if (cancelled) return;
      setUserId(auth.user.id);
      setFirstName((rows?.[0]?.full_name ?? meta).split(" ")[0] ?? "");
      if (rows && rows.length) {
        setProfileId(rows[0].id);
        setIsPro(!!rows[0].is_pro);
        setForm(rowToForm(rows[0]));
      } else {
        setForm({ ...empty, fullName: meta, username: slugify(meta), email: auth.user.email ?? "" });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, router, isAdminMode, adminProfileId]);

  function set(name: keyof Form, value: string) {
    setSaved(false);
    setForm((f) => ({ ...f, [name]: name === "username" ? value.toLowerCase() : value }));
  }

  async function onPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const blob = await resizeImage(file, 400, 400, 0.85);
      if (isAdminMode && !adminFolder.current) adminFolder.current = `admin-uploads/${crypto.randomUUID()}`;
      const path = `${isAdminMode ? adminFolder.current : userId}/avatar.jpg`;
      const { error } = await supabase.storage
        .from("profile-photos")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) throw error;
      const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
      set("photoUrl", `${data.publicUrl}?v=${Date.now()}`);
    } catch {
      setError("We could not upload that photo. Please try a different picture.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  // Pro only: the banner behind the top of the profile.
  async function onCover(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    setError("");
    try {
      const blob = await resizeImage(file, 1200, 450, 0.82);
      if (isAdminMode && !adminFolder.current) adminFolder.current = `admin-uploads/${crypto.randomUUID()}`;
      const path = `${isAdminMode ? adminFolder.current : userId}/cover.jpg`;
      const { error } = await supabase.storage
        .from("profile-photos")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) throw error;
      const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
      set("coverUrl", `${data.publicUrl}?v=${Date.now()}`);
    } catch {
      setError("We could not upload that cover image. Please try a different picture.");
    }
    setCoverUploading(false);
    if (coverRef.current) coverRef.current.value = "";
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const username = form.username.trim();
    if (!/^[a-z0-9-]{3,30}$/.test(username)) {
      return setError("Username must be 3 to 30 characters: lowercase letters, numbers and hyphens.");
    }
    // Admin may use reserved names like "demo" (customers may not).
    if (!isAdminMode && reservedUsernames.has(username)) return setError("That username is not available. Please choose another.");
    if (!form.fullName.trim()) return setError("Please enter your name.");
    const proStyle = isAdminMode || isPro;
    if (proStyle && form.accentColor && !isReadableAccent(form.accentColor)) {
      return setError("That accent colour is too dark to read on the black profile. Please choose a lighter one.");
    }

    const p = toProfile(form, isPro);
    const row = {
      username,
      full_name: form.fullName.trim(),
      title: p.title ?? null, company: p.company ?? null, bio: p.bio ?? null,
      photo_url: p.photoUrl ?? null, phone: p.phone ?? null, whatsapp: p.whatsapp ?? null,
      email: p.email ?? null, website: p.website ?? null, location: p.location ?? null,
      instagram: p.instagram ?? null, linkedin: p.linkedin ?? null, x: p.x ?? null,
      tiktok: p.tiktok ?? null, facebook: p.facebook ?? null, snapchat: p.snapchat ?? null,
      // Cover and accent are only sent for Pro profiles (the database refuses them otherwise).
      ...(proStyle ? { cover_url: p.coverUrl ?? null, accent_color: p.accentColor ?? null } : {}),
    };

    setBusy(true);
    let result;
    if (isAdminMode) {
      const adminRow = { ...row, is_active: isActive, is_pro: isPro };
      result = profileId
        ? await supabase.from("profiles").update(adminRow).eq("id", profileId).select("id").single()
        : await supabase.from("profiles").insert({ ...adminRow, owner_user_id: null }).select("id").single();
    } else {
      result = profileId
        ? await supabase.from("profiles").update(row).eq("id", profileId).select("id").single()
        : await supabase.from("profiles").insert({ ...row, owner_user_id: userId }).select("id").single();
    }
    setBusy(false);

    if (result.error) {
      return setError(
        result.error.code === "23505"
          ? "That username is already taken. Please choose another."
          : "We could not save your profile. Please try again.",
      );
    }
    if (isAdminMode && !profileId) return router.replace(`/admin/profiles/${result.data.id}`);
    setProfileId(result.data.id);
    setFirstName(form.fullName.trim().split(" ")[0]);
    setSaved(true);
  }

  if (loading) {
    return <main className="flex flex-1 items-center justify-center text-muted">Loading…</main>;
  }

  const incomplete = !profileId;
  const previewProfile = toProfile(form, isPro);
  const showProTools = isPro;
  const accentNow = form.accentColor || defaultAccent;

  return (
    <main className={`mx-auto w-full max-w-5xl flex-1 ${isAdminMode ? "" : "px-6 py-10"}`}>
      {!isAdminMode && <DashboardHeader active="profile" />}

      <h1 className={`font-display text-3xl text-ivory ${isAdminMode ? "" : "mt-8"}`}>
        {isAdminMode
          ? profileId ? `Edit profile: ${firstName}` : "New profile"
          : `Welcome back${firstName ? `, ${firstName}` : ""}`}
      </h1>
      {incomplete && !isAdminMode && (
        <p className="mt-2 max-w-xl text-muted">
          Your profile isn&apos;t complete yet. Add your details so people see the right info when they tap your card.
        </p>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-gold bg-charcoal">
              {form.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-stone">No photo</span>
              )}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} hidden />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="min-h-11 rounded-full border border-line px-5 text-sm text-ivory hover:border-gold disabled:opacity-60"
              >
                {uploading ? "Uploading…" : form.photoUrl ? "Change photo" : "Add photo"}
              </button>
            </div>
          </div>

          <Field label="Profile username" name="username" value={form.username} onChange={set} required maxLength={30}
            hint={`This is your profile link: tapvane.com/p/${form.username || "your-name"}. Use lowercase letters, numbers and hyphens.`} />
          <Field label="Full name" name="fullName" value={form.fullName} onChange={set} required maxLength={60} />
          <Field label="Job title" name="title" value={form.title} onChange={set} maxLength={60} />
          <Field label="Company" name="company" value={form.company} onChange={set} maxLength={60} />
          <label className="flex flex-col gap-2 text-sm text-muted">
            Short bio
            <textarea
              value={form.bio}
              maxLength={120}
              rows={2}
              onChange={(e) => set("bio", e.target.value)}
              className={`${inputClass} py-3`}
            />
            <span className="text-xs text-stone">{form.bio.length}/120</span>
          </label>

          {showProTools ? (
            <section className="flex flex-col gap-5 rounded-2xl border border-gold/50 bg-charcoal p-5" aria-label="Pro profile styling">
              <h2 className="font-display text-xl text-ivory">
                Pro styling <span className="ml-2 rounded-full border border-gold px-2 py-0.5 align-middle text-[10px] uppercase tracking-widest text-gold">Pro</span>
              </h2>

              <div>
                <p className="text-sm text-muted">Cover image</p>
                <div
                  className="mt-2 flex h-24 items-center justify-center overflow-hidden rounded-xl border border-line bg-onyx bg-cover bg-center text-xs text-stone"
                  style={form.coverUrl ? { backgroundImage: `url("${form.coverUrl}")` } : undefined}
                >
                  {!form.coverUrl && "No cover image yet"}
                </div>
                <input ref={coverRef} type="file" accept="image/*" onChange={onCover} hidden />
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => coverRef.current?.click()}
                    disabled={coverUploading}
                    className="min-h-11 rounded-full border border-line px-5 text-sm text-ivory hover:border-gold disabled:opacity-60"
                  >
                    {coverUploading ? "Uploading…" : form.coverUrl ? "Change cover image" : "Add cover image"}
                  </button>
                  {form.coverUrl && (
                    <button
                      type="button"
                      onClick={() => set("coverUrl", "")}
                      className="min-h-11 rounded-full px-4 text-sm text-stone underline-offset-4 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-stone">A wide picture works best (it is trimmed to a banner).</p>
              </div>

              <div>
                <p className="text-sm text-muted">Accent colour</p>
                <div className="mt-3 flex flex-wrap items-center gap-3" role="radiogroup" aria-label="Accent colour">
                  {accentPresets.map((c) => {
                    const on = accentNow.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={c.name}
                        title={c.name}
                        onClick={() => set("accentColor", c.hex === defaultAccent ? "" : c.hex)}
                        className={`h-11 w-11 rounded-full border-2 ${on ? "border-ivory" : "border-line"}`}
                        style={{ background: c.hex }}
                      />
                    );
                  })}
                  <label className="flex min-h-11 items-center gap-2 text-xs text-stone">
                    Custom
                    <input
                      type="color"
                      value={isReadableAccent(accentNow) ? accentNow : defaultAccent}
                      onChange={(e) => set("accentColor", e.target.value.toUpperCase())}
                      className="h-11 w-14 cursor-pointer rounded border border-line bg-onyx"
                      aria-label="Choose a custom accent colour"
                    />
                  </label>
                </div>
                {form.accentColor && !isReadableAccent(form.accentColor) && (
                  <p className="mt-2 text-xs text-red-300">That colour is too dark to read on black. Please choose a lighter one.</p>
                )}
              </div>
            </section>
          ) : (
            !isAdminMode && (
              <section className="rounded-2xl border border-line bg-charcoal p-5" aria-label="Pro profile styling (locked)">
                <h2 className="font-display text-xl text-ivory">
                  Pro styling <span className="ml-2 rounded-full border border-gold px-2 py-0.5 align-middle text-[10px] uppercase tracking-widest text-gold">Pro</span>
                </h2>
                <p className="mt-2 text-sm text-muted">
                  A cover image and your own accent colour come with the Pro package. Message us on WhatsApp if you would like to upgrade.
                </p>
              </section>
            )
          )}

          <h2 className="mt-2 font-display text-xl text-ivory">Contact buttons</h2>
          <p className="-mt-3 text-xs text-stone">Only the ones you fill in will show on your profile.</p>
          <Field label="Phone" name="phone" value={form.phone} onChange={set} type="tel" placeholder="0803 000 0000" />
          <Field label="WhatsApp number" name="whatsapp" value={form.whatsapp} onChange={set} type="tel" placeholder="0803 000 0000" />
          <Field label="Email" name="email" value={form.email} onChange={set} type="email" />
          <Field label="Website" name="website" value={form.website} onChange={set} placeholder="yourwebsite.com" />
          <Field label="Location" name="location" value={form.location} onChange={set} placeholder="Address or Google Maps link" />
          <Field label="Instagram" name="instagram" value={form.instagram} onChange={set} placeholder="@yourhandle" />
          <Field label="LinkedIn" name="linkedin" value={form.linkedin} onChange={set} placeholder="Your LinkedIn username or link" />
          <Field label="X" name="x" value={form.x} onChange={set} placeholder="@yourhandle" />
          <Field label="TikTok" name="tiktok" value={form.tiktok} onChange={set} placeholder="@yourhandle" />
          <Field label="Facebook" name="facebook" value={form.facebook} onChange={set} placeholder="Page name or link" />
          <Field label="Snapchat" name="snapchat" value={form.snapchat} onChange={set} placeholder="Your username" />

          {isAdminMode && (
            <label className="flex min-h-11 items-center gap-3 text-sm text-ivory">
              <input
                type="checkbox"
                checked={isPro}
                onChange={(e) => { setSaved(false); setIsPro(e.target.checked); }}
                className="h-4 w-4 accent-[#C9A34E]"
              />
              Pro profile (unlocks the cover image and accent colour; tick when the customer has the Pro package)
            </label>
          )}

          {isAdminMode && (
            <label className="flex min-h-11 items-center gap-3 text-sm text-ivory">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => { setSaved(false); setIsActive(e.target.checked); }}
                className="h-4 w-4 accent-[#C9A34E]"
              />
              Profile is switched on (untick to show &ldquo;Profile unavailable&rdquo;)
            </label>
          )}

          {error && <p role="alert" className="rounded-xl border border-red-900 px-4 py-3 text-sm text-red-300">{error}</p>}
          {saved && (
            <p role="status" className="rounded-xl border border-gold px-4 py-3 text-sm text-ivory">
              {isAdminMode ? "Profile saved." : "Your profile is updated. Your card already shows the new details."}{" "}
              <Link href={`/p/${form.username}`} className="text-gold underline">View my profile</Link>
            </p>
          )}
          <button type="submit" disabled={busy} className={primaryButton}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-3 font-display text-xl text-ivory">Live preview</h2>
          <div className="mx-auto flex max-h-[760px] w-full max-w-[380px] overflow-hidden overflow-y-auto rounded-[32px] border border-line bg-onyx">
            <ProfileView profile={previewProfile} preview />
          </div>
        </aside>
      </div>

      {!isAdminMode && userId && <DeleteAccount userId={userId} />}
    </main>
  );
}
