(() => {
  if(document.getElementById('instagramStatusStyle'))return;

  const API='https://asscontal-blog-cms.asscontal.workers.dev';
  const style=document.createElement('style');
  style.id='instagramStatusStyle';
  style.textContent=`
    .ig-status-panel{margin:0 0 22px}.ig-status-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.ig-status-pill{display:inline-flex;align-items:center;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:800;background:#ecfdf5;color:#166534}.ig-status-pill.waiting{background:#f1f5f9;color:#64748b}.ig-status-pill.error{background:#fef2f2;color:#991b1b}.ig-status-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:14px}.ig-status-card{padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#fbfdff}.ig-status-card span,.ig-status-card b,.ig-status-card small{display:block}.ig-status-card span{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#64748b}.ig-status-card b{margin-top:5px;color:#0b2545;font-size:23px}.ig-status-card small{margin-top:3px;color:#718096;font-size:10px;line-height:1.35}.ig-status-list{margin-top:16px;border-top:1px solid #edf2f7;padding-top:12px}.ig-status-list h3{margin:0 0 8px;color:#0b2545;font-size:13px}.ig-status-row{display:grid;grid-template-columns:minmax(0,1fr) 110px 135px auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9}.ig-status-row:last-child{border-bottom:0}.ig-status-row b{font-size:12px;color:#0b2545}.ig-status-row span,.ig-status-row small{font-size:11px;color:#64748b}.ig-status-row .ig-state{font-weight:800}.ig-status-row .ig-state.published{color:#166534}.ig-status-row .ig-state.failed{color:#b91c1c}.ig-status-row .ig-state.processing{color:#92400e}.ig-status-empty{color:#718096;font-size:12px;margin:12px 0 0}.ig-retry-btn{border:0;border-radius:8px;padding:7px 10px;background:#0b2545;color:#fff;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap}.ig-retry-btn:disabled{opacity:.55;cursor:wait}.ig-status-note{margin-top:12px;padding:10px 12px;border-radius:10px;background:#f8fafc;color:#64748b;border:1px solid #e5e7eb;font-size:11px;line-height:1.45}@media(max-width:1050px){.ig-status-grid{grid-template-columns:repeat(2,1fr)}.ig-status-row{grid-template-columns:minmax(0,1fr) 100px auto}.ig-status-row small{grid-column:1/-1}}@media(max-width:600px){.ig-status-grid{grid-template-columns:1fr}.ig-status-row{grid-template-columns:1fr}.ig-status-row span,.ig-status-row small{text-align:left}}
  `;
  document.head.appendChild(style);

  const anchor=document.getElementById('whatsappAnalyticsPanel')||document.getElementById('telegramPanel');
  if(!anchor)return;

  const panel=document.createElement('section');
  panel.className='panel ig-status-panel';
  panel.id='instagramStatusPanel';
  panel.innerHTML=`
    <div class="ig-status-head">
      <div><h2 style="margin:0">Instagram</h2><small style="color:#718096">Publicação automática das matérias e tentativas de reenvio</small></div>
      <span id="igStatusPill" class="ig-status-pill waiting">Verificando...</span>
    </div>
    <div class="ig-status-grid">
      <div class="ig-status-card"><span>Publicadas</span><b id="igPublished">—</b><small>Matérias enviadas ao Instagram</small></div>
      <div class="ig-status-card"><span>Falhas</span><b id="igFailed">—</b><small>Publicações que precisam de atenção</small></div>
      <div class="ig-status-card"><span>Processando</span><b id="igProcessing">—</b><small>Envios em andamento</small></div>
      <div class="ig-status-card"><span>Última publicação</span><b id="igLastStatus" style="font-size:15px">—</b><small id="igLastDate">Nenhum registro</small></div>
    </div>
    <div id="igStatusList" class="ig-status-list"><h3>Histórico recente</h3><p class="ig-status-empty">Aguardando dados do Worker.</p></div>
    <div class="ig-status-note">O botão <b>Tentar novamente</b> aparece somente em publicações que falharam. Matérias já publicadas ficam protegidas contra duplicidade.</div>
  `;
  anchor.insertAdjacentElement('afterend',panel);

  function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
  function date(raw){if(!raw)return'—';const d=new Date(raw);return Number.isNaN(d.getTime())?String(raw):d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
  function stateLabel(v){if(v==='published')return'Publicado';if(v==='failed')return'Falhou';if(v==='processing')return'Processando';return v||'Pendente'}

  async function request(path,options={}){
    const token=sessionStorage.getItem('blog_admin_token');
    const headers={'content-type':'application/json',...(options.headers||{})};
    if(token)headers.authorization='Bearer '+token;
    const r=await fetch(API+path,{...options,headers,cache:'no-store'});
    const data=await r.json().catch(()=>({}));
    if(r.status===401)throw new Error('Sessão expirada');
    if(!r.ok)throw new Error(data.error||`Erro ${r.status}`);
    return data;
  }

  async function retry(postId,button){
    if(!postId||button?.disabled)return;
    const old=button.textContent;
    button.disabled=true;
    button.textContent='Tentando...';
    try{
      const result=await request('/instagram/retry/'+encodeURIComponent(postId),{method:'POST',body:'{}'});
      button.textContent=result?.skipped?'Já publicado':'Publicado ✓';
      setTimeout(load,700);
    }catch(e){
      button.textContent='Falhou';
      button.title=e.message||'Falha no reenvio';
      setTimeout(()=>{button.disabled=false;button.textContent=old},1800);
    }
  }

  function render(data){
    const configured=!!data?.configured;
    const pill=document.getElementById('igStatusPill');
    pill.textContent=configured?'Ativo':'Não configurado';
    pill.className='ig-status-pill '+(configured?'':'error');

    document.getElementById('igPublished').textContent=Number(data?.published||0).toLocaleString('pt-BR');
    document.getElementById('igFailed').textContent=Number(data?.failed||0).toLocaleString('pt-BR');
    document.getElementById('igProcessing').textContent=Number(data?.processing||0).toLocaleString('pt-BR');

    const last=data?.last||null;
    document.getElementById('igLastStatus').textContent=last?(last.title||stateLabel(last.status)):'Nenhuma';
    document.getElementById('igLastDate').textContent=last?`${stateLabel(last.status)} · ${date(last.updatedAt)}`:'Nenhum registro';

    const rows=Array.isArray(data?.recent)?data.recent:[];
    document.getElementById('igStatusList').innerHTML='<h3>Histórico recente</h3>'+(
      rows.length?rows.map(row=>{
        const failed=row.status==='failed';
        const action=failed?`<button class="ig-retry-btn" data-ig-retry="${esc(row.postId)}">Tentar novamente</button>`:`<span>${row.mediaId?`ID ${esc(row.mediaId)}`:'—'}</span>`;
        return `<div class="ig-status-row"><b>${esc(row.title||row.postId||'Matéria')}</b><span class="ig-state ${esc(row.status)}">${esc(stateLabel(row.status))}</span><small>${row.lastError?esc(row.lastError):date(row.updatedAt)}</small>${action}</div>`;
      }).join(''):'<p class="ig-status-empty">Nenhuma publicação automática registrada ainda.</p>'
    );

    document.querySelectorAll('[data-ig-retry]').forEach(btn=>btn.addEventListener('click',()=>retry(btn.dataset.igRetry,btn)));
  }

  async function load(){
    const pill=document.getElementById('igStatusPill');
    try{
      const data=await request('/instagram/status');
      render(data);
    }catch(e){
      pill.textContent=e.message==='Erro 404'?'Aguardando backend':'Indisponível';
      pill.className='ig-status-pill waiting';
      document.getElementById('igStatusList').innerHTML='<h3>Histórico recente</h3><p class="ig-status-empty">O painel ficará ativo após adicionarmos os endpoints do Instagram no Worker.</p>';
    }
  }

  window.AsscontalInstagramStatus={load,retry};
  setTimeout(load,1200);
})();
