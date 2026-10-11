import { Suspense } from "react";
import { SignupForm } from "@/components/AuthForms";

export const metadata = { title: "Create account | Tapvane" };

async function Signup({ searchParams }: { searchParams: PageProps<"/signup">["searchParams"] }) {
  const q = await searchParams;
  return <SignupForm next={Array.isArray(q.next) ? q.next[0] : q.next} />;
}

export default function Page(props: PageProps<"/signup">) {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <Signup searchParams={props.searchParams} />
    </Suspense>
  );
}
