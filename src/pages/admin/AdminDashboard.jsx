import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import {
  getDB,
  getTemplateById,
  getUserById,
  formatCurrency,
  formatDate,
} from '../../utils/db';

export default function AdminDashboard() {
  const db = getDB();
  const pengajuan = db.pengajuan || [];

  const stats = useMemo(() => {
    const pending = pengajuan.filter((p) => p.status === 'pending').length;
    const approved = pengajuan.filter((p) => p.status === 'approved').length;
    const rejected = pengajuan.filter((p) => p.status === 'rejected').length;
    const totalValue = pengajuan.reduce((s, p) => s + (p.totalAnggaran || 0), 0);
    return { pending, approved, rejected, totalValue, count: pengajuan.length };
  }, [pengajuan]);

  const recent = useMemo(
    () =>
      [...pengajuan]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8),
    [pengajuan]
  );

  const columns = [
    { key: 'id', label: 'ID', render: (r) => <span className="mono">{r.id}</span> },
    {
      key: 'user',
      label: 'Karyawan',
      render: (r) => getUserById(r.userId)?.nama || r.userId,
    },
    {
      key: 'template',
      label: 'Template',
      render: (r) => getTemplateById(r.templateId)?.namaTemplate || '-',
    },
    {
      key: 'totalAnggaran',
      label: 'Total',
      render: (r) => formatCurrency(r.totalAnggaran),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <Badge status={r.status} />,
    },
    {
      key: 'action',
      label: '',
      render: (r) => (
        <Link to={`/admin/pengajuan/${r.id}`}>
          <Button size="sm" variant="secondary">
            Detail
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Semua Pengajuan</span>
          <span className="stat-value">{stats.count}</span>
        </div>
        <div className="stat-card stat-warning">
          <span className="stat-label">Pending</span>
          <span className="stat-value">{stats.pending}</span>
        </div>
        <div className="stat-card stat-success">
          <span className="stat-label">Approved</span>
          <span className="stat-value">{stats.approved}</span>
        </div>
        <div className="stat-card stat-danger">
          <span className="stat-label">Rejected</span>
          <span className="stat-value">{stats.rejected}</span>
        </div>
        <div className="stat-card stat-primary stat-wide">
          <span className="stat-label">Total Nilai Diajukan</span>
          <span className="stat-value stat-value-sm">{formatCurrency(stats.totalValue)}</span>
        </div>
      </div>

      <Card title="Pengajuan Terbaru" subtitle="Semua pengajuan dari seluruh karyawan">
        <Table
          columns={columns}
          data={recent}
          emptyMessage="Belum ada pengajuan masuk"
        />
        {pengajuan.length > 8 && (
          <div className="card-footer-link">
            <Link to="/admin/pengajuan">Lihat semua pengajuan →</Link>
          </div>
        )}
      </Card>
    </div>
  );
}
