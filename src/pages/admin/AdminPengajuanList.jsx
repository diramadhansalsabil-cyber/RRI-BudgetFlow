import { useMemo, useState } from 'react';
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

export default function AdminPengajuanList() {
  const db = getDB();
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    let list = [...(db.pengajuan || [])];
    if (filter !== 'all') {
      list = list.filter((p) => p.status === filter);
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [db.pengajuan, filter]);

  const columns = [
    { key: 'id', label: 'ID', render: (r) => <span className="mono">{r.id}</span> },
    {
      key: 'user',
      label: 'Karyawan',
      render: (r) => getUserById(r.userId)?.nama || '-',
    },
    {
      key: 'template',
      label: 'Template RAB',
      render: (r) => getTemplateById(r.templateId)?.namaTemplate || '-',
    },
    {
      key: 'totalAnggaran',
      label: 'Total Anggaran',
      render: (r) => formatCurrency(r.totalAnggaran),
    },
    {
      key: 'createdAt',
      label: 'Tanggal',
      render: (r) => formatDate(r.tanggal || r.createdAt),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <Badge status={r.status} />,
    },
    {
      key: 'approvedAmount',
      label: 'Disetujui',
      render: (r) =>
        r.approvedAmount != null ? formatCurrency(r.approvedAmount) : '—',
    },
    {
      key: 'action',
      label: 'Aksi',
      render: (r) => (
        <Link to={`/admin/pengajuan/${r.id}`}>
          <Button size="sm">Review</Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="page">
      <Card title="Semua Pengajuan" subtitle="Verifikasi dan persetujuan anggaran">
        <div className="filter-tabs">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Disetujui' },
            { key: 'rejected', label: 'Ditolak' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`filter-tab ${filter === tab.key ? 'filter-tab-active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Table columns={columns} data={filtered} emptyMessage="Tidak ada pengajuan" />
      </Card>
    </div>
  );
}
