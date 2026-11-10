-- All file lifecycle tests use temporary metadata/object doubles, not real Storage files.
create temporary table cv_people(id uuid primary key);
create temporary table cv_roles(user_id uuid,role text);
create temporary table cv_objects(bucket_id text,name text,metadata jsonb);
create temporary table cv_probe(like ichikara.interpreter_cvs including all) on commit drop;
alter table cv_probe add foreign key(interpreter_id) references cv_people(id) on delete restrict;
create or replace function pg_temp.finalize_cv_probe(p_cv_id uuid)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_person uuid; v_cv pg_temp.cv_probe;
begin
  select interpreter_id into v_person from pg_temp.cv_probe where id=p_cv_id;
  if v_person is null then raise exception 'Unggahan CV tidak ditemukan.'; end if;
  perform id from pg_temp.cv_people where id=v_person for update;
  select * into v_cv from pg_temp.cv_probe where id=p_cv_id for update;
  if not found then raise exception 'Unggahan CV tidak ditemukan.'; end if;
  if v_cv.state='ready' then return p_cv_id; end if;
  if v_cv.state<>'pending' then raise exception 'Status unggahan CV tidak valid.'; end if;
  if not exists(select 1 from pg_temp.cv_roles where user_id=v_cv.uploaded_by and role='manajemen') then
    raise exception using errcode='42501',message='Akses manajemen diperlukan.';
  end if;
  if not exists(select 1 from pg_temp.cv_objects where bucket_id='ichikara-interpreter-cvs' and name=v_cv.storage_path
      and (metadata->>'size')::bigint=v_cv.byte_size and metadata->>'mimetype'='application/pdf') then
    raise exception 'File CV belum tersimpan lengkap.';
  end if;
  update pg_temp.cv_probe set is_active=false where interpreter_id=v_person and is_active;
  update pg_temp.cv_probe set state='ready',is_active=true,uploaded_at=statement_timestamp() where id=p_cv_id;
  return p_cv_id;
end;
$$;
create or replace function pg_temp.delete_cv_probe(p_cv_id uuid,p_completed_upload boolean default false)
returns text language plpgsql security invoker set search_path='' as $$
declare v_person uuid; v_cv pg_temp.cv_probe;
begin
  select interpreter_id into v_person from pg_temp.cv_probe where id=p_cv_id;
  if v_person is null then return null; end if;
  perform id from pg_temp.cv_people where id=v_person for update;
  select * into v_cv from pg_temp.cv_probe where id=p_cv_id for update;
  if not found then return null; end if;
  if v_cv.state='pending' and v_cv.created_at>now()-interval '10 minutes' and not p_completed_upload then
    raise exception 'Unggahan masih diproses. Coba bersihkan kembali setelah 10 menit.';
  end if;
  update pg_temp.cv_probe set state='deleting',is_active=false where id=p_cv_id;
  if not exists(select 1 from pg_temp.cv_probe where interpreter_id=v_person and is_active) then
    update pg_temp.cv_probe set is_active=true where id=(
      select id from pg_temp.cv_probe where interpreter_id=v_person and state='ready' order by uploaded_at desc,id desc limit 1
    );
  end if;
  return v_cv.storage_path;
end;
$$;

do $$
declare person uuid:=gen_random_uuid(); actor uuid:=gen_random_uuid(); first_id uuid:=gen_random_uuid();
  second_id uuid:=gen_random_uuid(); duplicate_id uuid:=gen_random_uuid(); missing_id uuid:=gen_random_uuid(); path text;
begin
  insert into cv_people values(person);insert into cv_roles values(actor,'manajemen');
  insert into cv_probe(id,interpreter_id,storage_path,original_name,byte_size,mime_type,sha256,uploaded_by)
    values(first_id,person,person::text||'/'||first_id::text||'.pdf','履歴書 2026.pdf',8,'application/pdf',repeat('a',64),actor);
  insert into cv_objects values('ichikara-interpreter-cvs',person::text||'/'||first_id::text||'.pdf','{"size":8,"mimetype":"application/pdf"}');
  perform pg_temp.finalize_cv_probe(first_id);
  if not exists(select 1 from cv_probe where id=first_id and state='ready' and is_active) then raise exception 'Initial activation failed';end if;
  insert into cv_probe(id,interpreter_id,storage_path,original_name,byte_size,mime_type,sha256,uploaded_by)
    values(second_id,person,person::text||'/'||second_id::text||'.pdf','CV update.pdf',8,'application/pdf',repeat('b',64),actor);
  insert into cv_objects values('ichikara-interpreter-cvs',person::text||'/'||second_id::text||'.pdf','{"size":8,"mimetype":"application/pdf"}');
  perform pg_temp.finalize_cv_probe(second_id);
  if (select count(*) from cv_probe where is_active)<>1 or exists(select 1 from cv_probe where id=first_id and is_active) then raise exception 'Replace must preserve history and one active';end if;
  insert into cv_probe(id,interpreter_id,storage_path,original_name,byte_size,mime_type,sha256,uploaded_by)
    values(duplicate_id,person,person::text||'/'||duplicate_id::text||'.pdf','same contents.pdf',8,'application/pdf',repeat('b',64),actor);
  insert into cv_objects values('ichikara-interpreter-cvs',person::text||'/'||duplicate_id::text||'.pdf','{"size":8,"mimetype":"application/pdf"}');
  begin perform pg_temp.finalize_cv_probe(duplicate_id);raise exception 'Duplicate must be rejected';exception when unique_violation then null;end;
  if not exists(select 1 from cv_probe where id=second_id and is_active) then raise exception 'Duplicate replaced active CV';end if;
  begin perform pg_temp.delete_cv_probe(duplicate_id);raise exception 'Pending upload must be protected';exception when raise_exception then if sqlerrm not like '%10 menit%' then raise;end if;end;
  path:=pg_temp.delete_cv_probe(duplicate_id,true);
  if path<>person::text||'/'||duplicate_id::text||'.pdf' then raise exception 'Incorrect cleanup path';end if;
  delete from cv_probe where id=duplicate_id and state='deleting';
  path:=pg_temp.delete_cv_probe(second_id);
  if not exists(select 1 from cv_probe where id=first_id and is_active) then raise exception 'Delete active must restore available previous version';end if;
  delete from cv_probe where id=second_id and state='deleting';
  insert into cv_probe(id,interpreter_id,storage_path,original_name,byte_size,mime_type,sha256,uploaded_by)
    values(missing_id,person,person::text||'/'||missing_id::text||'.pdf','incomplete.pdf',8,'application/pdf',repeat('c',64),actor);
  begin perform pg_temp.finalize_cv_probe(missing_id);raise exception 'Missing object must not activate';exception when raise_exception then if sqlerrm<>'File CV belum tersimpan lengkap.' then raise;end if;end;
  if not exists(select 1 from cv_probe where id=first_id and is_active) then raise exception 'Failed upload removed previous version';end if;
  update cv_probe set created_at=now()-interval '11 minutes' where id=missing_id;
  perform pg_temp.delete_cv_probe(missing_id);
  begin delete from cv_people where id=person;raise exception 'Interpreter removal must require CV cleanup';exception when foreign_key_violation then null;end;
  delete from cv_probe;delete from cv_people where id=person;
end $$;
-- Test actual metadata RLS with an uncommitted pending row; no file is uploaded.
create temporary table cv_rls_context as select gen_random_uuid() cv_id,
  (select id from ichikara.interpreters order by id limit 1) person,
  (select user_id from ichikara.user_roles where role='manajemen' limit 1) manager,
  (select user_id from ichikara.user_roles where role<>'manajemen' limit 1) other_user;
grant select on cv_rls_context to authenticated;
do $$ begin execute format('grant usage on schema %I to authenticated',pg_my_temp_schema()::regnamespace);end $$;
insert into ichikara.interpreter_cvs(id,interpreter_id,storage_path,original_name,byte_size,mime_type,sha256)
  select cv_id,person,person::text||'/'||cv_id::text||'.pdf','QA RLS pending.pdf',8,'application/pdf',repeat('d',64) from cv_rls_context;
select set_config('request.jwt.claims',jsonb_build_object('sub',manager,'role','authenticated')::text,true) from cv_rls_context;
set local role authenticated;
do $$ begin
  if (select count(*) from ichikara.interpreter_cvs where id=(select cv_id from cv_rls_context))<>1 then raise exception 'Manager must read CV metadata';end if;
  if has_table_privilege(current_user,'ichikara.interpreter_cvs','INSERT') or has_function_privilege(current_user,'ichikara.finalize_interpreter_cv(uuid)','EXECUTE') then raise exception 'Client must not bypass server';end if;
  begin insert into storage.objects(bucket_id,name) values('ichikara-interpreter-cvs','forbidden-direct-upload.pdf');raise exception 'Direct Storage upload must fail';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',other_user,'role','authenticated')::text,true) from cv_rls_context;
set local role authenticated;
do $$ begin
  if exists(select 1 from ichikara.interpreter_cvs where id=(select cv_id from cv_rls_context)) then raise exception 'Non-management must not read CV metadata';end if;
end $$;
reset role;
delete from ichikara.interpreter_cvs where id=(select cv_id from cv_rls_context);
select set_config('request.jwt.claims','{}',true);
