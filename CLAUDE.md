# Tapvane — notes for Claude Code

Tapvane sells NFC business cards/tags that open a digital profile. The site is both the shop and the profile platform. Full details: `PRD.md` (requirements) and `CONTENT.md` (exact website text).

## Working with the founder
- Founder is a complete beginner. Explain in simple words, decide technical details sensibly.
- Build in the stages of PRD Section 13. Stop after each stage, show how to view it, wait for approval.
- Ask before anything that costs money or can't be undone.
- `[PLACEHOLDER]` items need real values from the founder; ask when reached.
- Use CONTENT.md text exactly. Don't invent claims. No refund wording anywhere.

## Brand (Noir & Gold) — Tailwind names in `src/app/globals.css`
Onyx `#0B0B0C` (background) · Charcoal `#1C1B19` (panels) · Gold `#C9A34E` (accent) · Ivory `#EDE6D6` (text) · Stone `#8C857A` · Muted `#A79F92` · Border/line `#3A342A` (subtle `#2A2722`).
Fonts: Bodoni Moda (headings, names, wordmark → `font-display`), Manrope (body → `font-sans`).
Logo: "TAPVANE" Bodoni Moda, Gold, caps, ~0.3em spacing; tagline "TAP · SHARE · CONNECT". Keep it in `src/components/Logo.tsx`.
Primary button: Gold bg + Onyx text. Secondary: outlined, Ivory text. Min tap size 44px. Mobile-first.

## Prices (₦) — store in DB, editable by admin, never hard-code
Basic 18,000 · Pro 30,000 (matte, custom profile) · Business 5 = 80,000 · Business 10 = 150,000 (standard PVC, no matte) · NFC Tag 10,000.
Delivery: pickup free (Opp. Holy Ghost Catholic Church, Wadata, Makurdi) · within Makurdi 1,500 · outside 5,000. Ready 5–7 business days after payment confirmed.

## Key rules
- Chip stores `https://tapvane.com/c/[card-code]`, never the profile URL. `/c/` redirects to the assigned profile; admin can reassign.
- Profile page `/p/[username]`: "Cover & icons" layout (PRD 7.5). Must be fast and work without login.
- WhatsApp (+234 902 591 8252) and email (nfc.taply.hub@gmail.com) come from admin Settings, never typed into page code. Bank details likewise (entered by founder in admin, never in code).
- Paystack payments are verified server-side via webhook only.
- Secrets live only in `.env.local` (never committed). Supabase row-level security on all tables; admin routes restricted to admin accounts.

## Database & admin (Stage 5)
- SQL lives in `supabase/` and is run by the founder in Supabase SQL Editor: `schema.sql` (profiles, photos), then `stage5-admin.sql` (admins, cards, admin rules, `lookup_card`).
- Admin = a row in `public.admins`, checked by `public.is_admin()` inside row-level-security rules. No service-role key needed; never add one to client code. Founder adds themselves by SQL only.
- `/c/[code]` reads cards only through the `lookup_card(code)` function, so visitors can never list cards. Admin-made walk-in profiles have `owner_user_id` null.
- Test cards `TVN-DEMO1` / `TVN-NEW01` / `TVN-OFF01` and profile `demo` are built-in samples in `src/lib/`.

## Stack
Next.js (App Router, TypeScript, `src/`) + Tailwind v4 + Supabase + Paystack + Resend + Vercel.
Run locally: `npm run dev` then open http://localhost:3000. Next.js here is a newer version; check `node_modules/next/dist/docs/` before using unfamiliar APIs.
