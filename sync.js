/* Blexo Suite — sincronização Google/Gmail → Google Drive
 * Offline-first: IndexedDB continua sendo a fonte local. O Drive é a cópia sincronizada.
 * Escopo OAuth: drive.file (somente arquivos/pastas criados pelo Blexo).
 */
(() => {
  'use strict';
  const DB = 'blexo-check', REPORTS = 'reports', META = 'sync_meta';
  const CFG = window.BLEXO_GOOGLE_CONFIG || {};
  const SCOPES = 'https://www.googleapis.com/auth/drive.file';
  const API = 'https://www.googleapis.com/drive/v3';
  const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
  const state = { token: null, email: '', folderId: null, syncing: false };
  let tokenClient = null;

  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 2);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(REPORTS)) db.createObjectStore(REPORTS, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function tx(store, mode, fn) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode), result = fn(t.objectStore(store));
      t.oncomplete = () => { db.close(); resolve(result); };
      t.onerror = () => { db.close(); reject(t.error); };
    });
  }
  const getReports = () => new Promise(async (resolve, reject) => {
    try { const db = await openDb(), r = db.transaction(REPORTS).objectStore(REPORTS).getAll(); r.onsuccess=()=>{db.close();resolve(r.result)}; r.onerror=()=>reject(r.error); } catch(e){reject(e)}
  });
  const putReport = report => tx(REPORTS, 'readwrite', s => s.put(report));
  const getMeta = key => new Promise(async (resolve, reject) => {
    try { const db=await openDb(), r=db.transaction(META).objectStore(META).get(key); r.onsuccess=()=>{db.close();resolve(r.result?.value)}; r.onerror=()=>reject(r.error); } catch(e){reject(e)}
  });
  const putMeta = (key,value) => tx(META,'readwrite',s=>s.put({key,value}));
  const deleteMeta = key => tx(META,'readwrite',s=>s.delete(key));

  function setUi(message, kind='normal') {
    const text = message || '';
    if ($('syncStatus')) { $('syncStatus').textContent = text; $('syncStatus').classList.toggle('error', kind==='error'); $('syncStatus').classList.toggle('success', kind==='success'); }
    if ($('googleButton')) $('googleButton').textContent = state.email ? `Google: ${state.email}` : 'Conectar Google';
  }
  function configReady() { return CFG.clientId && !CFG.clientId.includes('COLOQUE_SEU_CLIENT_ID'); }

  function waitForGoogle(timeout=10000) {
    return new Promise((resolve,reject)=>{
      const start=Date.now(), timer=setInterval(()=>{
        if (window.google?.accounts?.oauth2) { clearInterval(timer); resolve(); }
        else if (Date.now()-start>timeout) { clearInterval(timer); reject(new Error('Google Identity Services não carregou.')); }
      },100);
    });
  }
  function initGoogle() {
    if (!configReady()) { setUi('Configure o Client ID do Google.', 'error'); return false; }
    try {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CFG.clientId,
        scope: SCOPES,
        callback: async response => {
          if (response.error) { setUi('Não foi possível autorizar o Google.', 'error'); return; }
          state.token = response.access_token;
          await identify();
          await syncNow();
        }
      });
      return true;
    } catch(e) { console.error(e); setUi(e.message,'error'); return false; }
  }
  async function identify() {
    try {
      const r=await gfetch('https://www.googleapis.com/oauth2/v3/userinfo');
      state.email=r.email || '';
      await putMeta('googleEmail', state.email);
    } catch(e) { console.warn(e); }
  }
  async function gfetch(url, options={}) {
    if (!state.token) throw new Error('Conta Google não conectada.');
    const headers = new Headers(options.headers||{}); headers.set('Authorization',`Bearer ${state.token}`);
    const r=await fetch(url,{...options,headers});
    if (r.status===401) { state.token=null; throw new Error('A sessão do Google expirou.'); }
    if (!r.ok) { const text=await r.text(); throw new Error(text.slice(0,300)||`Google Drive HTTP ${r.status}`); }
    return r;
  }
  async function driveJson(url, options={}) { const r=await gfetch(url,options); return r.status===204?null:r.json(); }
  async function findFolder(name, parentId) {
    const parent = parentId ? `'${parentId}' in parents` : `'root' in parents`;
    const q=encodeURIComponent(`name='${name.replace(/'/g,"\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false and ${parent}`);
    const data=await driveJson(`${API}/files?q=${q}&fields=files(id,name)&pageSize=10&spaces=drive`);
    return data.files?.[0] || null;
  }
  async function createFolder(name,parentId) {
    return driveJson(`${API}/files?fields=id,name`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,mimeType:'application/vnd.google-apps.folder',parents:parentId?[parentId]:undefined})});
  }
  async function ensureFolders() {
    let root=await findFolder('Blexo Suite'); if(!root) root=await createFolder('Blexo Suite');
    let check=await findFolder('check',root.id); if(!check) check=await createFolder('check',root.id);
    state.folderId=check.id; await putMeta('driveFolderId',check.id); return check.id;
  }
  async function listRemote() {
    const q=encodeURIComponent(`'${state.folderId}' in parents and trashed=false and appProperties has { key='blexoModule' and value='check' }`);
    const data=await driveJson(`${API}/files?q=${q}&fields=files(id,name,modifiedTime,appProperties)&pageSize=100&spaces=drive`);
    return data.files||[];
  }
  async function downloadRemote(fileId) {
    const data=await driveJson(`${API}/files/${fileId}?alt=media`); return data;
  }
  function multipartBody(metadata, data) {
    const boundary='-------BLEXO_SYNC_'+Date.now();
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`, JSON.stringify(metadata),
      `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n`, JSON.stringify(data),
      `\r\n--${boundary}--\r\n`
    ],{type:`multipart/related; boundary=${boundary}`});
    return {body,contentType:`multipart/related; boundary=${boundary}`};
  }
  async function uploadReport(report, file) {
    const name=`${report.id}.json`, metadata={name,mimeType:'application/json',appProperties:{blexoModule:'check',reportId:report.id,updatedAt:report.updatedAt}};
    if (!file) metadata.parents=[state.folderId];
    const part=multipartBody(metadata,report);
    const url=file ? `${UPLOAD}/${file.id}?uploadType=multipart&fields=id,name,modifiedTime,appProperties` : `${UPLOAD}?uploadType=multipart&fields=id,name,modifiedTime,appProperties`;
    return driveJson(url,{method:file?'PATCH':'POST',headers:{'Content-Type':part.contentType},body:part.body});
  }
  async function deleteRemote(fileId) { await gfetch(`${API}/files/${fileId}`,{method:'DELETE'}); }

  async function syncNow() {
    if (state.syncing) return;
    if (!navigator.onLine) { setUi('Offline — sincronização pendente.'); return; }
    if (!state.token) { setUi('Conecte uma conta Google para sincronizar.'); return; }
    state.syncing=true; setUi('Sincronizando…');
    try {
      await ensureFolders();
      const [locals, remotes, tombstones] = await Promise.all([getReports(),listRemote(),getMeta('deletedReports')]);
      const remoteById=new Map(remotes.map(f=>[f.appProperties?.reportId,f]));
      const deleted=new Set(tombstones||[]);
      for (const id of deleted) { const rf=remoteById.get(id); if(rf) await deleteRemote(rf.id); remoteById.delete(id); }
      for (const local of locals) {
        if (deleted.has(local.id)) continue;
        const remote=remoteById.get(local.id);
        if (!remote) {
          const created=await uploadReport(local); local.sync={driveFileId:created.id,lastSyncedAt:new Date().toISOString()}; await putReport(local); continue;
        }
        const remoteUpdated=new Date(remote.appProperties?.updatedAt || remote.modifiedTime || 0).getTime();
        const localUpdated=new Date(local.updatedAt||0).getTime();
        if (localUpdated >= remoteUpdated) {
          const updated=await uploadReport(local,remote); local.sync={driveFileId:updated.id,lastSyncedAt:new Date().toISOString()}; await putReport(local);
        } else {
          const remoteReport=await downloadRemote(remote.id); remoteReport.sync={driveFileId:remote.id,lastSyncedAt:new Date().toISOString()}; await putReport(remoteReport);
        }
        remoteById.delete(local.id);
      }
      for (const [id,remote] of remoteById) {
        if (!id) continue;
        const remoteReport=await downloadRemote(remote.id); remoteReport.sync={driveFileId:remote.id,lastSyncedAt:new Date().toISOString()}; await putReport(remoteReport);
      }
      await deleteMeta('deletedReports');
      await putMeta('lastSyncAt',new Date().toISOString());
      setUi(`Sincronizado · ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`,'success');
      window.dispatchEvent(new CustomEvent('blexo:remote-updated'));
    } catch(e) { console.error(e); setUi(`Falha na sincronização: ${e.message}`,'error'); }
    finally { state.syncing=false; }
  }

  async function connectGoogle() {
    if (!configReady()) { setUi('Falta configurar o Client ID do Google. Veja GOOGLE_SETUP.md.','error'); return; }
    try { await waitForGoogle(); if(!tokenClient) initGoogle(); tokenClient.requestAccessToken({prompt:''}); }
    catch(e) { setUi(e.message,'error'); }
  }
  async function onLocalDelete(e) {
    const current=(await getMeta('deletedReports'))||[]; if(!current.includes(e.detail.id)) current.push(e.detail.id); await putMeta('deletedReports',current); if(state.token) syncNow();
  }
  async function onLocalSave() { if(state.token && navigator.onLine) syncNow(); else if($('syncStatus')) setUi(navigator.onLine?'Alteração local pendente':'Offline — será sincronizado depois.'); }

  window.BlexoSync={connect:connectGoogle,sync:syncNow,isConnected:()=>!!state.token};
  window.addEventListener('blexo:local-save',onLocalSave);
  window.addEventListener('blexo:local-delete',onLocalDelete);
  window.addEventListener('online',()=>{ if(state.token) syncNow(); });
  window.addEventListener('blexo:remote-updated',()=>{});
  document.addEventListener('DOMContentLoaded',async()=>{
    const email=await getMeta('googleEmail').catch(()=>null); if(email) state.email=email;
    if($('googleButton')) $('googleButton').onclick=connectGoogle;
    setUi(state.email ? `Última conta: ${state.email}` : 'Não conectado');
    if(configReady()) { try { await waitForGoogle(4000); initGoogle(); } catch(_) {} }
  });
})();
