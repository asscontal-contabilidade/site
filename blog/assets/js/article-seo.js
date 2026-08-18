const baseSetSeo=setSeo;

function articlePlainText(html){
  const box=document.createElement('div');
  box.innerHTML=String(html||'');
  return String(box.textContent||box.innerText||'')
    .replace(/\s+/g,' ')
    .trim();
}

function articleDescription(p,c){
  const manual=String(p.seoDescription||p.summary||'').trim();
  if(manual)return manual;

  const text=articlePlainText(p.content);
  if(text){
    const max=170;
    if(text.length<=max)return text;
    const cut=text.slice(0,max+1);
    const lastSpace=cut.lastIndexOf(' ');
    return `${cut.slice(0,lastSpace>120?lastSpace:max).trim()}…`;
  }

  return String(c.seoDescription||'').trim();
}

function articleSeoImageValue(p,c){
  const seo=String(p.seoImage||'').trim();
  if(seo&&!/^data:/i.test(seo)&&!/^blob:/i.test(seo))return seo;
  return p.cover||c.seoImageUrl||c.defaultImageUrl;
}

setSeo=function(c,p=null){
  baseSetSeo(c,p);
  if(!p)return;

  const SITE_ORIGIN='https://asscontal.com.br';
  const canonical=SITE_ORIGIN+postUrl(p);
  const img=new URL(
    asset(articleSeoImageValue(p,c)),
    SITE_ORIGIN
  ).href;
  const desc=articleDescription(p,c);
  const published=p.date
    ? `${p.date}T12:00:00-03:00`
    : new Date().toISOString();
  const modified=p.updatedAt||published;
  const title=p.seoTitle||`${p.title} — ${c.seoSiteName||'Blog Asscontal'}`;

  document.title=title;
  meta('description',desc);
  meta('og:title',title,true);
  meta('og:description',desc,true);
  meta('og:type','article',true);
  meta('og:locale','pt_BR',true);
  meta('og:site_name',c.seoSiteName||'Asscontal Blog',true);
  meta('og:url',canonical,true);
  meta('og:image',img,true);
  meta('twitter:card','summary_large_image');
  meta('twitter:title',title);
  meta('twitter:description',desc);
  meta('twitter:image',img);
  meta('article:published_time',published,true);
  meta('article:modified_time',modified,true);
  meta('article:section',p.category||'',true);

  let canonicalLink=document.querySelector('link[rel="canonical"]');
  if(!canonicalLink){
    canonicalLink=document.createElement('link');
    canonicalLink.rel='canonical';
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.href=canonical;

  const keywords=[
    p.seoKeyword,
    ...(Array.isArray(p.tags)?p.tags:[])
  ]
    .map(x=>String(x||'').trim())
    .filter(Boolean)
    .join(', ');

  let ld=document.getElementById('article-jsonld');
  if(!ld){
    ld=document.createElement('script');
    ld.id='article-jsonld';
    ld.type='application/ld+json';
    document.head.appendChild(ld);
  }

  ld.textContent=JSON.stringify({
    '@context':'https://schema.org',
    '@type':'BlogPosting',
    headline:p.title,
    description:desc,
    image:[img],
    datePublished:published,
    dateModified:modified,
    inLanguage:'pt-BR',
    isAccessibleForFree:true,
    mainEntityOfPage:{
      '@type':'WebPage',
      '@id':canonical
    },
    author:{
      '@type':'Organization',
      name:p.author||'Redação Asscontal',
      url:'https://asscontal.com.br/'
    },
    publisher:{
      '@type':'Organization',
      name:'Asscontal Contabilidade',
      url:'https://asscontal.com.br/',
      logo:{
        '@type':'ImageObject',
        url:'https://asscontal.com.br/images/logo-2019-190x105.png'
      }
    },
    articleSection:p.category||'',
    keywords
  });
};
