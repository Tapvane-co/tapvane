// Order types and wording shared by the server and the browser.

export type OrderStatus =
  | "awaiting_payment"
  | "awaiting_confirmation"
  | "paid"
  | "in_production"
  | "ready_for_pickup"
  | "shipped"
  | "delivered"
  | "cancelled";

// Labels from CONTENT.md section 8.
export const statusLabel: Record<OrderStatus, string> = {
  awaiting_payment: "Awaiting payment",
  awaiting_confirmation: "Awaiting confirmation",
  paid: "Paid",
  in_production: "In production",
  ready_for_pickup: "Ready for pickup",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export type DeliveryOption = "pickup" | "makurdi" | "nationwide";
export type PaymentMethod = "paystack" | "transfer";

export const deliveryLabel: Record<DeliveryOption, string> = {
  pickup: "Pickup in Makurdi",
  makurdi: "Delivery within Makurdi",
  nationwide: "Delivery outside Makurdi",
};

export type OrderLine = {
  slug: string;
  name: string;
  type: string;
  item_type: string;
  cards_included: number;
  unit_price: number;
  quantity: number;
  line_total: number;
  design: {
    template: { slug: string; name: string; layout: "classic" | "centred" | "monogram" };
    colour: { slug: string; name: string; front_bg: string; front_text: string; accent: string; back_bg: string; back_text: string };
    finish: "standard" | "matte";
    details_later: boolean;
    cards: { name: string; title: string; company: string }[];
  } | null;
};

export type Order = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  items: OrderLine[];
  subtotal: number;
  deliveryOption: DeliveryOption;
  deliveryFee: number;
  total: number;
  phone: string;
  address: string | null;
  city: string | null;
  state: string | null;
  proofUploaded: boolean;
  createdAt: string;
};

export const orderRef = (n: number) => `#${n}`;

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
/* eslint-enable @typescript-eslint/no-explicit-any */

// A phone number as people type it (0803...) turned into a WhatsApp link.
export function phoneToWhatsapp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const full = digits.startsWith("0") ? "234" + digits.slice(1) : digits;
  return `https://wa.me/${full}`;
}

// Nigeria's 36 states and the FCT, for the delivery address.
export const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta",
  "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara",
];
