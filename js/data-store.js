/** Cache in-memory */

let _store = {
  folders: [],
  templateFiles: [],
  pengajuan: [],
  profiles: [],
  activityLogs: [],
  loaded: false,
};

async function safeApi(fn, fallback) {
  try {
    return await fn();
  } catch (e) {
    console.warn('API:', e.message || e);
    return fallback;
  }
}

function getDB() {
  return {
    folders: _store.folders,
    templateFiles: _store.templateFiles,
    pengajuan: _store.pengajuan,
    users: _store.profiles,
    activityLogs: _store.activityLogs,
  };
}

function isAppDataLoaded() {
  return _store.loaded;
}

function getUserById(id) {
  return _store.profiles.find((u) => u.id === id);
}

function getFolderById(id) {
  return _store.folders.find((f) => f.id === id);
}

function getFoldersByJenis(jenis) {
  return _store.folders.filter((f) => (f.jenis || 'rab') === jenis).sort((a, b) => a.nama.localeCompare(b.nama));
}

function getPengajuanFromStore(id) {
  return _store.pengajuan.find((p) => p.id === id);
}

function patchPengajuanInStore(updated) {
  const idx = _store.pengajuan.findIndex((p) => p.id === updated.id);
  if (idx >= 0) _store.pengajuan[idx] = updated;
  else _store.pengajuan.unshift(updated);
}

function removePengajuanFromStore(id) {
  _store.pengajuan = _store.pengajuan.filter((p) => p.id !== id);
}

function removePengajuanManyFromStore(ids) {
  const set = new Set(ids);
  _store.pengajuan = _store.pengajuan.filter((p) => !set.has(p.id));
}

function patchFolderInStore(updated) {
  const idx = _store.folders.findIndex((f) => f.id === updated.id);
  if (idx >= 0) _store.folders[idx] = updated;
  else _store.folders.push(updated);
  _store.folders.sort((a, b) => a.nama.localeCompare(b.nama));
}

function removeFolderFromStore(id) {
  _store.folders = _store.folders.filter((f) => f.id !== id);
  _store.templateFiles = _store.templateFiles.filter((f) => f.folderId !== id);
}

function patchTemplateFileInStore(updated) {
  const idx = _store.templateFiles.findIndex((f) => f.id === updated.id);
  if (idx >= 0) _store.templateFiles[idx] = updated;
  else _store.templateFiles.unshift(updated);
}

function removeTemplateFileFromStore(id) {
  _store.templateFiles = _store.templateFiles.filter((f) => f.id !== id);
}

function getFilesByFolder(folderId) {
  return _store.templateFiles.filter((f) => f.folderId === folderId);
}

function prefetchUserTemplates() {
  Promise.all([
    safeApi(() => apiFetchFolders(), []),
    safeApi(() => apiFetchAllTemplateFiles(), []),
  ])
    .then(([folders, templateFiles]) => {
      _store.folders = folders;
      _store.templateFiles = templateFiles;
    })
    .catch((e) => console.warn('prefetch templates:', e));
}

function sanitizePengajuanList(list) {
  if (!isCloudMode()) return list || [];
  return (list || []).filter((p) => !isLegacyLocalId(p.id));
}

async function loadAppData(session, opts = {}) {
  if (!session) {
    _store = { folders: [], templateFiles: [], pengajuan: [], profiles: [], activityLogs: [], loaded: false };
    return;
  }

  if (session.role === 'user') {
    const pengajuan = sanitizePengajuanList(await safeApi(() => apiFetchPengajuan(session), []));
    _store = {
      folders: _store.folders,
      templateFiles: _store.templateFiles,
      pengajuan,
      profiles: [session],
      activityLogs: [],
      loaded: true,
    };
    prefetchUserTemplates();
    return;
  }

  const tasks = [
    safeApi(() => apiFetchFolders(), []),
    safeApi(() => apiFetchAllTemplateFiles(), []),
    safeApi(() => apiFetchPengajuan(session), []),
    safeApi(() => apiFetchProfiles(), [session]),
  ];
  if (opts.includeLogs) {
    tasks.push(safeApi(() => apiFetchActivityLogs(session, 100), []));
  }

  const results = await Promise.all(tasks);
  const folders = results[0];
  const templateFiles = results[1];
  const pengajuan = sanitizePengajuanList(results[2]);
  const profiles = results[3];
  const activityLogs = opts.includeLogs ? results[4] : _store.activityLogs || [];

  _store = { folders, templateFiles, pengajuan, profiles, activityLogs, loaded: true };
}

async function reloadAppData(session) {
  _store.loaded = false;
  await loadAppData(session);
}

function clearActivityLogsInStore() {
  _store.activityLogs = [];
}

function clearAppData() {
  _store = { folders: [], templateFiles: [], pengajuan: [], profiles: [], activityLogs: [], loaded: false };
}

async function ensurePengajuanLoaded(id) {
  if (isCloudMode() && isLegacyLocalId(id)) return null;
  let p = getPengajuanFromStore(id);
  if (p) return p;
  p = await safeApi(() => apiFetchPengajuanById(id), null);
  if (p) patchPengajuanInStore(p);
  return p;
}
