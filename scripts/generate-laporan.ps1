# Generate Laporan RRI BudgetFlow (Word + Diagram)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outDir = Join-Path $root 'laporan'
$imgDir = Join-Path $outDir 'gambar'
New-Item -ItemType Directory -Force -Path $imgDir | Out-Null

Add-Type -AssemblyName System.Drawing

function New-Font($size, $style = [System.Drawing.FontStyle]::Regular) {
    return New-Object System.Drawing.Font('Segoe UI', $size, $style)
}

function Draw-Box($g, $x, $y, $w, $h, $title, $lines, $fill, $border) {
    $brush = New-Object System.Drawing.SolidBrush $fill
    $pen = New-Object System.Drawing.Pen $border, 2
    $g.FillRectangle($brush, $x, $y, $w, $h)
    $g.DrawRectangle($pen, $x, $y, $w, $h)
    $titleFont = New-Font 11 ([System.Drawing.FontStyle]::Bold)
    $bodyFont = New-Font 9
    $tb = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 23, 42))
    $g.DrawString($title, $titleFont, $tb, ($x + 8), ($y + 6))
    $yy = $y + 28
    foreach ($line in $lines) {
        $g.DrawString($line, $bodyFont, $tb, ($x + 8), $yy)
        $yy += 16
    }
    $brush.Dispose(); $pen.Dispose(); $titleFont.Dispose(); $bodyFont.Dispose(); $tb.Dispose()
}

function Draw-Arrow($g, $x1, $y1, $x2, $y2, $color) {
    $pen = New-Object System.Drawing.Pen $color, 2
    $pen.CustomEndCap = New-Object System.Drawing.Drawing2D.AdjustableArrowCap 5, 5
    $g.DrawLine($pen, $x1, $y1, $x2, $y2)
    $pen.Dispose()
}

function Save-Diagram($path, $width, $height, $drawFn) {
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::White)
    & $drawFn $g
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}

# --- Diagram 1: ERD ---
$erdPath = Join-Path $imgDir 'diagram-erd.png'
Save-Diagram $erdPath 1100 720 {
    param($g)
    $fill = [System.Drawing.Color]::FromArgb(241, 245, 249)
    $border = [System.Drawing.Color]::FromArgb(59, 130, 246)
    $rel = [System.Drawing.Color]::FromArgb(100, 116, 139)

    $titleFont = New-Font 16 ([System.Drawing.FontStyle]::Bold)
    $g.DrawString('Entity Relationship Diagram (ERD) - RRI BudgetFlow', $titleFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15,23,42))), 20, 12)
    $titleFont.Dispose()

    Draw-Box $g 40 60 200 130 'profiles (PK: id)' @('username, email','nama, no_hp','role, status','FK -> auth.users') $fill $border
    Draw-Box $g 320 60 220 150 'template_folders (PK: id)' @('nama, jenis','created_by FK','-> profiles.id') $fill $border
    Draw-Box $g 600 60 220 150 'template_files (PK: id)' @('folder_id FK','nama_file, jenis_file','storage_path, public_url') $fill $border
    Draw-Box $g 40 280 240 200 'pengajuan (PK: id)' @('kode, user_id FK','judul, nama_pengusul','divisi, keterangan','file RAB + surat','status, pesan_admin','total_anggaran') $fill $border
    Draw-Box $g 360 300 200 130 'activity_logs (PK: id)' @('user_id FK','aktivitas, detail','meta (jsonb)') $fill $border
    Draw-Box $g 620 300 200 130 'templates (legacy)' @('id PK','nama_template','payload jsonb') $fill ([System.Drawing.Color]::FromArgb(254,243,199)) $border
    Draw-Box $g 860 60 200 120 'Supabase Storage' @('rab-templates','rab-pengajuan','bukti') ([System.Drawing.Color]::FromArgb(220,252,231)) ([System.Drawing.Color]::FromArgb(34,197,94))

    Draw-Arrow $g 240 120 320 120 $rel
    Draw-Arrow $g 540 120 600 120 $rel
    Draw-Arrow $g 160 190 160 280 $rel
    Draw-Arrow $g 280 350 360 350 $rel
    $g.DrawString('1:N', (New-Font 9), (New-Object System.Drawing.SolidBrush $rel), 250, 100)
    $g.DrawString('1:N', (New-Font 9), (New-Object System.Drawing.SolidBrush $rel), 555, 100)
    $g.DrawString('1:N', (New-Font 9), (New-Object System.Drawing.SolidBrush $rel), 170, 230)
    $g.DrawString('1:N', (New-Font 9), (New-Object System.Drawing.SolidBrush $rel), 300, 330)

    $legend = New-Font 10
    $g.DrawString('Relasi: profiles -> pengajuan (1:N) | template_folders -> template_files (1:N) | profiles -> activity_logs (1:N)', $legend, (New-Object System.Drawing.SolidBrush $rel), 40, 520)
    $legend.Dispose()
}

# --- Diagram 2: Arsitektur Sistem ---
$archPath = Join-Path $imgDir 'diagram-arsitektur.png'
Save-Diagram $archPath 1000 620 {
    param($g)
    $layers = @(
        @{ y=70;  title='Pengguna (Browser)'; items='Admin dan Karyawan - Chrome, Edge, Firefox'; fill=[System.Drawing.Color]::FromArgb(219,234,254); border=[System.Drawing.Color]::FromArgb(37,99,235) },
        @{ y=170; title='Frontend (Static Web)'; items='HTML, CSS, JavaScript Vanilla | Hash Router | XAMPP / Vercel'; fill=[System.Drawing.Color]::FromArgb(224,231,255); border=[System.Drawing.Color]::FromArgb(79,70,229) },
        @{ y=290; title='Supabase Cloud (BaaS)'; items='REST API + Realtime'; fill=[System.Drawing.Color]::FromArgb(254,226,226); border=[System.Drawing.Color]::FromArgb(220,38,38) },
        @{ y=400; title='Komponen Supabase'; items='Auth (JWT) | PostgreSQL + RLS | Storage (rab-templates, rab-pengajuan)'; fill=[System.Drawing.Color]::FromArgb(220,252,231); border=[System.Drawing.Color]::FromArgb(22,163,74) }
    )
    $titleFont = New-Font 16 ([System.Drawing.FontStyle]::Bold)
    $g.DrawString('Diagram Arsitektur Sistem RRI BudgetFlow', $titleFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15,23,42))), 20, 12)
    $titleFont.Dispose()
    foreach ($L in $layers) {
        Draw-Box $g 120 $L.y 760 80 $L.title @($L.items) $L.fill $L.border
    }
    $rel = [System.Drawing.Color]::FromArgb(100,116,139)
    Draw-Arrow $g 500 150 500 170 $rel
    Draw-Arrow $g 500 250 500 290 $rel
    Draw-Arrow $g 500 370 500 400 $rel
    $note = New-Font 10
    $g.DrawString('Tanpa backend PHP/Node di production - komunikasi langsung browser <-> Supabase', $note, (New-Object System.Drawing.SolidBrush $rel), 120, 520)
    $note.Dispose()
}

# --- Diagram 3: Struktur Aplikasi ---
$structPath = Join-Path $imgDir 'diagram-struktur-aplikasi.png'
Save-Diagram $structPath 900 700 {
    param($g)
    $titleFont = New-Font 16 ([System.Drawing.FontStyle]::Bold)
    $g.DrawString('Struktur Folder dan Modul Aplikasi', $titleFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15,23,42))), 20, 12)
    $titleFont.Dispose()
    $tree = @(
        'RRI BudgetFlow/',
        '|-- index.html          (entry point SPA)',
        '|-- css/app.css         (styling UI)',
        '|-- assets/             (logo, favicon, kop surat)',
        '|-- js/',
        '|   |-- config.js       (kredensial Supabase)',
        '|   |-- supabase-client.js',
        '|   |-- api.js          (CRUD database dan storage)',
        '|   |-- auth.js         (login, session, portal)',
        '|   |-- data-store.js   (cache in-memory)',
        '|   |-- pages-workflow.js (halaman admin dan user)',
        '|   |-- app.js          (router hash-based)',
        '|   |-- constants.js    (limit file, bucket)',
        '|   +-- components.js   (UI reusable)',
        '|-- supabase/           (skema SQL dan migrasi)',
        '|   |-- schema.sql',
        '|   |-- schema-v2-documents.sql',
        '|   +-- schema-auth-v3.sql',
        '+-- vercel.json         (konfigurasi deploy)'
    )
    $mono = New-Object System.Drawing.Font('Consolas', 11)
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(30,41,59))
    $yy = 55
    foreach ($line in $tree) {
        $g.DrawString($line, $mono, $brush, 40, $yy)
        $yy += 22
    }
    $mono.Dispose(); $brush.Dispose()

    Draw-Box $g 40 480 820 180 'Modul Halaman (Router)' @(
        'Portal: #/login/karyawan | #/login/admin',
        'Admin: Dashboard, Template RAB, Template Surat, Pengajuan, Riwayat, Log Aktivitas, Profil',
        'Karyawan: Dashboard, Template RAB/Surat, Pengajuan Baru, Edit Revisi, Profil'
    ) ([System.Drawing.Color]::FromArgb(241,245,249)) ([System.Drawing.Color]::FromArgb(59,130,246))
}

# --- Diagram 4: Alur Kerja ---
$flowPath = Join-Path $imgDir 'diagram-alur-kerja.png'
Save-Diagram $flowPath 1100 500 {
    param($g)
    $titleFont = New-Font 16 ([System.Drawing.FontStyle]::Bold)
    $g.DrawString('Diagram Alur Kerja Pengajuan Anggaran', $titleFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15,23,42))), 20, 12)
    $titleFont.Dispose()
    $fill = [System.Drawing.Color]::FromArgb(241,245,249)
    $border = [System.Drawing.Color]::FromArgb(59,130,246)
    $rel = [System.Drawing.Color]::FromArgb(100,116,139)

    $steps = @(
        @{ x=30;  t='1. Admin upload template' },
        @{ x=200; t='2. Karyawan unduh' },
        @{ x=370; t='3. Isi offline' },
        @{ x=530; t='4. Upload RAB + form' },
        @{ x=700; t='5. Review admin' },
        @{ x=870; t='6. Keputusan' }
    )
    foreach ($s in $steps) {
        Draw-Box $g $s.x 80 150 55 $s.t @('') $fill $border
    }
    for ($i = 0; $i -lt $steps.Count - 1; $i++) {
        Draw-Arrow $g ($steps[$i].x + 150) 108 ($steps[$i+1].x) 108 $rel
    }

    Draw-Box $g 700 220 120 50 'Setujui' @('approved') ([System.Drawing.Color]::FromArgb(220,252,231)) ([System.Drawing.Color]::FromArgb(34,197,94))
    Draw-Box $g 840 220 120 50 'Tolak' @('rejected') ([System.Drawing.Color]::FromArgb(254,226,226)) ([System.Drawing.Color]::FromArgb(239,68,68))
    Draw-Box $g 980 220 100 50 'Revisi' @('revisi') ([System.Drawing.Color]::FromArgb(254,243,199)) ([System.Drawing.Color]::FromArgb(245,158,11))

    Draw-Arrow $g 775 135 760 220 $rel
    Draw-Arrow $g 820 135 900 220 $rel
    Draw-Arrow $g 870 135 1030 220 $rel
    Draw-Arrow $g 1030 270 600 135 $rel

    $note = New-Font 10
    $g.DrawString('Status revisi: karyawan dapat mengunggah ulang file dan mengirim kembali pengajuan', $note, (New-Object System.Drawing.SolidBrush $rel), 30, 320)
    $note.Dispose()
}

# --- Diagram 5: Use Case ---
$ucPath = Join-Path $imgDir 'diagram-use-case.png'
Save-Diagram $ucPath 1000 580 {
    param($g)
    $titleFont = New-Font 16 ([System.Drawing.FontStyle]::Bold)
    $g.DrawString('Diagram Use Case - RRI BudgetFlow', $titleFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15,23,42))), 20, 12)
    $titleFont.Dispose()

    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(148,163,184)), 2
    $g.DrawEllipse($pen, 280, 60, 440, 420)
    $pen.Dispose()

    $actorFont = New-Font 11 ([System.Drawing.FontStyle]::Bold)
    $caseFont = New-Font 10
    $tb = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15,23,42))

    $g.DrawString('Admin', $actorFont, $tb, 60, 200)
    $g.DrawString('Karyawan', $actorFont, $tb, 60, 340)
    $g.DrawString('Sistem', $actorFont, $tb, 880, 260)

    $cases = @(
        'Kelola Template RAB/Surat', 'Review Pengajuan', 'Setujui/Tolak/Revisi',
        'Lihat Riwayat dan Log', 'Kelola Pengguna',
        'Unduh Template', 'Buat Pengajuan Baru', 'Upload File RAB',
        'Lihat Status Dashboard', 'Perbaiki Revisi',
        'Autentikasi dan RLS', 'Simpan File Storage', 'Catat Log Aktivitas'
    )
    $yy = 90
    foreach ($c in $cases) {
        $g.DrawString("- $c", $caseFont, $tb, 310, $yy)
        $yy += 28
    }
    $actorFont.Dispose(); $caseFont.Dispose(); $tb.Dispose()
}

Write-Host "Diagram tersimpan di: $imgDir"

# --- Word Document via COM ---
$docPath = Join-Path $outDir 'Laporan_RRI_BudgetFlow.docx'
if (Test-Path $docPath) { Remove-Item $docPath -Force }

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Add()

function Add-Heading {
    param($doc, [string]$text)
    $p = $doc.Content.Paragraphs.Add()
    $p.Range.Text = $text
    $p.Range.Style = 'Heading 1'
    $p.Range.InsertParagraphAfter() | Out-Null
}

function Add-SubHeading {
    param($doc, [string]$text)
    $p = $doc.Content.Paragraphs.Add()
    $p.Range.Text = $text
    $p.Range.Style = 'Heading 2'
    $p.Range.InsertParagraphAfter() | Out-Null
}

function Add-Body {
    param($doc, [string]$text)
    $p = $doc.Content.Paragraphs.Add()
    $p.Range.Text = $text
    $p.Range.Font.Size = 11
    $p.Range.Font.Name = 'Calibri'
    $p.Range.ParagraphFormat.SpaceAfter = 8
    $p.Range.ParagraphFormat.Alignment = 0
    $p.Range.InsertParagraphAfter() | Out-Null
}

function Add-Bullet {
    param($doc, [string]$text)
    $p = $doc.Content.Paragraphs.Add()
    $p.Range.Text = $text
    $p.Range.Font.Size = 11
    $p.Range.Font.Name = 'Calibri'
    $p.Range.ListFormat.ApplyBulletDefault() | Out-Null
    $p.Range.InsertParagraphAfter() | Out-Null
}

function Add-Image {
    param($doc, [string]$path, [string]$caption)
    $p = $doc.Content.Paragraphs.Add()
    $p.Range.InlineShapes.AddPicture($path) | Out-Null
    $p.Range.ParagraphFormat.Alignment = 1
    $p.Range.InsertParagraphAfter() | Out-Null
    $cap = $doc.Content.Paragraphs.Add()
    $cap.Range.Text = $caption
    $cap.Range.Font.Size = 10
    $cap.Range.Font.Italic = $true
    $cap.Range.ParagraphFormat.Alignment = 1
    $cap.Range.InsertParagraphAfter() | Out-Null
}

# Cover
$cover = $doc.Content.Paragraphs.Add()
$cover.Range.Text = "LAPORAN APLIKASI`r`nRRI BUDGETFLOW`r`nSistem Workflow Pengajuan Anggaran Berbasis Dokumen`r`n`r`nRadio Republik Indonesia (RRI) Kendari`r`n`r`nJuni 2026"
$cover.Range.Font.Size = 22
$cover.Range.Font.Bold = $true
$cover.Range.ParagraphFormat.Alignment = 1
$cover.Range.InsertParagraphAfter() | Out-Null
$doc.Content.InsertBreak(7) | Out-Null  # page break

Add-Heading $doc 'DAFTAR ISI'
Add-Body $doc '1. Ringkasan Eksekutif'
Add-Body $doc '2. Latar Belakang dan Studi Kasus'
Add-Body $doc '3. Identifikasi Permasalahan'
Add-Body $doc '4. Solusi yang Diterapkan'
Add-Body $doc '5. Manfaat Aplikasi'
Add-Body $doc '6. Deskripsi dan Fitur Aplikasi'
Add-Body $doc '7. Arsitektur Sistem'
Add-Body $doc '8. Struktur Aplikasi'
Add-Body $doc '9. Entity Relationship Diagram (ERD)'
Add-Body $doc '10. Alur Kerja Pengajuan'
Add-Body $doc '11. Use Case Diagram'
Add-Body $doc '12. Teknologi yang Digunakan'
Add-Body $doc '13. Keamanan Sistem'
Add-Body $doc '14. Kesimpulan dan Saran'
$doc.Content.InsertBreak(7) | Out-Null

Add-Heading $doc '1. Ringkasan Eksekutif'
Add-Body $doc 'RRI BudgetFlow adalah aplikasi web enterprise yang dirancang untuk mendigitalisasi proses pengajuan anggaran (Rencana Anggaran Belanja/RAB) di lingkungan Radio Republik Indonesia (RRI) Kendari. Aplikasi ini menggantikan alur manual berbasis kertas dan email dengan workflow terpusat berbasis dokumen: admin mengunggah template RAB dan surat pengajuan, karyawan mengunduh template, mengisi di luar sistem, lalu mengunggah kembali file beserta formulir pengajuan. Seluruh data disimpan di Supabase (PostgreSQL cloud) dengan autentikasi aman dan penyimpanan file terintegrasi.'

Add-Heading $doc '2. Latar Belakang dan Studi Kasus'
Add-SubHeading $doc '2.1 Latar Belakang'
Add-Body $doc 'Pengelolaan anggaran di instansi pemerintah seperti RRI memerlukan prosedur yang terstruktur, transparan, dan dapat diaudit. Proses pengajuan RAB secara konvensional sering melibatkan pertukaran file fisik atau email, sehingga sulit melacak status, versi dokumen, dan riwayat keputusan. Transformasi digital diperlukan agar proses menjadi lebih efisien, terstandar, dan dapat diakses dari mana saja.'

Add-SubHeading $doc '2.2 Studi Kasus: RRI Kendari'
Add-Body $doc 'Studi kasus dilakukan di unit kerja RRI Kendari yang setiap tahun atau per kegiatan membutuhkan pengajuan anggaran operasional, kegiatan, pengadaan barang, dan perjalanan dinas. Sebelum RRI BudgetFlow diterapkan, alur kerja berlangsung sebagai berikut:'
Add-Bullet $doc 'Admin keuangan/SDM mendistribusikan template RAB melalui WhatsApp, email, atau flashdisk ke setiap bidang.'
Add-Bullet $doc 'Karyawan mengisi RAB di Microsoft Excel atau Word secara terpisah tanpa format terpusat.'
Add-Bullet $doc 'File dikirim kembali via email; admin kesulitan melacak siapa yang sudah mengirim dan versi terbaru.'
Add-Bullet $doc 'Tidak ada log aktivitas terpusat; arsip disetujui/ditolak tersebar di folder lokal.'
Add-Bullet $doc 'Proses revisi memerlukan pertukaran file berulang tanpa notifikasi status yang jelas.'

Add-Body $doc 'Dengan RRI BudgetFlow, seluruh alur tersebut dipusatkan dalam satu portal web. Admin mengelola folder template (RAB dan surat pengajuan), karyawan mengunduh template resmi, mengisi offline, lalu mengunggah file PDF/Excel beserta metadata pengajuan. Admin dapat menyetujui, menolak, atau meminta revisi langsung dari dashboard, sementara sistem mencatat setiap aktivitas penting.'

Add-Heading $doc '3. Identifikasi Permasalahan'
Add-Bullet $doc 'Distribusi template tidak terstandar - berbagai versi file beredar di unit kerja.'
Add-Bullet $doc 'Tidak ada visibilitas status pengajuan secara real-time bagi pengusul maupun admin.'
Add-Bullet $doc 'Arsip pengajuan sulit dicari dan tidak terintegrasi dengan metadata (judul, divisi, tanggal).'
Add-Bullet $doc 'Proses revisi tidak terdokumentasi dengan baik.'
Add-Bullet $doc 'Tidak ada kontrol akses berbasis peran (admin vs karyawan).'
Add-Bullet $doc 'Ketergantungan pada pertukaran file manual meningkatkan risiko kehilangan data.'

Add-Heading $doc '4. Solusi yang Diterapkan'
Add-SubHeading $doc '4.1 Konsep Solusi'
Add-Body $doc 'RRI BudgetFlow menerapkan pendekatan workflow berbasis dokumen (document-centric workflow). Alih-alih membangun form RAB kompleks di dalam aplikasi, sistem mendistribusikan template file resmi yang diisi pengguna di aplikasi favorit mereka (Excel, Word), kemudian mengunggah hasil akhir ke sistem. Pendekatan ini:'
Add-Bullet $doc 'Menghormati kebiasaan kerja existing (pengisian RAB di spreadsheet).'
Add-Bullet $doc 'Meminimalkan risiko kesalahan perhitungan karena pengguna memakai template yang sudah familiar.'
Add-Bullet $doc 'Memungkinkan admin mengganti template tanpa mengubah kode aplikasi.'

Add-SubHeading $doc '4.2 Komponen Solusi'
Add-Bullet $doc 'Portal terpisah untuk Admin dan Karyawan dengan autentikasi Supabase Auth.'
Add-Bullet $doc 'Manajemen folder dan file template (PDF, XLS, XLSX untuk RAB; PDF, DOC, DOCX untuk surat).'
Add-Bullet $doc 'Modul pengajuan dengan upload file RAB dan surat pengajuan.'
Add-Bullet $doc 'Workflow status: pending -> approved / rejected / revisi.'
Add-Bullet $doc 'Riwayat arsip dan log aktivitas untuk audit trail.'
Add-Bullet $doc 'Row Level Security (RLS) di database untuk isolasi data per pengguna.'
Add-Bullet $doc 'Penyimpanan file di Supabase Storage (bucket rab-templates dan rab-pengajuan).'

Add-Heading $doc '5. Manfaat Aplikasi'
Add-SubHeading $doc '5.1 Manfaat Operasional'
Add-Bullet $doc 'Proses pengajuan anggaran menjadi lebih cepat dan terstruktur.'
Add-Bullet $doc 'Template RAB terpusat - semua unit memakai format resmi yang sama.'
Add-Bullet $doc 'Status pengajuan dapat dipantau kapan saja melalui dashboard.'
Add-Bullet $doc 'Proses revisi terdokumentasi dengan pesan admin dan riwayat file.'

Add-SubHeading $doc '5.2 Manfaat Manajerial'
Add-Bullet $doc 'Admin memiliki gambaran menyeluruh semua pengajuan yang masuk.'
Add-Bullet $doc 'Riwayat disetujui/ditolak tersimpan terpusat untuk keperluan audit.'
Add-Bullet $doc 'Log aktivitas mencatat siapa mengunduh, mengunggah, dan mengambil keputusan.'

Add-SubHeading $doc '5.3 Manfaat Teknis'
Add-Bullet $doc 'Arsitektur serverless - tidak perlu maintenance server backend sendiri.'
Add-Bullet $doc 'Dapat di-deploy di Vercel (gratis tier) dengan database cloud Supabase.'
Add-Bullet $doc 'Skalabel untuk penambahan unit kerja dan jenis template baru.'
Add-Bullet $doc 'Keamanan data melalui JWT, RLS, dan pembatasan ukuran/tipe file.'

Add-Heading $doc '6. Deskripsi dan Fitur Aplikasi'
Add-SubHeading $doc '6.1 Fitur Portal Admin'
Add-Bullet $doc 'Dashboard - ringkasan statistik pengajuan (pending, disetujui, ditolak, revisi).'
Add-Bullet $doc 'Kelola Template RAB - buat folder kategori, upload/ganti/hapus file template.'
Add-Bullet $doc 'Kelola Template Surat Pengajuan - folder dan file Word/PDF.'
Add-Bullet $doc 'Review Pengajuan - lihat detail, unduh file RAB dan surat, beri keputusan.'
Add-Bullet $doc 'Riwayat - arsip pengajuan yang sudah disetujui atau ditolak.'
Add-Bullet $doc 'Log Aktivitas - jejak audit upload, download, dan keputusan.'
Add-Bullet $doc 'Profil - perbarui data pribadi admin.'

Add-SubHeading $doc '6.2 Fitur Portal Karyawan'
Add-Bullet $doc 'Dashboard - daftar pengajuan sendiri beserta status terkini.'
Add-Bullet $doc 'Unduh Template RAB dan Surat - pilih folder, unduh file resmi.'
Add-Bullet $doc 'Pengajuan Baru - isi form (judul, divisi, keterangan) + upload file.'
Add-Bullet $doc 'Perbaiki Revisi - unggah ulang file jika admin meminta revisi.'
Add-Bullet $doc 'Profil - kelola data akun pribadi.'

Add-SubHeading $doc '6.3 Status Pengajuan'
Add-Bullet $doc 'pending - menunggu review admin.'
Add-Bullet $doc 'approved - disetujui, masuk riwayat arsip.'
Add-Bullet $doc 'rejected - ditolak, masuk riwayat arsip.'
Add-Bullet $doc 'revisi - perlu perbaikan; karyawan dapat mengunggah ulang.'

Add-Heading $doc '7. Arsitektur Sistem'
Add-Body $doc 'RRI BudgetFlow menggunakan arsitektur tiga lapisan: (1) klien web statis di browser, (2) layanan Supabase sebagai Backend-as-a-Service, dan (3) penyimpanan file cloud. Tidak ada server PHP atau Node.js di production - frontend berkomunikasi langsung dengan API Supabase menggunakan anon key dan token JWT pengguna.'
Add-Image $doc $archPath 'Gambar 1. Diagram Arsitektur Sistem RRI BudgetFlow'

Add-Heading $doc '8. Struktur Aplikasi'
Add-Body $doc 'Aplikasi dibangun sebagai Single Page Application (SPA) berbasis hash router. File utama diakses melalui index.html yang memuat modul JavaScript secara berurutan. Berikut struktur folder dan pemetaan modul:'
Add-Image $doc $structPath 'Gambar 2. Struktur Folder dan Modul Aplikasi'

Add-Heading $doc '9. Entity Relationship Diagram (ERD)'
Add-Body $doc 'Database PostgreSQL di Supabase terdiri dari tabel-tabel berikut dengan relasi yang jelas:'
Add-Bullet $doc 'profiles - data pengguna (admin/karyawan), terhubung ke auth.users Supabase.'
Add-Bullet $doc 'template_folders - kategori folder template (jenis: rab atau surat_pengajuan).'
Add-Bullet $doc 'template_files - file template dalam folder, menyimpan path storage dan URL publik.'
Add-Bullet $doc 'pengajuan - data pengajuan anggaran beserta file RAB, surat, status, dan metadata.'
Add-Bullet $doc 'activity_logs - catatan aktivitas sistem untuk audit.'
Add-Bullet $doc 'templates (legacy) - template form dinamis versi awal, masih ada untuk kompatibilitas.'
Add-Image $doc $erdPath 'Gambar 3. Entity Relationship Diagram (ERD)'

Add-Heading $doc '10. Alur Kerja Pengajuan'
Add-Body $doc 'Alur kerja utama aplikasi mengikuti siklus distribusi template, pengisian offline, pengajuan, review, dan keputusan. Jika admin meminta revisi, siklus kembali ke tahap upload dengan status revisi.'
Add-Image $doc $flowPath 'Gambar 4. Diagram Alur Kerja Pengajuan Anggaran'

Add-Heading $doc '11. Use Case Diagram'
Add-Body $doc 'Diagram use case menggambarkan interaksi antara aktor Admin, Karyawan, dan Sistem dengan fitur-fitur utama RRI BudgetFlow.'
Add-Image $doc $ucPath 'Gambar 5. Diagram Use Case RRI BudgetFlow'

Add-Heading $doc '12. Teknologi yang Digunakan'
Add-Body $doc 'Berikut komponen teknologi yang digunakan dalam pengembangan dan deployment:'
Add-Bullet $doc 'Frontend: HTML5, CSS3, JavaScript (Vanilla ES6+) - tanpa framework berat di production.'
Add-Bullet $doc 'Database: PostgreSQL (via Supabase) dengan ekstensi pgcrypto.'
Add-Bullet $doc 'Autentikasi: Supabase Auth (email/username + password, JWT).'
Add-Bullet $doc 'Storage: Supabase Storage - bucket rab-templates, rab-pengajuan, bukti.'
Add-Bullet $doc 'Keamanan DB: Row Level Security (RLS) dan fungsi security definer.'
Add-Bullet $doc 'Hosting: XAMPP (lokal) atau Vercel (production static).'
Add-Bullet $doc 'Opsional dev: React + Vite (folder src/) untuk pengembangan alternatif.'

Add-Heading $doc '13. Keamanan Sistem'
Add-Bullet $doc 'Autentikasi wajib untuk semua operasi data - token JWT diverifikasi Supabase.'
Add-Bullet $doc 'RLS memastikan karyawan hanya melihat pengajuan milik sendiri; admin melihat semua.'
Add-Bullet $doc 'Upload file dibatasi ukuran (default 10 MB) dan tipe ekstensi yang diizinkan.'
Add-Bullet $doc 'Folder storage pengajuan diisolasi per user_id untuk mencegah akses silang.'
Add-Bullet $doc 'Registrasi admin memerlukan kode khusus (LPPRRI_KENDARI) di metadata pendaftaran.'
Add-Bullet $doc 'Fungsi database sensitif menggunakan SECURITY DEFINER dengan search_path terkontrol.'

Add-Heading $doc '14. Kesimpulan dan Saran'
Add-SubHeading $doc '14.1 Kesimpulan'
Add-Body $doc 'RRI BudgetFlow berhasil menjawab permasalahan pengajuan anggaran manual di lingkungan RRI Kendari dengan menyediakan platform terpusat berbasis web. Aplikasi ini menggabungkan fleksibilitas pengisian dokumen offline dengan kontrol workflow online, sehingga proses menjadi lebih transparan, teraudit, dan efisien. Arsitektur serverless memungkinkan deployment cepat dengan biaya infrastruktur minimal.'

Add-SubHeading $doc '14.2 Saran Pengembangan'
Add-Bullet $doc 'Integrasi notifikasi email/WhatsApp saat status pengajuan berubah.'
Add-Bullet $doc 'Ekspor laporan pengajuan ke PDF/Excel untuk keperluan reporting periodik.'
Add-Bullet $doc 'Dashboard analitik - grafik tren pengajuan per divisi dan periode.'
Add-Bullet $doc 'Multi-level approval (verifikator bertingkat) jika diperlukan kebijakan internal.'
Add-Bullet $doc 'Backup otomatis dan kebijakan retensi arsip sesuai regulasi kearsipan.'

$savePath = [string]$docPath
$wdFormat = 16
$doc.SaveAs([ref]$savePath, [ref]$wdFormat)
$doc.Close($false)
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($doc) | Out-Null
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
[GC]::Collect()
[GC]::WaitForPendingFinalizers()

Write-Host "Laporan Word tersimpan: $docPath"
