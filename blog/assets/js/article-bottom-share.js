function initArticleBottomShare(){
  const article=document.querySelector('.article');
  const content=article?.querySelector('.article-content');
  if(!article||!content||article.querySelector('.article-share-bottom'))return;

  const title=article.querySelector('.article-top h1')?.textContent?.trim()||document.title;
  const canonical=document.querySelector('link[rel="canonical"]')?.href||location.href;
  const encodedUrl=encodeURIComponent(canonical);
  const encodedTitle=encodeURIComponent(title);
  const isPreview=new URLSearchParams(location.search).get('id')==='preview';

  let style=document.getElementById('article-bottom-share-style');
  if(!style){
    style=document.createElement('style');
    style.id='article-bottom-share-style';
    style.textContent=`
      .article-share-bottom{margin:48px 0 10px;padding:26px 28px;border:1px solid var(--line);border-radius:20px;background:linear-gradient(135deg,#fff,#f6fafc);font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
      .article-share-bottom h3{margin:0 0 6px;color:var(--primary);font-size:22px;line-height:1.2}
      .article-share-bottom p{margin:0 0 18px;color:#64748b;font-size:14px}
      .article-share-actions{display:flex;flex-wrap:wrap;gap:10px}
      .article-share-action{display:inline-flex;align-items:center;gap:8px;border:1px solid #d5e0e9;background:#fff;color:var(--primary);border-radius:999px;padding:10px 14px;font:800 12px Inter,Arial,sans-serif;cursor:pointer;transition:.2s}
      .article-share-action svg{width:16px;height:16px;fill:currentColor;flex:0 0 16px}
      .article-share-action:hover{background:var(--primary);color:#fff;border-color:var(--primary);transform:translateY(-1px)}
      .article-share-action.copied{background:#e8f7ee;color:#18794e;border-color:#b9e2c8}
      .article-share-action:disabled{opacity:.5;cursor:not-allowed;transform:none}
      @media(max-width:600px){.article-share-bottom{padding:22px 18px}.article-share-actions{display:grid;grid-template-columns:1fr 1fr}.article-share-action{justify-content:center}.article-share-action:last-child:nth-child(odd){grid-column:1/-1}}
    `;
    document.head.appendChild(style);
  }

  const block=document.createElement('section');
  block.className='article-share-bottom';
  block.setAttribute('aria-label','Compartilhar esta matéria');
  block.innerHTML=`
    <h3>Gostou desta matéria?</h3>
    <p>Compartilhe este conteúdo com alguém.</p>
    <div class="article-share-actions">
      <a class="article-share-action" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${encodedTitle}%20${encodedUrl}" aria-label="Compartilhar no WhatsApp">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.08 0C5.54 0 .22 5.32.22 11.86c0 2.09.55 4.13 1.6 5.92L.12 24l6.37-1.67a11.82 11.82 0 0 0 5.58 1.42h.01c6.53 0 11.86-5.32 11.86-11.86 0-3.17-1.22-6.15-3.44-8.39Zm-8.42 18.25h-.01a9.8 9.8 0 0 1-4.99-1.37l-.36-.21-3.78.99 1.01-3.68-.23-.38a9.82 9.82 0 0 1-1.5-5.24c0-5.43 4.42-9.86 9.87-9.86a9.8 9.8 0 0 1 6.98 2.9 9.79 9.79 0 0 1 2.89 6.98c-.01 5.44-4.44 9.87-9.88 9.87Zm5.41-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z"/></svg>
        WhatsApp
      </a>
      <a class="article-share-action" target="_blank" rel="noopener noreferrer" href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" aria-label="Compartilhar no Facebook">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.03 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24V7.9h-1.51c-1.49 0-1.96.93-1.96 1.89v2.28h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z"/></svg>
        Facebook
      </a>
      <a class="article-share-action" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" aria-label="Compartilhar no LinkedIn">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.33 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.55V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0Z"/></svg>
        LinkedIn
      </a>
      <a class="article-share-action" href="mailto:?subject=${encodedTitle}&body=${encodedTitle}%0A%0A${encodedUrl}" aria-label="Compartilhar por e-mail">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"/></svg>
        E-mail
      </a>
      <button type="button" class="article-share-action article-copy-link" aria-label="Copiar link da matéria">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.9 12a5 5 0 0 1 5-5H12v2H8.9a3 3 0 1 0 0 6H12v2H8.9a5 5 0 0 1-5-5Zm5.1 1v-2h6v2H9Zm6-6h.1a5 5 0 1 1 0 10H12v-2h3.1a3 3 0 1 0 0-6H12V7h3Z"/></svg>
        <span>Copiar link</span>
      </button>
    </div>
  `;

  content.insertAdjacentElement('afterend',block);

  const copyButton=block.querySelector('.article-copy-link');
  if(isPreview){
    copyButton.disabled=true;
    copyButton.title='Compartilhamento desativado durante a pré-visualização';
    return;
  }

  copyButton.addEventListener('click',async()=>{
    const label=copyButton.querySelector('span');
    try{
      await navigator.clipboard.writeText(canonical);
      label.textContent='Link copiado';
      copyButton.classList.add('copied');
      setTimeout(()=>{
        label.textContent='Copiar link';
        copyButton.classList.remove('copied');
      },2200);
    }catch(_){
      const area=document.createElement('textarea');
      area.value=canonical;
      area.style.position='fixed';
      area.style.opacity='0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      label.textContent='Link copiado';
      copyButton.classList.add('copied');
      setTimeout(()=>{
        label.textContent='Copiar link';
        copyButton.classList.remove('copied');
      },2200);
    }
  });
}
