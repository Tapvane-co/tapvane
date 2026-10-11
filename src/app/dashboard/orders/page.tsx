import DashboardHeader from "@/components/DashboardHeader";
import OrdersList from "@/components/OrdersList";

export const metadata = { title: "My orders | Tapvane", robots: { index: false } };

export default function OrdersPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <DashboardHeader active="orders" />
      <h1 className="mt-8 font-display text-3xl text-ivory">My orders</h1>
      <OrdersList />
    </main>
  );
}
