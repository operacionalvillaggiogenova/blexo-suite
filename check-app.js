const $ = id => document.getElementById(id);
const photoTemplateSelect = $('photoTemplate');
if (photoTemplateSelect && !photoTemplateSelect.querySelector('[value="six"]')) photoTemplateSelect.insertAdjacentHTML('beforeend', '<option value="six">6 por página (compacto)</option>');
const DB_NAME = 'blexo-check', STORE = 'reports';
const DEFAULT_SEAL_CONFIG = 'Antes|texto|#123047\nDepois|texto|#176d9a\nVerde|bolinha|#36a269\nAmarelo|bolinha|#e5b22e\nVermelho|bolinha|#cb4c4c';
let currentReport, saveTimer;
const newId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const newBlock = () => ({ id: newId(), title: '', photos: [] });
const defaultSettings = () => { const c=typeof blexoConfig==='function'?blexoConfig():{}; return { watermark: c.watermark!==false, template:c.checkPhotoTemplate||c.photoTemplate||'two', company:'', sealConfig: c.sealConfig||DEFAULT_SEAL_CONFIG }; };
const blankReport = () => ({ id: newId(), reportType: 'Relatório Fotográfico', reportDate: new Date().toISOString().slice(0,10), name: 'Novo relatório', client: '', location: '', service: '', technician: '', notes: '', settings: defaultSettings(), groups: [newBlock()], updatedAt: new Date().toISOString() });

function openDatabase() { return new Promise((resolve, reject) => { const request = indexedDB.open(DB_NAME, 1); request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' }); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
async function withStore(mode, work) { const db = await openDatabase(); return new Promise((resolve, reject) => { const transaction = db.transaction(STORE, mode), result = work(transaction.objectStore(STORE)); transaction.oncomplete = () => { db.close(); resolve(result); }; transaction.onerror = () => { db.close(); reject(transaction.error); }; }); }
const saveReport = report => withStore('readwrite', store => store.put(report));
const getAllReports = () => new Promise(async (resolve, reject) => { try { const db = await openDatabase(), request = db.transaction(STORE).objectStore(STORE).getAll(); request.onsuccess = () => { db.close(); resolve(request.result); }; request.onerror = () => reject(request.error); } catch (error) { reject(error); } });
const deleteReport = id => withStore('readwrite', store => store.delete(id));

function formatDate(date = new Date()) { return new Date(date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); }
function escapeHtml(value = '') { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function countPhotos() { return currentReport.groups.reduce((total, group) => total + group.photos.length, 0); }
function settings() { return currentReport.settings; }
function renderModuleColors(){}
function saveModuleColors(){}
function ensureReportShape(report) { report.reportType ||= 'Relatório Fotográfico'; report.reportDate ||= new Date(report.updatedAt || Date.now()).toISOString().slice(0,10); report.settings = { ...defaultSettings(), ...(report.settings || {}) }; report.groups = report.groups?.length ? report.groups : [newBlock()]; report.groups.forEach(group => { group.photos ||= []; group.photos.forEach(photo => { photo.note ||= ''; photo.seal ||= ''; photo.insertedAt ||= photo.date || new Date().toISOString(); }); }); return report; }
function scheduleSave(message = 'Salvo neste aparelho') { clearTimeout(saveTimer); saveTimer = setTimeout(async () => { currentReport.updatedAt = new Date().toISOString(); await saveReport(currentReport); $('feedback').textContent = message; }, 350); }
function sealOptions() { return settings().sealConfig.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => { const [label, kind = 'texto', color = '#123047'] = line.split('|').map(part => part.trim()); return { label, kind: kind.toLowerCase() === 'bolinha' ? 'dot' : 'text', color: /^#[0-9a-f]{6}$/i.test(color) ? color : '#123047' }; }).filter(option => option.label); }
function syncFields() { ['reportName', 'client', 'location', 'service', 'technician', 'notes'].forEach(id => { currentReport[id === 'reportName' ? 'name' : id] = $(id).value.trim(); }); currentReport.reportType = 'Relatório Fotográfico'; currentReport.reportDate = $('reportDate').value || new Date().toISOString().slice(0,10); currentReport.settings = { watermark: $('watermark').checked, template: $('photoTemplate').value, company: $('company').value.trim(), sealConfig: $('sealConfig').value.trim() || DEFAULT_SEAL_CONFIG }; $('reportHeading').textContent = currentReport.name || 'Novo relatório'; }
function renderReport() { const r = ensureReportShape(currentReport); ['reportName', 'client', 'location', 'service', 'technician', 'notes'].forEach(id => { $(id).value = r[id === 'reportName' ? 'name' : id] || ''; }); $('reportDate').value = r.reportDate || new Date().toISOString().slice(0,10); $('watermark').checked = r.settings.watermark; $('photoTemplate').value = r.settings.template; $('company').value = r.settings.company; $('sealConfig').value = r.settings.sealConfig; $('reportHeading').textContent = r.name || 'Novo relatório'; renderBlocks(); }
function findGroup(id) { return currentReport.groups.find(group => group.id === id); }
function photoPicker(group, photo, photoIndex) { const options = sealOptions(); return `<article class="photo"><img src="${photo.src}" alt="Foto ${photoIndex + 1}"><span class="tag">${escapeHtml(group.title || 'Evidência')}</span><select class="seal-picker" data-seal="${group.id}:${photo.id}" aria-label="Selo da foto"><option value="">Selo</option>${options.map(option => `<option value="${escapeHtml(option.label)}" ${photo.seal === option.label ? 'selected' : ''}>${option.kind === 'dot' ? '● ' : ''}${escapeHtml(option.label)}</option>`).join('')}</select><button class="remove" data-remove-photo="${group.id}:${photo.id}" aria-label="Excluir foto">×</button><textarea class="photo-note" data-note="${group.id}:${photo.id}" placeholder="Observação desta foto">${escapeHtml(photo.note)}</textarea></article>`; }
function renderBlocks() {
  const total = countPhotos(); $('photoCount').textContent = `${total} ${total === 1 ? 'foto' : 'fotos'}`; $('generateButton').disabled = !total;
  $('evidenceBlocks').innerHTML = currentReport.groups.map((group, groupIndex) => `<article class="evidence-block"><div class="evidence-block-header"><strong>Bloco ${groupIndex + 1}</strong>${currentReport.groups.length > 1 ? `<button class="delete-block" data-delete-block="${group.id}">Excluir bloco</button>` : ''}</div><label>Subtítulo do conjunto<input class="group-title" data-group="${group.id}" placeholder="Ex.: Quadro elétrico — antes da manutenção" value="${escapeHtml(group.title)}"></label><div class="capture-actions"><label class="capture-button primary"><input class="photo-input" data-group="${group.id}" data-source="camera" type="file" accept="image/*" capture="environment" multiple>⌾ Tirar foto</label><label class="capture-button"><input class="photo-input" data-group="${group.id}" data-source="gallery" type="file" accept="image/*" multiple>▧ Galeria</label></div><p class="block-hint">A galeria usa a data EXIF original; a câmera usa a data atual. Sem EXIF, não há data na marca-d’água.</p><div class="photo-grid">${group.photos.map((photo, index) => photoPicker(group, photo, index)).join('')}</div></article>`).join('');
  document.querySelectorAll('.group-title').forEach(field => field.oninput = event => { findGroup(event.target.dataset.group).title = event.target.value; scheduleSave(); });
  document.querySelectorAll('.photo-input').forEach(input => input.onchange = event => { addFiles(event.target.dataset.group, event.target.dataset.source, event.target.files); event.target.value = ''; });
  document.querySelectorAll('[data-delete-block]').forEach(button => button.onclick = () => { currentReport.groups = currentReport.groups.filter(group => group.id !== button.dataset.deleteBlock); renderBlocks(); scheduleSave(); });
  document.querySelectorAll('[data-remove-photo]').forEach(button => button.onclick = () => { const [groupId, photoId] = button.dataset.removePhoto.split(':'); findGroup(groupId).photos = findGroup(groupId).photos.filter(photo => photo.id !== photoId); renderBlocks(); scheduleSave(); });
  document.querySelectorAll('[data-note]').forEach(field => field.oninput = event => { const [groupId, photoId] = event.target.dataset.note.split(':'); findGroup(groupId).photos.find(photo => photo.id === photoId).note = event.target.value; scheduleSave(); });
  document.querySelectorAll('[data-seal]').forEach(field => field.onchange = event => { const [groupId, photoId] = event.target.dataset.seal.split(':'); findGroup(groupId).photos.find(photo => photo.id === photoId).seal = event.target.value; scheduleSave(); });
}

function exifDateText(file) { return file.arrayBuffer().then(buffer => { const view = new DataView(buffer); if (view.byteLength < 14 || view.getUint16(0, false) !== 0xffd8) return null; let offset = 2; while (offset + 4 < view.byteLength) { if (view.getUint8(offset) !== 0xff) { offset++; continue; } const marker = view.getUint8(offset + 1), length = view.getUint16(offset + 2, false); if (marker === 0xe1 && offset + 10 < view.byteLength && String.fromCharCode(...new Uint8Array(buffer, offset + 4, 4)) === 'Exif') { const tiff = offset + 10, endian = view.getUint16(tiff, false), little = endian === 0x4949; if (!(little || endian === 0x4d4d) || view.getUint16(tiff + 2, little) !== 42) return null; const read16 = pos => view.getUint16(pos, little), read32 = pos => view.getUint32(pos, little); const readIfd = pos => { if (pos < tiff || pos + 2 > view.byteLength) return []; const count = read16(pos), entries = []; for (let i = 0; i < count; i++) { const entry = pos + 2 + i * 12; if (entry + 12 > view.byteLength) break; entries.push({ tag: read16(entry), type: read16(entry + 2), count: read32(entry + 4), value: entry + 8 }); } return entries; }; const ascii = entry => { if (!entry || entry.type !== 2) return null; const pos = entry.count <= 4 ? entry.value : tiff + read32(entry.value); if (pos + entry.count > view.byteLength) return null; return new TextDecoder('ascii').decode(new Uint8Array(buffer, pos, entry.count)).replace(/\0/g, '').trim(); }; const ifd0 = readIfd(tiff + read32(tiff + 4)); const exifPointer = ifd0.find(entry => entry.tag === 0x8769); const exifIfd = exifPointer ? readIfd(tiff + read32(exifPointer.value)) : []; const raw = ascii(exifIfd.find(entry => entry.tag === 0x9003)) || ascii(exifIfd.find(entry => entry.tag === 0x9004)); const match = raw?.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2})(?::\d{2})?$/); return match ? `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}` : null; } if (length < 2) break; offset += 2 + length; } return null; }).catch(() => null); }
function drawWatermark(image, text) { const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; ctx.drawImage(image, 0, 0); if (settings().watermark && text) { const size = Math.max(22, Math.round(canvas.width / 34)), padding = Math.round(size * .65), inset = Math.max(padding, Math.round(canvas.width * .018)); ctx.font = `600 ${size}px Arial`; const boxWidth = Math.ceil(ctx.measureText(text).width + padding * 2), boxHeight = size + padding * 2, x = canvas.width - boxWidth - inset, y = canvas.height - boxHeight - inset; ctx.fillStyle = 'rgba(0,0,0,.70)'; ctx.fillRect(x, y, boxWidth, boxHeight); ctx.fillStyle = 'white'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + padding, y + boxHeight / 2); ctx.textBaseline = 'alphabetic'; } return canvas.toDataURL('image/jpeg', .86); }
async function decodePhoto(file) {
  if (!file || !file.type || !file.type.startsWith('image/')) throw new Error('Arquivo de imagem inválido.');
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image', premultiplyAlpha: 'none' });
      if (bitmap.width && bitmap.height) return bitmap;
      bitmap.close?.();
    } catch (error) { console.warn('Blexo: createImageBitmap falhou, usando decodificador alternativo.', error); }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      if (!image.naturalWidth || !image.naturalHeight) return reject(new Error('Imagem sem dimensões válidas.'));
      resolve(image);
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível decodificar a imagem.')); };
    image.src = url;
  });
}
function normalizePhoto(image, maxSide = 1920) {
  const width = image.width || image.naturalWidth, height = image.height || image.naturalHeight;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close?.();
  return canvas;
}
async function addFiles(groupId, source, fileList) {
  const group = findGroup(groupId);
  const files = [...fileList].filter(file => file && (!file.type || file.type.startsWith('image/')));
  if (!files.length) return;
  for (const file of files) {
    try {
      $('feedback').textContent = 'Processando foto…';
      const insertedAt = new Date().toISOString();
      const watermarkText = source === 'camera' ? formatDate(insertedAt) : await exifDateText(file);
      const image = await decodePhoto(file);
      const normalized = normalizePhoto(image, 1920);
      const src = drawWatermark(normalized, watermarkText);
      group.photos.push({ id: newId(), src, insertedAt, watermarkText, seal: '', note: '' });
      renderBlocks();
      await saveNow();
      $('feedback').textContent = '✓ Foto adicionada e salva neste aparelho.';
    } catch (error) {
      console.error('Blexo: falha ao processar foto.', error);
      $('feedback').textContent = `Não foi possível salvar esta foto: ${error?.message || 'erro desconhecido'}`;
    }
  }
}


function openReports() { renderReportsList(); $('reportsDialog').showModal(); }
function countReportPhotos(report) { return report.groups.reduce((n, group) => n + group.photos.length, 0); }
async function renderReportsList() {
  const reports = (await getAllReports()).map(ensureReportShape).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  $('reportsList').innerHTML = reports.map(report => {
    const date = report.reportDate ? new Date(report.reportDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem data';
    const photos = countReportPhotos(report);
    return `<div class="saved-record"><button class="saved-record-main" data-open-report="${report.id}"><span class="record-type">📋 ${escapeHtml(report.reportType || 'Relatório Fotográfico')}</span><strong>${escapeHtml(report.name || 'Sem nome')}</strong><small>📅 ${date} · ${photos} ${photos === 1 ? 'foto' : 'fotos'}</small><small class="record-updated">Atualizado ${formatDate(report.updatedAt)}</small></button><button class="report-delete" data-delete-report="${report.id}" aria-label="Excluir relatório">×</button></div>`;
  }).join('') || '<p class="dialog-hint">Nenhum relatório salvo.</p>';

  document.querySelectorAll('[data-open-report]').forEach(button => button.onclick = async () => {
    await saveNow();
    currentReport = ensureReportShape((await getAllReports()).find(report => report.id === button.dataset.openReport));
    $('reportsDialog').close();
    renderReport();
  });
  document.querySelectorAll('[data-delete-report]').forEach(button => button.onclick = async () => {
    if (confirm('Excluir este relatório deste aparelho? Esta ação não pode ser desfeita.')) {
      await deleteReport(button.dataset.deleteReport);
      if (button.dataset.deleteReport === currentReport.id) {
        currentReport = blankReport();
        await saveNow();
        renderReport();
      }
      renderReportsList();
    }
  });
}

async function saveNow() { syncFields(); currentReport.updatedAt = new Date().toISOString(); await saveReport(currentReport); }
function setOnlineStatus() { const online = navigator.onLine; $('offlineStatus').textContent = online ? '● Online' : '● Offline'; $('offlineStatus').classList.toggle('offline', !online); }

function splitText(doc, text, width) { return doc.splitTextToSize(text || '—', width); }
function hexRgb(hex) { const value = hex.replace('#', ''); return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)]; }
function drawPdfSeal(doc, photo, x, y, width) { const seal = sealOptions().find(option => option.label === photo.seal); if (!seal) return; const [r, g, b] = hexRgb(seal.color); doc.setFillColor(r, g, b); if (seal.kind === 'dot') { doc.circle(x + width - 5, y + 5, 3, 'F'); return; } doc.setFontSize(7); doc.setFont(undefined, 'bold'); const box = doc.getTextWidth(seal.label) + 5; doc.roundedRect(x + width - box - 3, y + 2, box, 6, 1, 1, 'F'); doc.setTextColor(255); doc.text(seal.label, x + width - box - .5, y + 6.3); doc.setTextColor(80); doc.setFont(undefined, 'normal'); }
function header(doc, page, title) { const cfg=typeof blexoConfig==='function'?blexoConfig():{}; const hc=cfg.checkHeaderColor||'#123047'; const rgb=hexRgb(hc); doc.setFillColor(...rgb); doc.rect(0, 0, 210, 22, 'F'); doc.setTextColor(255); doc.setFontSize(15); doc.text(cfg.checkHeaderName || settings().company || 'Blexo-Check', 12, 14); doc.setFontSize(9); doc.text(`RELATÓRIO FOTOGRÁFICO · ${page}`, 198, 14, { align: 'right' }); doc.setTextColor(30, 46, 56); doc.setFontSize(18); doc.text(title, 12, 35); }
function generatePdf() { if (!window.jspdf) { $('feedback').textContent = 'O gerador de PDF ainda não foi baixado. Conecte-se uma vez à internet e tente novamente.'; return; } syncFields(); const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: 'mm', format: 'a4' }); header(doc, '1', currentReport.name || 'Relatório de serviço'); doc.setFontSize(11); doc.setTextColor(80); let y = 47; [['Cliente / obra', currentReport.client], ['Local', currentReport.location], ['Serviço executado', currentReport.service], ['Responsável', currentReport.technician], ['Gerado em', formatDate()]].forEach(([label, value]) => { doc.setFont(undefined, 'bold'); doc.text(label, 12, y); doc.setFont(undefined, 'normal'); const lines = splitText(doc, value, 138); doc.text(lines, 60, y); y += Math.max(9, lines.length * 5 + 3); }); const one = settings().template === 'one', four = settings().template === 'four', cols = one ? 1 : 2, imageW = one ? 174 : (four ? 83 : 87), imageH = one ? 115 : (four ? 57 : 65); let x = 12, yPhoto = y + 17, col = 0, page = 1, photoNumber = 0; doc.setFontSize(14); doc.setTextColor(30, 46, 56); doc.text('Evidências fotográficas', 12, y + 7); const nextPage = () => { doc.addPage(); page++; header(doc, `${page}`, 'Evidências fotográficas'); x = 12; yPhoto = 48; col = 0; }; currentReport.groups.forEach((group, index) => { if (col) { col = 0; x = 12; yPhoto += imageH + 18; } if (yPhoto + 12 > 282) nextPage(); doc.setFontSize(11); doc.setTextColor(23, 109, 154); doc.text(group.title || `Bloco de evidências ${index + 1}`, 12, yPhoto); yPhoto += 6; group.photos.forEach(photo => { photoNumber++; const noteLines = photo.note ? splitText(doc, photo.note, imageW) : [], footer = 8 + noteLines.length * 4; if (yPhoto + imageH + footer > 282) { nextPage(); doc.setFontSize(11); doc.setTextColor(23, 109, 154); doc.text(group.title || `Bloco de evidências ${index + 1}`, 12, yPhoto); yPhoto += 6; } doc.addImage(photo.src, 'JPEG', x, yPhoto, imageW, imageH); drawPdfSeal(doc, photo, x, yPhoto, imageW); doc.setFontSize(8); doc.setTextColor(80); doc.text(`Foto ${photoNumber} · inserida em ${formatDate(photo.insertedAt || photo.date)}`, x, yPhoto + imageH + 5); if (noteLines.length) { doc.setFontSize(8.5); doc.text(noteLines, x, yPhoto + imageH + 9); } col++; if (col === cols) { col = 0; x = 12; yPhoto += imageH + footer + 5; } else x = 112; }); if (col) { col = 0; x = 12; yPhoto += imageH + 18; } else yPhoto += 7; }); if (currentReport.notes) { const finalNotes = splitText(doc, currentReport.notes, 174), notesHeight = 14 + finalNotes.length * 5; if (yPhoto + notesHeight > 282) { nextPage(); yPhoto = 48; } doc.setDrawColor(220, 229, 233); doc.setFillColor(248, 251, 252); doc.roundedRect(12, yPhoto, 186, notesHeight, 3, 3, 'FD'); doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.setTextColor(30, 46, 56); doc.text('Observações finais', 18, yPhoto + 7); doc.setFont(undefined, 'normal'); doc.setFontSize(9); doc.text(finalNotes, 18, yPhoto + 13); } const safe = (currentReport.name || 'relatorio').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase(); doc.save(`blexo-check-${safe}.pdf`); saveNow(); $('feedback').textContent = 'PDF gerado e download iniciado.'; }
async function loadStoredPhoto(src) {
  if (!src) throw new Error('Foto sem conteúdo.');
  const image = new Image();
  image.decoding = 'async';
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error('Não foi possível carregar a foto salva.'));
    image.src = src;
  });
  if (image.decode) {
    try { await image.decode(); } catch (_) { /* Safari pode rejeitar decode mesmo após onload; a imagem já está carregada. */ }
  }
  if (!image.naturalWidth || !image.naturalHeight) throw new Error('Foto salva sem dimensões válidas.');
  return image;
}

async function generateOfflineCheckPdf(){
  if (!window.BlexoOfflinePdf) throw new Error('Gerador offline de PDF indisponível. Reabra o aplicativo para atualizar os arquivos.');
  syncFields();
  const pages=[];
  const template=settings().template||'two';
  const cols=template==='one'?1:template==='six'?3:2;
  const rows=template==='one'?1:template==='six'||template==='four'?2:1;
  const perPage=cols*rows;
  const photos=currentReport.groups.flatMap(group=>group.photos.map(photo=>({...photo,group:group.title})));
  const cfg=typeof blexoConfig==='function'?blexoConfig():{};
  for(let start=0;start<photos.length;start+=perPage){
    const canvas=document.createElement('canvas');
    canvas.width=1240; canvas.height=1754;
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle=cfg.checkHeaderColor||'#123047'; ctx.fillRect(0,0,1240,125);
    ctx.fillStyle='#fff'; ctx.font='bold 32px Arial'; ctx.fillText(cfg.checkHeaderName||'Blexo-Check',55,78);
    ctx.fillStyle='#1e2e38'; ctx.font='bold 28px Arial'; ctx.fillText(currentReport.name||'Relatório fotográfico',55,185);
    for(let n=0;n<perPage&&start+n<photos.length;n++){
      const p=photos[start+n];
      const img=await loadStoredPhoto(p.src);
      const col=n%cols, row=Math.floor(n/cols);
      const w=cols===1?1120:cols===3?350:535;
      const h=rows===1?1180:rows===2?650:550;
      const x=60+col*(w+20), y=240+row*(h+35);
      const ratio=img.naturalWidth/img.naturalHeight;
      let drawW=w, drawH=w/ratio;
      if(drawH>h){drawH=h;drawW=h*ratio;}
      const drawX=x+(w-drawW)/2;
      ctx.fillStyle='#f2f4f5'; ctx.fillRect(x,y,w,h);
      ctx.drawImage(img,drawX,y,drawW,drawH);
      ctx.fillStyle='#52616a'; ctx.font='16px Arial';
      ctx.fillText(`Foto ${start+n+1}${p.group?' · '+String(p.group).slice(0,26):''}`,x,y+h+24);
      if(p.note){ctx.font='14px Arial';ctx.fillText(String(p.note).slice(0,70),x,y+h+46);}
    }
    pages.push(canvas.toDataURL('image/jpeg',.92));
  }
  const safe=(currentReport.name||'relatorio').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'relatorio';
  await window.BlexoOfflinePdf(pages,`blexo-check-${safe}.pdf`);
  await saveNow();
  $('feedback').textContent='PDF gerado offline com sucesso.';
}
const generatePdfWithFallback=generatePdf;generatePdf=function(){return window.jspdf?generatePdfWithFallback():generateOfflineCheckPdf()};
async function generateSixPhotoPdf(){if(!window.jspdf?.jsPDF)return generateOfflineCheckPdf();syncFields();const {jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'a4'}),photos=currentReport.groups.flatMap(g=>g.photos.map(p=>({...p,group:g.title})));let page=0;photos.forEach((p,i)=>{if(i%6===0){if(i)doc.addPage();page++;header(doc,page,currentReport.name||'Relatório fotográfico')}const col=i%3,row=Math.floor((i%6)/3),x=12+col*66,y=48+row*108;const props=doc.getImageProperties(p.src),w=61,h=Math.min(82,w/(props.width/props.height));doc.addImage(p.src,'JPEG',x,y,w,h);doc.setFontSize(7);doc.setTextColor(80);doc.text(`Foto ${i+1}`,x,y+h+5);if(p.group)doc.text(String(p.group).slice(0,24),x,y+h+10)});const safe=(currentReport.name||'relatorio').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').toLowerCase();doc.save(`blexo-check-${safe}.pdf`);saveNow();$('feedback').textContent='PDF com 6 imagens por folha gerado.'}

['reportName', 'client', 'location', 'service', 'technician', 'notes'].forEach(id => $(id).addEventListener('input', () => { syncFields(); scheduleSave(); })); $('reportDate').addEventListener('change', () => { syncFields(); scheduleSave(); });
$('addBlockButton').onclick = () => { currentReport.groups.push(newBlock()); renderBlocks(); scheduleSave(); };
$('newReportButton').onclick = async () => { await saveNow(); currentReport = blankReport(); await saveNow(); renderReport(); $('feedback').textContent = 'Novo relatório criado neste aparelho.'; };
 $('reportsButtonInline').onclick = openReports; $('settingsButton').onclick = () => { renderModuleColors(); $('settingsDialog').showModal(); }; document.querySelectorAll('[data-close]').forEach(button => button.onclick = () => $(button.dataset.close).close()); $('settingsDialog').addEventListener('close', () => { if ($('settingsDialog').returnValue !== 'cancel') { saveModuleColors(); syncFields(); renderBlocks(); scheduleSave(); } }); $('generateButton').onclick = async () => {
  const button = $('generateButton');
  if (button.disabled) return;
  button.disabled = true;
  $('feedback').textContent = 'Gerando PDF…';
  try {
    if (settings().template === 'six') await generateSixPhotoPdf();
    else await generatePdf();
  } catch (err) {
    console.error('Blexo Check PDF:', err);
    $('feedback').textContent = `Falha ao gerar PDF: ${err?.message || 'erro desconhecido'}`;
  } finally {
    button.disabled = false;
  }
};
window.addEventListener('online', setOnlineStatus); window.addEventListener('offline', setOnlineStatus);
(async () => { const reports = await getAllReports(); currentReport = ensureReportShape(reports.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] || blankReport()); if (!reports.length) await saveReport(currentReport); renderReport(); setOnlineStatus(); })();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
