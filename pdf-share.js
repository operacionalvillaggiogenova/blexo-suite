(function(){
  let blob=null, file=null, name='';
  function $(id){return document.getElementById(id)}
  function reset(){blob=null;file=null;name=''; const s=$('savePdfButton'),h=$('sharePdfButton'); if(s)s.disabled=true;if(h)h.disabled=true;}
  function setPdf(nextBlob,nextName,meta={}){
    blob=nextBlob; name=nextName||'blexo-check.pdf';
    try{file=new File([blob],name,{type:'application/pdf'})}catch{file=null}
    const s=$('savePdfButton'),h=$('sharePdfButton'); if(s)s.disabled=false;if(h)h.disabled=false;
    return {subject:meta.subject||name,text:meta.text||''};
  }
  function save(){
    if(!blob){const f=$('feedback');if(f)f.textContent='Gere o PDF antes de salvar.';return}
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
    const f=$('feedback');if(f)f.textContent='PDF salvo/baixado.';
  }
  async function share(meta={}){
    if(!blob){const f=$('feedback');if(f)f.textContent='Gere o PDF antes de enviar.';return}
    const subject=meta.subject||name, text=meta.text||`Segue o arquivo “${subject}”.`;
    try{
      if(file&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({files:[file],title:subject,text});const f=$('feedback');if(f)f.textContent='Compartilhamento aberto.';return}
      save();
      window.location.href=`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text+'\n\nO PDF foi salvo no aparelho. Anexe o arquivo '+name+' a esta mensagem.')}`;
    }catch(err){
      if(err?.name==='AbortError'){const f=$('feedback');if(f)f.textContent='Compartilhamento cancelado.';return}
      console.error('Blexo compartilhamento:',err);const f=$('feedback');if(f)f.textContent=`Não foi possível compartilhar: ${err?.message||'erro desconhecido'}`;
    }
  }
  window.BlexoPdfActions={reset,setPdf,save,share};
  window.addEventListener('DOMContentLoaded',()=>{reset();const s=$('savePdfButton'),h=$('sharePdfButton');if(s)s.onclick=save;if(h)h.onclick=()=>{const fn=typeof window.blexoShareMeta==='function'?window.blexoShareMeta():{};share(fn)}});
})();
