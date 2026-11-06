create function ichikara.review_interpreter_source(p_source_id uuid, p_interpreter_id uuid, p_kind text, p_data jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare s ichikara.interpreter_sources; result_id uuid;
begin
 if not ichikara.is_management() then raise exception 'Hanya akun manajemen dapat meninjau data'; end if;
 select * into s from ichikara.interpreter_sources where id=p_source_id for update;
 if not found then raise exception 'Sumber tidak ditemukan'; end if;
 if s.status <> 'pending' then raise exception 'Sumber sudah ditinjau. Muat ulang daftar.'; end if;
 if p_kind='experience' then
   insert into ichikara.interpreter_experiences(interpreter_id,company,project,year,status,notes,source)
   values(p_interpreter_id,trim(p_data->>'company'),trim(p_data->>'project'),nullif(p_data->>'year','')::integer,'reference',coalesce(p_data->>'notes',''),s.sheet||' baris '||s.row_number)
   returning id into result_id;
 elsif p_kind='rate' then
   insert into ichikara.interpreter_rates(interpreter_id,company,activity,unit,amount,currency,valid_from,notes,source)
   values(p_interpreter_id,coalesce(p_data->>'company',''),coalesce(p_data->>'project',''),p_data->>'unit',(p_data->>'amount')::numeric,p_data->>'currency',(p_data->>'valid_from')::date,coalesce(p_data->>'notes',''),s.sheet||' baris '||s.row_number)
   returning id into result_id;
 elsif p_kind not in ('ignored','reference') then raise exception 'Jenis tinjauan tidak valid';
 end if;
 update ichikara.interpreter_sources set status=case when p_kind='ignored' then 'ignored' else 'reviewed' end,
 interpreter_id=p_interpreter_id,review_notes=coalesce(p_data->>'notes',''),reviewed_at=now() where id=p_source_id;
 return result_id;
end $$;
revoke all on function ichikara.review_interpreter_source(uuid,uuid,text,jsonb) from public,anon;
grant execute on function ichikara.review_interpreter_source(uuid,uuid,text,jsonb) to authenticated;
notify pgrst, 'reload schema';
