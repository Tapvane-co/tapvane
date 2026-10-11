import { Suspense } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import OrderView from "@/components/OrderView";

export const metadata = { title: "Order | Tapvane", robots: { index: false } };

async function Order({ params }: { params: PageProps<"/dashboard/orders/[number]">["params"] }) {
  const { number } = await params;
  const n = Number(number);
  return Number.isInteger(n) && n > 0 ? <OrderView number={n} /> : <p className="text-muted">We could not find that order.</p>;
}

export default function OrderPage(props: PageProps<"/dashboard/orders/[number]">) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <DashboardHeader active="orders" />
      <div className="mt-8">
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <Order params={props.params} />
        </Suspense>
      </div>
    </main>
  );
}
