// Shared shop types and rules. No server code in here, so the browser can use it too.

export type ItemType = "pvc" | "premium" | "tag";
export type Finish = "standard" | "matte";
export type CardLayout = "classic" | "centred" | "monogram";

export type Product = {
  slug: string;
  name: string;
  type: "basic" | "pro" | "business" | "tag";
  itemType: ItemType;
  cardsIncluded: number;
  price: number;
};

export type CardTemplate = { slug: string; name: string; layout: CardLayout; tier: "standard" | "premium" };

export type CardColours = {
  slug: string;
  name: string;
  frontBg: string;
  frontText: string;
  accent: string;
  backBg: string;
  backText: string;
};

export type StockRow = { itemType: ItemType; quantity: number | null; lowThreshold: number };

export type ShopData = {
  products: Product[] | null; // null = prices could not be loaded
  templates: CardTemplate[];
  colours: CardColours[];
  stock: StockRow[];
};

// What is printed on one card.
export type CardText = { name: string; title: string; company: string };

export const LIMITS = { name: 26, title: 24, company: 24 } as const;

export type CartItem = {
  id: string;
  slug: string; // the product, e.g. "pro" or "business-5"
  quantity: number;
  design?: {
    template: string;
    colour: string;
    finish: Finish;
    cards: CardText[];
    detailsLater: boolean;
  };
};

export const emptyCard: CardText = { name: "", title: "", company: "" };

export function formatNaira(amount: number) {
  return "₦" + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Turns "+234 902 591 8252" into a WhatsApp link, with an optional ready-typed message.
export function whatsappLink(number: string, message?: string) {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

// Only the Pro package unlocks the matte finish and premium designs.
export const isPro = (p: Pick<Product, "type">) => p.type === "pro";

export type StockStatus = "ok" | "few" | "out";

// How many physical items of each kind a cart would use up.
export function unitsUsed(items: CartItem[], products: Product[]) {
  const used: Record<ItemType, number> = { pvc: 0, premium: 0, tag: 0 };
  for (const i of items) {
    const p = products.find((x) => x.slug === i.slug);
    if (p) used[p.itemType] += p.cardsIncluded * i.quantity;
  }
  return used;
}

// Is there enough stock to add `qty` more of this product, given what is already in the cart?
export function stockStatus(
  stock: StockRow[],
  product: Product,
  alreadyInCart: Record<ItemType, number> = { pvc: 0, premium: 0, tag: 0 },
  qty = 1,
): StockStatus {
  const row = stock.find((s) => s.itemType === product.itemType);
  if (!row || row.quantity === null) return "ok"; // not counting stock yet
  const remaining = row.quantity - alreadyInCart[product.itemType];
  if (remaining < product.cardsIncluded * qty) return "out";
  return row.quantity <= row.lowThreshold ? "few" : "ok";
}

// Keeps whatever is read from the browser's storage safe to use (a visitor could edit it by hand).
export function parseCart(raw: string): CartItem[] {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const items: CartItem[] = [];
    for (const d of data) {
      if (!d || typeof d !== "object") continue;
      const o = d as Record<string, unknown>;
      if (typeof o.id !== "string" || typeof o.slug !== "string") continue;
      const quantity = Math.min(99, Math.max(1, Math.floor(Number(o.quantity) || 1)));
      const item: CartItem = { id: o.id, slug: o.slug, quantity };
      const dz = o.design as Record<string, unknown> | undefined;
      if (dz && typeof dz === "object") {
        const cards = Array.isArray(dz.cards)
          ? dz.cards.map((c) => {
              const t = (c ?? {}) as Record<string, unknown>;
              return {
                name: String(t.name ?? "").slice(0, LIMITS.name),
                title: String(t.title ?? "").slice(0, LIMITS.title),
                company: String(t.company ?? "").slice(0, LIMITS.company),
              };
            })
          : [];
        item.design = {
          template: String(dz.template ?? ""),
          colour: String(dz.colour ?? ""),
          finish: dz.finish === "matte" ? "matte" : "standard",
          cards,
          detailsLater: dz.detailsLater === true,
        };
      }
      items.push(item);
    }
    return items;
  } catch {
    return [];
  }
}
