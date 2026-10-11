import { createPublicClient } from "@/lib/supabase/public";

// Profile data: the two sample profiles below, plus real profiles stored in Supabase.
export type Profile = {
  username: string;
  fullName: string;
  title?: string;
  company?: string;
  bio?: string;
  photoUrl?: string;
  coverUrl?: string;
  accentColor?: string; // Pro only
  phone?: string;
  whatsapp?: string; // digits with country code, e.g. 2348000000000
  email?: string;
  website?: string;
  location?: string;
  instagram?: string; // handle, no @
  linkedin?: string; // handle or full URL
  x?: string;
  tiktok?: string;
  facebook?: string;
  snapchat?: string;
  isActive: boolean;
};

const sampleProfiles: Profile[] = [
  {
    username: "demo",
    fullName: "Tapvane",
    title: "Tap. Share. Connect.",
    bio: "The smart business card for Nigerian professionals and businesses.",
    website: "https://tapvane.com",
    isActive: true,
  },
  {
    username: "offline-demo",
    fullName: "Switched Off",
    isActive: false,
  },
];

// Reads a profile for the public page: the database first, then the built-in sample profiles.
// So a real profile saved with the username "demo" in admin replaces the built-in sample.
export async function getProfile(username: string): Promise<Profile | null> {
  const name = username.toLowerCase();
  if (!/^[a-z0-9-]{3,30}$/.test(name)) return null;

  const { data, error } = await createPublicClient()
    .from("profiles")
    .select("*")
    .eq("username", name)
    .maybeSingle();
  if (!error && data) return fromRow(data);

  return sampleProfiles.find((p) => p.username === name) ?? null;
}

export function sampleUsernames() {
  return sampleProfiles.map((p) => p.username);
}

// Usernames nobody may pick (sample profiles and words used by the site itself).
export const reservedUsernames = new Set([
  ...sampleProfiles.map((p) => p.username),
  "admin", "api", "dashboard", "login", "signup", "p", "c", "tapvane", "support", "help",
]);

/* eslint-disable @typescript-eslint/no-explicit-any */
export function fromRow(r: any): Profile {
  return {
    username: r.username,
    fullName: r.full_name,
    title: r.title ?? undefined,
    company: r.company ?? undefined,
    bio: r.bio ?? undefined,
    photoUrl: r.photo_url ?? undefined,
    coverUrl: r.cover_url ?? undefined,
    accentColor: r.accent_color ?? undefined,
    phone: r.phone ?? undefined,
    whatsapp: r.whatsapp ?? undefined,
    email: r.email ?? undefined,
    website: r.website ?? undefined,
    location: r.location ?? undefined,
    instagram: r.instagram ?? undefined,
    linkedin: r.linkedin ?? undefined,
    x: r.x ?? undefined,
    tiktok: r.tiktok ?? undefined,
    facebook: r.facebook ?? undefined,
    snapchat: r.snapchat ?? undefined,
    isActive: r.is_active,
  };
}

// Turns what a person typed into a clean phone number: 0803... or 234803... become +234803...
export function normalizePhone(v: string) {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return "+234" + digits.slice(1);
  return "+" + digits;
}

export function normalizeWebsite(v: string) {
  const t = v.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export type SocialKind = "instagram" | "x" | "tiktok" | "facebook" | "snapchat" | "linkedin";

export function socialUrl(kind: SocialKind, v: string) {
  if (/^https?:\/\//i.test(v)) return v;
  const h = v.replace(/^@/, "");
  const base = {
    instagram: "https://instagram.com/",
    x: "https://x.com/",
    tiktok: "https://tiktok.com/@",
    facebook: "https://facebook.com/",
    snapchat: "https://snapchat.com/add/",
    linkedin: "https://linkedin.com/in/",
  }[kind];
  return base + h;
}

export function mapsUrl(location: string) {
  return /^https?:\/\//i.test(location)
    ? location
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function vcardFor(p: Profile) {
  const esc = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const parts = p.fullName.trim().split(/\s+/);
  const last = parts.length > 1 ? parts.pop()! : "";
  const first = parts.join(" ");
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `N:${esc(last)};${esc(first)};;;`, `FN:${esc(p.fullName)}`];
  if (p.company) lines.push(`ORG:${esc(p.company)}`);
  if (p.title) lines.push(`TITLE:${esc(p.title)}`);
  if (p.phone) lines.push(`TEL;TYPE=CELL:${p.phone}`);
  if (p.email) lines.push(`EMAIL:${p.email}`);
  if (p.website) lines.push(`URL:${p.website}`);
  if (p.location) lines.push(`ADR;TYPE=WORK:;;${esc(p.location)};;;;`);
  lines.push("END:VCARD");
  return lines.join("\r\n") + "\r\n";
}
