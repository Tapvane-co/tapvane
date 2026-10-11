-- Tapvane database, Stage 6: products (prices) and site settings.
-- Run AFTER stage5-admin.sql. Paste this whole file into Supabase > SQL Editor > New query > Run.
-- It is safe to run more than once. It will NOT overwrite prices or settings you have already changed.

-- 1. Products and prices (Naira). The website reads these; you will edit them in admin (Stage 9).
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  type text not null check (type in ('basic', 'pro', 'business', 'tag')),
  item_type text not null check (item_type in ('pvc', 'premium', 'tag')),
  cards_included integer not null default 1 check (cards_included >= 1),
  price integer not null check (price >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

drop policy if exists "Anyone can view active products" on public.products;
create policy "Anyone can view active products"
  on public.products for select
  using (is_active);

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
  on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into public.products (slug, name, type, item_type, cards_included, price, sort_order) values
  ('basic',       'Basic',        'basic',    'pvc',     1,  18000, 1),
  ('pro',         'Pro',          'pro',      'premium', 1,  30000, 2),
  ('business-5',  'Business 5',   'business', 'pvc',     5,  80000, 3),
  ('business-10', 'Business 10',  'business', 'pvc',    10, 150000, 4),
  ('tag',         'NFC Tag',      'tag',      'tag',     1,  10000, 5)
on conflict (slug) do nothing;

-- 2. Settings: contact details, delivery fees, pickup address. One row per setting.
--    (Bank details will be added in Stage 8 and are kept private; they start with "bank_".)
create table if not exists public.settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

alter table public.settings enable row level security;

drop policy if exists "Anyone can view public settings" on public.settings;
create policy "Anyone can view public settings"
  on public.settings for select
  using (key !~ '^bank_');

drop policy if exists "Admins manage settings" on public.settings;
create policy "Admins manage settings"
  on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into public.settings (key, value) values
  ('whatsapp_number',        '+234 902 591 8252'),
  ('contact_email',          'nfc.taply.hub@gmail.com'),
  ('instagram_handle',       ''),
  ('opening_hours',          ''),
  ('pickup_address',         'Opp. Holy Ghost Catholic Church, Wadata, Makurdi, Benue State'),
  ('delivery_fee_makurdi',   '1500'),
  ('delivery_fee_nationwide','5000')
on conflict (key) do nothing;
