import { Suspense } from "react";
import { LoginForm } from "@/components/AuthForms";

export const metadata = { title: "Log in | Tapvane" };

// "?next=/checkout" sends the customer back to where they were going after logging in.
async function Login({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const q = await searchParams;
  return <LoginForm next={Array.isArray(q.next) ? q.next[0] : q.next} />;
}

export default function Page(props: PageProps<"/login">) {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <Login searchParams={props.searchParams} />
    </Suspense>
  );
}
