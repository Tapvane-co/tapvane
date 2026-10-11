import { deliveryLabel, orderRef, statusLabel, type DeliveryOption, type OrderLine, type OrderStatus } from "@/lib/orders";
import { formatNaira } from "@/lib/shop";

// Automatic emails (PRD 7.9), sent with Resend. If RESEND_API_KEY is not set, nothing is sent and
// the site carries on normally. Until tapvane.com is verified with Resend, set EMAIL_FROM to
// "Tapvane <onboarding@resend.dev>" (Resend then only delivers to your own Resend account email).

type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string };

export async function sendEmail(mail: Mail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !mail.to) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Tapvane <onboarding@resend.dev>",
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        reply_to: mail.replyTo,
      }),
      cache: "no-store",
    });
    if (!res.ok) console.error("Email not sent:", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (e) {
    console.error("Email not sent:", e);
    return false;
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function wrap(bodyHtml: string, button?: { label: string; url: string }) {
  return `<div style="background:#0B0B0C;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#1C1B19;border:1px solid #3A342A;border-radius:16px;padding:32px;color:#EDE6D6;">
    <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:18px;letter-spacing:6px;color:#C9A34E;">TAPVANE</p>
    ${bodyHtml}
    ${button ? `<p style="margin:28px 0 0;"><a href="${esc(button.url)}" style="background:#C9A34E;color:#0B0B0C;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold;display:inline-block;">${esc(button.label)}</a></p>` : ""}
  </div></div>`;
}

const firstName = (name: string) => (name.trim().split(/\s+/)[0] || "there");
const site = () => process.env.NEXT_PUBLIC_SITE_URL || "https://tapvane.com";

function packageSummary(items: OrderLine[]) {
  return items.map((i) => (i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name)).join(", ");
}

type OrderForMail = {
  orderNumber: number;
  email: string;
  name: string;
  items: OrderLine[];
  total: number;
  deliveryOption: DeliveryOption;
  replyTo?: string;
};

// CONTENT.md "Order confirmation". Also shows the 5-7 business day time (PRD section 5).
export function orderConfirmationEmail(o: OrderForMail): Mail {
  const dashboard = `${site()}/dashboard/orders/${o.orderNumber}`;
  const n = firstName(o.name);
  const line = `Package: ${packageSummary(o.items)} · Total: ${formatNaira(o.total)} · Delivery: ${deliveryLabel[o.deliveryOption]}`;
  return {
    to: o.email,
    replyTo: o.replyTo,
    subject: `Your Tapvane order ${orderRef(o.orderNumber)} is confirmed`,
    text: `Hi ${n}, thanks for your order! ${line}. Your order is ready within 5–7 business days after payment is confirmed. We'll email you as your order moves through production. In the meantime, set up your profile: ${dashboard}`,
    html: wrap(
      `<p>Hi ${esc(n)}, thanks for your order!</p>
       <p style="color:#A79F92;">${esc(line)}</p>
       <p>Your order is ready within 5–7 business days after payment is confirmed. We'll email you as your order moves through production. In the meantime, set up your profile:</p>`,
      { label: "Set up my profile", url: dashboard },
    ),
  };
}

// CONTENT.md "Payment confirmed (bank transfer)".
export function paymentReceivedEmail(o: Pick<OrderForMail, "orderNumber" | "email" | "name" | "replyTo">): Mail {
  const n = firstName(o.name);
  return {
    to: o.email,
    replyTo: o.replyTo,
    subject: `Payment received for order ${orderRef(o.orderNumber)}`,
    text: `Hi ${n}, we've received your payment. Your Tapvane card is now in production.`,
    html: wrap(`<p>Hi ${esc(n)}, we've received your payment. Your Tapvane card is now in production.</p>`),
  };
}

// CONTENT.md "Status update". Used by admin in Stage 9.
export function statusUpdateEmail(
  o: Pick<OrderForMail, "orderNumber" | "email" | "name" | "replyTo"> & { status: OrderStatus; pickupAddress?: string; hours?: string; city?: string | null },
): Mail {
  const n = firstName(o.name);
  const label = statusLabel[o.status];
  let extra = "";
  if (o.status === "ready_for_pickup" && o.pickupAddress) {
    extra = ` Pick it up at ${o.pickupAddress}${o.hours ? `, ${o.hours}` : ""}.`;
  } else if (o.status === "shipped") {
    extra = ` It's on its way${o.city ? ` to ${o.city}` : ""}.`;
  }
  return {
    to: o.email,
    replyTo: o.replyTo,
    subject: `Your Tapvane order is ${label.toLowerCase()}`,
    text: `Hi ${n}, your order ${orderRef(o.orderNumber)} is now ${label}.${extra}`,
    html: wrap(`<p>Hi ${esc(n)}, your order ${esc(orderRef(o.orderNumber))} is now <strong>${esc(label)}</strong>.${esc(extra)}</p>`),
  };
}
