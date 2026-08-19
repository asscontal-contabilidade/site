(() => {
  if(document.getElementById('whatsappSpecialistBar')||document.getElementById('whatsappSpecialistFloat'))return;
  if(new URLSearchParams(location.search).get('id')==='preview')return;

  const PHONE='552737273600';
  const CLOSED_KEY='asscontal_whatsapp_specialist_closed';
  const CMS_API='https://asscontal-blog-cms.asscontal.workers.dev';

  function currentArticleTitle(){
    return document.querySelector('.article-top h1')?.textContent?.trim()||'';
  }

  function currentArticle(){
    const qs=new URLSearchParams(location.search);
    const id=qs.get('id');
    const slug=qs.get('slug');
    const title=currentArticleTitle();
    if(typeof POSTS!=='undefined'&&Array.isArray(POSTS)){
      const post=POSTS.find(p=>(id&&String(p.id)===String(id))||(!id&&slug&&String(p.slug||'')===slug)||(title&&String(p.title||'').trim()===title));
      if(post)return post;
    }
    return null;
  }

  function message(){
    const articleTitle=currentArticleTitle();
    return articleTitle
      ? `Olá! Vim pelo Blog da Asscontal e gostaria de falar com um especialista sobre: “${articleTitle}”.`
      : 'Olá! Vim pelo Blog da Asscontal e gostaria de falar com um especialista.';
  }

  function whatsappUrl(){
    return `https://wa.me/${PHONE}?text=${encodeURIComponent(message())}`;
  }

  function pageType(){
    if(currentArticleTitle())return'article';
    if(/\/categoria\.html$/i.test(location.pathname))return'category';
    if(/\/busca\.html$/i.test(location.pathname))return'search';
    return'home';
  }

  function trackClick(source){
    const post=currentArticle();
    const payload={
      source,
      pageType:pageType(),
      postId:post?String(post.id||''):'',
      postTitle:post?.title||currentArticleTitle()||'',
      category:post?.category||'',
      pageUrl:location.pathname+location.search
    };

    // Envio simples e sem preflight CORS. A resposta não é necessária para abrir o WhatsApp.
    fetch(`${CMS_API}/whatsapp/click`,{
      method:'POST',
      mode:'no-cors',
      headers:{'content-type':'text/plain;charset=UTF-8'},
      body:JSON.stringify(payload),
      keepalive:true
    }).catch(()=>{});
  }

  const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.08 0C5.54 0 .22 5.32.22 11.86c0 2.09.55 4.13 1.6 5.92L.12 24l6.37-1.67a11.82 11.82 0 0 0 5.58 1.42h.01c6.53 0 11.86-5.32 11.86-11.86 0-3.17-1.22-6.15-3.44-8.39Zm-8.42 18.25h-.01a9.8 9.8 0 0 1-4.99-1.37l-.36-.21-3.78.99 1.01-3.68-.23-.38a9.82 9.82 0 0 1-1.5-5.24c0-5.43 4.42-9.86 9.87-9.86a9.8 9.8 0 0 1 6.98 2.9 9.79 9.79 0 0 1 2.89 6.98c-.01 5.44-4.44 9.87-9.88 9.87Zm5.41-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z"/></svg>';

  const style=document.createElement('style');
  style.id='whatsapp-specialist-style';
  style.textContent=`
    .whatsapp-specialist-space{padding-bottom:86px!important}
    .whatsapp-specialist-bar{position:fixed;left:0;right:0;bottom:0;z-index:9900;padding:12px 18px;background:rgba(11,37,69,.97);backdrop-filter:blur(12px);box-shadow:0 -10px 34px rgba(15,23,42,.18);font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
    .whatsapp-specialist-inner{width:min(1180px,100%);margin:0 auto;display:flex;align-items:center;gap:18px}
    .whatsapp-specialist-icon{width:42px;height:42px;flex:0 0 42px;display:grid;place-items:center;border-radius:50%;background:#25d366;color:#fff;box-shadow:0 6px 16px rgba(37,211,102,.24)}
    .whatsapp-specialist-icon svg{width:23px;height:23px;fill:currentColor}
    .whatsapp-specialist-copy{min-width:0;flex:1}.whatsapp-specialist-copy strong,.whatsapp-specialist-copy span{display:block}.whatsapp-specialist-copy strong{color:#fff;font-size:14px;line-height:1.25}.whatsapp-specialist-copy span{margin-top:3px;color:#cbd5e1;font-size:11px;line-height:1.35}
    .whatsapp-specialist-action{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:10px 17px;border-radius:999px;background:#25d366;color:#073b21!important;font-size:12px;font-weight:900;white-space:nowrap}
    .whatsapp-specialist-close{width:34px;height:34px;flex:0 0 34px;display:grid;place-items:center;border:0;border-radius:50%;background:rgba(255,255,255,.09);color:#fff;font-size:18px;cursor:pointer}
    .whatsapp-specialist-float{position:fixed;right:20px;bottom:22px;z-index:9899;width:58px;height:58px;display:grid;place-items:center;border-radius:50%;background:#25d366;color:#fff!important;box-shadow:0 10px 28px rgba(15,23,42,.28),0 0 0 5px rgba(37,211,102,.12)}
    .whatsapp-specialist-float svg{width:31px;height:31px;fill:currentColor}
    @media(max-width:700px){.whatsapp-specialist-space{padding-bottom:126px!important}.whatsapp-specialist-bar{padding:10px 12px}.whatsapp-specialist-inner{display:grid;grid-template-columns:36px minmax(0,1fr) 32px;gap:9px}.whatsapp-specialist-icon{width:36px;height:36px}.whatsapp-specialist-copy strong{font-size:12px}.whatsapp-specialist-copy span{font-size:10px}.whatsapp-specialist-action{grid-column:1/-1;width:100%;min-height:38px}.whatsapp-specialist-float{right:14px;bottom:16px;width:54px;height:54px}.whatsapp-specialist-float svg{width:29px;height:29px}}
  `;
  document.head.appendChild(style);

  function showFloat(){
    if(document.getElementById('whatsappSpecialistFloat'))return;
    const a=document.createElement('a');
    a.id='whatsappSpecialistFloat';
    a.className='whatsapp-specialist-float';
    a.href=whatsappUrl();
    a.target='_blank';
    a.rel='noopener noreferrer';
    a.title='Falar com a Asscontal pelo WhatsApp';
    a.setAttribute('aria-label','Falar com a Asscontal pelo WhatsApp');
    a.innerHTML=icon;
    a.addEventListener('click',()=>{a.href=whatsappUrl();trackClick('float')});
    document.body.appendChild(a);
  }

  function showBar(){
    const bar=document.createElement('aside');
    bar.id='whatsappSpecialistBar';
    bar.className='whatsapp-specialist-bar';
    bar.innerHTML=`<div class="whatsapp-specialist-inner"><div class="whatsapp-specialist-icon">${icon}</div><div class="whatsapp-specialist-copy"><strong>Entre em contato com a gente.</strong><span>Fale com um especialista da Asscontal pelo WhatsApp.</span></div><a id="whatsappSpecialistAction" class="whatsapp-specialist-action" href="${whatsappUrl()}" target="_blank" rel="noopener noreferrer">Falar com um especialista</a><button id="whatsappSpecialistClose" class="whatsapp-specialist-close" type="button" aria-label="Fechar barra do WhatsApp" title="Fechar">×</button></div>`;
    document.body.appendChild(bar);
    document.body.classList.add('whatsapp-specialist-space');
    document.getElementById('whatsappSpecialistAction').addEventListener('click',e=>{e.currentTarget.href=whatsappUrl();trackClick('bar')});
    document.getElementById('whatsappSpecialistClose').addEventListener('click',()=>{
      sessionStorage.setItem(CLOSED_KEY,'1');
      bar.remove();
      document.body.classList.remove('whatsapp-specialist-space');
      showFloat();
    });
  }

  if(sessionStorage.getItem(CLOSED_KEY)==='1')showFloat();
  else showBar();

  const observer=new MutationObserver(()=>{
    const action=document.getElementById('whatsappSpecialistAction');
    const float=document.getElementById('whatsappSpecialistFloat');
    if(action)action.href=whatsappUrl();
    if(float)float.href=whatsappUrl();
  });
  const article=document.getElementById('article');
  if(article)observer.observe(article,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),5000);
})();
