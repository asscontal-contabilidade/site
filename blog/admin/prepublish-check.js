(() => {
  if(!document.querySelector('script[data-quality-score-loader]')){
    const qualityScript=document.createElement('script');
    qualityScript.src='quality-score.js';
    qualityScript.dataset.qualityScoreLoader='1';
    document.head.appendChild(qualityScript);
  }

  const saveBtn=document.getElementById('save');
  const statusInput=document.getElementById('status');
  if(!saveBtn||!statusInput||document.getElementById('prepublishCheckStyle'))return;

  const style=document.createElement('style');
  style.id='prepublishCheckStyle';
  style.textContent=`
    .prepublish-modal{position:fixed;inset:0;z-index:10150;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.62);backdrop-filter:blur(6px);font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
    .prepublish-card{width:min(760px,100%);max-height:min(88vh,820px);display:flex;flex-direction:column;overflow:hidden;border:1px solid #dbe4ec;border-radius:20px;background:#fff;box-shadow:0 28px 80px rgba(15,23,42,.32)}
    .prepublish-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:22px 24px 18px;border-bottom:1px solid #edf2f7}.prepublish-head h2{margin:0;color:#0b2545;font-size:23px}.prepublish-head p{margin:5px 0 0;color:#64748b;font-size:12px;line-height:1.5}.prepublish-close{width:36px;height:36px;border:0;border-radius:10px;background:#f1f5f9;color:#475569;font-size:20px;cursor:pointer}
    .prepublish-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:16px 24px;border-bottom:1px solid #edf2f7;background:#f8fbfd}.prepublish-summary div{padding:12px;border:1px solid #e2e8f0;border-radius:11px;background:#fff;text-align:center}.prepublish-summary strong,.prepublish-summary span{display:block}.prepublish-summary strong{color:#0b2545;font-size:21px}.prepublish-summary span{margin-top:2px;color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
    .prepublish-body{padding:18px 24px;overflow:auto}.prepublish-list{display:grid;gap:8px}.prepublish-item{display:grid;grid-template-columns:30px minmax(0,1fr);gap:10px;align-items:start;padding:11px 12px;border:1px solid #e2e8f0;border-radius:11px;background:#fff}.prepublish-icon{width:26px;height:26px;display:grid;place-items:center;border-radius:50%;font-size:12px;font-weight:900}.prepublish-item.good .prepublish-icon{background:#dcfce7;color:#166534}.prepublish-item.warn .prepublish-icon{background:#fef3c7;color:#92400e}.prepublish-item.bad .prepublish-icon{background:#fee2e2;color:#991b1b}.prepublish-item strong{display:block;color:#0f172a;font-size:12px}.prepublish-item small{display:block;margin-top:3px;color:#64748b;font-size:11px;line-height:1.4}
    .prepublish-note{margin-top:13px;padding:10px 12px;border-radius:10px;background:#eff6ff;color:#1e3a8a;font-size:11px;line-height:1.45}.prepublish-actions{display:flex;justify-content:flex-end;gap:9px;padding:16px 24px;border-top:1px solid #edf2f7;background:#fff}.prepublish-actions .btn{padding:10px 14px}.prepublish-actions .continue{background:#0077b6;color:#fff;border-color:#0077b6}.prepublish-actions .continue:hover{background:#00679e}
    @media(max-width:650px){.prepublish-modal{padding:8px}.prepublish-card{max-height:96vh;border-radius:14px}.prepublish-head,.prepublish-body,.prepublish-actions{padding-left:16px;padding-right:16px}.prepublish-summary{padding:12px 16px;grid-template-columns:1fr 1fr}.prepublish-summary div:last-child{grid-column:1/-1}.prepublish-actions{display:grid;grid-template-columns:1fr}.prepublish-actions .btn{width:100%}}
  `;
  document.head.appendChild(style);

  let bypass=false;

  function value(id){return String(document.getElementById(id)?.value||'').trim()}
  function contentBox(){const box=document.createElement('div');box.innerHTML=document.getElementById('content')?.innerHTML||'';return box}
  function wordCount(text){const t=String(text||'').replace(/\s+/g,' ').trim();return t?t.split(' ').filter(Boolean).length:0}
  function isPlaceholder(src){return !src||/placeholder\.svg/i.test(src)}
  function hasCover(){const src=String(document.getElementById('coverPreview')?.src||'');return !isPlaceholder(src)}
  function socialImageOk(){const s=value('seoImage');return !s||(!/^data:/i.test(s)&&!/^blob:/i.test(s))}

  function buildChecks(){
    const box=contentBox();
    const text=String(box.textContent||'').replace(/\s+/g,' ').trim();
    const words=wordCount(text);
    const title=value('title');
    const slug=value('slug');
    const summary=value('summary');
    const category=value('category');
    const tags=value('tags');
    const seoT=value('seoTitle');
    const seoD=value('seoDescription');
    const keyword=value('seoKeyword');
    const seoImg=value('seoImage');
    const status=value('status');
    const publishAt=value('publishAt');
    const cover=hasCover();
    const h1Count=box.querySelectorAll('h1').length;
    const h2Count=box.querySelectorAll('h2').length;
    const images=[...box.querySelectorAll('img')];
    const missingAlt=images.filter(img=>!String(img.getAttribute('alt')||'').trim()).length;
    const checks=[];
    const add=(label,state,detail)=>checks.push({label,state,detail});

    add('Título da matéria',title?'good':'bad',title?`${title.length} caracteres.`:'O título é obrigatório para salvar a matéria.');
    add('URL amigável',slug?'good':'warn',slug?`Slug definido: ${slug}`:'O sistema pode gerar a URL pelo título, mas vale conferir antes da publicação.');
    add('Conteúdo',words>=300?'good':words>=120?'warn':'bad',words>=300?`${words} palavras — bom volume para uma matéria informativa.`:`${words} palavras — considere desenvolver um pouco mais o conteúdo.`);
    add('Categoria',category?'good':'bad',category?`Categoria: ${category}.`:'Selecione uma categoria.');
    add('Imagem de capa',cover?'good':'warn',cover?'Capa definida e disponível para cards e compartilhamento.':'Sem capa: o blog poderá usar a imagem padrão.');
    add('Resumo',summary?'good':'warn',summary?`${summary.length} caracteres.`:'O resumo está vazio; os cards podem ficar menos informativos.');

    if(seoT)add('Título SEO',seoT.length>=45&&seoT.length<=60?'good':'warn',`${seoT.length} caracteres; faixa recomendada no editor: 45–60.`);
    else add('Título SEO','warn','Campo vazio; o título da matéria será usado como fallback.');

    if(seoD)add('Meta description',seoD.length>=120&&seoD.length<=160?'good':'warn',`${seoD.length} caracteres; faixa recomendada no editor: 120–160.`);
    else add('Meta description','warn','Campo vazio; o sistema gera uma descrição automática a partir do conteúdo.');

    add('Palavra-chave principal',keyword?'good':'warn',keyword?`Definida como “${keyword}”.`:'Não definida; use a sugestão do Assistente de SEO se desejar.');
    add('Imagem social',!socialImageOk()?'bad':seoImg?'good':cover?'good':'warn',!socialImageOk()?'A imagem social está em Base64/Blob e deve ser removida ou regenerada.':seoImg?'Imagem social personalizada definida.':cover?'A capa será usada automaticamente no compartilhamento.':'Sem imagem social específica ou capa.');
    add('Tags',tags?'good':'warn',tags?'Tags preenchidas.':'Nenhuma tag cadastrada; elas ajudam na organização e relacionamento entre conteúdos.');

    if(h1Count)add('Hierarquia de títulos','warn',`Há ${h1Count} H1 dentro do conteúdo. A página já usa o título da matéria como H1; prefira H2 e H3 no corpo.`);
    else if(words>=350&&h2Count===0)add('Hierarquia de títulos','warn','Conteúdo longo sem H2. Dividir em subtítulos melhora leitura e escaneabilidade.');
    else add('Hierarquia de títulos','good',h2Count?`${h2Count} subtítulo${h2Count===1?'':'s'} H2 encontrado${h2Count===1?'':'s'}.`:'Estrutura sem H1 duplicado.');

    if(images.length)add('Texto alternativo das imagens',missingAlt===0?'good':'warn',missingAlt===0?`${images.length} imagem${images.length===1?'':'ns'} com ALT preenchido.`:`${missingAlt} de ${images.length} imagem${images.length===1?'':'ns'} sem texto ALT.`);

    if(status==='scheduled')add('Agendamento',publishAt?'good':'bad',publishAt?`Publicação programada para ${new Date(publishAt).toLocaleString('pt-BR')}.`:'Informe a data e a hora da publicação agendada.');

    return checks;
  }

  function closeModal(){document.getElementById('prepublishModal')?.remove();document.documentElement.style.removeProperty('overflow')}

  function continueSave(){
    closeModal();
    bypass=true;
    saveBtn.click();
    bypass=false;
  }

  function openModal(){
    closeModal();
    const checks=buildChecks();
    const good=checks.filter(x=>x.state==='good').length;
    const warn=checks.filter(x=>x.state==='warn').length;
    const bad=checks.filter(x=>x.state==='bad').length;
    const status=value('status');
    const action=status==='scheduled'?'Agendar matéria':'Publicar matéria';

    const modal=document.createElement('div');
    modal.className='prepublish-modal';
    modal.id='prepublishModal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.innerHTML=`
      <div class="prepublish-card">
        <div class="prepublish-head"><div><h2>Checagem final antes de publicar</h2><p>Revise os pontos abaixo. Avisos não impedem a publicação; você pode continuar quando quiser.</p></div><button type="button" class="prepublish-close" aria-label="Fechar">×</button></div>
        <div class="prepublish-summary"><div><strong>${good}</strong><span>Prontos</span></div><div><strong>${warn}</strong><span>Atenção</span></div><div><strong>${bad}</strong><span>Importantes</span></div></div>
        <div class="prepublish-body"><div class="prepublish-list">${checks.map(item=>`<div class="prepublish-item ${item.state}"><span class="prepublish-icon">${item.state==='good'?'✓':item.state==='warn'?'!':'×'}</span><div><strong>${item.label}</strong><small>${item.detail}</small></div></div>`).join('')}</div><div class="prepublish-note">Os campos SEO vazios continuam com os fallbacks automáticos já configurados no blog. Esta checagem serve para revisão editorial e não altera nenhum campo.</div></div>
        <div class="prepublish-actions"><button type="button" class="btn" id="prepublishReview">Voltar e revisar</button><button type="button" class="btn continue" id="prepublishContinue">${action} mesmo assim</button></div>
      </div>`;
    document.body.appendChild(modal);
    document.documentElement.style.overflow='hidden';

    modal.querySelector('.prepublish-close').onclick=closeModal;
    modal.querySelector('#prepublishReview').onclick=closeModal;
    modal.querySelector('#prepublishContinue').onclick=continueSave;
    modal.addEventListener('click',event=>{if(event.target===modal)closeModal()});
    const onKey=event=>{if(event.key==='Escape'){document.removeEventListener('keydown',onKey);closeModal()}};
    document.addEventListener('keydown',onKey);
  }

  saveBtn.addEventListener('click',event=>{
    if(bypass)return;
    const status=value('status');
    if(status==='draft')return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openModal();
  },true);
})();
