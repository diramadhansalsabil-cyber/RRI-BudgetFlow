-- RRI BudgetFlow v2 — Workflow dokumen (folder template + upload file)
-- Jalankan SETELAH schema.sql dasar (profiles, auth)

-- ─── Folder template ───
create table if not exists public.template_folders (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  jenis text not null default 'rab' check (jenis in ('rab', 'surat_pengajuan')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- ─── File dalam folder ───
create table if not exists public.template_files (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references public.template_folders (id) on delete cascade,
  nama_file text not null,
  storage_path text not null,
  public_url text not null,
  jenis_file text not null check (jenis_file in ('pdf', 'xls', 'xlsx', 'doc', 'docx')),
  ukuran_bytes bigint not null default 0,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_template_files_folder on public.template_files (folder_id);

-- Migrasi tabel lama: template_folders belum punya kolom jenis
alter table public.template_folders add column if not exists jenis text;
update public.template_folders set jenis = 'rab' where jenis is null or jenis = '';
alter table public.template_folders alter column jenis set default 'rab';
alter table public.template_folders alter column jenis set not null;
alter table public.template_folders drop constraint if exists template_folders_jenis_check;
alter table public.template_folders add constraint template_folders_jenis_check
  check (jenis in ('rab', 'surat_pengajuan'));

-- Migrasi: perluas tipe file template (doc/docx untuk surat pengajuan)
alter table public.template_files drop constraint if exists template_files_jenis_file_check;
alter table public.template_files add constraint template_files_jenis_file_check
  check (jenis_file in ('pdf', 'xls', 'xlsx', 'doc', 'docx'));

-- ─── Migrasi pengajuan ke model dokumen ───
alter table public.pengajuan drop constraint if exists pengajuan_template_id_fkey;
alter table public.pengajuan alter column template_id drop not null;
alter table public.pengajuan alter column data_rab drop not null;
alter table public.pengajuan alter column total_anggaran drop not null;

alter table public.pengajuan add column if not exists judul text;
alter table public.pengajuan add column if not exists nama_pengusul text;
alter table public.pengajuan add column if not exists divisi text;
alter table public.pengajuan add column if not exists keterangan text;
alter table public.pengajuan add column if not exists file_name text;
alter table public.pengajuan add column if not exists file_url text;
alter table public.pengajuan add column if not exists storage_path text;
alter table public.pengajuan add column if not exists file_type text;
alter table public.pengajuan add column if not exists file_size bigint;

-- Status revisi
alter table public.pengajuan drop constraint if exists pengajuan_status_check;
alter table public.pengajuan add constraint pengajuan_status_check
  check (status in ('pending', 'approved', 'rejected', 'revisi'));

-- ─── Log aktivitas ───
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id),
  user_nama text not null default '',
  user_role text not null default '',
  aktivitas text not null,
  detail text default '',
  meta jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_created on public.activity_logs (created_at desc);

-- ─── RLS ───
alter table public.template_folders enable row level security;
alter table public.template_files enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists "folders_select" on public.template_folders;
create policy "folders_select" on public.template_folders for select to authenticated using (true);

drop policy if exists "folders_admin_write" on public.template_folders;
create policy "folders_admin_write" on public.template_folders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tfiles_select" on public.template_files;
create policy "tfiles_select" on public.template_files for select to authenticated using (true);

drop policy if exists "tfiles_admin_write" on public.template_files;
create policy "tfiles_admin_write" on public.template_files for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "logs_select" on public.activity_logs;
create policy "logs_select" on public.activity_logs for select to authenticated
  using (public.is_admin() or user_id = auth.uid());

drop policy if exists "logs_insert" on public.activity_logs;
create policy "logs_insert" on public.activity_logs for insert to authenticated with check (true);

drop policy if exists "logs_admin_delete" on public.activity_logs;
create policy "logs_admin_delete" on public.activity_logs for delete to authenticated
  using (public.is_admin());

-- Pengajuan: user boleh update sendiri jika status revisi
drop policy if exists "pengajuan_update" on public.pengajuan;
create policy "pengajuan_update" on public.pengajuan for update to authenticated
  using (public.is_admin() or (user_id = auth.uid() and status = 'revisi'));

-- ─── Storage: rab-templates & rab-pengajuan ───
insert into storage.buckets (id, name, public)
values ('rab-templates', 'rab-templates', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('rab-pengajuan', 'rab-pengajuan', true)
on conflict (id) do update set public = true;

drop policy if exists "rab_tpl_read" on storage.objects;
create policy "rab_tpl_read" on storage.objects for select using (bucket_id = 'rab-templates');

drop policy if exists "rab_tpl_admin" on storage.objects;
create policy "rab_tpl_admin" on storage.objects for all to authenticated
  using (bucket_id = 'rab-templates' and public.is_admin())
  with check (bucket_id = 'rab-templates' and public.is_admin());

drop policy if exists "rab_pgj_read" on storage.objects;
create policy "rab_pgj_read" on storage.objects for select using (bucket_id = 'rab-pengajuan');

drop policy if exists "rab_pgj_upload" on storage.objects;
create policy "rab_pgj_upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'rab-pengajuan' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "rab_pgj_update" on storage.objects;
create policy "rab_pgj_update" on storage.objects for update to authenticated
  using (bucket_id = 'rab-pengajuan' and (storage.foldername(name))[1] = auth.uid()::text);

-- Folder contoh (abaikan jika sudah ada)
insert into public.template_folders (nama, jenis)
select x.nama, x.jenis from (values
  ('Template RAB Operasional', 'rab'),
  ('Template RAB Kegiatan', 'rab'),
  ('Template RAB Pengadaan Barang', 'rab'),
  ('Template RAB Perjalanan Dinas', 'rab'),
  ('Template Surat Pengajuan Anggaran', 'surat_pengajuan'),
  ('Template Surat Pengajuan Kegiatan', 'surat_pengajuan')
) as x(nama, jenis)
where not exists (select 1 from public.template_folders f where f.nama = x.nama and f.jenis = x.jenis);
