"use server";

import { orderConfirmationEmail, sendEmail } from "@/lib/email";
import { settlePaystackPayment } from "@/lib/order-payments";
import { rowToOrder, type DeliveryOption, type Order, type OrderStatus, type PaymentMethod } from "@/lib/orders";
import { initializeTransaction, paystackEnabled, verifyTransaction } from "@/lib/paystack";
import type { CartItem, ShopData } from "@/lib/shop";
import { getShopData } from "@/lib/shop-data";
import { getSettings } from "@/lib/site";
import { createServerSupabase } from "@/lib/supabase/server";

// Everything that must be decided by the server during checkout. Prices, stock and payment status
// are never taken from the browser: the database works them out and Paystack confirms the money.

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export type CheckoutContext = {
  signedIn: boolean;
  email: string;
  shop: ShopData;
  deliveryFeeMakurdi: number;
  deliveryFeeNationwide: number;
  pickupAddress: string;
  whatsappNumber: string;
  bank: { name: string; accountName: string; accountNumber: string } | null;
  paystack: boolean;
};

// The database only shows bank details to signed-in customers, and they must all be filled in.
async function loadBank(supabase: Awaited<ReturnType<typeof createServerSupabase>>): Promise<CheckoutContext["bank"]> {
  const { data: rows } = await supabase.from("settings").select("key, value").like("key", "bank_%");
  const v = new Map((rows ?? []).map((r) => [r.key as string, String(r.value ?? "").trim()]));
  const name = v.get("bank_name");
  const accountName = v.get("bank_account_name");
  const accountNumber = v.get("bank_account_number");
  return name && accountName && accountNumber ? { name, accountName, accountNumber } : null;
}

export async function getCheckoutContext(): Promise<CheckoutContext> {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const [shop, settings] = await Promise.all([getShopData(), getSettings()]);
  const bank = auth.user ? await loadBank(supabase) : null;

  return {
    signedIn: Boolean(auth.user),
    email: auth.user?.email ?? "",
    shop,
    deliveryFeeMakurdi: settings.deliveryFeeMakurdi,
    deliveryFeeNationwide: settings.deliveryFeeNationwide,
    pickupAddress: settings.pickupAddress,
    whatsappNumber: settings.whatsappNumber,
    bank,
    paystack: paystackEnabled(),
  };
}

export type PlaceOrderInput = {
  items: CartItem[];
  delivery: DeliveryOption;
  phone: string;
  address: string;
  city: string;
  state: string;
  method: PaymentMethod;
};

export type PlaceOrderResult =
  | { ok: true; orderNumber: number; payUrl?: string }
  | { ok: false; error: string };

const friendlyErrors: Record<string, string> = {
  not_signed_in: "Please log in to place your order.",
  cart_invalid: "Your cart is empty or not valid. Please check it and try again.",
  delivery_invalid: "Please choose a delivery option.",
  method_invalid: "Please choose how you would like to pay.",
  phone_invalid: "Please enter a phone number we can reach you on.",
  address_missing: "Please enter your delivery address, town and state.",
  product_unavailable: "One of the items in your cart is no longer available. Please remove it and try again.",
  design_missing: "One of your cards is missing its design. Please design it again.",
  design_invalid: "A design or colour in your cart is no longer available. Please design the card again.",
  pro_only: "The matte finish and premium templates come with the Pro package.",
  card_details_missing: "One of your cards is missing a name. Please complete its details.",
  out_of_stock: "Sorry, one of the items in your cart is out of stock right now.",
};

function friendly(message: string | undefined) {
  const code = Object.keys(friendlyErrors).find((c) => message?.includes(c));
  return code ? friendlyErrors[code] : "We could not place your order. Please try again.";
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (input.method === "paystack" && !paystackEnabled()) {
    return { ok: false, error: "Online payment is not available yet. Please pay by bank transfer." };
  }

  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: friendlyErrors.not_signed_in };

  // Only what was CHOSEN is sent. The database looks up every price itself.
  const items = (Array.isArray(input.items) ? input.items : []).map((i) => ({
    slug: i.slug,
    quantity: i.quantity,
    design: i.design,
  }));

  const { data, error } = await supabase.rpc("create_order", {
    p_items: items,
    p_delivery: input.delivery,
    p_phone: input.phone,
    p_address: input.address,
    p_city: input.city,
    p_state: input.state,
    p_method: input.method,
  });
  const created = data?.[0];
  if (error || !created) return { ok: false, error: friendly(error?.message) };

  const orderNumber = Number(created.o_number);
  const { data: row } = await supabase.from("orders").select("*").eq("id", created.o_id).single();
  const order = row ? rowToOrder(row) : null;

  if (input.method === "transfer") {
    if (order && row) {
      const settings = await getSettings();
      await sendEmail(
        orderConfirmationEmail({
          orderNumber,
          email: row.email,
          name: row.customer_name,
          items: order.items,
          total: order.total,
          deliveryOption: order.deliveryOption,
          replyTo: settings.contactEmail,
        }),
      );
    }
    return { ok: true, orderNumber };
  }

  // Paystack: send the customer to Paystack's payment page. If that fails, the order still exists
  // and they can press "Pay now" on the order page.
  try {
    const payUrl = await initializeTransaction({
      email: auth.user.email ?? row?.email ?? "",
      amountNaira: created.o_total,
      reference: row?.paystack_reference,
      callbackUrl: `${siteUrl()}/checkout/confirmation/${orderNumber}`,
      orderNumber,
    });
    return { ok: true, orderNumber, payUrl };
  } catch (e) {
    console.error(e);
    return { ok: true, orderNumber };
  }
}

// "Pay now" on an unpaid Paystack order.
export async function startPayment(orderNumber: number): Promise<{ ok: true; payUrl: string } | { ok: false; error: string }> {
  if (!paystackEnabled()) return { ok: false, error: "Online payment is not available yet." };
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: friendlyErrors.not_signed_in };

  const { data: row } = await supabase.from("orders").select("*").eq("order_number", orderNumber).maybeSingle();
  if (!row || row.payment_method !== "paystack" || row.status !== "awaiting_payment") {
    return { ok: false, error: "This order cannot be paid online." };
  }
  const { data: reference, error } = await supabase.rpc("refresh_payment_reference", { p_order: row.id });
  if (error || !reference) return { ok: false, error: "We could not start the payment. Please try again." };

  try {
    const payUrl = await initializeTransaction({
      email: auth.user.email ?? row.email,
      amountNaira: row.total,
      reference,
      callbackUrl: `${siteUrl()}/checkout/confirmation/${orderNumber}`,
      orderNumber,
    });
    return { ok: true, payUrl };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "We could not reach Paystack. Please try again in a moment." };
  }
}

// When the customer comes back from Paystack, ask Paystack directly whether the payment went through.
// (Paystack's webhook also does this; whichever arrives first wins, and the database makes it safe.)
export async function verifyPayment(orderNumber: number): Promise<OrderStatus | null> {
  const supabase = await createServerSupabase();
  const { data: row } = await supabase.from("orders").select("*").eq("order_number", orderNumber).maybeSingle();
  if (!row) return null;
  if (row.status !== "awaiting_payment" || row.payment_method !== "paystack" || !row.paystack_reference || !paystackEnabled()) {
    return row.status as OrderStatus;
  }
  try {
    const result = await verifyTransaction(row.paystack_reference);
    if (result.paid && result.currency === "NGN") {
      await settlePaystackPayment(row.paystack_reference, result.amountKobo);
      const { data: again } = await supabase.from("orders").select("status").eq("id", row.id).single();
      return (again?.status ?? row.status) as OrderStatus;
    }
  } catch (e) {
    console.error(e);
  }
  return row.status as OrderStatus;
}

export async function getMyOrder(orderNumber: number): Promise<Order | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("orders").select("*").eq("order_number", orderNumber).maybeSingle();
  return data ? rowToOrder(data) : null;
}

export async function getMyOrders(): Promise<Order[] | null> {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
  return (data ?? []).map(rowToOrder);
}

// After the browser has uploaded the screenshot to private storage, record where it is.
export async function recordTransferProof(orderNumber: number, path: string): Promise<{ ok: boolean }> {
  const supabase = await createServerSupabase();
  const { data: row } = await supabase.from("orders").select("id").eq("order_number", orderNumber).maybeSingle();
  if (!row) return { ok: false };
  const { error } = await supabase.rpc("submit_transfer_proof", { p_order: row.id, p_path: path });
  return { ok: !error };
}

export async function getOrderContact() {
  const s = await getSettings();
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  return {
    whatsappNumber: s.whatsappNumber,
    pickupAddress: s.pickupAddress,
    userId: auth.user?.id ?? "",
    bank: auth.user ? await loadBank(supabase) : null,
    paystack: paystackEnabled(),
    emails: Boolean(process.env.RESEND_API_KEY),
  };
}
