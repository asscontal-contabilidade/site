(() => {
  function isBlogPosting(script){
    if(!script||script.type!=='application/ld+json')return false;
    try{
      const data=JSON.parse(script.textContent||'null');
      if(Array.isArray(data))return data.some(x=>x&&x['@type']==='BlogPosting');
      if(data&&data['@type']==='BlogPosting')return true;
      if(data&&Array.isArray(data['@graph']))return data['@graph'].some(x=>x&&x['@type']==='BlogPosting');
    }catch(_){
      return /"@type"\s*:\s*"BlogPosting"/i.test(script.textContent||'');
    }
    return false;
  }

  function normalize(){
    const scripts=[...document.querySelectorAll('script[type="application/ld+json"]')].filter(isBlogPosting);
    if(!scripts.length)return;
    let primary=document.getElementById('article-jsonld');
    if(!primary||!isBlogPosting(primary))primary=scripts[0];
    primary.id='article-jsonld';
    for(const script of scripts)if(script!==primary)script.remove();
  }

  normalize();
  const observer=new MutationObserver(()=>normalize());
  observer.observe(document.head,{childList:true,subtree:false});
  window.addEventListener('load',()=>{normalize();setTimeout(()=>observer.disconnect(),4000)},{once:true});
})();
