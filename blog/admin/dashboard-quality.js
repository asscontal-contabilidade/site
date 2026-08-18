(() => {
  if(document.getElementById('dashboardQualityStyle'))return;

  const style=document.createElement('style');
  style.id='dashboardQualityStyle';
  style.textContent=`
    .quality-badge{display:inline-flex;align-items:baseline;gap:2px;min-width:64px;justify-content:center;padding:6px 8px;border-radius:999px;font-size:10px;font-weight:800;white-space:nowrap;border:1px solid transparent}
    .quality-badge strong{font-size:13px}.quality-badge.excellent{background:#ecfdf5;color:#166534;border-color:#bbf7d0}.quality-badge.very-good{background:#f0f9ff;color:#0369a1;border-color:#bae6fd}.quality-badge.good{background:#fffbeb;color:#92400e;border-color:#fde68a}.quality-badge.needs-work{background:#fef2f2;color:#991b1b;border-color:#fecaca}
    .quality-summary{display:inline-flex;align-items:center;gap:6px;margin-left:8px;padding:4px 8px;border-radius:999px;background:#f1f5f9;color:#475569;font-size:10px;font-weight:800}.quality-summary strong{color:#0b2545}
    .quality-title-cell{min-width:95px}.quality-help{display:block;margin-top:3px;color:#94a3b8;font-size:9px;font-weight:700}
    @media(max-width:800px){.quality-title-cell{min-width:82px}.quality-badge{min-width:58px;padding:5px 7px}}
  `;
  document.head.appendChild(style);

  function norm(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
  function words(value){const t=String(value||'').replace(/\s+/g,' ').trim();return t?t.split(' ').filter(Boolean).length:0}
  function isPlaceholder(src){return !src||/placeholder\.svg/i.test(String(src))}
  function validSocial(value){const v=String(value||'').trim();return !/^data:/i.test(v)&&!/^blob:/i.test(v)}
  function htmlStats(html){
    const box=document.createElement('div');
    box.innerHTML=String(html||'');
    const plain=String(box.textContent||'').replace(/\s+/g,' ').trim();
    const images=[...box.querySelectorAll('img')];
    return {plain,words:words(plain),h1:box.querySelectorAll('h1').length,h2:box.querySelectorAll('h2').length,h3:box.querySelectorAll('h3').length,links:box.querySelectorAll('a[href]').length,images:images.length,missingAlt:images.filter(img=>!String(img.getAttribute('alt')||'').trim()).length};
  }

  function scorePost(post){
    const stats=htmlStats(post.content);
    const title=String(post.title||'').trim();
    const slug=String(post.slug||'').trim();
    const summary=String(post.summary||'').trim();
    const category=String(post.category||'').trim();
    const author=String(post.author||'').trim();
    const tags=Array.isArray(post.tags)?post.tags.filter(Boolean):String(post.tags||'').trim()?String(post.tags).split(',').filter(x=>x.trim()):[];
    const seoTitle=String(post.seoTitle||'').trim();
    const seoDescription=String(post.seoDescription||'').trim();
    const keyword=String(post.seoKeyword||'').trim();
    const seoImage=String(post.seoImage||'').trim();
    const cover=!isPlaceholder(post.cover);

    let content=0;
    if(stats.words>=500)content+=15;else if(stats.words>=300)content+=13;else if(stats.words>=180)content+=9;else if(stats.words>=80)content+=5;
    const headings=stats.h2+stats.h3;
    if(stats.words<220)content+=6;else if(headings>=2)content+=8;else if(headings===1)content+=5;
    if(stats.h1===0)content+=4;
    if(stats.links>=2)content+=4;else if(stats.links===1)content+=3;
    if(stats.images===0)content+=4;else if(stats.missingAlt===0)content+=4;else if(stats.missingAlt<stats.images)content+=2;
    content=Math.min(35,content);

    let seo=0;
    if(seoTitle.length>=45&&seoTitle.length<=60)seo+=7;else if(seoTitle)seo+=5;else if(title)seo+=3;
    if(seoDescription.length>=120&&seoDescription.length<=160)seo+=7;else if(seoDescription)seo+=5;else if(summary||stats.plain)seo+=3;
    if(keyword){const key=norm(keyword),t=norm(title),b=norm(stats.plain);if(key&&t.includes(key)&&b.includes(key))seo+=6;else if(key&&(t.includes(key)||b.includes(key)))seo+=4;else seo+=2}
    if(slug)seo+=4;
    if(summary)seo+=3;
    if(category)seo+=3;
    seo=Math.min(30,seo);

    let media=0;
    if(cover)media+=10;
    if(seoImage&&validSocial(seoImage))media+=6;else if(cover)media+=4;
    if(validSocial(seoImage))media+=4;
    media=Math.min(20,media);

    let editorial=0;
    if(category)editorial+=4;
    if(author)editorial+=3;
    if(tags.length)editorial+=3;
    if(summary)editorial+=3;
    if(post.status==='scheduled'){if(post.publishAt)editorial+=2}else if(post.status)editorial+=2;
    editorial=Math.min(15,editorial);

    return {total:content+seo+media+editorial,content,seo,media,editorial};
  }

  function qualityLevel(score){
    if(score>=85)return {cls:'excellent',label:'Excelente'};
    if(score>=70)return {cls:'very-good',label:'Muito boa'};
    if(score>=55)return {cls:'good',label:'Boa'};
    return {cls:'needs-work',label:'Revisar'};
  }

  function ensureHeader(){
    const row=document.querySelector('#table')?.closest('table')?.querySelector('thead tr');
    if(!row||row.querySelector('[data-quality-head]'))return;
    const th=document.createElement('th');
    th.dataset.qualityHead='1';
    th.className='quality-title-cell';
    th.innerHTML='Qualidade<span class="quality-help">0–100</span>';
    const cells=[...row.children];
    const actions=cells[cells.length-1];
    row.insertBefore(th,actions);
  }

  function renderTable(stats){
    ensureHeader();
    const vm=Object.fromEntries((stats.posts||[]).map(x=>[String(x.post_id),x.views]));
    const q=document.getElementById('filter').value.toLowerCase();
    const filtered=POSTS.filter(x=>(x.title||'').toLowerCase().includes(q)||(x.category||'').toLowerCase().includes(q)||statusLabel(x).toLowerCase().includes(q));
    const summary=document.getElementById('postListSummary');
    const scored=filtered.map(post=>({post,quality:scorePost(post)}));
    const average=scored.length?Math.round(scored.reduce((sum,x)=>sum+x.quality.total,0)/scored.length):0;
    summary.innerHTML=`${filtered.length} de ${POSTS.length} matéria${POSTS.length===1?'':'s'}${scored.length?` <span class="quality-summary">Qualidade média <strong>${average}/100</strong></span>`:''}`;

    document.getElementById('table').innerHTML=scored.map(({post:x,quality})=>{
      const tg=x.status==='published'?` <button class="btn small telegram-btn" onclick="resendTelegram('${x.id}',this)">Telegram</button>`:'';
      const lv=qualityLevel(quality.total);
      const tip=`Conteúdo ${quality.content}/35 · SEO ${quality.seo}/30 · Mídia ${quality.media}/20 · Editorial ${quality.editorial}/15`;
      return `<tr><td><b>${esc(x.title)}</b></td><td>${esc(x.category)}</td><td><span class="status-badge ${statusClass(x)}">${statusLabel(x)}</span></td><td>${esc(x.date||'')}</td><td><b>${Number(vm[String(x.id)]||0).toLocaleString('pt-BR')}</b></td><td><span class="quality-badge ${lv.cls}" title="${esc(tip)}"><strong>${quality.total}</strong>/100</span></td><td><a class="btn small" href="editor.html?id=${encodeURIComponent(x.id)}">Editar</a>${tg} <button class="btn small danger" onclick="removePost('${x.id}')">Excluir</button></td></tr>`;
    }).join('')||'<tr><td colspan="7">Nenhuma matéria encontrada.</td></tr>';
  }

  const originalDrawTable=drawTable;
  drawTable=function(stats){
    try{return renderTable(stats||LAST_STATS)}catch(e){console.error('Falha ao calcular qualidade no dashboard:',e);return originalDrawTable(stats)}
  };

  window.AsscontalDashboardQuality={scorePost,qualityLevel,refresh:()=>drawTable(LAST_STATS)};
  ensureHeader();
  setTimeout(()=>{if(typeof POSTS!=='undefined'&&POSTS.length)drawTable(LAST_STATS)},500);
  setTimeout(()=>{if(typeof POSTS!=='undefined'&&POSTS.length)drawTable(LAST_STATS)},1500);
})();
