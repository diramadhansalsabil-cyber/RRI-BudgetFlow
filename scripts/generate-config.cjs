/**
 * Generate js/config.js dari environment variables (Vercel build).
 * File .cjs agar kompatibel dengan package.json "type": "module".
 */
const fs = require('fs');
const path = require('path');

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';

const out = `window.APP_CONFIG = {
  SUPABASE_URL: ${JSON.stringify(url)},
  SUPABASE_ANON_KEY: ${JSON.stringify(key)},
  FORCE_CLOUD: true,
  AUTO_LOCAL_FALLBACK: false,
};
`;

const target = path.join(__dirname, '..', 'js', 'config.js');
fs.writeFileSync(target, out, 'utf8');
console.log('Generated', target, url ? '(configured)' : '(empty — set SUPABASE_URL & SUPABASE_ANON_KEY)');
