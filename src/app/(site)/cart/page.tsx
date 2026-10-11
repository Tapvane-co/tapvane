import CartContents from "@/components/CartContents";

export const metadata = {
  title: "Cart | Tapvane",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="font-display text-4xl text-ivory md:text-5xl">Your cart</h1>
      <div className="mt-6 rounded-2xl border border-line bg-charcoal px-6 py-2">
        <CartContents />
      </div>
    </main>
  );
}
