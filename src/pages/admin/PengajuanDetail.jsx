import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal, { ModalActions } from '../../components/ui/Modal';
import {
  getDB,
  setDB,
  getTemplateById,
  getUserById,
  formatCurrency,
  formatDate,
  labelToKey,
} from '../../utils/db';

export default function PengajuanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const db = getDB();
  const pengajuan = db.pengajuan?.find((p) => p.id === id);

  const [modalType, setModalType] = useState(null);
  const [pesan, setPesan] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [saving, setSaving] = useState(false);

  if (!pengajuan) {
    return (
      <div className="page">
        <Card title="Pengajuan tidak ditemukan">
          <Link to="/admin/pengajuan">
            <Button variant="secondary">Kembali</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const template = getTemplateById(pengajuan.templateId);
  const user = getUserById(pengajuan.userId);

  const openApprove = () => {
    setPesan('');
    setApprovedAmount(String(pengajuan.totalAnggaran || ''));
    setModalType('approve');
  };

  const openReject = () => {
    setPesan('');
    setApprovedAmount('');
    setModalType('reject');
  };

  const handleSave = () => {
    if (!pesan.trim()) return;
    if (modalType === 'approve' && (!approvedAmount || Number(approvedAmount) < 0)) return;

    setSaving(true);
    const freshDb = getDB();
    const idx = freshDb.pengajuan.findIndex((p) => p.id === id);
    if (idx === -1) return;

    freshDb.pengajuan[idx] = {
      ...freshDb.pengajuan[idx],
      status: modalType === 'approve' ? 'approved' : 'rejected',
      pesanAdmin: pesan.trim(),
      approvedAmount: modalType === 'approve' ? Number(approvedAmount) : null,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setDB(freshDb);
    setModalType(null);
    setSaving(false);
    navigate('/admin/pengajuan', { replace: true });
  };

  const rabColumns = template?.fields?.map((f) => ({
    key: labelToKey(f.label),
    label: f.label,
    isCalc: f.type === 'calculated',
  })) || [];

  return (
    <div className="page">
      <div className="detail-header">
        <div>
          <Link to="/admin/pengajuan" className="back-link">← Kembali</Link>
          <h2 className="detail-title">{pengajuan.id}</h2>
          <Badge status={pengajuan.status} />
        </div>
        {pengajuan.status === 'pending' && (
          <div className="detail-actions">
            <Button variant="success" onClick={openApprove}>
              ✓ Setujui
            </Button>
            <Button variant="danger" onClick={openReject}>
              ✕ Tolak
            </Button>
          </div>
        )}
      </div>

      <div className="detail-grid">
        <Card title="Informasi Pengajuan">
          <dl className="detail-list">
            <div>
              <dt>Karyawan</dt>
              <dd>{user?.nama || pengajuan.userId}</dd>
            </div>
            <div>
              <dt>Template RAB</dt>
              <dd>{template?.namaTemplate || '-'}</dd>
            </div>
            <div>
              <dt>Tanggal</dt>
              <dd>{formatDate(pengajuan.tanggal || pengajuan.createdAt)}</dd>
            </div>
            <div>
              <dt>Total Diajukan</dt>
              <dd className="amount-highlight">{formatCurrency(pengajuan.totalAnggaran)}</dd>
            </div>
            {pengajuan.approvedAmount != null && (
              <div>
                <dt>Nominal Disetujui</dt>
                <dd className="amount-success">{formatCurrency(pengajuan.approvedAmount)}</dd>
              </div>
            )}
            {pengajuan.pesanAdmin && (
              <div>
                <dt>Pesan Admin</dt>
                <dd>{pengajuan.pesanAdmin}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card title="Bukti Pendukung">
          {pengajuan.bukti?.length ? (
            <div className="bukti-preview-grid">
              {pengajuan.bukti.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noreferrer" className="bukti-preview-item">
                  <img src={src} alt={`Bukti ${i + 1}`} />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-muted">Tidak ada bukti diunggah</p>
          )}
        </Card>
      </div>

      <Card title="Data RAB" subtitle="Detail item anggaran">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                {rabColumns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pengajuan.dataRAB?.map((row, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  {rabColumns.map((col) => (
                    <td key={col.key}>
                      {col.isCalc || col.key.includes('total') || col.key.includes('Total')
                        ? formatCurrency(row[col.key] ?? row.total)
                        : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={rabColumns.length + 1} className="text-right">
                  <strong>Total Keseluruhan</strong>
                </td>
                <td>
                  <strong>{formatCurrency(pengajuan.totalAnggaran)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Modal
        open={!!modalType}
        onClose={() => setModalType(null)}
        title={modalType === 'approve' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
        footer={
          <ModalActions
            onCancel={() => setModalType(null)}
            onConfirm={handleSave}
            confirmLabel={modalType === 'approve' ? 'Setujui' : 'Tolak'}
            confirmVariant={modalType === 'approve' ? 'success' : 'danger'}
            loading={saving}
          />
        }
      >
        {modalType === 'approve' && (
          <div className="form-group">
            <label htmlFor="approvedAmount">Nominal Disetujui (Rp) *</label>
            <input
              id="approvedAmount"
              type="number"
              className="input"
              value={approvedAmount}
              onChange={(e) => setApprovedAmount(e.target.value)}
              min={0}
              required
            />
            <p className="form-hint">
              Diajukan: {formatCurrency(pengajuan.totalAnggaran)}
            </p>
          </div>
        )}
        <div className="form-group">
          <label htmlFor="pesan">
            {modalType === 'approve' ? 'Pesan / Catatan *' : 'Alasan Penolakan *'}
          </label>
          <textarea
            id="pesan"
            className="input textarea"
            rows={4}
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            placeholder={
              modalType === 'approve'
                ? 'Contoh: Disetujui sebagian sesuai kebijakan...'
                : 'Jelaskan alasan penolakan...'
            }
            required
          />
        </div>
      </Modal>
    </div>
  );
}
