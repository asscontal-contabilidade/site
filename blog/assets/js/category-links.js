(()=>{
  const categoryUrl=name=>`/blog/categoria.html?cat=${encodeURIComponent(String(name||'Geral').trim()||'Geral')}`;

  function categoryLink(name){
    const a=document.createElement('a');
    a.className='eyebrow category-link';
    a.href=categoryUrl(name);
    a.textContent=name;
    a.title=`Ver matérias de ${name}`;
    return a;
  }

  function ensureStyle(){
    if(document.getElementById('category-links-style'))return;
    const style=document.createElement('style');
    style.id='category-links-style';
    style.textContent='.category-link{display:inline-block}.category-link:hover{text-decoration:underline;text-underline-offset:3px}.card-media-link,.card-content-link{display:block}.compact-media-link{display:block;flex:0 0 auto}';
    document.head.appendChild(style);
  }

  function enhanceCard(card){
    if(card.dataset.categoryLinks==='1')return;
    const outer=Array.from(card.children).find(el=>el.matches&&el.matches('a[href]'));
    const body=outer?.querySelector('.card-body');
    const eyebrow=body?.querySelector('.eyebrow');
    if(!outer||!body||!eyebrow)return;

    const name=eyebrow.textContent.trim();
    if(!name)return;
    const href=outer.getAttribute('href')||'#';
    const img=outer.querySelector('.card-img');

    const mediaLink=document.createElement('a');
    mediaLink.className='card-media-link';
    mediaLink.href=href;
    if(img)mediaLink.appendChild(img.cloneNode(true));

    const newBody=document.createElement('div');
    newBody.className=body.className;
    newBody.appendChild(categoryLink(name));

    const contentLink=document.createElement('a');
    contentLink.className='card-content-link';
    contentLink.href=href;
    Array.from(body.childNodes).forEach(node=>{
      if(node===eyebrow)return;
      contentLink.appendChild(node.cloneNode(true));
    });
    newBody.appendChild(contentLink);

    card.replaceChildren(mediaLink,newBody);
    card.dataset.categoryLinks='1';
  }

  function enhanceCompact(outer){
    if(outer.dataset.categoryLinks==='1')return;
    const eyebrow=outer.querySelector('.eyebrow');
    if(!eyebrow)return;
    const name=eyebrow.textContent.trim();
    if(!name)return;

    const href=outer.getAttribute('href')||'#';
    const img=outer.querySelector('img');
    const sourceBody=eyebrow.parentElement;
    const box=document.createElement('div');
    box.className='compact';
    box.dataset.categoryLinks='1';

    if(img){
      const mediaLink=document.createElement('a');
      mediaLink.className='compact-media-link';
      mediaLink.href=href;
      mediaLink.appendChild(img.cloneNode(true));
      box.appendChild(mediaLink);
    }

    const body=document.createElement('div');
    body.appendChild(categoryLink(name));
    const contentLink=document.createElement('a');
    contentLink.href=href;
    Array.from(sourceBody?.childNodes||[]).forEach(node=>{
      if(node===eyebrow)return;
      contentLink.appendChild(node.cloneNode(true));
    });
    body.appendChild(contentLink);
    box.appendChild(body);
    outer.replaceWith(box);
  }

  function enhanceArticle(){
    const eyebrow=document.querySelector('.article-top .eyebrow');
    if(!eyebrow||eyebrow.matches('a.category-link'))return;
    const name=eyebrow.textContent.trim();
    if(!name)return;
    eyebrow.replaceWith(categoryLink(name));
  }

  function enhance(){
    ensureStyle();
    document.querySelectorAll('.card').forEach(enhanceCard);
    document.querySelectorAll('a.compact').forEach(enhanceCompact);
    enhanceArticle();
  }

  let queued=false;
  const schedule=()=>{
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{
      queued=false;
      enhance();
    });
  };

  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();
})();
