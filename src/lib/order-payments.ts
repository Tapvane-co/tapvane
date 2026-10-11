import { orderConfirmationEmail, sendEmail } from "@/lib/email";
import type { DeliveryOption, Order, OrderLine, OrderStatus, PaymentMethod } from "@/lib/orders";
import { getSettings } from "@/lib/site";
import { createServiceClient } from "@/lib/supabase/admin";

// Server-only helpers for orders. Not callable from the browser.

/* eslint-disable @typescript-eslint/no-explicit-any */
export function rowToOrder(r: any): Order {
  return {
    id: r.id,
    orderNumber: Number(r.order_number),
    status: r.status as OrderStatus,
    paymentMethod: r.payment_method as PaymentMethod,
    items: (r.items ?? []) as OrderLine[],
    subtotal: r.subtotal,
    deliveryOption: r.delivery_option as DeliveryOption,
    deliveryFee: r.delivery_fee,
    total: r.total,
    phone: r.phone,
    address: r.address,
    city: r.city,
    state: r.state,
    proofUploaded: Boolean(r.proof_url),
    createdAt: r.created_at,
  };
}

// Marks an order paid once Paystack has confirmed the money. Safe to call twice (webhook + return page):
// the database only changes the order, takes stock, and lets us send the email the FIRST time.
export async function settlePaystackPayment(reference: string, amountKobo: number): Promise<"paid" | "error"> {
  const svc = createServiceClient();
  if (!svc) return "error";

  const { data, error } = await svc.rpc("mark_order_paid", { p_reference: reference, p_amount_kobo: amountKobo });
  const row = data?.[0];
  if (error || !row) {
    console.error("mark_order_paid failed:", error?.message);
    return "error";
  }

  if (row.o_changed) {
    const { data: full } = await svc.from("orders").select("*").eq("id", row.o_id).single();
    if (full) {
      const settings = await getSettings();
      const o = rowToOrder(full);
      await sendEmail(
        orderConfirmationEmail({
          orderNumber: o.orderNumber,
          email: full.email,
          name: full.customer_name,
          items: o.items,
          total: o.total,
          deliveryOption: o.deliveryOption,
          replyTo: settings.contactEmail,
        }),
      );
    }
  }
  return "paid";
}
