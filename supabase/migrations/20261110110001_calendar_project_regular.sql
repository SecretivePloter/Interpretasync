-- Existing events become project by a constant default, without UPDATE/backfill.
begin;
create extension if not exists btree_gist with schema extensions;
alter table ichikara.events add column if not exists schedule_type text not null default 'project';
alter table ichikara.events add column if not exists regular_series_id uuid;
do $$
declare extension_schema text;
begin
  if not exists (select 1 from pg_constraint where conrelid='ichikara.events'::regclass and conname='events_schedule_type_check') then
    alter table ichikara.events add constraint events_schedule_type_check check (schedule_type in ('project','reguler'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid='ichikara.events'::regclass and conname='events_regular_series_type_check') then
    alter table ichikara.events add constraint events_regular_series_type_check check (regular_series_id is null or schedule_type='reguler');
  end if;
  select n.nspname into extension_schema from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='btree_gist';
  -- Same type project/project remains allowed, preserving current operations.
  -- The <> operator blocks ONLY the pair project/reguler, in either order.
  if not exists (select 1 from pg_constraint where conrelid='ichikara.events'::regclass and conname='events_project_regular_no_overlap') then
    execute format($ddl$alter table ichikara.events add constraint events_project_regular_no_overlap
      exclude using gist (
        interpreter_id %I.gist_uuid_ops with =,
        tsrange(date + start_time, date + end_time, '[)') with &&,
        schedule_type %I.gist_text_ops with <>
      ) where (interpreter_id <> '6d846630-b7a3-4f17-9399-524b407166ae'::uuid)$ddl$,extension_schema,extension_schema);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='ichikara.events'::regclass and conname='events_regular_no_overlap') then
    execute format($ddl$alter table ichikara.events add constraint events_regular_no_overlap
      exclude using gist (
        interpreter_id %I.gist_uuid_ops with =,
        tsrange(date + start_time, date + end_time, '[)') with &&
      ) where (schedule_type='reguler' and interpreter_id <> '6d846630-b7a3-4f17-9399-524b407166ae'::uuid)$ddl$,extension_schema);
  end if;
end $$;
create unique index if not exists events_regular_series_date on ichikara.events(regular_series_id,date) where regular_series_id is not null;
create or replace function ichikara.track_calendar_change()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  changed text[];
begin
  if tg_op = 'INSERT' then
    new.calendar_changed_at := statement_timestamp();
    new.calendar_change_fields := array['created']::text[];
    return new;
  end if;
  changed := array_remove(array[
    case when btrim(coalesce(new.title, '')) is distinct from btrim(coalesce(old.title, '')) then 'title' end,
    case when new.date is distinct from old.date then 'date' end,
    case when new.start_time is distinct from old.start_time then 'start_time' end,
    case when new.end_time is distinct from old.end_time then 'end_time' end,
    case when new.interpreter_id is distinct from old.interpreter_id then 'interpreter_id' end,
    case when btrim(coalesce(new.company, '')) is distinct from btrim(coalesce(old.company, '')) then 'company' end,
    case when btrim(coalesce(new.location, '')) is distinct from btrim(coalesce(old.location, '')) then 'location' end,
    case when new.order_id is distinct from old.order_id then 'order_id' end,
    case when new.schedule_type is distinct from old.schedule_type then 'schedule_type' end
  ]::text[], null);
  if cardinality(changed) > 0 then
    new.calendar_changed_at := statement_timestamp();
    new.calendar_change_fields := changed;
  else
    -- Ignore client-supplied metadata and notes-only/no-op changes.
    new.calendar_changed_at := old.calendar_changed_at;
    new.calendar_change_fields := old.calendar_change_fields;
  end if;
  return new;
end;
$$;

revoke all on function ichikara.track_calendar_change() from public, anon, authenticated;

-- Keep v1/v2 intact. Only schedule_type is added to the sanitized public feed.
create or replace function ichikara.public_display_calendar_v3(p_from date,p_to date)
returns table (
  id uuid,title text,date date,interpreter_id uuid,start_time time,end_time time,
  calendar_changed_at timestamptz,calendar_change_fields text[],schedule_type text
)
language sql stable security definer set search_path='' as $$
  select c.id,c.title,c.date,c.interpreter_id,c.start_time,c.end_time,
    c.calendar_changed_at,c.calendar_change_fields,e.schedule_type
  from ichikara.public_display_calendar_v2(p_from,p_to) c
  join ichikara.events e on e.id=c.id
  order by c.date,c.start_time,c.id;
$$;
revoke all on function ichikara.public_display_calendar_v3(date,date) from public;
grant execute on function ichikara.public_display_calendar_v3(date,date) to anon,authenticated;
comment on column ichikara.events.schedule_type is 'Calendar classification only. Does not replace WhatsApp schedule_assignments.jenis.';
comment on column ichikara.events.regular_series_id is 'Groups materialized daily regular events; edit/delete applies to one date.';
commit;
