-- File RAB opsional: kolom file boleh NULL (aman dijalankan ulang)
alter table public.pengajuan alter column file_name drop not null;
alter table public.pengajuan alter column file_url drop not null;
alter table public.pengajuan alter column storage_path drop not null;
alter table public.pengajuan alter column file_type drop not null;
alter table public.pengajuan alter column file_size drop not null;
