-- Additive metadata. Existing rows are not rewritten: created_at is the legacy baseline.
begin;
alter table ichikara.events add column if not exists calendar_changed_at timestamptz;
alter table ichikara.events add column if not exists calendar_change_fields text[];

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
revoke all on function ichikara.track_calendar_change() from public, anon, authenticated;
drop trigger if exists events_track_calendar_change on ichikara.events;
create trigger events_track_calendar_change before insert or update on ichikara.events
  for each row execute function ichikara.track_calendar_change();

-- New RPC keeps the old signature/return shape intact for existing consumers.
-- Same date-range limits and safe projection as the original public calendar.
create or replace function ichikara.public_display_calendar_v2(p_from date, p_to date)
returns table (
  id uuid, title text, date date, interpreter_id uuid, start_time time, end_time time,
  calendar_changed_at timestamptz, calendar_change_fields text[]
)
language sql stable security definer set search_path = '' as $$
  select c.id, c.title, c.date, c.interpreter_id, c.start_time, c.end_time,
    coalesce(e.calendar_changed_at, e.created_at),
    case when e.calendar_changed_at is null then array['created']::text[] else e.calendar_change_fields end
  from ichikara.public_display_calendar(p_from, p_to) c
  join ichikara.events e on e.id = c.id
  order by c.date, c.start_time, c.id;
$$;
revoke all on function ichikara.public_display_calendar_v2(date, date) from public;
grant execute on function ichikara.public_display_calendar_v2(date, date) to anon, authenticated;
comment on column ichikara.events.calendar_changed_at is 'Server timestamp of creation or last important calendar change; null legacy rows use created_at.';
comment on column ichikara.events.calendar_change_fields is 'Field names only, not old/new values; notes are excluded.';
commit;
