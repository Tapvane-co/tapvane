import { Suspense } from "react";
import OrderView from "@/components/OrderView";

export const metadata = { title: "Your order | Tapvane", robots: { index: false } };

async function Confirmation({
  params,
  searchParams,
}: {
  params: PageProps<"/checkout/confirmation/[number]">["params"];
  searchParams: PageProps<"/checkout/confirmation/[number]">["searchParams"];
}) {
  const { number } = await params;
  const q = await searchParams;
  const ref = Array.isArray(q.reference) ? q.reference[0] : q.reference;
  const n = Number(number);
  if (!Number.isInteger(n) || n <= 0) return <p className="text-muted">We could not find that order.</p>;
  return <OrderView number={n} thankYou reference={ref ?? null} />;
}

export default function ConfirmationPage(props: PageProps<"/checkout/confirmation/[number]">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Confirmation params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
