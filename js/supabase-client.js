let supabase = null;
let _accessToken = null;

function isSupabaseConfigured() {
  const c = window.APP_CONFIG || {};
  const url = (c.SUPABASE_URL || '').trim();
  const key = (c.SUPABASE_ANON_KEY || '').trim();
  if (!url || url.includes('YOUR_PROJECT')) return false;
  if (!key || key.includes('anon_key_anda') || key.includes('...')) return false;
  const legacyAnon = key.startsWith('eyJ') && key.length >= 80;
  const publishable = key.startsWith('sb_publishable_') && key.length >= 30;
  return legacyAnon || publishable;
}

function getSupabaseLib() {
  if (typeof window.supabase?.createClient === 'function') return window.supabase;
  return null;
}

function getSupabaseConfig() {
  return {
    url: (window.APP_CONFIG?.SUPABASE_URL || '').trim().replace(/\/+$/, ''),
    key: (window.APP_CONFIG?.SUPABASE_ANON_KEY || '').trim(),
  };
}

function getSupabaseStorageKey() {
  const { url } = getSupabaseConfig();
  const ref = url.replace('https://', '').split('.')[0];
  return `sb-${ref}-auth-token`;
}

function getAccessToken() {
  return _accessToken || loadStoredAccessToken();
}

function setAccessToken(token) {
  _accessToken = token || null;
}

function loadStoredAccessToken() {
  try {
    const raw = localStorage.getItem(getSupabaseStorageKey());
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.access_token) {
      _accessToken = data.access_token;
      return data.access_token;
    }
  } catch (e) {
    console.warn('loadStoredAccessToken:', e);
  }
  return null;
}

function getStoredAuthUser() {
  try {
    const raw = localStorage.getItem(getSupabaseStorageKey());
    if (!raw) return null;
    return JSON.parse(raw)?.user || null;
  } catch {
    return null;
  }
}

function saveAuthSession(json) {
  if (!json?.access_token || !json?.user) return;
  setAccessToken(json.access_token);
  try {
    const payload = {
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + Number(json.expires_in || 3600),
      expires_in: Number(json.expires_in || 3600),
      token_type: json.token_type || 'bearer',
      user: json.user,
    };
    localStorage.setItem(getSupabaseStorageKey(), JSON.stringify(payload));
  } catch (e) {
    console.warn('saveAuthSession:', e);
  }
  if (getSupabaseLib()) {
    getSupabase()
      .auth.setSession({
        access_token: json.access_token,
        refresh_token: json.refresh_token,
      })
      .catch((e) => console.warn('setSession bg:', e));
  }
}

function clearAuthSession() {
  _accessToken = null;
  try {
    localStorage.removeItem(getSupabaseStorageKey());
  } catch (e) {
    console.warn(e);
  }
}

function fetchWithTimeout(url, options = {}, ms = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  const ext = options.signal;
  if (ext) {
    ext.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function racePromise(promise, ms, message = 'Koneksi waktu habis') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase belum dikonfigurasi. Isi SUPABASE_ANON_KEY lengkap di js/config.js');
  }
  const lib = getSupabaseLib();
  if (!lib) {
    throw new Error('Library Supabase gagal dimuat. Periksa koneksi internet atau CDN di index.html');
  }
  if (!supabase) {
    const { url, key } = getSupabaseConfig();
    supabase = lib.createClient(url, key, {
      global: {
        fetch: (u, opts) => fetchWithTimeout(u, opts, 15000),
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: window.localStorage,
      },
    });
  }
  return supabase;
}

/** Login langsung ke Auth REST API — tidak menunggu supabase-js setSession */
async function authLoginDirect(email, password) {
  const { url, key } = getSupabaseConfig();
  const res = await fetchWithTimeout(
    `${url}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: normalizeEmailInput(email), password }),
    },
    15000
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw = json.error_description || json.msg || json.message || `Login gagal (HTTP ${res.status})`;
    const err = new Error(mapAuthError(json, raw));
    err.status = res.status;
    err.authCode = json.error_code || json.error;
    throw err;
  }
  if (!json.access_token || !json.user?.id) {
    throw new Error('Token login tidak diterima dari Supabase');
  }
  saveAuthSession(json);
  return {
    user: json.user,
    access_token: json.access_token,
    refresh_token: json.refresh_token,
  };
}

/** Registrasi via Auth REST API */
async function authSignupDirect(email, password, metadata = {}) {
  const { url, key } = getSupabaseConfig();
  const res = await fetchWithTimeout(
    `${url}/auth/v1/signup`,
    {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: normalizeEmailInput(email),
        password,
        data: metadata,
      }),
    },
    20000
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw = json.error_description || json.msg || json.message || `Registrasi gagal (HTTP ${res.status})`;
    const err = new Error(mapAuthError(json, raw));
    err.status = res.status;
    err.authCode = json.error_code || json.error;
    throw err;
  }

  // GoTrue: tanpa auto-confirm, user ada di root (bukan json.user)
  const user = json.user || (json.id && json.email ? json : null);
  const identities = user?.identities;
  if (Array.isArray(identities) && identities.length === 0) {
    throw new Error('Email sudah terdaftar. Silakan login.');
  }
  if (!user?.id) {
    throw new Error(
      'Registrasi gagal — periksa Authentication → Providers → Email (Signup ON, Confirm email OFF untuk development).'
    );
  }

  if (json.access_token && user) {
    saveAuthSession({ ...json, user });
  }
  return {
    user,
    access_token: json.access_token || null,
    refresh_token: json.refresh_token || null,
  };
}
