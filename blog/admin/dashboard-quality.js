(() => {
  if(document.getElementById('dashboardQualityStyle'))return;

  function ensureEngine(done){
    if(window.AsscontalQualityEngine)return done();
    let script=document.querySelector('script[data-quality-engine-loader]');
    if(!script){
      script=document.createElement('script');
      script.src='quality-engine.js';
      script.dataset.qualityEngineLoader='1';
      document.head.appendChild(script);
    }
    script.addEventListener('load',done,{once:true});
  }

  ensureEngine(()=>{
    if(document.getElementById('dashboardQualityStyle')||!window.AsscontalQualityEngine)return;

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

    function scorePost(post){return window.AsscontalQualityEngine.calculate(post)}
    function qualityLevel(score){return window.AsscontalQualityEngine.level(score)}

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

    window.AsscontalDashboardQuality={scorePost,qualityLevel,refresh:()=>drawTable(LAST_STATS),engine:window.AsscontalQualityEngine};
    ensureHeader();
    setTimeout(()=>{if(typeof POSTS!=='undefined'&&POSTS.length)drawTable(LAST_STATS)},500);
    setTimeout(()=>{if(typeof POSTS!=='undefined'&&POSTS.length)drawTable(LAST_STATS)},1500);

    if(!document.querySelector('script[data-dashboard-link-check-loader]')){
      const linkScript=document.createElement('script');
      linkScript.src='dashboard-link-check.js';
      linkScript.dataset.dashboardLinkCheckLoader='1';
      document.body.appendChild(linkScript);
    }

    if(!document.querySelector('script[data-dashboard-whatsapp-loader]')){
      const waScript=document.createElement('script');
      waScript.src='dashboard-whatsapp-analytics.js?v=20260819-2';
      waScript.dataset.dashboardWhatsappLoader='1';
      document.body.appendChild(waScript);
    }
  });
})();
