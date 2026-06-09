/** Helper baris RAB — dipakai form dinamis & validasi (vanilla) */

function emptyRow(fields, fieldKeys) {
  const row = {};
  fields.forEach((f) => {
    if (f.type === 'calculated') return;
    row[fieldKeys[f.label]] = f.type === 'number' ? '' : '';
  });
  return row;
}

function computeRow(row, fields, fieldKeys) {
  const updated = { ...row };
  fields.forEach((f) => {
    if (f.type === 'calculated') {
      const totalKey = labelToKey(f.label);
      updated[totalKey] = evaluateFormula(f.formula, updated, fieldKeys, fields);
      updated.total = updated[totalKey];
    }
  });
  return updated;
}

function prepareDataRAB(rows, template) {
  const fields = template.fields || [];
  const fieldKeys = buildFieldKeys(fields);
  const calculatedField = fields.find((f) => f.type === 'calculated');
  const totalKey = calculatedField ? labelToKey(calculatedField.label) : 'total';

  return (rows || []).map((row) => {
    const computed = computeRow(row, fields, fieldKeys);
    const item = { ...computed };
    item.total = Number(computed[totalKey]) || 0;
    return item;
  });
}

function createInitialRows(template, count = 1) {
  const fields = template.fields || [];
  const fieldKeys = buildFieldKeys(fields);
  return Array.from({ length: count }, () =>
    computeRow(emptyRow(fields, fieldKeys), fields, fieldKeys)
  );
}

function getGrandTotal(rows, template) {
  const fields = template.fields || [];
  const fieldKeys = buildFieldKeys(fields);
  const calculatedField = fields.find((f) => f.type === 'calculated');
  const totalKey = calculatedField ? labelToKey(calculatedField.label) : 'total';
  return (rows || []).reduce((sum, row) => {
    const computed = computeRow(row, fields, fieldKeys);
    return sum + (Number(computed[totalKey]) || Number(computed.total) || 0);
  }, 0);
}

function isUsableTemplate(template) {
  if (!template) return false;
  if (isSectionTemplate(template)) return true;
  return Array.isArray(template.fields) && template.fields.length > 0;
}
