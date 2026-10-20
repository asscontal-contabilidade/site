/**
 * Asscontal Assessoria Contábil
 * Core Application Script - Cookie Consent, Back-to-Top & Form Handling
 */

document.addEventListener('DOMContentLoaded', () => {
  initCookieConsent();
  initBackToTop();
  initContactForm();
});

/**
 * 1. Cookie Consent Banner (LGPD Compliance)
 */
function initCookieConsent() {
  const COOKIE_STORAGE_KEY = 'asscontal_cookies_accepted';

  if (localStorage.getItem(COOKIE_STORAGE_KEY) === 'true') {
    return;
  }

  const banner = document.createElement('div');
  banner.id = 'cookieBanner';
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Aviso de Cookies e Privacidade');
  banner.innerHTML = `
    <div class="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
      <div class="cookie-text">
        <i class="fa-solid fa-cookie-bite me-2 text-warning fs-5"></i>
        Utilizamos cookies essenciais para garantir o funcionamento seguro do nosso portal, conforme nossa 
        <a href="privacidade.html" class="cookie-link">Política de Privacidade</a>.
      </div>
      <div class="cookie-actions d-flex gap-2">
        <button id="btnAcceptCookies" type="button" class="btn btn-sm btn-primary rounded-pill px-4 fw-semibold">
          Concordar e Fechar
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  // Trigger animation after render
  setTimeout(() => {
    banner.classList.add('show');
  }, 300);

  const acceptBtn = document.getElementById('btnAcceptCookies');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem(COOKIE_STORAGE_KEY, 'true');
      banner.classList.remove('show');
      setTimeout(() => {
        banner.remove();
      }, 400);
    });
  }
}

/**
 * 2. Back to Top Button
 */
function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTop');
  if (!backToTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 350) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  }, { passive: true });

  backToTopBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/**
 * 3. Interactive Contact Form Handlers
 */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const btnWhatsApp = document.getElementById('btnSendWhatsApp');
  const btnEmail = document.getElementById('btnSendEmail');

  if (!form) return;

  function getFormData() {
    const nome = (document.getElementById('formNome')?.value || '').trim();
    const telefone = (document.getElementById('formTelefone')?.value || '').trim();
    const email = (document.getElementById('formEmail')?.value || '').trim();
    const assunto = document.getElementById('formAssunto')?.value || 'Contato pelo Site';
    const mensagem = (document.getElementById('formMensagem')?.value || '').trim();
    return { nome, telefone, email, assunto, mensagem };
  }

  if (btnWhatsApp) {
    btnWhatsApp.addEventListener('click', (e) => {
      e.preventDefault();
      const { nome, telefone, email, assunto, mensagem } = getFormData();
      if (!nome || !telefone || !mensagem) {
        alert('Por favor, preencha pelo menos Nome, Telefone e Mensagem antes de enviar.');
        return;
      }
      let texto = `*Contato via Site Asscontal*\n\n`;
      texto += `*Nome:* ${nome}\n`;
      texto += `*Telefone:* ${telefone}\n`;
      if (email) texto += `*E-mail:* ${email}\n`;
      texto += `*Assunto:* ${assunto}\n`;
      texto += `*Mensagem:* ${mensagem}`;

      const url = `https://wa.me/552737273600?text=${encodeURIComponent(texto)}`;
      window.open(url, '_blank');
    });
  }

  if (btnEmail) {
    btnEmail.addEventListener('click', (e) => {
      e.preventDefault();
      const { nome, telefone, email, assunto, mensagem } = getFormData();
      if (!nome || !mensagem) {
        alert('Por favor, preencha seu Nome e a Mensagem antes de enviar.');
        return;
      }
      const subject = `[Site Asscontal] ${assunto} - ${nome}`;
      let body = `Nome: ${nome}\nTelefone: ${telefone}\nE-mail: ${email}\nAssunto: ${assunto}\n\nMensagem:\n${mensagem}`;
      window.location.href = `mailto:asscontal@asscontal.com.br?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
}
