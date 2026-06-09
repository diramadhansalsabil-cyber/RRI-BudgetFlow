const STATUS_MAP = {
  pending: { label: 'Menunggu', className: 'badge-pending' },
  approved: { label: 'Disetujui', className: 'badge-approved' },
  rejected: { label: 'Ditolak', className: 'badge-rejected' },
};

export default function Badge({ status }) {
  const config = STATUS_MAP[status] || { label: status, className: 'badge-default' };
  return <span className={`badge ${config.className}`}>{config.label}</span>;
}
