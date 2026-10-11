import { Suspense } from "react";
import AdminOrderPrint from "@/components/AdminOrderPrint";

async function Sheet({ params }: { params: PageProps<"/admin/orders/[number]/print">["params"] }) {
  const { number } = await params;
  const n = Number(number);
  return Number.isInteger(n) && n > 0 ? <AdminOrderPrint number={n} /> : <p className="text-muted">We could not find that order.</p>;
}

export default function Page(props: PageProps<"/admin/orders/[number]/print">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <Sheet params={props.params} />
    </Suspense>
  );
}
