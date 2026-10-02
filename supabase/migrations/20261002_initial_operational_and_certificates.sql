-- Ichikara Management System: backend baru tanpa modul keuangan.
-- Jalankan sekali pada SQL Editor project Supabase BARU, sebagai postgres/admin.
-- Setelah migration ini selesai, buat user admin di Authentication lalu jalankan
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'manajemen' FROM auth.users WHERE email = 'email-admin-anda';

create extension if not exists pgcrypto;

-- ─── Helpers RBAC ──────────────────────────────────────────────────────────

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('manajemen', 'operator')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_roles where user_id = auth.uid()
$$;

create or replace function public.is_management()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'manajemen'
$$;

create or replace function public.has_app_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('manajemen', 'operator')
$$;

grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_management() to authenticated;
grant execute on function public.has_app_role() to authenticated;

create policy "users read their own role"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

-- ─── Operasional ───────────────────────────────────────────────────────────

create table if not exists public.interpreters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color_key text not null default 'blue',
  specialties text[] not null default '{}',
  jlpt_level text,
  phone text,
  email text,
  line_id text,
  status text not null default 'aktif' check (status in ('aktif', 'non-aktif')),
  notes text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  interpreter_id uuid not null references public.interpreters(id) on delete cascade,
  client_name text not null,
  quotation_number text,
  date date not null,
  duration_hours numeric(8,2),
  fee_estimate numeric(14,2) not null default 0 check (fee_estimate >= 0),
  status text not null default 'quotation'
    check (status in ('quotation', 'waiting_for_approval', 'order', 'invoice', 'paid', 'complete', 'overdue')),
  estimated_payment_date date,
  paid_date date,
  whatsapp text,
  notes text,
  invoice_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  interpreter_id uuid not null references public.interpreters(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  date date not null,
  start_time time not null,
  end_time time not null,
  location text,
  company text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_valid_time check (end_time > start_time)
);

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create index if not exists orders_interpreter_date_idx on public.orders (interpreter_id, date desc);
create index if not exists events_interpreter_date_idx on public.events (interpreter_id, date, start_time);

-- ─── Inventaris ────────────────────────────────────────────────────────────

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  kode text unique not null,
  nama text not null,
  kategori text,
  tipe text not null default 'supplies' check (tipe in ('aset', 'supplies', 'properti')),
  satuan text not null default 'pcs',
  stok_saat_ini integer not null default 0 check (stok_saat_ini >= 0),
  stok_minimum integer not null default 0 check (stok_minimum >= 0),
  lokasi text,
  deskripsi text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  tipe text not null check (tipe in ('masuk', 'keluar')),
  jumlah integer not null check (jumlah > 0),
  keterangan text,
  tanggal date not null default current_date,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_maintenance (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  tanggal date not null,
  tipe_maintenance text,
  deskripsi text,
  biaya integer not null default 0 check (biaya >= 0),
  teknisi text,
  created_at timestamptz not null default now()
);

-- Dipakai service inventaris. Database menolak stok keluar yang melebihi stok tersedia.
create or replace function public.increment_stok(p_item_id uuid, p_delta integer)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.inventory_items
  set stok_saat_ini = stok_saat_ini + p_delta
  where id = p_item_id and stok_saat_ini + p_delta >= 0;

  if not found then
    raise exception 'Stok tidak cukup atau barang tidak ditemukan';
  end if;
end;
$$;
grant execute on function public.increment_stok(uuid, integer) to authenticated;

-- ─── Sertifikat ────────────────────────────────────────────────────────────

create table if not exists public.sertifikat (
  id uuid primary key default gen_random_uuid(),
  nomor text not null unique,
  nama_peserta text not null,
  ttl text,
  level text,
  lama text,
  predikat text,
  n1 numeric(6,2),
  n2 numeric(6,2),
  n3 numeric(6,2),
  n4 numeric(6,2),
  n5 numeric(6,2),
  lulus text,
  tgl_selesai text,
  tgl_terbit text,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Updated-at trigger ────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists interpreters_set_updated_at on public.interpreters;
create trigger interpreters_set_updated_at before update on public.interpreters
  for each row execute procedure public.set_updated_at();
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
  for each row execute procedure public.set_updated_at();
drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at before update on public.events
  for each row execute procedure public.set_updated_at();
drop trigger if exists inventory_items_set_updated_at on public.inventory_items;
create trigger inventory_items_set_updated_at before update on public.inventory_items
  for each row execute procedure public.set_updated_at();
drop trigger if exists sertifikat_set_updated_at on public.sertifikat;
create trigger sertifikat_set_updated_at before update on public.sertifikat
  for each row execute procedure public.set_updated_at();

-- ─── RLS ───────────────────────────────────────────────────────────────────

alter table public.interpreters enable row level security;
alter table public.orders enable row level security;
alter table public.events enable row level security;
alter table public.app_settings enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.inventory_maintenance enable row level security;
alter table public.sertifikat enable row level security;

create policy "management manages interpreters" on public.interpreters for all to authenticated
  using (public.is_management()) with check (public.is_management());
create policy "management manages orders" on public.orders for all to authenticated
  using (public.is_management()) with check (public.is_management());
create policy "management manages events" on public.events for all to authenticated
  using (public.is_management()) with check (public.is_management());
create policy "management manages settings" on public.app_settings for all to authenticated
  using (public.is_management()) with check (public.is_management());
create policy "app roles manage inventory items" on public.inventory_items for all to authenticated
  using (public.has_app_role()) with check (public.has_app_role());
create policy "app roles manage inventory transactions" on public.inventory_transactions for all to authenticated
  using (public.has_app_role()) with check (public.has_app_role());
create policy "app roles manage inventory maintenance" on public.inventory_maintenance for all to authenticated
  using (public.has_app_role()) with check (public.has_app_role());
create policy "management manages certificates" on public.sertifikat for all to authenticated
  using (public.is_management()) with check (public.is_management());

-- Certificate validator reads through an RPC, never through SELECT *.
create or replace function public.verify_certificate(p_nomor text)
returns table (
  nomor text, nama_peserta text, ttl text, level text, lama text, predikat text,
  n1 numeric, n2 numeric, n3 numeric, n4 numeric, n5 numeric, lulus text,
  tgl_selesai text, tgl_terbit text, photo_path text
)
language sql
stable
security definer
set search_path = public
as $$
  select nomor, nama_peserta, ttl, level, lama, predikat,
    n1, n2, n3, n4, n5, lulus, tgl_selesai, tgl_terbit, photo_path
  from public.sertifikat
  where nomor = trim(p_nomor)
  limit 1
$$;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- ─── Storage buckets and policies ──────────────────────────────────────────

insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', false),
  ('sertifikat_photos', 'sertifikat_photos', false),
  ('sertifikat_arsip', 'sertifikat_arsip', false)
on conflict (id) do update set public = excluded.public;

create policy "management manages application storage"
  on storage.objects for all to authenticated
  using (
    bucket_id in ('avatars', 'sertifikat_photos', 'sertifikat_arsip')
    and public.is_management()
  )
  with check (
    bucket_id in ('avatars', 'sertifikat_photos', 'sertifikat_arsip')
    and public.is_management()
  );

-- Realtime is intentionally limited to the operational tables used by Zustand.
alter publication supabase_realtime add table public.interpreters, public.orders, public.events;
