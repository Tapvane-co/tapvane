-- Tapvane database, Stage 7: card designer options and stock counts.
-- Run AFTER stage6-content.sql. Paste this whole file into Supabase > SQL Editor > New query > Run.
-- It is safe to run more than once. It will NOT overwrite anything you have already changed.

-- 1. Card designs ("templates"). The layout name must be one the website knows how to draw:
--    classic, centred or monogram. Premium designs are for the Pro package only.
create table if not exists public.card_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  layout text not null check (layout in ('classic', 'centred', 'monogram')),
  tier text not null default 'standard' check (tier in ('standard', 'premium')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Card colours. Colours are written as hex codes like #0B0B0C.
create table if not exists public.card_colours (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  front_bg text not null check (front_bg ~ '^#[0-9A-Fa-f]{6}$'),
  front_text text not null check (front_text ~ '^#[0-9A-Fa-f]{6}$'),
  accent text not null check (accent ~ '^#[0-9A-Fa-f]{6}$'),
  back_bg text not null check (back_bg ~ '^#[0-9A-Fa-f]{6}$'),
  back_text text not null check (back_text ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Stock. One row per physical item. A blank quantity means "not counting yet" (always available).
--    "Few left" shows when the quantity is at or below low_threshold; 0 blocks ordering.
create table if not exists public.stock (
  item_type text primary key check (item_type in ('pvc', 'premium', 'tag')),
  quantity integer check (quantity is null or quantity >= 0),
  low_threshold integer not null default 5 check (low_threshold >= 0),
  updated_at timestamptz not null default now()
);

drop trigger if exists card_templates_set_updated_at on public.card_templates;
create trigger card_templates_set_updated_at before update on public.card_templates
  for each row execute function public.set_updated_at();
drop trigger if exists card_colours_set_updated_at on public.card_colours;
create trigger card_colours_set_updated_at before update on public.card_colours
  for each row execute function public.set_updated_at();
drop trigger if exists stock_set_updated_at on public.stock;
create trigger stock_set_updated_at before update on public.stock
  for each row execute function public.set_updated_at();

-- Rules: everyone can read (the designer needs it), only admins can change.
alter table public.card_templates enable row level security;
alter table public.card_colours enable row level security;
alter table public.stock enable row level security;

drop policy if exists "Anyone can view active templates" on public.card_templates;
create policy "Anyone can view active templates" on public.card_templates for select using (is_active);
drop policy if exists "Admins manage templates" on public.card_templates;
create policy "Admins manage templates" on public.card_templates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Anyone can view active colours" on public.card_colours;
create policy "Anyone can view active colours" on public.card_colours for select using (is_active);
drop policy if exists "Admins manage colours" on public.card_colours;
create policy "Admins manage colours" on public.card_colours for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Anyone can view stock" on public.stock;
create policy "Anyone can view stock" on public.stock for select using (true);
drop policy if exists "Admins manage stock" on public.stock;
create policy "Admins manage stock" on public.stock for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Starter designs and colours. Edit, add or switch off any of these later in admin.
insert into public.card_templates (slug, name, layout, tier, sort_order) values
  ('classic',  'Classic',  'classic',  'standard', 1),
  ('centred',  'Centred',  'centred',  'standard', 2),
  ('monogram', 'Monogram', 'monogram', 'premium',  3)
on conflict (slug) do nothing;

insert into public.card_colours (slug, name, front_bg, front_text, accent, back_bg, back_text, sort_order) values
  ('noir-gold', 'Noir & Gold', '#0B0B0C', '#EDE6D6', '#C9A34E', '#C9A34E', '#0B0B0C', 1),
  ('ivory',     'Ivory',       '#EDE6D6', '#0B0B0C', '#8F6F26', '#0B0B0C', '#C9A34E', 2),
  ('midnight',  'Midnight',    '#0F1B2D', '#EDE6D6', '#C9A34E', '#C9A34E', '#0F1B2D', 3),
  ('forest',    'Forest',      '#10261C', '#EDE6D6', '#C9A34E', '#C9A34E', '#10261C', 4)
on conflict (slug) do nothing;

insert into public.stock (item_type, quantity, low_threshold) values
  ('pvc', null, 5), ('premium', null, 5), ('tag', null, 5)
on conflict (item_type) do nothing;
