/** Supabase API — workflow dokumen RRI BudgetFlow */

function profileFromRow(row) {
  return {
    id: row.id,
    username: row.username || '',
    email: row.email,
    nama: row.nama,
    noHp: row.no_hp || '',
    role: row.role,
    status: row.status || 'aktif',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function folderFromRow(row) {
  return {
    id: row.id,
    nama: row.nama,
    jenis: row.jenis || 'rab',
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getAllowedTemplateExtForFolder(folderId) {
  const folder = typeof getFolderById === 'function' ? getFolderById(folderId) : null;
  const kind = getTemplateKindByJenis(folder?.jenis);
  return kind.allowedExt;
}

function getTemplateLogAction(folderId, action) {
  const folder = typeof getFolderById === 'function' ? getFolderById(folderId) : null;
  const kind = getTemplateKindByJenis(folder?.jenis);
  return kind[action] || action;
}

function templateFileFromRow(row) {
  return {
    id: row.id,
    folderId: row.folder_id,
    namaFile: row.nama_file,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    jenisFile: row.jenis_file,
    ukuranBytes: Number(row.ukuran_bytes) || 0,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function pengajuanFromRow(row) {
  return {
    id: row.id,
    kode: row.kode,
    userId: row.user_id,
    judul: row.judul || '',
    namaPengusul: row.nama_pengusul || '',
    divisi: row.divisi || '',
    keterangan: row.keterangan || '',
    bukti: row.bukti_urls || [],
    tanggal: row.tanggal,
    fileName: row.file_name,
    fileUrl: row.file_url,
    storagePath: row.storage_path,
    fileType: row.file_type,
    fileSize: Number(row.file_size) || 0,
    suratFileName: row.surat_file_name || '',
    suratFileUrl: row.surat_file_url || '',
    suratStoragePath: row.surat_storage_path || '',
    suratFileType: row.surat_file_type || '',
    suratFileSize: Number(row.surat_file_size) || 0,
    status: row.status,
    pesanAdmin: row.pesan_admin || '',
    tanggalKeputusan: row.tanggal_keputusan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function logFromRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userNama: row.user_nama,
    userRole: row.user_role,
    aktivitas: row.aktivitas,
    detail: row.detail || '',
    meta: row.meta || {},
    createdAt: row.created_at,
  };
}

function displayPengajuanId(p) {
  return p.kode || (p.id ? String(p.id).slice(0, 8) : '-');
}

const DEMO_LOGIN_EMAILS = {
  admin: 'admin@rribudgetflow.test',
  user: 'user@rribudgetflow.test',
};

function getFileExt(name) {
  const m = (name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

function validateUploadFile(file, allowedExt, maxMb = APP_LIMITS.MAX_FILE_MB) {
  const ext = getFileExt(file.name);
  if (!allowedExt.includes(ext)) {
    return { ok: false, message: `Format .${ext || '?'} tidak diizinkan. Gunakan: ${allowedExt.join(', ')}` };
  }
  const max = maxMb * 1024 * 1024;
  if (file.size > max) {
    return { ok: false, message: `Ukuran file maks ${maxMb} MB` };
  }
  return { ok: true, ext };
}

function validateBuktiFile(file) {
  return validateUploadFile(file, APP_LIMITS.ALLOWED_BUKTI_EXT, APP_LIMITS.MAX_BUKTI_MB);
}

async function apiUploadBuktiFiles(userId, files) {
  if (isLocalMode()) return localDbUploadBuktiFiles(userId, files);
  if (!files?.length) return [];
  const sb = getSupabase();
  const urls = [];
  for (const file of files) {
    const v = validateBuktiFile(file);
    if (!v.ok) throw new Error(v.message);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const { error } = await sb.storage.from(STORAGE_BUCKETS.bukti).upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = sb.storage.from(STORAGE_BUCKETS.bukti).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

async function apiGetLoginEmail(username) {
  const sb = getSupabase();
  const { data, error } = await sb.rpc('get_login_email', { p_username: username });
  if (error) throw error;
  return data;
}

function raceTimeout(promise, ms, message) {
  const msg = message || 'Koneksi waktu habis — periksa internet atau status project Supabase.';
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ]);
}

async function apiResolveLoginEmail(input) {
  const raw = (input || '').trim();
  if (!raw) return null;
  if (raw.includes('@')) return normalizeEmailInput(raw);
  const key = raw.toLowerCase();
  if (isLocalMode()) return LOCAL_USERS[key]?.email || null;
  if (DEMO_LOGIN_EMAILS[key]) return DEMO_LOGIN_EMAILS[key];
  try {
    const email = await raceTimeout(apiGetLoginEmail(key), 2500);
    if (email) return email;
  } catch (e) {
    console.warn('get_login_email:', e);
  }
  return null;
}

async function apiFetchProfileWithToken(userId, token, timeoutMs = 10000) {
  const { url, key } = getSupabaseConfig();
  const res = await fetchWithTimeout(
    `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=*`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.pgrst.object+json',
      },
    },
    timeoutMs
  );
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(errBody.message || `Profil gagal dimuat (HTTP ${res.status})`);
    err.status = res.status;
    throw err;
  }
  const row = await res.json();
  return profileFromRow(row);
}

async function apiSyncProfileWithToken(token, timeoutMs = 10000) {
  const { url, key } = getSupabaseConfig();
  const res = await fetchWithTimeout(
    `${url}/rest/v1/rpc/sync_profile_for_auth`,
    {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    },
    timeoutMs
  );
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Sinkron profil gagal (HTTP ${res.status})`);
  }
  const data = await res.json();
  const row = typeof data === 'string' ? JSON.parse(data) : data;
  return profileFromRow(row);
}

function profileFromAuthUser(user) {
  const meta = user?.user_metadata || {};
  const email = (user?.email || '').toLowerCase();
  const metaRole = (meta.role || '').toLowerCase();
  const isAdmin =
    metaRole === 'admin' ||
    (meta.portal === 'admin' &&
      typeof validateAdminCode === 'function' &&
      validateAdminCode((meta.admin_code || '').trim()));
  return {
    id: user.id,
    username: meta.username || splitEmailUsername(email),
    email,
    nama: meta.nama || meta.full_name || 'Pengguna',
    noHp: meta.no_hp || '',
    role: isAdmin ? 'admin' : 'user',
    status: 'aktif',
  };
}

async function resolveProfileAfterRegister(authResult) {
  const userId = authResult?.user?.id;
  const token = authResult?.access_token;
  if (!userId) return null;

  const attempts = [
    async () => {
      if (!token) return null;
      return apiFetchProfileWithToken(userId, token, 10000);
    },
    async () => {
      if (!token) return null;
      return apiSyncProfileWithToken(token, 10000);
    },
    async () => {
      await new Promise((r) => setTimeout(r, 600));
      const sb = getSupabase();
      const { data } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
      return data ? profileFromRow(data) : null;
    },
  ];

  for (const attempt of attempts) {
    try {
      const profile = await attempt();
      if (profile?.id) return profile;
    } catch (e) {
      console.warn('resolveProfileAfterRegister:', e);
    }
  }

  return profileFromAuthUser(authResult.user);
}

function splitEmailUsername(email) {
  return (email || '').split('@')[0] || 'user';
}

async function apiFetchProfile(userId, timeoutMs = 10000) {
  if (isLocalMode()) return localDbFetchProfile(userId);
  const token = getAccessToken();
  if (token) {
    try {
      return await apiFetchProfileWithToken(userId, token, timeoutMs);
    } catch (e) {
      console.warn('apiFetchProfileWithToken:', e);
      if (e.status !== 404 && e.status !== 406) throw e;
    }
  }
  const sb = getSupabase();
  const fetchProfile = sb.from('profiles').select('*').eq('id', userId).single();
  const { data, error } = timeoutMs ? await raceTimeout(fetchProfile, timeoutMs) : await fetchProfile;
  if (error) throw error;
  return profileFromRow(data);
}

async function apiSyncProfileForAuth() {
  const sb = getSupabase();
  const { data, error } = await sb.rpc('sync_profile_for_auth');
  if (error) throw error;
  if (!data) throw new Error('Profil tidak dapat disinkronkan');
  return profileFromRow(typeof data === 'string' ? JSON.parse(data) : data);
}

async function apiFetchProfiles() {
  if (isLocalMode()) return localDbFetchProfiles();
  const sb = getSupabase();
  const { data, error } = await sb.from('profiles').select('*').order('nama');
  if (error) throw error;
  return (data || []).map(profileFromRow);
}

async function apiCheckRegistrationAvailable(email, username) {
  if (isLocalMode()) return localDbCheckRegistrationAvailable(email, username);
  const sb = getSupabase();
  const { data, error } = await sb.rpc('check_registration_available', {
    p_email: email,
    p_username: username || null,
  });
  if (error) throw error;
  return typeof data === 'string' ? JSON.parse(data) : data;
}

async function apiRegisterUser(payload) {
  const v = validateRegistrationForm(payload);
  if (!v.ok) throw new Error(v.message);

  if (isLocalMode()) return localDbRegisterUser(payload);

  const check = await apiCheckRegistrationAvailable(payload.email, payload.username);
  if (!check?.ok) throw new Error(check?.message || 'Email atau username sudah digunakan');

  const email = normalizeEmailInput(payload.email);
  if (!validateEmail(email)) throw new Error('Format email tidak valid');
  const username = (payload.username || '').trim() || splitEmailUsername(email);
  const isAdminPortal = payload.portal === 'admin';
  const adminCode = (payload.adminCode || '').trim();

  if (isAdminPortal && !validateAdminCode(adminCode)) {
    throw new Error('Kode registrasi admin tidak valid');
  }

  const authResult = await authSignupDirect(email, payload.password, {
    nama: payload.nama.trim(),
    username,
    no_hp: (payload.noHp || '').trim(),
    portal: payload.portal || 'karyawan',
    role: isAdminPortal ? 'admin' : 'user',
    admin_code: isAdminPortal ? adminCode : '',
  });

  if (!authResult?.user?.id) {
    throw new Error('Registrasi gagal — coba lagi atau hubungi admin');
  }

  let profile = await resolveProfileAfterRegister(authResult);

  return { ok: true, profile, needsEmailConfirm: !authResult.access_token };
}

async function apiUpdateOwnProfile(session, { nama, noHp }) {
  if (!session?.id) throw new Error('Session tidak valid');
  if (isLocalMode()) return localDbUpdateOwnProfile(session.id, { nama, noHp });

  const sb = getSupabase();
  const { data, error } = await sb.rpc('update_own_profile', {
    p_nama: nama.trim(),
    p_no_hp: (noHp || '').trim(),
  });
  if (error) throw error;
  const row = typeof data === 'string' ? JSON.parse(data) : data;
  const profile = profileFromRow(row);
  await apiLogActivity(session, 'Update Profil', profile.nama);
  return profile;
}

async function apiUpdateOwnEmail(session, newEmail) {
  const email = normalizeEmailInput(newEmail);
  if (!validateEmail(email)) throw new Error('Format email tidak valid');
  if (isLocalMode()) return localDbUpdateOwnEmail(session.id, email);

  const check = await apiCheckRegistrationAvailable(email, null);
  if (check?.email_taken && email !== session.email) {
    throw new Error('Email sudah digunakan akun lain');
  }

  const sb = getSupabase();
  const { data, error } = await sb.auth.updateUser({ email });
  if (error) throw error;
  const { data: profRow, error: profErr } = await sb
    .from('profiles')
    .update({ email, updated_at: new Date().toISOString() })
    .eq('id', session.id)
    .select()
    .single();
  if (profErr) console.warn('update profile email:', profErr);
  await apiLogActivity(session, 'Update Email', email);
  return profRow ? profileFromRow(profRow) : { ...session, email };
}

async function apiChangeOwnPassword(newPassword) {
  const v = validatePassword(newPassword);
  if (!v.ok) throw new Error(v.message);
  if (isLocalMode()) return localDbChangeOwnPassword(getSession()?.id, newPassword);

  const sb = getSupabase();
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return { ok: true };
}

async function apiLogActivity(session, aktivitas, detail = '', meta = {}) {
  if (!session) return;
  if (isLocalMode()) return localDbLog(session, aktivitas, detail, meta);
  const sb = getSupabase();
  await sb.from('activity_logs').insert({
    user_id: session.id,
    user_nama: session.nama || '',
    user_role: session.role || '',
    aktivitas,
    detail,
    meta,
  });
}

async function apiFetchActivityLogs(session, limit = 100) {
  if (isLocalMode()) return localDbFetchActivityLogs(session, limit);
  const sb = getSupabase();
  let q = sb.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(limit);
  if (session?.role !== 'admin') q = q.eq('user_id', session.id);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(logFromRow);
}

async function apiClearActivityLogs(session) {
  if (!session || session.role !== 'admin') {
    throw new Error('Hanya admin yang dapat menghapus log aktivitas');
  }
  if (isLocalMode()) {
    localDbClearActivityLogs();
    return;
  }
  const sb = getSupabase();
  const { error } = await sb.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

async function apiFetchFolders() {
  if (isLocalMode()) return localDbFetchFolders();
  const sb = getSupabase();
  const { data, error } = await sb.from('template_folders').select('*').order('nama');
  if (error) throw error;
  return (data || []).map(folderFromRow);
}

async function apiCreateFolder(nama, session, jenis = 'rab') {
  if (isLocalMode()) return localDbCreateFolder(nama, session, jenis);
  const sb = getSupabase();
  const { data, error } = await sb
    .from('template_folders')
    .insert({ nama, jenis, created_by: session.id, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  const kind = getTemplateKindByJenis(jenis);
  await apiLogActivity(session, `Buat Folder ${kind.label}`, nama);
  return folderFromRow(data);
}

async function apiUpdateFolder(id, nama, session) {
  if (isLocalMode()) return localDbUpdateFolder(id, nama, session);
  const sb = getSupabase();
  const { data, error } = await sb
    .from('template_folders')
    .update({ nama, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  await apiLogActivity(session, 'Edit Folder Template', nama);
  return folderFromRow(data);
}

async function apiDeleteFolder(id, session) {
  if (isLocalMode()) return localDbDeleteFolder(id, session);
  const sb = getSupabase();
  const { error } = await sb.from('template_folders').delete().eq('id', id);
  if (error) throw error;
  await apiLogActivity(session, 'Hapus Folder Template', id);
}

async function apiFetchTemplateFiles(folderId) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('template_files')
    .select('*')
    .eq('folder_id', folderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(templateFileFromRow);
}

async function apiFetchAllTemplateFiles() {
  if (isLocalMode()) return localDbFetchAllTemplateFiles();
  const sb = getSupabase();
  const { data, error } = await sb.from('template_files').select('*');
  if (error) throw error;
  return (data || []).map(templateFileFromRow);
}

async function apiUploadTemplateFile(folderId, file, session) {
  if (isLocalMode()) return localDbUploadTemplateFile(folderId, file, session);
  const v = validateUploadFile(file, getAllowedTemplateExtForFolder(folderId));
  if (!v.ok) throw new Error(v.message);
  const sb = getSupabase();
  const path = `${folderId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error: upErr } = await sb.storage.from(STORAGE_BUCKETS.templates).upload(path, file, { upsert: false });
  if (upErr) throw upErr;
  const { data: urlData } = sb.storage.from(STORAGE_BUCKETS.templates).getPublicUrl(path);
  const { data, error } = await sb
    .from('template_files')
    .insert({
      folder_id: folderId,
      nama_file: file.name,
      storage_path: path,
      public_url: urlData.publicUrl,
      jenis_file: v.ext,
      ukuran_bytes: file.size,
      uploaded_by: session.id,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  await apiLogActivity(session, getTemplateLogAction(folderId, 'logUpload'), file.name, { folderId });
  return templateFileFromRow(data);
}

async function apiReplaceTemplateFile(fileId, file, session) {
  if (isLocalMode()) return localDbReplaceTemplateFile(fileId, file, session);
  const sb = getSupabase();
  const { data: old, error: oldErr } = await sb.from('template_files').select('*').eq('id', fileId).single();
  if (oldErr) throw oldErr;
  const v = validateUploadFile(file, getAllowedTemplateExtForFolder(old.folder_id));
  if (!v.ok) throw new Error(v.message);
  const path = `${old.folder_id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error: upErr } = await sb.storage.from(STORAGE_BUCKETS.templates).upload(path, file, { upsert: false });
  if (upErr) throw upErr;
  const { data: urlData } = sb.storage.from(STORAGE_BUCKETS.templates).getPublicUrl(path);
  const { data, error } = await sb
    .from('template_files')
    .update({
      nama_file: file.name,
      storage_path: path,
      public_url: urlData.publicUrl,
      jenis_file: v.ext,
      ukuran_bytes: file.size,
      uploaded_by: session.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId)
    .select()
    .single();
  if (error) throw error;
  await apiLogActivity(session, getTemplateLogAction(old.folder_id, 'logReplace'), file.name, { fileId });
  return templateFileFromRow(data);
}

async function apiDeleteTemplateFile(fileId, session) {
  if (isLocalMode()) return localDbDeleteTemplateFile(fileId, session);
  const sb = getSupabase();
  const { data: row } = await sb.from('template_files').select('nama_file').eq('id', fileId).single();
  const { error } = await sb.from('template_files').delete().eq('id', fileId);
  if (error) throw error;
  await apiLogActivity(session, 'Hapus File Template', row?.nama_file || fileId);
}

async function apiFetchPengajuan(session) {
  if (isLocalMode()) return localDbFetchPengajuan(session);
  const sb = getSupabase();
  let q = sb.from('pengajuan').select('*').order('created_at', { ascending: false });
  if (session?.role !== 'admin') q = q.eq('user_id', session.id);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(pengajuanFromRow);
}

function isValidUuid(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || ''));
}

function isLegacyLocalId(id) {
  return String(id || '').startsWith('loc-');
}

async function apiFetchPengajuanById(id) {
  if (isLocalMode()) return localDbFetchPengajuanById(id);
  if (!isValidUuid(id) || isLegacyLocalId(id)) return null;
  const sb = getSupabase();
  const { data, error } = await sb.from('pengajuan').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? pengajuanFromRow(data) : null;
}

function normalizeKode(raw) {
  return String(raw || '').trim();
}

async function apiUploadPengajuanFile(userId, file, subfolder = 'rab') {
  if (isLocalMode()) return localDbUploadPengajuanFile(userId, file, subfolder);
  const allowed =
    subfolder === 'surat' ? APP_LIMITS.ALLOWED_SURAT_PENGAJUAN_EXT : APP_LIMITS.ALLOWED_PENGAJUAN_EXT;
  const v = validateUploadFile(file, allowed);
  if (!v.ok) throw new Error(v.message);
  const sb = getSupabase();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${subfolder}/${Date.now()}-${safeName}`;
  const { error } = await sb.storage.from(STORAGE_BUCKETS.pengajuan).upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = sb.storage.from(STORAGE_BUCKETS.pengajuan).getPublicUrl(path);
  return { path, url: data.publicUrl, ext: v.ext, size: file.size, name: file.name };
}

async function apiUploadPengajuanSuratFile(userId, file) {
  return apiUploadPengajuanFile(userId, file, 'surat');
}

async function apiCreatePengajuan(payload, session) {
  if (isLocalMode()) return localDbCreatePengajuan(payload, session);
  const kode = normalizeKode(payload.kode);
  if (!kode) throw new Error('Nomor pengajuan wajib diisi');
  if (kode.length > 64) throw new Error('Nomor pengajuan maksimal 64 karakter');

  const sb = getSupabase();
  const row = {
    kode,
    user_id: payload.userId,
    judul: payload.judul,
    nama_pengusul: (payload.namaPengusul || '').trim(),
    divisi: payload.divisi,
    bukti_urls: payload.buktiUrls || [],
    tanggal: payload.tanggal || todayISO(),
    file_name: payload.fileName,
    file_url: payload.fileUrl,
    storage_path: payload.storagePath,
    file_type: payload.fileType,
    file_size: payload.fileSize,
    surat_file_name: payload.suratFileName || null,
    surat_file_url: payload.suratFileUrl || null,
    surat_storage_path: payload.suratStoragePath || null,
    surat_file_type: payload.suratFileType || null,
    surat_file_size: payload.suratFileSize || null,
    status: 'pending',
    pesan_admin: '',
  };
  const { data, error } = await sb.from('pengajuan').insert(row).select().single();
  if (error) {
    if (error.code === '23505') {
      throw new Error(`Nomor pengajuan "${kode}" sudah digunakan. Gunakan nomor lain.`);
    }
    throw error;
  }
  await apiLogActivity(session, 'Buat Pengajuan Anggaran', kode, { judul: payload.judul });
  await apiLogActivity(session, 'Upload File RAB', payload.fileName, { kode });
  if (payload.suratFileName) {
    await apiLogActivity(session, 'Upload Surat Pengajuan', payload.suratFileName, { kode });
  }
  if (payload.buktiUrls?.length) {
    await apiLogActivity(session, 'Upload Foto Bukti', `${payload.buktiUrls.length} foto`, { kode });
  }
  return pengajuanFromRow(data);
}

async function apiUpdatePengajuanFile(id, session, meta = {}, files = {}) {
  if (isLocalMode()) return localDbUpdatePengajuanFile(id, session, meta, files);
  const patch = {
    status: 'pending',
    updated_at: new Date().toISOString(),
  };
  if (meta.judul != null) patch.judul = meta.judul;
  if (meta.namaPengusul != null) patch.nama_pengusul = meta.namaPengusul.trim();
  if (meta.divisi != null) patch.divisi = meta.divisi;
  if (meta.tanggal != null) patch.tanggal = meta.tanggal;
  if (meta.buktiUrls != null) patch.bukti_urls = meta.buktiUrls;
  if (files.rab) {
    const uploaded = await apiUploadPengajuanFile(session.id, files.rab);
    Object.assign(patch, {
      file_name: uploaded.name,
      file_url: uploaded.url,
      storage_path: uploaded.path,
      file_type: uploaded.ext,
      file_size: uploaded.size,
    });
  }
  if (files.surat) {
    const uploaded = await apiUploadPengajuanSuratFile(session.id, files.surat);
    Object.assign(patch, {
      surat_file_name: uploaded.name,
      surat_file_url: uploaded.url,
      surat_storage_path: uploaded.path,
      surat_file_type: uploaded.ext,
      surat_file_size: uploaded.size,
    });
  }
  const sb = getSupabase();
  const { data, error } = await sb
    .from('pengajuan')
    .update(patch)
    .eq('id', id)
    .eq('user_id', session.id)
    .select()
    .single();
  if (error) throw error;
  await apiLogActivity(session, 'Edit Pengajuan / Upload Ulang RAB', data.kode);
  return pengajuanFromRow(data);
}

async function apiUpdatePengajuanStatus(id, { status, pesanAdmin }, session) {
  if (isLocalMode()) return localDbUpdatePengajuanStatus(id, { status, pesanAdmin }, session);
  const sb = getSupabase();
  const patch = {
    status,
    pesan_admin: pesanAdmin || '',
    tanggal_keputusan: status === 'pending' ? null : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await sb.from('pengajuan').update(patch).eq('id', id).select().single();
  if (error) throw error;
  const actMap = {
    approved: 'Persetujuan Pengajuan',
    rejected: 'Penolakan Pengajuan',
    revisi: 'Permintaan Revisi Pengajuan',
    pending: 'Verifikasi Pengajuan',
  };
  await apiLogActivity(session, actMap[status] || 'Update Status Pengajuan', data.kode, { status });
  return pengajuanFromRow(data);
}

function isRiwayatStatus(status) {
  return status === 'approved' || status === 'rejected';
}

function canDeleteRiwayatPengajuan(p, session) {
  if (!p || !session || !isRiwayatStatus(p.status)) return false;
  if (session.role === 'admin') return true;
  return p.userId === session.id;
}

async function apiDeleteRiwayatPengajuan(id, session) {
  if (isLocalMode()) return localDbDeleteRiwayatPengajuan(id, session);
  const p = getPengajuanFromStore(id) || (await apiFetchPengajuanById(id));
  if (!canDeleteRiwayatPengajuan(p, session)) {
    throw new Error('Pengajuan tidak dapat dihapus dari arsip');
  }
  const sb = getSupabase();
  const { error } = await sb.from('pengajuan').delete().eq('id', id);
  if (error) throw error;
  await apiLogActivity(session, 'Hapus Arsip Riwayat', p.kode || id);
  return { ok: true, id };
}

async function apiClearRiwayatPengajuan(session, items) {
  const targets = (items || []).filter((p) => canDeleteRiwayatPengajuan(p, session));
  if (!targets.length) return { ok: true, count: 0 };
  if (isLocalMode()) return localDbClearRiwayatPengajuan(session, targets.map((p) => p.id));

  const sb = getSupabase();
  const ids = targets.map((p) => p.id);
  const { error } = await sb.from('pengajuan').delete().in('id', ids);
  if (error) throw error;
  await apiLogActivity(session, 'Bersihkan Arsip Riwayat', `${ids.length} pengajuan`);
  return { ok: true, count: ids.length };
}

function handleApiError(err, fallback) {
  console.error(err);
  const msg = err?.message || err?.error_description || fallback || 'Terjadi kesalahan';
  showToast(msg, 'error');
}
