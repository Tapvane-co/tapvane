import Link from "next/link";

export const metadata = {
  title: "Checkout | Tapvane",
  robots: { index: false },
};

// Temporary page. The real checkout (delivery, Paystack, bank transfer) is built in Stage 8.
export default function CheckoutPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="font-display text-3xl text-ivory">Checkout</h1>
      <p className="text-muted">Online checkout is coming soon. To order now, chat with us on WhatsApp.</p>
      <Link href="/contact" className="flex min-h-12 items-center justify-center rounded-full bg-gold px-8 font-semibold text-onyx">
        Contact us
      </Link>
    </main>
  );
}
