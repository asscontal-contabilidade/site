(() => {
  function isPreview(){return new URLSearchParams(location.search).get('id')==='preview'}
  if(!isPreview())return;

  function block(){
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

  block();
  const observer=new MutationObserver(block);
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',()=>setTimeout(()=>observer.disconnect(),4000),{once:true});
})();
