/**
 * Salin file ini menjadi config.js dan isi kredensial Supabase.
 * Di Vercel: set env SUPABASE_URL & SUPABASE_ANON_KEY — build akan generate config.js otomatis.
 */
window.APP_CONFIG = {
  SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_ANON_PUBLIC_KEY',
  FORCE_CLOUD: true,
  AUTO_LOCAL_FALLBACK: false,
};
