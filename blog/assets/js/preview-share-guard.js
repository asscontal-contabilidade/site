(() => {
  function isPreview(){return new URLSearchParams(location.search).get('id')==='preview'}
  if(!isPreview())return;

  function previewData(){
    try{return JSON.parse(sessionStorage.getItem('preview')||'{}')||{}}catch(_){return{}}
  }

  function editorUrl(){
    const data=previewData();
    const sourceId=String(data.sourceId||'').trim();
    return sourceId
      ? `/blog/admin/editor.html?id=${encodeURIComponent(sourceId)}`
      : '/blog/admin/editor.html';
  }

  function fixBackButton(){
    const button=document.getElementById('previewBackBtn');
    if(!button