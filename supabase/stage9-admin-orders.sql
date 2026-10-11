-- Tapvane database, Stage 9: admin order handling.
-- Run AFTER stage8-checkout.sql. Paste this whole file into Supabase > SQL Editor > New query > Run.
-- It is safe to run more than once.

-- Putting stock back when a paid order is cancelled (internal helper).
create or replace function public.restore_stock_for_order(p_order uuid)
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
  if not found or not v_order.stock_applied then return; end if;
  for v_line in select value from jsonb_array_elements(v_order.items) loop
    update public.stock
       set quantity = quantity + (v_line ->> 'cards_included')::integer * (v_line ->> 'quantity')::integer
     where item_type = (v_line ->> 'item_type') and quantity is not null;
  end loop;
  update public.orders set stock_applied = false where id = p_order;
end;
$$;

revoke all on function public.restore_stock_for_order(uuid) from public, anon, authenticated;
grant execute on function public.restore_stock_for_order(uuid) to service_role;

-- The ONE way admin changes an order's status. Only admins can call it. It also takes care of:
--   * recording when the order was paid,
--   * taking cards/tags out of stock the first time an order counts as paid,
--   * putting them back if a paid order is cancelled.
create or replace function public.admin_set_order_status(p_order uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if p_status not in ('awaiting_payment', 'awaiting_confirmation', 'paid', 'in_production',
                      'ready_for_pickup', 'shipped', 'delivered', 'cancelled') then
    raise exception 'status_invalid';
  end if;

  select * into v_order from public.orders where id = p_order for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_order.status = p_status then return; end if;

  if p_status in ('paid', 'in_production', 'ready_for_pickup', 'shipped', 'delivered')
     and v_order.status in ('awaiting_payment', 'awaiting_confirmation', 'cancelled') then
    update public.orders set paid_at = coalesce(paid_at, now()) where id = p_order;
    perform public.apply_stock_for_order(p_order);
  end if;

  if p_status = 'cancelled' then
    perform public.restore_stock_for_order(p_order);
  end if;

  update public.orders set status = p_status where id = p_order;
end;
$$;

revoke all on function public.admin_set_order_status(uuid, text) from public, anon;
grant execute on function public.admin_set_order_status(uuid, text) to authenticated;
