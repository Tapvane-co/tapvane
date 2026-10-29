-- Tapvane database, Stage 13: Pro styling unlocks as soon as a Pro order is PLACED.
-- Run AFTER stage12-auto-pro.sql. Paste this whole file into Supabase > SQL Editor > New query > Run.
-- It is safe to run more than once.
--
-- What it does:
--  * A customer with a Pro order that is not cancelled (even if payment is not confirmed yet) may set the
--    cover image and accent colour on their profile right away, so they finish everything in one sitting.
--  * The public page still shows the cover and colour only when the profile is Pro, which switches on by
--    itself when the order is PAID (stage 12). Customers still can never switch Pro on themselves.
--  * If the order is cancelled, the options lock again (what they saved is kept but not shown).
--
-- If you ever re-run stage 11 or stage 12, run this file again afterwards (it holds the final guard).

-- Does the SIGNED-IN person have a Pro order that is not cancelled? (It only ever looks at their own orders.)
create or replace function public.has_pro_order()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1 from public.orders o
     where o.user_id = auth.uid()
       and o.status <> 'cancelled'
       and exists (select 1 from jsonb_array_elements(o.items) e where e ->> 'type' = 'pro'));
$$;

revoke all on function public.has_pro_order() from public, anon;
grant execute on function public.has_pro_order() to authenticated, service_role;

create or replace function public.profiles_pro_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Admins, server tools with no signed-in person (SQL editor) and Tapvane's own trusted database
  -- functions (they run as the database owner, not as a customer) may change anything.
  if auth.uid() is null or public.is_admin() or current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.is_pro then
      raise exception 'only_admin_can_change_pro' using errcode = '42501';
    end if;
    if (new.accent_color is not null or new.cover_url is not null) and not public.has_pro_order() then
      raise exception 'pro_only' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.is_pro is distinct from old.is_pro then
    raise exception 'only_admin_can_change_pro' using errcode = '42501';
  end if;
  if (new.accent_color is distinct from old.accent_color or new.cover_url is distinct from old.cover_url)
     and not old.is_pro
     and not public.has_pro_order() then
    raise exception 'pro_only' using errcode = '42501';
  end if;
  return new;
end;
$$;
