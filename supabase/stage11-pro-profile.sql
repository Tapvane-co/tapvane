-- Tapvane database, Stage 11: Pro profiles (cover image + accent colour).
-- Run AFTER stage10-polish.sql. Paste this whole file into Supabase > SQL Editor > New query > Run.
-- It is safe to run more than once. It changes no existing data.
--
-- What it does:
--  1. Adds a "Pro profile" switch (is_pro) to every profile. It starts OFF.
--  2. Only the format #RRGGBB is allowed for the accent colour.
--  3. A guard, inside the database, so customers can NEVER give themselves the Pro switch,
--     and can only set a cover image / accent colour when their profile is Pro. Admins can do anything.

alter table public.profiles add column if not exists is_pro boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_accent_color_format') then
    alter table public.profiles
      add constraint profiles_accent_color_format
      check (accent_color is null or accent_color ~ '^#[0-9A-Fa-f]{6}$');
  end if;
end $$;

create or replace function public.profiles_pro_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Admins, server tools with no signed-in person (such as the SQL editor), and Tapvane's own trusted
  -- database functions (which run as the database owner, not as a customer) may change anything.
  if auth.uid() is null or public.is_admin() or current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.is_pro or new.accent_color is not null or new.cover_url is not null then
      raise exception 'pro_only' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.is_pro is distinct from old.is_pro then
    raise exception 'only_admin_can_change_pro' using errcode = '42501';
  end if;
  if not old.is_pro and (new.accent_color is distinct from old.accent_color or new.cover_url is distinct from old.cover_url) then
    raise exception 'pro_only' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_pro_guard on public.profiles;
create trigger profiles_pro_guard
  before insert or update on public.profiles
  for each row execute function public.profiles_pro_guard();
