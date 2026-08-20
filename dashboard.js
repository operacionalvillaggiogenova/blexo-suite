function $(id){return document.getElementById(id)}
function setOnlineStatus(){const online=navigator.onLine;$('offlineStatus').textContent=online?'● Online':'● Offline';$('offlineStatus').classList.toggle('offline',!online)}
function renderSettings(){const c=blexoConfig();$('watermark').checked=c.watermark;$('photoTemplate').value=c.photoTemplate;$('blockCount').value=c.blockCount;$('commonAreas').value=(c.commonAreas||[]).join('\n');$('enableGas').checked=c.enableGas;$('enableWater').checked=c.enableWater;$('sealConfig').value=c.sealConfig;$('checkHeaderColor').value=c.checkHeaderColor;$('leituristaHeaderColor').value=c.leituristaHeaderColor;$('scannerHeaderColor').value=c.scannerHeaderColor;$('checkHeaderName').value=c.checkHeaderName||'Blexo-Check';$('leituristaHeaderName').value=c.leituristaHeaderName||'Blexo-Check';$('scannerHeaderName').value=c.scannerHeaderName||'Blexo-Check';$('checkHeaderColorValue').textContent=c.checkHeaderColor||'#123047';$('leituristaHeaderColorValue').textContent=c.leituristaHeaderColor||'#123047';$('scannerHeaderColorValue').textContent=c.scannerHeaderColor||'#123047';if($('googleClientId')){$('googleDriveFolder').value=c.googleDriveFolder||'Blexo Suite';$('googleStatus').textContent=localStorage.getItem('blexo-google-status')||'Não conectado.'}}
$('settingsButton').onclick=()=>{$('settingsDialog').showModal();renderSettings()}
$('saveSettings').onclick=()=>{saveBlexoConfig({watermark:$('watermark').checked,photoTemplate:$('photoTemplate').value,blockCount:Math.max(0,Math.min(200,Number($('blockCount').value)||0)),commonAreas:$('commonAreas').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),enableGas:$('enableGas').checked,enableWater:$('enableWater').checked,sealConfig:$('sealConfig').value.trim()||BLEXO_DEFAULT_CONFIG.sealConfig,checkHeaderColor:$('checkHeaderColor').value,leituristaHeaderColor:$('leituristaHeaderColor').value,scannerHeaderColor:$('scannerHeaderColor').value,checkHeaderName:$('checkHeaderName').value.trim()||BLEXO_DEFAULT_CONFIG.checkHeaderName,leituristaHeaderName:$('leituristaHeaderName').value.trim()||BLEXO_DEFAULT_CONFIG.leituristaHeaderName,scannerHeaderName:$('scannerHeaderName').value.trim()||BLEXO_DEFAULT_CONFIG.scannerHeaderName,googleClientId:'212427726646-vmf3c5qfmfvln3agbrtk8mo25iogs9o9.apps.googleusercontent.com',googleDriveFolder:$('googleDriveFolder')?.value.trim()||'Blexo Suite'});$('storageStatus').textContent='Configurações salvas neste aparelho.'}
$('resetSettings').onclick=()=>{resetBlexoConfig();renderSettings()}
window.addEventListener('online',setOnlineStatus);window.addEventListener('offline',setOnlineStatus);setOnlineStatus();$('storageStatus').textContent='Uso offline disponível após o primeiro carregamento.';['checkHeaderColor','leituristaHeaderColor','scannerHeaderColor'].forEach(id=>$(id).addEventListener('input',e=>$(id+'Value').textContent=e.target.value.toUpperCase()))
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{})


function blexoUpdateGoogleUI(){
  const btn=$('globalGoogleButton');
  const status=localStorage.getItem('blexo-google-email');
  if(btn){
    if(status){
      btn.textContent='✓ Google Drive conectado';
      btn.classList.add('connected');
      btn.title='Clique para conectar ou renovar a autorização';
    }else{
      btn.textContent='☁️ Conectar Google Drive';
      btn.classList.remove('connected');
      btn.title='Entrar com Google e autorizar o Blexo Suite';
    }
  }
  if($('googleStatus')) $('googleStatus').textContent=status||'Não conectado.';
}
if($('globalGoogleButton')){
  $('globalGoogleButton').onclick=async()=>{
    const btn=$('globalGoogleButton');
    const original=btn.textContent;
    btn.disabled=true;
    btn.textContent='Conectando...';
    try{
      await blexoConnectGoogle();
      localStorage.setItem('blexo-google-email','Google Drive conectado');
      blexoUpdateGoogleUI();
    }catch(e){
      alert('Não foi possível conectar ao Google: '+e.message);
      blexoUpdateGoogleUI();
    }finally{
      btn.disabled=false;
      if(!localStorage.getItem('blexo-google-email')) btn.textContent=original;
    }
  };
}
blexoUpdateGoogleUI();
