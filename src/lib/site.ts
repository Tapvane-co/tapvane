import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Product } from "@/lib/shop";

// Site-wide data that the founder can change in admin: prices and settings.
// Both are read from the database and remembered for a short while so pages stay fast.
// After an admin edit, call updateTag("products") or updateTag("settings") to refresh at once (Stage 9).

export type { Product } from "@/lib/shop";

export type Settings = {
  whatsappNumber: string; // as shown to people, e.g. "+234 902 591 8252"
  contactEmail: string;
  instagramHandle: string; // empty until the founder sets it
  openingHours: string; // empty until the founder sets it
  pickupAddress: string;
  deliveryFeeMakurdi: number;
  deliveryFeeNationwide: number;
  legalName: string; // registered business name + RC/BN number, for Terms and Privacy; empty until set
};

// The starting values from the PRD. Used only if a setting is missing from the database.
const defaultSettings: Settings = {
  whatsappNumber: "+234 902 591 8252",
  contactEmail: "nfc.taply.hub@gmail.com",
  instagramHandle: "",
  openingHours: "",
  pickupAddress: "Opp. Holy Ghost Catholic Church, Wadata, Makurdi, Benue State",
  deliveryFeeMakurdi: 1500,
  deliveryFeeNationwide: 5000,
  legalName: "",
};

// Prices are never hard-coded for real visitors. These stand-ins exist ONLY on the developer's
// computer, so the pages can be previewed before the database file has been run.
const devOnlyProducts: Product[] = [
  { slug: "basic", name: "Basic", type: "basic", itemType: "pvc", cardsIncluded: 1, price: 18000 },
  { slug: "pro", name: "Pro", type: "pro", itemType: "premium", cardsIncluded: 1, price: 30000 },
  { slug: "business-5", name: "Business 5", type: "business", itemType: "pvc", cardsIncluded: 5, price: 80000 },
  { slug: "business-10", name: "Business 10", type: "business", itemType: "pvc", cardsIncluded: 10, price: 150000 },
  { slug: "tag", name: "NFC Tag", type: "tag", itemType: "tag", cardsIncluded: 1, price: 10000 },
];

export async function getProducts(): Promise<Product[] | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const { data, error } = await createPublicClient()
    .from("products")
    .select("slug, name, type, item_type, cards_included, price")
    .eq("is_active", true)
    .order("sort_order");

  if (error || !data || data.length === 0) {
    return process.env.NODE_ENV === "production" ? null : devOnlyProducts;
  }
  return data.map((r) => ({
    slug: r.slug,
    name: r.name,
    type: r.type,
    itemType: r.item_type,
    cardsIncluded: r.cards_included,
    price: r.price,
  }));
}

export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheLife("minutes");
  cacheTag("settings");

  const { data } = await createPublicClient().from("settings").select("key, value");
  const v = new Map((data ?? []).map((r) => [r.key as string, r.value as string]));
  const text = (key: string, fallback: string) => v.get(key)?.trim() || fallback;
  const fee = (key: string, fallback: number) => {
    const n = Number(v.get(key));
    return v.get(key)?.trim() && Number.isFinite(n) && n >= 0 ? n : fallback;
  };

  return {
    whatsappNumber: text("whatsapp_number", defaultSettings.whatsappNumber),
    contactEmail: text("contact_email", defaultSettings.contactEmail),
    instagramHandle: v.get("instagram_handle")?.trim() ?? "",
    openingHours: v.get("opening_hours")?.trim() ?? "",
    pickupAddress: text("pickup_address", defaultSettings.pickupAddress),
    deliveryFeeMakurdi: fee("delivery_fee_makurdi", defaultSettings.deliveryFeeMakurdi),
    deliveryFeeNationwide: fee("delivery_fee_nationwide", defaultSettings.deliveryFeeNationwide),
    legalName: v.get("legal_business_name")?.trim() ?? "",
  };
}

// The year changes once a year, so remembering it for a day is fine.
export async function getCurrentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export { formatNaira } from "@/lib/shop";

export { whatsappLink } from "@/lib/shop";

export function instagramUrl(handle: string) {
  return /^https?:\/\//i.test(handle) ? handle : `https://instagram.com/${handle.replace(/^@/, "")}`;
}
