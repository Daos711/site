-- Dedicated manual tracker log. No existing tables or policies are changed.
-- Apply once through a trusted migration runner; never from a browser client.
begin;
create table public.trophy_events (
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  primary key (owner_id, event_id),
  constraint trophy_event_object check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 65536),
  constraint trophy_event_required check (payload ?& array['id','deviceId','gameId','runId','entityId','field','kind','value','clock','parents','createdAt']),
  constraint trophy_event_id check (jsonb_typeof(payload->'id') = 'string' and (payload->>'id')::uuid = event_id),
  constraint trophy_device_id check (jsonb_typeof(payload->'deviceId') = 'string' and (payload->>'deviceId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint trophy_game_id check (jsonb_typeof(payload->'gameId') = 'string' and (payload->>'gameId') ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  constraint trophy_run_id check (payload->'runId' = 'null'::jsonb or (jsonb_typeof(payload->'runId') = 'string' and length(payload->>'runId') between 1 and 128)),
  constraint trophy_entity_field check (jsonb_typeof(payload->'entityId') = 'string' and length(payload->>'entityId') between 1 and 256 and jsonb_typeof(payload->'field') = 'string' and length(payload->>'field') between 1 and 256),
  constraint trophy_event_kind check (jsonb_typeof(payload->'kind') = 'string' and payload->>'kind' in ('set','increment')),
  constraint trophy_event_clock check (jsonb_typeof(payload->'clock') = 'number' and (payload->>'clock') ~ '^[0-9]+$' and (payload->>'clock')::numeric between 1 and 9007199254740991),
  constraint trophy_event_parents check (jsonb_typeof(payload->'parents') = 'array' and jsonb_array_length(payload->'parents') <= 256),
  constraint trophy_event_increment check (payload->>'kind' <> 'increment' or (jsonb_typeof(payload->'value') = 'number' and abs((payload->>'value')::numeric) <= 9007199254740991 and jsonb_array_length(payload->'parents') = 0)),
  constraint trophy_event_timestamp check (jsonb_typeof(payload->'createdAt') = 'string' and length(payload->>'createdAt') between 10 and 40)
);
alter table public.trophy_events enable row level security;
revoke all on public.trophy_events from anon, authenticated;
grant select, insert on public.trophy_events to authenticated;
create policy trophy_events_select_own on public.trophy_events
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy trophy_events_insert_own on public.trophy_events
  for insert to authenticated with check ((select auth.uid()) = owner_id);
comment on table public.trophy_events is 'Private append-only manual trophy observations; not verified PSN achievements. Undo is a compensating event. No client UPDATE or DELETE.';
commit;
