function renderLayout(user, title, navItems, content) {
  const nav = navItems
    .map(
      (item) => `
    <a href="#${item.hash}" class="sidebar-link ${item.active ? 'sidebar-link-active' : ''}">
      ${icon(item.iconKey, 22)}
      <span class="sidebar-label">${escapeHtml(item.label)}</span>
    </a>`
    )
    .join('');

  return `
  <div class="app-layout">
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-logo">${logoSidebar(42)}</div>
        <div class="sidebar-brand-text">
            <span class="sidebar-brand-name">BudgetFlow</span>
            <span class="sidebar-brand-tag">Enterprise Platform</span>
        </div>
      </div>
      <nav class="sidebar-nav">${nav}</nav>
      <div class="sidebar-footer">
        <button type="button" class="sidebar-toggle" id="sidebarToggle" aria-label="Ciutkan sidebar">
          ${icon('chevronL', 18)}
        </button>
      </div>
    </aside>
    <div class="main-content" id="mainContent">
      <header class="navbar">
        <div class="navbar-left">
          <button type="button" class="btn-icon-mobile" id="btnMobileMenu" aria-label="Menu">${icon('menu', 22)}</button>
          <div>
            <p class="navbar-breadcrumb">RRI BudgetFlow</p>
            <h1 class="navbar-title">${escapeHtml(title)}</h1>
          </div>
        </div>
        <div class="navbar-actions">
          <div class="navbar-user">
            <div class="navbar-avatar">${escapeHtml(user.nama?.charAt(0)?.toUpperCase() || 'U')}</div>
            <div class="navbar-user-text">
              <span class="navbar-user-name">${escapeHtml(user.nama)}</span>
              <span class="navbar-user-role">${user.role === 'admin' ? 'Administrator' : 'Karyawan'}</span>
            </div>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" id="btnLogout">
            ${icon('logout', 16)} Keluar
          </button>
        </div>
      </header>
      <main class="page-content">
        ${isLocalMode() ? `<div class="local-mode-banner">${icon('info', 14)} Mode Lokal — data tersimpan di browser Anda</div>` : isCloudMode() ? `<div class="cloud-mode-banner">${icon('approved', 14)} Cloud Supabase — data tersimpan online</div>` : ''}
        <div class="page animate-in">${content}</div>
      </main>
    </div>
  </div>`;
}

function card(title, subtitle, body, actionHtml = '', opts = {}) {
  const subHtml = subtitle ? (opts.rawSubtitle ? subtitle : escapeHtml(subtitle)) : '';
  const extraClass = opts.className ? ` ${opts.className}` : '';
  return `
  <div class="card${extraClass}">
    ${title || subtitle || actionHtml ? `
    <div class="card-header">
      <div>
        ${title ? `<h3 class="card-title">${escapeHtml(title)}</h3>` : ''}
        ${subHtml ? `<p class="card-subtitle">${subHtml}</p>` : ''}
      </div>
      ${actionHtml ? `<div class="card-action">${actionHtml}</div>` : ''}
    </div>` : ''}
    <div class="card-body">${body}</div>
  </div>`;
}

function statCards(stats) {
  return `<div class="stats-grid">${stats
    .map((s) => {
      const iconHtml = s.iconKey ? `<div class="stat-icon-wrap stat-icon-${s.variant || 'default'}">${icon(s.iconKey, 22)}</div>` : '';
      return `
    <div class="stat-card stat-card-${s.variant || 'default'}">
      ${iconHtml}
      <div class="stat-content">
        <span class="stat-label">${escapeHtml(s.label)}</span>
        <span class="stat-value ${s.small ? 'stat-value-sm' : ''}">${s.value}</span>
      </div>
    </div>`;
    })
    .join('')}</div>`;
}

function table(columns, rows, emptyMsg) {
  if (!rows.length) {
    return `
    <div class="table-empty">
      ${icon('document', 40, 'table-empty-icon')}
      <p>${escapeHtml(emptyMsg)}</p>
    </div>`;
  }
  const head = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('');
  const body = rows
    .map((row) => {
      const cells = columns
        .map((c) => `<td>${c.render ? c.render(row) : escapeHtml(row[c.key] ?? '')}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  return `<div class="table-wrapper"><table class="table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function btn(label, variant = 'primary', opts = {}) {
  const { iconKey, size = '', type = 'button', id = '', href = '' } = opts;
  const cls = `btn btn-${variant} ${size}`.trim();
  const ic = iconKey ? icon(iconKey, 16) + ' ' : '';
  if (href) return `<a href="${href}" class="${cls}" ${id ? `id="${id}"` : ''}>${ic}${escapeHtml(label)}</a>`;
  return `<button type="${type}" class="${cls}" ${id ? `id="${id}"` : ''}>${ic}${escapeHtml(label)}</button>`;
}

function openModal(id, title, bodyHtml, footerHtml) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = id;
  el.className = 'modal-overlay';
  el.innerHTML = `
    <div class="modal" role="dialog">
      <div class="modal-header">
        <h2 class="modal-title">${escapeHtml(title)}</h2>
        <button type="button" class="modal-close" data-close-modal aria-label="Tutup">${icon('cancel', 20)}</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
    </div>`;
  document.body.appendChild(el);
  el.querySelectorAll('[data-close-modal]').forEach((b) => {
    b.onclick = () => closeModal(id);
  });
  el.addEventListener('click', (e) => {
    if (e.target === el) closeModal(id);
  });
  document.addEventListener(
    'keydown',
    function escHandler(ev) {
      if (ev.key === 'Escape') {
        closeModal(id);
        document.removeEventListener('keydown', escHandler);
      }
    },
    { once: true }
  );
  refreshIcons(el);
  return el;
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function bindLayoutEvents() {
  document.getElementById('btnLogout')?.addEventListener('click', async () => {
    await logout();
    location.hash = '#/login';
    render();
  });

  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('mainContent');
  const overlay = document.getElementById('sidebarOverlay');

  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    sidebar?.classList.toggle('sidebar-collapsed');
    main?.classList.toggle('main-expanded');
    refreshIcons();
  });

  const openMobile = () => {
    sidebar?.classList.add('sidebar-open');
    overlay?.classList.add('active');
  };
  const closeMobile = () => {
    sidebar?.classList.remove('sidebar-open');
    overlay?.classList.remove('active');
  };

  document.getElementById('btnMobileMenu')?.addEventListener('click', openMobile);
  overlay?.addEventListener('click', closeMobile);
  document.querySelectorAll('.sidebar-link').forEach((link) => {
    link.addEventListener('click', closeMobile);
  });
}

function navActive(itemHash, activeHash) {
  if (itemHash === '/admin' || itemHash === '/user') return activeHash === itemHash;
  return activeHash === itemHash || activeHash.startsWith(itemHash + '/');
}

function getNavItems(role, activeHash) {
  if (role === 'admin') {
    return [
      { hash: '/admin', label: 'Dashboard', iconKey: 'dashboard', active: navActive('/admin', activeHash) },
      { hash: '/admin/pengajuan', label: 'Pengajuan', iconKey: 'pengajuan', active: navActive('/admin/pengajuan', activeHash) },
      { hash: '/admin/templates', label: 'Template RAB', iconKey: 'template', active: navActive('/admin/templates', activeHash) },
      { hash: '/admin/templates-surat', label: 'Template Surat', iconKey: 'document', active: navActive('/admin/templates-surat', activeHash) },
      { hash: '/admin/riwayat', label: 'Riwayat', iconKey: 'riwayat', active: navActive('/admin/riwayat', activeHash) },
      { hash: '/admin/aktivitas', label: 'Log Aktivitas', iconKey: 'riwayat', active: navActive('/admin/aktivitas', activeHash) },
    ];
  }
  return [
    { hash: '/user', label: 'Dashboard', iconKey: 'dashboard', active: navActive('/user', activeHash) },
    { hash: '/user/templates', label: 'Template RAB', iconKey: 'template', active: navActive('/user/templates', activeHash) },
    { hash: '/user/templates-surat', label: 'Template Surat', iconKey: 'document', active: navActive('/user/templates-surat', activeHash) },
    { hash: '/user/pengajuan/baru', label: 'Pengajuan Baru', iconKey: 'add', active: navActive('/user/pengajuan/baru', activeHash) },
    { hash: '/user/riwayat', label: 'Riwayat', iconKey: 'riwayat', active: navActive('/user/riwayat', activeHash) },
  ];
}
