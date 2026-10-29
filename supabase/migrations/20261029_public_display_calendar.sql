-- Minimal anonymous read-only feed used by the public TV calendar.
-- No client, order, location, contact, or note fields are returned.
create or replace function ichikara.public_display_interpreters()
returns table (id uuid, name text, color_key text)
language sql
stable
security definer
set search_path = ichikara, pg_temp
as $$
  select i.id, i.name, i.color_key
  from ichikara.interpreters i
  order by i.name;
$$;

create or replace function ichikara.public_display_calendar(p_from date, p_to date)
returns table (
  id uuid,
  title text,
  date date,
  interpreter_id uuid,
  start_time time,
  end_time time
)
language plpgsql
stable
security definer
set search_path = ichikara, pg_temp
as $$
begin
  if p_from is null or p_to is null or p_to < p_from
     or p_to - p_from > 42
     or p_from < (now() at time zone 'Asia/Jakarta')::date - 366
     or p_to > (now() at time zone 'Asia/Jakarta')::date + 366 then
    raise exception 'Rentang kalender display tidak valid';
  end if;

  return query
  select e.id, e.title, e.date, e.interpreter_id, e.start_time, e.end_time
  from ichikara.events e
  join ichikara.interpreters i on i.id = e.interpreter_id
  where e.date between p_from and p_to
  order by e.date, e.start_time, i.name;
end;
$$;

revoke all on function ichikara.public_display_interpreters() from public;
revoke all on function ichikara.public_display_calendar(date, date) from public;
grant execute on function ichikara.public_display_interpreters() to anon, authenticated;
grant execute on function ichikara.public_display_calendar(date, date) to anon, authenticated;
