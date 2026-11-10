begin;
create table if not exists ichikara.interpreter_cvs (
  id uuid primary key,
  interpreter_id uuid not null references ichikara.interpreters(id) on delete restrict,
  storage_path text not null unique,
  original_name text not null check(char_length(original_name) between 1 and 240),
  byte_size bigint not null check(byte_size between 1 and 5242880),
  mime_type text not null check(mime_type='application/pdf'),
  sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
  state text not null default 'pending' check(state in ('pending','ready','deleting')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references auth.users(id) on delete set null,
  check(not is_active or state='ready'),
  check(storage_path=interpreter_id::text||'/'||id::text||'.pdf')
);
create unique index if not exists interpreter_cvs_one_active on ichikara.interpreter_cvs(interpreter_id) where is_active;
create unique index if not exists interpreter_cvs_unique_ready_file on ichikara.interpreter_cvs(interpreter_id,sha256) where state='ready';
create index if not exists interpreter_cvs_history on ichikara.interpreter_cvs(interpreter_id,uploaded_at desc);
create index if not exists interpreter_cvs_uploaded_by on ichikara.interpreter_cvs(uploaded_by);
alter table ichikara.interpreter_cvs enable row level security;
revoke all on ichikara.interpreter_cvs from public,anon,authenticated;
grant select on ichikara.interpreter_cvs to authenticated;
grant select,insert,update,delete on ichikara.interpreter_cvs to service_role;
drop policy if exists management_reads_interpreter_cvs on ichikara.interpreter_cvs;
create policy management_reads_interpreter_cvs on ichikara.interpreter_cvs for select to authenticated
  using ((select ichikara.is_management()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('ichikara-interpreter-cvs','ichikara-interpreter-cvs',false,5242880,array['application/pdf'])
on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['application/pdf'];
drop policy if exists management_reads_ready_interpreter_cvs on storage.objects;
create policy management_reads_ready_interpreter_cvs on storage.objects for select to authenticated
using(bucket_id='ichikara-interpreter-cvs' and (select ichikara.is_management()) and exists(
  select 1 from ichikara.interpreter_cvs c where c.storage_path=name and c.state='ready'
));
-- No authenticated INSERT/UPDATE/DELETE storage policy: writes go through the server.
create or replace function ichikara.finalize_interpreter_cv(p_cv_id uuid)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_person uuid; v_cv ichikara.interpreter_cvs;
begin
  select interpreter_id into v_person from ichikara.interpreter_cvs where id=p_cv_id;
  if v_person is null then raise exception 'Unggahan CV tidak ditemukan.'; end if;
  perform id from ichikara.interpreters where id=v_person for update;
  select * into v_cv from ichikara.interpreter_cvs where id=p_cv_id for update;
  if not found then raise exception 'Unggahan CV tidak ditemukan.'; end if;
  if v_cv.state='ready' then return p_cv_id; end if;
  if v_cv.state<>'pending' then raise exception 'Status unggahan CV tidak valid.'; end if;
  if not exists(select 1 from ichikara.user_roles where user_id=v_cv.uploaded_by and role='manajemen') then
    raise exception using errcode='42501',message='Akses manajemen diperlukan.';
  end if;
  if not exists(select 1 from storage.objects where bucket_id='ichikara-interpreter-cvs' and name=v_cv.storage_path
      and (metadata->>'size')::bigint=v_cv.byte_size and metadata->>'mimetype'='application/pdf') then
    raise exception 'File CV belum tersimpan lengkap.';
  end if;
  update ichikara.interpreter_cvs set is_active=false where interpreter_id=v_person and is_active;
  update ichikara.interpreter_cvs set state='ready',is_active=true,uploaded_at=statement_timestamp() where id=p_cv_id;
  return p_cv_id;
end;
$$;
create or replace function ichikara.begin_delete_interpreter_cv(p_cv_id uuid,p_completed_upload boolean default false)
returns text language plpgsql security invoker set search_path='' as $$
declare v_person uuid; v_cv ichikara.interpreter_cvs;
begin
  select interpreter_id into v_person from ichikara.interpreter_cvs where id=p_cv_id;
  if v_person is null then return null; end if;
  perform id from ichikara.interpreters where id=v_person for update;
  select * into v_cv from ichikara.interpreter_cvs where id=p_cv_id for update;
  if not found then return null; end if;
  if v_cv.state='pending' and v_cv.created_at>now()-interval '10 minutes' and not p_completed_upload then
    raise exception 'Unggahan masih diproses. Coba bersihkan kembali setelah 10 menit.';
  end if;
  update ichikara.interpreter_cvs set state='deleting',is_active=false where id=p_cv_id;
  if not exists(select 1 from ichikara.interpreter_cvs where interpreter_id=v_person and is_active) then
    update ichikara.interpreter_cvs set is_active=true where id=(
      select id from ichikara.interpreter_cvs where interpreter_id=v_person and state='ready' order by uploaded_at desc,id desc limit 1
    );
  end if;
  return v_cv.storage_path;
end;
$$;
revoke all on function ichikara.finalize_interpreter_cv(uuid) from public,anon,authenticated;
revoke all on function ichikara.begin_delete_interpreter_cv(uuid,boolean) from public,anon,authenticated;
grant execute on function ichikara.finalize_interpreter_cv(uuid) to service_role;
grant execute on function ichikara.begin_delete_interpreter_cv(uuid,boolean) to service_role;
do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='ichikara' and tablename='interpreter_cvs') then
    alter publication supabase_realtime add table ichikara.interpreter_cvs;
  end if;
end $$;
commit;
