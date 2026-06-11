const APP_LIMITS = {
  MAX_FILE_MB: 10,
  MAX_BUKTI_MB: 5,
  MAX_BUKTI_COUNT: 20,
  ALLOWED_TEMPLATE_EXT: ['pdf', 'xls', 'xlsx', 'doc', 'docx'],
  ALLOWED_SURAT_TEMPLATE_EXT: ['pdf', 'doc', 'docx'],
  ALLOWED_PENGAJUAN_EXT: ['pdf', 'xls', 'xlsx', 'doc', 'docx'],
  ALLOWED_SURAT_PENGAJUAN_EXT: ['pdf', 'doc', 'docx'],
  ALLOWED_BUKTI_EXT: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
};

const STORAGE_BUCKETS = {
  templates: 'rab-templates',
  pengajuan: 'rab-pengajuan',
  bukti: 'bukti',
};

const TEMPLATE_KINDS = {
  rab: {
    key: 'rab',
    jenis: 'rab',
    label: 'Template RAB',
    adminRoute: '/admin/templates',
    userRoute: '/user/templates',
    allowedExt: ['pdf', 'xls', 'xlsx', 'doc', 'docx'],
    accept: '.pdf,.xls,.xlsx,.doc,.docx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    adminTitle: 'Kelola Folder Template RAB',
    adminSubtitle: 'Buat kategori folder lalu unggah file RAB (PDF, Excel, atau Word)',
    userTitle: 'Unduh Template RAB',
    userSubtitle: 'Pilih folder kategori, lalu unduh template RAB (PDF, Excel, atau Word). Isi di luar aplikasi.',
    folderPlaceholder: 'Template RAB Operasional',
    emptyAdmin: 'Belum ada folder. Klik tombol tambah.',
    emptyUser: 'Belum ada folder template dari Admin.',
    logUpload: 'Upload Template RAB',
    logReplace: 'Ganti File Template RAB',
    logDownload: 'Download Template RAB',
    fileTypes: 'PDF, XLS, XLSX, DOC, DOCX',
  },
  surat: {
    key: 'surat',
    jenis: 'surat_pengajuan',
    label: 'Template Surat Pengajuan',
    adminRoute: '/admin/templates-surat',
    userRoute: '/user/templates-surat',
    allowedExt: ['pdf', 'doc', 'docx'],
    accept: '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    adminTitle: 'Kelola Template Surat Pengajuan',
    adminSubtitle: 'Buat folder kategori lalu unggah file surat pengajuan (Word/PDF)',
    userTitle: 'Unduh Template Surat Pengajuan',
    userSubtitle: 'Pilih folder, unduh template surat, lalu isi sesuai kebutuhan',
    folderPlaceholder: 'Template Surat Pengajuan Anggaran',
    emptyAdmin: 'Belum ada folder surat. Klik tombol tambah.',
    emptyUser: 'Belum ada template surat dari Admin.',
    logUpload: 'Upload Template Surat Pengajuan',
    logReplace: 'Ganti File Template Surat Pengajuan',
    logDownload: 'Download Template Surat Pengajuan',
    fileTypes: 'PDF, DOC, DOCX',
  },
};

function getTemplateKind(key) {
  return TEMPLATE_KINDS[key] || TEMPLATE_KINDS.rab;
}

function getTemplateKindByJenis(jenis) {
  return jenis === 'surat_pengajuan' ? TEMPLATE_KINDS.surat : TEMPLATE_KINDS.rab;
}

const AUTH_PORTALS = {
  karyawan: {
    key: 'karyawan',
    role: 'user',
    loginRoute: '/login/karyawan',
    loginTitle: 'Portal Karyawan',
    loginSubtitle: 'Masuk untuk pengajuan anggaran',
    dashboardHash: '#/user',
  },
  admin: {
    key: 'admin',
    role: 'admin',
    loginRoute: '/login/admin',
    loginTitle: 'Portal Administrator',
    loginSubtitle: 'Masuk ke panel administrasi',
    dashboardHash: '#/admin',
  },
};

function getAuthPortal(key) {
  return AUTH_PORTALS[key] || AUTH_PORTALS.karyawan;
}

function getAdminRegistrationCode() {
  return (window.APP_CONFIG?.ADMIN_REGISTRATION_CODE || '').trim();
}

function validateAdminCode(code) {
  const secret = getAdminRegistrationCode();
  return !!secret && (code || '').trim() === secret;
}
