/** Utilitas field RAB (tanpa localStorage) */

function labelToKey(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map((word, i) => (i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('');
}

function buildFieldKeys(fields) {
  const keys = {};
  fields.forEach((f) => {
    if (f.type !== 'calculated') keys[f.label] = labelToKey(f.label);
  });
  return keys;
}

function evaluateFormula(formula, row, fieldKeys, fields) {
  const vars = {};
  fields.forEach((f) => {
    if (f.type === 'calculated') return;
    const key = fieldKeys[f.label];
    vars[key] = Number(row[key]) || 0;
  });
  const banyak = vars.banyak ?? vars.jumlahUnit ?? vars.jumlah ?? 0;
  const jumlah = banyak;
  const harga = vars.hargaSatuan ?? vars.harga ?? 0;
  const durasi = vars.durasiHari ?? vars.durasi ?? 0;
  const biaya = vars.biayaPerHari ?? vars.biaya ?? 0;
  try {
    const fn = new Function('banyak', 'jumlah', 'harga', 'durasi', 'biaya', `return ${formula}`);
    return Number(fn(banyak, jumlah, harga, durasi, biaya)) || 0;
  } catch {
    return 0;
  }
}

function generateId(prefix, items) {
  const nums = (items || [])
    .map((item) => {
      const m = (item.kode || item.id)?.match(new RegExp(`^${prefix}-(\\d+)$`));
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}
