-- Roll back the frontend/disable the Edge Function first.
-- Do not discard CV metadata while private files/versions exist.
begin;
do $$ begin
  if to_regclass('ichikara.interpreter_cvs') is not null then
    if exists(select 1 from ichikara.interpreter_cvs) then
      raise exception 'Hapus semua versi CV melalui aplikasi sebelum rollback skema CV.';
    end if;
  end if;
  if exists(select 1 from storage.objects where bucket_id='ichikara-interpreter-cvs') then
    raise exception 'Bersihkan file bucket melalui Storage API sebelum rollback.';
  end if;
end $$;
drop policy if exists management_reads_ready_interpreter_cvs on storage.objects;
drop function if exists ichikara.finalize_interpreter_cv(uuid);
drop function if exists ichikara.begin_delete_interpreter_cv(uuid,boolean);
drop table if exists ichikara.interpreter_cvs;
delete from storage.buckets where id='ichikara-interpreter-cvs';
commit;
