-- Perbaikan error: column "jenis" of relation "template_folders" does not exist
-- Jalankan script ini jika template_folders sudah dibuat tanpa kolom jenis

alter table public.template_folders add column if not exists jenis text;
update public.template_folders set jenis = 'rab' where jenis is null or jenis = '';
alter table public.template_folders alter column jenis set default 'rab';
alter table public.template_folders alter column jenis set not null;

alter table public.template_folders drop constraint if exists template_folders_jenis_check;
alter table public.template_folders add constraint template_folders_jenis_check
  check (jenis in ('rab', 'surat_pengajuan'));

alter table public.template_files drop constraint if exists template_files_jenis_file_check;
alter table public.template_files add constraint template_files_jenis_file_check
  check (jenis_file in ('pdf', 'xls', 'xlsx', 'doc', 'docx'));

insert into public.template_folders (nama, jenis)
select x.nama, x.jenis from (values
  ('Template RAB Operasional', 'rab'),
  ('Template RAB Kegiatan', 'rab'),
  ('Template RAB Pengadaan Barang', 'rab'),
  ('Template RAB Perjalanan Dinas', 'rab'),
  ('Template Surat Pengajuan Anggaran', 'surat_pengajuan'),
  ('Template Surat Pengajuan Kegiatan', 'surat_pengajuan')
) as x(nama, jenis)
where not exists (
  select 1 from public.template_folders f where f.nama = x.nama and f.jenis = x.jenis
);

select nama, jenis from public.template_folders order by jenis, nama;
