// "Site lock": while SITE_LOCK_PASSWORD is set, visitors only see the Coming soon page.
// Typing the password on that page sets a cookie that lets the founder in. Remove the variable to go public.

export const LOCK_COOKIE = "tapvane-lock";

// The cookie holds a fingerprint of the password, never the password itself.
export async function lockToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`${password}:tapvane-site-lock`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
