import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { getDB, getTemplateById, formatCurrency, formatDate } from '../../utils/db';

export default function UserDashboard({ user }) {
  const db = getDB();

  const myPengajuan = useMemo(
    () =>
      (db.pengajuan || [])
        .filter((p) => p.userId === user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [user.id, db.pengajuan]
  );

  const stats = useMemo(() => {
    const pending = myPengajuan.filter((p) => p.status === 'pending').length;
    const approved = myPengajuan.filter((p) => p.status === 'approved').length;
    const total = myPengajuan.reduce((s, p) => s + (p.totalAnggaran || 0), 0);
    return { pending, approved, total, count: myPengajuan.length };
  }, [myPengajuan]);

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (row) => <span className="mono">{row.id}</span>,
    },
    {
      key: 'template',
      label: 'Template RAB',
      render: (row) => getTemplateById(row.templateId)?.namaTemplate || '-',
    },
    {
      key: 'totalAnggaran',
      label: 'Total Anggaran',
      render: (row) => formatCurrency(row.totalAnggaran),
    },
    {
      key: 'tanggal',
      label: 'Tanggal',
      render: (row) => formatDate(row.tanggal || row.createdAt),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.status} />,
    },
    {
      key: 'pesanAdmin',
      label: 'Pesan Admin',
      render: (row) =>
        row.pesanAdmin ? (
          <span className="admin-message" title={row.pesanAdmin}>
            {row.pesanAdmin}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
  ];

  return (
    <div className="page">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Pengajuan</span>
          <span className="stat-value">{stats.count}</span>
        </div>
        <div className="stat-card stat-warning">
          <span className="stat-label">Menunggu</span>
          <span className="stat-value">{stats.pending}</span>
        </div>
        <div className="stat-card stat-success">
          <span className="stat-label">Disetujui</span>
          <span className="stat-value">{stats.approved}</span>
        </div>
        <div className="stat-card stat-primary">
          <span className="stat-label">Nilai Diajukan</span>
          <span className="stat-value stat-value-sm">{formatCurrency(stats.total)}</span>
        </div>
      </div>

      <Card
        title="Pengajuan Saya"
        subtitle="Daftar pengajuan anggaran berbasis template RAB"
        action={
          <Link to="/user/pengajuan/baru">
            <Button>+ Pengajuan Baru</Button>
          </Link>
        }
      >
        <Table
          columns={columns}
          data={myPengajuan}
          emptyMessage="Belum ada pengajuan. Buat pengajuan baru untuk memulai."
        />
      </Card>
    </div>
  );
}
