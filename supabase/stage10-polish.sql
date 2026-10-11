-- Tapvane database, Stage 10: legal name for Terms/Privacy, and customers deleting their own account.
-- Run AFTER stage9-admin-orders.sql. Paste this whole file into Supabase > SQL Editor > New query > Run.
-- It is safe to run more than once.

-- 1. The registered business name (and RC/BN number) shown in the Terms and Privacy pages.
--    You fill it in under Admin > Settings. Blank = the pages just say "Tapvane".
insert into public.settings (key, value) values ('legal_business_name', '')
on conflict (key) do nothing;

-- 2. "Delete my account" (Nigeria Data Protection Act: people can ask for their data to be deleted).
--    What happens: the login and the profile are deleted, their cards become "not assigned" again,
--    and past ORDERS are kept for accounting (as the privacy policy says) but are no longer linked to a login.
--    Admin accounts cannot be deleted this way.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_signed_in'; end if;
  if public.is_admin() then raise exception 'admin_cannot_delete'; end if;

  -- A card that pointed at this person's profile goes back to "not assigned" (so it can be reused).
  update public.cards
     set status = 'unassigned'
   where status = 'active'
     and profile_id in (select id from public.profiles where owner_user_id = v_uid);

  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
