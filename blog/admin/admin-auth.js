
(() => {
  const STYLE_ID = 'admin-auth-lock';
  const KEY = 'blog_admin_token';

  // Bloqueia o painel antes mesmo de o HTML terminar de carregar.
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .admin-layout {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

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
          sessionStorage.removeItem(KEY);
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
