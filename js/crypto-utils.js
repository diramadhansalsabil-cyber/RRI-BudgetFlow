/** Hash password untuk mode lokal (PBKDF2 — setara praktik aman di browser) */

const PW_ITERATIONS = 120000;

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PW_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return {
    salt: btoa(String.fromCharCode(...salt)),
    hash: btoa(String.fromCharCode(...new Uint8Array(bits))),
  };
}

async function verifyPassword(password, hashB64, saltB64) {
  if (!hashB64 || !saltB64) return false;
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PW_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const hash = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return hash === hashB64;
}
