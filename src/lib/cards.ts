import { createPublicClient } from "@/lib/supabase/public";

// A card code is what's written on the chip: https://tapvane.com/c/<code>
export const CHIP_BASE_URL = "https://tapvane.com";

export type CardStatus = "unassigned" | "active" | "disabled";
export type CardType = "pvc" | "premium" | "tag";

export type Card = {
  code: string;
  status: CardStatus;
  profileUsername?: string; // set when status is "active"
};

// Three test cards that always exist, so the card links can be tried before any real card is made.
const sampleCards: Card[] = [
  { code: "TVN-DEMO1", status: "active", profileUsername: "demo" },
  { code: "TVN-NEW01", status: "unassigned" },
  { code: "TVN-OFF01", status: "disabled" },
];

export async function getCard(code: string): Promise<Card | null> {
  const wanted = code.trim().toUpperCase();
  const sample = sampleCards.find((c) => c.code === wanted);
  if (sample) return sample;
  if (!/^[A-Z0-9-]{6,20}$/.test(wanted)) return null;

  const { data, error } = await createPublicClient().rpc("lookup_card", { p_code: wanted });
  const row = data?.[0];
  if (error || !row) return null;
  return {
    code: row.card_code,
    status: row.status,
    profileUsername: row.username ?? undefined,
  };
}

export function sampleCardCodes() {
  return sampleCards.map((c) => c.code);
}

// Makes a new card code like TVN-7F3K9. Left out: 0, O, 1, I, L so codes are easy to read and type.
const CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export function generateCardCode() {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return "TVN-" + Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
}

export function chipUrl(code: string) {
  return `${CHIP_BASE_URL}/c/${code}`;
}
