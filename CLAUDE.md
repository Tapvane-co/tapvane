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
- WhatsApp (+234 911 399 1292) and email (tapvane.co@gmail.com) come from admin Settings, never typed into page code. Bank details likewise (entered by founder in admin, never in code).
- Paystack payments are verified server-side via webhook only.
- Secrets live only in `.env.local` (never committed). Supabase row-level security on all tables; admin routes restricted to admin accounts.

## Database & admin (Stage 5)
- SQL lives in `supabase/` and is run by the founder in Supabase SQL Editor: `schema.sql` (profiles, photos), then `stage5-admin.sql` (admins, cards, admin rules, `lookup_card`).
- Admin = a row in `public.admins`, checked by `public.is_admin()` inside row-level-security rules. No service-role key needed; never add one to client code. Founder adds themselves by SQL only.
- `/c/[code]` reads cards only through the `lookup_card(code)` function, so visitors can never list cards. Admin-made walk-in profiles have `owner_user_id` null.
- Test cards `TVN-DEMO1` / `TVN-NEW01` / `TVN-OFF01` and profile `demo` are built-in samples in `src/lib/`.

## Public site (Stage 6)
- Marketing pages live in `src/app/(site)/` and share the menu, footer and floating WhatsApp button (`SiteHeader`, `SiteFooter`, `WhatsAppButton`). Profiles, login, dashboard and admin sit outside it.
- Prices come from the `products` table and contact/delivery details from `settings` (`supabase/stage6-content.sql`), read through cached helpers in `src/lib/site.ts`. After an admin edit call `updateTag("products")` / `updateTag("settings")`. Dev-only stand-in prices exist for when the table is missing; in production a missing table shows "prices not available".
- Page copy is in `src/lib/content.ts` (from CONTENT.md). Instagram handle and opening hours are empty settings; the Contact page hides those lines until set.
- `/customise` and `/cart` are temporary placeholders until Stage 7. Cart is kept in browser storage under `tapvane-cart` (`src/lib/cart.ts`). `/terms` and `/privacy` are built in Stage 10.
- `CardMockup` (card front/back) and `TapDemo` (looping tap animation) are reusable components.

## Card designer & cart (Stage 7)
- SQL: `supabase/stage7-designer.sql` adds `card_templates`, `card_colours`, `stock` (blank stock quantity = not counting yet). Layout names are fixed in code (`classic`, `centred`, `monogram`); admin can add templates only using those layouts. Premium templates and the matte finish are Pro only.
- `src/lib/shop.ts` = shared types + rules (stock status, cart parsing/validation, `formatNaira`); `src/lib/shop-data.ts` = cached DB readers (tag `"shop"`, call `updateTag("shop")` after admin edits); `src/lib/shop-actions.ts` = server action the cart uses to get real prices/stock.
- Cart lives in browser storage (`src/lib/cart.ts`) and stores only choices (package slug, template/colour/finish slugs, card text) — never prices. Checkout (Stage 8) must re-read prices and stock from the database on the server and save a full snapshot of each design with the order. Card text limits: name 26, title 24, company 24.
- Cart icon opens a side panel (`CartDrawer`); `/cart` shows the same `CartContents`. `/checkout` is a temporary placeholder until Stage 8.

## Checkout & orders (Stage 8)
- SQL: `supabase/stage8-checkout.sql` adds `orders`, private `payment-proofs` storage, and these database functions: `create_order` (the ONLY way an order is made: it prices everything from the database, checks Pro-only rules and stock, snapshots the full design), `refresh_payment_reference`, `submit_transfer_proof`, `mark_order_paid` + `apply_stock_for_order` (callable ONLY by `service_role`). Customers can read their own orders but cannot insert/update them. Stock is taken when an order becomes Paid (once per order).
- Tested on an in-memory Postgres (PGlite) with 50 checks; re-run those if the SQL changes. Test scripts were kept outside the project.
- Server code: `src/lib/checkout-actions.ts` (server actions), `order-payments.ts` (settle payment + email once), `paystack.ts` (initialize/verify/webhook signature, kobo amounts), `email.ts` (Resend; no key = no email, nothing breaks), `supabase/server.ts` (acts as the signed-in customer), `supabase/admin.ts` (service key, server only, used only to mark orders paid).
- Paystack uses hosted payment page redirect (server-initialised, amount from the order), then verifies on return AND via webhook `/api/paystack/webhook` (signature checked). Needs `PAYSTACK_SECRET_KEY` + `SUPABASE_SERVICE_ROLE_KEY`; otherwise the Paystack option shows "coming soon". Bank transfer needs `bank_name`, `bank_account_name`, `bank_account_number` filled in `settings` (admin Settings in Stage 9); only signed-in customers can read them.
- Order numbers start at 1001 and show as `#1001`. Statuses and labels: `src/lib/orders.ts`. Status-change emails (`statusUpdateEmail`, `paymentReceivedEmail`) are written but get used by admin in Stage 9.
- Customer pages: `/checkout`, `/checkout/confirmation/[n]`, `/dashboard/orders`, `/dashboard/orders/[n]`. Login/signup accept `?next=/path` (same-site paths only).
- Known test-window quirk: when the browser pane is hidden, streamed pages can look stuck on "Loading…". It is not a site bug; bring the tab to the front.

## Admin shop management (Stage 9)
- SQL: `supabase/stage9-admin-orders.sql` adds `admin_set_order_status` (admin-only; records paid time, takes stock once when an order first counts as paid, restores it on cancel) and `restore_stock_for_order`. Run after stage 8. Tested on PGlite (23 checks).
- Admin pages: `/admin` (today's orders, transfers to confirm, paid-to-make, revenue, low stock), `/admin/orders` + `/[number]` (next-step buttons, manual status, proof of payment via signed URL, WhatsApp/call) + `/[number]/print` (production sheet at real card size, exact hex codes), `/admin/products` (prices, cards included, shown/hidden, stock counts; blank stock = not counting), `/admin/templates` (templates + colour sets with live previews), `/admin/settings` (contact, pickup, delivery fees, bank details).
- All writes go through `src/lib/admin-actions.ts` (server actions): each checks `is_admin` first, validates input, writes with the admin's own session (RLS), then calls `updateTag("products" | "shop" | "settings")` so the public site refreshes immediately. Status changes email the customer (payment received / status update). Server-action files may export only async functions.
- Admin action tests (43 checks, fake database) and PGlite SQL tests live outside the project in the session scratch folder; re-create them if admin-actions.ts or the SQL changes.
- `/admin/customers` from the PRD is not built; customers appear via Orders and Profiles.

## Polish (Stage 10)
- SQL: `supabase/stage10-polish.sql` adds the `legal_business_name` setting and `delete_my_account()` (customer self-delete: login + profile removed, active cards go back to "unassigned", orders KEPT with no login link; admins cannot use it). Tested on PGlite (12 checks). Dashboard has a "Delete my account" section (`DeleteAccount.tsx`).
- `/terms` and `/privacy` come from CONTENT.md sections 12-13 (drafts; founder must have a Nigerian lawyer review). Business name/email/WhatsApp are read from Settings; date is `LEGAL_UPDATED` in `src/lib/legal.ts` (update when wording changes). Deviations from the draft: cookies section also mentions the cart stored in the browser; rights section mentions self-service account deletion; retention says "for example 6 years".
- SEO/sharing: `metadataBase` from `NEXT_PUBLIC_SITE_URL` (MUST be https://tapvane.com in production), `robots.ts`, `sitemap.ts`, generated tab icon (`icon.tsx`, `apple-icon.tsx`; replace with final logo when ready), share-preview images (`opengraph-image.tsx` site-wide and `p/[username]/opengraph-image.tsx` for profiles), Organization JSON-LD on Home, FAQ JSON-LD on /faq, custom `not-found.tsx` / `error.tsx`, security headers in `next.config.ts` (no CSP yet).
- Speed lessons (Lighthouse mobile): CSS container-query units were very expensive when animated. `CardMockup` has a fixed-`width` mode (no container units) for small/animated uses; only the designer's live preview and admin use the responsive mode. `TapDemo` animates only while on screen and only `translate/rotate/opacity/scale`. Public header must not import the Supabase client (login state is read from the `sb-…-auth-token` cookie). Marketing links on profiles use `prefetch={false}`.
- Always run `npm run build` before launch tasks: dev mode hides production-only problems. Lighthouse and the SQL/server-action test scripts live in the session scratch folder, not the project.

## Email confirmation by code
- Sign-up and "email not confirmed" log-ins use a 6-digit code (`VerifyCodeForm` in `AuthForms.tsx`: auto-checks at the 6th digit, 60-second resend wait, `verifyOtp` / `resend` with type `signup`). It is OFF unless `NEXT_PUBLIC_EMAIL_CODE=on` (until then people are told about the link). Turn it on only after the Supabase **Confirm signup** email template contains `{{ .Token }}` (Supabase only lets you edit templates once custom SMTP is set up) (the link `{{ .ConfirmationURL }}` can stay too). Supabase's built-in email sender is limited to a few emails per hour for the whole project, so real delivery needs custom SMTP (Resend) once tapvane.com is verified. Password reset still uses a link.

## Site lock (pre-launch)
- While the Railway variable `SITE_LOCK_PASSWORD` is set, every page shows "Coming soon" (`src/app/locked/page.tsx`); the founder types the password under "Team access" to get a 30-day cookie (`src/proxy.ts`, `src/app/api/unlock/route.ts`, `src/lib/site-lock.ts`). Delete the variable (and redeploy) to go public. The Paystack webhook stays open. No code change is needed to lock or unlock; the password is a secret the founder types into Railway himself.

- Railway: the live project is **authentic-hope** (service `tapvane`), under the Railway account **benedictnongov@gmail.com** (GitHub `benedictnon`). A second account (tapvane.co@gmail.com / GitHub `Tapvane-co`) holds an empty project `refreshing-connection`; don't use it. The lock was switched on 2026-10-20 by adding `SITE_LOCK_PASSWORD` there.

- **Deploys come from a SECOND repo.** Railway (account benedictnongov@gmail.com / GitHub `benedictnon`) can only see `benedictnon/visionary-kleicha` (private), not `Tapvane-co/tapvane`. The code is therefore pushed to BOTH: `git push origin main` is set up with two push URLs (Tapvane-co/tapvane and benedictnon/visionary-kleicha). Railway's service Source = visionary-kleicha, branch main, auto-deploy on. `Tapvane-co` is a collaborator on that repo, and `benedictnon` on Tapvane-co/tapvane. NEVER reconnect Railway to a repo without checking its contents first (an empty Netlify starter once replaced the live site; fixed by Rollback on the previous deployment).

## QR code on the card back
- The back of every card carries a QR code for phones without NFC (`QrCode.tsx`, drawn as one SVG path via the `qrcode` package; light tile + dark modules so it scans on any colour set). It encodes the same address as the chip, `https://tapvane.com/c/CODE`. On the website and in the designer `CardMockup` shows a SAMPLE QR (`qrValue` default `https://tapvane.com`); only the production sheet (`AdminOrderPrint.tsx`) passes each card's real code. The sheet suggests the next free unassigned card codes (editable); the code printed in the QR must be the code written to that card's chip and assigned in Admin → Cards. Decoded and checked with jsQR.

## Stack
Next.js (App Router, TypeScript, `src/`) + Tailwind v4 + Supabase + Paystack + Resend + Railway (hosting).
Run locally: `npm run dev` then open http://localhost:3000. Next.js here is a newer version; check `node_modules/next/dist/docs/` before using unfamiliar APIs.
