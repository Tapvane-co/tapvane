import { NextResponse } from "next/server";
import { getCard } from "@/lib/cards";

// What the NFC chip opens. It sends the visitor to whichever profile the card is
// assigned to right now, so admin can reassign a card without rewriting the chip.
// (If that profile is switched off, the profile page itself shows "Profile unavailable".)
export async function GET(req: Request, ctx: RouteContext<"/c/[code]">) {
  const { code } = await ctx.params;
  const card = await getCard(code);
  const go = (path: string) => NextResponse.redirect(new URL(path, req.url), 307);

  if (!card || card.status === "disabled") return go("/card-unavailable");
  if (card.status === "unassigned" || !card.profileUsername) {
    return go(`/activate/${encodeURIComponent(card.code)}`);
  }
  return go(`/p/${card.profileUsername}`);
}
