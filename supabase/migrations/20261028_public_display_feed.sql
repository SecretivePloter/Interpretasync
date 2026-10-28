-- Public read-only feed for the SEIRI display page.
-- Keep the output to the minimum fields approved for signage.
create or replace function ichikara.public_display_schedule(
  p_from date,
  p_to date
)
returns table (
  tanggal date,
  jam_mulai time,
  jam_selesai time,
  nama text
)
language plpgsql
stable
security definer
set search_path = ichikara, pg_temp
as $$
begin
  if p_from is null or p_to is null or p_to < p_from
     or p_from < date_trunc('week', now() at time zone 'Asia/Jakarta')::date
     or p_to > date_trunc('week', now() at time zone 'Asia/Jakarta')::date + 6 then
    raise exception 'Rentang display tidak valid';
  end if;

  return query
  select e.date, e.start_time, e.end_time, i.name
  from ichikara.events e
  join ichikara.interpreters i on i.id = e.interpreter_id
  where e.date between p_from and p_to
  order by e.date, e.start_time, i.name;
end;
$$;

revoke all on function ichikara.public_display_schedule(date, date) from public;
grant execute on function ichikara.public_display_schedule(date, date) to anon, authenticated;
