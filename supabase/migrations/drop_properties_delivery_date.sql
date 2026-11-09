-- Removes the project-level "Fecha de entrega" (`properties.delivery_date`).
-- The app now derives it from the towers: the latest `deliveryDate` in
-- `properties.tower_details` (the last tower to be delivered).
--
-- Step 1 keeps the old dates from being lost: every tower (1..tower_count)
-- that has no `deliveryDate` of its own gets the property's old date. Towers
-- that already have a date are left as they are. Properties without
-- `tower_count` have no towers to copy into, so their old date is dropped.

begin;

update public.properties p
set tower_details = p.tower_details || (
  select jsonb_object_agg(t.key, t.detail)
  from (
    select
      'tower-' || n as key,
      (case
         when jsonb_typeof(p.tower_details -> ('tower-' || n)) = 'object' then p.tower_details -> ('tower-' || n)
         else '{"hasTrashChute": false, "elevatorCount": 0}'::jsonb
       end)
      || jsonb_build_object('deliveryDate', to_char(p.delivery_date::date, 'YYYY-MM-DD')) as detail
    from generate_series(1, p.tower_count) as n
    where coalesce(p.tower_details -> ('tower-' || n) ->> 'deliveryDate', '') = ''
  ) t
)
where p.delivery_date is not null
  and p.tower_count > 0
  and exists (
    select 1
    from generate_series(1, p.tower_count) as n
    where coalesce(p.tower_details -> ('tower-' || n) ->> 'deliveryDate', '') = ''
  );

-- Step 2: drop the column.
alter table public.properties drop column if exists delivery_date;

commit;
