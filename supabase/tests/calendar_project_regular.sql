-- Temporary schema copy: no production schedules inserted/updated/deleted.
create temporary table regular_probe (like ichikara.events including all) on commit drop;
create trigger regular_probe_track before insert or update on regular_probe
  for each row execute function ichikara.track_calendar_change();
do $$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); c uuid:=gen_random_uuid();
  d uuid:=gen_random_uuid(); row_id uuid; series uuid:=gen_random_uuid(); changed text[];
begin
  insert into regular_probe(title,interpreter_id,date,start_time,end_time) values
    ('legacy 1',a,'2026-11-02','09:00','12:00'),('legacy 2',a,'2026-11-02','10:00','11:00');
  if exists(select 1 from regular_probe where schedule_type<>'project') then raise exception 'Legacy default must be project'; end if;
  begin
    insert into regular_probe(title,interpreter_id,date,start_time,end_time,schedule_type) values('regular over project',a,'2026-11-02','11:00','13:00','reguler');
    raise exception 'Expected project/regular conflict';
  exception when exclusion_violation then null; end;
  insert into regular_probe(title,interpreter_id,date,start_time,end_time,schedule_type) values('regular first',b,'2026-11-02','09:00','12:00','reguler');
  begin
    insert into regular_probe(title,interpreter_id,date,start_time,end_time) values('project over regular',b,'2026-11-02','11:00','13:00');
    raise exception 'Expected regular/project conflict';
  exception when exclusion_violation then null; end;
  begin
    insert into regular_probe(title,interpreter_id,date,start_time,end_time,schedule_type) values('regular over regular',b,'2026-11-02','11:00','13:00','reguler');
    raise exception 'Expected regular/regular conflict';
  exception when exclusion_violation then null; end;
  -- Half-open intervals: exact adjacency is allowed.
  insert into regular_probe(title,interpreter_id,date,start_time,end_time,schedule_type) values('adjacent',b,'2026-11-02','12:00','14:00','reguler');
  insert into regular_probe(title,interpreter_id,date,start_time,end_time,schedule_type) values('other interpreter',c,'2026-11-02','09:00','12:00','reguler');
  -- Placeholder rows do not occupy a real interpreter.
  insert into regular_probe(title,interpreter_id,date,start_time,end_time,schedule_type) values
    ('placeholder regular','6d846630-b7a3-4f17-9399-524b407166ae','2026-11-02','09:00','12:00','reguler'),
    ('placeholder project','6d846630-b7a3-4f17-9399-524b407166ae','2026-11-02','09:00','12:00','project');
  -- A failed multi-row INSERT rolls back even its first non-conflicting row.
  begin
    insert into regular_probe(title,interpreter_id,date,start_time,end_time,schedule_type) values
      ('atomic batch first',b,'2026-11-03','09:00','12:00','project'),
      ('atomic batch blocked',b,'2026-11-02','09:00','12:00','project');
    raise exception 'Expected atomic batch rejection';
  exception when exclusion_violation then null; end;
  if exists(select 1 from regular_probe where title='atomic batch first') then raise exception 'Partial batch was saved'; end if;
  insert into regular_probe(title,interpreter_id,date,start_time,end_time) values('update probe',b,'2026-11-03','09:00','12:00') returning id into row_id;
  begin
    update regular_probe set date='2026-11-02' where id=row_id;
    raise exception 'Expected UPDATE conflict';
  exception when exclusion_violation then null; end;
  insert into regular_probe(title,interpreter_id,date,start_time,end_time) values('type change',d,'2026-11-02','09:00','12:00') returning id into row_id;
  update regular_probe set schedule_type='reguler',regular_series_id=series where id=row_id;
  select calendar_change_fields into changed from regular_probe where id=row_id;
  if not ('schedule_type'=any(changed)) then raise exception 'Type change must trigger star'; end if;
  begin
    insert into regular_probe(title,interpreter_id,date,start_time,end_time,schedule_type,regular_series_id)
    values('duplicate series date',gen_random_uuid(),'2026-11-02','15:00','16:00','reguler',series);
    raise exception 'Expected unique series/date rejection';
  exception when unique_violation then null; end;
  begin
    update regular_probe set schedule_type='invalid' where id=row_id;
    raise exception 'Expected invalid type rejection';
  exception when check_violation then null; end;
end $$;
set local role anon;
do $$ begin
  if exists(select 1 from ichikara.events) then raise exception 'Anonymous events access must remain closed'; end if;
  if exists(
    (select id,title,date,interpreter_id,start_time,end_time,calendar_changed_at,calendar_change_fields from ichikara.public_display_calendar_v3(current_date,current_date+30)
     except select * from ichikara.public_display_calendar_v2(current_date,current_date+30))
    union all
    (select * from ichikara.public_display_calendar_v2(current_date,current_date+30)
     except select id,title,date,interpreter_id,start_time,end_time,calendar_changed_at,calendar_change_fields from ichikara.public_display_calendar_v3(current_date,current_date+30))
  ) then raise exception 'Public v3 projection must preserve v2 rows'; end if;
end $$;
reset role;
