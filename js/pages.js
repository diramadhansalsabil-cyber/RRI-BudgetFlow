function pageLogin() {
  return `
  <div class="login-page">
    <div class="login-bg"></div>
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">${logoMark(72)}</div>
        <h1>RRI BudgetFlow</h1>
        <p class="login-tagline">Sistem Pengajuan Anggaran</p>
      </div>
      <form id="loginForm" class="login-form">
        <div id="loginError" class="alert alert-error" style="display:none"></div>
        <div class="form-group">
          <label for="username">${icon('user', 14)} Username atau Email</label>
          <input id="username" class="input" required placeholder="admin atau admin@rribudgetflow.test" autocomplete="username" />
        </div>
        <div class="form-group">
          <label for="password">${icon('login', 14)} Password</label>
          <input id="password" type="password" class="input" required placeholder="••••••••" autocomplete="current-password" />
        </div>
        <button type="submit" class="btn btn-primary login-btn">${icon('login', 18)} Masuk ke Dashboard</button>
      </form>
      <div class="login-demo">
        <p class="login-demo-title">Akun Demo (Supabase Auth)</p>
        <div class="login-demo-grid">
          <button type="button" class="demo-chip" data-user="admin" data-pass="admin123">
            ${icon('admin', 20)}
            <div><strong>Administrator</strong><span>admin / admin123</span></div>
          </button>
          <button type="button" class="demo-chip" data-user="user" data-pass="user123">
            ${icon('user', 20)}
            <div><strong>Karyawan</strong><span>user / user123</span></div>
          </button>
        </div>
      </div>
    </div>
  </div>`;
}

function bindLogin() {
  document.querySelectorAll('.demo-chip').forEach((btn) => {
    btn.onclick = () => {
      document.getElementById('username').value = btn.dataset.user;
      document.getElementById('password').value = btn.dataset.pass;
    };
  });
  document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const err = document.getElementById('loginError');
    const btn = e.target.querySelector('button[type="submit"]');
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value;
    err.style.display = 'none';
    btn.disabled = true;
    try {
      const result = await login(u, p);
      if (result?.ok && result.profile) {
        showToast(`Selamat datang, ${result.profile.nama}!`);
        location.hash = result.profile.role === 'admin' ? '#/admin' : '#/user';
        await render();
      } else {
        err.textContent = result?.message || 'Username atau password salah';
        err.style.display = 'flex';
      }
    } catch (ex) {
      handleApiError(ex, 'Gagal masuk. Periksa koneksi dan konfigurasi Supabase.');
      err.textContent = ex.message || 'Gagal masuk';
      err.style.display = 'flex';
    } finally {
      btn.disabled = false;
    }
  };
}

function pageUserDashboard(user) {
  const db = getDB();
  const list = (db.pengajuan || [])
    .filter((p) => p.userId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const pending = list.filter((p) => p.status === 'pending').length;
  const approved = list.filter((p) => p.status === 'approved').length;
  const total = list.reduce((s, p) => s + (p.totalAnggaran || 0), 0);

  const cols = [
    { label: 'ID', render: (r) => `<span class="mono">${displayPengajuanId(r)}</span>` },
    { label: 'Template RAB', render: (r) => escapeHtml(getTemplateById(r.templateId)?.namaTemplate || '-') },
    { label: 'Total Anggaran', render: (r) => `<span class="td-money">${formatCurrency(r.totalAnggaran)}</span>` },
    { label: 'Tanggal', render: (r) => formatDate(r.tanggal || r.createdAt) },
    { label: 'Status', render: (r) => badgeStatus(r.status) },
    {
      label: 'Pesan Admin',
      render: (r) =>
        r.pesanAdmin
          ? `<span class="admin-message" title="${escapeHtml(r.pesanAdmin)}">${escapeHtml(r.pesanAdmin)}</span>`
          : '<span class="text-muted">—</span>',
    },
  ];

  const content = `
    ${statCards([
      { label: 'Total Pengajuan', value: list.length, iconKey: 'pengajuan', variant: 'stat-primary' },
      { label: 'Menunggu', value: pending, iconKey: 'pending', variant: 'stat-warning' },
      { label: 'Disetujui', value: approved, iconKey: 'approved', variant: 'stat-success' },
      { label: 'Nilai Diajukan', value: formatCurrency(total), iconKey: 'money', variant: 'stat-primary', small: true },
    ])}
    ${card(
      'Pengajuan Saya',
      'Daftar pengajuan anggaran berbasis template RAB',
      table(cols, list, 'Belum ada pengajuan. Buat pengajuan baru untuk memulai.'),
      btn('Pengajuan Baru', 'primary', { iconKey: 'add', href: '#/user/pengajuan/baru' })
    )}`;

  return renderLayout(user, 'Dashboard Karyawan', getNavItems('user', '/user'), content);
}

function pageUserPengajuan(user) {
  const db = getDB();
  const allTemplates = db.templates || [];
  const templates = allTemplates.filter(isUsableTemplate);

  const content = `
    ${card(
      'Form Pengajuan Anggaran',
      'Pilih template RAB — form dibuat otomatis dari struktur template',
      `
      <form id="pengajuanForm">
        <div id="formError" class="alert alert-error" style="display:none"></div>
        ${
          templates.length === 0
            ? `<div class="alert alert-error">${icon('alert', 18)} Belum ada template RAB yang siap dipakai. Minta admin menambahkan template di menu <strong>Template RAB</strong>.</div>`
            : ''
        }
        <div class="form-group">
          <label for="templateId">${icon('template', 14)} Template RAB *</label>
          <select id="templateId" class="input select" required ${templates.length === 0 ? 'disabled' : ''}>
            <option value="">— Pilih Template —</option>
            ${templates.map((t) => `<option value="${t.id}">${escapeHtml(t.namaTemplate)}</option>`).join('')}
          </select>
          <p id="templateDesc" class="form-hint">${templates.length ? 'Daftar template diperbarui dari data admin' : ''}</p>
        </div>
        <div id="rabSection" style="display:none">
          <div class="section-divider">
            <h3>${icon('calculator', 18)} Data RAB</h3>
            <p>Tambah/hapus baris seperti Excel. Total dihitung otomatis.</p>
          </div>
          <div id="dynamicForm"></div>
          <div class="section-divider">
            <h3>${icon('upload', 18)} Upload Bukti Pendukung</h3>
            <p>Gambar dikonversi ke Base64 (maks. disarankan &lt; 2MB per file)</p>
          </div>
          <div class="upload-zone">
            <input type="file" id="buktiInput" accept="image/*" multiple class="upload-input" />
            <label for="buktiInput" class="upload-label">
              ${icon('upload', 36, 'upload-icon-svg')}
              <span>Klik untuk unggah gambar</span>
              <span class="upload-hint">PNG, JPG — multiple file</span>
            </label>
          </div>
          <div id="buktiPreview" class="bukti-preview-grid"></div>
          <div class="submit-summary">
            <div><span>Total yang diajukan</span><strong id="submitTotal">${formatCurrency(0)}</strong></div>
            <div class="submit-actions">
              <a href="#/user" class="btn btn-ghost">${icon('cancel', 16)} Batal</a>
              <button type="submit" class="btn btn-primary" id="btnSubmit">${icon('save', 16)} Kirim Pengajuan</button>
            </div>
          </div>
        </div>
      </form>`
    )}`;

  return renderLayout(user, 'Pengajuan Baru', getNavItems('user', '/user/pengajuan/baru'), content);
}

function bindUserPengajuan(user) {
  let rabData = null;
  let buktiFiles = [];
  let buktiPreviewUrls = [];
  let template = null;
  const formEl = document.getElementById('dynamicForm');
  const section = document.getElementById('rabSection');
  const templateSelect = document.getElementById('templateId');

  function syncTemplateOptions() {
    const db = getDB();
    const list = (db.templates || []).filter(isUsableTemplate);
    const current = templateSelect.value;
    templateSelect.innerHTML =
      `<option value="">— Pilih Template —</option>` +
      list.map((t) => `<option value="${t.id}">${escapeHtml(t.namaTemplate)}</option>`).join('');
    if (current && list.some((t) => t.id === current)) templateSelect.value = current;
  }

  function updateTotal() {
    if (!template) return;
    const total = isSectionTemplate(template)
      ? getSectionGrandTotal(rabData, template)
      : getGrandTotal(rabData, template);
    document.getElementById('submitTotal').textContent = formatCurrency(total);
  }

  function applyTemplate(id) {
    template = getTemplateById(id);
    const desc = document.getElementById('templateDesc');
    const err = document.getElementById('formError');
    err.style.display = 'none';

    if (!template || !isUsableTemplate(template)) {
      desc.textContent = '';
      section.style.display = 'none';
      formEl.innerHTML = '';
      rabData = null;
      template = null;
      return;
    }

    try {
      desc.textContent = template.deskripsi || '';
      rabData = isSectionTemplate(template) ? createEmptySectionData(template) : createInitialRows(template, 1);
      section.style.display = 'block';
      renderDynamicForm(formEl, template, rabData, (d) => {
        rabData = d;
        updateTotal();
      });
      updateTotal();
    } catch (e) {
      console.error(e);
      section.style.display = 'none';
      formEl.innerHTML = '';
      rabData = null;
      template = null;
      err.textContent = 'Gagal memuat form RAB. Periksa struktur template atau hubungi admin.';
      err.style.display = 'flex';
      showToast('Form RAB tidak dapat ditampilkan', 'error');
    }
  }

  syncTemplateOptions();
  templateSelect.onchange = (e) => applyTemplate(e.target.value);
  if (templateSelect.value) applyTemplate(templateSelect.value);

  document.getElementById('buktiInput').onchange = (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      if (f.size > 3 * 1024 * 1024) {
        showToast(`File ${f.name} terlalu besar (maks 3MB)`, 'error');
        continue;
      }
      buktiFiles.push(f);
      buktiPreviewUrls.push(URL.createObjectURL(f));
    }
    renderBuktiPreview();
    e.target.value = '';
  };

  function renderBuktiPreview() {
    const el = document.getElementById('buktiPreview');
    el.innerHTML = buktiPreviewUrls
      .map(
        (src, i) => `
      <div class="bukti-preview-item">
        <img src="${src}" alt="Bukti ${i + 1}" />
        <button type="button" class="bukti-remove" data-i="${i}" aria-label="Hapus">${icon('remove', 14)}</button>
      </div>`
      )
      .join('');
    el.querySelectorAll('.bukti-remove').forEach((btn) => {
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

  document.getElementById('pengajuanForm').onsubmit = async (e) => {
    e.preventDefault();
    const err = document.getElementById('formError');
    err.style.display = 'none';
    if (!template) {
      err.textContent = 'Pilih template RAB terlebih dahulu';
      err.style.display = 'flex';
      return;
    }
    const validation = isSectionTemplate(template)
      ? validateSectionData(rabData, template)
      : validateRABRows(rabData, template);
    if (!validation.ok) {
      err.textContent = validation.message;
      err.style.display = 'flex';
      return;
    }
    const dataRAB = isSectionTemplate(template)
      ? prepareSectionData(rabData, template)
      : prepareDataRAB(rabData, template);
    const grandTotal = isSectionTemplate(template)
      ? dataRAB.grandTotal
      : dataRAB.reduce((s, i) => s + (i.total || 0), 0);
    if (grandTotal <= 0) {
      err.textContent = 'Total anggaran harus lebih dari 0';
      err.style.display = 'flex';
      return;
    }
    const submitBtn = document.getElementById('btnSubmit');
    submitBtn.disabled = true;
    try {
      let buktiUrls = [];
      if (buktiFiles.length) {
        buktiUrls = await apiUploadBuktiFiles(user.id, buktiFiles);
      }
      const created = await apiCreatePengajuan({
        userId: user.id,
        templateId: template.id,
        dataRAB,
        totalAnggaran: grandTotal,
        tanggal: todayISO(),
        buktiUrls,
      });
      patchPengajuanInStore(created);
      showToast('Pengajuan berhasil dikirim!');
      location.hash = '#/user';
      await render();
    } catch (ex) {
      handleApiError(ex, 'Gagal mengirim pengajuan');
      err.textContent = ex.message || 'Gagal mengirim pengajuan';
      err.style.display = 'flex';
    } finally {
      submitBtn.disabled = false;
    }
  };
}

function filterPendingPengajuan(list) {
  return (list || []).filter((p) => p.status === 'pending');
}

function filterRiwayatPengajuan(list) {
  return (list || []).filter((p) => p.status === 'approved' || p.status === 'rejected');
}

function pageAdminDashboard(user) {
  const db = getDB();
  const list = db.pengajuan || [];
  const pendingList = filterPendingPengajuan(list);
  const riwayatList = filterRiwayatPengajuan(list);
  const pending = pendingList.length;
  const approved = list.filter((p) => p.status === 'approved').length;
  const rejected = list.filter((p) => p.status === 'rejected').length;
  const totalValue = list.reduce((s, p) => s + (p.totalAnggaran || 0), 0);
  const queue = [...pendingList]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);
  const recentDecisions = [...riwayatList]
    .sort((a, b) => new Date(b.tanggalKeputusan || b.updatedAt || 0) - new Date(a.tanggalKeputusan || a.updatedAt || 0))
    .slice(0, 8);

  const pendingCols = [
    { label: 'ID', render: (r) => `<span class="mono">${displayPengajuanId(r)}</span>` },
    { label: 'Karyawan', render: (r) => escapeHtml(getUserById(r.userId)?.nama || '-') },
    { label: 'Template', render: (r) => escapeHtml(getTemplateById(r.templateId)?.namaTemplate || '-') },
    { label: 'Total', render: (r) => `<span class="td-money">${formatCurrency(r.totalAnggaran)}</span>` },
    { label: 'Tanggal', render: (r) => formatDate(r.tanggal || r.createdAt) },
    {
      label: 'Aksi',
      render: (r) =>
        `<a href="#/admin/pengajuan/${r.id}" class="btn btn-primary btn-sm">${icon('eye', 14)} Review</a>`,
    },
  ];

  const riwayatCols = [
    { label: 'ID', render: (r) => `<span class="mono">${displayPengajuanId(r)}</span>` },
    { label: 'Karyawan', render: (r) => escapeHtml(getUserById(r.userId)?.nama || '-') },
    { label: 'Status', render: (r) => badgeStatus(r.status) },
    { label: 'Disetujui', render: (r) => (r.approvedAmount != null ? formatCurrency(r.approvedAmount) : '—') },
    { label: 'Keputusan', render: (r) => formatDateTime(r.tanggalKeputusan || r.updatedAt) },
    {
      label: 'Aksi',
      render: (r) =>
        `<a href="#/admin/riwayat/${r.id}" class="btn btn-secondary btn-sm">${icon('eye', 14)} Detail</a>`,
    },
  ];

  const content = `
    ${statCards([
      { label: 'Menunggu Review', value: pending, iconKey: 'pending', variant: 'stat-warning' },
      { label: 'Disetujui', value: approved, iconKey: 'approved', variant: 'stat-success' },
      { label: 'Ditolak', value: rejected, iconKey: 'rejected', variant: 'stat-danger' },
      { label: 'Total Nilai Diajukan', value: formatCurrency(totalValue), iconKey: 'chart', variant: 'stat-primary stat-wide', small: true },
    ])}
    ${card(
      'Menunggu Persetujuan',
      'Pengajuan yang perlu diproses — <a href="#/admin/pengajuan">buka halaman Pengajuan</a>',
      table(pendingCols, queue, 'Tidak ada pengajuan menunggu')
    )}
    ${card(
      'Keputusan Terbaru',
      'Arsip approve / reject — <a href="#/admin/riwayat">buka Riwayat</a>',
      table(riwayatCols, recentDecisions, 'Belum ada keputusan admin')
    )}`;

  return renderLayout(user, 'Dashboard Admin', getNavItems('admin', '/admin'), content);
}

function pageAdminPengajuanList(user) {
  const content = card(
    'Menunggu Persetujuan',
    'Review pengajuan, lalu setujui atau tolak. Setelah diproses, data otomatis masuk ke halaman Riwayat.',
    `<div id="pengajuanTable"></div>`
  );
  return renderLayout(user, 'Pengajuan', getNavItems('admin', '/admin/pengajuan'), content);
}

function bindAdminPengajuanList() {
  const tableEl = document.getElementById('pengajuanTable');
  const cols = [
    { label: 'ID', render: (r) => `<span class="mono">${displayPengajuanId(r)}</span>` },
    { label: 'Karyawan', render: (r) => escapeHtml(getUserById(r.userId)?.nama || '-') },
    { label: 'Template RAB', render: (r) => escapeHtml(getTemplateById(r.templateId)?.namaTemplate || '-') },
    { label: 'Total Pengajuan', render: (r) => `<span class="td-money">${formatCurrency(r.totalAnggaran)}</span>` },
    { label: 'Tanggal Pengajuan', render: (r) => formatDate(r.tanggal || r.createdAt) },
    {
      label: 'Aksi',
      render: (r) =>
        `<a href="#/admin/pengajuan/${r.id}" class="btn btn-primary btn-sm">${icon('eye', 14)} Review</a>`,
    },
  ];

  const draw = () => {
    const db = getDB();
    const items = filterPendingPengajuan(db.pengajuan).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    tableEl.innerHTML = table(cols, items, 'Tidak ada pengajuan yang menunggu persetujuan');
    refreshIcons(tableEl);
  };

  draw();
}

function pageAdminRiwayatList(user) {
  const content = card(
    'Arsip Keputusan',
    'Semua pengajuan yang sudah disetujui atau ditolak oleh admin',
    `
    <div class="filter-tabs" id="riwayatFilterTabs">
      <button type="button" class="filter-tab filter-tab-active" data-filter="all">${icon('filter', 14)} Semua</button>
      <button type="button" class="filter-tab" data-filter="approved">${icon('approved', 14)} Disetujui</button>
      <button type="button" class="filter-tab" data-filter="rejected">${icon('rejected', 14)} Ditolak</button>
    </div>
    <div id="riwayatTable"></div>`
  );
  return renderLayout(user, 'Riwayat', getNavItems('admin', '/admin/riwayat'), content);
}

function bindAdminRiwayatList() {
  let filter = 'all';
  const tableEl = document.getElementById('riwayatTable');
  const cols = [
    { label: 'ID', render: (r) => `<span class="mono">${displayPengajuanId(r)}</span>` },
    { label: 'Nama Karyawan', render: (r) => escapeHtml(getUserById(r.userId)?.nama || '-') },
    { label: 'Template RAB', render: (r) => escapeHtml(getTemplateById(r.templateId)?.namaTemplate || '-') },
    { label: 'Total Pengajuan', render: (r) => `<span class="td-money">${formatCurrency(r.totalAnggaran)}</span>` },
    { label: 'Tanggal Pengajuan', render: (r) => formatDate(r.tanggal || r.createdAt) },
    { label: 'Status', render: (r) => badgeStatus(r.status) },
    {
      label: 'Nominal Disetujui',
      render: (r) => (r.status === 'approved' && r.approvedAmount != null ? formatCurrency(r.approvedAmount) : '—'),
    },
    {
      label: 'Pesan Admin',
      render: (r) => `<span class="td-ellipsis" title="${escapeHtml(r.pesanAdmin || '')}">${escapeHtml(r.pesanAdmin || '—')}</span>`,
    },
    { label: 'Tanggal Keputusan', render: (r) => formatDateTime(r.tanggalKeputusan || r.updatedAt) },
    {
      label: 'Aksi',
      render: (r) =>
        `<a href="#/admin/riwayat/${r.id}" class="btn btn-secondary btn-sm">${icon('eye', 14)} Detail</a>`,
    },
  ];

  const applyFilter = (items) => {
    if (filter === 'approved') return items.filter((p) => p.status === 'approved');
    if (filter === 'rejected') return items.filter((p) => p.status === 'rejected');
    return items;
  };

  const draw = () => {
    const db = getDB();
    let items = filterRiwayatPengajuan(db.pengajuan);
    items = applyFilter(items).sort(
      (a, b) =>
        new Date(b.tanggalKeputusan || b.updatedAt || 0) - new Date(a.tanggalKeputusan || a.updatedAt || 0)
    );
    tableEl.innerHTML = table(cols, items, 'Belum ada data di arsip riwayat');
    refreshIcons(tableEl);
  };

  draw();
  document.querySelectorAll('#riwayatFilterTabs .filter-tab').forEach((btn) => {
    btn.onclick = () => {
      filter = btn.dataset.filter;
      document.querySelectorAll('#riwayatFilterTabs .filter-tab').forEach((b) => b.classList.remove('filter-tab-active'));
      btn.classList.add('filter-tab-active');
      draw();
    };
  });
}

function pageAdminDetail(user, id, context = 'pengajuan') {
  const p = getPengajuanFromStore(id);
  const navHash = context === 'riwayat' ? '/admin/riwayat' : '/admin/pengajuan';
  const backHref = context === 'riwayat' ? '#/admin/riwayat' : '#/admin/pengajuan';
  const backLabel = context === 'riwayat' ? 'Kembali ke riwayat' : 'Kembali ke antrian';

  if (!p) {
    return renderLayout(
      user,
      'Detail',
      getNavItems('admin', navHash),
      card('Pengajuan tidak ditemukan', '', btn('Kembali', 'secondary', { iconKey: 'back', href: backHref }))
    );
  }

  if (context === 'pengajuan' && p.status !== 'pending') {
    location.hash = `#/admin/riwayat/${id}`;
    return '';
  }
  if (context === 'riwayat' && p.status === 'pending') {
    location.hash = `#/admin/pengajuan/${id}`;
    return '';
  }

  const template = getTemplateById(p.templateId);
  const karyawan = getUserById(p.userId);
  const buktiHtml = p.bukti?.length
    ? `<div class="bukti-preview-grid">${p.bukti
        .map(
          (src, i) =>
            `<a href="${src}" target="_blank" rel="noreferrer" class="bukti-preview-item" title="Lihat bukti">${`<img src="${src}" alt="Bukti ${i + 1}" />`}</a>`
        )
        .join('')}</div>`
    : `<p class="text-muted empty-inline">${icon('upload', 18)} Tidak ada bukti diunggah</p>`;

  const actions =
    context === 'pengajuan' && p.status === 'pending'
      ? `<div class="detail-actions">
          <button type="button" class="btn btn-success" id="btnApprove">${icon('approved', 16)} Approve</button>
          <button type="button" class="btn btn-danger" id="btnReject">${icon('rejected', 16)} Reject</button>
        </div>`
      : '';

  const content = `
    <div class="detail-header">
      <div>
        <a href="${backHref}" class="back-link">${icon('back', 14)} ${backLabel}</a>
        <h2 class="detail-title">${escapeHtml(displayPengajuanId(p))}</h2>
        <div class="detail-badges">${badgeStatus(p.status)}</div>
      </div>
      ${actions}
    </div>
    <div class="detail-grid">
      ${card('Informasi Pengajuan', '', `
        <dl class="detail-list">
          <div><dt>${icon('user', 12)} Karyawan</dt><dd>${escapeHtml(karyawan?.nama || p.userId)}</dd></div>
          <div><dt>${icon('template', 12)} Template RAB</dt><dd>${escapeHtml(template?.namaTemplate || '-')}</dd></div>
          <div><dt>${icon('pending', 12)} Tanggal Pengajuan</dt><dd>${formatDate(p.tanggal || p.createdAt)}</dd></div>
          <div><dt>${icon('money', 12)} Total Diajukan</dt><dd class="amount-highlight">${formatCurrency(p.totalAnggaran)}</dd></div>
          ${p.approvedAmount != null ? `<div><dt>${icon('approved', 12)} Nominal Disetujui</dt><dd class="amount-success">${formatCurrency(p.approvedAmount)}</dd></div>` : ''}
          ${p.pesanAdmin ? `<div><dt>${icon('info', 12)} Pesan Admin</dt><dd>${escapeHtml(p.pesanAdmin)}</dd></div>` : ''}
          ${p.tanggalKeputusan || p.updatedAt ? `<div><dt>${icon('riwayat', 12)} Tanggal Keputusan</dt><dd>${formatDateTime(p.tanggalKeputusan || p.updatedAt)}</dd></div>` : ''}
        </dl>`)}
      ${card('Bukti Pendukung', '', buktiHtml)}
    </div>
    ${card('Rencana Anggaran Belanja', 'Dokumen RAB lengkap sesuai template', renderRABReadOnlyTable(template, p.dataRAB))}`;

  return renderLayout(user, 'Detail Pengajuan', getNavItems('admin', navHash), content);
}

function bindAdminDetail(id, context = 'pengajuan') {
  const p = getPengajuanFromStore(id);
  if (!p || context !== 'pengajuan' || p.status !== 'pending') return;
  document.getElementById('btnApprove')?.addEventListener('click', () => showApprovalModal(p, 'approve'));
  document.getElementById('btnReject')?.addEventListener('click', () => showApprovalModal(p, 'reject'));
}

function showApprovalModal(pengajuan, type) {
  const isApprove = type === 'approve';
  const body = `
    ${isApprove ? `
    <div class="form-group">
      <label>${icon('money', 14)} Nominal Disetujui (Rp) *</label>
      <input type="number" id="modalAmount" class="input" min="0" value="${pengajuan.totalAnggaran}" />
      <p class="form-hint">Diajukan: ${formatCurrency(pengajuan.totalAnggaran)}</p>
    </div>` : ''}
    <div class="form-group">
      <label>${icon('info', 14)} ${isApprove ? 'Pesan / Catatan *' : 'Alasan Penolakan *'}</label>
      <textarea id="modalPesan" class="input textarea" rows="4" placeholder="${isApprove ? 'Contoh: Disetujui sebagian...' : 'Jelaskan alasan penolakan...'}"></textarea>
    </div>`;
  const footer = `
    <button type="button" class="btn btn-ghost" data-close-modal>Batal</button>
    <button type="button" class="btn btn-${isApprove ? 'success' : 'danger'}" id="modalConfirm">
      ${icon(isApprove ? 'approved' : 'rejected', 16)} ${isApprove ? 'Setujui' : 'Tolak'}
    </button>`;
  openModal('approvalModal', isApprove ? 'Setujui Pengajuan' : 'Tolak Pengajuan', body, footer);
  document.getElementById('modalConfirm').onclick = async () => {
    const pesan = document.getElementById('modalPesan').value.trim();
    if (!pesan) {
      showToast('Isi pesan terlebih dahulu', 'error');
      return;
    }
    let approvedAmount = null;
    if (isApprove) {
      approvedAmount = Number(document.getElementById('modalAmount').value);
      if (Number.isNaN(approvedAmount) || approvedAmount < 0) {
        showToast('Nominal tidak valid', 'error');
        return;
      }
    }
    const btn = document.getElementById('modalConfirm');
    btn.disabled = true;
    try {
      const updated = await apiUpdatePengajuanStatus(pengajuan.id, {
        status: isApprove ? 'approved' : 'rejected',
        approvedAmount,
        pesanAdmin: pesan,
      });
      patchPengajuanInStore(updated);
      closeModal('approvalModal');
      showToast(
        isApprove
          ? 'Pengajuan disetujui — tersimpan di Riwayat'
          : 'Pengajuan ditolak — tersimpan di Riwayat'
      );
      location.hash = '#/admin/pengajuan';
      await render();
    } catch (ex) {
      handleApiError(ex, 'Gagal menyimpan keputusan');
    } finally {
      btn.disabled = false;
    }
  };
}

function pageAdminTemplates(user) {
  const db = getDB();
  const templates = db.templates || [];
  const cols = [
    { label: 'ID', render: (r) => `<span class="mono">${r.id}</span>` },
    { label: 'Nama Template', render: (r) => escapeHtml(r.namaTemplate) },
    { label: 'Deskripsi', render: (r) => escapeHtml(r.deskripsi || '') },
    {
      label: 'Tipe',
      render: (r) =>
        r.rabType === 'sections'
          ? '<span class="badge badge-approved">Multi-Seksi RAB</span>'
          : '<span class="badge badge-pending">Sederhana</span>',
    },
    {
      label: 'Struktur',
      render: (r) =>
        r.rabType === 'sections'
          ? `${r.sections?.length || 0} bagian + Rekapitulasi`
          : `${r.fields?.length || 0} field`,
    },
    { label: 'Dibuat', render: (r) => formatDate(r.createdAt) },
    {
      label: 'Aksi',
      render: (r) => `
        <div class="action-group">
          <button type="button" class="btn btn-secondary btn-sm tpl-edit" data-id="${r.id}">${icon('edit', 14)} Edit</button>
          <button type="button" class="btn btn-danger btn-sm tpl-del" data-id="${r.id}">${icon('remove', 14)} Hapus</button>
        </div>`,
    },
  ];

  const content = card(
    'Kelola Template RAB',
    'Template menjadi form dinamis saat karyawan mengajukan anggaran',
    `
    ${table(cols, templates, 'Belum ada template')}
    <div class="template-info-box">
      ${icon('info', 22)}
      <div>
        <h4>Panduan Template</h4>
        <p>Setiap field otomatis menjadi kolom form. Field <strong>calculated</strong> memakai formula seperti <code>jumlah * harga</code>.</p>
      </div>
    </div>`,
    `<div class="action-group">
      <button type="button" class="btn btn-secondary" id="btnStdRAB">${icon('template', 16)} Template RAB Resmi</button>
      <button type="button" class="btn btn-primary" id="btnNewTemplate">${icon('add', 16)} Template Sederhana</button>
    </div>`
  );
  return renderLayout(user, 'Template RAB', getNavItems('admin', '/admin/templates'), content);
}

function bindAdminTemplates() {
  document.getElementById('btnStdRAB')?.addEventListener('click', async () => {
    const std = typeof getStandardRABTemplate === 'function' ? getStandardRABTemplate() : null;
    if (!std) return;
    try {
      const saved = await apiUpsertTemplate(std);
      patchTemplateInStore(saved);
      showToast('Template RAB Resmi (Rencana Anggaran Belanja) ditambahkan');
      await render();
    } catch (ex) {
      handleApiError(ex, 'Gagal menyimpan template resmi');
    }
  });
  document.getElementById('btnNewTemplate')?.addEventListener('click', () => openTemplateModal(null));
  document.querySelectorAll('.tpl-edit').forEach((btn) => {
    btn.onclick = () => {
      const t = getTemplateById(btn.dataset.id);
      if (t?.rabType === 'sections') {
        showToast('Template RAB resmi (multi-seksi) tidak dapat diedit. Klik "Template RAB Resmi" untuk reset.', 'error');
        return;
      }
      openTemplateModal(t);
    };
  });
  document.querySelectorAll('.tpl-del').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('Hapus template ini?')) return;
      try {
        await apiDeleteTemplate(btn.dataset.id);
        removeTemplateFromStore(btn.dataset.id);
        showToast('Template dihapus');
        await render();
      } catch (ex) {
        if (ex.code === 'IN_USE') showToast(ex.message, 'error');
        else handleApiError(ex, 'Gagal menghapus template');
      }
    };
  });
}

function openTemplateModal(existing) {
  let fields = existing
    ? existing.fields.map((f) => ({ ...f, formula: f.formula || '' }))
    : [{ label: '', type: 'text', required: true, formula: '' }];

  function fieldRowHtml() {
    return fields
      .map(
        (f, i) => `
      <div class="field-builder-row" data-i="${i}">
        <input class="input fld-label" placeholder="Label field" value="${escapeHtml(f.label)}" />
        <select class="input select fld-type">
          <option value="text" ${f.type === 'text' ? 'selected' : ''}>Text</option>
          <option value="textarea" ${f.type === 'textarea' ? 'selected' : ''}>Textarea</option>
          <option value="number" ${f.type === 'number' ? 'selected' : ''}>Number</option>
          <option value="calculated" ${f.type === 'calculated' ? 'selected' : ''}>Calculated</option>
        </select>
        ${
          f.type === 'calculated'
            ? `<input class="input fld-formula" placeholder="jumlah * harga" value="${escapeHtml(f.formula || '')}" />`
            : `<label class="checkbox-label"><input type="checkbox" class="fld-req" ${f.required ? 'checked' : ''} /> Wajib</label>`
        }
        <button type="button" class="btn-icon btn-danger-icon fld-rm" ${fields.length <= 1 ? 'disabled' : ''}>${icon('remove', 16)}</button>
      </div>`
      )
      .join('');
  }

  const body = `
    <div class="form-group"><label>Nama Template *</label><input id="tplNama" class="input" value="${escapeHtml(existing?.namaTemplate || '')}" /></div>
    <div class="form-group"><label>Deskripsi</label><textarea id="tplDesk" class="input textarea" rows="2">${escapeHtml(existing?.deskripsi || '')}</textarea></div>
    <div class="section-divider"><h3>Struktur Field</h3></div>
    <div id="fieldRows">${fieldRowHtml()}</div>
    <button type="button" class="btn btn-secondary btn-sm" id="fldAdd">${icon('add', 14)} Tambah Field</button>`;

  const footer = `
    <button type="button" class="btn btn-ghost" data-close-modal>Batal</button>
    <button type="button" class="btn btn-primary" id="tplSave">${icon('save', 16)} Simpan</button>`;

  openModal('tplModal', existing ? 'Edit Template' : 'Template Baru', body, footer);

  function bindFieldRows() {
    document.querySelectorAll('.field-builder-row').forEach((row) => {
      const i = parseInt(row.dataset.i, 10);
      row.querySelector('.fld-label').oninput = (e) => (fields[i].label = e.target.value);
      row.querySelector('.fld-type').onchange = (e) => {
        fields[i].type = e.target.value;
        if (e.target.value === 'calculated') fields[i].formula = 'jumlah * harga';
        document.getElementById('fieldRows').innerHTML = fieldRowHtml();
        bindFieldRows();
        refreshIcons(document.getElementById('fieldRows'));
      };
      row.querySelector('.fld-formula')?.addEventListener('input', (e) => (fields[i].formula = e.target.value));
      row.querySelector('.fld-req')?.addEventListener('change', (e) => (fields[i].required = e.target.checked));
      row.querySelector('.fld-rm')?.addEventListener('click', () => {
        if (fields.length <= 1) return;
        fields.splice(i, 1);
        document.getElementById('fieldRows').innerHTML = fieldRowHtml();
        bindFieldRows();
        refreshIcons(document.getElementById('fieldRows'));
      });
    });
  }
  bindFieldRows();

  document.getElementById('fldAdd').onclick = () => {
    fields.push({ label: '', type: 'text', required: true, formula: '' });
    document.getElementById('fieldRows').innerHTML = fieldRowHtml();
    bindFieldRows();
    refreshIcons(document.getElementById('fieldRows'));
  };

  document.getElementById('tplSave').onclick = async () => {
    const nama = document.getElementById('tplNama').value.trim();
    if (!nama || fields.some((f) => !f.label.trim())) {
      showToast('Lengkapi nama dan semua label field', 'error');
      return;
    }
    const payload = {
      namaTemplate: nama,
      deskripsi: document.getElementById('tplDesk').value.trim(),
      rabType: 'simple',
      fields: fields.map((f) => {
        const field = { label: f.label.trim(), type: f.type };
        if (f.type === 'calculated') field.formula = (f.formula || 'jumlah * harga').trim();
        else field.required = !!f.required;
        return field;
      }),
      createdAt: existing?.createdAt || todayISO(),
    };
    if (existing) payload.id = existing.id;
    else payload.id = await apiNextTemplateId();

    const btn = document.getElementById('tplSave');
    btn.disabled = true;
    try {
      const saved = await apiUpsertTemplate(payload);
      patchTemplateInStore(saved);
      closeModal('tplModal');
      showToast('Template disimpan');
      await render();
    } catch (ex) {
      handleApiError(ex, 'Gagal menyimpan template');
    } finally {
      btn.disabled = false;
    }
  };
}
