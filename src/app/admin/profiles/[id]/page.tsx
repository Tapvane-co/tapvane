import Link from "next/link";
import { Suspense } from "react";
import ProfileEditor from "@/components/ProfileEditor";

async function Editor({ params }: { params: PageProps<"/admin/profiles/[id]">["params"] }) {
  const { id } = await params;
  return (
    <>
      <Link href="/admin/profiles" className="mb-4 inline-block text-sm text-gold underline-offset-4 hover:underline">
        &larr; All profiles
      </Link>
      <ProfileEditor adminProfileId={id} />
    </>
  );
}

// "new" in the address means: create a profile for a walk-in customer.
export default function Page(props: PageProps<"/admin/profiles/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <Editor params={props.params} />
    </Suspense>
  );
}
