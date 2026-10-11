import { Suspense } from "react";
import AdminOrderDetail from "@/components/AdminOrderDetail";

async function Detail({ params }: { params: PageProps<"/admin/orders/[number]">["params"] }) {
  const { number } = await params;
  const n = Number(number);
  return Number.isInteger(n) && n > 0 ? <AdminOrderDetail number={n} /> : <p className="text-muted">We could not find that order.</p>;
}

export default function Page(props: PageProps<"/admin/orders/[number]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <Detail params={props.params} />
    </Suspense>
  );
}
