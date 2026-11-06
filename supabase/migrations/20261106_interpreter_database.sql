-- Internal interpreter directory. Historical schedules are not proof of delivery.
create table ichikara.interpreter_experiences (
 id uuid primary key default gen_random_uuid(),
 interpreter_id uuid not null references ichikara.interpreters(id) on delete cascade,
 event_id uuid references ichikara.events(id) on delete set null,
 company text not null check (length(trim(company)) > 0),
 project text not null check (length(trim(project)) > 0),
 year integer check (year between 1900 and 2200),
 start_date date, end_date date,
 status text not null default 'reference' check (status in ('reference','confirmed','completed','cancelled')),
 rating integer check (rating between 1 and 5),
 notes text not null default '', source text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check (start_date is null or end_date is null or end_date >= start_date)
);
create unique index interpreter_experiences_event_unique on ichikara.interpreter_experiences(event_id) where event_id is not null;
create index interpreter_experiences_person on ichikara.interpreter_experiences(interpreter_id);
create index interpreter_experiences_company on ichikara.interpreter_experiences(lower(company));

create table ichikara.interpreter_rates (
 id uuid primary key default gen_random_uuid(),
 interpreter_id uuid not null references ichikara.interpreters(id) on delete cascade,
 company text not null default '', activity text not null default '',
 unit text not null check (unit in ('day','half_day','hour','month','session','event')),
 amount numeric(16,2) not null check (amount >= 0),
 currency text not null default 'IDR' check (currency in ('IDR','JPY','USD')),
 valid_from date not null default current_date, valid_to date,
 overtime_rate numeric(16,2) not null default 0 check (overtime_rate >= 0),
 transport numeric(16,2) not null default 0 check (transport >= 0),
 notes text not null default '', source text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check (valid_to is null or valid_to >= valid_from)
);
create index interpreter_rates_person on ichikara.interpreter_rates(interpreter_id);

create table ichikara.interpreter_fees (
 id uuid primary key default gen_random_uuid(),
 interpreter_id uuid not null references ichikara.interpreters(id) on delete cascade,
 company text not null, project text not null, date date not null,
 currency text not null default 'IDR' check (currency in ('IDR','JPY','USD')),
 unit text not null check (unit in ('day','half_day','hour','month','session','event')),
 quantity numeric(12,2) not null check (quantity > 0),
 rate numeric(16,2) not null check (rate >= 0),
 overtime_hours numeric(12,2) not null default 0 check (overtime_hours >= 0),
 overtime_rate numeric(16,2) not null default 0 check (overtime_rate >= 0),
 extras numeric(16,2) not null default 0 check (extras >= 0),
 deductions numeric(16,2) not null default 0 check (deductions >= 0),
 total numeric(18,2) generated always as (quantity*rate + overtime_hours*overtime_rate + extras - deductions) stored,
 payment_status text not null default 'draft' check (payment_status in ('draft','approved','paid')),
 notes text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check (quantity*rate + overtime_hours*overtime_rate + extras - deductions >= 0),
 check (length(trim(company))>0 and length(trim(project))>0)
);
create index interpreter_fees_person_date on ichikara.interpreter_fees(interpreter_id,date desc);

create table ichikara.interpreter_blocks (
 id uuid primary key default gen_random_uuid(),
 interpreter_id uuid not null references ichikara.interpreters(id) on delete cascade,
 start_date date not null, end_date date not null,
 reason text not null default '', created_at timestamptz not null default now(),
 check (end_date >= start_date)
);
create index interpreter_blocks_person_dates on ichikara.interpreter_blocks(interpreter_id,start_date,end_date);

create table ichikara.interpreter_sources (
 id uuid primary key default gen_random_uuid(),
 source_key text not null unique, sheet text not null, row_number integer not null,
 candidate_name text not null default '', raw_data jsonb not null,
 status text not null default 'pending' check (status in ('pending','reviewed','ignored')),
 interpreter_id uuid references ichikara.interpreters(id) on delete set null,
 review_notes text not null default '', reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create index interpreter_sources_status on ichikara.interpreter_sources(status,sheet);
create index interpreter_sources_person on ichikara.interpreter_sources(interpreter_id);

do $$ declare t text; begin
 foreach t in array array['interpreter_experiences','interpreter_rates','interpreter_fees','interpreter_blocks','interpreter_sources'] loop
 execute format('alter table ichikara.%I enable row level security',t);
 execute format('revoke all on ichikara.%I from anon',t);
 execute format('grant select,insert,update,delete on ichikara.%I to authenticated',t);
 execute format('create policy management_only on ichikara.%I for all to authenticated using ((select ichikara.is_management())) with check ((select ichikara.is_management()))',t);
 end loop;
 foreach t in array array['interpreter_experiences','interpreter_rates','interpreter_fees'] loop
 execute format('create trigger update_timestamp before update on ichikara.%I for each row execute function ichikara.set_updated_at()',t);
 end loop;
end $$;
notify pgrst, 'reload schema';
