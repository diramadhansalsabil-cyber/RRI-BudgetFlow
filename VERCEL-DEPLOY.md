# Deploy ke Vercel — RRI BudgetFlow

## Environment Variables (copy-paste ke Vercel)

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://mdohcchkvkskeoafyygm.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kb2hjY2hrdmtza2VvYWZ5eWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDYyNzMsImV4cCI6MjA5NjEyMjI3M30.dq4S1YJnUMTugubRHF-vnoACbNPb_7M7HspXQSzibaM` |

Centang: **Production** + **Preview** + **Development**

### Cara cepat: Import .env

1. Di halaman deploy Vercel, bagian **Environment Variables**
2. Klik **Import .env**
3. Pilih file `.env.vercel` dari folder proyek ini
4. Deploy

## Pensil Build Command tidak bisa diklik?

Itu **normal** — Vercel mengunci pengaturan karena sudah ada file `vercel.json` di repo.

**Tidak perlu edit di dashboard.** Cukup **push ulang** folder proyek ke GitHub (termasuk `vercel.json` dan `scripts/`), lalu **Redeploy**.

Build command `.js` dan `.cjs` keduanya sudah didukung.

## Pengaturan build (otomatis dari vercel.json)

- Framework: **Other**
- Install Command: skip (tidak perlu npm install)
- Build Command: `node scripts/generate-config.cjs` (atau `.js` — keduanya jalan)
- Output Directory: `.` (root)

## Setelah deploy

Buka URL Vercel → harus muncul halaman portal login → coba login admin/karyawan.
