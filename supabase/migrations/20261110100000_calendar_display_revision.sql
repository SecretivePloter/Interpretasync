-- Public notification contains no event, interpreter, client, or personal data.
begin;
create table if not exists ichikara.calendar_display_revision (
  id boolean primary key default true check (id),
  revision bigint not null default 0
);
insert into ichikara.calendar_display_revision (id) values (true) on conflict (id) do nothing;
alter table ichikara.calendar_display_revision enable row level security;
revoke all on ichikara.calendar_display_revision from public, anon, authenticated;
grant select on ichikara.calendar_display_revision to anon, authenticated;
drop policy if exists calendar_display_revision_read on ichikara.calendar_display_revision;
create policy calendar_display_revision_read on ichikara.calendar_display_revision
  for select to anon, authenticated using (true);

-- Internal trigger only; fixed search_path and no caller-controlled SQL.
create or replace function ichikara.notify_calendar_display_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update ichikara.calendar_display_revision set revision = revision + 1 where id = true;
  return null;
end;
$$;
revoke all on function ichikara.notify_calendar_display_change() from public, anon, authenticated;
drop trigger if exists calendar_display_events_changed on ichikara.events;
create trigger calendar_display_events_changed after insert or update or delete on ichikara.events
  for each statement execute function ichikara.notify_calendar_display_change();
drop trigger if exists calendar_display_interpreters_changed on ichikara.interpreters;
create trigger calendar_display_interpreters_changed after insert or update or delete on ichikara.interpreters
  for each statement execute function ichikara.notify_calendar_display_change();
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
    and schemaname = 'ichikara' and tablename = 'calendar_display_revision') then
    alter publication supabase_realtime add table ichikara.calendar_display_revision;
  end if;
end $$;
commit;
