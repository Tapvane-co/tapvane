import { NextResponse } from "next/server";
import { settlePaystackPayment } from "@/lib/order-payments";
import { isValidWebhookSignature } from "@/lib/paystack";

// Paystack calls this address when a payment succeeds. We only believe it if Paystack's signature
// matches (it is made with our secret key); the order is then marked Paid by the database, which
// also checks the amount. In the Paystack dashboard, set the webhook URL to:
//   https://tapvane.com/api/paystack/webhook
export async function POST(req: Request) {
  const raw = await req.text();
  if (!isValidWebhookSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string; amount?: number; currency?: string; status?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const d = event.data;
  if (event.event === "charge.success" && d?.status === "success" && d.currency === "NGN" && d.reference && typeof d.amount === "number") {
    const result = await settlePaystackPayment(d.reference, d.amount);
    // A failure here means we could not record it; Paystack will try again later if we answer with an error.
    if (result === "error") return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
