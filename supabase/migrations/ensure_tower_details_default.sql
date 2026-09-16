-- `tower_details` stores per-tower attributes (e.g. trash chute availability)
-- as a JSON object keyed by tower slot, e.g.:
--   { "tower-1": { "hasTrashChute": true }, "tower-2": { "hasTrashChute": false } }
--
-- The column already exists on `properties`; this migration only guarantees
-- it has a safe default and backfills any existing NULLs, so it's a no-op if
-- the column was already set up this way.
alter table public.properties
  alter column tower_details set default '{}'::jsonb;

update public.properties
set tower_details = '{}'::jsonb
where tower_details is null;

alter table public.properties
  alter column tower_details set not null;
