(() => {
  if(document.getElementById('whatsappAnalyticsStyle'))return;

  const API='https://asscontal-blog-cms.asscontal.workers.dev';
  const style=document.createElement('style');
  style.id='whatsappAnalyticsStyle';
  style.textContent=`
    .wa-analytics-panel{margin:0 0 22px}.wa-analytics-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.wa-analytics-pill{display:inline-flex;align-items:center;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:800;background:#ecfdf5;color:#166534}.wa-analytics-pill.waiting{background:#f1f5f9;color:#64748b}.wa-analytics-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:14px}.wa-analytics-card{padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#fbfdff}.wa-analytics-card span,.wa-analytics-card b,.wa-analytics-card small{display:block}.wa-analytics-card span{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#64748b}.wa-analytics-card b{margin-top:5px;color:#0b2545;font-size:23px}.wa-analytics-card small{margin-top:3px;color:#718096;font-size:10px}.wa-analytics-list{margin-top:16px;border-top:1px solid #edf2f7;padding-top:12px}.wa-analytics-row{display:grid;grid-template-columns:minmax(0,1fr) 90px 90px 90px;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid #f1f5f9}.wa-analytics-row:last-child{border-bottom:0}.wa-analytics-row b{font-size:12px;color:#0b2545}.wa-analytics-row span{font-size:11px;color:#64748b;text-align:right}.wa-analytics-empty{color:#718096;font-size:12px;margin:12px 0 0}@media(max-width:900px){.wa-analytics-grid{grid-template-columns:1fr 1fr}.wa-analytics-row{grid-template-columns:minmax(0,1fr) 70px 70px}.wa-analytics-row span:last-child{grid-column:2/4}}@media(max-width:560px){.wa-analytics-grid{grid-template-columns:1fr}.wa-analytics-row{grid-template-columns:1fr 1fr}.wa-analytics-row b{grid-column:1/-1}.wa-analytics-row span{text-align:left}}
  `;
  document.head.appendChild(style);

  const telegram=document.getElementById('telegramPanel');
  if(!telegram)return;
  const panel=document.createElement('section');
  panel.className='panel wa-analytics-panel';
  panel.id='whatsappAnalyticsPanel';
  panel.innerHTML=`
    <div class="wa-analytics-head">
      <div><h2 style="margin:0">Conversões pelo WhatsApp</h2><small style="color:#718096">Cliques no atendimento por matéria e origem</small></div>
      <span id="waAnalyticsStatus" class="wa-analytics-pill waiting">Aguardando dados</span>
    </div>
    <div class="wa-analytics-grid">
      <div class="wa-analytics-card"><span>Cliques</span><b id="waClicks">—</b><small>No período selecionado</small></div>
      <div class="wa-analytics-card"><span>Conversão</span><b id="waConversion">—</b><small>Cliques ÷ visualizações</small></div>
      <div class="wa-analytics-card"><span>Barra</span><b id="waBarClicks">—</b><small>CTA inferior</small></div>
      <div class="wa-analytics-card"><span>Ícone</span><b id="waFloatClicks">—</b><small>Botão flutuante</small></div>
    </div>
    <div id="waAnalyticsList" class="wa-analytics-list"><p class="wa-analytics-empty">Nenhum dado carregado.</p></div>
  `;
  telegram.insertAdjacentElement('afterend',panel);

  function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
  function pct(clicks,views){return views?`${(Number(clicks||0)/Number(views||0)*100).toFixed(1).replace('.',',')}%`:'0,0%'}

  async function load(period){
    const token=sessionStorage.getItem('blog_admin_token');
    const status=document.getElementById('waAnalyticsStatus');
    try{
      const r=await fetch(`${API}/whatsapp/stats?period=${encodeURIComponent(period||'all')}`,{headers:token?{authorization:'Bearer '+token}:{},cache:'no-store'});
      if(r.status===404){status.textContent='Aguardando backend';status.className='wa-analytics-pill waiting';return}
      if(!r.ok)throw new Error('Erro '+r.status);
      const data=await r.json();
      const clicks=Number(data.totalClicks||0),views=Number(data.totalViews||0);
      document.getElementById('waClicks').textContent=clicks.toLocaleString('pt-BR');
      document.getElementById('waConversion').textContent=pct(clicks,views);
      document.getElementById('waBarClicks').textContent=Number(data.barClicks||0).toLocaleString('pt-BR');
      document.getElementById('waFloatClicks').textContent=Number(data.floatClicks||0).toLocaleString('pt-BR');
      const rows=Array.isArray(data.posts)?data.posts:[];
      document.getElementById('waAnalyticsList').innerHTML=rows.length?rows.slice(0,8).map(row=>`<div class="wa-analytics-row"><b>${esc(row.title||row.post_id||'Sem título')}</b><span>${Number(row.views||0).toLocaleString('pt-BR')} views</span><span>${Number(row.clicks||0).toLocaleString('pt-BR')} cliques</span><span>${pct(row.clicks,row.views)}</span></div>`).join(''):'<p class="wa-analytics-empty">Nenhum clique no WhatsApp neste período.</p>';
      status.textContent='Ativo';status.className='wa-analytics-pill';
    }catch(e){status.textContent='Indisponível';status.className='wa-analytics-pill waiting'}
  }

  window.AsscontalWhatsappAnalytics={load};
  const current=()=>typeof PERIOD!=='undefined'?PERIOD:'all';
  setTimeout(()=>load(current()),900);

  document.querySelectorAll('.periods button').forEach(button=>button.addEventListener('click',()=>setTimeout(()=>load(button.dataset.p||current()),80)));
})();
