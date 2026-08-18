async function applyCategorySeo(){
  const params=new URLSearchParams(location.search);
  const category=String(params.get('cat')||'Geral').trim()||'Geral';
  const canonical='https://asscontal.com.br/blog/categoria?cat='+encodeURIComponent(category);
  const title=`${category} — Blog Asscontal`;
  const description=`Matérias, orientações e informações sobre ${category} no Blog Asscontal.`;

  function setMeta(name,content,property=false){
    let el=document.head.querySelector(`meta[${property?'property':'name'}="${name}"]`);
    if(!el){
      el=document.createElement('meta');
      el.setAttribute(property?'property':'name',name);
      document.head.appendChild(el);
    }
    el.content=content;
  }

  let canonicalLink=document.querySelector('link[rel="canonical"]');
  if(!canonicalLink){
    canonicalLink=document.createElement('link');
    canonicalLink.rel='canonical';
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.href=canonical;

  let hasPublishedPosts=true;
  try{
    const posts=await getPosts();
    hasPublishedPosts=posts.some(p=>p.status==='published'&&String(p.category||'')===category);
  }catch(_){ }

  document.title=title;
  setMeta('description',description);
  setMeta('robots',hasPublishedPosts?'index,follow,max-image-preview:large':'noindex,follow');
  setMeta('og:type','website',true);
  setMeta('og:locale','pt_BR',true);
  setMeta('og:site_name','Blog Asscontal',true);
  setMeta('og:title',title,true);
  setMeta('og:description',description,true);
  setMeta('og:url',canonical,true);
  setMeta('twitter:card','summary');
  setMeta('twitter:title',title);
  setMeta('twitter:description',description);

  let ld=document.getElementById('category-jsonld');
  if(!ld){
    ld=document.createElement('script');
    ld.id='category-jsonld';
    ld.type='application/ld+json';
    document.head.appendChild(ld);
  }
  ld.textContent=JSON.stringify({
    '@context':'https://schema.org',
    '@type':'CollectionPage',
    name:title,
    description,
    url:canonical,
    isPartOf:{
      '@type':'Blog',
      name:'Blog Asscontal',
      url:'https://asscontal.com.br/blog/'
    },
    publisher:{
      '@type':'Organization',
      name:'Asscontal Contabilidade',
      url:'https://asscontal.com.br/'
    }
  });
}
