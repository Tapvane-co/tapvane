import CheckoutForm from "@/components/CheckoutForm";

export const metadata = {
  title: "Checkout | Tapvane",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <h1 className="font-display text-4xl text-ivory md:text-5xl">Checkout</h1>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </main>
  );
}
