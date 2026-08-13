(() => {
  const STYLE_ID = 'admin-auth-lock';
  const UI_STYLE_ID = 'admin-ui-style';
  const MODAL_ID = 'admin-login-modal';
  const KEY = 'blog_admin_token';
  const CHANNEL = 'asscontal-admin-auth';
  let loginPromise = null;

  const lockStyle = document.createElement('style');
  lockStyle.id = STYLE_ID;
  lockStyle.textContent = '.admin-layout{display:none!important}';
  document.head.appendChild(lockStyle);

  const uiStyle = document.createElement('style');
  uiStyle.id = UI_STYLE_ID;
  uiStyle.textContent = `
    #${MODAL_ID}{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(15,23,42,.68);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    #${MODAL_ID} *{box-sizing:border-box}
    #${MODAL_ID} .admin-login-card{width:min(100%,430px);background:#fff;border:1px solid rgba(226,232,240,.9);border-radius:22px;padding:34px 34px 28px;box-shadow:0 28px 80px rgba(15,23,42,.30);animation:adminLoginIn .22s ease-out}
    #${MODAL_ID} .admin-login-logo{display:flex;justify-content:center;margin-bottom:20px}
    #${MODAL_ID} .admin-login-logo img{display:block;max-width:155px;max-height:86px;object-fit:contain}
    #${MODAL_ID} .admin-login-kicker{text-align:center;color:#0077b6;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:7px}
    #${MODAL_ID} h1{margin:0;text-align:center;color:#0f172a;font-size:26px;line-height:1.2;font-weight:800}
    #${MODAL_ID} .admin-login-subtitle{margin:9px 0 26px;text-align:center;color:#64748b;font-size:14px;line-height:1.55}
    #${MODAL_ID} label{display:block;margin-bottom:8px;color:#334155;font-size:13px;font-weight:750}
    #${MODAL_ID} .admin-login-field{position:relative}
    #${MODAL_ID} input{width:100%;height:50px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;color:#0f172a;padding:0 82px 0 14px;font:inherit;font-size:15px;outline:none;transition:border-color .15s,box-shadow .15s}
    #${MODAL_ID} input:focus{border-color:#0077b6;box-shadow:0 0 0 4px rgba(0,119,182,.12)}
    #${MODAL_ID} .admin-login-toggle{position:absolute;right:7px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:#64748b;font-size:12px;font-weight:800;padding:8px 7px;cursor:pointer;border-radius:8px}
    #${MODAL_ID} .admin-login-toggle:hover{background:#f1f5f9;color:#0f172a}
    #${MODAL_ID} .admin-login-error{display:none;margin:12px 0 0;padding:10px 12px;border-radius:10px;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;font-size:13px;font-weight:650;line-height:1.4}
    #${MODAL_ID} .admin-login-error.show{display:block}
    #${MODAL_ID} .admin-login-submit{width:100%;height:50px;margin-top:18px;border:0;border-radius:12px;background:#0077b6;color:#fff;font-size:15px;font-weight:800;cursor:pointer;transition:transform .12s,background .12s,opacity .12s}
    #${MODAL_ID} .admin-login-submit:hover:not(:disabled){background:#00679e;transform:translateY(-1px)}
    #${MODAL_ID} .admin-login-submit:disabled{opacity:.72;cursor:wait}
    #${MODAL_ID} .admin-login-cancel{display:block;margin:14px auto 0;border:0;background:transparent;color:#64748b;font-size:13px;font-weight:700;cursor:pointer;padding:6px 10px;border-radius:8px}
    #${MODAL_ID} .admin-login-cancel:hover{background:#f8fafc;color:#334155}
    #${MODAL_ID} .admin-login-secure{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:22px;padding-top:18px;border-top:1px solid #eef2f7;color:#94a3b8;font-size:12px}
    #${MODAL_ID} .admin-login-lock{width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#ecfdf5;color:#15803d;font-size:11px;font-weight:900}
    .admin-mobile-bar{display:none}
    .admin-nav-backdrop{display:none}
    .admin-layout>aside nav a{display:flex;align-items:center;gap:10px}
    .admin-layout>aside nav a span:first-child{width:20px;text-align:center;flex:0 0 20px}
    @keyframes adminLoginIn{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
    @media(max-width:800px){
      body.admin-auth-unlocked{padding-top:64px}
      body.admin-auth-unlocked .admin-mobile-bar{display:flex;position:fixed;top:0;left:0;right:0;height:64px;z-index:10020;align-items:center;justify-content:space-between;padding:0 16px;background:#0b2545;color:#fff;box-shadow:0 6px 22px rgba(2,12,27,.22)}
      .admin-mobile-brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:.02em}
      .admin-mobile-brand img{width:104px;max-height:42px;object-fit:contain;filter:brightness(0) invert(1)}
      .admin-mobile-toggle{width:42px;height:42px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.20);border-radius:10px;background:rgba(255,255,255,.08);color:#fff;font-size:23px;cursor:pointer}
      .admin-layout>aside{position:fixed!important;top:0!important;left:0!important;bottom:0!important;width:min(84vw,300px)!important;z-index:10030!important;padding:22px 18px!important;transform:translateX(-105%);transition:transform .22s ease;box-shadow:14px 0 38px rgba(2,12,27,.30);overflow-y:auto}
      body.admin-nav-open .admin-layout>aside{transform:translateX(0)}
      .admin-layout>aside nav{display:grid!important;overflow:visible!important;gap:7px!important}
      .admin-layout>aside nav a{white-space:normal!important}
      .admin-layout aside>button{margin-top:auto!important}
      body.admin-auth-unlocked .admin-nav-backdrop{display:block;position:fixed;inset:0;z-index:10025;background:rgba(15,23,42,.45);opacity:0;visibility:hidden;transition:opacity .2s ease,visibility .2s ease}
      body.admin-nav-open .admin-nav-backdrop{opacity:1;visibility:visible}
      .admin-layout main{padding:20px!important}
      #${MODAL_ID}{padding:16px}
      #${MODAL_ID} .admin-login-card{padding:28px 22px 24px;border-radius:18px}
      #${MODAL_ID} h1{font-size:23px}
    }
  `;
  document.head.appendChild(uiStyle);

  const authChannel = ('BroadcastChannel' in window) ? new BroadcastChannel(CHANNEL) : null;

  function clearAdminSession(){ sessionStorage.removeItem(KEY); }
  function closeLoginModal(){ document.getElementById(MODAL_ID)?.remove(); document.documentElement.style.removeProperty('overflow'); }

  function openLoginModal(){
    if(loginPromise) return loginPromise;
    loginPromise = new Promise(resolve => {
      closeLoginModal();
      const overlay = document.createElement('div');
      overlay.id = MODAL_ID;
      overlay.setAttribute('role','dialog');
      overlay.setAttribute('aria-modal','true');
      overlay.setAttribute('aria-labelledby','adminLoginTitle');
      overlay.innerHTML = `
        <div class="admin-login-card">
          <div class="admin-login-logo"><img src="../../images/logo-2019-190x105.png" alt="Asscontal Contabilidade"></div>
          <div class="admin-login-kicker">Asscontal Blog</div>
          <h1 id="adminLoginTitle">Área Administrativa</h1>
          <p class="admin-login-subtitle">Informe sua senha para acessar o painel de administração.</p>
          <form id="adminLoginForm" novalidate>
            <label for="adminLoginPassword">Senha</label>
            <div class="admin-login-field">
              <input id="adminLoginPassword" type="password" autocomplete="current-password" required aria-describedby="adminLoginError">
              <button class="admin-login-toggle" id="adminLoginToggle" type="button" aria-label="Mostrar senha">Mostrar</button>
            </div>
            <div class="admin-login-error" id="adminLoginError" role="alert"></div>
            <button class="admin-login-submit" id="adminLoginSubmit" type="submit">Entrar</button>
            <button class="admin-login-cancel" id="adminLoginCancel" type="button">Cancelar</button>
          </form>
          <div class="admin-login-secure"><span class="admin-login-lock">✓</span><span>Acesso restrito e protegido</span></div>
        </div>`;
      document.body.appendChild(overlay);
      document.documentElement.style.overflow='hidden';

      const form=overlay.querySelector('#adminLoginForm');
      const password=overlay.querySelector('#adminLoginPassword');
      const toggle=overlay.querySelector('#adminLoginToggle');
      const submit=overlay.querySelector('#adminLoginSubmit');
      const cancel=overlay.querySelector('#adminLoginCancel');
      const error=overlay.querySelector('#adminLoginError');
      const showError=m=>{error.textContent=m;error.classList.add('show')};
      const clearError=()=>{error.textContent='';error.classList.remove('show')};
      const finish=result=>{closeLoginModal();loginPromise=null;resolve(result)};

      toggle.addEventListener('click',()=>{
        const showing=password.type==='text';
        password.type=showing?'password':'text';
        toggle.textContent=showing?'Mostrar':'Ocultar';
        toggle.setAttribute('aria-label',showing?'Mostrar senha':'Ocultar senha');
        password.focus();
      });
      cancel.addEventListener('click',()=>finish(false));
      form.addEventListener('submit',async event=>{
        event.preventDefault();
        clearError();
        const value=password.value.trim();
        if(!value){showError('Informe a senha do administrador.');password.focus();return}
        submit.disabled=password.disabled=toggle.disabled=cancel.disabled=true;
        submit.textContent='Entrando...';
        try{
          const data=await call('/login',{method:'POST',body:JSON.stringify({password:value})});
          if(!data?.token) throw new Error('Autenticação inválida.');
          sessionStorage.setItem(KEY,data.token);
          finish(true);
        }catch(e){
          showError(e.message||'Senha incorreta. Verifique a senha e tente novamente.');
          submit.disabled=password.disabled=toggle.disabled=cancel.disabled=false;
          submit.textContent='Entrar';
          password.focus();password.select();
        }
      });
      setTimeout(()=>password.focus(),30);
    });
    return loginPromise;
  }

  function currentAdminPage(){
    const file=location.pathname.split('/').filter(Boolean).pop()||'index.html';
    return file==='admin'?'index.html':file;
  }

  function closeMobileNav(){ document.body.classList.remove('admin-nav-open'); }

  function setupNavigation(){
    const layout=document.querySelector('.admin-layout');
    const sidebar=layout?.querySelector(':scope > aside');
    const nav=sidebar?.querySelector('nav');
    if(!layout||!sidebar||!nav) return;

    const page=currentAdminPage();
    const items=[
      ['index.html','./','▦','Dashboard'],
      ['editor.html','editor.html','＋','Nova matéria'],
      ['categorias.html','categorias.html','☷','Categorias'],
      ['menu.html','menu.html','☰','Menu do blog'],
      ['configuracoes.html','configuracoes.html','⚙','Configurações'],
      ['saude.html','saude.html','♡','Saúde do sistema']
    ];

    nav.innerHTML=items.map(([file,href,icon,label])=>`<a href="${href}"${page===file?' class="active"':''}><span>${icon}</span><span>${label}</span></a>`).join('')+
      '<a href="../" target="_blank" rel="noopener"><span>↗</span><span>Ver blog</span></a>';

    let logout=document.getElementById('logout');
    if(!logout){
      logout=document.createElement('button');
      logout.type='button';
      logout.id='logout';
      logout.textContent='Sair';
      sidebar.appendChild(logout);
    }
    logout.onclick=null;
    logout.addEventListener('click',e=>{e.preventDefault();adminLogout(true)});

    if(!document.querySelector('.admin-mobile-bar')){
      const bar=document.createElement('div');
      bar.className='admin-mobile-bar';
      bar.innerHTML='<div class="admin-mobile-brand"><img src="../../images/logo-2019-190x105.png" alt="Asscontal"><span>Painel</span></div><button class="admin-mobile-toggle" type="button" aria-label="Abrir menu" aria-expanded="false">☰</button>';
      document.body.insertBefore(bar,layout);
      const backdrop=document.createElement('div');
      backdrop.className='admin-nav-backdrop';
      document.body.appendChild(backdrop);
      const toggle=bar.querySelector('.admin-mobile-toggle');
      toggle.addEventListener('click',()=>{
        const open=document.body.classList.toggle('admin-nav-open');
        toggle.setAttribute('aria-expanded',String(open));
        toggle.textContent=open?'×':'☰';
        toggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');
      });
      backdrop.addEventListener('click',closeMobileNav);
      nav.addEventListener('click',e=>{if(e.target.closest('a')) closeMobileNav()});
      document.addEventListener('keydown',e=>{if(e.key==='Escape') closeMobileNav()});
    }
  }

  window.adminLogout=function(broadcast=true){
    clearAdminSession();
    if(broadcast&&authChannel) authChannel.postMessage({type:'logout'});
    location.replace('./');
  };

  if(authChannel){
    authChannel.addEventListener('message',event=>{
      if(event.data?.type==='logout'){clearAdminSession();location.replace('./')}
    });
  }

  document.addEventListener('DOMContentLoaded',setupNavigation,{once:true});

  window.adminUnlock=function(){
    document.getElementById(STYLE_ID)?.remove();
    document.body.classList.add('admin-auth-unlocked');
  };

  window.adminAuthenticate=async function(){
    const token=sessionStorage.getItem(KEY);
    if(token){
      try{await call('/posts');return true}catch(e){clearAdminSession()}
    }
    const authenticated=await openLoginModal();
    if(!authenticated){location.replace('../');return false}
    return true;
  };
})();
