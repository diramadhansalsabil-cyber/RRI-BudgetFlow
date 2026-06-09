/** Deteksi Supabase vs mode lokal (localStorage) */

let _runtimeMode = null;

function isLocalMode() {
  return _runtimeMode === 'local';
}

function isCloudMode() {
  return _runtimeMode === 'supabase';
}

function getRuntimeMode() {
  return _runtimeMode || 'supabase';
}

function allowsLocalFallback() {
  const cfg = window.APP_CONFIG || {};
  return cfg.AUTO_LOCAL_FALLBACK === true && cfg.FORCE_CLOUD !== true && cfg.FORCE_LOCAL !== true;
}

async function pingSupabase(timeoutMs = 6000) {
  if (!isSupabaseConfigured() || !getSupabaseLib()) return false;
  try {
    const { url, key } = getSupabaseConfig();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
      method: 'GET',
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    return res.status < 500;
  } catch (e) {
    console.warn('pingSupabase:', e.message || e);
    return false;
  }
}

async function initRuntime() {
  if (_runtimeMode) return _runtimeMode;

  const cfg = window.APP_CONFIG || {};

  if (cfg.FORCE_LOCAL === true) {
    _runtimeMode = 'local';
    localDbInit();
    return _runtimeMode;
  }

  if (!isSupabaseConfigured() || !getSupabaseLib()) {
    _runtimeMode = allowsLocalFallback() ? 'local' : 'supabase';
    if (isLocalMode()) localDbInit();
    return _runtimeMode;
  }

  if (cfg.FORCE_CLOUD === true) {
    _runtimeMode = 'supabase';
    return _runtimeMode;
  }

  const online = await pingSupabase();
  _runtimeMode = online ? 'supabase' : allowsLocalFallback() ? 'local' : 'supabase';
  if (isLocalMode()) localDbInit();
  return _runtimeMode;
}

function switchToLocalMode() {
  if (!allowsLocalFallback()) return;
  _runtimeMode = 'local';
  localDbInit();
}
