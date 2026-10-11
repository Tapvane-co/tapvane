-- Tapvane database, Stage 8: orders, checkout, payment proofs.
-- Run AFTER stage7-designer.sql. Paste this whole file into Supabase > SQL Editor > New query > Run.
-- It is safe to run more than once.

-- 1. Orders. Customers can READ their own orders, but can never create or change one directly.
--    Orders are created by create_order() below, which works out every price inside the database,
--    so nobody can change a price from their browser.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity (start with 1001) unique,
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null default '',
  email text not null default '',
  phone text not null,
  items jsonb not null,
  subtotal integer not null check (subtotal >= 0),
  delivery_option text not null check (delivery_option in ('pickup', 'makurdi', 'nationwide')),
  delivery_fee integer not null check (delivery_fee >= 0),
  total integer not null check (total >= 0),
  payment_method text not null check (payment_method in ('paystack', 'transfer')),
  status text not null default 'awaiting_payment' check (status in (
    'awaiting_payment', 'awaiting_confirmation', 'paid', 'in_production',
    'ready_for_pickup', 'shipped', 'delivered', 'cancelled')),
  address text,
  city text,
  state text,
  proof_url text,
  paystack_reference text unique,
  paid_at timestamptz,
  stock_applied boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;

drop policy if exists "Customers view their own orders" on public.orders;
create policy "Customers view their own orders"
  on public.orders for select to authenticated using (user_id = auth.uid());

drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders"
  on public.orders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Cards can now point back to the order they came from.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cards_order_fk') then
    alter table public.cards
      add constraint cards_order_fk foreign key (order_id) references public.orders (id) on delete set null;
  end if;
end $$;

-- 2. Bank details. Entered by you in admin Settings (Stage 9). Only signed-in customers can see them.
insert into public.settings (key, value) values
  ('bank_name', ''), ('bank_account_name', ''), ('bank_account_number', '')
on conflict (key) do nothing;

drop policy if exists "Signed-in customers can view bank details" on public.settings;
create policy "Signed-in customers can view bank details"
  on public.settings for select to authenticated using (key ~ '^bank_');

-- 3. Payment proofs (screenshots or PDFs). Private: only the customer who uploaded and admins can open them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

drop policy if exists "Customers upload their own proofs" on storage.objects;
create policy "Customers upload their own proofs"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Customers and admins view proofs" on storage.objects;
create policy "Customers and admins view proofs"
  on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- 4. create_order: the only way an order gets made. Everything is checked and priced here.
create or replace function public.create_order(
  p_items jsonb,
  p_delivery text,
  p_phone text,
  p_address text,
  p_city text,
  p_state text,
  p_method text
)
returns table (o_id uuid, o_number bigint, o_total integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_name text;
  v_el jsonb;
  v_prod public.products%rowtype;
  v_tpl public.card_templates%rowtype;
  v_col public.card_colours%rowtype;
  v_design jsonb;
  v_finish text;
  v_later boolean;
  v_cards jsonb;
  v_card jsonb;
  v_i integer;
  v_qty integer;
  v_lines jsonb := '[]'::jsonb;
  v_subtotal integer := 0;
  v_fee integer := 0;
  v_total integer;
  v_pvc integer := 0;
  v_premium integer := 0;
  v_tag integer := 0;
  v_setting text;
  v_stock integer;
  v_phone text;
  v_status text;
  v_order_id uuid;
  v_order_number bigint;
begin
  if v_uid is null then raise exception 'not_signed_in'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'cart_invalid';
  end if;
  if p_delivery not in ('pickup', 'makurdi', 'nationwide') then raise exception 'delivery_invalid'; end if;
  if p_method not in ('paystack', 'transfer') then raise exception 'method_invalid'; end if;

  v_phone := left(trim(coalesce(p_phone, '')), 30);
  if length(regexp_replace(v_phone, '[^0-9]', '', 'g')) < 10 then raise exception 'phone_invalid'; end if;
  if p_delivery <> 'pickup' and (
       trim(coalesce(p_address, '')) = '' or trim(coalesce(p_city, '')) = '' or trim(coalesce(p_state, '')) = '') then
    raise exception 'address_missing';
  end if;

  for v_el in select value from jsonb_array_elements(p_items) loop
    select * into v_prod from public.products where slug = (v_el ->> 'slug') and is_active;
    if not found then raise exception 'product_unavailable'; end if;

    if v_prod.type = 'tag' then
      v_qty := case when (v_el ->> 'quantity') ~ '^[0-9]{1,3}$'
                    then least(99, greatest(1, (v_el ->> 'quantity')::integer)) else 1 end;
      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'slug', v_prod.slug, 'name', v_prod.name, 'type', v_prod.type, 'item_type', v_prod.item_type,
        'cards_included', v_prod.cards_included, 'unit_price', v_prod.price, 'quantity', v_qty,
        'line_total', v_prod.price * v_qty, 'design', null));
    else
      v_qty := 1;
      v_design := v_el -> 'design';
      if v_design is null or jsonb_typeof(v_design) <> 'object' then raise exception 'design_missing'; end if;

      select * into v_tpl from public.card_templates where slug = (v_design ->> 'template') and is_active;
      if not found then raise exception 'design_invalid'; end if;
      select * into v_col from public.card_colours where slug = (v_design ->> 'colour') and is_active;
      if not found then raise exception 'design_invalid'; end if;

      v_finish := case when (v_design ->> 'finish') = 'matte' then 'matte' else 'standard' end;
      -- Premium designs and the matte finish belong to the Pro package only.
      if (v_tpl.tier = 'premium' or v_finish = 'matte') and v_prod.type <> 'pro' then
        raise exception 'pro_only';
      end if;

      v_later := (v_design -> 'detailsLater') = 'true'::jsonb;
      v_cards := '[]'::jsonb;
      if not v_later then
        if coalesce(jsonb_typeof(v_design -> 'cards'), '') <> 'array' then raise exception 'card_details_missing'; end if;
        for v_i in 0 .. v_prod.cards_included - 1 loop
          v_card := (v_design -> 'cards') -> v_i;
          if v_card is null or jsonb_typeof(v_card) <> 'object'
             or left(trim(coalesce(v_card ->> 'name', '')), 26) = '' then
            raise exception 'card_details_missing';
          end if;
          v_cards := v_cards || jsonb_build_array(jsonb_build_object(
            'name', left(trim(v_card ->> 'name'), 26),
            'title', left(trim(coalesce(v_card ->> 'title', '')), 24),
            'company', left(trim(coalesce(v_card ->> 'company', '')), 24)));
        end loop;
      end if;

      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'slug', v_prod.slug, 'name', v_prod.name, 'type', v_prod.type, 'item_type', v_prod.item_type,
        'cards_included', v_prod.cards_included, 'unit_price', v_prod.price, 'quantity', v_qty,
        'line_total', v_prod.price * v_qty,
        'design', jsonb_build_object(
          'template', jsonb_build_object('slug', v_tpl.slug, 'name', v_tpl.name, 'layout', v_tpl.layout, 'tier', v_tpl.tier),
          'colour', jsonb_build_object('slug', v_col.slug, 'name', v_col.name, 'front_bg', v_col.front_bg,
            'front_text', v_col.front_text, 'accent', v_col.accent, 'back_bg', v_col.back_bg, 'back_text', v_col.back_text),
          'finish', v_finish,
          'details_later', v_later,
          'cards', v_cards)));
    end if;

    v_subtotal := v_subtotal + v_prod.price * v_qty;
    if v_prod.item_type = 'pvc' then v_pvc := v_pvc + v_prod.cards_included * v_qty;
    elsif v_prod.item_type = 'premium' then v_premium := v_premium + v_prod.cards_included * v_qty;
    else v_tag := v_tag + v_prod.cards_included * v_qty;
    end if;
  end loop;

  -- Stock: a blank quantity means "not counting yet".
  select quantity into v_stock from public.stock where item_type = 'pvc';
  if v_stock is not null and v_pvc > v_stock then raise exception 'out_of_stock'; end if;
  select quantity into v_stock from public.stock where item_type = 'premium';
  if v_stock is not null and v_premium > v_stock then raise exception 'out_of_stock'; end if;
  select quantity into v_stock from public.stock where item_type = 'tag';
  if v_stock is not null and v_tag > v_stock then raise exception 'out_of_stock'; end if;

  -- Delivery fee comes from Settings (the fallbacks are the starting prices).
  if p_delivery = 'makurdi' then
    select value into v_setting from public.settings where key = 'delivery_fee_makurdi';
    v_fee := case when v_setting ~ '^[0-9]+$' then v_setting::integer else 1500 end;
  elsif p_delivery = 'nationwide' then
    select value into v_setting from public.settings where key = 'delivery_fee_nationwide';
    v_fee := case when v_setting ~ '^[0-9]+$' then v_setting::integer else 5000 end;
  end if;
  v_total := v_subtotal + v_fee;

  select u.email, coalesce(u.raw_user_meta_data ->> 'full_name', '')
    into v_email, v_name from auth.users u where u.id = v_uid;

  v_status := case when p_method = 'transfer' then 'awaiting_confirmation' else 'awaiting_payment' end;

  insert into public.orders (user_id, customer_name, email, phone, items, subtotal, delivery_option,
                             delivery_fee, total, payment_method, status, address, city, state)
  values (v_uid, coalesce(v_name, ''), coalesce(v_email, ''), v_phone, v_lines, v_subtotal, p_delivery,
          v_fee, v_total, p_method, v_status,
          case when p_delivery = 'pickup' then null else left(trim(p_address), 200) end,
          case when p_delivery = 'pickup' then null else left(trim(p_city), 80) end,
          case when p_delivery = 'pickup' then null else left(trim(p_state), 60) end)
  returning id, order_number into v_order_id, v_order_number;

  if p_method = 'paystack' then
    update public.orders
       set paystack_reference = 'TVN-' || v_order_number || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)
     where id = v_order_id;
  end if;

  return query select v_order_id, v_order_number, v_total;
end;
$$;

revoke all on function public.create_order(jsonb, text, text, text, text, text, text) from public, anon;
grant execute on function public.create_order(jsonb, text, text, text, text, text, text) to authenticated;

-- 5. A fresh Paystack reference for paying again (Paystack will not reuse one).
create or replace function public.refresh_payment_reference(p_order uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
begin
  update public.orders
     set paystack_reference = 'TVN-' || order_number || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)
   where id = p_order and user_id = auth.uid() and payment_method = 'paystack' and status = 'awaiting_payment'
  returning paystack_reference into v_ref;
  if v_ref is null then raise exception 'order_not_payable'; end if;
  return v_ref;
end;
$$;

revoke all on function public.refresh_payment_reference(uuid) from public, anon;
grant execute on function public.refresh_payment_reference(uuid) to authenticated;

-- 6. The customer attaches their payment screenshot to a bank-transfer order.
create or replace function public.submit_transfer_proof(p_order uuid, p_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or p_path is null or p_path not like auth.uid()::text || '/%' then
    raise exception 'proof_invalid';
  end if;
  update public.orders
     set proof_url = p_path
   where id = p_order and user_id = auth.uid() and payment_method = 'transfer'
     and status in ('awaiting_confirmation', 'awaiting_payment');
  if not found then raise exception 'order_not_found'; end if;
end;
$$;

revoke all on function public.submit_transfer_proof(uuid, text) from public, anon;
grant execute on function public.submit_transfer_proof(uuid, text) to authenticated;

-- 7. Taking cards and tags out of stock once an order is paid. Only runs once per order.
create or replace function public.apply_stock_for_order(p_order uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_line jsonb;
begin
  select * into v_order from public.orders where id = p_order for update;
  if not found or v_order.stock_applied then return; end if;
  for v_line in select value from jsonb_array_elements(v_order.items) loop
    update public.stock
       set quantity = greatest(0, quantity - (v_line ->> 'cards_included')::integer * (v_line ->> 'quantity')::integer)
     where item_type = (v_line ->> 'item_type') and quantity is not null;
  end loop;
  update public.orders set stock_applied = true where id = p_order;
end;
$$;

-- 8. Marking an order as paid. ONLY the website's server (with its secret key) may call this,
--    after Paystack has confirmed the payment. Customers and visitors can never call it.
create or replace function public.mark_order_paid(p_reference text, p_amount_kobo bigint)
returns table (o_id uuid, o_number bigint, o_email text, o_name text, o_total integer, o_changed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where paystack_reference = p_reference for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_order.total::bigint * 100 <> p_amount_kobo then raise exception 'amount_mismatch'; end if;

  if v_order.status in ('awaiting_payment', 'awaiting_confirmation') then
    update public.orders set status = 'paid', paid_at = now() where id = v_order.id;
    perform public.apply_stock_for_order(v_order.id);
    return query select v_order.id, v_order.order_number, v_order.email, v_order.customer_name, v_order.total, true;
  else
    return query select v_order.id, v_order.order_number, v_order.email, v_order.customer_name, v_order.total, false;
  end if;
end;
$$;

revoke all on function public.apply_stock_for_order(uuid) from public, anon, authenticated;
revoke all on function public.mark_order_paid(text, bigint) from public, anon, authenticated;
grant execute on function public.apply_stock_for_order(uuid) to service_role;
grant execute on function public.mark_order_paid(text, bigint) to service_role;
