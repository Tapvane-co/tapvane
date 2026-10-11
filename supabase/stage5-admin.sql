-- Tapvane database, Stage 5: admin accounts, cards, admin access to profiles.
-- Run AFTER schema.sql. Paste this whole file into Supabase > SQL Editor > New query > Run.
-- It is safe to run more than once.

-- 1. Admins. Only people listed here can use /admin. Nobody can add themselves from the website;
--    you add yourself once, in the SQL Editor (see the end of this file).
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

drop policy if exists "Admins can see their own row" on public.admins;
create policy "Admins can see their own row"
  on public.admins for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- 2. Profiles made by admin for walk-in customers have no account yet, so the owner can be empty.
alter table public.profiles alter column owner_user_id drop not null;

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select to authenticated using (public.is_admin());

drop policy if exists "Admins can create profiles" on public.profiles;
create policy "Admins can create profiles"
  on public.profiles for insert to authenticated with check (public.is_admin());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
  on public.profiles for delete to authenticated using (public.is_admin());

-- 3. Photos: admins may upload photos for any profile.
drop policy if exists "Admins upload any profile photo" on storage.objects;
create policy "Admins upload any profile photo"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-photos' and public.is_admin());

drop policy if exists "Admins update any profile photo" on storage.objects;
create policy "Admins update any profile photo"
  on storage.objects for update to authenticated
  using (bucket_id = 'profile-photos' and public.is_admin());

-- 4. Cards. Every physical card or tag has one row. The chip holds https://tapvane.com/c/<card_code>.
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  card_code text not null unique check (card_code ~ '^[A-Z0-9-]{6,20}$'),
  type text not null default 'pvc' check (type in ('pvc', 'premium', 'tag')),
  profile_id uuid references public.profiles (id) on delete set null,
  order_id uuid, -- linked to the orders table in Stage 8
  status text not null default 'unassigned' check (status in ('unassigned', 'active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint active_card_needs_profile check (status <> 'active' or profile_id is not null)
);

create index if not exists cards_profile_idx on public.cards (profile_id);

drop trigger if exists cards_set_updated_at on public.cards;
create trigger cards_set_updated_at
  before update on public.cards
  for each row execute function public.set_updated_at();

alter table public.cards enable row level security;

drop policy if exists "Admins manage cards" on public.cards;
create policy "Admins manage cards"
  on public.cards for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 5. What /c/<code> uses. It answers for ONE code only, so visitors can never list all cards.
create or replace function public.lookup_card(p_code text)
returns table (card_code text, status text, username text)
language sql
stable
security definer
set search_path = public
as $$
  select c.card_code, c.status, p.username
  from public.cards c
  left join public.profiles p on p.id = c.profile_id
  where c.card_code = upper(trim(p_code));
$$;

revoke all on function public.lookup_card(text) from public;
grant execute on function public.lookup_card(text) to anon, authenticated;

-- 6. MAKE YOURSELF AN ADMIN (do this once, after you have created your account on the website).
--    Replace the email with the one you signed up with, then run only this line:
--
--    insert into public.admins (user_id) select id from auth.users where email = 'YOUR-SIGNUP-EMAIL' on conflict do nothing;
