# Setup Supabase — RRI BudgetFlow (Workflow Dokumen)

## 1. Buat project Supabase

1. Buka [https://supabase.com](https://supabase.com) → **New project**
2. Catat **Project URL** dan **anon public key** (Settings → API)

## 2. Jalankan skema database

Di **SQL Editor**, jalankan berurutan:

1. `supabase/schema.sql` — tabel dasar (profiles, pengajuan, auth)
2. `supabase/schema-v2-documents.sql` — folder template, file template, log aktivitas, kolom dokumen pengajuan, bucket `rab-templates` & `rab-pengajuan`

Opsional (jika login bermasalah): `migrate-valid-emails.sql`, `fix-login-rpc.sql`

## 3. Storage

Skema v2 membuat bucket:

| Bucket | Fungsi |
|--------|--------|
| `rab-templates` | File template PDF/Excel (admin upload) |
| `rab-pengajuan` | File RAB hasil isi pengusul |

Pastikan kedua bucket **public** aktif di **Storage**.

## 4. Registrasi dari aplikasi (disarankan)

> **Jangan pakai** `@rri-budgetflow.local` — Supabase menolak domain `.local`.

### Pengaturan Supabase (wajib, sekali)

**Authentication → Providers → Email**

| Setting | Nilai |
|---------|--------|
| Enable Email | ON |
| Enable Signup | ON |
| **Confirm email** | **OFF** |
| Allowed email domains | kosong |

Jalankan juga: `schema-auth-v3.sql` dan `ensure-self-registration.sql`

### Alur pengguna

1. Buka aplikasi → pilih portal → **Daftar**
2. Isi nama, email, password (+ kode admin `LPPRRI_KENDARI` untuk portal admin)
3. Langsung masuk setelah daftar — profil dibuat otomatis oleh trigger

### Login

| Portal | URL |
|--------|-----|
| Admin | `#/login/admin` |
| Karyawan | `#/login/karyawan` |

Login pakai **email** atau **username**.

### Cadangan manual (opsional)

Jika rate limit email: `manual-register-users.sql` — hanya untuk troubleshooting.

## 5. Konfigurasi aplikasi

Salin `js/config.example.js` → `js/config.js`:

```javascript
window.APP_CONFIG = {
  SUPABASE_URL: 'https://xxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGci...',
};
```

Batas ukuran file di `js/constants.js` (`MAX_FILE_MB`, default 10 MB).

## 6. Alur aplikasi

### Admin
- **Template RAB** — buat folder kategori, upload/ganti/hapus file PDF/XLS/XLSX
- **Pengajuan** — review file RAB, setujui / tolak / minta revisi
- **Riwayat** — arsip disetujui & ditolak
- **Log Aktivitas** — riwayat upload, download, pengajuan

### Karyawan
- **Template RAB** — unduh template, isi di luar aplikasi
- **Pengajuan Baru** — isi form + upload file RAB
- **Dashboard** — status pengajuan & perbaikan revisi

## Tabel utama (v2)

| Tabel | Fungsi |
|-------|--------|
| `profiles` | Admin & karyawan |
| `template_folders` | Kategori folder template |
| `template_files` | File template per folder |
| `pengajuan` | Pengajuan + file RAB + status |
| `activity_logs` | Log aktivitas sistem |
