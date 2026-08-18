(() => {
  if(!document.querySelector('script[data-version-history-loader]')){
    const historyScript=document.createElement('script');
    historyScript.src='version-history.js';
    historyScript.dataset.versionHistoryLoader='1';
    document.head.appendChild(historyScript);
  }

  const seoInput=document.getElementById('seoImage');
  const coverPreview=document.getElementById('coverPreview');
  const coverInput=document.getElementById('coverFile');
  const saveBtn=document.getElementById('save');
  if(!seoInput||!coverPreview)return;

  const TARGET_W=1200;
  const TARGET_H=630;
  const TARGET_RATIO=TARGET_W/TARGET_H;

  const style=document.createElement('style');
  style.id='social-image-tools-style';
  style.textContent=`
    .social-image-panel{margin-top:9px;padding:12px;border:1px solid #dbe7ef;border-radius:12px;background:#f8fbfd}
    .social-image-panel strong{display:block;color:#0b2545;font-size:12px;margin-bottom:3px}
    .social-image-panel p{margin:0;color:#64748b;font-size:11px;line-height:1.45}
    .social-image-status{margin-top:8px;padding:8px 9px;border-radius:9px;background:#fff;border:1px solid #e2e8f0;color:#64748b;font-size:11px;line-height:1.4}
    .social-image-status.good{color:#166534;background:#f0fdf4;border-color:#bbf7d0}
    .social-image-status.warn{color:#92400e;background:#fffbeb;border-color:#fde68a}
    .social-image-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}
    .social-image-actions .btn{padding:9px 10px;font-size:11px}
    .social-image-actions .primary{grid-column:1/-1}
    .social-image-preview{display:none;margin-top:10px;width:100%;aspect-ratio:1200/630;object-fit:cover;border-radius:10px;border:1px solid #dbe7ef;background:#eef2f7}
    .social-image-preview.show{display:block}
    @media(max-width:800px){.social-image-actions{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const label=seoInput.closest('label');
  if(!label)return;

  const panel=document.createElement('div');
  panel.className='social-image-panel';
  panel.innerHTML=`
    <strong>Imagem para WhatsApp, Facebook e LinkedIn</strong>
    <p>Formato recomendado: <b>1200 × 630 px</b> (1,91:1). Se este campo ficar vazio, a capa da matéria será usada automaticamente.</p>
    <div id="socialImageStatus" class="social-image-status">Verificando a imagem de capa...</div>
    <img id="socialImagePreview" class="social-image-preview" alt="Prévia da imagem social 1200 por 630">
    <div class="social-image-actions">
      <button type="button" class="btn primary" id="generateSocialImage">Gerar imagem social 1200 × 630</button>
      <button type="button" class="btn" id="useCoverSocial">Usar capa automaticamente</button>
      <button type="button" class="btn danger" id="clearSocialImage">Limpar imagem social</button>
    </div>
  `;
  label.appendChild(panel);

  const status=panel.querySelector('#socialImageStatus');
  const socialPreview=panel.querySelector('#socialImagePreview');
  const generateBtn=panel.querySelector('#generateSocialImage');
  const useCoverBtn=panel.querySelector('#useCoverSocial');
  const clearBtn=panel.querySelector('#clearSocialImage');

  // Remove o comportamento antigo que podia gravar data:image/base64 no campo SEO.
  const oldBtn=document.getElementById('coverSocialBtn');
  if(oldBtn){
    const replacement=oldBtn.cloneNode(true);
    replacement.textContent='Usar capa como imagem social';
    oldBtn.replaceWith(replacement);
    replacement.addEventListener('click',useCoverAutomatically);
  }

  function notify(text,error=false){
    try{if(typeof msg==='function')msg(text,error)}catch(_){ }
  }

  function changed(){
    seoInput.dispatchEvent(new Event('input',{bubbles:true}));
    try{if(typeof markChanged==='function')markChanged()}catch(_){ }
  }

  function sanitizeSeoValue(showMessage=false){
    const value=String(seoInput.value||'').trim();
    if(/^data:/i.test(value)||/^blob:/i.test(value)){
      seoInput.value='';
      changed();
      if(showMessage)notify('Imagem social em Base64 removida. A capa será usada automaticamente.',false);
      return true;
    }
    return false;
  }

  function useCoverAutomatically(){
    seoInput.value='';
    changed();
    socialPreview.classList.remove('show');
    socialPreview.removeAttribute('src');
    notify('A capa será usada automaticamente como imagem social.');
    updateStatus();
  }

  function clearSocial(){
    seoInput.value='';
    changed();
    socialPreview.classList.remove('show');
    socialPreview.removeAttribute('src');
    notify('Imagem social removida. A capa será usada automaticamente.');
    updateStatus();
  }

  function loadImage(src){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=()=>reject(new Error('Não foi possível carregar a imagem de capa.'));
      img.src=src;
    });
  }

  function canvasBlob(canvas,type='image/jpeg',quality=.9){
    return new Promise((resolve,reject)=>{
      canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Falha ao gerar a imagem social.')),type,quality);
    });
  }

  function cropToSocial(img){
    const sw=img.naturalWidth||img.width;
    const sh=img.naturalHeight||img.height;
    if(!sw||!sh)throw new Error('A imagem de capa não possui dimensões válidas.');

    const sourceRatio=sw/sh;
    let sx=0,sy=0,sWidth=sw,sHeight=sh;

    if(sourceRatio>TARGET_RATIO){
      sWidth=sh*TARGET_RATIO;
      sx=(sw-sWidth)/2;
    }else if(sourceRatio<TARGET_RATIO){
      sHeight=sw/TARGET_RATIO;
      sy=(sh-sHeight)/2;
    }

    const canvas=document.createElement('canvas');
    canvas.width=TARGET_W;
    canvas.height=TARGET_H;
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    ctx.fillStyle='#ffffff';
    ctx.fillRect(0,0,TARGET_W,TARGET_H);
    ctx.drawImage(img,sx,sy,sWidth,sHeight,0,0,TARGET_W,TARGET_H);
    return canvas;
  }

  async function generateSocial(){
    sanitizeSeoValue(false);
    const src=String(coverPreview.currentSrc||coverPreview.src||'').trim();
    if(!src||/placeholder\.svg/i.test(src)){
      notify('Escolha uma imagem de capa antes de gerar a imagem social.',true);
      return;
    }

    generateBtn.disabled=true;
    const originalText=generateBtn.textContent;
    generateBtn.textContent='Gerando 1200 × 630...';

    try{
      const img=await loadImage(src);
      const canvas=cropToSocial(img);
      const blob=await canvasBlob(canvas,'image/jpeg',.9);
      const base=(document.getElementById('slug')?.value||document.getElementById('title')?.value||'materia')
        .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||'materia';
      const file=new File([blob],`${base}-social-1200x630.jpg`,{type:'image/jpeg'});

      if(typeof upload!=='function')throw new Error('Função de upload não disponível no editor.');
      const result=await upload(file);
      if(!result?.path)throw new Error('O upload não retornou o caminho da imagem.');

      seoInput.value=result.path;
      changed();
      socialPreview.src=canvas.toDataURL('image/jpeg',.82);
      socialPreview.classList.add('show');
      status.className='social-image-status good';
      status.textContent=`Imagem social pronta: ${TARGET_W} × ${TARGET_H} px. Arquivo salvo em ${result.path}`;
      notify('Imagem social 1200 × 630 gerada e vinculada à matéria.');
    }catch(e){
      notify(e.message||'Não foi possível gerar a imagem social.',true);
      status.className='social-image-status warn';
      status.textContent=e.message||'Falha ao gerar a imagem social.';
    }finally{
      generateBtn.disabled=false;
      generateBtn.textContent=originalText;
    }
  }

  async function updateStatus(){
    sanitizeSeoValue(false);
    const seo=String(seoInput.value||'').trim();
    if(seo){
      status.className='social-image-status good';
      status.textContent='Imagem social personalizada definida. Para padronizar, use “Gerar imagem social 1200 × 630”.';
      return;
    }

    const src=String(coverPreview.currentSrc||coverPreview.src||'').trim();
    if(!src||/placeholder\.svg/i.test(src)){
      status.className='social-image-status warn';
      status.textContent='Nenhuma capa definida. Escolha uma capa para gerar a imagem social.';
      return;
    }

    try{
      const img=await loadImage(src);
      const w=img.naturalWidth||img.width;
      const h=img.naturalHeight||img.height;
      const ratio=w/h;
      const nearRatio=Math.abs(ratio-TARGET_RATIO)<.035;
      const exact=w===TARGET_W&&h===TARGET_H;
      status.className='social-image-status '+(exact?'good':'warn');
      status.textContent=exact
        ? `Capa já está no padrão ideal: ${w} × ${h} px.`
        : `Capa atual: ${w} × ${h} px${nearRatio?' (proporção próxima do ideal)':''}. Gere uma versão 1200 × 630 para compartilhamento.`;
    }catch(_){
      status.className='social-image-status warn';
      status.textContent='Não foi possível verificar as dimensões da capa.';
    }
  }

  generateBtn.addEventListener('click',generateSocial);
  useCoverBtn.addEventListener('click',useCoverAutomatically);
  clearBtn.addEventListener('click',clearSocial);
  seoInput.addEventListener('input',()=>setTimeout(updateStatus,0));
  coverInput?.addEventListener('change',()=>setTimeout(updateStatus,120));
  coverPreview.addEventListener('load',()=>setTimeout(updateStatus,0));
  saveBtn?.addEventListener('click',()=>sanitizeSeoValue(true),true);

  // Corrige automaticamente valores antigos em Base64 ao abrir o editor.
  if(sanitizeSeoValue(false)){
    notify('Imagem social antiga em Base64 foi removida. Gere uma versão 1200 × 630 ou use a capa automaticamente.');
  }

  setTimeout(updateStatus,500);
})();
