(() => {
  const content = document.getElementById('content');
  const toolbar = document.querySelector('.toolbar');
  const linkBtn = document.getElementById('linkBtn');
  if (!content || !toolbar || !linkBtn) return;

  const STYLE_ID = 'editor-tools-style';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .toolbar{position:sticky;top:10px;z-index:18;display:flex;align-items:center;flex-wrap:wrap;gap:5px;padding:9px;border-color:#cbd5e1;background:rgba(248,250,252,.97);backdrop-filter:blur(8px);box-shadow:0 5px 18px rgba(15,23,42,.05)}
      .toolbar button{min-width:34px;min-height:34px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;font-weight:750;color:#334155;transition:.12s}
      .toolbar button:hover,.toolbar button.active{background:#e0f2fe;border-color:#7dd3fc;color:#075985}
      .toolbar .tool-sep{width:1px;height:25px;background:#dbe3ea;margin:0 2px}
      .toolbar .tool-label{font-size:12px;font-weight:850;padding:0 3px;color:#64748b}
      .rich{min-height:520px;line-height:1.75;font-size:17px;padding:24px}
      .rich:empty:before{pointer-events:none}
      .rich:focus{border-color:#0077b6;box-shadow:0 0 0 3px rgba(0,119,182,.08)}
      .rich h2{font-size:27px;line-height:1.22;color:#0b2545;margin:30px 0 12px}.rich h3{font-size:21px;line-height:1.25;color:#134074;margin:24px 0 10px}
      .rich blockquote{margin:22px 0;padding:14px 18px;border-left:4px solid #00a4df;background:#f0f9ff;color:#475569;border-radius:0 10px 10px 0}
      .rich img{max-width:100%;height:auto;border-radius:10px}
      .editor-content-meta{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:8px;color:#64748b;font-size:12px}
      .editor-content-meta strong{color:#334155}
      .editor-tip{display:flex;align-items:center;gap:6px}.editor-tip kbd{border:1px solid #cbd5e1;border-bottom-width:2px;border-radius:5px;background:#fff;padding:1px 5px;font:700 10px Inter,Arial,sans-serif;color:#475569}
      .field-counter{display:flex;justify-content:flex-end;gap:8px;margin-top:5px;font-size:11px;color:#94a3b8;font-weight:700}.field-counter.good{color:#15803d}.field-counter.warn{color:#a16207}
      .editor-grid>.side{position:sticky;top:18px;align-self:start}
      .editor-link-modal{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.55);backdrop-filter:blur(5px)}
      .editor-link-card{width:min(100%,500px);background:#fff;border-radius:18px;border:1px solid #e2e8f0;box-shadow:0 24px 70px rgba(15,23,42,.28);padding:24px}
      .editor-link-card h2{margin:0;color:#0b2545;font-size:22px}.editor-link-card>p{margin:6px 0 20px;color:#64748b;font-size:13px}
      .editor-link-card label{display:block;margin:0 0 14px;color:#334155;font-size:13px;font-weight:800}.editor-link-card input[type="text"],.editor-link-card input[type="url"]{width:100%;margin-top:6px;padding:12px 13px;border:1px solid #cbd5e1;border-radius:10px;outline:none}.editor-link-card input:focus{border-color:#0077b6;box-shadow:0 0 0 3px rgba(0,119,182,.09)}
      .editor-link-check{display:flex!important;align-items:center;gap:8px!important;font-weight:700!important}.editor-link-check input{width:auto!important;margin:0!important}
      .editor-link-error{display:none;margin:-3px 0 13px;padding:9px 11px;border-radius:9px;background:#fef2f2;color:#b91c1c;font-size:12px;font-weight:750}.editor-link-error.show{display:block}
      .editor-link-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid #eef2f7}.editor-link-actions .remove-link{margin-right:auto;color:#b91c1c}
      @media(max-width:800px){.toolbar{top:70px}.rich{min-height:430px;padding:18px;font-size:16px}.editor-grid>.side{position:static}.editor-tip{display:none}.editor-link-card{padding:20px}.editor-link-actions{flex-wrap:wrap}.editor-link-actions .btn{flex:1}.editor-link-actions .remove-link{flex-basis:100%;order:2}}
    `;
    document.head.appendChild(style);
  }

  content.dataset.placeholder = 'Escreva aqui o conteúdo da matéria...';
  content.setAttribute('spellcheck', 'true');

  const separator = () => {
    const s = document.createElement('span');
    s.className = 'tool-sep';
    s.setAttribute('aria-hidden', 'true');
    return s;
  };

  function dispatchChange() {
    content.dispatchEvent(new Event('input', { bubbles: true }));
    updateContentStats();
  }

  function exec(cmd, value = null) {
    content.focus();
    document.execCommand(cmd, false, value);
    dispatchChange();
    updateToolbarState();
  }

  function tool(label, title, handler, attrs = {}) {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = label;
    b.title = title;
    b.setAttribute('aria-label', title);
    Object.entries(attrs).forEach(([k, v]) => b.dataset[k] = v);
    b.addEventListener('click', handler);
    return b;
  }

  const first = toolbar.firstElementChild;
  toolbar.insertBefore(tool('↶', 'Desfazer (Ctrl+Z)', () => exec('undo'), { enhCmd: 'undo' }), first);
  toolbar.insertBefore(tool('↷', 'Refazer (Ctrl+Y)', () => exec('redo'), { enhCmd: 'redo' }), first);
  toolbar.insertBefore(separator(), first);

  const h2 = toolbar.querySelector('[data-cmd="formatBlock"][data-value="h2"]');
  if (h2) toolbar.insertBefore(tool('P', 'Parágrafo normal', () => exec('formatBlock', 'p'), { block: 'p' }), h2);
  const h3 = toolbar.querySelector('[data-cmd="formatBlock"][data-value="h3"]');
  if (h3) h3.after(tool('❝', 'Citação destacada', () => exec('formatBlock', 'blockquote'), { block: 'blockquote' }));

  const unordered = toolbar.querySelector('[data-cmd="insertUnorderedList"]');
  if (unordered) unordered.after(tool('1. Lista', 'Lista numerada', () => exec('insertOrderedList'), { enhCmd: 'insertOrderedList' }));

  linkBtn.before(separator());
  linkBtn.title = 'Inserir ou editar link';
  linkBtn.setAttribute('aria-label', 'Inserir ou editar link');
  linkBtn.after(tool('⛓×', 'Remover link', () => exec('unlink'), { enhCmd: 'unlink' }));

  const imageBtn = document.getElementById('insertImage');
  if (imageBtn) {
    imageBtn.title = 'Enviar e inserir imagem';
    imageBtn.setAttribute('aria-label', 'Enviar e inserir imagem');
    imageBtn.before(separator());
    imageBtn.after(separator());
    imageBtn.after(tool('Tx', 'Limpar formatação', () => exec('removeFormat'), { enhCmd: 'removeFormat' }));
  }

  const titleMap = {
    bold: 'Negrito (Ctrl+B)', italic: 'Itálico (Ctrl+I)', underline: 'Sublinhado (Ctrl+U)',
    insertUnorderedList: 'Lista com marcadores', formatBlock: 'Formato do parágrafo'
  };
  toolbar.querySelectorAll('[data-cmd]').forEach(b => {
    b.title = b.dataset.value ? `${titleMap[b.dataset.cmd] || 'Formatar'}: ${b.dataset.value.toUpperCase()}` : (titleMap[b.dataset.cmd] || b.textContent.trim());
    b.setAttribute('aria-label', b.title);
  });

  const stats = document.createElement('div');
  stats.className = 'editor-content-meta';
  stats.innerHTML = '<span id="editorWordStats"><strong>0 palavras</strong> · 0 caracteres · leitura ~1 min</span><span class="editor-tip">Atalhos: <kbd>Ctrl</kbd>+<kbd>B</kbd> negrito · <kbd>Ctrl</kbd>+<kbd>K</kbd> link</span>';
  content.after(stats);

  function updateContentStats() {
    const text = (content.innerText || '').replace(/\s+/g, ' ').trim();
    const words = text ? text.split(' ').filter(Boolean).length : 0;
    const chars = text.length;
    const minutes = Math.max(1, Math.ceil(words / 220));
    const el = document.getElementById('editorWordStats');
    if (el) el.innerHTML = `<strong>${words} palavra${words === 1 ? '' : 's'}</strong> · ${chars} caractere${chars === 1 ? '' : 's'} · leitura ~${minutes} min`;
  }

  function addCounter(id, max, idealMin = null, idealMax = null) {
    const input = document.getElementById(id);
    if (!input || input.parentElement.querySelector(`.field-counter[data-for="${id}"]`)) return;
    const c = document.createElement('small');
    c.className = 'field-counter';
    c.dataset.for = id;
    input.after(c);
    const draw = () => {
      const n = input.value.length;
      c.className = 'field-counter';
      if (idealMin !== null && n >= idealMin && n <= idealMax) c.classList.add('good');
      else if (max && n > Math.floor(max * .9)) c.classList.add('warn');
      c.textContent = max ? `${n}/${max} caracteres${idealMin !== null ? ` · ideal: ${idealMin}–${idealMax}` : ''}` : `${n} caracteres`;
    };
    input.addEventListener('input', draw);
    draw();
  }

  addCounter('seoTitle', 70, 50, 60);
  addCounter('seoDescription', 180, 120, 160);
  addCounter('summary', null);

  let savedRange = null;
  let currentAnchor = null;

  function selectionInsideEditor() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const r = sel.getRangeAt(0);
    return content.contains(r.commonAncestorContainer);
  }

  function closestAnchor(node) {
    if (!node) return null;
    const el = node.nodeType === 1 ? node : node.parentElement;
    return el?.closest?.('a') || null;
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  }

  function normalizeUrl(raw) {
    const value = String(raw || '').trim();
    if (!value) return '';
    if (/^(javascript|data):/i.test(value)) return null;
    if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(value)) return value;
    return 'https://' + value;
  }

  function closeLinkModal() {
    document.getElementById('editorLinkModal')?.remove();
  }

  function openLinkModal() {
    const sel = window.getSelection();
    savedRange = selectionInsideEditor() ? sel.getRangeAt(0).cloneRange() : null;
    currentAnchor = savedRange ? closestAnchor(savedRange.startContainer) : null;
    if (currentAnchor && !content.contains(currentAnchor)) currentAnchor = null;
    const selectedText = savedRange ? savedRange.toString() : '';

    closeLinkModal();
    const modal = document.createElement('div');
    modal.id = 'editorLinkModal';
    modal.className = 'editor-link-modal';
    modal.innerHTML = `
      <div class="editor-link-card" role="dialog" aria-modal="true" aria-labelledby="editorLinkTitle">
        <h2 id="editorLinkTitle">${currentAnchor ? 'Editar link' : 'Inserir link'}</h2>
        <p>Informe o endereço e, se desejar, altere o texto exibido na matéria.</p>
        <form id="editorLinkForm">
          <label>Endereço do link<input id="editorLinkUrl" type="text" inputmode="url" autocomplete="url" placeholder="https://exemplo.com.br" required></label>
          <label>Texto do link<input id="editorLinkText" type="text" placeholder="Texto que será exibido"></label>
          <label class="editor-link-check"><input id="editorLinkBlank" type="checkbox"> Abrir em uma nova aba</label>
          <div id="editorLinkError" class="editor-link-error"></div>
          <div class="editor-link-actions">
            <button id="editorRemoveLink" class="btn remove-link" type="button"${currentAnchor ? '' : ' hidden'}>Remover link</button>
            <button id="editorCancelLink" class="btn" type="button">Cancelar</button>
            <button class="btn primary" type="submit">${currentAnchor ? 'Atualizar link' : 'Inserir link'}</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(modal);

    const url = modal.querySelector('#editorLinkUrl');
    const text = modal.querySelector('#editorLinkText');
    const blank = modal.querySelector('#editorLinkBlank');
    const error = modal.querySelector('#editorLinkError');
    if (currentAnchor) {
      url.value = currentAnchor.getAttribute('href') || '';
      text.value = currentAnchor.textContent || '';
      blank.checked = currentAnchor.target === '_blank';
    } else text.value = selectedText;

    const showError = message => { error.textContent = message; error.classList.add('show'); };
    modal.querySelector('#editorCancelLink').onclick = closeLinkModal;
    modal.addEventListener('click', e => { if (e.target === modal) closeLinkModal(); });
    modal.querySelector('#editorRemoveLink').onclick = () => {
      if (currentAnchor) currentAnchor.replaceWith(document.createTextNode(currentAnchor.textContent || ''));
      closeLinkModal();
      dispatchChange();
    };

    modal.querySelector('#editorLinkForm').addEventListener('submit', e => {
      e.preventDefault();
      error.classList.remove('show');
      const href = normalizeUrl(url.value);
      if (href === null) return showError('Esse tipo de endereço não é permitido.');
      if (!href) return showError('Informe o endereço do link.');
      const linkText = text.value.trim();
      const target = blank.checked ? '_blank' : '';

      if (currentAnchor) {
        currentAnchor.setAttribute('href', href);
        if (linkText) currentAnchor.textContent = linkText;
        if (target) { currentAnchor.target = target; currentAnchor.rel = 'noopener'; }
        else { currentAnchor.removeAttribute('target'); currentAnchor.removeAttribute('rel'); }
      } else {
        content.focus();
        const selection = window.getSelection();
        if (savedRange) {
          selection.removeAllRanges();
          selection.addRange(savedRange);
        }
        if (linkText || !savedRange || savedRange.collapsed) {
          const display = linkText || href;
          document.execCommand('insertHTML', false, `<a href="${escapeHtml(href)}"${target ? ' target="_blank" rel="noopener"' : ''}>${escapeHtml(display)}</a>`);
        } else {
          document.execCommand('createLink', false, href);
          const a = closestAnchor(window.getSelection()?.anchorNode);
          if (a && target) { a.target = '_blank'; a.rel = 'noopener'; }
        }
      }
      closeLinkModal();
      dispatchChange();
    });

    setTimeout(() => url.focus(), 20);
  }

  linkBtn.onclick = openLinkModal;

  content.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openLinkModal();
    }
  });

  function updateToolbarState() {
    if (!selectionInsideEditor()) return;
    toolbar.querySelectorAll('[data-cmd], [data-enh-cmd], [data-block]').forEach(b => b.classList.remove('active'));
    ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList'].forEach(cmd => {
      let active = false;
      try { active = document.queryCommandState(cmd); } catch (e) {}
      if (!active) return;
      const b = toolbar.querySelector(`[data-cmd="${cmd}"], [data-enh-cmd="${cmd}"]`);
      b?.classList.add('active');
    });
    let block = '';
    try { block = String(document.queryCommandValue('formatBlock') || '').replace(/[<>]/g, '').toLowerCase(); } catch (e) {}
    toolbar.querySelector(`[data-value="${block}"], [data-block="${block}"]`)?.classList.add('active');
  }

  document.addEventListener('selectionchange', updateToolbarState);
  content.addEventListener('input', updateContentStats);
  updateContentStats();

  const originalApplyState = window.applyState;
  if (typeof originalApplyState === 'function') {
    window.applyState = function (...args) {
      const result = originalApplyState.apply(this, args);
      setTimeout(updateContentStats, 0);
      return result;
    };
  }

  const observer = new MutationObserver(updateContentStats);
  observer.observe(content, { childList: true, subtree: true, characterData: true });
})();
