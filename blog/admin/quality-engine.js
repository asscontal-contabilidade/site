(() => {
  if(window.AsscontalQualityEngine)return;

  function norm(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
  function wordCount(value){const t=String(value||'').replace(/\s+/g,' ').trim();return t?t.split(' ').filter(Boolean).length:0}
  function isPlaceholder(src){return !src||/placeholder\.svg/i.test(String(src))}
  function validSocial(value){const v=String(value||'').trim();return !/^data:/i.test(v)&&!/^blob:/i.test(v)}

  function htmlStats(html){
    const box=document.createElement('div');
    box.innerHTML=String(html||'');
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

  function calculate(source={},options={}){
    const stats=htmlStats(source.content);
    const title=String(source.title||'').trim();
    const slug=String(source.slug||'').trim();
    const summary=String(source.summary||'').trim();
    const category=String(source.category||'').trim();
    const author=String(source.author||'').trim();
    const tags=Array.isArray(source.tags)?source.tags.filter(Boolean):String(source.tags||'').trim()?String(source.tags).split(',').map(x=>x.trim()).filter(Boolean):[];
    const status=String(source.status||'').trim();
    const publishAt=String(source.publishAt||'').trim();
    const seoTitle=String(source.seoTitle||'').trim();
    const seoDescription=String(source.seoDescription||'').trim();
    const keyword=String(source.seoKeyword||'').trim();
    const seoImage=String(source.seoImage||'').trim();
    const cover=typeof options.coverPresent==='boolean'?options.coverPresent:!isPlaceholder(source.cover);
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

    // Mantém exatamente o critério usado anteriormente no editor e no Dashboard.
    if(validSocial(seoImage)){mediaScore+=4}
    else addTip('bad','A imagem social está em Base64/Blob; gere ou selecione uma imagem pública.');

    let editorialScore=0;
    if(category){editorialScore+=4}else addTip('bad','Selecione uma categoria.');
    if(author){editorialScore+=3}else addTip('warn','Informe o autor da matéria.');
    if(tags.length){editorialScore+=3}else addTip('warn','Adicione tags relacionadas ao assunto.');
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
    if(score>=85)return {text:'Excelente — pronta para revisão final',short:'Excelente',cls:'excellent'};
    if(score>=70)return {text:'Muito boa — poucos ajustes',short:'Muito boa',cls:'very-good'};
    if(score>=55)return {text:'Boa — ainda pode melhorar',short:'Boa',cls:'good'};
    return {text:'Em preparação',short:'Revisar',cls:'needs-work'};
  }

  window.AsscontalQualityEngine={calculate,level,htmlStats,norm,validSocial,isPlaceholder,version:1};
})();
