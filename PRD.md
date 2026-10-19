# Tapvane — Product Requirements Document (PRD)

**Version:** 2.0 (MVP): rebranded from TAPLY to **Tapvane**; domain tapvane.com secured
**Date:** 7 October 2026
**Owner:** Tapvane founder
**Target launch:** Under 2 weeks from start of build
**Status:** Ready to build

> **Note to Claude Code:** The founder is a beginner with no coding experience. Explain each step in simple words, make sensible technical decisions on their behalf, build in small testable stages (see Section 13), and ask before anything that costs money or can't be undone. Items marked `[PLACEHOLDER]` still need real values from the founder; ask for them when you reach that step.

---

## 1. Overview

Tapvane sells **NFC business cards and NFC tags** that open a **digital profile** when tapped on a phone. The website is both the **shop** (packages, card customiser, ordering, payment) and the **platform** that hosts every customer's digital profile.

**How the product works:**
1. A customer buys a Tapvane card or tag on the website.
2. They get a Tapvane account and a digital profile (name, contacts, socials, Save Contact button).
3. Tapvane writes a permanent link onto the NFC chip.
4. When anyone taps the card with their phone, the customer's profile opens instantly. No app needed.

**Brand:** Premium & sleek. Based in Makurdi, Benue State, selling across Nigeria.

## 2. Goals (MVP)

- Customers can browse packages, customise a card, and pay online (Paystack) or by bank transfer.
- Every customer gets a working, editable digital profile.
- The founder can manage orders, payments, profiles, card links, stock and prices from an admin dashboard without touching code.
- Profiles load fast on mobile data and look premium.
- Live on a real domain within 2 weeks.

**Out of scope for MVP (Phase 2, see Section 12):** tap analytics, gallery/services sections, metal cards, keychains, customer-uploaded artwork, instalment plans.

## 3. Target Customers

| Customer | What they want |
|---|---|
| **Individuals** (professionals, freelancers, creatives, students) | One smart card that shares all their contacts and socials in one tap |
| **Small businesses** (shops, salons, restaurants, service providers) | Cards for owner/staff and NFC tags for the counter or table that open their business profile and WhatsApp |

## 4. Products & Pricing

All prices in Naira (₦). Stored in the database and **editable by admin**, never hard-coded.

| Package | Price | Includes |
|---|---|---|
| **Basic** | ₦18,000 | 1 PVC NFC card + standard digital profile |
| **Pro** | ₦30,000 | 1 matte-finish NFC card + **custom** digital profile |
| **Business 5** | ₦80,000 | 5 NFC cards + digital profiles |
| **Business 10** | ₦150,000 | 10 NFC cards + digital profiles |
| **NFC Tag** | ₦10,000 | 1 NFC tag/sticker + digital profile |

**Package rules:**
- **Basic:** standard Tapvane templates and standard colours; standard profile layout with a choice of preset themes.
- **Pro:** unlocks the premium **matte finish** and a custom profile (custom accent colour, cover image, extra themes).
- **Business:** one profile per card. The buyer manages all their team's profiles from one dashboard. Business cards use the **standard PVC finish** and standard templates (the matte finish is Pro only).
- **Tags:** sold individually; quantity selector in cart. A tag opens a profile like a card (ideal for a business profile on a shop counter).

**Stock:** each product (PVC card, premium card, NFC tag) has a stock count managed by admin. Low stock shows "Few left"; zero stock shows "Out of stock" and blocks ordering.

## 5. Delivery

| Option | Fee |
|---|---|
| Pickup in Makurdi | Free. Pickup address: Opp. Holy Ghost Catholic Church, Wadata, Makurdi, Benue State |
| Delivery within Makurdi | ₦1,500 flat fee |
| Delivery outside Makurdi (nationwide) | ₦5,000 flat fee (optionally by state/region later) |

**Delivery time:** orders are ready within **5–7 business days** after payment is confirmed. Show this at checkout and in confirmation emails.

**Lost cards:** no replacement fee. Admin deactivates the lost card and links a new card to the same profile (see Section 7.6).

**Refunds:** Tapvane does not offer a refund policy. Do not add refund wording to the site.

Fees editable by admin. Customer chooses at checkout and enters a delivery address (except for pickup).

## 6. Site Map

**Public**
- `/` Home
- `/packages` Packages & pricing
- `/customise` Card customiser (step 1 of ordering)
- `/cart` Cart (also available as a side panel from the menu icon)
- `/checkout` Checkout
- `/how-it-works` How NFC works (simple explainer + video/GIF of a tap)
- `/faq` FAQ
- `/contact` Contact (WhatsApp-first)
- `/p/[username]` Public digital profile
- `/c/[card-code]` Card link (what's written on the chip; redirects to the assigned profile)
- `/login`, `/signup`, `/forgot-password`
- `/terms`, `/privacy`

**Customer (logged in)**
- `/dashboard` Overview, orders, order status
- `/dashboard/profile` Edit my profile
- `/dashboard/team` (Business buyers) Manage team profiles

**Admin (founder only)**
- `/admin` Overview (new orders, pending transfers, low stock)
- `/admin/orders`, `/admin/customers`, `/admin/profiles`, `/admin/cards`, `/admin/products`, `/admin/templates`, `/admin/settings`

## 7. Feature Requirements

### 7.1 Home page
- Hero: headline (suggested "Tap. Share. Connect."), short subline, card mockup visual, "Get your card" button.
- **Demo animation:** a looping phone mockup (built in code, no video file needed) showing: card tapped → profile opens → Save Contact → "Contact saved". Light on mobile data; respects "reduce motion". Also reused on `/how-it-works`. A real video can replace it later.
- **Top menu:** Home, Packages, How it works, FAQ, Contact, a **cart icon** (with item count), Log in, and a gold "Get your card" button.
- How it works: Buy → Customise → Tap.
- Package cards with prices (Pro marked "Most Popular").
- Section for small businesses (tags on counters, team cards).
- Demo: a sample profile visitors can open ("See a live profile").
- FAQ preview, floating **WhatsApp chat button** on every page.

### 7.2 Card customiser
- Customer selects a package, then customises:
  - **Template:** choose from Tapvane templates (admin can add/edit templates).
  - **Text on card:** name, job title, company (character limits so text fits).
  - **Colour/finish:** card colour; finish options are **Standard** (all packages) and **Matte** (Pro only). Matte is shown locked with a "Pro" badge for Basic and Business.
- **Live preview** of card front and back that updates as they type and choose.
- For Business packages: enter details for each card (5 or 10), or "add details later" from the dashboard.
- Customisation is saved with the order so the founder can print exactly what was designed.

### 7.3 Cart, checkout & payment
**Cart:** a cart icon in the top menu opens a side panel listing items (each with its card preview and customisation), quantity controls (tags and extra cards), remove buttons, subtotal and a "Checkout" button. The customiser's "Add to cart" button adds an item; one cart can hold several items (e.g. 1 Pro card + 3 tags) and is paid in one order. Cart is kept in the browser until checkout, and items can't be added if out of stock. Prices always come from the database.

1. Review cart and previews.
2. Create account or log in (email + password).
3. Choose delivery option and enter address/phone.
4. Choose payment:
   - **Paystack** (card, bank transfer, USSD). On successful payment, the order is marked **Paid** automatically (verified server-side via Paystack webhook, never trusted from the browser alone).
   - **Manual bank transfer:** show Tapvane bank details (entered by the founder in the admin Settings page; never written into code or this file), order marked **Awaiting confirmation**, customer can upload a payment screenshot and/or tap "Send proof on WhatsApp". Admin confirms and marks it **Paid**.
5. Confirmation page + confirmation email with order number and next steps.

### 7.4 Order statuses
`Awaiting payment` → `Awaiting confirmation` (transfer only) → `Paid` → `In production` → `Ready for pickup` / `Shipped` → `Delivered` (+ `Cancelled`).
Customer sees status in dashboard and gets an email on each change.

### 7.5 Digital profile (public page `/p/[username]`)

**Approved layout ("Cover & icons").** Build exactly this, top to bottom, mobile-first:

1. **Cover banner:** full width, about 150px tall, Charcoal `#1C1B19` background with a 1px Gold bottom border. Small "TAPVANE" wordmark top-left (Bodoni Moda, Gold, letter-spaced). Pro customers can replace the charcoal with their own cover image.
2. **Profile photo:** 96px circle, overlapping the bottom of the banner by half (left-aligned, 24px from edge), 3px Onyx border with a thin Gold outline. Shows initials in Gold if no photo is uploaded.
3. **Name:** Bodoni Moda, about 26px, Ivory.
4. **Job title · Company:** Manrope 13px, muted (`#A79F92`).
5. **Short bio:** max 2 lines (character limit ~120), muted.
6. **Icon button grid:** 4 columns of round outlined buttons (54px circle, `#3A342A` border, Gold line icon) with a small label underneath: **Call, WhatsApp, Email, Instagram, Website, LinkedIn, Location, Share**. Only buttons the owner filled in are shown (Share always shows). Extra socials (X, TikTok, Facebook, Snapchat) use the same button style and add new rows.
7. **Save Contact:** full-width Gold pill button with Onyx text, pinned to the bottom of the content. Downloads a vCard (.vcf) so details go straight into the phone's contacts, with photo where supported.
8. Small "Get your own Tapvane card" footer link (marketing).

**Button behaviour:** Call → `tel:`, WhatsApp → `https://wa.me/<number>`, Email → `mailto:`, Location → Google Maps link, Share → the phone's native share sheet (Web Share API), falling back to copy link.

**Themes:** Basic gets the standard Noir & Gold look above. Pro unlocks custom accent colour (replaces Gold) and a custom cover image.

**Design reference:** the "Tapvane Brand Directions" design canvas, board "A · Profile layouts", layout 2.
- Mobile-first, loads in under 2 seconds on 4G, works without login, includes share preview (title/image when the link is shared on WhatsApp).
- Profile can be switched off (shows a neutral "Profile unavailable" page).

### 7.6 Card links & reassignment
- Every physical card/tag has a unique **card code** (e.g. `TVN-7F3K9`), stored in the database.
- The chip is written with `https://tapvane.com/c/[card-code]` (**never** the profile URL directly).
- `/c/[card-code]` redirects to whichever profile the card is currently assigned to.
- **Admin can reassign** a card to a different profile (e.g. staff member leaves a business) without rewriting the chip.
- Unassigned card → friendly "Activate your Tapvane card" page with login/signup.
- Admin can generate card codes in batches and export them (CSV) for writing onto chips with an NFC writer app.

### 7.7 Customer accounts & dashboard
- Sign up/login with **email + password**, forgot password via email, email verification.
- Edit own profile with live preview; choose username (unique, lowercase, letters/numbers/hyphens).
- See orders and statuses.
- Business buyers: see all team profiles, edit them, and invite team members by email to manage their own.
- Both customer and admin can edit a profile (requirement: "Both").

### 7.8 Admin dashboard (founder)
- **Overview:** today's orders, pending transfer confirmations, low-stock alerts, revenue total.
- **Orders:** list/filter by status, view customisation preview, update status, confirm bank transfers, print/download design details.
- **Customers & profiles:** create a profile for a customer (e.g. walk-in sale), edit any profile, disable profiles.
- **Cards:** generate codes, assign/reassign cards to profiles, export CSV.
- **Products & pricing:** edit prices, package contents, stock counts.
- **Templates:** add/edit card templates and colour/finish options.
- **Settings:** delivery fees, bank details, WhatsApp number, contact email. Start with WhatsApp **+234 911 399 1292** and email **tapvane.co@gmail.com** as the default values. Every place these appear (floating chat button, Contact page, checkout "Send proof on WhatsApp", footer, **Terms page and Privacy page**) reads them from Settings, so changing them once updates the whole site.
- Admin access restricted to admin accounts only.

### 7.9 Emails (automatic)
Welcome/verify email, order confirmation, payment confirmed, status updates, password reset. Contact and reply-to email: **tapvane.co@gmail.com**. Email services such as Resend need a domain you own to send automatic emails, so show this Gmail address as the contact/reply-to address until **tapvane.com** is verified with the email service, then send from an address on the domain (e.g. hello@tapvane.com). Ask the founder before setting this up.

## 8. Design Direction

**Chosen direction: A · Noir & Gold.** Classic luxury, like a private-bank black card: quiet, confident, expensive. Design reference: the "Tapvane Brand Directions" design canvas, board "A · Noir & Gold".

**Colours** (put these in the Tailwind theme as named colours):

| Name | Hex | Use |
|---|---|---|
| Onyx | `#0B0B0C` | Main background |
| Charcoal | `#1C1B19` | Panels, cover banners, cards |
| Gold | `#C9A34E` | Accent: logo, buttons, highlights, icons |
| Ivory | `#EDE6D6` | Main text |
| Stone | `#8C857A` | Secondary text, hints |
| Muted text | `#A79F92` | Captions, job titles, descriptions |
| Border | `#3A342A` | Outlines and dividers (`#2A2722` for subtle dividers) |

**Typography:**
- **Bodoni Moda** (Google Fonts): headings, names, and the wordmark.
- **Manrope** (Google Fonts): body text, buttons, forms.

**Logo:** text wordmark "TAPVANE" in Bodoni Moda, Gold, all caps, letter-spacing about 0.3em, with no icon. Tagline underneath where space allows: "TAP · SHARE · CONNECT" (Manrope, small caps, letter-spaced, muted). The logo may be refined later, so keep it in one reusable component.

**Card design (for the customiser preview):**
- Front: Onyx-coloured card with a thin border, TAPVANE wordmark top-left in Gold, a small NFC wave icon top-right, and the customer's name (Bodoni Moda) and job title · company bottom-left.
- Back: solid Gold with the TAPVANE wordmark centred in Onyx and "TAP TO CONNECT" underneath.

**General:**
- **Visuals:** realistic card mockups, subtle gold highlights, smooth but light animations (must not slow pages on mobile data).
- **Mobile-first:** most customers will visit on phones from WhatsApp/Instagram links.
- **Buttons:** primary = Gold background with Onyx text; secondary = outlined (Border or Gold outline) with Ivory text. Minimum tap size 44px.

## 9. Technical Requirements (recommended stack)

Chosen for speed, low cost and beginner-friendliness:

| Need | Recommendation |
|---|---|
| Website framework | **Next.js** (React) + **Tailwind CSS** |
| Database, login, file storage | **Supabase** (email/password auth, Postgres database, image storage for profile photos & payment proofs) |
| Payments | **Paystack** (inline checkout + webhook verification) |
| Emails | **Resend** (or Supabase's built-in emails for auth) |
| Hosting | **Vercel** (free tier to start) |
| Domain | **tapvane.com** (owned; registered with Namecheap). Connect it to Vercel at launch. |

**Non-functional requirements**
- Secure: passwords handled by Supabase Auth, database row-level security so customers only see their own data, admin routes protected, secret keys only in environment variables (never in code).
- Performance: Lighthouse mobile score 85+; images compressed and resized.
- Privacy: comply with the Nigeria Data Protection Act basics (privacy policy, consent at signup, ability to delete account).
- SEO: titles/descriptions on public pages; profiles shareable with preview images.
- Reliability: profile pages and `/c/` redirects must work even if other parts of the site have issues; they are the product.

## 10. Data Model (simplified)

- **users**: id, email, role (customer/admin), created_at
- **profiles**: id, owner_user_id, username, full_name, title, company, bio, photo_url, cover_url, phone, whatsapp, email, website, location (address or maps link), socials (json), theme, accent_color, is_active
- **cards**: id, card_code, type (pvc/premium/tag), profile_id (nullable), order_id, status (unassigned/active/disabled)
- **products**: id, name, type, price, items_included, stock, is_active
- **templates**: id, name, preview_image, available_for (packages), is_active
- **orders**: id, user_id, items (json incl. customisation), subtotal, delivery_option, delivery_fee, total, payment_method, payment_status, order_status, address, phone, proof_url, paystack_reference, created_at
- **teams**: id, owner_user_id, name; **team_members**: team_id, profile_id, invited_email
- **settings**: delivery fees, bank details, WhatsApp number, contact email

## 11. Success Metrics (first 3 months)

- Orders placed per week; % paid via Paystack vs transfer.
- Checkout completion rate (customiser → paid).
- % of sold cards activated with a complete profile.
- Time from payment to delivery.

## 12. Phase 2 (after launch)

- Tap analytics (how many times a profile was opened).
- Gallery / products / services section on profiles (for small businesses).
- Customer-uploaded logo/artwork in customiser.
- Metal cards, keychains, wristbands.
- Instalment plans for large business orders.
- Lead capture ("Share your contact back" form on profiles).
- Discount codes and referral rewards.

## 13. Build Order (for Claude Code)

Build and test each stage before moving on. Show the founder how to view the site locally after each stage.

1. **Setup:** Next.js + Tailwind project, Git/GitHub, Supabase project, environment variables. Create `CLAUDE.md` with brand colours, prices, and key rules from this PRD.
2. **Public profile page** (`/p/[username]`) with Save Contact (vCard) and sample data.
3. **Card links** (`/c/[card-code]` redirect + unassigned page).
4. **Auth + customer dashboard** (signup/login, edit profile).
5. **Admin basics:** create/edit profiles, generate and assign cards.
6. **Home (with demo animation and menu with cart icon), packages, how-it-works, FAQ, contact pages.**
7. **Customiser with live preview** and **Add to cart** (cart panel and cart icon in the menu).
8. **Checkout:** cart review, delivery options, Paystack + manual transfer, order statuses, emails.
9. **Admin orders, products/stock, templates, settings.**
10. **Polish:** mobile testing, speed, SEO, privacy/terms pages.
11. **Launch:** deploy to Vercel, connect tapvane.com (DNS is managed in Namecheap), switch Paystack to live keys, test a real order end to end, write and tap-test real cards.

## 14. Open Items / Placeholders

- [x] Delivery fees: within Makurdi ₦1,500, outside Makurdi ₦5,000
- [x] Pickup address: Opp. Holy Ghost Catholic Church, Wadata, Makurdi
- [x] WhatsApp number: +234 911 399 1292 (editable in admin Settings)
- [x] Contact email: tapvane.co@gmail.com (sending address on tapvane.com at launch, e.g. hello@tapvane.com)
- [ ] Bank account details: founder enters these in admin Settings after the site is built (not in this file)
- [x] Domain: tapvane.com (bought on Namecheap)
- [x] Brand direction, colours and fonts (Noir & Gold, see Section 8)
- [x] Profile page layout (see Section 7.5)
- [ ] Final logo files (SVG/PNG) if the wordmark is refined later
- [ ] Card templates (number and designs at launch)
- [x] Business cards: standard PVC finish
- [x] Pro finish: matte
- [x] Delivery time: 5–7 business days
- [x] Lost cards: no replacement fee; no refund policy
- [ ] Paystack account (business registration may be needed for live payments)
- [ ] FAQ content and Terms/Privacy text
