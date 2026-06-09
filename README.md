# RRI BudgetFlow

Aplikasi web enterprise untuk **workflow pengajuan anggaran berbasis dokumen**. Template RAB didistribusikan sebagai file (PDF/Excel); pengusul mengisi di luar sistem lalu mengunggah hasilnya. Data disimpan di **Supabase (PostgreSQL cloud)**.

## Arsitektur

| Komponen | Teknologi |
|----------|-----------|
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| File template & RAB | Supabase Storage (`rab-templates`, `rab-pengajuan`) |
| Deploy | Vercel (static) + Supabase (cloud) |

Tanpa PHP. Tanpa backend Node di production.

---

## Setup cepat

1. Buat project di [Supabase](https://supabase.com)
2. Jalankan `supabase/schema.sql` lalu `supabase/schema-v2-documents.sql` di SQL Editor
3. Jalankan `schema-auth-v3.sql` + `ensure-self-registration.sql`, atur Confirm email OFF — panduan: **`supabase/SETUP.md`**
4. Salin `js/config.example.js` → `js/config.js`, isi URL & anon key
5. Buka aplikasi (XAMPP atau live server)

### XAMPP

**http://localhost/RRI%20BudgetFlow/**

### Vercel

1. **Environment Variables** (Settings → Environment Variables):

| Nama | Nilai |
|------|--------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | anon public key dari Supabase |

2. **Deploy** — build hanya menulis `js/config.js` (aplikasi static, tanpa `npm install`).

3. Jika deploy gagal: pastikan `vercel.json` memakai `framework: null` dan `installCommand` skip (sudah diset di repo).

---

## Login

Hanya akun yang sudah terdaftar di database yang dapat login (tanpa pendaftaran dari aplikasi).

| Portal | URL |
|--------|-----|
| Karyawan | `#/login/karyawan` |
| Admin | `#/login/admin` |

Mode demo lokal: `admin`/`admin123`, `user`/`user123`

---

## Fitur

**Karyawan:** Unduh template RAB → isi offline → upload file + form pengajuan. Dashboard status & revisi.

**Admin:** Kelola folder/file template, review pengajuan (setujui/tolak/revisi), riwayat arsip, log aktivitas.

---

## Struktur

```
RRI BudgetFlow/
├── index.html
├── js/
│   ├── config.js          ← kredensial Supabase
│   ├── supabase-client.js
│   ├── api.js             ← CRUD Supabase
│   ├── data-store.js      ← cache in-memory
│   ├── auth.js
│   ├── constants.js
│   ├── pages-workflow.js
│   └── app.js
├── supabase/
│   ├── schema.sql
│   ├── schema-v2-documents.sql
│   └── SETUP.md
└── vercel.json
```

---

## Tabel database

- `profiles` — user & role
- `template_folders` / `template_files` — manajemen file template
- `pengajuan` — pengajuan + file RAB + status (pending/approved/rejected/revisi)
- `activity_logs` — riwayat aktivitas sistem
