function renderDynamicForm(container, template, data, onChange, readOnly = false) {
  if (isSectionTemplate(template)) {
    renderSectionRABForm(container, template, data, onChange, readOnly);
    return;
  }
  const rows = Array.isArray(data) ? data : [];
  renderSimpleRABForm(container, template, rows, onChange, readOnly);
}

function renderSimpleRABForm(container, template, rows, onChange, readOnly = false) {
  const fields = template.fields;
  const fieldKeys = buildFieldKeys(fields);
  const calcFields = fields.filter((f) => f.type === 'calculated');

  function updateRowTotals(tr, rowIndex) {
    const computed = computeRow(rows[rowIndex], fields, fieldKeys);
    rows[rowIndex] = computed;
    calcFields.forEach((f) => {
      const key = labelToKey(f.label);
      const inp = tr.querySelector(`[data-calc-key="${key}"]`);
      if (inp) inp.value = formatCurrency(computed[key] || 0);
    });
    const gt = document.getElementById('rabGrandTotal');
    if (gt) gt.textContent = formatCurrency(getGrandTotal(rows, template));
    onChange(rows);
  }

  function buildTable() {
    const headerCells = fields
      .map((f) => `<th>${escapeHtml(f.label)}${f.required ? '<span class="required">*</span>' : ''}</th>`)
      .join('');

    const bodyRows = rows
      .map((row, index) => {
        const computed = computeRow(row, fields, fieldKeys);
        const cells = fields
          .map((f) => {
            const key = f.type === 'calculated' ? labelToKey(f.label) : fieldKeys[f.label];
            const val = computed[key];
            if (f.type === 'calculated') {
              return `<td><input class="input input-readonly rab-input-money" readonly data-calc-key="${key}" value="${escapeHtml(formatCurrency(val || 0))}" /></td>`;
            }
            if (readOnly) return `<td>${escapeHtml(String(val ?? ''))}</td>`;
            if (f.type === 'textarea') {
              return `<td><textarea class="input textarea rab-input" data-row="${index}" data-key="${key}" rows="2">${escapeHtml(String(val ?? ''))}</textarea></td>`;
            }
            return `<td><input class="input rab-input ${f.type === 'number' ? 'rab-num' : ''}" type="${f.type === 'number' ? 'number' : 'text'}" data-row="${index}" data-key="${key}" value="${escapeHtml(String(val ?? ''))}" ${f.type === 'number' ? 'min="0" step="any"' : ''} /></td>`;
          })
          .join('');
        const actionCell = readOnly
          ? ''
          : `<td class="rab-col-action"><button type="button" class="btn-icon btn-danger-icon rab-remove" data-index="${index}" ${rows.length <= 1 ? 'disabled' : ''}>${icon('remove', 16)}</button></td>`;
        return `<tr data-row-index="${index}"><td class="rab-col-no">${index + 1}</td>${cells}${readOnly ? '' : actionCell}</tr>`;
      })
      .join('');

    return `
      <div class="rab-table-scroll">
        <table class="rab-table rab-official">
          <thead class="rab-head-yellow"><tr><th class="rab-col-no">No</th>${headerCells}${readOnly ? '' : '<th class="rab-col-action">Aksi</th>'}</tr></thead>
          <tbody id="rabTableBody">${bodyRows}</tbody>
        </table>
      </div>
      ${readOnly ? '' : `<button type="button" class="btn btn-secondary btn-sm rab-add-btn" id="rabAddRow">${icon('add', 16)} Tambah Item</button>`}
      <div class="rab-grand-total">
        <span>${icon('calculator', 18)} Total Keseluruhan</span>
        <strong id="rabGrandTotal">${formatCurrency(getGrandTotal(rows, template))}</strong>
      </div>`;
  }

  function bindEvents() {
    if (readOnly) return;
    const tbody = container.querySelector('#rabTableBody');
    tbody?.querySelectorAll('.rab-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.row, 10);
        const key = e.target.dataset.key;
        rows[idx] = { ...rows[idx], [key]: e.target.value };
        updateRowTotals(e.target.closest('tr'), idx);
      });
    });
    tbody?.querySelectorAll('.rab-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        rows.splice(parseInt(btn.dataset.index, 10), 1);
        if (rows.length < 1) rows.push(computeRow(emptyRow(fields, fieldKeys), fields, fieldKeys));
        onChange(rows);
        redraw();
      });
    });
    container.querySelector('#rabAddRow')?.addEventListener('click', () => {
      rows.push(computeRow(emptyRow(fields, fieldKeys), fields, fieldKeys));
      onChange(rows);
      redraw();
    });
  }

  function redraw() {
    container.innerHTML = buildTable();
    bindEvents();
    refreshIcons(container);
  }
  redraw();
}

function renderSectionRABForm(container, template, sectionData, onChange, readOnly = false) {
  if (!sectionData || sectionData.type !== 'sections') {
    sectionData = createEmptySectionData(template);
  }

  function syncGrandTotal() {
    const gt = document.getElementById('rabGrandTotal');
    if (gt) gt.textContent = formatCurrency(getSectionGrandTotal(sectionData, template));
    const recapEl = document.getElementById('rabRekapitulasiBody');
    if (recapEl) {
      const prepared = prepareSectionData(sectionData, template);
      recapEl.innerHTML = prepared.rekapitulasi
        .map(
          (r, i) => `
        <tr>
          <td class="rab-col-no">${i + 1}</td>
          <td>${escapeHtml(r.keterangan)}</td>
          <td class="td-money rab-td-right">${formatCurrency(r.jumlahHarga)}</td>
        </tr>`
        )
        .join('');
      const recapTotal = document.getElementById('rabRekapitulasiTotal');
      if (recapTotal) recapTotal.textContent = formatCurrency(prepared.grandTotal);
    }
    onChange(sectionData);
  }

  function renderSectionTable(sec, rows) {
    const fields = sec.fields;
    const fieldKeys = buildFieldKeys(fields);
    const calcFields = fields.filter((f) => f.type === 'calculated');
    const subtotal = prepareDataRAB(rows, { fields }).reduce((s, r) => s + (r.total || 0), 0);

    const headerCells = fields.map((f) => `<th>${escapeHtml(f.label)}${f.required ? '<span class="required">*</span>' : ''}</th>`).join('');

    const bodyRows = rows
      .map((row, index) => {
        const computed = computeRow(row, fields, fieldKeys);
        const cells = fields
          .map((f) => {
            const key = f.type === 'calculated' ? labelToKey(f.label) : fieldKeys[f.label];
            const val = computed[key];
            if (f.type === 'calculated') {
              return `<td class="rab-td-right"><input class="input input-readonly rab-input-money" readonly data-sec="${sec.id}" data-row="${index}" data-calc-key="${key}" value="${escapeHtml(formatCurrency(val || 0))}" /></td>`;
            }
            if (readOnly) {
              const align = f.type === 'number' ? 'rab-td-right' : f.label === 'Banyak' || f.label === 'Satuan' ? 'rab-td-center' : '';
              return `<td class="${align}">${f.type === 'number' && f.label.includes('Harga') ? formatCurrency(val) : escapeHtml(String(val ?? ''))}</td>`;
            }
            const align = f.type === 'number' ? 'rab-td-right' : '';
            const cls = f.type === 'number' ? 'rab-num' : '';
            return `<td class="${align}"><input class="input rab-input ${cls}" type="${f.type === 'number' ? 'number' : 'text'}" data-sec="${sec.id}" data-row="${index}" data-key="${key}" value="${escapeHtml(String(val ?? ''))}" ${f.type === 'number' ? 'min="0" step="any"' : ''} /></td>`;
          })
          .join('');
        const action = readOnly
          ? ''
          : `<td class="rab-col-action"><button type="button" class="btn-icon btn-danger-icon rab-sec-remove" data-sec="${sec.id}" data-index="${index}" ${rows.length <= 1 ? 'disabled' : ''}>${icon('remove', 16)}</button></td>`;
        return `<tr><td class="rab-col-no">${index + 1}</td>${cells}${readOnly ? '' : action}</tr>`;
      })
      .join('');

    return `
      <div class="rab-section-block">
        <h4 class="rab-section-title">${escapeHtml(sec.label)}</h4>
        <div class="rab-table-scroll">
          <table class="rab-table rab-official" data-section="${sec.id}">
            <thead class="rab-head-yellow"><tr><th class="rab-col-no">No</th>${headerCells}${readOnly ? '' : '<th class="rab-col-action">Aksi</th>'}</tr></thead>
            <tbody class="rab-sec-body" data-sec="${sec.id}">${bodyRows}</tbody>
            <tfoot>
              <tr class="rab-foot-total">
                <td colspan="${fields.length}" class="rab-td-right"><strong>${escapeHtml(sec.footerLabel || 'Jumlah')}</strong></td>
                <td class="td-money rab-td-right" data-sec-subtotal="${sec.id}"><strong>${formatCurrency(subtotal)}</strong></td>
                ${readOnly ? '' : '<td></td>'}
              </tr>
            </tfoot>
          </table>
        </div>
        ${readOnly ? '' : `<button type="button" class="btn btn-secondary btn-sm rab-sec-add" data-sec="${sec.id}">${icon('add', 16)} Tambah Baris</button>`}
      </div>`;
  }

  const prepared = prepareSectionData(sectionData, template);
  const judul = template.judul || template.namaTemplate || 'Rencana Anggaran Belanja';

  container.innerHTML = `
    <div class="rab-document">
      <h2 class="rab-doc-title">${escapeHtml(judul)}</h2>
      ${template.sections.map((sec) => renderSectionTable(sec, sectionData.sections[sec.id] || [])).join('')}
      <div class="rab-section-block">
        <h4 class="rab-section-title">${escapeHtml(template.rekapitulasi?.label || 'C. Rekapitulasi')}</h4>
        <div class="rab-table-scroll">
          <table class="rab-table rab-official rab-rekapitulasi">
            <thead class="rab-head-yellow">
              <tr><th class="rab-col-no">No</th><th>Keterangan</th><th class="rab-td-right">Jumlah Harga</th></tr>
            </thead>
            <tbody id="rabRekapitulasiBody">${prepared.rekapitulasi
              .map(
                (r, i) => `
              <tr><td class="rab-col-no">${i + 1}</td><td>${escapeHtml(r.keterangan)}</td><td class="td-money rab-td-right">${formatCurrency(r.jumlahHarga)}</td></tr>`
              )
              .join('')}</tbody>
            <tfoot>
              <tr class="rab-foot-total">
                <td colspan="2" class="rab-td-right"><strong>Jumlah</strong></td>
                <td class="td-money rab-td-right"><strong id="rabRekapitulasiTotal">${formatCurrency(prepared.grandTotal)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div class="rab-grand-total">
        <span>${icon('calculator', 18)} Total Anggaran</span>
        <strong id="rabGrandTotal">${formatCurrency(prepared.grandTotal)}</strong>
      </div>
    </div>`;

  if (!readOnly) {
    container.querySelectorAll('.rab-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const secId = e.target.dataset.sec;
        const idx = parseInt(e.target.dataset.row, 10);
        const key = e.target.dataset.key;
        const rows = sectionData.sections[secId];
        rows[idx] = { ...rows[idx], [key]: e.target.value };
        const fields = template.sections.find((s) => s.id === secId).fields;
        const fieldKeys = buildFieldKeys(fields);
        rows[idx] = computeRow(rows[idx], fields, fieldKeys);
        const subEl = container.querySelector(`[data-sec-subtotal="${secId}"]`);
        if (subEl) {
          const sub = prepareDataRAB(rows, { fields }).reduce((s, r) => s + (r.total || 0), 0);
          subEl.innerHTML = `<strong>${formatCurrency(sub)}</strong>`;
        }
        syncGrandTotal();
      });
    });

    function redrawAll() {
      const scrollY = window.scrollY;
      renderSectionRABForm(container, template, sectionData, onChange, readOnly);
      window.scrollTo(0, scrollY);
    }

    container.querySelectorAll('.rab-sec-remove').forEach((btn) => {
      btn.onclick = () => {
        const secId = btn.dataset.sec;
        if (sectionData.sections[secId].length <= 1) return;
        sectionData.sections[secId].splice(parseInt(btn.dataset.index, 10), 1);
        redrawAll();
      };
    });

    container.querySelectorAll('.rab-sec-add').forEach((btn) => {
      btn.onclick = () => {
        const secId = btn.dataset.sec;
        const sec = template.sections.find((s) => s.id === secId);
        const fieldKeys = buildFieldKeys(sec.fields);
        sectionData.sections[secId].push(computeRow(emptyRow(sec.fields, fieldKeys), sec.fields, fieldKeys));
        redrawAll();
      };
    });
  }

  refreshIcons(container);
  syncGrandTotal();
}

function renderRABReadOnlyTable(template, dataRAB) {
  const data = normalizeDataRAB(dataRAB, template);
  if (isSectionTemplate(template)) {
    return renderRABDocument(template, data, { readOnly: true });
  }
  if (!template?.fields?.length) return '<p class="text-muted">Template tidak ditemukan</p>';
  const fields = template.fields;
  const rows = Array.isArray(data) ? data : [];
  const head = fields.map((f) => `<th>${escapeHtml(f.label)}</th>`).join('');
  const body = rows
    .map((row, i) => {
      const cells = fields
        .map((f) => {
          const key = labelToKey(f.label);
          const val = row[key] ?? row.total;
          if (f.type === 'calculated' || key.toLowerCase().includes('total') || key.toLowerCase().includes('jumlah')) {
            return `<td class="td-money rab-td-right">${formatCurrency(val ?? row.total)}</td>`;
          }
          return `<td>${escapeHtml(String(row[key] ?? '—'))}</td>`;
        })
        .join('');
      return `<tr><td class="rab-col-no">${i + 1}</td>${cells}</tr>`;
    })
    .join('');
  return `<div class="rab-table-scroll"><table class="rab-table rab-official"><thead class="rab-head-yellow"><tr><th class="rab-col-no">No</th>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderRABDocument(template, sectionData, opts = {}) {
  const wrap = document.createElement('div');
  renderSectionRABForm(wrap, template, normalizeDataRAB(sectionData, template), () => {}, true);
  let html = wrap.innerHTML;
  if (template.footer?.showTandaTangan) {
    const lokasi = template.footer.lokasi || 'Cikupa';
    const bidang = template.footer.bidang || 'Bidang BP/BK';
    const tanggal = formatDate(todayISO());
    html += `
      <div class="rab-signature">
        <p>${escapeHtml(lokasi)}, ${tanggal}</p>
        <p class="rab-signature-bidang">${escapeHtml(bidang)}</p>
        <div class="rab-signature-line"></div>
        <p class="rab-signature-name">( Nama &amp; Tanda Tangan )</p>
      </div>`;
  }
  return `<div class="rab-document rab-document-print">${html}</div>`;
}
