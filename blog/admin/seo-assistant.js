(() => {
  const titleInput=document.getElementById('title');
  const summaryInput=document.getElementById('summary');
  const content=document.getElementById('content');
  const categoryInput=document.getElementById('category');
  const seoTitle=document.getElementById('seoTitle');
  const seoDescription=document.getElementById('seoDescription');
  const seoKeyword=document.getElementById('seoKeyword');
  if(!titleInput||!content||!seoTitle||!seoDescription||!seoKeyword)return;
  if(document.getElementById('seoAssistantPanel'))return;

  const STOP=new Set(`a o as os um uma uns umas de da do das dos e em no na nos nas ao aos à às por para com sem que se como mais menos muito muita muitos muitas seu sua seus suas este esta esse essa isso isto aquele aquela ser estar ter foi são é são sobre entre até após antes durante contra desde quando onde qual quais quem já ainda também ou nem porque porém mas veja veja-se principais principal alerta atenção guia dicas tudo saiba entenda empresa empresas empresário empresários empresariais matéria blog asscontal`.split(/\s+/));

  function norm(value){
    return String(value||'')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function words(value){
    return String(value||'').match(/[\p{L}\p{N}]+/gu)||[];
  }

  function smartCut(value,max=60){
    const text=String(value||'').replace(/\s+/g,' ').trim();
    if(text.length<=max)return text;
    const cut=text.slice(0,max+1);
    const pos=cut.lastIndexOf(' ');
    return cut.slice(0,pos>=Math.floor(max*.72)?pos:max).replace(/[,:;\-–—]+$/,'').trim();
  }

  function contentParagraphText(){
    const box=document.createElement('div');
    box.innerHTML=content.innerHTML||'';
    const paragraphs=[...box.querySelectorAll('p,li')]
      .map(el=>String(el.textContent||'').replace(/\s+/g,' ').trim())
      .filter(text=>text.length>=35);
    if(paragraphs.length)return paragraphs.join(' ');
    return String(box.textContent||'').replace(/\s+/g,' ').trim();
  }

  function descriptionSuggestion(){
    const summary=String(summaryInput?.value||'').replace(/\s+/g,' ').trim();
    let source=summary.length>=70?summary:contentParagraphText();
    if(!source)source=String(titleInput.value||'').trim();
    source=source.replace(/\s+/g,' ').trim();
    if(source.length<=160)return source;

    const cut=source.slice(0,161);
    const sentence=Math.max(cut.lastIndexOf('. '),cut.lastIndexOf('! '),cut.lastIndexOf('? '));
    if(sentence>=120)return cut.slice(0,sentence+1).trim();
    const pos=cut.lastIndexOf(' ');
    return cut.slice(0,pos>=130?pos:155).replace(/[,:;\-–—]+$/,'').trim()+'…';
  }

  function phraseOccurrences(haystack,needle){
    if(!needle)return 0;
    let count=0,pos=0;
    while((pos=haystack.indexOf(needle,pos))!==-1){count++;pos+=needle.length}
    return count;
  }

  function keywordSuggestion(){
    const title=String(titleInput.value||'').trim();
    const titleWords=words(title).map(value=>({value,n: norm(value)})).filter(x=>x.n);
    if(!titleWords.length)return '';

    const box=document.createElement('div');
    box.innerHTML=content.innerHTML||'';
    const headings=[...box.querySelectorAll('h1,h2,h3')].map(el=>el.textContent||'').join(' ');
    const body=String(box.textContent||'');
    const allNorm=norm(`${title} ${headings} ${body}`);
    const headingNorm=norm(headings);
    const titleNorm=norm(title);
    const candidates=[];

    for(let size=2;size<=4;size++){
      for(let i=0;i<=titleWords.length-size;i++){
        const slice=titleWords.slice(i,i+size);
        if(STOP.has(slice[0].n)||STOP.has(slice[slice.length-1].n))continue;
        const meaningful=slice.filter(x=>!STOP.has(x.n));
        const internalStops=slice.filter((x,index)=>index>0&&index<slice.length-1&&STOP.has(x.n)).length;
        if(meaningful.length<2||internalStops>1)continue;
        const phrase=slice.map(x=>x.n).join(' ');
        const display=slice.map(x=>x.value).join(' ');
        const occurrences=phraseOccurrences(allNorm,phrase);
        let score=occurrences*2;
        if(titleNorm.includes(phrase))score+=7;
        if(headingNorm.includes(phrase))score+=4;
        score+=size===2?3:size===3?2:1;
        candidates.push({display,phrase,score,size});
      }
    }

    if(candidates.length){
      candidates.sort((a,b)=>b.score-a.score||a.size-b.size||a.display.length-b.display.length);
      return candidates[0].display;
    }

    const singles=titleWords
      .filter(x=>x.n.length>=4&&!STOP.has(x.n))
      .map(x=>({display:x.value,score:phraseOccurrences(allNorm,x.n)+(titleNorm.includes(x.n)?3:0)}))
      .sort((a,b)=>b.score-a.score);
    return singles[0]?.display||titleWords[0].value;
  }

  function titleSuggestion(){
    const title=String(titleInput.value||'').replace(/\s+/g,' ').trim();
    if(!title)return '';
    if(title.length<=60)return title;

    const separators=[': ',' — ',' - ',' – '];
    for(const sep of separators){
      const parts=title.split(sep).map(x=>x.trim()).filter(Boolean);
      if(parts.length>1){
        const first=parts[0];
        const second=parts[1];
        if(first.length>=32&&first.length<=60)return first;
        if(second.length>=38&&second.length<=60)return second;
      }
    }
    return smartCut(title,60);
  }

  const style=document.createElement('style');
  style.id='seo-assistant-style';
  style.textContent=`
    .seo-assistant{margin:12px 0 20px;padding:16px;border:1px solid #cfe1ec;border-radius:14px;background:linear-gradient(135deg,#f7fbfd,#fff)}
    .seo-assistant-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:13px}
    .seo-assistant-head strong{display:block;color:#0b2545;font-size:14px}.seo-assistant-head p{margin:3px 0 0;color:#64748b;font-size:11px;line-height:1.45}
    .seo-assistant-actions{display:flex;gap:7px;flex-wrap:wrap}.seo-assistant-actions .btn{padding:8px 10px;font-size:11px;white-space:nowrap}
    .seo-suggestions{display:grid;gap:9px}.seo-suggestion{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 12px;border:1px solid #e2e8f0;border-radius:11px;background:#fff}
    .seo-suggestion-label{display:flex;align-items:center;gap:7px;margin-bottom:4px;color:#475569;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.seo-suggestion-value{color:#0f172a;font-size:12px;line-height:1.45;word-break:break-word}.seo-suggestion-meta{color:#94a3b8;font-size:10px;margin-top:3px}
    .seo-suggestion .btn{padding:7px 9px;font-size:10px}.seo-checklist{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.seo-check{padding:5px 8px;border-radius:999px;background:#f1f5f9;color:#64748b;font-size:10px;font-weight:800}.seo-check.good{background:#ecfdf5;color:#166534}.seo-check.warn{background:#fffbeb;color:#92400e}.seo-check.bad{background:#fef2f2;color:#991b1b}
    @media(max-width:700px){.seo-assistant-head{flex-direction:column}.seo-assistant-actions{width:100%}.seo-assistant-actions .btn{flex:1}.seo-suggestion{grid-template-columns:1fr}.seo-suggestion .btn{width:100%}}
  `;
  document.head.appendChild(style);

  const panel=document.createElement('div');
  panel.className='seo-assistant';
  panel.id='seoAssistantPanel';
  panel.innerHTML=`
    <div class="seo-assistant-head">
      <div><strong>Assistente de SEO</strong><p>As sugestões são geradas automaticamente no navegador. Nada é sobrescrito sem sua ação.</p></div>
      <div class="seo-assistant-actions"><button type="button" class="btn primary" id="seoFillEmpty">Preencher campos vazios</button><button type="button" class="btn" id="seoRefreshSuggestions">Atualizar</button></div>
    </div>
    <div class="seo-suggestions">
      <div class="seo-suggestion"><div><div class="seo-suggestion-label">Título SEO</div><div id="seoSuggestionTitle" class="seo-suggestion-value">—</div><div id="seoSuggestionTitleMeta" class="seo-suggestion-meta"></div></div><button type="button" class="btn" data-seo-use="title">Usar sugestão</button></div>
      <div class="seo-suggestion"><div><div class="seo-suggestion-label">Meta description</div><div id="seoSuggestionDescription" class="seo-suggestion-value">—</div><div id="seoSuggestionDescriptionMeta" class="seo-suggestion-meta"></div></div><button type="button" class="btn" data-seo-use="description">Usar sugestão</button></div>
      <div class="seo-suggestion"><div><div class="seo-suggestion-label">Palavra-chave principal</div><div id="seoSuggestionKeyword" class="seo-suggestion-value">—</div><div class="seo-suggestion-meta">Priorizamos termos que aparecem no título e no conteúdo.</div></div><button type="button" class="btn" data-seo-use="keyword">Usar sugestão</button></div>
    </div>
    <div id="seoChecklist" class="seo-checklist"></div>
  `;

  const seoHeading=[...document.querySelectorAll('h2')].find(h=>h.textContent.trim()==='SEO da matéria');
  if(seoHeading)seoHeading.insertAdjacentElement('afterend',panel);
  else seoTitle.closest('label')?.insertAdjacentElement('beforebegin',panel);

  const sTitle=panel.querySelector('#seoSuggestionTitle');
  const sTitleMeta=panel.querySelector('#seoSuggestionTitleMeta');
  const sDescription=panel.querySelector('#seoSuggestionDescription');
  const sDescriptionMeta=panel.querySelector('#seoSuggestionDescriptionMeta');
  const sKeyword=panel.querySelector('#seoSuggestionKeyword');
  const checklist=panel.querySelector('#seoChecklist');
  let suggestions={title:'',description:'',keyword:''};
  let lastSignature='';
  let timer=null;

  function trigger(field,value){
    if(!value)return false;
    field.value=value;
    field.dispatchEvent(new Event('input',{bubbles:true}));
    return true;
  }

  function qualityBadge(text,type){return `<span class="seo-check ${type}">${text}</span>`}

  function updateChecklist(){
    const currentTitle=String(seoTitle.value||suggestions.title||'').trim();
    const currentDesc=String(seoDescription.value||suggestions.description||'').trim();
    const currentKeyword=String(seoKeyword.value||suggestions.keyword||'').trim();
    const titleLen=currentTitle.length;
    const descLen=currentDesc.length;
    const keywordNorm=norm(currentKeyword);
    const titleSource=norm(titleInput.value);
    const bodySource=norm(content.textContent||'');
    const tags=[];

    tags.push(titleLen>=45&&titleLen<=60?qualityBadge(`Título ${titleLen} caracteres`,'good'):titleLen?qualityBadge(`Título ${titleLen} caracteres`,'warn'):qualityBadge('Título SEO vazio','bad'));
    tags.push(descLen>=120&&descLen<=160?qualityBadge(`Descrição ${descLen} caracteres`,'good'):descLen?qualityBadge(`Descrição ${descLen} caracteres`,'warn'):qualityBadge('Meta description vazia','bad'));
    if(keywordNorm){
      const inTitle=titleSource.includes(keywordNorm);
      const inContent=bodySource.includes(keywordNorm);
      tags.push(qualityBadge(inTitle?'Palavra-chave no título':'Palavra-chave fora do título',inTitle?'good':'warn'));
      tags.push(qualityBadge(inContent?'Palavra-chave no conteúdo':'Palavra-chave pouco presente',inContent?'good':'warn'));
    }else tags.push(qualityBadge('Palavra-chave vazia','bad'));
    checklist.innerHTML=tags.join('');
  }

  function refresh(force=false){
    const signature=JSON.stringify([
      titleInput.value,
      summaryInput?.value||'',
      content.innerText||'',
      categoryInput?.value||''
    ]);
    if(!force&&signature===lastSignature)return;
    lastSignature=signature;

    suggestions={
      title:titleSuggestion(),
      description:descriptionSuggestion(),
      keyword:keywordSuggestion()
    };

    sTitle.textContent=suggestions.title||'Preencha o título da matéria para gerar uma sugestão.';
    sTitleMeta.textContent=suggestions.title?`${suggestions.title.length} caracteres · ideal: 50–60`:'';
    sDescription.textContent=suggestions.description||'Adicione resumo ou conteúdo para gerar uma descrição.';
    sDescriptionMeta.textContent=suggestions.description?`${suggestions.description.length} caracteres · ideal: 120–160`:'';
    sKeyword.textContent=suggestions.keyword||'Adicione um título e conteúdo para sugerir a palavra-chave.';
    updateChecklist();
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(()=>refresh(false),450);
  }

  panel.querySelectorAll('[data-seo-use]').forEach(button=>button.addEventListener('click',()=>{
    const type=button.dataset.seoUse;
    if(type==='title')trigger(seoTitle,suggestions.title);
    if(type==='description')trigger(seoDescription,suggestions.description);
    if(type==='keyword')trigger(seoKeyword,suggestions.keyword);
    updateChecklist();
  }));

  panel.querySelector('#seoFillEmpty').addEventListener('click',()=>{
    let count=0;
    if(!seoTitle.value.trim()&&trigger(seoTitle,suggestions.title))count++;
    if(!seoDescription.value.trim()&&trigger(seoDescription,suggestions.description))count++;
    if(!seoKeyword.value.trim()&&trigger(seoKeyword,suggestions.keyword))count++;
    updateChecklist();
    try{if(typeof msg==='function')msg(count?`${count} campo${count===1?'':'s'} de SEO preenchido${count===1?'':'s'} sem alterar os demais.`:'Nenhum campo vazio de SEO para preencher.')}catch(_){ }
  });

  panel.querySelector('#seoRefreshSuggestions').addEventListener('click',()=>refresh(true));
  [titleInput,summaryInput,content,categoryInput].filter(Boolean).forEach(el=>{
    el.addEventListener('input',schedule);
    el.addEventListener('change',schedule);
  });
  [seoTitle,seoDescription,seoKeyword].forEach(el=>el.addEventListener('input',updateChecklist));

  refresh(true);
  setTimeout(()=>refresh(true),900);
  setTimeout(()=>refresh(true),1800);
  setInterval(()=>refresh(false),1800);
})();
