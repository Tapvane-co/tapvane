"use server";

import { updateTag } from "next/cache";
import { paymentReceivedEmail, sendEmail, statusUpdateEmail } from "@/lib/email";
import type { OrderStatus } from "@/lib/orders";
import { getSettings } from "@/lib/site";
import { createServerSupabase } from "@/lib/supabase/server";

// Everything the admin can change. Each action first checks the caller really is an admin, and the
// database repeats that check, so nobody else can use these even by calling them directly.

export type Result = { ok: true; message?: string; emailed?: boolean | null } | { ok: false; error: string };

async function adminClient() {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase.rpc("is_admin");
  return data === true ? supabase : null;
}

const notAdmin: Result = { ok: false, error: "This is for Tapvane admins only." };
const failed = (what: string): Result => ({ ok: false, error: `We could not ${what}. Please try again.` });
const isInt = (n: unknown, min: number, max: number): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= min && n <= max;
const HEX = /^#[0-9A-Fa-f]{6}$/;

/* ---------- Orders ---------- */

const statuses: OrderStatus[] = [
  "awaiting_payment", "awaiting_confirmation", "paid", "in_production",
  "ready_for_pickup", "shipped", "delivered", "cancelled",
];

// Changes an order's status, then emails the customer (CONTENT.md section 10) if emails are set up.
export async function changeOrderStatus(orderNumber: number, status: OrderStatus): Promise<Result> {
  const supabase = await adminClient();
  if (!supabase) return notAdmin;
  if (!statuses.includes(status)) return { ok: false, error: "That status is not valid." };

  const { data: row } = await supabase.from("orders").select("*").eq("order_number", orderNumber).maybeSingle();
  if (!row) return { ok: false, error: "We could not find that order." };
  const previous = row.status as OrderStatus;
  if (previous === status) return { ok: true, message: "Nothing to change.", emailed: null };

  const { error } = await supabase.rpc("admin_set_order_status", { p_order: row.id, p_status: status });
  if (error) return failed("change the status");

  const settings = await getSettings();
  const base = { orderNumber, email: row.email as string, name: row.customer_name as string, replyTo: settings.contactEmail };
  const wasUnpaid = previous === "awaiting_payment" || previous === "awaiting_confirmation";

  let mail = null;
  if (status === "paid" && wasUnpaid) {
    mail = paymentReceivedEmail(base);
  } else if (["in_production", "ready_for_pickup", "shipped", "delivered", "cancelled"].includes(status)) {
    mail = statusUpdateEmail({
      ...base,
      status,
      pickupAddress: settings.pickupAddress,
      hours: settings.openingHours,
      city: row.city,
    });
  }
  return { ok: true, emailed: mail ? await sendEmail(mail) : null };
}

/* ---------- Products and stock ---------- */

export async function saveProduct(input: {
  slug: string;
  name: string;
  price: number;
  cardsIncluded: number;
  isActive: boolean;
}): Promise<Result> {
  const supabase = await adminClient();
  if (!supabase) return notAdmin;
  const name = String(input.name ?? "").trim();
  if (!name || name.length > 40) return { ok: false, error: "Please enter a name (up to 40 letters)." };
  if (!isInt(input.price, 0, 100_000_000)) return { ok: false, error: "Please enter the price as a whole number of Naira." };
  if (!isInt(input.cardsIncluded, 1, 1000)) return { ok: false, error: "Cards included must be a whole number, 1 or more." };

  const { error } = await supabase
    .from("products")
    .update({ name, price: input.price, cards_included: input.cardsIncluded, is_active: Boolean(input.isActive) })
    .eq("slug", input.slug);
  if (error) return failed("save that package");
  updateTag("products");
  updateTag("shop");
  return { ok: true, message: "Saved. The website now shows the new price." };
}

export async function saveStock(
  rows: { itemType: "pvc" | "premium" | "tag"; quantity: number | null; lowThreshold: number }[],
): Promise<Result> {
  const supabase = await adminClient();
  if (!supabase) return notAdmin;
  for (const r of rows) {
    if (!["pvc", "premium", "tag"].includes(r.itemType)) return { ok: false, error: "That item is not valid." };
    if (r.quantity !== null && !isInt(r.quantity, 0, 1_000_000)) return { ok: false, error: "Stock must be a whole number (or left blank)." };
    if (!isInt(r.lowThreshold, 0, 1_000_000)) return { ok: false, error: "The 'few left' number must be a whole number." };
  }
  for (const r of rows) {
    const { error } = await supabase
      .from("stock")
      .update({ quantity: r.quantity, low_threshold: r.lowThreshold })
      .eq("item_type", r.itemType);
    if (error) return failed("save the stock");
  }
  updateTag("shop");
  return { ok: true, message: "Stock saved." };
}

/* ---------- Card templates and colours ---------- */

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "item";

export async function saveTemplate(input: {
  id?: string;
  name: string;
  layout: string;
  tier: string;
  isActive: boolean;
  sortOrder: number;
}): Promise<Result> {
  const supabase = await adminClient();
  if (!supabase) return notAdmin;
  const name = String(input.name ?? "").trim();
  if (!name || name.length > 40) return { ok: false, error: "Please enter a name (up to 40 letters)." };
  if (!["classic", "centred", "monogram"].includes(input.layout)) return { ok: false, error: "Please choose a layout." };
  if (!["standard", "premium"].includes(input.tier)) return { ok: false, error: "Please choose standard or premium." };
  if (!isInt(input.sortOrder, 0, 1000)) return { ok: false, error: "Order must be a whole number." };

  const fields = { name, layout: input.layout, tier: input.tier, is_active: Boolean(input.isActive), sort_order: input.sortOrder };
  if (input.id) {
    const { error } = await supabase.from("card_templates").update(fields).eq("id", input.id);
    if (error) return failed("save that template");
  } else {
    // The short name used inside carts and orders. It never changes after the template is made.
    let slug = slugify(name);
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await supabase.from("card_templates").insert({ ...fields, slug });
      if (!error) break;
      if (error.code !== "23505" || attempt === 2) return failed("add that template");
      slug = `${slugify(name).slice(0, 24)}-${Math.random().toString(36).slice(2, 6)}`;
    }
  }
  updateTag("shop");
  return { ok: true, message: "Saved." };
}

export async function saveColour(input: {
  id?: string;
  name: string;
  frontBg: string;
  frontText: string;
  accent: string;
  backBg: string;
  backText: string;
  isActive: boolean;
  sortOrder: number;
}): Promise<Result> {
  const supabase = await adminClient();
  if (!supabase) return notAdmin;
  const name = String(input.name ?? "").trim();
  if (!name || name.length > 40) return { ok: false, error: "Please enter a name (up to 40 letters)." };
  for (const c of [input.frontBg, input.frontText, input.accent, input.backBg, input.backText]) {
    if (!HEX.test(c)) return { ok: false, error: "Colours must look like #C9A34E (a # and six letters or numbers)." };
  }
  if (!isInt(input.sortOrder, 0, 1000)) return { ok: false, error: "Order must be a whole number." };

  const fields = {
    name,
    front_bg: input.frontBg.toUpperCase(),
    front_text: input.frontText.toUpperCase(),
    accent: input.accent.toUpperCase(),
    back_bg: input.backBg.toUpperCase(),
    back_text: input.backText.toUpperCase(),
    is_active: Boolean(input.isActive),
    sort_order: input.sortOrder,
  };
  if (input.id) {
    const { error } = await supabase.from("card_colours").update(fields).eq("id", input.id);
    if (error) return failed("save that colour");
  } else {
    let slug = slugify(name);
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await supabase.from("card_colours").insert({ ...fields, slug });
      if (!error) break;
      if (error.code !== "23505" || attempt === 2) return failed("add that colour");
      slug = `${slugify(name).slice(0, 24)}-${Math.random().toString(36).slice(2, 6)}`;
    }
  }
  updateTag("shop");
  return { ok: true, message: "Saved." };
}

/* ---------- Settings ---------- */

const settingKeys = [
  "whatsapp_number", "contact_email", "instagram_handle", "opening_hours", "pickup_address",
  "delivery_fee_makurdi", "delivery_fee_nationwide", "bank_name", "bank_account_name", "bank_account_number",
] as const;

export async function saveSettings(values: Record<string, string>): Promise<Result> {
  const supabase = await adminClient();
  if (!supabase) return notAdmin;

  const v: Record<string, string> = {};
  for (const key of settingKeys) v[key] = String(values[key] ?? "").trim();

  if (v.whatsapp_number.replace(/\D/g, "").length < 10) return { ok: false, error: "Please enter a WhatsApp number with the country code, like +234 902 591 8252." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.contact_email)) return { ok: false, error: "Please enter a valid contact email." };
  if (!v.pickup_address) return { ok: false, error: "Please enter the pickup address." };
  for (const key of ["delivery_fee_makurdi", "delivery_fee_nationwide"]) {
    if (!/^[0-9]{1,7}$/.test(v[key])) return { ok: false, error: "Delivery fees must be whole numbers of Naira (0 for free)." };
  }
  const bankFilled = [v.bank_name, v.bank_account_name, v.bank_account_number].filter(Boolean).length;
  if (bankFilled !== 0 && bankFilled !== 3) return { ok: false, error: "Please fill in all three bank details, or leave all three blank." };
  if (v.bank_account_number && !/^[0-9 ]{6,20}$/.test(v.bank_account_number)) return { ok: false, error: "The account number should be digits only." };
  if (v.instagram_handle.length > 100 || v.opening_hours.length > 200 || v.pickup_address.length > 300) {
    return { ok: false, error: "One of the entries is too long." };
  }

  const { error } = await supabase.from("settings").upsert(settingKeys.map((key) => ({ key, value: v[key] })), { onConflict: "key" });
  if (error) return failed("save the settings");
  updateTag("settings");
  return { ok: true, message: "Settings saved. The whole website now uses them." };
}
