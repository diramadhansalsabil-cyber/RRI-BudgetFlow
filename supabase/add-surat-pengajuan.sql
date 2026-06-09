-- Kolom file surat pengajuan (terpisah dari file RAB)
alter table public.pengajuan add column if not exists surat_file_name text;
alter table public.pengajuan add column if not exists surat_file_url text;
alter table public.pengajuan add column if not exists surat_storage_path text;
alter table public.pengajuan add column if not exists surat_file_type text;
alter table public.pengajuan add column if not exists surat_file_size bigint;
