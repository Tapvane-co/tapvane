import { createClient } from "@supabase/supabase-js";

// SERVER ONLY. A connection with the secret service key, which skips the database rules.
// Used for exactly one job: marking an order as paid after Paystack has confirmed the payment.
// Never import this from a component that runs in the browser. Returns null if the key is not set.
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
