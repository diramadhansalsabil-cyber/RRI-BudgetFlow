/**
 * Ikon enterprise internasional — stroke presisi, monokrom, tanpa gaya kartun
 * Referensi: SAP, Stripe Dashboard, Linear (outline 1.5px)
 */
const ENT_ICONS = {
  dashboard: `<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="4" rx="1.5"/><rect x="14" y="9" width="7" height="12" rx="1.5"/><rect x="3" y="12" width="7" height="9" rx="1.5"/>`,
  pengajuan: `<path d="M8 4.5h8l2.5 2.5V19.5H8V4.5z"/><path d="M16 5v3h3"/><path d="M10 11h6"/><path d="M10 14.5h4.5"/><path d="M10 18h3"/>`,
  template: `<path d="M3.5 8.2V6.8c0-1.15.85-2 2-2h3.6l1.5 1.7h7c1.25 0 2.25 1 2.25 2.25v9.55c0 1.2-1 2.2-2.2 2.2H5.7c-1.2 0-2.2-1-2.2-2.2V8.2z"/><path d="M5.8 10.8h12.6l-1.35 6.35H7.15L5.8 10.8z"/>`,
  folder: `<path d="M3.5 8.2V6.8c0-1.15.85-2 2-2h3.6l1.5 1.7h7c1.25 0 2.25 1 2.25 2.25v9.55c0 1.2-1 2.2-2.2 2.2H5.7c-1.2 0-2.2-1-2.2-2.2V8.2z"/><path d="M5.8 10.8h12.6l-1.35 6.35H7.15L5.8 10.8z"/>`,
  add: `<path d="M12 5v14M5 12h14"/>`,
  remove: `<path d="M9 6h6"/><path d="M10 6v1.5h4V18H8V7.5H6V6h4z"/><path d="M10.5 10v7.5M13.5 10v7.5"/><path d="M8 19.5h8"/>`,
  save: `<path d="M9 12.5l2.5 2.5L16 9.5"/><circle cx="12" cy="12" r="9"/>`,
  cancel: `<path d="M9 9l6 6M15 9l-6 6"/><circle cx="12" cy="12" r="9"/>`,
  login: `<path d="M15 4h4v16h-4"/><path d="M5 12h10"/><path d="M8.5 8.5L5 12l3.5 3.5"/>`,
  logout: `<path d="M11 4h4v16h-4"/><path d="M19 12H9"/><path d="M15.5 8.5L19 12l-3.5 3.5"/>`,
  user: `<circle cx="12" cy="8" r="3.5"/><path d="M6 19.5c1.4-3 3.8-4.5 6-4.5s4.6 1.5 6 4.5"/>`,
  users: `<circle cx="9" cy="9" r="2.75"/><circle cx="16.5" cy="10" r="2.5"/><path d="M4.5 18.5c.9-2.5 2.5-4 4.5-4s3.6 1.5 4.5 4"/><path d="M13 18.5c.8-2.2 2.2-3.5 3.5-3.5s2.7 1.3 3.5 3.5"/>`,
  admin: `<path d="M12 4.5l7.5 3.8v5.2c0 4.6-3.2 7.2-7.5 8.8-4.3-1.6-7.5-4.2-7.5-8.8V8.3L12 4.5z"/><path d="M9.5 12.5l2 2 4.2-4.7"/>`,
  lock: `<rect x="6.5" y="10.5" width="11" height="8.5" rx="1.5"/><path d="M8.5 10.5V8.2a3.5 3.5 0 0 1 7 0v2.3"/>`,
  money: `<rect x="3.5" y="6.5" width="17" height="11" rx="2"/><circle cx="12" cy="12" r="2.75"/><path d="M3.5 10h17"/>`,
  chart: `<path d="M4 19.5V5"/><path d="M4 19.5h16"/><path d="M7.5 15v-4"/><path d="M12 15V9"/><path d="M16.5 15V6"/>`,
  pending: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3.25 2.25"/>`,
  approved: `<circle cx="12" cy="12" r="8.5"/><path d="M8.25 12.25l2.75 2.75 5.5-6.25"/>`,
  rejected: `<circle cx="12" cy="12" r="8.5"/><path d="M9.25 9.25l5.5 5.5M14.75 9.25l-5.5 5.5"/>`,
  upload: `<path d="M12 5.5v9"/><path d="M8.75 11.25L12 14.5l3.25-3.25"/><path d="M5.5 16.5h13v3.5h-13z"/>`,
  eye: `<path d="M2.5 12s4-6.5 9.5-6.5S21.5 12 21.5 12s-4 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.5"/>`,
  edit: `<path d="M16.5 5.5l2.5 2.5-9 9H7v-3l9-8.5z"/><path d="M14.5 7.5l2.5 2.5"/>`,
  back: `<path d="M19 12H7"/><path d="M11 8.5l-3.5 3.5L11 15.5"/>`,
  menu: `<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/>`,
  chevronL: `<path d="M14.5 7.5l-5 5 5 5"/>`,
  chevronR: `<path d="M9.5 7.5l5 5-5 5"/>`,
  info: `<circle cx="12" cy="12" r="8.5"/><path d="M12 10v5"/><circle cx="12" cy="7.25" r=".75" fill="currentColor" stroke="none"/>`,
  alert: `<path d="M12 4.75L20.25 18H3.75L12 4.75z"/><path d="M12 9.5v4"/><circle cx="12" cy="16" r=".75" fill="currentColor" stroke="none"/>`,
  search: `<circle cx="10.75" cy="10.75" r="5.75"/><path d="M15.5 15.5L19 19"/>`,
  filter: `<path d="M4 6.5h16"/><path d="M7 12h10"/><path d="M10 17.5h4"/>`,
  document: `<path d="M8.5 4.5h7l3 3V19.5H8.5V4.5z"/><path d="M15.5 5v3.5h3.5"/><path d="M10.5 11h5"/><path d="M10.5 14.5h4"/>`,
  riwayat: `<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8"/><path d="M8 12h5"/><path d="M8 16h6"/><path d="M16 3v4h-4"/>`,
  calculator: `<rect x="5.5" y="3.5" width="13" height="17" rx="2"/><path d="M8.5 7.5h7"/><path d="M8.5 11h3"/><path d="M12.5 11h3"/><path d="M8.5 14.5h3"/><path d="M12.5 14.5h3"/><path d="M8.5 18h7"/>`,
  logo: `<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 12.5h5.5M8 16h3"/>`,
  crown: `<path d="M5 18h14"/><path d="M7.5 16.5L9 8.5l3 3.5 3-3.5 1.5 8"/><circle cx="9" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="5.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="7.5" r="1.1" fill="currentColor" stroke="none"/>`,
  userMinus: `<circle cx="10" cy="8.5" r="3"/><path d="M5.5 18c1-2.2 2.6-3.5 4.5-3.5"/><path d="M16 14.5h5"/><path d="M18.5 12v5"/>`,
  ban: `<circle cx="12" cy="12" r="9"/><path d="M7.25 7.25l9.5 9.5"/>`,
  powerOn: `<path d="M12 3v5.5"/><path d="M8.25 9.25a5.75 5.75 0 1 0 7.5 0"/>`,
};

const FILLED_ICONS = new Set(['template', 'folder']);

function icon(name, size = 20, extraClass = '') {
  const paths = ENT_ICONS[name] || ENT_ICONS.info;
  const filled = FILLED_ICONS.has(name);
  if (filled) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" class="icon icon-ent icon-filled ${extraClass}" fill="currentColor" stroke="none" aria-hidden="true">${paths}</svg>`;
  }
  const sw = size <= 16 ? 1.4 : 1.5;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" class="icon icon-ent ${extraClass}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

function refreshIcons() {}
