"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { inputClass } from "@/components/AuthForms";
import { createClient } from "@/lib/supabase/client";

// Lets a customer delete their own account (Nigeria Data Protection Act basics, PRD section 9).
// The login and profile are removed; past orders are kept for accounting, as the Privacy Policy says.
export default function DeleteAccount({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onDelete() {
    setBusy(true);
    setError("");
    // Remove the profile photo first (best effort), then the account itself.
    await supabase.storage.from("profile-photos").remove([`${userId}/avatar.jpg`]);
    const { error: rpcError } = await supabase.rpc("delete_my_account");
    if (rpcError) {
      setBusy(false);
      return setError(
        rpcError.message.includes("admin_cannot_delete")
          ? "Admin accounts cannot be deleted here."
          : "We could not delete your account. Please try again, or contact us.",
      );
    }
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <section className="mt-16 border-t border-line-subtle pt-8" aria-labelledby="delete-heading">
      <h2 id="delete-heading" className="font-display text-xl text-ivory">Delete my account</h2>
      {!open ? (
        <>
          <p className="mt-2 max-w-xl text-sm text-muted">You can delete your account and profile at any time.</p>
          <button type="button" onClick={() => setOpen(true)} className="mt-4 min-h-11 rounded-full border border-red-900 px-5 text-sm text-red-300 hover:border-red-400">
            Delete my account
          </button>
        </>
      ) : (
        <div className="mt-3 max-w-xl rounded-2xl border border-red-900 p-5">
          <p className="text-sm text-ivory">This cannot be undone. If you continue:</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted">
            <li>your login and your profile are deleted, and your profile link stops working;</li>
            <li>your card links stop opening your profile (we can link them to a new profile if you ask us);</li>
            <li>records of past orders are kept for accounting, as our Privacy Policy explains.</li>
          </ul>
          <label className="mt-4 flex flex-col gap-2 text-sm text-muted">
            Type DELETE to confirm
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className={inputClass} />
          </label>
          {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={onDelete} disabled={busy || typed.trim() !== "DELETE"} className="min-h-11 rounded-full bg-red-900 px-5 text-sm font-semibold text-ivory disabled:opacity-40">
              {busy ? "Deleting…" : "Permanently delete my account"}
            </button>
            <button type="button" onClick={() => { setOpen(false); setTyped(""); setError(""); }} disabled={busy} className="min-h-11 rounded-full border border-line px-5 text-sm text-ivory hover:border-gold">
              Keep my account
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
