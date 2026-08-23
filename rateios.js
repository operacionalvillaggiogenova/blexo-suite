const $=id=>document.getElementById(id);
const DB_NAME='blexo-rateios-db', STORE='drafts';
let type='tags', tags=[], changes=[], scans=[], currentDraftId=null, saveTimer=null;
const today=new Date().toISOString().slice(0,10);
function cfg(){return typeof blexoConfig==='function'?blexoConfig():BLEXO_DEFAULT_CONFIG}
function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function esc(v){return String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function newId(){return 'rateio-'+Date.now()+'-'+Math.random().toString(36).slice(2,9)}
function openDatabase(){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open(DB_NAME,2);
  r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'})};
  r.onsuccess=()=>resolve(r.result);
  r.onerror=()=>reject(r.error||new Error('Não foi possível abrir o banco local.'));
  r.onblocked=()=>reject(new Error('O armazenamento local está bloqueado por outra janela do aplicativo.'));
 })
}
function requestResult(request,db){
 return new Promise((resolve,reject)=>{
  request.onsuccess=()=>{const value=request.result;db.close();resolve(value)};
  request.onerror=()=>{const error=request.error||new Error('Falha no armazenamento local.');db.close();reject(error)};
 })
}
async function saveRecord(record){const db=await openDatabase();return requestResult(db.transaction(STORE,'readwrite').objectStore(STORE).put(record),db)}
async function getRecord(id){const db=await openDatabase();return requestResult(db.transaction(STORE,'readonly').objectStore(STORE).get(id),db)}
async function deleteRecord(id){const db=await openDatabase();return requestResult(db.transaction(STORE,'readwrite').objectStore(STORE).delete(id),db)}
async function getAllRecords(){const db=await openDatabase();return requestResult(db.transaction(STORE,'readonly').objectStore(STORE).getAll(),db).then(v=>Array.isArray(v)?v:[])}

function compareNatural(a,b){return String(a??'').localeCompare(String(b??''),'pt-BR',{numeric:true,sensitivity:'base'})}
function compareEntries(a,b){const byBlock=compareNatural(a.block,b.block);if(byBlock)return byBlock;const byApartment=compareNatural(a.apartment,b.apartment);if(byApartment)return byApartment;return compareNatural(a.date,b.date)}
function sortEntries(){tags.sort(compareEntries);changes.sort(compareEntries)}

function currentPayload(){
 sortEntries();
 return {id:currentDraftId||newId(),type,title:$('reportTitle').value.trim()||(type==='tags'?'Rateio Tags':'Taxa de Mudança'),
  reportDate:$('reportDate').value||today,scanMode:document.querySelector('input[name="rateioScanMode"]:checked')?.value||'color',cleanLevel:Number($('rateioCleanLevel').value),tags:structuredClone(tags),changes:structuredClone(changes),scans:structuredClone(scans),
 updatedAt:new Date().toISOString(),createdAt:null};
}
async function saveCurrent(manual=false){
 const r=currentPayload();
 if(!r.createdAt){const old=currentDraftId?await getRecord(currentDraftId):null;r.createdAt=old?.createdAt||r.updatedAt}
 await saveRecord(r);
 currentDraftId=r.id;
 if(manual){try{await renderDrafts()}catch(e){console.warn('Rascunho salvo, mas a lista não pôde ser atualizada.',e)}}
 $('feedback').textContent=manual?'✓ Rascunho salvo.':'Salvo neste aparelho';
 return r;
}
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveCurrent(false).catch(console.error),500)}
function rateioTypeLabel(value){return value==='mudancas'?'🚚 Taxa de Mudança':'🏷️ Rateio Tags'}
function recordQuantity(r){const entries=r.type==='tags'?(r.tags||[]):(r.changes||[]);const docs=(r.scans||[]).length;return `${entries.length} ${entries.length===1?'lançamento':'lançamentos'}${docs?` · ${docs} ${docs===1?'documento':'documentos'}`:''}`}
async function renderDrafts(){
 const all=(await getAllRecords()).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
 $('draftsList').innerHTML=all.length?all.map(r=>{const date=r.reportDate?new Date(r.reportDate+'T12:00:00').toLocaleDateString('pt-BR'):'Sem data';return `<div class="saved-record"><button class="saved-record-main" data-load-draft="${r.id}"><span class="record-type">${rateioTypeLabel(r.type)}</span><strong>${esc(r.title)}</strong><small>📅 ${date} · ${recordQuantity(r)}</small><small class="record-updated">Atualizado ${new Date(r.updatedAt).toLocaleString('pt-BR')}</small></button><button class="report-delete" data-delete-draft="${r.id}" aria-label="Excluir relatório">×</button></div>`}).join(''):'<p class="dialog-hint">Nenhum relatório salvo.</p>';
}
function render(){
 $('tagsForm').hidden=type!=='tags';$('changesForm').hidden=type!=='mudancas';
 document.querySelectorAll('.rateio-type').forEach(b=>b.classList.toggle('active',b.dataset.type===type));
 $('tagsTable').innerHTML=tags.length?`<table><thead><tr><th>Bloco</th><th>Apartamento</th><th>Tipo de Tag</th><th>Quantidade</th><th></th></tr></thead><tbody>${tags.map((x,i)=>`<tr><td>${esc(x.block)}</td><td>${esc(x.apartment)}</td><td>${x.type==='pedestre'?'Pedestre':'Veículo'}</td><td>${x.qty}</td><td><button class="remove-row" data-remove-tag="${i}">×</button></td></tr>`).join('')}</tbody></table>`:'<p class="hint">Nenhum lançamento adicionado.</p>';
 $('changesTable').innerHTML=changes.length?`<table><thead><tr><th>Bloco</th><th>Apartamento</th><th>Data da mudança</th><th>Tipo</th><th></th></tr></thead><tbody>${changes.map((x,i)=>`<tr><td>${esc(x.block)}</td><td>${esc(x.apartment)}</td><td>${new Date(x.date+'T12:00:00').toLocaleDateString('pt-BR')}</td><td>${x.type==='entrada'?'Entrada':'Saída'}</td><td><button class="remove-row" data-remove-change="${i}">×</button></td></tr>`).join('')}</tbody></table>`:'<p class="hint">Nenhum lançamento adicionado.</p>';
 $('scansList').innerHTML=scans.map((x,i)=>`<div class="scan-thumb"><img src="${x.src}"><span>${esc(x.name)}</span><button data-remove-scan="${i}">Remover</button></div>`).join('');
 $('scanCount').textContent=`${scans.length} documentos`;
}
function resetDraft(kind=type){
 type=kind; currentDraftId=null; tags=[];changes=[];scans=[];
 $('reportTitle').value=type==='tags'?'Rateio Tags':'Taxa de Mudança';$('reportDate').value=today;$('changeDate').value=today;render();
}
async function loadDraft(id){
 const r=await getRecord(id);if(!r)return;
  type=r.type;currentDraftId=r.id;tags=Array.isArray(r.tags)?r.tags:[];changes=Array.isArray(r.changes)?r.changes:[];sortEntries();scans=Array.isArray(r.scans)?r.scans:[];const mode=document.querySelector(`input[name="rateioScanMode"][value="${r.scanMode||'color'}"]`);if(mode)mode.checked=true;$('rateioCleanLevel').value=r.cleanLevel??55;$('rateioCleanValue').textContent=`${$('rateioCleanLevel').value}%`;
 $('reportTitle').value=r.title|| (type==='tags'?'Rateio Tags':'Taxa de Mudança');$('reportDate').value=r.reportDate||today;render();$('feedback').textContent='✓ Rascunho aberto para edição.';
}
document.querySelectorAll('.rateio-type').forEach(b=>b.onclick=async()=>{if(type!==b.dataset.type){type=b.dataset.type;currentDraftId=null;tags=[];changes=[];scans=[];$('reportTitle').value=type==='tags'?'Rateio Tags':'Taxa de Mudança';render();}});
$('saveDraftButton').onclick=()=>saveCurrent(true).catch(e=>{console.error(e);alert('Não foi possível salvar o rascunho: '+(e?.message||e))}); $('viewDraftsButton').onclick=async()=>{try{await renderDrafts();$('draftsDialog').showModal()}catch(e){console.error(e);alert('Não foi possível abrir os rascunhos: '+(e?.message||e))}}; $('closeDraftsButton').onclick=()=>$('draftsDialog').close();
$('newDraftButton').onclick=()=>{if((tags.length||changes.length||scans.length)&&!confirm('Criar um novo rascunho? O atual continuará salvo.'))return;resetDraft(type);$('feedback').textContent='Novo rascunho criado.'};
$('addTag').onclick=()=>{let block=$('tagBlock').value.trim(),ap=$('tagApartment').value.trim(),qty=Number($('tagQty').value);if(!block||!ap||!qty)return alert('Informe bloco, apartamento e quantidade.');tags.push({block,apartment:ap,type:$('tagType').value,qty});sortEntries();$('tagBlock').value='';$('tagApartment').value='';$('tagQty').value=1;render();scheduleSave()};
$('addChange').onclick=()=>{let block=$('changeBlock').value.trim(),ap=$('changeApartment').value.trim(),date=$('changeDate').value;if(!block||!ap||!date)return alert('Informe bloco, apartamento e data.');changes.push({block,apartment:ap,date,type:$('changeType').value});sortEntries();$('changeBlock').value='';$('changeApartment').value='';render();scheduleSave()};
['reportTitle','reportDate'].forEach(id=>$(id).addEventListener('input',scheduleSave));
document.addEventListener('click',async e=>{
 let i=e.target.dataset.removeTag;if(i!==undefined){tags.splice(i,1);render();scheduleSave();return}
 i=e.target.dataset.removeChange;if(i!==undefined){changes.splice(i,1);render();scheduleSave();return}
 i=e.target.dataset.removeScan;if(i!==undefined){scans.splice(i,1);render();scheduleSave();return}
 const load=e.target.dataset.loadDraft;if(load!==undefined){if((tags.length||changes.length||scans.length)&&!confirm('Abrir outro rascunho? O atual já está salvo automaticamente.'))return;await loadDraft(load);$('draftsDialog').close();return}
 const del=e.target.dataset.deleteDraft;if(del!==undefined){if(confirm('Excluir este rascunho?')){await deleteRecord(del);if(currentDraftId===del)resetDraft(type);await renderDrafts();}}
});
async function loadFiles(files){const mode=document.querySelector('input[name="rateioScanMode"]:checked')?.value||'color',level=Number($('rateioCleanLevel').value);for(const file of files){$('feedback').textContent='Processando documento…';try{const result=await fileToData(file,mode,level);scans.push({name:file.name||'Documento',src:result.src,mode:result.mode})}catch(e){console.error(e);alert('Não foi possível processar uma imagem.')}}$('feedback').textContent=scans.length?'✓ Documento(s) adicionado(s).':'';render();scheduleSave()}
$('cameraInput').addEventListener('change',e=>{loadFiles(e.target.files);e.target.value=''});$('galleryInput').addEventListener('change',e=>{loadFiles(e.target.files);e.target.value=''});
function processRateioCanvas(c,mode,level){if(mode==='color')return c;const ctx=c.getContext('2d'),d=ctx.getImageData(0,0,c.width,c.height),o=ctx.createImageData(c.width,c.height);for(let i=0;i<d.data.length;i+=4){const y=.299*d.data[i]+.587*d.data[i+1]+.114*d.data[i+2];const v=mode==='gray'?Math.min(255,Math.max(0,(y-128)*(1.15+level*.003)+128)):(y<128-(level-50)*.55?0:255);o.data[i]=o.data[i+1]=o.data[i+2]=v;o.data[i+3]=255}ctx.putImageData(o,0,0);return c}
function fileToData(file,mode='color',level=55){return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(r.error);r.onload=()=>{const img=new Image();img.onerror=()=>reject(new Error('Imagem inválida'));img.onload=()=>{let w=img.naturalWidth,h=img.naturalHeight,max=1920;if(Math.max(w,h)>max){let k=max/Math.max(w,h);w=Math.round(w*k);h=Math.round(h*k)}let c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);resolve({src:processRateioCanvas(c,mode,level).toDataURL('image/jpeg',.88),mode})};img.src=r.result};r.readAsDataURL(file)})}
document.querySelectorAll('input[name="rateioScanMode"]').forEach(r=>r.addEventListener('change',()=>{scheduleSave();$('feedback').textContent='Modo de tratamento alterado para os próximos documentos.'}));
$('rateioCleanLevel').addEventListener('input',()=>{$('rateioCleanValue').textContent=`${$('rateioCleanLevel').value}%`;scheduleSave()});
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function wrapText(ctx,text,maxWidth){const words=String(text??'').split(/\s+/);const lines=[];let line='';for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width<=maxWidth||!line)line=next;else{lines.push(line);line=word}}if(line)lines.push(line);return lines}
async function imageToPage(src,title){const img=new Image();await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src=src});const canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;const g=canvas.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,1240,1754);g.fillStyle='#1e2e38';g.font='bold 24px Arial';g.fillText(title,60,70);const scale=Math.min(1120/img.naturalWidth,1500/img.naturalHeight);const w=img.naturalWidth*scale,h=img.naturalHeight*scale;g.drawImage(img,60+(1120-w)/2,110,w,h);return canvas.toDataURL('image/jpeg',.9)}
async function rateioOfflinePdf(c,rows,heads,total){if(!window.BlexoOfflinePdf)throw new Error('Gerador offline de PDF indisponível. Reabra o aplicativo para atualizar os arquivos.');const pages=[];const make=()=>{const x=document.createElement('canvas');x.width=1240;x.height=1754;const g=x.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,1240,1754);g.fillStyle=c.rateioHeaderColor||'#123047';g.fillRect(0,0,1240,130);g.fillStyle='#fff';g.font='bold 34px Arial';g.fillText(c.rateioHeaderName||'Blexo-Rateio',60,82);g.fillStyle='#1e2e38';g.font='bold 30px Arial';g.fillText($('reportTitle').value||'Rateio',60,190);g.font='22px Arial';g.fillText(new Date(($('reportDate').value||today)+'T12:00:00').toLocaleDateString('pt-BR'),60,225);return {x,g,y:285}};let p=make();const widths=[150,170,270,170,330];p.g.font='bold 17px Arial';let x=60;heads.forEach((h,i)=>{p.g.fillText(h,x,p.y);x+=widths[i]});p.y+=38;p.g.font='17px Arial';for(const row of rows){const lineHeight=24;const lines=Math.max(...row.map((v,i)=>wrapText(p.g,v,widths[i]-10).length));const height=Math.max(32,lines*lineHeight+8);if(p.y+height>1630){pages.push(p.x.toDataURL('image/jpeg',.9));p=make();p.g.font='17px Arial'}x=60;row.forEach((v,i)=>{const ls=wrapText(p.g,v,widths[i]-10);ls.forEach((line,j)=>p.g.fillText(line,x,p.y+22+j*lineHeight));x+=widths[i]});p.g.strokeStyle='#d9e0e4';p.g.strokeRect(60,p.y,1090,height);p.y+=height}p.g.font='bold 24px Arial';p.g.fillText(`TOTAL: ${money(total)}`,60,Math.min(p.y+40,1680));pages.push(p.x.toDataURL('image/jpeg',.9));for(const scan of scans)pages.push(await imageToPage(scan.src,'DOCUMENTO DIGITALIZADO'));return pages}
async function generateRateioPdf(){
 const c=cfg(), entries=type==='tags'?tags:changes;
 if(!entries.length)throw new Error('Adicione pelo menos um lançamento.');
 sortEntries();
 await saveCurrent(false);
 const ordered=(type==='tags'?tags:changes).slice().sort(compareEntries);
 const heads=type==='tags'?['Bloco','Apartamento','Tipo de Tag','Quantidade','Valor']:['Bloco','Apartamento','Data da mudança','Tipo','Valor'];
 const rows=ordered.map(x=>type==='tags'
  ? [x.block,x.apartment,x.type==='pedestre'?'Pedestre':'Veículo',x.qty,money(Number(x.qty||0)*(x.type==='pedestre'?c.tagPedestreValue:c.tagVeiculoValue))]
  : [x.block,x.apartment,new Date(x.date+'T12:00:00').toLocaleDateString('pt-BR'),x.type==='entrada'?'Entrada':'Saída',money(x.type==='entrada'?c.mudancaEntradaValue:c.mudancaSaidaValue)]);
 const total=ordered.reduce((sum,x)=>sum+(type==='tags'?Number(x.qty||0)*(x.type==='pedestre'?Number(c.tagPedestreValue||0):Number(c.tagVeiculoValue||0)):(x.type==='entrada'?Number(c.mudancaEntradaValue||0):Number(c.mudancaSaidaValue||0))),0);
 const name=($('reportTitle').value||'rateio').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase()+'.pdf';
 const offline=async()=>{const pages=await rateioOfflinePdf(c,rows,heads,total);window.BlexoOfflinePdf(pages,name);return '✓ PDF gerado com sucesso. Rascunho mantido para edição.'};
 if(!window.jspdf?.jsPDF)return offline();
 try{
  const {jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'a4'}),color=(c.rateioHeaderColor||'#123047').replace('#','');
  const rgb=[0,1,2].map(i=>parseInt(color.slice(i*2,i*2+2),16)||0);
  const widths=[25,32,52,32,40]; let y=0;
  const drawHeader=()=>{doc.setFillColor(...rgb);doc.rect(0,0,210,22,'F');doc.setTextColor(255,255,255);doc.setFontSize(16);doc.text(c.rateioHeaderName||'Blexo-Rateio',12,14);doc.setTextColor(30,40,48);doc.setFontSize(16);doc.text($('reportTitle').value||'Rateio',12,34);doc.setFontSize(10);doc.text(new Date(($('reportDate').value||today)+'T12:00:00').toLocaleDateString('pt-BR'),12,41);y=50;doc.setFontSize(9);let x=12;heads.forEach((h,i)=>{doc.setFillColor(238,242,245);doc.rect(x,y,widths[i],8,'F');doc.setTextColor(20,30,35);doc.text(h,x+2,y+5);x+=widths[i]});y+=8};
  drawHeader();
  for(const row of rows){
   doc.setFontSize(8.5);
   const values=row.map(String);
   const lineSets=values.map((v,i)=>doc.splitTextToSize(v,widths[i]-3));
   const lineCount=Math.max(...lineSets.map(lines=>lines.length));
   const rowHeight=Math.max(8,lineCount*4.2+2);
   if(y+rowHeight>282){doc.addPage();drawHeader();}
   let x=12;lineSets.forEach((lines,i)=>{doc.setTextColor(30,40,48);doc.text(lines,x+2,y+4.5);doc.rect(x,y,widths[i],rowHeight);x+=widths[i]});
   y+=rowHeight;
  }
  if(y>270){doc.addPage();y=18;}
  doc.setFontSize(11);doc.setTextColor(20,30,35);doc.text(`TOTAL: ${money(total)}`,12,y+10);y+=20;
  if(scans.length){
   if(y>245){doc.addPage();y=18;}
   doc.setFontSize(14);doc.text('DOCUMENTOS DIGITALIZADOS',12,y);y+=8;
   for(const scan of scans){
    if(!scan?.src)continue;
    const props=doc.getImageProperties(scan.src),ratio=props.width/props.height,w=180,h=Math.min(230,w/ratio);
    if(y+h>280){doc.addPage();y=18;}
    doc.addImage(scan.src,'JPEG',15,y,w,h);y+=h+8;
   }
  }
  doc.save(name);
  return '✓ PDF gerado com sucesso. Rascunho mantido para edição.';
 }catch(error){
  console.warn('Blexo Rateios: jsPDF falhou, usando gerador local.',error);
  if(window.BlexoOfflinePdf)return offline();
  throw error;
 }
}
$('generateButton').onclick=async()=>{const button=$('generateButton');button.disabled=true;$('feedback').textContent='Gerando PDF…';try{$('feedback').textContent=await generateRateioPdf()}catch(e){console.error('Blexo Rateios PDF:',e);$('feedback').textContent=`Falha ao gerar PDF: ${e?.message||'erro desconhecido'}`}finally{button.disabled=false}};
window.addEventListener('online',()=>$('offlineStatus').textContent='● Online');window.addEventListener('offline',()=>$('offlineStatus').textContent='● Offline');
(async()=>{const all=(await getAllRecords()).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));const last=all[0];if(last)await loadDraft(last.id);else resetDraft('tags')})().catch(e=>{console.error(e);resetDraft('tags')});