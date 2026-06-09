function getRoute() {
  const hash = location.hash.slice(1) || '/login';
  const path = hash.startsWith('/') ? hash : '/' + hash;
  return path.replace(/\/+$/, '') || '/login';
}

function isLoginRoute(route) {
  return route === '/login' || route === '/' || route === '/login/karyawan' || route === '/login/admin';
}

function isGuestRoute(route) {
  return isLoginRoute(route);
}

function showPortalPage() {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = pagePortal();
  refreshIcons();
}

function showAppLoading(message = 'Memuat data...') {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = `<div class="app-loading"><div class="spinner"></div><p>${escapeHtml(message)}</p></div>`;
}

function showLoginPage(portalKey = 'karyawan', warning) {
  const app = document.getElementById('app');
  if (!app) return;
  const portal = getAuthPortal(portalKey);
  const modeHint = isLocalMode()
    ? `<div class="login-warn"><div class="alert alert-info" style="display:flex;margin:0">${icon('info', 18)}<span>Mode lokal aktif — login langsung tanpa internet.</span></div></div>`
    : isCloudMode()
      ? `<div class="login-warn"><div class="alert alert-info" style="display:flex;margin:0">${icon('approved', 18)}<span>Data disimpan ke Supabase Cloud.</span></div></div>`
      : '';
  const warnHtml = warning
    ? `<div class="login-warn"><div class="alert alert-error" style="display:flex;margin:0">${icon('alert', 18)}<span>${escapeHtml(warning)}</span></div></div>`
    : '';
  const cardSel = portal.key === 'admin' ? '<div class="login-card login-card-admin">' : '<div class="login-card">';
  app.innerHTML = pageLogin(portalKey).replace(cardSel, `${modeHint}${warnHtml}${cardSel}`);
  bindLogin(portalKey);
  refreshIcons();
}

function showBootError(message, detail) {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = `
    <div class="login-page"><div class="login-card" style="max-width:520px">
      <h1>Gagal Memuat</h1>
      <div class="alert alert-error" style="display:flex">${icon('alert', 20)}<span>${escapeHtml(message)}</span></div>
      ${detail ? `<p class="form-hint">${escapeHtml(detail)}</p>` : ''}
      <button class="btn btn-primary" style="margin-top:16px;width:100%" onclick="location.reload()">Muat Ulang</button>
    </div></div>`;
  refreshIcons();
}

function showConfigRequired() {
  switchToLocalMode();
  showPortalPage();
}

function renderPage(html, bind) {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = html;
  bindLayoutEvents();
  if (typeof bind === 'function') bind();
  refreshIcons();
}

function navigateHash(hash) {
  if (location.hash === hash) {
    render();
    return;
  }
  location.hash = hash;
}

let _rendering = false;
let _renderQueued = false;

function resolveDetailRoute(id, context) {
  const p = getPengajuanFromStore(id);
  if (!p) return { ok: false, reason: 'missing' };
  if (context === 'pengajuan' && p.status !== 'pending') {
    return { ok: true, redirect: `#/admin/riwayat/${id}`, context: 'riwayat' };
  }
  if (context === 'riwayat' && p.status === 'pending') {
    return { ok: true, redirect: `#/admin/pengajuan/${id}`, context: 'pengajuan' };
  }
  return { ok: true, context };
}

function resolveUserDetailRoute(id, user) {
  const p = getPengajuanFromStore(id);
  if (!p || p.userId !== user.id) return { ok: false, reason: 'missing' };
  if (p.status === 'revisi') {
    return { ok: true, redirect: `#/user/pengajuan/edit/${id}` };
  }
  if (p.status === 'pending') {
    return { ok: true, redirect: '#/user' };
  }
  if (p.status !== 'approved' && p.status !== 'rejected') {
    return { ok: false, reason: 'missing' };
  }
  return { ok: true };
}

async function render() {
  if (_rendering) {
    _renderQueued = true;
    return;
  }
  _rendering = true;
  const route = getRoute();
  const app = document.getElementById('app');
  if (!app) {
    _rendering = false;
    return;
  }

  try {
    await initRuntime();

    if (!isLocalMode()) {
      if (!getSupabaseLib()) switchToLocalMode();
      else if (!isSupabaseConfigured()) switchToLocalMode();
    }

    if (isGuestRoute(route)) {
      if (route === '/' || route === '/login') {
        showPortalPage();
      } else if (route === '/login/admin') {
        showLoginPage('admin');
      } else if (route === '/login/karyawan') {
        showLoginPage('karyawan');
      } else if (route.startsWith('/register')) {
        navigateHash('#/login');
      } else {
        showPortalPage();
      }
      restoreSession()
        .then((session) => {
          if (session?.status === 'nonaktif') {
            logout().then(() => showLoginPage('karyawan', 'Akun dinonaktifkan. Hubungi administrator.'));
            return;
          }
          if (session && isGuestRoute(getRoute())) {
            navigateHash(session.role === 'admin' ? '#/admin' : '#/user');
          }
        })
        .catch(() => {});
      return;
    }

    showAppLoading();
    const session = getSession() || (await restoreSession());

    if (!session) {
      navigateHash('#/login');
      return;
    }
    if (session.status === 'nonaktif') {
      await logout();
      showLoginPage('karyawan', 'Akun dinonaktifkan. Hubungi administrator.');
      return;
    }
    if (route.startsWith('/admin') && session.role !== 'admin') {
      navigateHash('#/user');
      return;
    }
    if (route.startsWith('/user') && session.role !== 'user') {
      navigateHash('#/admin');
      return;
    }

    const needLogs = route === '/admin/aktivitas';
    if (!isAppDataLoaded() || (needLogs && !getDB().activityLogs?.length)) {
      await loadAppData(session, { includeLogs: needLogs });
    }

    if (route === '/user') {
      renderPage(pageUserDashboard(session));
    } else if (route === '/user/templates') {
      renderPage(pageUserTemplates(session));
    } else if (route.match(/^\/user\/templates\/[^/]+$/)) {
      const folderId = route.split('/').pop();
      renderPage(pageUserTemplateFolder(session, folderId), () => bindUserTemplateFolder(session));
    } else if (route === '/user/templates-surat') {
      renderPage(pageUserTemplates(session, 'surat'));
    } else if (route.match(/^\/user\/templates-surat\/[^/]+$/)) {
      const folderId = route.split('/').pop();
      renderPage(pageUserTemplateFolder(session, folderId, 'surat'), () => bindUserTemplateFolder(session));
    } else if (route === '/user/pengajuan/baru') {
      renderPage(pageUserPengajuan(session), () => bindUserPengajuan(session));
    } else if (route.match(/^\/user\/pengajuan\/edit\/[^/]+$/)) {
      const id = route.split('/').pop();
      renderPage(pageUserPengajuan(session, id), () => bindUserPengajuan(session, id));
    } else if (route === '/user/riwayat') {
      renderPage(pageUserRiwayatList(session), () => bindUserRiwayatList(session));
    } else if (route.match(/^\/user\/riwayat\/[^/]+$/)) {
      const id = route.split('/').pop();
      if (isCloudMode() && isLegacyLocalId(id)) {
        showToast('Data lama (mode lokal) tidak ada di Supabase', 'error');
        navigateHash('#/user/riwayat');
        return;
      }
      await ensurePengajuanLoaded(id);
      const resolved = resolveUserDetailRoute(id, session);
      if (!resolved.ok) {
        showToast('Pengajuan tidak ditemukan', 'error');
        navigateHash('#/user/riwayat');
        return;
      }
      if (resolved.redirect) {
        navigateHash(resolved.redirect);
        return;
      }
      renderPage(pageUserDetail(session, id), () => bindUserDetail(id, session));
    } else if (route === '/admin') {
      renderPage(pageAdminDashboard(session));
    } else if (route === '/admin/templates') {
      renderPage(pageAdminTemplates(session), () => bindAdminTemplates(session));
    } else if (route.match(/^\/admin\/templates\/[^/]+$/)) {
      const folderId = route.split('/').pop();
      renderPage(pageAdminTemplateFolder(session, folderId), () => bindAdminTemplateFolder(session, folderId));
    } else if (route === '/admin/templates-surat') {
      renderPage(pageAdminTemplates(session, 'surat'), () => bindAdminTemplates(session, 'surat'));
    } else if (route.match(/^\/admin\/templates-surat\/[^/]+$/)) {
      const folderId = route.split('/').pop();
      renderPage(pageAdminTemplateFolder(session, folderId, 'surat'), () => bindAdminTemplateFolder(session, folderId, 'surat'));
    } else if (route === '/admin/users' || route === '/admin/profil' || route === '/user/profil') {
      navigateHash(session.role === 'admin' ? '#/admin' : '#/user');
    } else if (route === '/admin/aktivitas') {
      renderPage(pageAdminActivity(session), () => bindAdminActivity(session));
    } else if (route === '/admin/pengajuan') {
      renderPage(pageAdminPengajuanList(session), bindAdminPengajuanList);
    } else if (route.match(/^\/admin\/pengajuan\/[^/]+$/)) {
      const id = route.split('/').pop();
      if (isCloudMode() && isLegacyLocalId(id)) {
        showToast('Data lama (mode lokal) tidak ada di Supabase', 'error');
        navigateHash('#/admin/pengajuan');
        return;
      }
      await ensurePengajuanLoaded(id);
      const resolved = resolveDetailRoute(id, 'pengajuan');
      if (resolved.redirect) {
        navigateHash(resolved.redirect);
        return;
      }
      renderPage(pageAdminDetail(session, id, 'pengajuan'), () => bindAdminDetail(id, 'pengajuan', session));
    } else if (route === '/admin/riwayat') {
      renderPage(pageAdminRiwayatList(session), bindAdminRiwayatList);
    } else if (route.match(/^\/admin\/riwayat\/[^/]+$/)) {
      const id = route.split('/').pop();
      if (isCloudMode() && isLegacyLocalId(id)) {
        showToast('Data lama (mode lokal) tidak ada di Supabase', 'error');
        navigateHash('#/admin/riwayat');
        return;
      }
      await ensurePengajuanLoaded(id);
      const resolved = resolveDetailRoute(id, 'riwayat');
      if (resolved.redirect) {
        navigateHash(resolved.redirect);
        return;
      }
      renderPage(pageAdminDetail(session, id, 'riwayat'), () => bindAdminDetail(id, 'riwayat', session));
    } else {
      navigateHash(session.role === 'admin' ? '#/admin' : '#/user');
    }
  } catch (err) {
    console.error(err);
    showBootError(err.message || 'Gagal memuat', 'Refresh halaman atau kembali ke dashboard.');
  } finally {
    _rendering = false;
    if (_renderQueued) {
      _renderQueued = false;
      render();
    }
  }
}

window.addEventListener('hashchange', () => render());
window.addEventListener('load', () => {
  if (!location.hash || location.hash === '#') location.hash = '#/login';
  render().then(() => {
    try {
      initAuthListener();
    } catch (e) {
      console.error(e);
    }
  });
});
