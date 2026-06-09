/** Model template RAB — Rencana Anggaran Belanja (multi-seksi) */

function isSectionTemplate(template) {
  return template?.rabType === 'sections' && Array.isArray(template.sections) && template.sections.length > 0;
}

function getStandardRABTemplate() {
  const itemFields = (itemLabel, priceLabel = 'Harga Satuan') => [
    { label: itemLabel, type: 'text', required: true },
    { label: 'Banyak', type: 'number', required: true },
    { label: 'Satuan', type: 'text', required: true },
    { label: priceLabel, type: 'number', required: true },
    { label: 'Jumlah Harga', type: 'calculated', formula: 'banyak * harga' },
  ];

  return {
    id: 'TMP-RAB',
    namaTemplate: 'Rencana Anggaran Belanja',
    judul: 'Rencana Anggaran Belanja',
    deskripsi: 'Format RAB resmi: Peralatan, Perlengkapan, dan Rekapitulasi otomatis',
    rabType: 'sections',
    sections: [
      {
        id: 'peralatan',
        label: 'A. Peralatan',
        footerLabel: 'Jumlah',
        fields: itemFields('Peralatan', 'Harga Satuan'),
      },
      {
        id: 'perlengkapan',
        label: 'B. Perlengkapan',
        footerLabel: 'Total',
        fields: itemFields('Perlengkapan', 'Harga'),
      },
    ],
    rekapitulasi: {
      label: 'C. Rekapitulasi',
      columns: ['No', 'Keterangan', 'Jumlah Harga'],
    },
    footer: {
      lokasi: 'Cikupa',
      bidang: 'Bidang BP/BK',
      showTandaTangan: true,
    },
    createdAt: '2026-06-04',
  };
}

function createEmptySectionData(template) {
  const data = { type: 'sections', sections: {} };
  template.sections.forEach((sec) => {
    data.sections[sec.id] = createInitialRows({ fields: sec.fields }, 1);
  });
  return data;
}

function getSectionRows(sectionData, sectionId) {
  if (!sectionData) return [];
  if (sectionData.type === 'sections') return sectionData.sections?.[sectionId] || [];
  return [];
}

function prepareSectionData(sectionData, template) {
  const result = { type: 'sections', sections: {}, rekapitulasi: [] };
  let grandTotal = 0;

  template.sections.forEach((sec) => {
    const rows = getSectionRows(sectionData, sec.id);
    const prepared = prepareDataRAB(rows, { fields: sec.fields });
    result.sections[sec.id] = prepared;
    const subtotal = prepared.reduce((s, r) => s + (r.total || 0), 0);
    result.rekapitulasi.push({
      keterangan: sec.label.replace(/^[A-Z]\.\s*/, ''),
      jumlahHarga: subtotal,
      sectionId: sec.id,
    });
    grandTotal += subtotal;
  });

  result.grandTotal = grandTotal;
  return result;
}

function getSectionGrandTotal(sectionData, template) {
  return prepareSectionData(sectionData, template).grandTotal || 0;
}

function validateSectionData(sectionData, template) {
  for (const sec of template.sections) {
    const rows = getSectionRows(sectionData, sec.id);
    if (!rows.length) {
      return { ok: false, message: `${sec.label}: minimal 1 item` };
    }
    const v = validateRABRows(rows, { fields: sec.fields });
    if (!v.ok) return { ok: false, message: `${sec.label} — ${v.message}` };
  }
  return { ok: true };
}

function normalizeDataRAB(dataRAB, template) {
  if (!dataRAB) return isSectionTemplate(template) ? createEmptySectionData(template) : [];
  if (dataRAB.type === 'sections') return dataRAB;
  if (Array.isArray(dataRAB) && isSectionTemplate(template)) {
    return { type: 'sections', sections: { [template.sections[0].id]: dataRAB }, rekapitulasi: [] };
  }
  return dataRAB;
}

function getSampleSectionPengajuan() {
  return {
    type: 'sections',
    sections: {
      peralatan: [
        { peralatan: 'Kursi', banyak: 5, satuan: 'buah', hargaSatuan: 160000, jumlahHarga: 800000, total: 800000 },
        { peralatan: 'Meja Kantor', banyak: 5, satuan: 'buah', hargaSatuan: 800000, jumlahHarga: 4000000, total: 4000000 },
        { peralatan: 'Meja Rapat', banyak: 1, satuan: 'buah', hargaSatuan: 3000000, jumlahHarga: 3000000, total: 3000000 },
        { peralatan: 'Printer', banyak: 1, satuan: 'buah', hargaSatuan: 2500000, jumlahHarga: 2500000, total: 2500000 },
        { peralatan: 'Sound System', banyak: 1, satuan: 'set', hargaSatuan: 6160000, jumlahHarga: 6160000, total: 6160000 },
      ],
      perlengkapan: [
        { perlengkapan: 'Kertas HVS A4', banyak: 10, satuan: 'rim', harga: 100000, jumlahHarga: 1000000, total: 1000000 },
        { perlengkapan: 'ATK', banyak: 5, satuan: 'set', harga: 200000, jumlahHarga: 1000000, total: 1000000 },
        { perlengkapan: 'Pengharum Ruangan', banyak: 5, satuan: 'buah', harga: 28000, jumlahHarga: 140000, total: 140000 },
        { perlengkapan: 'Tempat Sampah', banyak: 5, satuan: 'buah', harga: 50000, jumlahHarga: 250000, total: 250000 },
        { perlengkapan: 'Vacuum Cleaner', banyak: 1, satuan: 'buah', harga: 500000, jumlahHarga: 500000, total: 500000 },
        { perlengkapan: 'Dispenser', banyak: 1, satuan: 'buah', harga: 400000, jumlahHarga: 400000, total: 400000 },
        { perlengkapan: 'Kertas Foto', banyak: 2, satuan: 'pak', harga: 50000, jumlahHarga: 100000, total: 100000 },
        { perlengkapan: 'Kertas Sticker', banyak: 2, satuan: 'pak', harga: 120000, jumlahHarga: 240000, total: 240000 },
      ],
    },
    rekapitulasi: [
      { keterangan: 'Peralatan', jumlahHarga: 16460000, sectionId: 'peralatan' },
      { keterangan: 'Perlengkapan', jumlahHarga: 2514000, sectionId: 'perlengkapan' },
    ],
    grandTotal: 18974000,
  };
}
