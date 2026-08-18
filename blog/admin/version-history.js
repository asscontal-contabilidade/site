(() => {
  if(window.AsscontalVersionHistory)return;

  const MAX_VERSIONS=8;
  const CMS_ORIGIN='https://asscontal-blog-cms.asscontal.workers.dev';
  const FIELDS=['title','slug','summary','content','category','author','tags','status','publishAt','date','cover','seoTitle','seoDescription','seoKeyword','seoImage'];
  let originalServerPost=null;
  let panel=null;
  let historyList=null;
  let historyCount=null;
  let basePoll=null;

  const clone=value=>{
    try{return structuredClone(value)}catch(_){return JSON.parse(JSON.stringify(value))}
  };

  function cleanSeoImage(value){
    const v=String(value||'').trim();
    return /^data:/i.test(v)||/^blob:/i.test(v)?'':v;
  }

  function snapshot(source={}){
    const out={};
    for(const field of FIELDS){
      if(field==='tags')out.tags=Array.isArray(source.tags)?source.tags.map(x=>String(x).trim()).filter(Boolean):String(source.tags||'').split(',').map(x=>x.trim()).filter(Boolean);
      else if(field==='seoImage')out.seoImage=cleanSeoImage(source.seoImage);
      else out[field]=source[field]??'';
    }
    return out;
  }

  function signature(source){
    return JSON.stringify(snapshot(source));
  }

  function existingHistory(source){
    return Array.isArray(source?.history)?source.history.filter(x=>x&&typeof x==='object').map(x=>clone(x)):[];
  }

  function captureOriginal(){
    try{
      if(originalServerPost)return true;
      if(typeof post==='undefined'||!post)return false;
      originalServerPost=clone(post);
      renderHistory();
      return true;
    }catch(_){return false}
  }

  function makeVersionEntry(source){
    const snap=snapshot(source);
    return {
      versionId:(crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`),
      savedAt:source?.updatedAt||source?.date||new Date().toISOString(),
      recordedAt:new Date().toISOString(),
      ...snap
    };
  }

  function historyForSave(nextData){
    captureOriginal();
    const base=originalServerPost||(()=>{try{return typeof post!=='undefined'?post:null}catch(_){return null}})();
    if(!base)return [];

    const history=existingHistory(base).slice(0,MAX_VERSIONS);
    if(signature(base)===signature(nextData))return history;

    const entry=makeVersionEntry(base);
    const entrySig=signature(entry);
    const deduped=history.filter(item=>signature(item)!==entrySig);
    return [entry,...deduped].slice(0,MAX_VERSIONS);
  }

  function formatDate(raw){
    if(!raw)return'Sem data';
    const d=new Date(raw);
    if(Number.isNaN(d.getTime()))return String(raw);
    return d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }

  function statusLabel(value){
    if(value==='published')return'Publicado';
    if(value==='scheduled')return'Agendado';
    return'Rascunho';
  }

  function esc(value){
    return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  function plainHtml(value){
    const box=document.createElement('div');
    box.innerHTML=String(value||'');
    return String(box.textContent||'').replace(/\s+/g,' ').trim();
  }

  function toLocalDateTime(raw){
    if(!raw)return'';
    const d=new Date(raw);
    if(Number.isNaN(d.getTime()))return String(raw).slice(0,16);
    const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
    return local.toISOString().slice(0,16);
  }

  function notify(text,error=false){
    try{if(typeof msg==='function')msg(text,error)}catch(_){ }
  }

  function fire(el,type='input'){
    if(el)el.dispatchEvent(new Event(type,{bubbles:true}));
  }

  function applyVersion(version){
    if(!version)return;
    if(!confirm(`Carregar a versão de ${formatDate(version.savedAt)} no editor?\n\nEla só será aplicada ao site depois que você clicar em “Salvar matéria”.`))return;

    const setValue=(id,value)=>{
      const el=document.getElementById(id);
      if(!el)return;
      el.value=value??'';
      fire(el,'input');
      fire(el,'change');
    };

    setValue('title',version.title);
    setValue('slug',version.slug);
    setValue('summary',version.summary);
    setValue('author',version.author||'Redação Asscontal');
    setValue('tags',Array.isArray(version.tags)?version.tags.join(', '):version.tags||'');
    setValue('seoTitle',version.seoTitle);
    setValue('seoDescription',version.seoDescription);
    setValue('seoKeyword',version.seoKeyword);
    setValue('seoImage',cleanSeoImage(version.seoImage));

    const content=document.getElementById('content');
    if(content){content.innerHTML=version.content||'';fire(content,'input')}

    const category=document.getElementById('category');
    if(category){
      const cat=String(version.category||'').trim();
      if(cat&&!Array.from(category.options).some(o=>o.value===cat))category.add(new Option(cat,cat));
      if(cat)category.value=cat;
      fire(category,'change');
    }

    const status=document.getElementById('status');
    if(status){status.value=version.status||'draft';fire(status,'change')}
    setValue('publishAt',version.status==='scheduled'?toLocalDateTime(version.publishAt):'');

    try{
      if(typeof post!=='undefined'&&post){
        post.cover=version.cover||'assets/img/placeholder.svg';
        post.date=version.date||post.date;
      }
      if(typeof coverFile!=='undefined')coverFile=null;
      if(typeof slugTouched!=='undefined')slugTouched=true;
    }catch(_){ }

    const coverInput=document.getElementById('coverFile');
    if(coverInput)coverInput.value='';
    const coverPreview=document.getElementById('coverPreview');
    if(coverPreview){
      const cover=String(version.cover||'assets/img/placeholder.svg');
      coverPreview.src=/^https?:\/\//i.test(cover)?cover:'../'+cover.replace(/^\.\//,'').replace(/^\.\.\//,'');
    }

    const slugPreview=document.getElementById('slugPreview');
    if(slugPreview)slugPreview.textContent=version.slug||'...';
    try{if(typeof toggleSchedule==='function')toggleSchedule()}catch(_){ }
    try{if(typeof markChanged==='function')markChanged()}catch(_){ }
    window.AsscontalQuality?.refresh?.(true);
    closePreviewModal();
    notify(`Versão de ${formatDate(version.savedAt)} carregada no editor. Revise e clique em “Salvar matéria” para aplicar.`);
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function closePreviewModal(){
    document.getElementById('versionHistoryModal')?.remove();
    document.documentElement.style.removeProperty('overflow');
  }

  function previewVersion(version){
    closePreviewModal();
    const text=plainHtml(version.content);
    const modal=document.createElement('div');
    modal.id='versionHistoryModal';
    modal.className='version-history-modal';
    modal.innerHTML=`
      <div class="version-history-modal-card">
        <div class="version-history-modal-head"><div><strong>Versão de ${esc(formatDate(version.savedAt))}</strong><small>${esc(statusLabel(version.status))} · ${esc(version.category||'Sem categoria')}</small></div><button type="button" aria-label="Fechar">×</button></div>
        <div class="version-history-modal-body">
          <h2>${esc(version.title||'Sem título')}</h2>
          ${version.summary?`<p class="version-history-summary">${esc(version.summary)}</p>`:''}
          <div class="version-history-meta"><span><b>Slug:</b> ${esc(version.slug||'—')}</span><span><b>Autor:</b> ${esc(version.author||'—')}</span><span><b>SEO:</b> ${esc(version.seoTitle||'sem título SEO')}</span></div>
          <div class="version-history-content-preview">${esc(text.slice(0,1800))}${text.length>1800?'…':''}</div>
        </div>
        <div class="version-history-modal-actions"><button type="button" class="btn" data-close>Fechar</button><button type="button" class="btn primary" data-restore>Carregar esta versão no editor</button></div>
      </div>`;
    document.body.appendChild(modal);
    document.documentElement.style.overflow='hidden';
    modal.querySelector('.version-history-modal-head button').onclick=closePreviewModal;
    modal.querySelector('[data-close]').onclick=closePreviewModal;
    modal.querySelector('[data-restore]').onclick=()=>applyVersion(version);
    modal.addEventListener('click',e=>{if(e.target===modal)closePreviewModal()});
  }

  function renderHistory(){
    if(!historyList||!historyCount)return;
    const source=originalServerPost||(()=>{try{return typeof post!=='undefined'?post:null}catch(_){return null}})();
    const history=existingHistory(source);
    historyCount.textContent=String(history.length);

    if(!source){
      historyList.innerHTML='<p class="version-history-empty">Carregando histórico...</p>';
      return;
    }
    if(!source.id){
      historyList.innerHTML='<p class="version-history-empty">O histórico começa depois que a matéria for salva pela primeira vez.</p>';
      return;
    }
    if(!history.length){
      historyList.innerHTML='<p class="version-history-empty">Ainda não há versões anteriores. A próxima alteração salva criará a primeira cópia de segurança.</p>';
      return;
    }

    historyList.innerHTML=history.map((version,index)=>`
      <div class="version-history-item" data-version-index="${index}">
        <div class="version-history-item-top"><span class="version-history-dot"></span><div><b>${esc(formatDate(version.savedAt))}</b><small>${esc(statusLabel(version.status))} · ${esc(version.title||'Sem título')}</small></div></div>
        <div class="version-history-actions"><button type="button" class="btn" data-view>Ver</button><button type="button" class="btn" data-restore>Restaurar</button></div>
      </div>`).join('');

    historyList.querySelectorAll('.version-history-item').forEach(row=>{
      const index=Number(row.dataset.versionIndex);
      const version=history[index];
      row.querySelector('[data-view]').onclick=()=>previewVersion(version);
      row.querySelector('[data-restore]').onclick=()=>applyVersion(version);
    });
  }

  function setupPanel(){
    if(panel||document.getElementById('versionHistoryPanel'))return;
    const side=document.querySelector('.editor-grid>.side');
    if(!side)return;

    const style=document.createElement('style');
    style.id='version-history-style';
    style.textContent=`
      .version-history-panel{margin:0 0 18px;padding:14px;border:1px solid #d8e5ec;border-radius:14px;background:#fff;box-shadow:0 7px 22px rgba(15,23,42,.05)}
      .version-history-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.version-history-head strong{display:block;color:#0b2545;font-size:13px}.version-history-head p{margin:3px 0 0;color:#64748b;font-size:10px;line-height:1.4}.version-history-count{min-width:26px;height:26px;display:grid;place-items:center;border-radius:999px;background:#eef7fb;color:#0369a1;font-size:11px;font-weight:900}
      .version-history-list{display:grid;gap:8px;margin-top:12px}.version-history-empty{margin:0;padding:10px;border-radius:9px;background:#f8fafc;color:#64748b;font-size:10px;line-height:1.45}.version-history-item{padding:10px;border:1px solid #e2e8f0;border-radius:10px;background:#fbfdff}.version-history-item-top{display:grid;grid-template-columns:8px minmax(0,1fr);gap:8px;align-items:start}.version-history-dot{width:8px;height:8px;margin-top:4px;border-radius:50%;background:#0ea5e9}.version-history-item b,.version-history-item small{display:block}.version-history-item b{color:#334155;font-size:10px}.version-history-item small{margin-top:2px;color:#64748b;font-size:9px;line-height:1.35}.version-history-actions{display:flex;gap:6px;margin-top:8px}.version-history-actions .btn{flex:1;padding:6px 7px;font-size:9px}
      .version-history-note{margin-top:10px;padding-top:9px;border-top:1px solid #edf2f7;color:#94a3b8;font-size:9px;line-height:1.4}
      .version-history-modal{position:fixed;inset:0;z-index:10250;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.64);backdrop-filter:blur(6px)}.version-history-modal-card{width:min(760px,100%);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;border-radius:18px;background:#fff;box-shadow:0 30px 90px rgba(15,23,42,.35)}.version-history-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:20px 22px;border-bottom:1px solid #e5e7eb}.version-history-modal-head strong,.version-history-modal-head small{display:block}.version-history-modal-head strong{color:#0b2545;font-size:17px}.version-history-modal-head small{margin-top:3px;color:#64748b;font-size:11px}.version-history-modal-head button{width:36px;height:36px;border:0;border-radius:9px;background:#f1f5f9;color:#475569;font-size:20px;cursor:pointer}.version-history-modal-body{padding:20px 22px;overflow:auto}.version-history-modal-body h2{margin:0;color:#0b2545;font-size:21px;line-height:1.3}.version-history-summary{margin:8px 0 0;color:#475569;font-size:12px;line-height:1.5}.version-history-meta{display:grid;gap:5px;margin:14px 0;padding:11px;border-radius:10px;background:#f8fafc;color:#64748b;font-size:10px}.version-history-content-preview{padding:14px;border:1px solid #e2e8f0;border-radius:11px;color:#334155;font-size:12px;line-height:1.65;white-space:pre-wrap}.version-history-modal-actions{display:flex;justify-content:flex-end;gap:8px;padding:15px 22px;border-top:1px solid #e5e7eb}.version-history-modal-actions .btn{padding:9px 12px}
      @media(max-width:700px){.version-history-modal{padding:7px}.version-history-modal-card{max-height:96vh;border-radius:13px}.version-history-modal-actions{display:grid;grid-template-columns:1fr}.version-history-modal-actions .btn{width:100%}}
    `;
    document.head.appendChild(style);

    panel=document.createElement('section');
    panel.className='version-history-panel';
    panel.id='versionHistoryPanel';
    panel.innerHTML=`<div class="version-history-head"><div><strong>Histórico de versões</strong><p>Cópias automáticas antes de cada alteração salva.</p></div><span id="versionHistoryCount" class="version-history-count">0</span></div><div id="versionHistoryList" class="version-history-list"></div><div class="version-history-note">Mantemos até ${MAX_VERSIONS} versões anteriores por matéria. Restaurar apenas carrega a versão no editor; nada muda no site até você salvar.</div>`;

    const quality=document.getElementById('articleQualityPanel');
    if(quality?.parentElement===side)quality.insertAdjacentElement('afterend',panel);else side.insertBefore(panel,side.firstChild);
    historyList=document.getElementById('versionHistoryList');
    historyCount=document.getElementById('versionHistoryCount');
    renderHistory();
  }

  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init={}){
    let nextInit=init;
    try{
      const method=String(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
      const rawUrl=typeof input==='string'||input instanceof URL?String(input):input?.url;
      const url=new URL(rawUrl,location.href);
      const isCms=url.origin===new URL(CMS_ORIGIN).origin;
      const isPostWrite=isCms&&((url.pathname==='/posts'&&method==='POST')||(url.pathname.startsWith('/posts/')&&method==='PUT'));
      if(isPostWrite&&typeof init?.body==='string'){
        const body=JSON.parse(init.body);
        if(method==='POST')body.history=[];
        else body.history=historyForSave(body);
        nextInit={...init,body:JSON.stringify(body)};
      }
    }catch(e){console.warn('Histórico de versões: não foi possível preparar a cópia de segurança.',e)}
    return nativeFetch(input,nextInit);
  };

  window.AsscontalVersionHistory={
    maxVersions:MAX_VERSIONS,
    historyForSave,
    render:renderHistory,
    restore:applyVersion,
    getOriginal:()=>clone(originalServerPost)
  };

  setupPanel();
  basePoll=setInterval(()=>{
    setupPanel();
    if(captureOriginal()){
      clearInterval(basePoll);
      basePoll=null;
    }
  },250);
  setTimeout(()=>{captureOriginal();renderHistory()},900);
  setTimeout(()=>{captureOriginal();renderHistory()},1800);
})();
