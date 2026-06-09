let _sessionProfile = null;
let _loginInFlight = false;

const SESSION_RESTORE_TIMEOUT_MS = 6000;

function getSession() {
  return _sessionProfile;
}

function setSessionProfile(profile) {
  _sessionProfile = profile;
}

function isNetworkError(err) {
  const msg = (err?.message || '').toLowerCase();
  const name = (err?.name || '').toLowerCase();
  return (
    name === 'aborterror' ||
    msg.includes('timeout') ||
    msg.includes('waktu habis') ||
    msg.includes('abort') ||
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('load failed')
  );
}

function mapLoginError(err) {
  if (isNetworkError(err)) {
    return {
      ok: false,
      message:
        'Koneksi ke Supabase gagal atau terlalu lambat. Periksa internet, refresh halaman (Ctrl+Shift+R), lalu coba lagi.',
    };
  }
  return { ok: false, message: mapAuthError(err, err?.message || 'Gagal masuk') };
}

async function resolveProfileAfterLogin(authResult) {
  const user = authResult.user;
  const token = authResult.access_token;
  if (!user?.id) throw new Error('Data user tidak ditemukan setelah login.');

  if (token) {
    try {
      const profile = await apiFetchProfileWithToken(user.id, token, 10000);
      if (profile?.role) return profile;
    } catch (e) {
      console.warn('fetch profile:', e);
    }
    try {
      const profile = await apiSyncProfileWithToken(token, 10000);
      if (profile?.role) return profile;
    } catch (e) {
      console.warn('sync profile:', e);
    }
  }

  return profileFromAuthUser(user);
}

async function clearStaleSession() {
  _sessionProfile = null;
  clearAuthSession();
  if (isLocalMode()) {
    localDbLogout();
    return;
  }
  if (!isSupabaseConfigured() || !getSupabaseLib()) return;
  try {
    await getSupabase().auth.signOut({ scope: 'local' });
  } catch (e) {
    console.warn('clearStaleSession:', e);
  }
}

async function restoreSession() {
  if (_sessionProfile) {
    if (_sessionProfile.status === 'nonaktif') {
      await clearStaleSession();
      return null;
    }
    return _sessionProfile;
  }

  if (isLocalMode()) {
    const profile = localDbRestoreSession();
    if (profile?.status === 'nonaktif') {
      localDbLogout();
      return null;
    }
    _sessionProfile = profile;
    return profile;
  }

  if (!isSupabaseConfigured()) return null;

  const storedUser = getStoredAuthUser();
  const token = loadStoredAccessToken();
  if (storedUser?.id && token) {
    try {
      const profile = await resolveProfileAfterLogin({ user: storedUser, access_token: token });
      _sessionProfile = profile;
      return profile;
    } catch (e) {
      console.warn('restoreSession stored:', e);
      clearAuthSession();
    }
  }

  if (!getSupabaseLib()) return null;

  try {
    const sessionResult = await raceTimeout(
      getSupabase().auth.getSession(),
      SESSION_RESTORE_TIMEOUT_MS,
      'session timeout'
    );
    const {
      data: { session },
    } = sessionResult;
    if (!session?.user) {
      _sessionProfile = null;
      return null;
    }
    setAccessToken(session.access_token);
    const profile = await resolveProfileAfterLogin({
      user: session.user,
      access_token: session.access_token,
    });
    if (profile?.status === 'nonaktif') {
      await clearStaleSession();
      return null;
    }
    _sessionProfile = profile;
    return profile;
  } catch (e) {
    console.warn('restoreSession:', e);
    if (allowsLocalFallback()) {
      switchToLocalMode();
      _sessionProfile = localDbRestoreSession();
      return _sessionProfile;
    }
    _sessionProfile = null;
    return null;
  }
}

async function performSignIn(email, password) {
  return authLoginDirect(email.toLowerCase(), (password || '').trim());
}

function validatePortalRole(profile, expectedRole) {
  if (!expectedRole || !profile) return null;
  if (expectedRole === 'admin' && profile.role !== 'admin') {
    return 'Akun ini bukan administrator. Gunakan portal Karyawan.';
  }
  if (expectedRole === 'user' && profile.role === 'admin') {
    return 'Akun administrator. Gunakan portal Administrator.';
  }
  return null;
}

async function login(usernameOrEmail, password, expectedRole = null) {
  if (_loginInFlight) {
    return { ok: false, message: 'Login sedang diproses, tunggu sebentar...' };
  }
  _loginInFlight = true;
  try {
    await initRuntime();

    if (isLocalMode()) {
      const result = await localDbLogin(usernameOrEmail, password);
      if (result.ok) {
        const portalErr = validatePortalRole(result.profile, expectedRole);
        if (portalErr) {
          localDbLogout();
          return { ok: false, message: portalErr };
        }
        _sessionProfile = result.profile;
      }
      return result;
    }

    if (!isSupabaseConfigured()) {
      return { ok: false, message: 'Supabase belum dikonfigurasi di js/config.js' };
    }

    const email = await apiResolveLoginEmail(usernameOrEmail);
    if (!email) {
      return {
        ok: false,
        message: `Akun "${usernameOrEmail}" tidak ditemukan. Hubungi administrator.`,
      };
    }

    try {
      const authResult = await performSignIn(email, password);
      const profile = await resolveProfileAfterLogin(authResult);
      if (!profile?.role) {
        return { ok: false, message: 'Profil tidak lengkap di Supabase.' };
      }
      if (profile.status === 'nonaktif') {
        await clearStaleSession();
        return { ok: false, message: 'Akun dinonaktifkan. Hubungi administrator.' };
      }
      const portalErr = validatePortalRole(profile, expectedRole);
      if (portalErr) {
        await clearStaleSession();
        return { ok: false, message: portalErr };
      }
      _sessionProfile = profile;
      return { ok: true, profile };
    } catch (e) {
      console.error('Supabase login:', e);
      if (allowsLocalFallback()) {
        switchToLocalMode();
        const result = await localDbLogin(usernameOrEmail, password);
        if (result.ok) {
          const portalErr = validatePortalRole(result.profile, expectedRole);
          if (portalErr) {
            localDbLogout();
            return { ok: false, message: portalErr };
          }
          _sessionProfile = result.profile;
          showToast('Mode lokal aktif — data disimpan di browser', 'info');
          return result;
        }
      }
      return mapLoginError(e);
    }
  } finally {
    _loginInFlight = false;
  }
}

async function logout() {
  _sessionProfile = null;
  clearAppData();
  clearAuthSession();
  if (isLocalMode()) {
    localDbLogout();
    return;
  }
  if (!isSupabaseConfigured() || !getSupabaseLib()) return;
  try {
    await getSupabase().auth.signOut();
  } catch (e) {
    console.warn(e);
  }
}

function initAuthListener() {
  if (isLocalMode() || !isSupabaseConfigured() || !getSupabaseLib()) return;
  try {
    getSupabase().auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        _sessionProfile = null;
        clearAppData();
        clearAuthSession();
      } else if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user && !_sessionProfile) {
        try {
          setAccessToken(session.access_token);
          _sessionProfile = await resolveProfileAfterLogin({
            user: session.user,
            access_token: session.access_token,
          });
        } catch (e) {
          console.warn('auth listener:', e);
        }
      }
    });
  } catch (e) {
    console.error('Auth listener:', e);
  }
}
