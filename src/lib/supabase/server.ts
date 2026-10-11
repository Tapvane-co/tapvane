import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase connection for server code that acts AS the signed-in customer (it reads their login cookie).
// What they may see or do is still limited by the database rules.
export async function createServerSupabase() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a place that can't set cookies; the login will refresh on the next request.
        }
      },
    },
  });
}
