import { useMemo } from 'react';
import {
  buildFieldKeys,
  evaluateFormula,
  formatCurrency,
  labelToKey,
} from '../utils/db';
import Button from './ui/Button';

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

function FieldInput({ field, value, onChange, readOnly }) {
  const key = labelToKey(field.label);

  if (field.type === 'calculated') {
    return (
      <input
        type="text"
        className="input input-readonly"
        value={formatCurrency(value || 0)}
        readOnly
      />
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        className="input textarea"
        value={value ?? ''}
        onChange={(e) => onChange(key, e.target.value)}
        required={field.required}
        readOnly={readOnly}
        rows={2}
      />
    );
  }

  return (
    <input
      type={field.type === 'number' ? 'number' : 'text'}
      className="input"
      value={value ?? ''}
      onChange={(e) =>
        onChange(key, field.type === 'number' ? e.target.value : e.target.value)
      }
      required={field.required}
      min={field.type === 'number' ? 0 : undefined}
      readOnly={readOnly}
    />
  );
}

export default function DynamicFormGenerator({
  template,
  rows,
  onChange,
  readOnly = false,
}) {
  const fields = template?.fields || [];
  const fieldKeys = useMemo(() => buildFieldKeys(fields), [fields]);
  const inputFields = fields.filter((f) => f.type !== 'calculated');
  const calculatedField = fields.find((f) => f.type === 'calculated');

  const updateRow = (index, key, value) => {
    const next = [...rows];
    next[index] = computeRow(
      { ...next[index], [key]: value },
      fields,
      fieldKeys
    );
    onChange(next);
  };

  const addRow = () => {
    onChange([...rows, computeRow(emptyRow(fields, fieldKeys), fields, fieldKeys)]);
  };

  const removeRow = (index) => {
    if (rows.length <= 1) return;
    onChange(rows.filter((_, i) => i !== index));
  };

  const grandTotal = rows.reduce((sum, row) => {
    const computed = computeRow(row, fields, fieldKeys);
    const totalKey = calculatedField ? labelToKey(calculatedField.label) : 'total';
    return sum + (Number(computed[totalKey]) || Number(computed.total) || 0);
  }, 0);

  return (
    <div className="dynamic-form">
      <div className="rab-table-scroll">
        <table className="rab-table">
          <thead>
            <tr>
              <th className="rab-col-no">#</th>
              {fields.map((f) => (
                <th key={f.label}>
                  {f.label}
                  {f.required && <span className="required">*</span>}
                </th>
              ))}
              {!readOnly && <th className="rab-col-action">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const computed = computeRow(row, fields, fieldKeys);
              return (
                <tr key={index}>
                  <td className="rab-col-no">{index + 1}</td>
                  {fields.map((f) => (
                    <td key={f.label}>
                      <FieldInput
                        field={f}
                        value={
                          f.type === 'calculated'
                            ? computed[labelToKey(f.label)]
                            : computed[fieldKeys[f.label]]
                        }
                        onChange={(key, val) => updateRow(index, key, val)}
                        readOnly={readOnly || f.type === 'calculated'}
                      />
                    </td>
                  ))}
                  {!readOnly && (
                    <td className="rab-col-action">
                      <button
                        type="button"
                        className="btn-icon btn-danger-icon"
                        onClick={() => removeRow(index)}
                        disabled={rows.length <= 1}
                        title="Hapus baris"
                      >
                        −
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <Button type="button" variant="secondary" size="sm" onClick={addRow} className="rab-add-btn">
          + Tambah Item
        </Button>
      )}

      <div className="rab-grand-total">
        <span>Total Keseluruhan</span>
        <strong>{formatCurrency(grandTotal)}</strong>
      </div>
    </div>
  );
}

export function prepareDataRAB(rows, template) {
  const fields = template.fields;
  const fieldKeys = buildFieldKeys(fields);
  const calculatedField = fields.find((f) => f.type === 'calculated');
  const totalKey = calculatedField ? labelToKey(calculatedField.label) : 'total';

  return rows.map((row) => {
    const computed = computeRow(row, fields, fieldKeys);
    const item = { ...computed };
    item.total = Number(computed[totalKey]) || 0;
    return item;
  });
}

export function createInitialRows(template, count = 1) {
  const fields = template.fields;
  const fieldKeys = buildFieldKeys(fields);
  return Array.from({ length: count }, () =>
    computeRow(emptyRow(fields, fieldKeys), fields, fieldKeys)
  );
}
