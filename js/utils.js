function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return formatDate(dateStr);
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function badgeStatus(status) {
  const map = {
    pending: { label: 'Menunggu Persetujuan', cls: 'badge-pending', ic: 'pending' },
    approved: { label: 'Disetujui', cls: 'badge-approved', ic: 'approved' },
    rejected: { label: 'Ditolak', cls: 'badge-rejected', ic: 'rejected' },
    revisi: { label: 'Revisi', cls: 'badge-warning', ic: 'edit' },
  };
  const c = map[status] || { label: status, cls: 'badge-default', ic: 'info' };
  return `<span class="badge ${c.cls}">${icon(c.ic, 12)} ${c.label}</span>`;
}

function formatFileSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function normalizeEmailInput(email) {
  return (email || '')
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .toLowerCase();
}

function validateEmail(email) {
  const v = normalizeEmailInput(email);
  if (!v) return false;
  if (v.length > 254) return false;
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(v);
}

function getEmailDomainIssue(email) {
  const v = normalizeEmailInput(email);
  const domain = v.split('@')[1] || '';
  if (!domain) return 'Format email tidak valid';
  if (domain.endsWith('.local')) {
    return 'Domain .local ditolak Supabase. Gunakan Gmail atau email kerja yang valid.';
  }
  if (domain.endsWith('.test') || domain.endsWith('.invalid') || domain.endsWith('.example')) {
    return 'Domain uji (.test) ditolak Supabase. Gunakan Gmail asli, misalnya nama@gmail.com.';
  }
  return '';
}

function mapAuthError(errOrJson, fallback = '') {
  const code =
    errOrJson?.error_code ||
    errOrJson?.code ||
    errOrJson?.error ||
    '';
  const msg = (
    errOrJson?.error_description ||
    errOrJson?.msg ||
    errOrJson?.message ||
    fallback ||
    ''
  ).toLowerCase();

  if (code === 'email_address_not_authorized' || msg.includes('not authorized')) {
    return 'Email tidak diizinkan oleh Supabase. Matikan "Confirm email" di Authentication → Providers → Email, atau pasang SMTP kustom (Resend/SendGrid).';
  }
  if (code === 'email_exists' || msg.includes('already registered') || msg.includes('already exists')) {
    return 'Email sudah terdaftar. Silakan login.';
  }
  if (
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit' ||
    code === '429' ||
    msg.includes('rate limit exceeded') ||
    msg.includes('too many requests')
  ) {
    return 'Batas daftar sementara (Supabase ±3 email/jam). Developer: matikan Confirm email di Authentication → Providers → Email, tunggu ±1 jam, lalu coba daftar lagi. Jika sudah pernah daftar, langsung login.';
  }
  if (code === 'email_address_invalid' || (msg.includes('email address') && msg.includes('invalid'))) {
    return 'Email ditolak Supabase. Gunakan Gmail asli (nama@gmail.com), bukan domain .test/.local. Pastikan Signup ON dan Allowed email domains kosong.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Email belum dikonfirmasi. Cek inbox atau minta admin konfirmasi akun di Supabase.';
  }
  if (msg.includes('invalid') && (msg.includes('credentials') || msg.includes('password'))) {
    return 'Email/username atau password salah.';
  }
  if (msg.includes('signup') && msg.includes('disabled')) {
    return 'Registrasi dinonaktifkan di Supabase. Aktifkan di Authentication → Providers → Email.';
  }
  return errOrJson?.error_description || errOrJson?.message || fallback || 'Terjadi kesalahan autentikasi';
}

function validatePassword(password) {
  const p = password || '';
  if (p.length < 6) return { ok: false, message: 'Password minimal 6 karakter' };
  return { ok: true };
}

function validateRegistrationForm(data) {
  const nama = (data?.nama || '').trim();
  const email = normalizeEmailInput(data?.email);
  const password = data?.password || '';
  const portal = data?.portal || 'karyawan';
  const adminCode = (data?.adminCode || '').trim();

  if (!nama || nama.length < 2) return { ok: false, message: 'Nama wajib diisi (min. 2 karakter)' };
  if (!validateEmail(email)) return { ok: false, message: 'Format email tidak valid' };
  const domainIssue = getEmailDomainIssue(email);
  if (domainIssue) return { ok: false, message: domainIssue };
  const pw = validatePassword(password);
  if (!pw.ok) return pw;
  if (portal === 'admin') {
    if (!adminCode) return { ok: false, message: 'Kode registrasi admin wajib diisi' };
    if (!validateAdminCode(adminCode)) return { ok: false, message: 'Kode registrasi admin tidak valid' };
  }
  const username = email.split('@')[0] || 'user';
  return { ok: true, data: { nama, email, username, noHp: '', password, portal, adminCode } };
}

function fileTypeLabel(ext) {
  const m = {
    pdf: 'PDF',
    xls: 'Excel (.xls)',
    xlsx: 'Excel (.xlsx)',
    doc: 'Word (.doc)',
    docx: 'Word (.docx)',
  };
  return m[ext] || (ext || '-').toUpperCase();
}

function downloadLink(url, label, logFn) {
  return `<a href="${url}" target="_blank" rel="noreferrer" class="btn btn-secondary btn-sm" ${logFn ? `data-dl-log="${escapeHtml(logFn)}"` : ''} download>${icon('document', 14)} ${escapeHtml(label)}</a>`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function filesToBase64List(fileList) {
  return Promise.all(Array.from(fileList || []).map(fileToBase64));
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function showToast(message, type = 'success') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  const iconName = type === 'success' ? 'approved' : type === 'error' ? 'rejected' : 'info';
  el.innerHTML = `${icon(iconName, 18)}<span>${escapeHtml(message)}</span>`;
  root.appendChild(el);
  setTimeout(() => {
    el.classList.add('toast-out');
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

function validateRABRows(rows, template) {
  const fields = template.fields.filter((f) => f.type !== 'calculated' && f.required);
  const fieldKeys = buildFieldKeys(template.fields);
  for (let i = 0; i < rows.length; i++) {
    const row = computeRow(rows[i], template.fields, fieldKeys);
    for (const f of fields) {
      const key = fieldKeys[f.label];
      const val = row[key];
      if (val === '' || val === null || val === undefined) {
        return { ok: false, message: `Baris ${i + 1}: "${f.label}" wajib diisi` };
      }
      if (f.type === 'number' && (Number(val) <= 0 || Number.isNaN(Number(val)))) {
        return { ok: false, message: `Baris ${i + 1}: "${f.label}" harus angka lebih dari 0` };
      }
    }
  }
  return { ok: true };
}
