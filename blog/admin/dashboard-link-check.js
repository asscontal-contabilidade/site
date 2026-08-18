(() => {
  if(document.getElementById('dashboardLinkCheckStyle'))return;

  const REPORT_URL='../data/link-check.json';
  let REPORT=null;

  const style=document.createElement('style');
  style.id='dashboardLinkCheckStyle';
  style.textContent=`
    .linkcheck-panel{margin:0 0 22px}.linkcheck-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.linkcheck-head small{display:block;margin-top:3px;color:#64748b}.linkcheck-state{display:inline-flex;align-items:center;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:800;white-space:nowrap}.linkcheck-state.ok{background:#dcfce7;color:#166534}.linkcheck-state.warn{background:#fef3c7;color:#92400e}.linkcheck-state.bad{background:#fee2e2;color:#991b1b}.linkcheck-state.pending{background:#e2e8f0;color:#475569}
    .linkcheck-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:12px}.linkcheck-card{padding:13px;border:1px solid #e5e7eb;border-radius:11px;background:#fbfdff}.linkcheck-card span,.linkcheck-card b,.linkcheck-card small{display:block}.linkcheck-card span{font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.05em}.linkcheck-card b{margin-top:4px;color:#0b2545;font-size:18px}.linkcheck-card small{margin-top:3px;color:#64748b;font-size:10px;line-height:1.4}.linkcheck-note{margin-top:10px;color:#64748b;font-size:11px;line-height:1.5}
    .linkcheck-badge{display:inline-flex;align-items:center;justify-content:center;min-width:70px;padding:6px 8px;border-radius:999px;font-size:10px;font-weight:850;border:1px solid transparent;white-space:nowrap}.linkcheck-badge.ok{background:#ecfdf5;color:#166534;border-color:#bbf7d0}.linkcheck-badge.warn{background:#fffbeb;color:#92400e;border-color:#fde68a}.linkcheck-badge.bad{background:#fef2f2;color:#991b1b;border-color:#fecaca}.linkcheck-badge.none{background:#f8fafc;color:#64748b;border-color:#e2e8f0}.linkcheck-badge.pending{background:#f1f5f9;color:#64748b;border-color:#e2e8f0}
    .linkcheck-title-cell{min-width:92px}.linkcheck-help{display:block;margin-top:3px;color:#94a3b8;font-size:9px;font-weight:700}
    @media(max-width:1000px){.linkcheck-grid{grid-template-columns:1fr 1fr}}@media(max-width:600px){.linkcheck-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
  function fmt(raw){if(!raw)return'Nunca executado';const d=new Date(raw);return Number.isNaN(d.getTime())?String(raw):d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}

  function panel(){
    let el=document.getElementById('linkCheckPanel');
    if(el)return el;
    const telegram=document.getElementById('telegramPanel');
    if(!telegram)return null;
    el=document.createElement('section');
    el.className='panel linkcheck-panel';
    el.id='linkCheckPanel';
    el.innerHTML=`
      <div class="panel-title linkcheck-head"><div><h2>Verificação de links</h2><small>Checagem automática semanal dos links usados nas matérias.</small></div><span id="linkCheckState" class="linkcheck-state pending">Aguardando primeira verificação</span></div>
      <div class="linkcheck-grid">
        <div class="linkcheck-card"><span>Links únicos</span><b id="linkCheckTotal">0</b><small>Internos e externos encontrados</small></div>
        <div class="linkcheck-card"><span>OK</span><b id="linkCheckOk">0</b><small>Responderam normalmente</small></div>
        <div class="linkcheck-card"><span>Quebrados</span><b id="linkCheckBroken">0</b><small>Erros confirmados, como 404</small></div>
        <div class="linkcheck-card"><span>Avisos</span><b id="linkCheckWarnings">0</b><small>Timeout, bloqueio ou resposta inconclusiva</small></div>
      </div>
      <div id="linkCheckNote" class="linkcheck-note">O primeiro relatório será criado pelo GitHub Actions. Depois disso, o Dashboard mostrará o resultado por matéria.</div>`;
    telegram.insertAdjacentElement('afterend',el);
    return el;
  }

  function ensureHeader(){
    const row=document.querySelector('#table')?.closest('table')?.querySelector('thead tr');
    if(!row||row.querySelector('[data-linkcheck-head]'))return;
    const th=document.createElement('th');
    th.dataset.linkcheckHead='1';
    th.className='linkcheck-title-cell';
    th.innerHTML='Links<span class="linkcheck-help">checagem</span>';
    const cells=[...row.children];
    const actions=cells[cells.length-1];
    row.insertBefore(th,actions);
  }

  function badgeFor(post){
    if(!REPORT||REPORT.status!=='complete')return {cls:'pending',text:'Pendente',title:'Aguardando primeira verificação automática.'};
    const item=REPORT.byPost?.[String(post.id)];
    if(!item||!Number(item.total||0))return {cls:'none',text:'Sem links',title:'Nenhum link encontrado no conteúdo desta matéria.'};
    const broken=Number(item.broken||0),warnings=Number(item.warnings||0),ok=Number(item.ok||0),total=Number(item.total||0);
    if(broken)return {cls:'bad',text:`${broken} quebrado${broken===1?'':'s'}`,title:`${broken} link(s) quebrado(s), ${warnings} aviso(s), ${ok} OK de ${total}.`};
    if(warnings)return {cls:'warn',text:`${warnings} aviso${warnings===1?'':'s'}`,title:`Nenhum quebrado confirmado; ${warnings} verificação(ões) inconclusiva(s), ${ok} OK de ${total}.`};
    return {cls:'ok',text:'✓ Links OK',title:`${ok} de ${total} links verificados sem problema.`};
  }

  function enhanceTable(){
    ensureHeader();
    const tbody=document.getElementById('table');
    if(!tbody||typeof POSTS==='undefined')return;
    const q=document.getElementById('filter')?.value.toLowerCase()||'';
    const visible=POSTS.filter(x=>(x.title||'').toLowerCase().includes(q)||(x.category||'').toLowerCase().includes(q)||statusLabel(x).toLowerCase().includes(q));
    const rows=[...tbody.querySelectorAll('tr')];
    rows.forEach((row,index)=>{
      if(row.querySelector('[data-linkcheck-cell]'))return;
      const post=visible[index];
      if(!post||row.children.length<=1)return;
      const result=badgeFor(post);
      const td=document.createElement('td');
      td.dataset.linkcheckCell='1';
      td.innerHTML=`<span class="linkcheck-badge ${result.cls}" title="${esc(result.title)}">${esc(result.text)}</span>`;
      row.insertBefore(td,row.lastElementChild);
    });
  }

  function renderPanel(){
    const el=panel();
    if(!el)return;
    const state=document.getElementById('linkCheckState');
    const summary=REPORT?.summary||{};
    document.getElementById('linkCheckTotal').textContent=Number(summary.total||0).toLocaleString('pt-BR');
    document.getElementById('linkCheckOk').textContent=Number(summary.ok||0).toLocaleString('pt-BR');
    document.getElementById('linkCheckBroken').textContent=Number(summary.broken||0).toLocaleString('pt-BR');
    document.getElementById('linkCheckWarnings').textContent=Number(summary.warnings||0).toLocaleString('pt-BR');
    const note=document.getElementById('linkCheckNote');

    if(!REPORT||REPORT.status!=='complete'){
      state.textContent='Aguardando primeira verificação';state.className='linkcheck-state pending';
      note.textContent='O relatório ainda não foi executado. O workflow roda semanalmente e também pode ser iniciado manualmente no GitHub Actions.';
      return;
    }
    const broken=Number(summary.broken||0),warnings=Number(summary.warnings||0);
    if(broken){state.textContent=`${broken} problema${broken===1?'':'s'} encontrado${broken===1?'':'s'}`;state.className='linkcheck-state bad'}
    else if(warnings){state.textContent=`${warnings} aviso${warnings===1?'':'s'}`;state.className='linkcheck-state warn'}
    else {state.textContent='Todos os links OK';state.className='linkcheck-state ok'}
    note.textContent=`Última verificação: ${fmt(REPORT.generatedAt)}. “Aviso” significa que o endereço não pôde ser confirmado com segurança, por exemplo por timeout ou bloqueio do servidor externo.`;
  }

  async function loadReport(){
    try{
      const response=await fetch(`${REPORT_URL}?v=${Date.now()}`,{cache:'no-store'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      REPORT=await response.json();
    }catch(error){
      console.warn('Não foi possível carregar o relatório de links:',error);
      REPORT=null;
    }
    renderPanel();
    enhanceTable();
  }

  const previousDrawTable=drawTable;
  drawTable=function(stats){
    const result=previousDrawTable(stats);
    setTimeout(enhanceTable,0);
    return result;
  };

  window.AsscontalLinkCheck={get report(){return REPORT},refresh:loadReport,enhance:enhanceTable};
  panel();
  loadReport();
  setTimeout(enhanceTable,700);
  setTimeout(enhanceTable,1700);
})();
