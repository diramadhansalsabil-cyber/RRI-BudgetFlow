/* Login — split-panel modern */
function authIllustrationSvg() {
  return `<svg class="auth-illustration" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="24" y="32" width="140" height="96" rx="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
    <rect x="40" y="52" width="72" height="8" rx="4" fill="rgba(255,255,255,0.35)"/>
    <rect x="40" y="68" width="96" height="6" rx="3" fill="rgba(255,255,255,0.18)"/>
    <rect x="40" y="82" width="80" height="6" rx="3" fill="rgba(255,255,255,0.12)"/>
    <rect x="40" y="100" width="48" height="14" rx="6" fill="rgba(20,184,166,0.55)"/>
    <rect x="180" y="48" width="116" height="128" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
    <rect x="196" y="68" width="84" height="10" rx="5" fill="rgba(255,255,255,0.3)"/>
    <rect x="196" y="88" width="84" height="36" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)"/>
    <rect x="196" y="134" width="84" height="28" rx="8" fill="rgba(20,184,166,0.4)"/>
    <circle cx="268" cy="156" r="28" fill="rgba(20,184,166,0.2)" stroke="rgba(20,184,166,0.45)" stroke-width="1.5"/>
    <path d="M258 156l7 7 14-16" stroke="#99f6e4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function authBrandPanel(variant, title, desc) {
  const features =
    variant === 'admin'
      ? '<li>Kelola template &amp; pengajuan</li><li>Review &amp; persetujuan anggaran</li><li>Log aktivitas sistem</li>'
      : variant === 'karyawan'
        ? '<li>Unduh template RAB</li><li>Ajukan anggaran online</li><li>Lacak status pengajuan</li>'
        : '<li>Portal karyawan &amp; administrator</li><li>Pengajuan anggaran digital</li><li>Keamanan &amp; audit trail</li>';
  return `
  <aside class="auth-brand auth-brand--${variant}">
    <div class="auth-brand-glow" aria-hidden="true"></div>
    <div class="auth-brand-inner">
      <div class="auth-brand-top">
        <div class="auth-brand-logo">${logoMark(48)}</div>
        <span class="auth-brand-product">RRI BudgetFlow</span>
      </div>
      <h2 class="auth-brand-title">${escapeHtml(title)}</h2>
      <p class="auth-brand-desc">${escapeHtml(desc)}</p>
      <ul class="auth-brand-features">${features}</ul>
      ${authIllustrationSvg()}
    </div>
  </aside>`;
}

function authCardHeader(title, subtitle) {
  return `
  <header class="auth-card-header">
    <div class="auth-card-logo">${logoMark(52)}</div>
    <h1 class="auth-card-title">${escapeHtml(title)}</h1>
    <p class="auth-card-subtitle">${escapeHtml(subtitle)}</p>
  </header>`;
}

function authFooterLogin() {
  return `
  <footer class="auth-footer">
    <a href="#/login" class="auth-footer-back">← Kembali ke pilih portal</a>
  </footer>`;
}

function pagePortal() {
  return `
  <div class="auth-page auth-page--portal">
    ${authBrandPanel('default', 'Sistem Pengajuan Anggaran', 'Portal terpadu untuk karyawan dan administrator RRI Kendari.')}
    <main class="auth-main">
      <div class="auth-card auth-card--portal">
        ${authCardHeader('Selamat Datang', 'Pilih portal sesuai peran Anda')}
        <div class="portal-grid">
          <article class="portal-card portal-card--karyawan">
            <div class="portal-card-icon">${icon('user', 22)}</div>
            <h3 class="portal-card-title">Karyawan</h3>
            <p class="portal-card-desc">Buat dan lacak pengajuan anggaran</p>
            <a href="#/login/karyawan" class="btn btn-primary portal-card-btn">${icon('login', 16)} Masuk</a>
          </article>
          <article class="portal-card portal-card--admin">
            <div class="portal-card-icon">${icon('admin', 22)}</div>
            <h3 class="portal-card-title">Administrator</h3>
            <p class="portal-card-desc">Kelola template, review, dan arsip</p>
            <a href="#/login/admin" class="btn btn-primary portal-card-btn portal-card-btn--admin">${icon('login', 16)} Masuk</a>
          </article>
        </div>
      </div>
    </main>
  </div>`;
}

function pageLogin(portalKey = 'karyawan') {
  const portal = getAuthPortal(portalKey);
  const isAdmin = portal.key === 'admin';
  const brandTitle = isAdmin ? 'Panel Administrator' : 'Portal Karyawan';
  const brandDesc = isAdmin
    ? 'Kelola alur pengajuan anggaran dan pengguna sistem.'
    : 'Ajukan dan pantau status pengajuan anggaran Anda.';
  return `
  <div class="auth-page auth-page--${portal.key}">
    ${authBrandPanel(portal.key, brandTitle, brandDesc)}
    <main class="auth-main">
      <div class="auth-card">
        ${authCardHeader(portal.loginTitle, portal.loginSubtitle)}
        <form id="loginForm" class="auth-form" data-portal="${portal.key}" novalidate>
          <div id="loginError" class="alert alert-error auth-alert" style="display:none" role="alert"></div>
          <div class="form-group">
            <label for="username">Email atau username</label>
            <input id="username" class="input auth-input" type="text" required placeholder="nama@gmail.com atau username" autocomplete="username" />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" class="input auth-input" type="password" required placeholder="Masukkan password" autocomplete="current-password" />
          </div>
          <button type="submit" class="btn btn-primary auth-submit">${icon('login', 18)} Masuk</button>
        </form>
        ${authFooterLogin()}
      </div>
    </main>
  </div>`;
}

async function submitLoginForm(username, password, portalKey = 'karyawan') {
  const portal = getAuthPortal(portalKey);
  const err = document.getElementById('loginError');
  const btn = document.querySelector('#loginForm button[type="submit"]');
  if (err) err.style.display = 'none';
  if (btn) btn.disabled = true;
  const btnLabel = btn?.innerHTML;
  if (btn) {
    btn.innerHTML = `${icon('pending', 18)} Memproses...`;
    refreshIcons(btn);
  }
  try {
    const result = await login(username, password, portal.role);
    if (result?.ok && result.profile) {
      showToast(`Selamat datang, ${result.profile.nama}!`);
      location.hash = portal.dashboardHash;
    } else if (err) {
      const msg = result?.message || 'Username atau password salah';
      err.textContent = msg;
      err.style.display = 'flex';
    }
    return result;
  } catch (ex) {
    if (err) {
      err.textContent = ex.message || 'Gagal masuk';
      err.style.display = 'flex';
    }
    return null;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = btnLabel;
      refreshIcons(btn);
    }
  }
}

function bindLogin(portalKey = 'karyawan') {
  const form = document.getElementById('loginForm');
  if (!form) return;
  const portal = form.dataset.portal || portalKey;
  form.onsubmit = async (e) => {
    e.preventDefault();
    await submitLoginForm(
      document.getElementById('username').value.trim(),
      document.getElementById('password').value,
      portal
    );
  };
}

function filterPendingPengajuan(list) {
  return (list || []).filter((p) => p.status === 'pending');
}

function filterRiwayatPengajuan(list) {
  return (list || []).filter((p) => p.status === 'approved' || p.status === 'rejected');
}

function statusLabelText(status) {
  const map = {
    pending: 'Menunggu Persetujuan',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    revisi: 'Perlu Revisi',
  };
  return map[status] || status || '-';
}

function formatPrintDateTime(dateStr) {
  const d = new Date(dateStr || Date.now());
  if (Number.isNaN(d.getTime())) return '-';
  const formatted = d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Makassar',
  });
  return `${formatted} WIB`;
}

function pengajuanPrintKopSuratHtml(p, karyawan) {
  const rows = [
    ['No. Pengajuan', displayPengajuanId(p)],
    ['Judul Pengajuan', p.judul || '-'],
    ['Pengusul', getPengusulNama(p)],
    ['Divisi / Unit', p.divisi || '-'],
    ['Tanggal Pengajuan', formatDate(p.tanggal || p.createdAt)],
    ['Status', statusLabelText(p.status)],
    ['Nama File RAB', p.fileName || '-'],
  ];
  if (p.pesanAdmin) rows.push(['Catatan Admin', p.pesanAdmin]);
  if (p.tanggalKeputusan) rows.push(['Tanggal Keputusan', formatDateTime(p.tanggalKeputusan)]);
  if (p.keterangan) rows.push(['Keterangan', p.keterangan]);

  return `
  <section class="print-page print-page-kop">
    <header class="kop-surat">
      <div class="kop-surat-top">
        <div class="kop-logo">
          <img src="assets/rri-kendari-kop.svg" alt="RRI Kendari" class="kop-logo-img" />
        </div>
        <div class="kop-text">
          <p class="kop-line">LEMBAGA PENYIARAN PUBLIK</p>
          <p class="kop-line">RADIO REPUBLIK INDONESIA (RRI)</p>
          <p class="kop-line">STASIUN RRI KENDARI</p>
        </div>
      </div>
      <hr class="kop-line-full" />
    </header>
    <div class="print-doc-body">
      <h1 class="print-doc-title">LAPORAN DETAIL PENGAJUAN ANGGARAN</h1>
      <p class="print-doc-subtitle">Nomor: <strong>${escapeHtml(displayPengajuanId(p))}</strong></p>
      <table class="print-info-table">
        <thead>
          <tr><th>Keterangan</th><th>Isi</th></tr>
        </thead>
        <tbody>
          ${rows
            .map(
              ([label, value]) =>
                `<tr><td class="print-col-label">${escapeHtml(label)}</td><td class="print-col-value">${escapeHtml(String(value))}</td></tr>`
            )
            .join('')}
        </tbody>
      </table>
      <p class="print-doc-footer">Dicetak pada: ${formatPrintDateTime(new Date().toISOString())}</p>
      <div class="print-signatures">
        <div class="print-sign-item">
          <p class="print-sign-title">Disetujui KPA</p>
          <div class="print-sign-line"></div>
        </div>
        <div class="print-sign-item">
          <p class="print-sign-title">Diverifikasi KTU</p>
          <div class="print-sign-line"></div>
        </div>
        <div class="print-sign-item">
          <p class="print-sign-title">Diketahui PPK</p>
          <div class="print-sign-line"></div>
        </div>
      </div>
    </div>
  </section>`;
}

function loadBuktiImageMeta(src, index) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () =>
      resolve({
        src,
        index,
        portrait: img.naturalHeight >= img.naturalWidth,
      });
    img.onerror = () => resolve({ src, index, portrait: true });
    img.src = src;
  });
}

function chunkBuktiPrintPages(items) {
  const pages = [];
  let current = null;

  for (const item of items) {
    const orient = item.portrait ? 'portrait' : 'landscape';
    const maxPerPage = orient === 'portrait' ? 4 : 2;

    if (!current || current.orientation !== orient || current.items.length >= maxPerPage) {
      if (current?.items.length) pages.push(current);
      current = { orientation: orient, items: [item] };
      continue;
    }

    current.items.push(item);
    if (current.items.length >= maxPerPage) {
      pages.push(current);
      current = null;
    }
  }

  if (current?.items.length) pages.push(current);
  return pages;
}

function buktiPrintPageHtml(page, globalOffset) {
  const gridClass =
    page.orientation === 'portrait' ? 'print-bukti-portrait-grid' : 'print-bukti-landscape-grid';
  const pageClass = page.orientation === 'portrait' ? 'print-bukti-portrait' : 'print-bukti-landscape';
  const countClass = `print-bukti-count-${page.items.length}`;
  const figures = page.items
    .map((item, i) => {
      const no = globalOffset + i + 1;
      return `<figure class="print-bukti-figure"><img src="${item.src}" alt="Foto Bukti ${no}" class="print-bukti-img" /></figure>`;
    })
    .join('');

  return `<section class="print-page print-page-bukti ${pageClass}">
    <header class="print-bukti-header"><h2>LAMPIRAN FOTO BUKTI</h2></header>
    <div class="print-bukti-grid ${gridClass} ${countClass}">${figures}</div>
  </section>`;
}

function buildBuktiPrintPagesHtml(items) {
  const pages = chunkBuktiPrintPages(items);
  let offset = 0;
  return pages
    .map((page) => {
      const html = buktiPrintPageHtml(page, offset);
      offset += page.items.length;
      return html;
    })
    .join('');
}

function pengajuanPrintBuktiHtml(urls) {
  if (!urls?.length) {
    return `<div id="printBuktiPages" class="print-bukti-pages"><section class="print-page print-page-bukti"><p class="print-empty">Tidak ada foto bukti pendukung.</p></section></div>`;
  }
  return `<div id="printBuktiPages" class="print-bukti-pages" data-bukti-loading="1">
    <section class="print-page print-page-bukti"><p class="print-rab-loading">${icon('pending', 18)} Memuat foto bukti...</p></section>
  </div>`;
}

async function renderBuktiPrintPreview(urls) {
  const wrapper = document.getElementById('printBuktiPages');
  if (!wrapper) return;

  if (!urls?.length) {
    wrapper.innerHTML = '<section class="print-page print-page-bukti"><p class="print-empty">Tidak ada foto bukti pendukung.</p></section>';
    delete wrapper.dataset.buktiLoading;
    return;
  }

  try {
    const items = await Promise.all(urls.map((src, index) => loadBuktiImageMeta(src, index)));
    wrapper.innerHTML = buildBuktiPrintPagesHtml(items);
    delete wrapper.dataset.buktiLoading;
  } catch (e) {
    console.warn('Bukti print preview:', e);
    wrapper.innerHTML = `<section class="print-page print-page-bukti"><p class="print-empty">Gagal memuat foto bukti.</p></section>`;
    delete wrapper.dataset.buktiLoading;
  }
}

function pengajuanPrintRabHtml(p) {
  if (!p?.fileUrl) {
    return `
    <section class="print-page print-page-rab">
      <header class="print-page-header print-page-header-compact">
        <h2>LAMPIRAN RENCANA ANGGARAN BIAYA (RAB)</h2>
      </header>
      <p class="print-empty">Tidak ada file RAB terlampir.</p>
    </section>`;
  }

  const url = p.fileUrl;
  const ext = (p.fileType || getFileExt(p.fileName || '') || '').toLowerCase();

  return `
  <section class="print-page print-page-rab">
    <header class="print-page-header print-page-header-compact">
      <h2>LAMPIRAN RENCANA ANGGARAN BIAYA (RAB)</h2>
    </header>
    <div class="print-rab-sheet" id="printRabContainer" data-rab-url="${escapeHtml(url)}" data-rab-ext="${escapeHtml(ext)}">
      <p class="print-rab-loading">${icon('pending', 18)} Memuat tampilan RAB...</p>
    </div>
  </section>`;
}

let _pdfJsLoading = null;

function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (_pdfJsLoading) return _pdfJsLoading;
  _pdfJsLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error('Gagal memuat PDF.js'));
    document.head.appendChild(script);
  });
  return _pdfJsLoading;
}

function rabPrintFallbackIframe(url) {
  return `<iframe src="${url}#toolbar=0&navpanes=0&view=FitH" title="Preview RAB" class="print-rab-iframe"></iframe>`;
}

async function renderRabPrintPreview(p) {
  const container = document.getElementById('printRabContainer');
  if (!container || !p?.fileUrl) return;

  const url = p.fileUrl;
  const ext = (p.fileType || getFileExt(p.fileName || '') || '').toLowerCase();
  container.dataset.loading = '1';

  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || url.startsWith('data:image/')) {
    container.innerHTML = `<img src="${url}" alt="Rencana Anggaran Biaya" class="print-rab-img" />`;
    delete container.dataset.loading;
    return;
  }

  if (ext === 'pdf' || /\.pdf(\?|$)/i.test(url)) {
    try {
      const pdfjs = await loadPdfJs();
      let pdf;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.arrayBuffer();
        pdf = await pdfjs.getDocument({ data }).promise;
      } catch (fetchErr) {
        console.warn('fetch pdf bytes:', fetchErr);
        pdf = await pdfjs.getDocument({ url, withCredentials: false }).promise;
      }
      const page = await pdf.getPage(1);
      const baseViewport = page.getViewport({ scale: 1 });
      const targetWidth = 760;
      const scale = targetWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/jpeg', 0.94);
      img.className = 'print-rab-img';
      img.alt = 'Rencana Anggaran Biaya (RAB)';
      container.innerHTML = '';
      container.appendChild(img);
      delete container.dataset.loading;
      return;
    } catch (e) {
      console.warn('renderRabPrintPreview pdf:', e);
      container.innerHTML = rabPrintFallbackIframe(url);
      delete container.dataset.loading;
      return;
    }
  }

  container.innerHTML = `<div class="print-rab-fallback">
    <p><strong>${escapeHtml(p.fileName || 'File RAB')}</strong></p>
    <p>File Excel — unduh file asli untuk melihat isi RAB.</p>
  </div>`;
  delete container.dataset.loading;
}

async function handlePengajuanPrint(p) {
  const buktiPages = document.getElementById('printBuktiPages');
  if (buktiPages?.dataset.buktiLoading === '1' || buktiPages?.querySelector('.print-rab-loading')) {
    showToast('Menyiapkan foto bukti...', 'info');
    await renderBuktiPrintPreview(p?.bukti);
  }

  const container = document.getElementById('printRabContainer');
  if (container && (container.dataset.loading === '1' || container.querySelector('.print-rab-loading'))) {
    showToast('Menyiapkan tampilan RAB...', 'info');
    await renderRabPrintPreview(p);
  }
  await new Promise((r) => setTimeout(r, 400));

  const printDoc = document.querySelector('.pengajuan-print-doc');
  if (!printDoc) {
    window.print();
    return;
  }

  const styles = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .map((link) => `<link rel="stylesheet" href="${link.href}" />`)
    .join('');
  const base = document.baseURI.replace(/[^/]+$/, '');

  const win = window.open('', '_blank');
  if (!win) {
    window.print();
    return;
  }

  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Cetak Pengajuan</title>
  <base href="${base}" />
  ${styles}
  <style>
    body { margin: 0; padding: 0; background: #fff; }
    .print-only { position: static !important; left: auto !important; display: block !important; width: 100% !important; visibility: visible !important; }
  </style>
</head>
<body>${printDoc.outerHTML}</body>
</html>`);
  win.document.close();

  const closePrintWindow = () => {
    win.removeEventListener('afterprint', closePrintWindow);
    win.close();
  };

  win.addEventListener('load', () => {
    setTimeout(() => {
      win.focus();
      win.print();
      win.addEventListener('afterprint', closePrintWindow);
    }, 350);
  });
}

function pengajuanPrintDocumentHtml(p, karyawan) {
  return `
  <div class="pengajuan-print-doc print-only" aria-hidden="true">
    ${pengajuanPrintKopSuratHtml(p, karyawan)}
    ${pengajuanPrintBuktiHtml(p.bukti)}
    ${pengajuanPrintRabHtml(p)}
  </div>`;
}

function detailInfoGridHtml(p, karyawan) {
  const items = [
    { label: 'No. Pengajuan', value: displayPengajuanId(p), mono: true },
    { label: 'Judul Pengajuan', value: p.judul || '-' },
    { label: 'Pengusul', value: getPengusulNama(p) },
    { label: 'Divisi / Unit', value: p.divisi || '-' },
    { label: 'Tanggal Pengajuan', value: formatDate(p.tanggal || p.createdAt) },
    { label: 'Status', html: badgeStatus(p.status) },
    { label: 'Nama File RAB', value: p.fileName || '-' },
  ];
  if (p.pesanAdmin) items.push({ label: 'Catatan Admin', value: p.pesanAdmin, wide: true });
  if (p.tanggalKeputusan) items.push({ label: 'Tanggal Keputusan', value: formatDateTime(p.tanggalKeputusan) });
  if (p.keterangan) items.push({ label: 'Keterangan', value: p.keterangan, wide: true });

  return `<div class="detail-info-grid">${items
    .map((item) => {
      const val = item.html ? item.html : `<span class="${item.mono ? 'mono' : ''}">${escapeHtml(String(item.value))}</span>`;
      return `<div class="detail-info-item${item.wide ? ' detail-info-wide' : ''}"><span class="detail-info-label">${escapeHtml(item.label)}</span><div class="detail-info-value">${val}</div></div>`;
    })
    .join('')}</div>`;
}

function buktiGalleryHtml(urls, emptyMsg = 'Belum ada foto bukti') {
  if (!urls?.length) {
    return `<p class="text-muted empty-inline">${icon('upload', 18)} ${escapeHtml(emptyMsg)}</p>`;
  }
  return `<div class="bukti-detail-grid">${urls
    .map(
      (src, i) =>
        `<a href="${src}" target="_blank" rel="noreferrer" class="bukti-detail-item" title="Foto Bukti ${i + 1}"><img src="${src}" alt="Foto Bukti ${i + 1}" /><span class="bukti-detail-label">Foto ${i + 1}</span></a>`
    )
    .join('')}</div>`;
}

function rabFilePreviewHtml(p) {
  if (!p?.fileUrl) {
    return `<p class="text-muted empty-inline">${icon('document', 18)} Tidak ada file RAB</p>`;
  }
  const url = p.fileUrl;
  const ext = (p.fileType || getFileExt(p.fileName || '') || '').toLowerCase();
  const header = `
    <div class="rab-preview-header">
      <div class="rab-preview-fileinfo">
        <strong>${escapeHtml(p.fileName || 'File RAB')}</strong>
        <span>${fileTypeLabel(ext)} · ${formatFileSize(p.fileSize)}</span>
      </div>
      <a href="${url}" target="_blank" rel="noreferrer" class="btn btn-secondary btn-sm" download id="btnDlPengajuan">${icon('document', 14)} Unduh Asli</a>
    </div>`;

  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || url.startsWith('data:image/')) {
    return `${header}<div class="rab-file-preview rab-preview-media"><a href="${url}" target="_blank" rel="noreferrer" class="rab-preview-link"><img src="${url}" alt="Preview File RAB" class="rab-preview-img" /></a></div>`;
  }

  if (ext === 'pdf' || url.includes('application/pdf') || /\.pdf(\?|$)/i.test(url)) {
    return `${header}<div class="rab-file-preview rab-preview-pdf"><div class="rab-preview-pdf-frame"><iframe src="${url}#toolbar=0&navpanes=0&view=FitH" title="Preview PDF RAB" class="rab-preview-iframe"></iframe></div></div>`;
  }

  return `${header}<div class="rab-file-preview rab-preview-doc"><div class="rab-preview-placeholder">${icon('document', 40)}<p>File Excel — klik <strong>Unduh Asli</strong> untuk membuka di aplikasi spreadsheet</p></div></div>`;
}

function folderGrid(folders, baseHash, emptyMsg) {
  if (!folders.length) {
    return `<div class="table-empty">${icon('folder', 40)}<p>${escapeHtml(emptyMsg)}</p></div>`;
  }
  return `<div class="folder-grid">${folders
    .map(
      (f) => `
    <a href="#${baseHash}/${f.id}" class="folder-card">
      ${icon('folder', 32)}
      <h4>${escapeHtml(f.nama)}</h4>
      <span class="folder-meta">${formatDate(f.createdAt)}</span>
    </a>`
    )
    .join('')}</div>`;
}

/* ─── USER ─── */
function pageUserDashboard(user) {
  const list = getDB().pengajuan.filter((p) => p.userId === user.id);
  const pending = list.filter((p) => p.status === 'pending').length;
  const approved = list.filter((p) => p.status === 'approved').length;
  const rejected = list.filter((p) => p.status === 'rejected').length;
  const revisi = list.filter((p) => p.status === 'revisi').length;
  const recent = [...list].slice(0, 8);
  const cols = [
    { label: 'No. Pengajuan', render: (r) => `<span class="mono">${displayPengajuanId(r)}</span>` },
    { label: 'Judul', render: (r) => escapeHtml(r.judul || '-') },
    { label: 'Tanggal', render: (r) => formatDate(r.tanggal || r.createdAt) },
    { label: 'Status', render: (r) => badgeStatus(r.status) },
    {
      label: 'File',
      render: (r) => (r.fileUrl ? downloadLink(r.fileUrl, 'Unduh', '') : '—'),
    },
  ];
  const content = `
    ${statCards([
      { label: 'Total Pengajuan Saya', value: list.length, iconKey: 'pengajuan', variant: 'stat-primary' },
      { label: 'Menunggu', value: pending, iconKey: 'pending', variant: 'stat-warning' },
      { label: 'Disetujui', value: approved, iconKey: 'approved', variant: 'stat-success' },
      { label: 'Ditolak', value: rejected, iconKey: 'rejected', variant: 'stat-danger' },
      { label: 'Perlu Revisi', value: revisi, iconKey: 'edit', variant: 'stat-warning' },
    ])}
    ${revisi
      ? card(
          'Perlu Revisi',
          'Unggah ulang file RAB yang telah diperbaiki',
          table(
            [
              ...cols.slice(0, 4),
              {
                label: 'Aksi',
                render: (r) =>
                  `<a href="#/user/pengajuan/edit/${r.id}" class="btn btn-warning btn-sm">${icon('edit', 14)} Perbaiki</a>`,
              },
            ],
            list.filter((p) => p.status === 'revisi'),
            ''
          )
        )
      : ''}
    ${card('Riwayat Pengajuan Terbaru', 'Daftar pengajuan anggaran Anda', table(cols, recent, 'Belum ada pengajuan.'), btn('Pengajuan Baru', 'primary', { iconKey: 'add', href: '#/user/pengajuan/baru' }))}`;
  return renderLayout(user, 'Dashboard Karyawan', getNavItems('user', '/user'), content);
}

function pageUserTemplates(user, kindKey = 'rab') {
  const kind = getTemplateKind(kindKey);
  const folders = getFoldersByJenis(kind.jenis);
  const content = card(
    kind.userTitle,
    kind.userSubtitle,
    folderGrid(folders, kind.userRoute, kind.emptyUser)
  );
  return renderLayout(user, kind.label, getNavItems('user', kind.userRoute), content);
}

function pageUserTemplateFolder(user, folderId, kindKey = 'rab') {
  const kind = getTemplateKind(kindKey);
  const folder = getFolderById(folderId);
  if (!folder || (folder.jenis || 'rab') !== kind.jenis) {
    return renderLayout(
      user,
      kind.label,
      getNavItems('user', kind.userRoute),
      card('Folder tidak ditemukan', '', btn('Kembali', 'secondary', { href: `#${kind.userRoute}` }))
    );
  }
  const files = getFilesByFolder(folderId);
  const cols = [
    { label: 'Nama File', render: (r) => escapeHtml(r.namaFile) },
    { label: 'Jenis', render: (r) => fileTypeLabel(r.jenisFile) },
    { label: 'Ukuran', render: (r) => formatFileSize(r.ukuranBytes) },
    { label: 'Diunggah', render: (r) => formatDateTime(r.createdAt) },
    {
      label: 'Aksi',
      render: (r) =>
        `<a href="${r.publicUrl}" target="_blank" rel="noreferrer" class="btn btn-primary btn-sm btn-dl-template" data-file="${escapeHtml(r.namaFile)}" data-log="${escapeHtml(kind.logDownload)}" download>${icon('document', 14)} Unduh</a>`,
    },
  ];
  const content = `
    <a href="#${kind.userRoute}" class="back-link">${icon('back', 14)} Kembali ke folder</a>
    ${card(folder.nama, 'Unduh template, isi manual, lalu buat pengajuan', table(cols, files, 'Belum ada file di folder ini.'), btn('Buat Pengajuan', 'primary', { iconKey: 'add', href: '#/user/pengajuan/baru' }))}`;
  return renderLayout(user, folder.nama, getNavItems('user', kind.userRoute), content);
}

function bindUserTemplateFolder(user) {
  document.querySelectorAll('.btn-dl-template').forEach((btn) => {
    btn.addEventListener('click', () => {
      apiLogActivity(user, btn.dataset.log || 'Download Template', btn.dataset.file || '');
    });
  });
}

function pageUserPengajuan(user, editId) {
  const editing = editId ? getPengajuanFromStore(editId) : null;
  const isRevisi = editing?.status === 'revisi';
  const title = isRevisi ? 'Perbaiki Pengajuan (Revisi)' : 'Pengajuan Anggaran Baru';
  const content = `
    ${card(
      title,
      'Unduh template di menu Template RAB → isi file → unggah di sini (PDF, XLS, XLSX, maks ' + APP_LIMITS.MAX_FILE_MB + ' MB)',
      `
      <div class="alert alert-info" style="display:flex;margin-bottom:16px">
        ${icon('info', 18)}
        <span>Belum punya template? <a href="#/user/templates">Buka Template RAB</a> untuk mengunduh.</span>
      </div>
      <form id="pengajuanForm">
        <div id="formError" class="alert alert-error" style="display:none"></div>
        ${isRevisi ? `<p class="form-hint">Mengunggah ulang untuk: <strong>${escapeHtml(displayPengajuanId(editing))}</strong></p>` : ''}
        <div class="form-grid-2">
          <div class="form-group">
            <label>Judul Pengajuan *</label>
            <input id="judul" class="input" required value="${escapeHtml(editing?.judul || '')}" placeholder="Contoh: RAB Kegiatan Rapat Koordinasi" />
          </div>
          <div class="form-group">
            <label>Nomor Pengajuan *</label>
            ${
              isRevisi
                ? `<input class="input input-readonly" readonly value="${escapeHtml(displayPengajuanId(editing))}" />`
                : `<input id="kode" class="input" required maxlength="64" placeholder="Contoh: PGJ/2026/001" />
                   <p class="form-hint">Isi nomor sesuai format bagian Anda. Nomor harus unik.</p>`
            }
          </div>
          <div class="form-group">
            <label>Tanggal Pengajuan *</label>
            <input id="tanggal" type="date" class="input" required value="${editing?.tanggal || todayISO()}" />
          </div>
          <div class="form-group">
            <label>Nama Pengusul *</label>
            <input id="namaPengusul" class="input" required value="${escapeHtml(editing?.namaPengusul || user.nama || '')}" placeholder="Nama lengkap pengusul" />
          </div>
          <div class="form-group">
            <label>Divisi / Bagian *</label>
            <input id="divisi" class="input" required value="${escapeHtml(editing?.divisi || '')}" placeholder="Contoh: Bagian Keuangan" />
          </div>
        </div>
        <div class="form-group">
          <label>${icon('upload', 14)} Foto Bukti</label>
          <p class="form-hint">Unggah satu atau lebih foto pendukung (JPG, PNG, WEBP — maks ${APP_LIMITS.MAX_BUKTI_MB} MB per foto, hingga ${APP_LIMITS.MAX_BUKTI_COUNT} foto)</p>
          <div class="upload-zone">
            <input type="file" id="buktiInput" accept="image/*" multiple class="upload-input" />
            <label for="buktiInput" class="upload-label">
              ${icon('upload', 36, 'upload-icon-svg')}
              <span>Klik untuk unggah foto bukti</span>
              <span class="upload-hint">Bisa pilih banyak foto sekaligus</span>
            </label>
          </div>
          <div id="buktiPreview" class="bukti-preview-grid"></div>
        </div>
        <div class="form-group">
          <label>${icon('upload', 14)} Upload File RAB * (${APP_LIMITS.ALLOWED_PENGAJUAN_EXT.join(', ')})</label>
          <input type="file" id="rabFile" class="input" accept=".pdf,.xls,.xlsx" ${isRevisi ? '' : 'required'} />
          ${editing?.fileName ? `<p class="form-hint">File saat ini: ${escapeHtml(editing.fileName)} (${formatFileSize(editing.fileSize)})</p>` : ''}
        </div>
        <div class="submit-actions">
          <a href="#/user" class="btn btn-ghost">${icon('cancel', 16)} Batal</a>
          <button type="submit" class="btn btn-primary" id="btnSubmit">${icon('save', 16)} ${isRevisi ? 'Kirim Ulang' : 'Kirim Pengajuan'}</button>
        </div>
      </form>`
    )}`;
  const hash = editId ? `/user/pengajuan/edit/${editId}` : '/user/pengajuan/baru';
  return renderLayout(user, title, getNavItems('user', hash), content);
}

function bindUserPengajuan(user, editId) {
  const editing = editId ? getPengajuanFromStore(editId) : null;
  let buktiFiles = [];
  let buktiPreviewUrls = [];
  let keptBuktiUrls = editing?.bukti ? [...editing.bukti] : [];

  function renderBuktiPreview() {
    const el = document.getElementById('buktiPreview');
    if (!el) return;
    const existingHtml = keptBuktiUrls
      .map(
        (src, i) => `
      <div class="bukti-preview-item">
        <img src="${src}" alt="Foto ${i + 1}" />
        <button type="button" class="bukti-remove bukti-remove-existing" data-i="${i}" aria-label="Hapus">${icon('remove', 14)}</button>
      </div>`
      )
      .join('');
    const newHtml = buktiPreviewUrls
      .map(
        (src, i) => `
      <div class="bukti-preview-item">
        <img src="${src}" alt="Foto baru ${i + 1}" />
        <button type="button" class="bukti-remove bukti-remove-new" data-i="${i}" aria-label="Hapus">${icon('remove', 14)}</button>
      </div>`
      )
      .join('');
    el.innerHTML = existingHtml + newHtml;
    el.querySelectorAll('.bukti-remove-existing').forEach((btn) => {
      btn.onclick = () => {
        keptBuktiUrls.splice(parseInt(btn.dataset.i, 10), 1);
        renderBuktiPreview();
        refreshIcons(el);
      };
    });
    el.querySelectorAll('.bukti-remove-new').forEach((btn) => {
      btn.onclick = () => {
        const i = parseInt(btn.dataset.i, 10);
        URL.revokeObjectURL(buktiPreviewUrls[i]);
        buktiPreviewUrls.splice(i, 1);
        buktiFiles.splice(i, 1);
        renderBuktiPreview();
        refreshIcons(el);
      };
    });
    refreshIcons(el);
  }

  document.getElementById('buktiInput')?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    const total = keptBuktiUrls.length + buktiFiles.length + files.length;
    if (total > APP_LIMITS.MAX_BUKTI_COUNT) {
      showToast(`Maksimal ${APP_LIMITS.MAX_BUKTI_COUNT} foto bukti`, 'error');
      e.target.value = '';
      return;
    }
    for (const f of files) {
      const v = validateBuktiFile(f);
      if (!v.ok) {
        showToast(`${f.name}: ${v.message}`, 'error');
        continue;
      }
      buktiFiles.push(f);
      buktiPreviewUrls.push(URL.createObjectURL(f));
    }
    renderBuktiPreview();
    e.target.value = '';
  });

  renderBuktiPreview();

  document.getElementById('pengajuanForm').onsubmit = async (e) => {
    e.preventDefault();
    const err = document.getElementById('formError');
    err.style.display = 'none';
    const fileInput = document.getElementById('rabFile');
    const file = fileInput.files?.[0];
    if (!editing && !file) {
      err.textContent = 'Pilih file RAB';
      err.style.display = 'flex';
      return;
    }
    if (editing?.status === 'revisi' && !file) {
      err.textContent = 'Unggah file RAB yang sudah diperbaiki';
      err.style.display = 'flex';
      return;
    }

    if (!editing) {
      const kode = normalizeKode(document.getElementById('kode')?.value);
      if (!kode) {
        err.textContent = 'Nomor pengajuan wajib diisi';
        err.style.display = 'flex';
        return;
      }
      if (kode.length > 64) {
        err.textContent = 'Nomor pengajuan maksimal 64 karakter';
        err.style.display = 'flex';
        return;
      }
    }

    const btn = document.getElementById('btnSubmit');
    btn.disabled = true;
    try {
      let buktiUrls = [...keptBuktiUrls];
      if (buktiFiles.length) {
        const uploaded = await apiUploadBuktiFiles(user.id, buktiFiles);
        buktiUrls = [...buktiUrls, ...uploaded];
      }

      const namaPengusul = document.getElementById('namaPengusul')?.value.trim() || '';
      if (!namaPengusul) {
        err.textContent = 'Nama pengusul wajib diisi';
        err.style.display = 'flex';
        return;
      }

      if (editing?.status === 'revisi') {
        await apiUpdatePengajuanFile(editing.id, file, user, {
          judul: document.getElementById('judul').value.trim(),
          namaPengusul,
          divisi: document.getElementById('divisi').value.trim(),
          tanggal: document.getElementById('tanggal').value,
          buktiUrls,
        });
        showToast('Pengajuan revisi dikirim ulang');
      } else {
        const uploaded = await apiUploadPengajuanFile(user.id, file);
        await apiCreatePengajuan(
          {
            userId: user.id,
            kode: document.getElementById('kode').value,
            judul: document.getElementById('judul').value.trim(),
            namaPengusul,
            divisi: document.getElementById('divisi').value.trim(),
            tanggal: document.getElementById('tanggal').value,
            buktiUrls,
            fileName: uploaded.name,
            fileUrl: uploaded.url,
            storagePath: uploaded.path,
            fileType: uploaded.ext,
            fileSize: uploaded.size,
          },
          user
        );
        showToast('Pengajuan berhasil dikirim');
      }
      await reloadAppData(user);
      location.hash = '#/user';
      await render();
    } catch (ex) {
      handleApiError(ex);
      err.textContent = ex.message;
      err.style.display = 'flex';
    } finally {
      btn.disabled = false;
    }
  };
}

/* ─── ADMIN DASHBOARD ─── */
function pageAdminDashboard(user) {
  const db = getDB();
  const pengajuan = db.pengajuan;
  const pending = filterPendingPengajuan(pengajuan);
  const cols = [
    { label: 'No.', render: (r) => `<span class="mono">${displayPengajuanId(r)}</span>` },
    { label: 'Pengusul', render: (r) => escapeHtml(getPengusulNama(r)) },
    { label: 'Judul', render: (r) => escapeHtml(r.judul || '-') },
    { label: 'Tanggal', render: (r) => formatDate(r.tanggal || r.createdAt) },
    {
      label: 'Aksi',
      render: (r) => `<a href="#/admin/pengajuan/${r.id}" class="btn btn-primary btn-sm">${icon('eye', 14)} Review</a>`,
    },
  ];
  const content = `
    ${statCards([
      { label: 'Total Folder Template', value: db.folders.length, iconKey: 'template' },
      { label: 'Total File Template', value: db.templateFiles.length, iconKey: 'document' },
      { label: 'Total Pengajuan', value: pengajuan.length, iconKey: 'pengajuan', variant: 'stat-primary' },
      { label: 'Menunggu Persetujuan', value: pending.length, iconKey: 'pending', variant: 'stat-warning' },
      { label: 'Disetujui', value: pengajuan.filter((p) => p.status === 'approved').length, iconKey: 'approved', variant: 'stat-success' },
      { label: 'Ditolak', value: pengajuan.filter((p) => p.status === 'rejected').length, iconKey: 'rejected', variant: 'stat-danger' },
    ])}
    ${card('Antrian Pengajuan', 'Menunggu verifikasi — <a href="#/admin/pengajuan">lihat semua</a>', table(cols, pending.slice(0, 8), 'Tidak ada antrian'), '', { rawSubtitle: true })}`;
  return renderLayout(user, 'Dashboard Admin', getNavItems('admin', '/admin'), content);
}

/* ─── ADMIN TEMPLATES ─── */
function pageAdminTemplates(user, kindKey = 'rab') {
  const kind = getTemplateKind(kindKey);
  const folders = getFoldersByJenis(kind.jenis);
  const content = card(
    kind.adminTitle,
    kind.adminSubtitle,
    `<div id="folderGrid" data-template-kind="${kind.key}">${folderGrid(folders, kind.adminRoute, kind.emptyAdmin)}</div>`,
    btn('Tambah Folder', 'primary', { iconKey: 'add', id: 'btnAddFolder' })
  );
  return renderLayout(user, kind.label, getNavItems('admin', kind.adminRoute), content);
}

function bindAdminTemplates(user, kindKey = 'rab') {
  const kind = getTemplateKind(kindKey);
  document.getElementById('btnAddFolder')?.addEventListener('click', () => {
    openModal(
      'folderModal',
      'Folder Template Baru',
      `<div class="form-group"><label>Nama Folder *</label><input id="folderNama" class="input" placeholder="${escapeHtml(kind.folderPlaceholder)}" /></div>`,
      `<button class="btn btn-ghost" data-close-modal>Batal</button><button class="btn btn-primary" id="folderSave">Simpan</button>`
    );
    document.getElementById('folderSave').onclick = async () => {
      const nama = document.getElementById('folderNama').value.trim();
      if (!nama) return showToast('Nama folder wajib', 'error');
      try {
        const f = await apiCreateFolder(nama, user, kind.jenis);
        patchFolderInStore(f);
        closeModal('folderModal');
        showToast('Folder dibuat');
        await render();
      } catch (e) {
        handleApiError(e);
      }
    };
  });

  document.querySelectorAll('.folder-card').forEach((card) => {
    card.addEventListener('contextmenu', (e) => e.preventDefault());
  });
}

function pageAdminTemplateFolder(user, folderId, kindKey = 'rab') {
  const kind = getTemplateKind(kindKey);
  const folder = getFolderById(folderId);
  if (!folder || (folder.jenis || 'rab') !== kind.jenis) {
    return renderLayout(
      user,
      kind.label,
      getNavItems('admin', kind.adminRoute),
      card('Folder tidak ada', '', btn('Kembali', 'secondary', { href: `#${kind.adminRoute}` }))
    );
  }
  const files = getFilesByFolder(folderId);
  const cols = [
    { label: 'Nama File', render: (r) => escapeHtml(r.namaFile) },
    { label: 'Jenis', render: (r) => fileTypeLabel(r.jenisFile) },
    { label: 'Ukuran', render: (r) => formatFileSize(r.ukuranBytes) },
    { label: 'Upload', render: (r) => formatDateTime(r.createdAt) },
    { label: 'Diubah', render: (r) => formatDateTime(r.updatedAt || r.createdAt) },
    {
      label: 'Aksi',
      render: (r) => `
        <div class="action-group">
          <a href="${r.publicUrl}" download class="btn btn-secondary btn-sm">${icon('document', 14)} Unduh</a>
          <button type="button" class="btn btn-secondary btn-sm tpl-replace" data-id="${r.id}">${icon('edit', 14)} Ganti</button>
          <button type="button" class="btn btn-danger btn-sm tpl-del" data-id="${r.id}">${icon('remove', 14)} Hapus</button>
        </div>`,
    },
  ];
  const content = `
    <div class="detail-header" style="margin-bottom:16px" data-template-kind="${kind.key}">
      <div>
        <a href="#${kind.adminRoute}" class="back-link">${icon('back', 14)} Kembali</a>
        <h2 class="detail-title">${escapeHtml(folder.nama)}</h2>
      </div>
      <div class="action-group">
        <button type="button" class="btn btn-secondary btn-sm" id="btnEditFolder">${icon('edit', 14)} Edit Nama</button>
        <button type="button" class="btn btn-danger btn-sm" id="btnDelFolder">${icon('remove', 14)} Hapus Folder</button>
        <label class="btn btn-primary btn-sm" style="cursor:pointer">
          ${icon('upload', 14)} Upload File
          <input type="file" id="tplUpload" accept="${kind.accept}" hidden />
        </label>
      </div>
    </div>
    ${card('File Template', `${kind.fileTypes} — maks ${APP_LIMITS.MAX_FILE_MB} MB per file`, table(cols, files, 'Belum ada file. Klik Upload File.'))}`;
  return renderLayout(user, folder.nama, getNavItems('admin', kind.adminRoute), content);
}

function bindAdminTemplateFolder(user, folderId, kindKey = 'rab') {
  const kind = getTemplateKind(kindKey);
  document.getElementById('tplUpload')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const row = await apiUploadTemplateFile(folderId, file, user);
      patchTemplateFileInStore(row);
      showToast('File diunggah');
      await render();
    } catch (err) {
      handleApiError(err);
    }
    e.target.value = '';
  });

  document.getElementById('btnEditFolder')?.addEventListener('click', () => {
    const folder = getFolderById(folderId);
    openModal('folderModal', 'Edit Folder', `<input id="folderNama" class="input" value="${escapeHtml(folder.nama)}" />`, `<button class="btn btn-primary" id="folderSave">Simpan</button>`);
    document.getElementById('folderSave').onclick = async () => {
      try {
        await apiUpdateFolder(folderId, document.getElementById('folderNama').value.trim(), user);
        await reloadAppData(user);
        await render();
      } catch (e) {
        handleApiError(e);
      }
    };
  });

  document.getElementById('btnDelFolder')?.addEventListener('click', async () => {
    if (!confirm('Hapus folder dan semua file di dalamnya?')) return;
    try {
      await apiDeleteFolder(folderId, user);
      removeFolderFromStore(folderId);
      location.hash = `#${kind.adminRoute}`;
      await render();
    } catch (e) {
      handleApiError(e);
    }
  });

  document.querySelectorAll('.tpl-del').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('Hapus file ini?')) return;
      try {
        await apiDeleteTemplateFile(btn.dataset.id, user);
        removeTemplateFileFromStore(btn.dataset.id);
        await render();
      } catch (e) {
        handleApiError(e);
      }
    };
  });

  document.querySelectorAll('.tpl-replace').forEach((btn) => {
    btn.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = kind.accept;
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const row = await apiReplaceTemplateFile(btn.dataset.id, file, user);
          patchTemplateFileInStore(row);
          showToast('File diganti');
          await render();
        } catch (e) {
          handleApiError(e);
        }
      };
      input.click();
    };
  });
}

/* ─── ADMIN PENGAJUAN / RIWAYAT ─── */
function pageAdminPengajuanList(user) {
  const content = card('Menunggu Persetujuan', 'Review file RAB yang diunggah pengusul', `<div id="pengajuanTable"></div>`);
  return renderLayout(user, 'Pengajuan', getNavItems('admin', '/admin/pengajuan'), content);
}

function bindAdminPengajuanList() {
  const cols = pengajuanTableCols(true);
  const items = filterPendingPengajuan(getDB().pengajuan);
  document.getElementById('pengajuanTable').innerHTML = table(cols, items, 'Tidak ada pengajuan menunggu');
  refreshIcons(document.getElementById('pengajuanTable'));
}

function getPengusulNama(p) {
  if (!p) return '-';
  const fromForm = (p.namaPengusul || '').trim();
  if (fromForm) return fromForm;
  return getUserById(p.userId)?.nama || '-';
}

function filterPengajuanByPengusul(items, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return items;
  return items.filter((p) => getPengusulNama(p).toLowerCase().includes(q));
}

function riwayatToolbarHtml(filterId, searchId) {
  return `
    <div class="riwayat-toolbar">
      <div class="riwayat-search">
        <span class="riwayat-search-icon">${icon('search', 16)}</span>
        <input type="search" id="${searchId}" class="input riwayat-search-input" placeholder="Cari nama pengusul..." autocomplete="off" />
      </div>
      <div class="filter-tabs" id="${filterId}">
        <button type="button" class="filter-tab filter-tab-active" data-filter="all">${icon('filter', 14)} Semua</button>
        <button type="button" class="filter-tab" data-filter="approved">${icon('approved', 14)} Disetujui</button>
        <button type="button" class="filter-tab" data-filter="rejected">${icon('rejected', 14)} Ditolak</button>
      </div>
    </div>`;
}

function pageAdminRiwayatList(user) {
  const content = card(
    'Arsip Keputusan',
    'Pengajuan yang sudah diproses',
    `
    ${riwayatToolbarHtml('riwayatFilterTabs', 'riwayatSearchPengusul')}
    <div id="riwayatTable"></div>`
  );
  return renderLayout(user, 'Riwayat', getNavItems('admin', '/admin/riwayat'), content);
}

function pengajuanTableCols(reviewOnly, basePath = '/admin') {
  const cols = [
    { label: 'No. Pengajuan', render: (r) => `<span class="mono">${displayPengajuanId(r)}</span>` },
    { label: 'Pengusul', render: (r) => escapeHtml(getPengusulNama(r)) },
    { label: 'Divisi', render: (r) => escapeHtml(r.divisi || '-') },
    { label: 'Judul', render: (r) => escapeHtml(r.judul || '-') },
    { label: 'Tanggal', render: (r) => formatDate(r.tanggal || r.createdAt) },
    { label: 'Status', render: (r) => badgeStatus(r.status) },
    {
      label: 'Aksi',
      render: (r) => {
        const segment =
          basePath === '/user' ? 'riwayat' : r.status === 'pending' ? 'pengajuan' : 'riwayat';
        const label = reviewOnly ? 'Review' : 'Detail';
        const btnClass = reviewOnly ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';
        return `<a href="#${basePath}/${segment}/${r.id}" class="${btnClass}">${icon('eye', 14)} ${label}</a>`;
      },
    },
  ];
  return cols;
}

function userRiwayatPengajuan(user) {
  return filterRiwayatPengajuan(getDB().pengajuan).filter((p) => p.userId === user.id);
}

function pageUserRiwayatList(user) {
  const content = card(
    'Arsip Keputusan',
    'Riwayat pengajuan Anda yang sudah diproses',
    `
    ${riwayatToolbarHtml('userRiwayatFilterTabs', 'userRiwayatSearchPengusul')}
    <div id="userRiwayatTable"></div>`
  );
  return renderLayout(user, 'Riwayat', getNavItems('user', '/user/riwayat'), content);
}

function bindRiwayatListDraw(opts) {
  const { getItems, tableId, filterTabsId, searchId, cols, defaultEmpty } = opts;
  let filter = 'all';
  let searchQuery = '';

  const draw = () => {
    let items = getItems();
    if (filter === 'approved') items = items.filter((p) => p.status === 'approved');
    if (filter === 'rejected') items = items.filter((p) => p.status === 'rejected');
    items = filterPengajuanByPengusul(items, searchQuery);
    const emptyMsg =
      searchQuery.trim() && items.length === 0 ? 'Data pengusul tidak ditemukan.' : defaultEmpty;
    const el = document.getElementById(tableId);
    if (el) {
      el.innerHTML = table(cols, items, emptyMsg);
      refreshIcons(el);
    }
  };

  draw();

  document.querySelectorAll(`#${filterTabsId} .filter-tab`).forEach((btn) => {
    btn.onclick = () => {
      filter = btn.dataset.filter;
      document.querySelectorAll(`#${filterTabsId} .filter-tab`).forEach((b) => b.classList.remove('filter-tab-active'));
      btn.classList.add('filter-tab-active');
      draw();
    };
  });

  const searchEl = document.getElementById(searchId);
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      searchQuery = searchEl.value;
      draw();
    });
  }
}

function bindUserRiwayatList(user) {
  bindRiwayatListDraw({
    getItems: () => userRiwayatPengajuan(user),
    tableId: 'userRiwayatTable',
    filterTabsId: 'userRiwayatFilterTabs',
    searchId: 'userRiwayatSearchPengusul',
    cols: pengajuanTableCols(false, '/user'),
    defaultEmpty: 'Belum ada arsip pengajuan',
  });
}

function bindAdminRiwayatList() {
  bindRiwayatListDraw({
    getItems: () => filterRiwayatPengajuan(getDB().pengajuan),
    tableId: 'riwayatTable',
    filterTabsId: 'riwayatFilterTabs',
    searchId: 'riwayatSearchPengusul',
    cols: pengajuanTableCols(false),
    defaultEmpty: 'Belum ada arsip',
  });
}

function pagePengajuanDetail(viewer, id, context, scope = 'admin') {
  const isAdmin = scope === 'admin';
  const basePath = isAdmin ? '/admin' : '/user';
  const navHash = context === 'riwayat' ? `${basePath}/riwayat` : `${basePath}/pengajuan`;
  const backHref = context === 'riwayat' ? `#${basePath}/riwayat` : `#${basePath}/pengajuan`;
  const p = getPengajuanFromStore(id);

  if (!p || (!isAdmin && p.userId !== viewer.id)) {
    return renderLayout(
      viewer,
      'Detail',
      getNavItems(viewer.role, navHash),
      card('Tidak ditemukan', 'Data tidak ada atau Anda tidak memiliki akses', btn('Kembali', 'secondary', { href: backHref }))
    );
  }

  const karyawan = getUserById(p.userId);
  const fileBlock = rabFilePreviewHtml(p);

  const actions =
    isAdmin && context === 'pengajuan' && p.status === 'pending'
      ? `<div class="detail-actions">
          <button type="button" class="btn btn-success" id="btnApprove">${icon('approved', 16)} Setujui</button>
          <button type="button" class="btn btn-warning" id="btnRevisi">${icon('edit', 16)} Revisi</button>
          <button type="button" class="btn btn-danger" id="btnReject">${icon('rejected', 16)} Ditolak</button>
          <button type="button" class="btn btn-secondary" id="btnPrint">${icon('document', 16)} Cetak</button>
        </div>`
      : `<div class="detail-actions"><button type="button" class="btn btn-secondary" id="btnPrint">${icon('document', 16)} Cetak</button></div>`;

  const content = `
    ${pengajuanPrintDocumentHtml(p, karyawan)}
    <div class="screen-only">
      <div class="detail-header">
        <div>
          <a href="${backHref}" class="back-link">${icon('back', 14)} Kembali</a>
          <h2 class="detail-title">${escapeHtml(displayPengajuanId(p))}</h2>
          <div class="detail-badges">${badgeStatus(p.status)}</div>
        </div>
        ${actions}
      </div>
      <div class="detail-layout">
        ${card('Informasi Pengajuan', 'Ringkasan data pengajuan anggaran', detailInfoGridHtml(p, karyawan))}
        ${card('Foto Bukti', `${p.bukti?.length || 0} foto pendukung pengajuan`, buktiGalleryHtml(p.bukti))}
        ${card('File RAB Pengajuan', 'Pratinjau dokumen rencana anggaran biaya', fileBlock, '', { className: 'detail-card-rab' })}
      </div>
    </div>`;
  return renderLayout(viewer, 'Detail Pengajuan', getNavItems(viewer.role, navHash), content);
}

function pageAdminDetail(user, id, context) {
  return pagePengajuanDetail(user, id, context, 'admin');
}

function pageUserDetail(user, id) {
  return pagePengajuanDetail(user, id, 'riwayat', 'user');
}

function bindPengajuanDetail(id, context, user, scope = 'admin') {
  const p = getPengajuanFromStore(id);
  if (p?.bukti?.length) {
    renderBuktiPrintPreview(p.bukti).catch((e) => console.warn('Bukti print preview:', e));
  }
  if (p?.fileUrl) {
    renderRabPrintPreview(p).catch((e) => console.warn('RAB print preview:', e));
  }
  document.getElementById('btnPrint')?.addEventListener('click', () => {
    handlePengajuanPrint(p);
  });
  document.getElementById('btnDlPengajuan')?.addEventListener('click', () => {
    apiLogActivity(user, 'Download File Pengajuan', p?.kode || id);
  });
  if (scope !== 'admin' || !p || context !== 'pengajuan' || p.status !== 'pending') return;
  document.getElementById('btnApprove')?.addEventListener('click', () => showStatusModal(p, 'approved', user));
  document.getElementById('btnReject')?.addEventListener('click', () => showStatusModal(p, 'rejected', user));
  document.getElementById('btnRevisi')?.addEventListener('click', () => showStatusModal(p, 'revisi', user));
}

function bindAdminDetail(id, context, user) {
  bindPengajuanDetail(id, context, user, 'admin');
}

function bindUserDetail(id, user) {
  bindPengajuanDetail(id, 'riwayat', user, 'user');
}

function showStatusModal(pengajuan, status, user) {
  const labels = { approved: 'Setujui', rejected: 'Tolak', revisi: 'Minta Revisi' };
  const body = `<div class="form-group"><label>Catatan / Pesan untuk pengusul *</label><textarea id="modalPesan" class="input textarea" rows="4"></textarea></div>`;
  openModal('statusModal', labels[status] + ' Pengajuan', body, `<button class="btn btn-ghost" data-close-modal>Batal</button><button class="btn btn-primary" id="modalConfirm">Simpan</button>`);
  document.getElementById('modalConfirm').onclick = async () => {
    const pesan = document.getElementById('modalPesan').value.trim();
    if (!pesan) return showToast('Isi catatan', 'error');
    try {
      const updated = await apiUpdatePengajuanStatus(pengajuan.id, { status, pesanAdmin: pesan }, user);
      patchPengajuanInStore(updated);
      closeModal('statusModal');
      showToast('Status diperbarui');
      location.hash = status === 'approved' || status === 'rejected' ? '#/admin/riwayat' : '#/admin/pengajuan';
      await render();
    } catch (e) {
      handleApiError(e);
    }
  };
}

function pageAdminActivity(user) {
  const logs = getDB().activityLogs;
  const cols = [
    { label: 'Waktu', render: (r) => formatDateTime(r.createdAt) },
    { label: 'Pengguna', render: (r) => escapeHtml(r.userNama) },
    { label: 'Role', render: (r) => escapeHtml(r.userRole) },
    { label: 'Aktivitas', render: (r) => escapeHtml(r.aktivitas) },
    { label: 'Detail', render: (r) => `<span class="td-ellipsis">${escapeHtml(r.detail || '—')}</span>` },
  ];
  const clearBtn = logs.length
    ? `<button type="button" class="btn btn-danger btn-sm" id="btnClearLogs">${icon('remove', 14)} Bersihkan Histori</button>`
    : '';
  const content = card(
    'Riwayat Aktivitas Sistem',
    'Log upload template, download, pengajuan, dan verifikasi',
    `<div id="activityTable">${table(cols, logs, 'Belum ada aktivitas tercatat.')}</div>`,
    clearBtn
  );
  return renderLayout(user, 'Log Aktivitas', getNavItems('admin', '/admin/aktivitas'), content);
}

function bindAdminActivity(user) {
  document.getElementById('btnClearLogs')?.addEventListener('click', async () => {
    if (!confirm('Hapus semua riwayat log aktivitas?\n\nTindakan ini tidak dapat dibatalkan.')) return;
    try {
      await apiClearActivityLogs(user);
      clearActivityLogsInStore();
      showToast('Riwayat log aktivitas telah dibersihkan');
      const cols = [
        { label: 'Waktu', render: (r) => formatDateTime(r.createdAt) },
        { label: 'Pengguna', render: (r) => escapeHtml(r.userNama) },
        { label: 'Role', render: (r) => escapeHtml(r.userRole) },
        { label: 'Aktivitas', render: (r) => escapeHtml(r.aktivitas) },
        { label: 'Detail', render: (r) => `<span class="td-ellipsis">${escapeHtml(r.detail || '—')}</span>` },
      ];
      document.getElementById('activityTable').innerHTML = table(cols, [], 'Belum ada aktivitas tercatat.');
      document.getElementById('btnClearLogs')?.remove();
      refreshIcons();
    } catch (e) {
      handleApiError(e);
    }
  });
}
