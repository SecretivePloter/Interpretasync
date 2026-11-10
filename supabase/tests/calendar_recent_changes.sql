-- Run inside a transaction after the migration, before commit.
-- Temporary copy only: no production schedules are inserted/updated/deleted.
create temporary table calendar_change_probe (like ichikara.events including defaults) on commit drop;
insert into calendar_change_probe select * from ichikara.events order by id limit 1;
update calendar_change_probe set calendar_changed_at = statement_timestamp() - interval '2 days',
  calendar_change_fields = array['created'], company = null, location = null;
create trigger probe_track_calendar_change before insert or update on calendar_change_probe
  for each row execute function ichikara.track_calendar_change();
do $$
declare r record; before_time timestamptz;
begin
  select calendar_changed_at into before_time from calendar_change_probe limit 1;
  if before_time is null then raise exception 'Probe needs one existing event'; end if;
  update calendar_change_probe set notes = coalesce(notes, '') || ' qa notes only',
    title = ' ' || title || ' ', company = '', location = '',
    calendar_changed_at = statement_timestamp(), calendar_change_fields = array['tampered'];
  select * into r from calendar_change_probe limit 1;
  if r.calendar_changed_at is distinct from before_time or r.calendar_change_fields <> array['created']::text[] then
    raise exception 'Notes/no-op/metadata tamper must not refresh star';
  end if;
  update calendar_change_probe set title = title || ' QA project', date = date + 1,
    start_time = start_time + interval '1 minute', end_time = end_time + interval '1 minute',
    interpreter_id = gen_random_uuid(), company = 'QA company', location = 'QA location', order_id = gen_random_uuid();
  select * into r from calendar_change_probe limit 1;
  if r.calendar_changed_at <= before_time or r.calendar_change_fields <> array['title','date','start_time','end_time','interpreter_id','company','location','order_id']::text[] then
    raise exception 'All important fields must refresh star';
  end if;
  insert into calendar_change_probe(id,title,interpreter_id,date,start_time,end_time,calendar_changed_at,calendar_change_fields)
    values(gen_random_uuid(),'QA created',gen_random_uuid(),current_date,'09:00','10:00','2000-01-01',array['tampered']);
  select * into r from calendar_change_probe where title = 'QA created';
  if r.calendar_changed_at < statement_timestamp() - interval '1 second' or r.calendar_change_fields <> array['created']::text[] then
    raise exception 'Insert must stamp server-owned metadata';
  end if;
end $$;
-- Compare both RPCs with identical safe projection and validate anonymous access.
set local role anon;
do $$ begin
  if exists (
    (select id,title,date,interpreter_id,start_time,end_time from ichikara.public_display_calendar_v2(current_date,current_date+30)
     except select * from ichikara.public_display_calendar(current_date,current_date+30))
    union all
    (select * from ichikara.public_display_calendar(current_date,current_date+30)
     except select id,title,date,interpreter_id,start_time,end_time from ichikara.public_display_calendar_v2(current_date,current_date+30))
  ) then raise exception 'v2 must preserve safe public rows'; end if;
  if has_function_privilege('anon','ichikara.track_calendar_change()','EXECUTE') then
    raise exception 'Anonymous role must not call internal trigger';
  end if;
  begin
    perform * from ichikara.public_display_calendar_v2(current_date,current_date+43);
    raise exception 'Invalid range should be rejected';
  exception when raise_exception then
    if sqlerrm <> 'Rentang kalender display tidak valid' then raise; end if;
  end;
end $$;
reset role;
