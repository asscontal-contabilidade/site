(() => {
  if(document.getElementById('articleQualityPanel'))return;

  const ids=['title','slug','summary','content','category','author','tags','status','publishAt','seoTitle','seoDescription','seoKeyword','seoImage','coverFile','coverPreview'];
  const els=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
  if(!els.content||!els.title||!els.status)return;

  const style=document.createElement('style');
  style.id='article-quality-style';
  style.textContent=`
    .article-quality{margin:0 0 18px;padding:16px;border:1px solid #d8e5ec;border-radius:15px;background:#fff;box-shadow:0 7px 22px rgba(15,23,42,.05)}
    .article-quality-head{display:flex;align-items:center;gap:14px}.article-quality-score{width:72px;height:72px;flex:0 0 72px;display:grid;place-items:center;border-radius:50%;background:conic-gradient(#0ea5e9 var(--score-angle,0deg),#e2e8f0 0);position:relative}.article-quality-score:after{content:'';position:absolute;inset:6px;border-radius:50%;background:#fff}.article-quality-score span{position:relative;z-index:1;color:#0b2545;font-size:23px;font-weight:900}.article-quality-score small{font-size:10px;color:#64748b;font-weight:800}
    .article-quality-copy{min-width:0}.article-quality-copy strong{display:block;color:#0b2545;font-size:14px}.article-quality-copy b{display:block;margin-top:3px;font-size:12px}.article-quality-copy p{margin:4px 0 0;color:#64748b;font-size:10px;line-height:1.4}
    .article-quality-level.excellent{color:#166534}.article-quality-level.very-good{color:#0369a1}.article-quality-level.good{color:#92400e}.article-quality-level.needs-work{color:#991b1b}
    .article-quality-bars{display:grid;gap:8px;margin-top:14px}.article-quality-row{display:grid;grid-template-columns:72px minmax(0,1fr) 42px;gap:8px;align-items:center}.article-quality-row label{margin:0;color:#475569;font-size:10px;font-weight:800}.article-quality-track{height:7px;border-radius:999px;background:#e8eef3;overflow:hidden}.article-quality-fill{height:100%;border-radius:inherit;background:#0ea5e9;transition:width .2s ease}.article-quality-row span{font-size:10px;color:#64748b;text-align:right;font-weight:800}
    .article-quality-details{margin-top:12px;padding-top:11px;border-top:1px solid #edf2f7}.article-quality-details button{width:100%;padding:7px;border:0;background:transparent;color:#0369a1;font-size:10px;font-weight:850;cursor:pointer}.article-quality-tips{display:none;margin-top:7px}.article-quality-tips.open{display:grid;gap:6px}.article-quality-tip{display:grid;grid-template-columns:18px 1fr;gap:6px;align-items:start;color:#64748b;font-size:10px;line-height:1.35}.article-quality-tip i{width:16px;height:16px;display:grid;place-items:center;border-radius:50%;font-style:normal;font-size:9px;font-weight:900}.article-quality-tip.good i{background:#dcfce7;color:#166534}.article-quality-tip.warn i{background:#fef3c7;color:#92400e}.article-quality-tip.bad i{background:#fee2e2;color:#991b1b}
    @media(max-width:800px){.article-quality{margin-bottom:16px}.article-quality-row{grid-template-columns:68px minmax(0,1fr) 40px}}
  `;
  document.head.appendChild(style);

  const side=document.querySelector('.editor-grid>.side');
  if(!side)return;

  const panel=document.createElement('section');
  panel.className='article-quality';
  panel.id='articleQualityPanel';
  panel.innerHTML=`
    <div class="article-quality-head">
      <div id="articleQualityScore" class="article-quality-score" style="--score-angle:0deg"><span>0<small>/100</small></span></div>
      <div class="article-quality-copy"><strong>Qualidade da matéria</strong><b id="articleQualityLevel" class="article-quality-level needs-work">Começando</b><p>Pontuação editorial para ajudar na revisão; não representa nota do Google.</p></div>
    </div>
    <div class="article-quality-bars">
      <div class="article-quality-row"><label>Conteúdo</label><div class="article-quality-track"><div id="qualityContentBar" class="article-quality-fill"></div></div><span id="qualityContentText">0/35</span></div>
      <div class="article-quality-row"><label>SEO</label><div class="article-quality-track"><div id="qualitySeoBar" class="article-quality-fill"></div></div><span id="qualitySeoText">0/30</span></div>
      <div class="article-quality-row"><label>Mídia</label><div class="article-quality-track"><div id="qualityMediaBar" class="article-quality-fill"></div></div><span id="qualityMediaText">0/20</span></div>
      <div class="article-quality-row"><label>Editorial</label><div class="article-quality-track"><div id="qualityEditorialBar" class="article-quality-fill"></div></div><span id="qualityEditorialText">0/15</span></div>
    </div>
    <div class="article-quality-details"><button id="articleQualityToggle" type="button">Ver o que pode melhorar ▾</button><div id="articleQualityTips" class="article-quality-tips"></div></div>
  `;
  side.insertBefore(panel,side.firstChild);

  const $=id=>document.getElementById(id);
  const scoreEl=$('articleQualityScore');
  const levelEl=$('articleQualityLevel');
  const tipsEl=$('articleQualityTips');
  const toggle=$('articleQualityToggle');
  let lastSignature='';
  let timer=null;

  function text(id){return String(document.getElementById(id)?.value||'').trim()}
  function norm(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
  function wordCount(value){const t=String(value||'').replace(/\s+/g,' ').trim();return t?t.split(' ').filter(Boolean).length:0}
  function isPlaceholder(src){return !src||/placeholder\.svg/i.test(src)}
  function hasCover(){return !isPlaceholder(String(els.coverPreview?.currentSrc||els.coverPreview?.src||''))}
  function validSocial(value){const v=String(value||'').trim();return !/^data:/i.test(v)&&!/^blob:/i.test(v)}

  function htmlStats(){
    const box=document.createElement('div');
    box.innerHTML=els.content.innerHTML||'';
    const plain=String(box.textContent||'').replace(/\s+/g,' ').trim();
    const images=[...box.querySelectorAll('img')];
    return {
      plain,
      words:wordCount(plain),
      h1:box.querySelectorAll('h1').length,
      h2:box.querySelectorAll('h2').length,
      h3:box.querySelectorAll('h3').length,
      links:box.querySelectorAll('a[href]').length,
      images:images.length,
      missingAlt:images.filter(img=>!String(img.getAttribute('alt')||'').trim()).length
    };
  }

  function calculate(){
    const stats=htmlStats();
    const title=text('title');
    const slug=text('slug');
    const summary=text('summary');
    const category=text('category');
    const author=text('author');
    const tags=text('tags');
    const status=text('status');
    const publishAt=text('publishAt');
    const seoTitle=text('seoTitle');
    const seoDescription=text('seoDescription');
    const keyword=text('seoKeyword');
    const seoImage=text('seoImage');
    const cover=hasCover();
    const tips=[];
    const addTip=(state,text)=>tips.push({state,text});

    let contentScore=0;
    if(stats.words>=500){contentScore+=15;addTip('good',`${stats.words} palavras: conteúdo com bom desenvolvimento.`)}
    else if(stats.words>=300){contentScore+=13;addTip('good',`${stats.words} palavras: bom volume de conteúdo.`)}
    else if(stats.words>=180){contentScore+=9;addTip('warn',`${stats.words} palavras: pode aprofundar um pouco mais.`)}
    else if(stats.words>=80){contentScore+=5;addTip('warn',`${stats.words} palavras: conteúdo ainda curto.`)}
    else addTip('bad','Conteúdo muito curto; desenvolva melhor a matéria.');

    const headings=stats.h2+stats.h3;
    if(stats.words<220){contentScore+=6}
    else if(headings>=2){contentScore+=8;addTip('good',`${headings} subtítulos ajudam a organizar a leitura.`)}
    else if(headings===1){contentScore+=5;addTip('warn','Adicione mais um subtítulo H2/H3 se houver outro bloco de assunto.')}
    else addTip('warn','Use subtítulos H2/H3 para facilitar a leitura.');

    if(stats.h1===0){contentScore+=4}
    else addTip('warn','Evite H1 dentro do conteúdo; o título da matéria já é o H1 da página.');

    if(stats.links>=2){contentScore+=4}
    else if(stats.links===1){contentScore+=3;addTip('warn','Um link útil foi encontrado; considere outro quando fizer sentido.')}
    else addTip('warn','Inclua links úteis ou relacionados quando fizer sentido.');

    if(stats.images===0){contentScore+=4}
    else if(stats.missingAlt===0){contentScore+=4;addTip('good','As imagens do conteúdo têm texto ALT.')}
    else if(stats.missingAlt<stats.images){contentScore+=2;addTip('warn',`${stats.missingAlt} imagem(ns) ainda sem texto ALT.`)}
    else addTip('warn','Preencha o texto ALT das imagens do conteúdo.');

    let seoScore=0;
    const titleLen=seoTitle.length;
    if(titleLen>=45&&titleLen<=60){seoScore+=7;addTip('good','Título SEO está em uma faixa de tamanho adequada.')}
    else if(seoTitle){seoScore+=5;addTip('warn',`Título SEO com ${titleLen} caracteres; tente aproximar de 45–60.`)}
    else if(title){seoScore+=3;addTip('warn','Título SEO vazio; o título da matéria será usado como fallback.')}

    const descLen=seoDescription.length;
    if(descLen>=120&&descLen<=160){seoScore+=7;addTip('good','Meta description está em uma boa faixa de tamanho.')}
    else if(seoDescription){seoScore+=5;addTip('warn',`Meta description com ${descLen} caracteres; tente aproximar de 120–160.`)}
    else if(summary||stats.plain){seoScore+=3;addTip('warn','Meta description vazia; o sistema usará um fallback automático.')}

    if(keyword){
      const key=norm(keyword),titleSource=norm(title),bodySource=norm(stats.plain);
      if(key&&titleSource.includes(key)&&bodySource.includes(key)){seoScore+=6;addTip('good','Palavra-chave aparece no título e no conteúdo.')}
      else if(key&&(titleSource.includes(key)||bodySource.includes(key))){seoScore+=4;addTip('warn','Palavra-chave aparece apenas no título ou no conteúdo.')}
      else {seoScore+=2;addTip('warn','Palavra-chave definida, mas pouco relacionada ao texto detectado.')}
    }else addTip('warn','Defina uma palavra-chave principal ou use a sugestão do assistente.');

    if(slug){seoScore+=4}else addTip('warn','Confira a URL amigável antes de publicar.');
    if(summary){seoScore+=3}else addTip('warn','Preencha o resumo para melhorar os cards do blog.');
    if(category){seoScore+=3}

    let mediaScore=0;
    if(cover){mediaScore+=10;addTip('good','Imagem de capa definida.')}
    else addTip('bad','Adicione uma imagem de capa.');

    if(seoImage&&validSocial(seoImage)){mediaScore+=6;addTip('good','Imagem social personalizada definida.')}
    else if(cover){mediaScore+=4;addTip('warn','A capa será usada como imagem social; uma versão 1200×630 pode melhorar a padronização.')}
    else addTip('warn','Sem imagem específica para compartilhamento.');

    if(validSocial(seoImage)){mediaScore+=4}
    else addTip('bad','A imagem social está em Base64/Blob; gere ou selecione uma imagem pública.');

    let editorialScore=0;
    if(category){editorialScore+=4}else addTip('bad','Selecione uma categoria.');
    if(author){editorialScore+=3}else addTip('warn','Informe o autor da matéria.');
    if(tags){editorialScore+=3}else addTip('warn','Adicione tags relacionadas ao assunto.');
    if(summary){editorialScore+=3}
    if(status==='scheduled'){
      if(publishAt){editorialScore+=2}else addTip('bad','Informe data e hora para o agendamento.');
    }else if(status){editorialScore+=2}

    contentScore=Math.min(35,contentScore);
    seoScore=Math.min(30,seoScore);
    mediaScore=Math.min(20,mediaScore);
    editorialScore=Math.min(15,editorialScore);
    const total=contentScore+seoScore+mediaScore+editorialScore;
    return {total,content:contentScore,seo:seoScore,media:mediaScore,editorial:editorialScore,tips,stats};
  }

  function level(score){
    if(score>=85)return {text:'Excelente — pronta para revisão final',cls:'excellent'};
    if(score>=70)return {text:'Muito boa — poucos ajustes',cls:'very-good'};
    if(score>=55)return {text:'Boa — ainda pode melhorar',cls:'good'};
    return {text:'Em preparação',cls:'needs-work'};
  }

  function setBar(name,value,max){
    $(`quality${name}Bar`).style.width=`${Math.max(0,Math.min(100,value/max*100))}%`;
    $(`quality${name}Text`).textContent=`${value}/${max}`;
  }

  function refresh(force=false){
    const signature=JSON.stringify([
      els.title?.value,els.slug?.value,els.summary?.value,els.content?.innerHTML,els.category?.value,els.author?.value,els.tags?.value,els.status?.value,els.publishAt?.value,els.seoTitle?.value,els.seoDescription?.value,els.seoKeyword?.value,els.seoImage?.value,els.coverPreview?.src
    ]);
    if(!force&&signature===lastSignature)return;
    lastSignature=signature;

    const result=calculate();
    const lv=level(result.total);
    scoreEl.style.setProperty('--score-angle',`${result.total*3.6}deg`);
    scoreEl.querySelector('span').innerHTML=`${result.total}<small>/100</small>`;
    levelEl.textContent=lv.text;
    levelEl.className=`article-quality-level ${lv.cls}`;
    setBar('Content',result.content,35);
    setBar('Seo',result.seo,30);
    setBar('Media',result.media,20);
    setBar('Editorial',result.editorial,15);

    const priority={bad:0,warn:1,good:2};
    const useful=[...result.tips].sort((a,b)=>priority[a.state]-priority[b.state]).slice(0,8);
    tipsEl.innerHTML=useful.map(t=>`<div class="article-quality-tip ${t.state}"><i>${t.state==='good'?'✓':t.state==='warn'?'!':'×'}</i><span>${t.text}</span></div>`).join('');
    toggle.textContent=tipsEl.classList.contains('open')?'Ocultar detalhes ▴':'Ver o que pode melhorar ▾';

    window.AsscontalArticleQuality={...result,updatedAt:new Date().toISOString()};
    window.dispatchEvent(new CustomEvent('asscontal:quality-updated',{detail:window.AsscontalArticleQuality}));
  }

  function schedule(){clearTimeout(timer);timer=setTimeout(()=>refresh(false),180)}
  Object.values(els).filter(Boolean).forEach(el=>{
    el.addEventListener('input',schedule);
    el.addEventListener('change',schedule);
  });
  els.content.addEventListener('keyup',schedule);
  els.coverPreview?.addEventListener('load',()=>refresh(true));

  toggle.addEventListener('click',()=>{
    tipsEl.classList.toggle('open');
    toggle.textContent=tipsEl.classList.contains('open')?'Ocultar detalhes ▴':'Ver o que pode melhorar ▾';
  });

  window.AsscontalQuality={calculate,refresh};
  refresh(true);
  setTimeout(()=>refresh(true),800);
  setTimeout(()=>refresh(true),1800);
  setInterval(()=>refresh(false),1800);
})();
