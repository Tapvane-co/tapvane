import { cacheLife, cacheTag } from "next/cache";
import { getProducts } from "@/lib/site";
import type { CardColours, CardTemplate, ShopData, StockRow } from "@/lib/shop";
import { createPublicClient } from "@/lib/supabase/public";

// Card designs, colours and stock, read from the database and remembered for a short while.
// After an admin edit, call updateTag("shop") to refresh at once (Stage 9).

// Stand-ins used ONLY on the developer's computer, before the database file has been run.
const devOnlyTemplates: CardTemplate[] = [
  { slug: "classic", name: "Classic", layout: "classic", tier: "standard" },
  { slug: "centred", name: "Centred", layout: "centred", tier: "standard" },
  { slug: "monogram", name: "Monogram", layout: "monogram", tier: "premium" },
];
const devOnlyColours: CardColours[] = [
  { slug: "noir-gold", name: "Noir & Gold", frontBg: "#0B0B0C", frontText: "#EDE6D6", accent: "#C9A34E", backBg: "#C9A34E", backText: "#0B0B0C" },
  { slug: "ivory", name: "Ivory", frontBg: "#EDE6D6", frontText: "#0B0B0C", accent: "#8F6F26", backBg: "#0B0B0C", backText: "#C9A34E" },
  { slug: "midnight", name: "Midnight", frontBg: "#0F1B2D", frontText: "#EDE6D6", accent: "#C9A34E", backBg: "#C9A34E", backText: "#0F1B2D" },
  { slug: "forest", name: "Forest", frontBg: "#10261C", frontText: "#EDE6D6", accent: "#C9A34E", backBg: "#C9A34E", backText: "#10261C" },
];
const isDev = process.env.NODE_ENV !== "production";

export async function getTemplates(): Promise<CardTemplate[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("shop");

  const { data, error } = await createPublicClient()
    .from("card_templates")
    .select("slug, name, layout, tier")
    .eq("is_active", true)
    .order("sort_order");
  if (error || !data || data.length === 0) return isDev ? devOnlyTemplates : [];
  return data.map((r) => ({ slug: r.slug, name: r.name, layout: r.layout, tier: r.tier }));
}

export async function getColours(): Promise<CardColours[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("shop");

  const { data, error } = await createPublicClient()
    .from("card_colours")
    .select("slug, name, front_bg, front_text, accent, back_bg, back_text")
    .eq("is_active", true)
    .order("sort_order");
  if (error || !data || data.length === 0) return isDev ? devOnlyColours : [];
  return data.map((r) => ({
    slug: r.slug,
    name: r.name,
    frontBg: r.front_bg,
    frontText: r.front_text,
    accent: r.accent,
    backBg: r.back_bg,
    backText: r.back_text,
  }));
}

// If stock can't be read, ordering stays open rather than blocking every sale.
export async function getStock(): Promise<StockRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("shop");

  const { data, error } = await createPublicClient().from("stock").select("item_type, quantity, low_threshold");
  if (error || !data) return [];
  return data.map((r) => ({ itemType: r.item_type, quantity: r.quantity, lowThreshold: r.low_threshold }));
}

export async function getShopData(): Promise<ShopData> {
  const [products, templates, colours, stock] = await Promise.all([
    getProducts(),
    getTemplates(),
    getColours(),
    getStock(),
  ]);
  return { products, templates, colours, stock };
}
