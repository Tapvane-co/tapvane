import { createHmac, timingSafeEqual } from "node:crypto";

// Paystack, called from the server only. The amount always comes from the order in the database,
// never from the browser. Paystack is "on" only when BOTH secret keys are set in .env.local.
const API = "https://api.paystack.co";

export function paystackEnabled() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function secret() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Paystack is not set up");
  return key;
}

// Starts a payment and returns the Paystack page the customer should be sent to.
export async function initializeTransaction(args: {
  email: string;
  amountNaira: number;
  reference: string;
  callbackUrl: string;
  orderNumber: number;
}): Promise<string> {
  const res = await fetch(`${API}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: args.email,
      amount: Math.round(args.amountNaira * 100), // Paystack counts in kobo
      currency: "NGN",
      reference: args.reference,
      callback_url: args.callbackUrl,
      metadata: { order_number: args.orderNumber },
    }),
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.status || !json?.data?.authorization_url) {
    throw new Error("Paystack could not start the payment");
  }
  return json.data.authorization_url as string;
}

export type PaystackVerification = { paid: boolean; amountKobo: number; currency: string };

// Asks Paystack directly whether a payment really went through.
export async function verifyTransaction(reference: string): Promise<PaystackVerification> {
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret()}` },
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.status) return { paid: false, amountKobo: 0, currency: "" };
  return {
    paid: json.data?.status === "success",
    amountKobo: Number(json.data?.amount) || 0,
    currency: String(json.data?.currency ?? ""),
  };
}

// Checks that a webhook message really came from Paystack (it signs the body with our secret key).
export function isValidWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
