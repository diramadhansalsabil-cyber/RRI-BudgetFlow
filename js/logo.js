/** Logo enterprise — minimal, internasional, industri */
function logoMark(size = 80) {
  const id = 'bf' + Math.random().toString(36).slice(2, 6);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="${size}" height="${size}" class="logo-mark" role="img" aria-label="RRI BudgetFlow">
  <defs>
    <linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="80" height="80" rx="18" fill="url(#${id}-bg)"/>
  <g fill="none" stroke="#f8fafc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M24 22h24v40H24V22z" fill="#f8fafc" fill-opacity="0.08" stroke="#f8fafc"/>
    <path d="M28 28h16" stroke-width="2.5"/>
    <path d="M28 34h12" opacity="0.5"/>
    <path d="M28 40h14" opacity="0.35"/>
    <path d="M28 50h8" stroke="#14b8a6" stroke-width="2"/>
  </g>
  <g fill="#14b8a6">
    <rect x="46" y="44" width="5" height="14" rx="1"/>
    <rect x="54" y="38" width="5" height="20" rx="1"/>
    <rect x="62" y="48" width="5" height="10" rx="1"/>
  </g>
  <path d="M44 58 Q52 50 66 44" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
</svg>`;
}

function logoSidebar(size = 40) {
  return logoMark(size);
}
