-- Deploy the previous frontend first. Regular dates remain as ordinary project events.
begin;
drop function if exists ichikara.public_display_calendar_v3(date,date);
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
    case when new.order_id is distinct from old.order_id then 'order_id' end
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

alter table ichikara.events drop constraint if exists events_project_regular_no_overlap;
alter table ichikara.events drop constraint if exists events_regular_no_overlap;
alter table ichikara.events drop constraint if exists events_regular_series_type_check;
alter table ichikara.events drop constraint if exists events_schedule_type_check;
drop index if exists ichikara.events_regular_series_date;
alter table ichikara.events drop column if exists regular_series_id;
alter table ichikara.events drop column if exists schedule_type;
-- Keep shared btree_gist installed; do not disturb other schemas/dependencies.
commit;
