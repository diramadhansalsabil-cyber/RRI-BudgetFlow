import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal, { ModalActions } from '../../components/ui/Modal';
import Table from '../../components/ui/Table';
import { getDB, setDB, generateId, formatDate } from '../../utils/db';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'calculated', label: 'Calculated (Auto)' },
];

const EMPTY_FIELD = { label: '', type: 'text', required: true, formula: '' };

export default function TemplateManager() {
  const [refresh, setRefresh] = useState(0);
  const db = getDB();
  const templates = db.templates || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [namaTemplate, setNamaTemplate] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [fields, setFields] = useState([{ ...EMPTY_FIELD }]);

  const triggerRefresh = () => setRefresh((r) => r + 1);

  const openCreate = () => {
    setEditingId(null);
    setNamaTemplate('');
    setDeskripsi('');
    setFields([{ ...EMPTY_FIELD }]);
    setModalOpen(true);
  };

  const openEdit = (tpl) => {
    setEditingId(tpl.id);
    setNamaTemplate(tpl.namaTemplate);
    setDeskripsi(tpl.deskripsi || '');
    setFields(tpl.fields.map((f) => ({ ...f, formula: f.formula || '' })));
    setModalOpen(true);
  };

  const updateField = (index, key, value) => {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [key]: value } : f))
    );
  };

  const addField = () => setFields((prev) => [...prev, { ...EMPTY_FIELD }]);
  const removeField = (index) => {
    if (fields.length <= 1) return;
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!namaTemplate.trim() || fields.some((f) => !f.label.trim())) return;

    const freshDb = getDB();
    const payload = {
      namaTemplate: namaTemplate.trim(),
      deskripsi: deskripsi.trim(),
      fields: fields.map((f) => {
        const field = {
          label: f.label.trim(),
          type: f.type,
          required: f.type !== 'calculated' ? !!f.required : undefined,
        };
        if (f.type === 'calculated') {
          field.formula = f.formula.trim() || 'jumlah * harga';
        }
        return field;
      }),
      createdAt: new Date().toISOString().split('T')[0],
    };

    if (editingId) {
      freshDb.templates = freshDb.templates.map((t) =>
        t.id === editingId ? { ...t, ...payload } : t
      );
    } else {
      payload.id = generateId('TMP', freshDb.templates);
      freshDb.templates = [...(freshDb.templates || []), payload];
    }

    setDB(freshDb);
    setModalOpen(false);
    triggerRefresh();
  };

  const handleDelete = (id) => {
    if (!confirm('Hapus template ini?')) return;
    const freshDb = getDB();
    const used = freshDb.pengajuan?.some((p) => p.templateId === id);
    if (used) {
      alert('Template masih digunakan oleh pengajuan dan tidak dapat dihapus.');
      return;
    }
    freshDb.templates = freshDb.templates.filter((t) => t.id !== id);
    setDB(freshDb);
    triggerRefresh();
  };

  const columns = [
    { key: 'id', label: 'ID', render: (r) => <span className="mono">{r.id}</span> },
    { key: 'namaTemplate', label: 'Nama Template' },
    { key: 'deskripsi', label: 'Deskripsi' },
    {
      key: 'fields',
      label: 'Jumlah Field',
      render: (r) => `${r.fields?.length || 0} field`,
    },
    {
      key: 'createdAt',
      label: 'Dibuat',
      render: (r) => formatDate(r.createdAt),
    },
    {
      key: 'action',
      label: 'Aksi',
      render: (r) => (
        <div className="action-group">
          <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)}>
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page" key={refresh}>
      <Card
        title="Kelola Template RAB"
        subtitle="Template menjadi form dinamis saat karyawan mengajukan anggaran"
        action={<Button onClick={openCreate}>+ Template Baru</Button>}
      >
        <Table columns={columns} data={templates} emptyMessage="Belum ada template" />

        <div className="template-info-box">
          <h4>💡 Konsep Template Dinamis</h4>
          <p>
            Setiap field yang Anda definisikan akan otomatis menjadi kolom form saat user
            membuat pengajuan. Field <strong>calculated</strong> menghitung otomatis
            (contoh formula: <code>jumlah * harga</code>).
          </p>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Template' : 'Template RAB Baru'}
        footer={
          <ModalActions
            onCancel={() => setModalOpen(false)}
            onConfirm={handleSave}
            confirmLabel="Simpan Template"
          />
        }
      >
        <div className="form-group">
          <label>Nama Template *</label>
          <input
            className="input"
            value={namaTemplate}
            onChange={(e) => setNamaTemplate(e.target.value)}
            placeholder="RAB Pengadaan Barang"
          />
        </div>
        <div className="form-group">
          <label>Deskripsi</label>
          <textarea
            className="input textarea"
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            rows={2}
          />
        </div>

        <div className="section-divider">
          <h3>Struktur Field</h3>
        </div>

        {fields.map((field, index) => (
          <div key={index} className="field-builder-row">
            <input
              className="input"
              placeholder="Label field"
              value={field.label}
              onChange={(e) => updateField(index, 'label', e.target.value)}
            />
            <select
              className="input select"
              value={field.type}
              onChange={(e) => updateField(index, 'type', e.target.value)}
            >
              {FIELD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {field.type === 'calculated' ? (
              <input
                className="input"
                placeholder="Formula: jumlah * harga"
                value={field.formula}
                onChange={(e) => updateField(index, 'formula', e.target.value)}
              />
            ) : (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(index, 'required', e.target.checked)}
                />
                Wajib
              </label>
            )}
            <button
              type="button"
              className="btn-icon btn-danger-icon"
              onClick={() => removeField(index)}
              disabled={fields.length <= 1}
            >
              −
            </button>
          </div>
        ))}

        <Button type="button" variant="secondary" size="sm" onClick={addField}>
          + Tambah Field
        </Button>
      </Modal>
    </div>
  );
}
