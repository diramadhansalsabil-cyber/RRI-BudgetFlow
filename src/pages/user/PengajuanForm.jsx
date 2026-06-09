import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DynamicFormGenerator, {
  createInitialRows,
  prepareDataRAB,
} from '../../components/DynamicFormGenerator';
import { getDB, setDB, generateId, formatCurrency } from '../../utils/db';
import { filesToBase64List } from '../../utils/files';

export default function PengajuanForm({ user }) {
  const navigate = useNavigate();
  const db = getDB();
  const templates = db.templates || [];

  const [templateId, setTemplateId] = useState('');
  const [rows, setRows] = useState([]);
  const [bukti, setBukti] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId]
  );

  const handleTemplateChange = (id) => {
    setTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (tpl) {
      setRows(createInitialRows(tpl, 1));
    } else {
      setRows([]);
    }
  };

  const handleFileChange = async (e) => {
    const list = await filesToBase64List(e.target.files);
    setBukti((prev) => [...prev, ...list]);
  };

  const removeBukti = (index) => {
    setBukti((prev) => prev.filter((_, i) => i !== index));
  };

  const grandTotal = useMemo(() => {
    if (!selectedTemplate) return 0;
    const data = prepareDataRAB(rows, selectedTemplate);
    return data.reduce((s, item) => s + (item.total || 0), 0);
  }, [rows, selectedTemplate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedTemplate) {
      setError('Pilih template RAB terlebih dahulu');
      return;
    }

    const dataRAB = prepareDataRAB(rows, selectedTemplate);
    const hasEmpty = dataRAB.some((item) => {
      const keys = Object.keys(item).filter((k) => k !== 'total' && !k.includes('Total'));
      return keys.some((k) => item[k] === '' || item[k] === null || item[k] === undefined);
    });

    if (hasEmpty) {
      setError('Lengkapi semua field wajib pada setiap item RAB');
      return;
    }

    if (grandTotal <= 0) {
      setError('Total anggaran harus lebih dari 0');
      return;
    }

    setSubmitting(true);

    const freshDb = getDB();
    const pengajuan = {
      id: generateId('PGJ', freshDb.pengajuan),
      userId: user.id,
      templateId: selectedTemplate.id,
      dataRAB,
      totalAnggaran: grandTotal,
      tanggal: new Date().toISOString().split('T')[0],
      bukti,
      status: 'pending',
      pesanAdmin: '',
      approvedAmount: null,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: null,
    };

    freshDb.pengajuan = [...(freshDb.pengajuan || []), pengajuan];
    setDB(freshDb);
    navigate('/user');
  };

  return (
    <div className="page">
      <Card
        title="Form Pengajuan Anggaran"
        subtitle="Pilih template RAB — form akan dibuat otomatis dari struktur template"
      >
        <form onSubmit={handleSubmit} className="pengajuan-form">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="template">Template RAB *</label>
            <select
              id="template"
              className="input select"
              value={templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              required
            >
              <option value="">— Pilih Template —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.namaTemplate}
                </option>
              ))}
            </select>
            {selectedTemplate && (
              <p className="form-hint">{selectedTemplate.deskripsi}</p>
            )}
          </div>

          {selectedTemplate && (
            <>
              <div className="section-divider">
                <h3>Data RAB — {selectedTemplate.namaTemplate}</h3>
                <p>Form dinamis dari template. Tambah/hapus baris seperti Excel.</p>
              </div>

              <DynamicFormGenerator
                template={selectedTemplate}
                rows={rows}
                onChange={setRows}
              />

              <div className="section-divider">
                <h3>Upload Bukti Pendukung</h3>
                <p>Gambar akan dikonversi ke Base64 dan disimpan di localStorage</p>
              </div>

              <div className="upload-zone">
                <input
                  type="file"
                  id="bukti"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="upload-input"
                />
                <label htmlFor="bukti" className="upload-label">
                  <span className="upload-icon">📸</span>
                  <span>Klik atau seret gambar ke sini</span>
                  <span className="upload-hint">PNG, JPG — multiple file</span>
                </label>
              </div>

              {bukti.length > 0 && (
                <div className="bukti-preview-grid">
                  {bukti.map((src, i) => (
                    <div key={i} className="bukti-preview-item">
                      <img src={src} alt={`Bukti ${i + 1}`} />
                      <button
                        type="button"
                        className="bukti-remove"
                        onClick={() => removeBukti(i)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="submit-summary">
                <div>
                  <span>Total yang diajukan</span>
                  <strong>{formatCurrency(grandTotal)}</strong>
                </div>
                <div className="submit-actions">
                  <Button type="button" variant="ghost" onClick={() => navigate('/user')}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </form>
      </Card>
    </div>
  );
}
