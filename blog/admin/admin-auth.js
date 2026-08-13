(() => {
  const STYLE_ID = 'admin-auth-lock';
  const KEY = 'blog_admin_token';
  const CHANNEL = 'asscontal-admin-auth';

  // Bloqueia o painel antes mesmo de o HTML terminar de carregar.
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .admin-layout {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  const authChannel = ('BroadcastChannel' in window)
    ? new BroadcastChannel(CHANNEL)
    : null;

  function clearAdminSession() {
    sessionStorage.removeItem(KEY);
  }

  // Logout único para todas as páginas administrativas.
  window.adminLogout = function (broadcast = true) {
    clearAdminSession();

    if (broadcast && authChannel) {
      authChannel.postMessage({ type: 'logout' });
    }

    location.replace('./');
  };

  // Se o logout ocorrer em outra aba do painel,
  // encerra esta sessão também.
  if (authChannel) {
    authChannel.addEventListener('message', event => {
      if (event.data?.type === 'logout') {
        clearAdminSession();
        location.replace('./');
      }
    });
  }

  // Garante que todas as páginas tenham
  // o mesmo botão Sair e o mesmo comportamento.
  document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.admin-layout > aside');

    if (!sidebar) return;

    let logout = document.getElementById('logout');

    if (!logout) {
      logout = document.createElement('button');
      logout.type = 'button';
      logout.id = 'logout';
      logout.textContent = 'Sair';
      sidebar.appendChild(logout);
    }

    // Substitui qualquer comportamento antigo do botão Sair.
    logout.onclick = null;

    logout.addEventListener('click', event => {
      event.preventDefault();
      adminLogout(true);
    });
  }, { once: true });

  // Só é chamada depois que a autenticação foi confirmada.
  window.adminUnlock = function () {
    document.getElementById(STYLE_ID)?.remove();
  };

  window.adminAuthenticate = async function () {

    while (true) {

      // Se já existir sessão, valida no Worker antes de liberar.
      const token = sessionStorage.getItem(KEY);

      if (token) {
        try {
          await call('/posts');
          return true;
        } catch (e) {
          clearAdminSession();
        }
      }

      const password = prompt('Senha do administrador:');

      // Clicou em Cancelar
      if (password === null) {
        location.replace('../');
        return false;
      }

      // Campo vazio
      if (!password.trim()) {
        alert('Informe a senha do administrador.');
        continue;
      }

      try {

        const data = await call('/login', {
          method: 'POST',
          body: JSON.stringify({
            password: password
          })
        });

        if (!data || !data.token) {
          throw new Error('Autenticação inválida.');
        }

        sessionStorage.setItem(KEY, data.token);

        return true;

      } catch (e) {

        alert(
          e.message ||
          'Senha incorreta. Verifique a senha e tente novamente.'
        );

      }
    }
  };

})();
