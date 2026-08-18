(() => {
  function isPreview(){return new URLSearchParams(location.search).get('id')==='preview'}
  if(!isPreview())return;

  function previewData(){
    try{return JSON.parse(sessionStorage.getItem('preview')||'{}')||{}}catch(_){return{}}
  }

  function editorUrl(){
    try{
      if(window.opener&&!window.opener.closed&&window.opener.location.origin===location.origin){
        const u=new URL(window.opener.location.href);
        if(/\/blog\/admin\/editor\.html$/i.test(u.pathname))return u.pathname+u.search;
      }
    }catch(_){ }

    try{
      if(document.referrer){
        const u=new URL(document.referrer);
        if(u.origin===location.origin&&/\/blog\/admin\/editor\.html$/i.test(u.pathname))return u.pathname+u.search;
      }
    }catch(_){ }

    const data=previewData();
    const sourceId=String(data.sourceId||'').trim();
    return sourceId
      ? `/blog/admin/editor.html?id=${encodeURIComponent(sourceId)}`
      : '/blog/admin/editor.html';
  }

  function blockShares(){
    document.querySelectorAll('.share a,.article-share-bottom a,.article-share-bottom button').forEach(el=>{
      if(el.dataset.previewShareBlocked==='1')return;
      el.dataset.previewShareBlocked='1';
      el.classList.add('preview-share-disabled');
      el.title='Compartilhamento desativado durante a pré-visualização';
      if(el.tagName==='BUTTON')el.disabled=true;
      el.addEventListener('click',event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        alert('O compartilhamento está desativado na pré-visualização. Salve ou publique a matéria antes de compartilhar.');
      },true);
    });
  }

  function fixBackButton(){
    const button=document.getElementById('previewBackBtn');
    if(!button||button.dataset.previewBackFixed==='1')return;
    button.dataset.previewBackFixed='1';
    button.title='Voltar para a tela de edição';
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      const target=editorUrl();
      // Navega esta própria aba de pré-visualização. Não depende de o navegador
      // permitir focar ou fechar a aba anterior, portanto funciona de forma consistente.
      window.location.assign(target);
    },true);
  }

  function apply(){
    blockShares();
    fixBackButton();
  }

  apply();
  const observer=new MutationObserver(apply);
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',()=>setTimeout(()=>{apply();observer.disconnect()},5000),{once:true});
})();
