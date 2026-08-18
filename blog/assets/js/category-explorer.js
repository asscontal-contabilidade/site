async function renderCategoryExplorer(){
  const hero=document.getElementById('hero');
  if(!hero)return;

  const posts=(await getPosts()).filter(p=>p.status==='published'&&String(p.category||'').trim());
  if(!posts.length)return;

  const byCategory=new Map();
  for(const post of posts){
    const name=String(post.category||'').trim();
    if(!name)continue;
    if(!byCategory.has(name))byCategory.set(name,[]);
    byCategory.get(name).push(post);
  }

  const categories=[...byCategory.entries()]
    .map(([name,items])=>({
      name,
      count:items.length,
      latest:items.reduce((best,p)=>String(p.updatedAt||p.date||'')>String(best||'')?String(p.updatedAt||p.date||''):best,'')
    }))
    .sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'pt-BR'));

  let style=document.getElementById('category-explorer-style');
  if(!style){
    style=document.createElement('style');
    style.id='category-explorer-style';
    style.textContent=`
      .category-explorer{padding:30px 0 8px}
      .category-explorer-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:18px}
      .category-explorer-head h2{margin:4px 0 0;font-size:30px;line-height:1.1;color:var(--primary)}
      .category-explorer-head p{margin:6px 0 0;color:var(--muted);font-size:14px}
      .category-explorer-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
      .category-explorer-card{display:flex;align-items:center;gap:13px;padding:17px 18px;border:1px solid var(--line);border-radius:15px;background:#fff;transition:.2s;box-shadow:0 5px 16px rgba(11,37,69,.035)}
      .category-explorer-card:hover{transform:translateY(-3px);border-color:#b8d6e8;box-shadow:var(--shadow)}
      .category-explorer-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;background:#eef8fc;color:var(--accent-hover);font-size:15px;font-weight:900;flex:0 0 42px}
      .category-explorer-copy{min-width:0}
      .category-explorer-copy strong,.category-explorer-copy small{display:block}
      .category-explorer-copy strong{color:var(--primary);font-size:14px;line-height:1.3}
      .category-explorer-copy small{margin-top:3px;color:var(--muted);font-size:11px}
      @media(max-width:1000px){.category-explorer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:600px){.category-explorer{padding-top:22px}.category-explorer-grid{grid-template-columns:1fr}.category-explorer-head{align-items:flex-start;flex-direction:column}.category-explorer-head h2{font-size:26px}}
    `;
    document.head.appendChild(style);
  }

  const initials=name=>name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0,2)
    .map(x=>x.charAt(0).toUpperCase())
    .join('')||'A';

  const section=document.createElement('section');
  section.className='container category-explorer';
  section.setAttribute('aria-labelledby','categoryExplorerTitle');
  section.innerHTML=`
    <div class="category-explorer-head">
      <div>
        <span class="eyebrow">ASSUNTOS</span>
        <h2 id="categoryExplorerTitle">Explore por categoria</h2>
        <p>Encontre rapidamente conteúdos por área de interesse.</p>
      </div>
    </div>
    <div class="category-explorer-grid">
      ${categories.map(c=>`<a class="category-explorer-card" href="/blog/categoria.html?cat=${encodeURIComponent(c.name)}" title="Ver matérias de ${esc(c.name)}"><span class="category-explorer-icon">${esc(initials(c.name))}</span><span class="category-explorer-copy"><strong>${esc(c.name)}</strong><small>${c.count} matéria${c.count===1?'':'s'} publicada${c.count===1?'':'s'}</small></span></a>`).join('')}
    </div>
  `;

  hero.insertAdjacentElement('afterend',section);
}
