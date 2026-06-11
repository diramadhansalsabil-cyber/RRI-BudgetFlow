/** Backend lokal — localStorage (fallback tanpa Supabase) */

const LOCAL_DB_KEY = 'rri_budgetflow_v1';
const LOCAL_SESSION_KEY = 'rri_bf_session';

const LOCAL_USERS = {
  admin: { id: 'local-admin', username: 'admin', email: 'admin@rribudgetflow.test', nama: 'Administrator', role: 'admin', password: 'admin123' },
  user: { id: 'local-user', username: 'user', email: 'user@rribudgetflow.test', nama: 'Karyawan', role: 'user', password: 'user123' },
};

function localUuid() {
  return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function defaultLocalDb() {
  const now = new Date().toISOString();
  return {
    folders: [
      { id: localUuid(), nama: 'Template RAB Operasional', jenis: 'rab', created_by: LOCAL_USERS.admin.id, created_at: now, updated_at: null },
      { id: localUuid(), nama: 'Template RAB Kegiatan', jenis: 'rab', created_by: LOCAL_USERS.admin.id, created_at: now, updated_at: null },
      { id: localUuid(), nama: 'Template RAB Pengadaan Barang', jenis: 'rab', created_by: LOCAL_USERS.admin.id, created_at: now, updated_at: null },
      { id: localUuid(), nama: 'Template RAB Perjalanan Dinas', jenis: 'rab', created_by: LOCAL_USERS.admin.id, created_at: now, updated_at: null },
      { id: localUuid(), nama: 'Template Surat Pengajuan Anggaran', jenis: 'surat_pengajuan', created_by: LOCAL_USERS.admin.id, created_at: now, updated_at: null },
      { id: localUuid(), nama: 'Template Surat Pengajuan Kegiatan', jenis: 'surat_pengajuan', created_by: LOCAL_USERS.admin.id, created_at: now, updated_at: null },
    ],
    templateFiles: [],
    pengajuan: [],
    activityLogs: [],
    users: [],
  };
}

function localDbRead() {
  try {
    const raw = localStorage.getItem(LOCAL_DB_KEY);
    if (!raw) return defaultLocalDb();
    const parsed = JSON.parse(raw);
    return {
      ...defaultLocalDb(),
      ...parsed,
      folders: parsed.folders || defaultLocalDb().folders,
      users: parsed.users || [],
    };
  } catch {
    return defaultLocalDb();
  }
}

function localDbWrite(db) {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
}

function localDbInit() {
  if (!localStorage.getItem(LOCAL_DB_KEY)) localDbWrite(defaultLocalDb());
}

function localProfileFromUser(u) {
  return {
    id: u.id,
    username: u.username || '',
    email: u.email,
    nama: u.nama,
    noHp: u.no_hp || u.noHp || '',
    role: u.role,
    status: u.status || 'aktif',
    createdAt: u.created_at || u.createdAt,
    updatedAt: u.updated_at || u.updatedAt,
  };
}

function localResolveUser(input) {
  const raw = (input || '').trim().toLowerCase();
  if (!raw) return null;
  const db = localDbRead();
  if (raw.includes('@')) {
    const bootstrap = Object.values(LOCAL_USERS).find((u) => u.email === raw);
    if (bootstrap) return bootstrap;
    return db.users.find((u) => u.email === raw) || null;
  }
  if (LOCAL_USERS[raw]) return LOCAL_USERS[raw];
  return db.users.find((u) => (u.username || '').toLowerCase() === raw) || null;
}

async function localDbLogin(usernameOrEmail, password) {
  const user = localResolveUser(usernameOrEmail);
  if (!user) {
    return { ok: false, message: 'Email/username atau password salah.' };
  }
  if (user.status === 'nonaktif') {
    return { ok: false, message: 'Akun dinonaktifkan. Hubungi administrator.' };
  }

  let valid = false;
  if (user.passwordHash) {
    valid = await verifyPassword((password || '').trim(), user.passwordHash, user.passwordSalt);
  } else {
    valid = user.password === (password || '').trim();
  }

  if (!valid) {
    return { ok: false, message: 'Email/username atau password salah.' };
  }

  localStorage.setItem(LOCAL_SESSION_KEY, user.id);
  const profile = localProfileFromUser(user);
  localDbLog(profile, 'Login', profile.username || profile.email);
  return { ok: true, profile };
}

function localDbRestoreSession() {
  const uid = localStorage.getItem(LOCAL_SESSION_KEY);
  if (!uid) return null;
  const bootstrap = Object.values(LOCAL_USERS).find((u) => u.id === uid);
  if (bootstrap) return localProfileFromUser(bootstrap);
  const user = localDbRead().users.find((u) => u.id === uid);
  return user ? localProfileFromUser(user) : null;
}

function localDbCheckRegistrationAvailable(email, username) {
  const db = localDbRead();
  const em = (email || '').trim().toLowerCase();
  const un = (username || '').trim().toLowerCase();
  const emailTaken =
    Object.values(LOCAL_USERS).some((u) => u.email === em) || db.users.some((u) => u.email === em);
  const usernameTaken =
    un &&
    (Object.values(LOCAL_USERS).some((u) => (u.username || '').toLowerCase() === un) ||
      db.users.some((u) => (u.username || '').toLowerCase() === un));
  return {
    ok: !emailTaken && !usernameTaken,
    email_taken: emailTaken,
    username_taken: !!usernameTaken,
    message: emailTaken ? 'Email sudah terdaftar' : usernameTaken ? 'Username sudah digunakan' : 'Tersedia',
  };
}

async function localDbRegisterUser(payload) {
  const v = validateRegistrationForm(payload);
  if (!v.ok) throw new Error(v.message);

  const check = localDbCheckRegistrationAvailable(payload.email, payload.username);
  if (!check.ok) throw new Error(check.message);

  const email = payload.email.trim().toLowerCase();
  const username = (payload.username || '').trim() || email.split('@')[0];
  const isAdminPortal = payload.portal === 'admin';
  if (isAdminPortal && !validateAdminCode(payload.adminCode)) {
    throw new Error('Kode registrasi admin tidak valid');
  }
  const { hash, salt } = await hashPassword(payload.password);
  const now = new Date().toISOString();
  const row = {
    id: localUuid(),
    nama: payload.nama.trim(),
    email,
    username,
    no_hp: (payload.noHp || '').trim(),
    passwordHash: hash,
    passwordSalt: salt,
    role: isAdminPortal ? 'admin' : 'user',
    status: 'aktif',
    created_at: now,
    updated_at: now,
  };

  const db = localDbRead();
  db.users.push(row);
  localDbWrite(db);

  localStorage.setItem(LOCAL_SESSION_KEY, row.id);
  const profile = localProfileFromUser(row);
  localDbLog(profile, 'Registrasi Akun', profile.email);
  return { ok: true, profile, needsEmailConfirm: false };
}

function localDbUpdateOwnProfile(userId, { nama, noHp }) {
  const db = localDbRead();
  const bootstrap = Object.values(LOCAL_USERS).find((u) => u.id === userId);
  if (bootstrap) {
    bootstrap.nama = nama.trim();
    return localProfileFromUser(bootstrap);
  }
  const row = db.users.find((u) => u.id === userId);
  if (!row) throw new Error('Profil tidak ditemukan');
  row.nama = nama.trim();
  row.no_hp = (noHp || '').trim();
  row.updated_at = new Date().toISOString();
  localDbWrite(db);
  return localProfileFromUser(row);
}

function localDbUpdateOwnEmail(userId, email) {
  const em = email.trim().toLowerCase();
  const check = localDbCheckRegistrationAvailable(em, null);
  const db = localDbRead();
  const row = db.users.find((u) => u.id === userId);
  if (!row) throw new Error('Profil tidak ditemukan');
  if (check.email_taken && row.email !== em) throw new Error('Email sudah digunakan');
  row.email = em;
  row.updated_at = new Date().toISOString();
  localDbWrite(db);
  return localProfileFromUser(row);
}

async function localDbChangeOwnPassword(userId, newPassword) {
  const v = validatePassword(newPassword);
  if (!v.ok) throw new Error(v.message);
  const db = localDbRead();
  const row = db.users.find((u) => u.id === userId);
  if (!row) throw new Error('Profil tidak ditemukan');
  const { hash, salt } = await hashPassword(newPassword);
  row.passwordHash = hash;
  row.passwordSalt = salt;
  row.password = null;
  row.updated_at = new Date().toISOString();
  localDbWrite(db);
  return { ok: true };
}

function localDbLogout() {
  localStorage.removeItem(LOCAL_SESSION_KEY);
}

function localDbLog(session, aktivitas, detail = '', meta = {}) {
  const db = localDbRead();
  db.activityLogs.unshift({
    id: localUuid(),
    user_id: session.id,
    user_nama: session.nama,
    user_role: session.role,
    aktivitas,
    detail,
    meta,
    created_at: new Date().toISOString(),
  });
  if (db.activityLogs.length > 300) db.activityLogs.length = 300;
  localDbWrite(db);
}

async function localFileToDataUrl(file, maxMb) {
  if (file.size > maxMb * 1024 * 1024) throw new Error(`File maks ${maxMb} MB (mode lokal)`);
  return fileToBase64(file);
}

async function localDbUploadBuktiFiles(userId, files) {
  const urls = [];
  for (const f of files || []) {
    const v = validateBuktiFile(f);
    if (!v.ok) throw new Error(v.message);
    urls.push(await localFileToDataUrl(f, APP_LIMITS.MAX_BUKTI_MB));
  }
  return urls;
}

async function localDbUploadPengajuanFile(userId, file, subfolder = 'rab') {
  const allowed =
    subfolder === 'surat' ? APP_LIMITS.ALLOWED_SURAT_PENGAJUAN_EXT : APP_LIMITS.ALLOWED_PENGAJUAN_EXT;
  const v = validateUploadFile(file, allowed);
  if (!v.ok) throw new Error(v.message);
  const url = await localFileToDataUrl(file, APP_LIMITS.MAX_FILE_MB);
  return { path: `local/${userId}/${subfolder}/${file.name}`, url, ext: v.ext, size: file.size, name: file.name };
}

async function localDbUploadTemplateFile(folderId, file, session, allowedExt = null) {
  const v = validateUploadFile(file, allowedExt || getAllowedTemplateExtForFolder(folderId));
  if (!v.ok) throw new Error(v.message);
  const url = await localFileToDataUrl(file, APP_LIMITS.MAX_FILE_MB);
  const db = localDbRead();
  const row = {
    id: localUuid(),
    folder_id: folderId,
    nama_file: file.name,
    storage_path: `local/templates/${folderId}/${file.name}`,
    public_url: url,
    jenis_file: v.ext,
    ukuran_bytes: file.size,
    uploaded_by: session.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.templateFiles.unshift(row);
  localDbWrite(db);
  localDbLog(session, getTemplateLogAction(folderId, 'logUpload'), file.name);
  return templateFileFromRow(row);
}

function localDbFetchFolders() {
  return localDbRead().folders.map(folderFromRow).sort((a, b) => a.nama.localeCompare(b.nama));
}

function localDbFetchAllTemplateFiles() {
  return localDbRead().templateFiles.map(templateFileFromRow);
}

function localDbFetchProfiles() {
  const db = localDbRead();
  const bootstrap = Object.values(LOCAL_USERS).map((u) => localProfileFromUser(u));
  const registered = db.users.map((u) => localProfileFromUser(u));
  return [...bootstrap, ...registered].sort((a, b) => a.nama.localeCompare(b.nama));
}

function localDbFetchProfile(userId) {
  const u = Object.values(LOCAL_USERS).find((x) => x.id === userId);
  if (!u) throw new Error('Profil tidak ditemukan');
  return localProfileFromUser(u);
}

function localDbFetchActivityLogs(session, limit = 100) {
  let logs = localDbRead().activityLogs;
  if (session?.role !== 'admin') logs = logs.filter((l) => l.user_id === session.id);
  return logs.slice(0, limit).map(logFromRow);
}

function localDbClearActivityLogs() {
  const db = localDbRead();
  db.activityLogs = [];
  localDbWrite(db);
}

function localDbFetchPengajuan(session) {
  let rows = localDbRead().pengajuan;
  if (session?.role !== 'admin') rows = rows.filter((p) => p.user_id === session.id);
  return rows.map(pengajuanFromRow).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function localDbFetchPengajuanById(id) {
  const row = localDbRead().pengajuan.find((p) => p.id === id);
  return row ? pengajuanFromRow(row) : null;
}

function localDbCreateFolder(nama, session, jenis = 'rab') {
  const db = localDbRead();
  const row = { id: localUuid(), nama, jenis, created_by: session.id, created_at: new Date().toISOString(), updated_at: null };
  db.folders.push(row);
  localDbWrite(db);
  const kind = getTemplateKindByJenis(jenis);
  localDbLog(session, `Buat Folder ${kind.label}`, nama);
  return folderFromRow(row);
}

function localDbUpdateFolder(id, nama, session) {
  const db = localDbRead();
  const row = db.folders.find((f) => f.id === id);
  if (!row) throw new Error('Folder tidak ditemukan');
  row.nama = nama;
  row.updated_at = new Date().toISOString();
  localDbWrite(db);
  localDbLog(session, 'Edit Folder Template', nama);
  return folderFromRow(row);
}

function localDbDeleteFolder(id, session) {
  const db = localDbRead();
  db.folders = db.folders.filter((f) => f.id !== id);
  db.templateFiles = db.templateFiles.filter((f) => f.folder_id !== id);
  localDbWrite(db);
  localDbLog(session, 'Hapus Folder Template', id);
}

function localDbReplaceTemplateFile(fileId, file, session, allowedExt = null) {
  const db = localDbRead();
  const old = db.templateFiles.find((f) => f.id === fileId);
  if (!old) throw new Error('File tidak ditemukan');
  const v = validateUploadFile(file, allowedExt || getAllowedTemplateExtForFolder(old.folder_id));
  if (!v.ok) throw new Error(v.message);
  return localFileToDataUrl(file, APP_LIMITS.MAX_FILE_MB).then((url) => {
    old.nama_file = file.name;
    old.public_url = url;
    old.jenis_file = v.ext;
    old.ukuran_bytes = file.size;
    old.updated_at = new Date().toISOString();
    localDbWrite(db);
    localDbLog(session, getTemplateLogAction(old.folder_id, 'logReplace'), file.name);
    return templateFileFromRow(old);
  });
}

function localDbDeleteTemplateFile(fileId, session) {
  const db = localDbRead();
  const row = db.templateFiles.find((f) => f.id === fileId);
  db.templateFiles = db.templateFiles.filter((f) => f.id !== fileId);
  localDbWrite(db);
  localDbLog(session, 'Hapus File Template', row?.nama_file || fileId);
}

function localDbCreatePengajuan(payload, session) {
  const kode = normalizeKode(payload.kode);
  if (!kode) throw new Error('Nomor pengajuan wajib diisi');
  const db = localDbRead();
  if (db.pengajuan.some((p) => p.kode === kode)) {
    throw new Error(`Nomor pengajuan "${kode}" sudah digunakan.`);
  }
  const row = {
    id: localUuid(),
    kode,
    user_id: payload.userId,
    judul: payload.judul,
    nama_pengusul: (payload.namaPengusul || '').trim(),
    divisi: payload.divisi,
    bukti_urls: payload.buktiUrls || [],
    tanggal: payload.tanggal || todayISO(),
    file_name: payload.fileName || null,
    file_url: payload.fileUrl || null,
    storage_path: payload.storagePath || null,
    file_type: payload.fileType || null,
    file_size: payload.fileSize ?? null,
    surat_file_name: payload.suratFileName || null,
    surat_file_url: payload.suratFileUrl || null,
    surat_storage_path: payload.suratStoragePath || null,
    surat_file_type: payload.suratFileType || null,
    surat_file_size: payload.suratFileSize || null,
    status: 'pending',
    pesan_admin: '',
    tanggal_keputusan: null,
    created_at: new Date().toISOString(),
    updated_at: null,
  };
  db.pengajuan.unshift(row);
  localDbWrite(db);
  localDbLog(session, 'Buat Pengajuan Anggaran', kode);
  return pengajuanFromRow(row);
}

async function localDbUpdatePengajuanFile(id, session, meta = {}, files = {}) {
  const db = localDbRead();
  const row = db.pengajuan.find((p) => p.id === id && p.user_id === session.id);
  if (!row) throw new Error('Pengajuan tidak ditemukan');
  if (meta.judul != null) row.judul = meta.judul;
  if (meta.namaPengusul != null) row.nama_pengusul = meta.namaPengusul.trim();
  if (meta.divisi != null) row.divisi = meta.divisi;
  if (meta.tanggal != null) row.tanggal = meta.tanggal;
  if (meta.buktiUrls != null) row.bukti_urls = meta.buktiUrls;
  row.status = 'pending';
  if (files.rab) {
    const up = await localDbUploadPengajuanFile(session.id, files.rab);
    row.file_name = up.name;
    row.file_url = up.url;
    row.storage_path = up.path;
    row.file_type = up.ext;
    row.file_size = up.size;
  }
  if (files.surat) {
    const up = await localDbUploadPengajuanFile(session.id, files.surat, 'surat');
    row.surat_file_name = up.name;
    row.surat_file_url = up.url;
    row.surat_storage_path = up.path;
    row.surat_file_type = up.ext;
    row.surat_file_size = up.size;
  }
  row.updated_at = new Date().toISOString();
  localDbWrite(db);
  localDbLog(session, 'Edit Pengajuan / Upload Ulang RAB', row.kode);
  return pengajuanFromRow(row);
}

function localDbDeleteRiwayatPengajuan(id, session) {
  const db = localDbRead();
  const row = db.pengajuan.find((p) => p.id === id);
  if (!row || !isRiwayatStatus(row.status)) throw new Error('Pengajuan tidak dapat dihapus dari arsip');
  if (session.role !== 'admin' && row.user_id !== session.id) {
    throw new Error('Tidak memiliki akses menghapus arsip ini');
  }
  db.pengajuan = db.pengajuan.filter((p) => p.id !== id);
  localDbWrite(db);
  localDbLog(session, 'Hapus Arsip Riwayat', row.kode || id);
  return { ok: true, id };
}

function localDbClearRiwayatPengajuan(session, ids) {
  const db = localDbRead();
  const idSet = new Set(ids || []);
  const before = db.pengajuan.length;
  db.pengajuan = db.pengajuan.filter((p) => {
    if (!idSet.has(p.id)) return true;
    if (!isRiwayatStatus(p.status)) return true;
    if (session.role !== 'admin' && p.user_id !== session.id) return true;
    return false;
  });
  const removed = before - db.pengajuan.length;
  localDbWrite(db);
  if (removed) localDbLog(session, 'Bersihkan Arsip Riwayat', `${removed} pengajuan`);
  return { ok: true, count: removed };
}

function localDbUpdatePengajuanStatus(id, { status, pesanAdmin }, session) {
  const db = localDbRead();
  const row = db.pengajuan.find((p) => p.id === id);
  if (!row) throw new Error('Pengajuan tidak ditemukan');
  row.status = status;
  row.pesan_admin = pesanAdmin || '';
  row.tanggal_keputusan = status === 'pending' ? null : new Date().toISOString();
  row.updated_at = new Date().toISOString();
  localDbWrite(db);
  const actMap = { approved: 'Persetujuan Pengajuan', rejected: 'Penolakan Pengajuan', revisi: 'Permintaan Revisi Pengajuan' };
  localDbLog(session, actMap[status] || 'Update Status', row.kode);
  return pengajuanFromRow(row);
}
