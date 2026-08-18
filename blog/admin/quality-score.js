(() => {
  if(document.getElementById('articleQualityPanel'))return;

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
    if(document.getElementById('articleQualityPanel')||!window.AsscontalQualityEngine)return;

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
    const scoreEl=$('articleQualityScore'),levelEl=$('articleQualityLevel'),tipsEl=$('articleQualityTips'),toggle=$('articleQualityToggle');
    let lastSignature='',timer=null;

    function coverPresent(){
      const src=String(els.coverPreview?.currentSrc||els.coverPreview?.src||'');
      return !window.AsscontalQualityEngine.isPlaceholder(src);
    }

    function source(){
      return {
        title:els.title?.value||'',slug:els.slug?.value||'',summary:els.summary?.value||'',content:els.content?.innerHTML||'',category:els.category?.value||'',author:els.author?.value||'',tags:els.tags?.value||'',status:els.status?.value||'',publishAt:els.publishAt?.value||'',seoTitle:els.seoTitle?.value||'',seoDescription:els.seoDescription?.value||'',seoKeyword:els.seoKeyword?.value||'',seoImage:els.seoImage?.value||'',cover:els.coverPreview?.src||''
      };
    }

    function setBar(name,value,max){
      $(`quality${name}Bar`).style.width=`${Math.max(0,Math.min(100,value/max*100))}%`;
      $(`quality${name}Text`).textContent=`${value}/${max}`;
    }

    function calculate(){return window.AsscontalQualityEngine.calculate(source(),{coverPresent:coverPresent()})}

    function refresh(force=false){
      const data=source();
      const signature=JSON.stringify([...Object.values(data),coverPresent()]);
      if(!force&&signature===lastSignature)return;
      lastSignature=signature;

      const result=window.AsscontalQualityEngine.calculate(data,{coverPresent:coverPresent()});
      const lv=window.AsscontalQualityEngine.level(result.total);
      scoreEl.style.setProperty('--score-angle',`${result.total*3.6}deg`);
      scoreEl.querySelector('span').innerHTML=`${result.total}<small>/100</small>`;
      levelEl.textContent=lv.text;
      levelEl.className=`article-quality-level ${lv.cls}`;
      setBar('Content',result.content,35);setBar('Seo',result.seo,30);setBar('Media',result.media,20);setBar('Editorial',result.editorial,15);

      const priority={bad:0,warn:1,good:2};
      const useful=[...result.tips].sort((a,b)=>priority[a.state]-priority[b.state]).slice(0,8);
      tipsEl.innerHTML=useful.map(t=>`<div class="article-quality-tip ${t.state}"><i>${t.state==='good'?'✓':t.state==='warn'?'!':'×'}</i><span>${t.text}</span></div>`).join('');
      toggle.textContent=tipsEl.classList.contains('open')?'Ocultar detalhes ▴':'Ver o que pode melhorar ▾';

      window.AsscontalArticleQuality={...result,updatedAt:new Date().toISOString()};
      window.dispatchEvent(new CustomEvent('asscontal:quality-updated',{detail:window.AsscontalArticleQuality}));
    }

    function schedule(){clearTimeout(timer);timer=setTimeout(()=>refresh(false),180)}
    Object.values(els).filter(Boolean).forEach(el=>{el.addEventListener('input',schedule);el.addEventListener('change',schedule)});
    els.content.addEventListener('keyup',schedule);
    els.coverPreview?.addEventListener('load',()=>refresh(true));
    toggle.addEventListener('click',()=>{tipsEl.classList.toggle('open');toggle.textContent=tipsEl.classList.contains('open')?'Ocultar detalhes ▴':'Ver o que pode melhorar ▾'});

    window.AsscontalQuality={calculate,refresh,engine:window.AsscontalQualityEngine};
    refresh(true);setTimeout(()=>refresh(true),800);setTimeout(()=>refresh(true),1800);setInterval(()=>refresh(false),1800);
  });
})();
