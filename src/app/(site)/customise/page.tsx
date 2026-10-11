import { Suspense } from "react";
import Customiser from "@/components/Customiser";
import { getShopData } from "@/lib/shop-data";

export const metadata = {
  title: "Design your card | Tapvane",
  description: "Choose a template, colour and finish, add your name, and see your Tapvane card update as you go.",
};

async function Designer({ searchParams }: { searchParams: PageProps<"/customise">["searchParams"] }) {
  const { package: pkg } = await searchParams;
  const wanted = Array.isArray(pkg) ? pkg[0] : pkg;
  const data = await getShopData();
  return <Customiser data={data} initialPackage={wanted ?? "basic"} />;
}

export default function CustomisePage(props: PageProps<"/customise">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <h1 className="font-display text-4xl text-ivory md:text-5xl">Design your card</h1>
      <div className="mt-8">
        <Suspense fallback={<div className="h-96 rounded-2xl border border-line-subtle" />}>
          <Designer searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
