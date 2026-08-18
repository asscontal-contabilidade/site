(() => {
  const STOPWORDS=new Set('a o as os um uma uns umas de da do das dos e em no na nos nas por para com sem sobre entre ao aos à às que se seu sua seus suas como mais menos muito muita muitos muitas também já ainda ou mas porque quando onde qual quais foi são ser ter tem têm essa esse essas esses esta este estas estes isso isto sua suas seus nosso nossa nossos nossas empresa empresas empresário empresários contabilidade contábil artigo matéria blog asscontal'.split(' '));

  function norm(value){
    return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  }

  function plain(value){
    try{
      const box=document.createElement('div');
      box.innerHTML=String(value||'');
      return box.textContent||box.innerText||'';
    }catch(_){return String(value||'')}
  }

  function tokens(value){
    return norm(value).split(' ').filter(word=>word.length>=4&&!STOPWORDS.has(word));
  }

  function unique(values){return [...new Set(values.filter(Boolean))]}

  function postText(post){
    return norm([post.title,post.summary,post.seoKeyword,(post.tags||[]).join(' '),plain(post.content)].join(' '));
  }

  function topicTokens(post){
    return unique([
      ...tokens(post.seoKeyword),
      ...tokens((post.tags||[]).join(' ')),
      ...tokens(post.title),
      ...tokens(post.summary)
    ]).slice(0,40);
  }

  function scoreCandidate(current,candidate){
    let score=0;
    const reasons=[];
    const currentCategory=norm(current.category);
    const candidateCategory=norm(candidate.category);
    if(currentCategory&&currentCategory===candidateCategory){score+=8;reasons.push('mesma categoria')}

    const currentTags=new Set((current.tags||[]).map(norm).filter(Boolean));
    const candidateTags=(candidate.tags||[]).map(norm).filter(Boolean);
    let tagMatches=0;
    for(const tag of candidateTags)if(currentTags.has(tag))tagMatches++;
    if(tagMatches){score+=Math.min(15,tagMatches*5);reasons.push(`${tagMatches} tag${tagMatches===1?'':'s'} em comum`)}

    const currentKeyword=norm(current.seoKeyword);
    const candidateKeyword=norm(candidate.seoKeyword);
    const candidateText=postText(candidate);
    const currentText=postText(current);

    if(currentKeyword&&candidateKeyword&&currentKeyword===candidateKeyword){
      score+=12;reasons.push('mesma palavra-chave');
    }else{
      if(currentKeyword&&candidateText.includes(currentKeyword)){score+=9;reasons.push('palavra-chave da matéria no conteúdo relacionado')}
      if(candidateKeyword&&currentText.includes(candidateKeyword)){score+=6;reasons.push('palavra-chave relacionada ao conteúdo atual')}
    }

    const keywordTokens=new Set(tokens(current.seoKeyword));
    let keywordOverlap=0;
    for(const word of tokens(candidate.seoKeyword))if(keywordTokens.has(word))keywordOverlap++;
    if(keywordOverlap){score+=Math.min(8,keywordOverlap*3);reasons.push('termos de palavra-chave em comum')}

    const currentTopics=new Set(topicTokens(current));
    let topicOverlap=0;
    for(const word of topicTokens(candidate))if(currentTopics.has(word))topicOverlap++;
    if(topicOverlap){score+=Math.min(8,topicOverlap*1.5);reasons.push('assunto semelhante')}

    return {score,reasons};
  }

  function dateValue(post){
    const raw=post.updatedAt||post.publishAt||post.date||'';
    const time=Date.parse(raw.length===10?`${raw}T12:00:00`:raw);
    return Number.isNaN(time)?0:time;
  }

  function selectRelated(current,list,limit=3){
    if(!current||!Array.isArray(list))return[];
    const candidates=list.filter(post=>post&&post.status==='published'&&String(post.id)!==String(current.id));
    const scored=candidates.map(post=>({post,...scoreCandidate(current,post)})).sort((a,b)=>b.score-a.score||dateValue(b.post)-dateValue(a.post));

    const selected=[];
    const used=new Set();
    const add=item=>{
      const key=String(item.post.id||item.post.slug||item.post.title);
      if(used.has(key)||selected.length>=limit)return;
      used.add(key);
      selected.push(item);
    };

    // Primeiro, somente conteúdos com relação semântica detectada.
    scored.filter(item=>item.score>0).forEach(add);

    // Se faltarem itens, prioriza a mesma categoria.
    if(selected.length<limit){
      const category=norm(current.category);
      scored.filter(item=>category&&norm(item.post.category)===category).forEach(add);
    }

    // Depois, conteúdos com algum termo relevante em comum.
    if(selected.length<limit){
      const currentTopics=new Set(topicTokens(current));
      scored.filter(item=>topicTokens(item.post).some(word=>currentTopics.has(word))).forEach(add);
    }

    // Último fallback: matérias publicadas mais recentes, para não deixar o bloco vazio.
    if(selected.length<limit){
      [...scored].sort((a,b)=>dateValue(b.post)-dateValue(a.post)).forEach(add);
    }

    window.AsscontalRelatedArticles.lastSelection=selected.map(item=>({
      id:item.post.id,
      title:item.post.title,
      score:Math.round(item.score*10)/10,
      reasons:item.reasons
    }));
    return selected.slice(0,limit).map(item=>item.post);
  }

  // app.js chama relatedPosts() dentro de renderArticle(). Como os scripts são clássicos,
  // esta substituição mantém o render existente e melhora apenas o critério de escolha.
  window.relatedPosts=(current,list)=>selectRelated(current,list,3);
  window.AsscontalRelatedArticles={
    select:selectRelated,
    score:scoreCandidate,
    lastSelection:[]
  };
})();
