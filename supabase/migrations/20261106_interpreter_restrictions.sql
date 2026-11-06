create table ichikara.interpreter_restrictions (
 id uuid primary key default gen_random_uuid(),
 interpreter_id uuid not null references ichikara.interpreters(id) on delete cascade,
 company text not null default '',
 reason text not null default '',
 source text not null default '',
 effective_date date not null default current_date,
 created_at timestamptz not null default now(),
 unique(interpreter_id,company)
);
create index interpreter_restrictions_person on ichikara.interpreter_restrictions(interpreter_id);
alter table ichikara.interpreter_restrictions enable row level security;
revoke all on ichikara.interpreter_restrictions from anon;
grant select,insert,update,delete on ichikara.interpreter_restrictions to authenticated;
create policy management_only on ichikara.interpreter_restrictions for all to authenticated
using ((select ichikara.is_management())) with check ((select ichikara.is_management()));
notify pgrst, 'reload schema';
