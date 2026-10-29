-- Tapvane database, Stage 12: the Pro tick switches on by itself.
-- Run AFTER stage11-pro-profile.sql. Paste this whole file into Supabase > SQL Editor > New query > Run.
-- It is safe to run more than once.
--
-- What it does:
--  * When an order containing the Pro package becomes PAID (you confirm it in admin, or Paystack confirms it),
--    the customer's profile is switched to Pro automatically.
--  * If the customer makes their profile AFTER paying, it is switched to Pro the moment it is created.
--  * Walk-in orders (no login) are not linked to a profile, so tick those by hand in Admin > Profiles.
--  * Cancelling an order later does NOT remove Pro (you can untick it by hand).

-- 1. The guard from stage 11, with one change: Tapvane's own trusted functions may switch Pro on
--    (customers still cannot).
create or replace function public.profiles_pro_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
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

-- 2. An order that counts as paid and contains the Pro package switches that customer's profile(s) to Pro.
create or replace function public.orders_grant_pro()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null
     and new.status in ('paid', 'in_production', 'ready_for_pickup', 'shipped', 'delivered')
     and exists (select 1 from jsonb_array_elements(new.items) e where e ->> 'type' = 'pro') then
    update public.profiles set is_pro = true where owner_user_id = new.user_id and not is_pro;
  end if;
  return null;
end;
$$;

revoke all on function public.orders_grant_pro() from public, anon, authenticated;

drop trigger if exists orders_grant_pro on public.orders;
create trigger orders_grant_pro
  after insert or update of status on public.orders
  for each row execute function public.orders_grant_pro();

-- 3. A new profile whose owner already has a paid Pro order starts as Pro.
create or replace function public.profiles_grant_pro_on_create()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_user_id is not null and not new.is_pro and exists (
       select 1 from public.orders o
        where o.user_id = new.owner_user_id
          and o.status in ('paid', 'in_production', 'ready_for_pickup', 'shipped', 'delivered')
          and exists (select 1 from jsonb_array_elements(o.items) e where e ->> 'type' = 'pro')) then
    update public.profiles set is_pro = true where id = new.id;
  end if;
  return null;
end;
$$;

revoke all on function public.profiles_grant_pro_on_create() from public, anon, authenticated;

drop trigger if exists profiles_grant_pro_on_create on public.profiles;
create trigger profiles_grant_pro_on_create
  after insert on public.profiles
  for each row execute function public.profiles_grant_pro_on_create();

-- 4. One-time catch-up for anyone who already has a paid Pro order (safe if there are none).
update public.profiles p
   set is_pro = true
 where not p.is_pro
   and p.owner_user_id is not null
   and exists (
     select 1 from public.orders o
      where o.user_id = p.owner_user_id
        and o.status in ('paid', 'in_production', 'ready_for_pickup', 'shipped', 'delivered')
        and exists (select 1 from jsonb_array_elements(o.items) e where e ->> 'type' = 'pro'));
