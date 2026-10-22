import { getCard } from "@/lib/cards";

// What the NFC chip opens. It sends the visitor to whichever profile the card is
// assigned to right now, so admin can reassign a card without rewriting the chip.
// (If that profile is switched off, the profile page itself shows "Profile unavailable".)
export async function GET(_req: Request, ctx: RouteContext<"/c/[code]">) {
  const { code } = await ctx.params;
  const card = await getCard(code);
  // A relative redirect: the phone resolves it against the address it really visited. (Building a full address
  // from req.url sent phones to "localhost" on the live server, because the server sits behind Railway's gateway.)
  const go = (path: string) => new Response(null, { status: 307, headers: { Location: path } });

  if (!card || card.status === "disabled") return go("/card-unavailable");
  if (card.status === "unassigned" || !card.profileUsername) {
    return go(`/activate/${encodeURIComponent(card.code)}`);
  }
  return go(`/p/${card.profileUsername}`);
}
