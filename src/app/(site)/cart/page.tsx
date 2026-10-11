import Link from "next/link";

export const metadata = {
  title: "Cart | Tapvane",
  robots: { index: false },
};

// Temporary page. The real cart (items, previews, checkout button) is built in Stages 7 and 8.
export default function CartPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="font-display text-3xl text-ivory">Your cart is empty</h1>
      <Link href="/packages" className="flex min-h-12 items-center justify-center rounded-full bg-gold px-8 font-semibold text-onyx">
        Browse packages
      </Link>
    </main>
  );
}
