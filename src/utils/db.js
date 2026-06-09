const DB_KEY = 'rri_budgetflow';

const DEFAULT_DB = {
  users: [
    {
      id: 'USR-001',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      nama: 'Administrator',
    },
    {
      id: 'USR-002',
      username: 'user',
      password: 'user123',
      role: 'user',
      nama: 'Karyawan',
    },
  ],
  templates: [
    {
      id: 'TMP-001',
      namaTemplate: 'RAB Pengadaan Barang',
      deskripsi: 'Template untuk pengadaan barang kantor',
      fields: [
        { label: 'Nama Barang', type: 'text', required: true },
        { label: 'Spesifikasi', type: 'textarea', required: true },
        { label: 'Jumlah Unit', type: 'number', required: true },
        { label: 'Harga Satuan', type: 'number', required: true },
        {
          label: 'Total Harga',
          type: 'calculated',
          formula: 'jumlah * harga',
        },
      ],
      createdAt: '2026-06-01',
    },
    {
      id: 'TMP-002',
      namaTemplate: 'RAB Jasa Konsultasi',
      deskripsi: 'Template untuk pengajuan jasa profesional',
      fields: [
        { label: 'Nama Jasa', type: 'text', required: true },
        { label: 'Deskripsi Pekerjaan', type: 'textarea', required: true },
        { label: 'Durasi (Hari)', type: 'number', required: true },
        { label: 'Biaya per Hari', type: 'number', required: true },
        {
          label: 'Total Biaya',
          type: 'calculated',
          formula: 'durasi * biaya',
        },
      ],
      createdAt: '2026-06-02',
    },
  ],
  pengajuan: [
    {
      id: 'PGJ-001',
      userId: 'USR-002',
      templateId: 'TMP-001',
      dataRAB: [
        {
          namaBarang: 'Laptop',
          spesifikasi: 'Core i7, 16GB RAM',
          jumlah: 2,
          harga: 8000000,
          total: 16000000,
        },
        {
          namaBarang: 'Monitor',
          spesifikasi: '27 inch 4K',
          jumlah: 2,
          harga: 3500000,
          total: 7000000,
        },
      ],
      totalAnggaran: 23000000,
      tanggal: '2026-06-01',
      bukti: [],
      status: 'pending',
      pesanAdmin: '',
      approvedAmount: null,
      createdAt: '2026-06-01',
      updatedAt: null,
    },
    {
      id: 'PGJ-002',
      userId: 'USR-002',
      templateId: 'TMP-001',
      dataRAB: [
        {
          namaBarang: 'Printer',
          spesifikasi: 'Laser A3',
          jumlah: 1,
          harga: 4500000,
          total: 4500000,
        },
      ],
      totalAnggaran: 4500000,
      tanggal: '2026-05-28',
      bukti: [],
      status: 'approved',
      pesanAdmin: 'Disetujui sesuai RAB',
      approvedAmount: 4500000,
      createdAt: '2026-05-28',
      updatedAt: '2026-05-29',
    },
  ],
};

export function getDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function setDB(data) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

export function initDB() {
  if (!localStorage.getItem(DB_KEY)) {
    setDB(DEFAULT_DB);
  } else {
    const db = getDB();
    if (!db.users?.length) {
      db.users = DEFAULT_DB.users;
    }
    if (!db.templates?.length) {
      db.templates = DEFAULT_DB.templates;
    }
    if (!db.pengajuan) {
      db.pengajuan = DEFAULT_DB.pengajuan;
    }
    setDB(db);
  }
}

export function labelToKey(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map((word, i) =>
      i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
}

export function getFormulaKeys(formula) {
  return formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
}

export function buildFieldKeys(fields) {
  const keys = {};
  fields.forEach((f) => {
    if (f.type !== 'calculated') {
      keys[f.label] = labelToKey(f.label);
    }
  });
  return keys;
}

export function evaluateFormula(formula, row, fieldKeys, fields) {
  const vars = {};
  fields.forEach((f) => {
    if (f.type === 'calculated') return;
    const key = fieldKeys[f.label];
    vars[key] = Number(row[key]) || 0;
  });

  const jumlah = vars.jumlahUnit ?? vars.jumlah ?? 0;
  const harga = vars.hargaSatuan ?? vars.harga ?? 0;
  const durasi = vars.durasiHari ?? vars.durasi ?? 0;
  const biaya = vars.biayaPerHari ?? vars.biaya ?? 0;

  try {
    const fn = new Function('jumlah', 'harga', 'durasi', 'biaya', `return ${formula}`);
    return Number(fn(jumlah, harga, durasi, biaya)) || 0;
  } catch {
    return 0;
  }
}

export function generateId(prefix, items) {
  const nums = (items || [])
    .map((item) => {
      const match = item.id?.match(new RegExp(`^${prefix}-(\\d+)$`));
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

export function getTemplateById(id) {
  return getDB().templates?.find((t) => t.id === id);
}

export function getUserById(id) {
  return getDB().users?.find((u) => u.id === id);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
