'use strict';


/* =============================================
   CONFIGURAÇÃO
============================================= */

const SIGNATURE_FILE = './assinatura.html';

const copySignatureButton =
  document.getElementById('copySignature');

const copyHtmlButton =
  document.getElementById('copyHtml');

const statusElement =
  document.getElementById('status');


/* =============================================
   STATUS
============================================= */

let statusTimer = null;


function showStatus(message, type = 'success') {

  if (!statusElement) {
    return;
  }

  statusElement.textContent = message;

  statusElement.classList.remove(
    'success',
    'error'
  );

  statusElement.classList.add(type);


  if (statusTimer) {
    clearTimeout(statusTimer);
  }


  statusTimer = setTimeout(() => {

    statusElement.textContent = '';

    statusElement.classList.remove(
      'success',
      'error'
    );

  }, 4000);

}


/* =============================================
   BAIXAR ASSINATURA
============================================= */

async function getSignature() {

  const response = await fetch(
    SIGNATURE_FILE,
    {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
      redirect: 'error'
    }
  );


  if (!response.ok) {

    throw new Error(
      `Erro HTTP ${response.status}`
    );

  }


  const html = await response.text();


  /*
   * Faz o parse em memória.
   * Nenhum script da página carregada é executado.
   */

  const parser =
    new DOMParser();

  const documentSignature =
    parser.parseFromString(
      html,
      'text/html'
    );


  const signature =
    documentSignature.getElementById(
      'email-signature'
    );


  if (!signature) {

    throw new Error(
      'Assinatura não encontrada.'
    );

  }


  return signature;

}


/* =============================================
   TEXTO PURO
============================================= */

function getPlainText(signature) {

  const clone =
    signature.cloneNode(true);


  /*
   * Não queremos CSS aparecendo na
   * versão text/plain.
   */

  clone
    .querySelectorAll('style')
    .forEach((element) => {

      element.remove();

    });


  return clone
    .textContent
    .replace(/\s+/g, ' ')
    .trim();

}


/* =============================================
   COPIAR ASSINATURA
============================================= */

async function copySignature() {

  if (!window.isSecureContext) {

    showStatus(
      'A cópia automática requer HTTPS.',
      'error'
    );

    return;

  }


  if (
    !navigator.clipboard ||
    typeof ClipboardItem === 'undefined'
  ) {

    showStatus(
      'Seu navegador não oferece suporte à cópia formatada.',
      'error'
    );

    openSignature();

    return;

  }


  try {

    const signature =
      await getSignature();


    /*
     * Copiamos somente o conteúdo interno.
     */

    const html =
      signature.innerHTML.trim();


    const plainText =
      getPlainText(signature);


    const htmlBlob =
      new Blob(
        [html],
        {
          type: 'text/html'
        }
      );


    const textBlob =
      new Blob(
        [plainText],
        {
          type: 'text/plain'
        }
      );


    const clipboardItem =
      new ClipboardItem({

        'text/html': htmlBlob,

        'text/plain': textBlob

      });


    await navigator.clipboard.write([
      clipboardItem
    ]);


    showStatus(
      'Assinatura copiada com sucesso.'
    );

  }

  catch (error) {

    console.error(
      'Erro ao copiar assinatura:',
      error
    );


    showStatus(
      'Não foi possível copiar automaticamente. A assinatura será aberta para cópia manual.',
      'error'
    );


    openSignature();

  }

}


/* =============================================
   COPIAR HTML
============================================= */

async function copyHtml() {

  if (!window.isSecureContext) {

    showStatus(
      'A cópia requer HTTPS.',
      'error'
    );

    return;

  }


  try {

    const signature =
      await getSignature();


    const html =
      signature.innerHTML.trim();


    await navigator.clipboard.writeText(
      html
    );


    showStatus(
      'Código HTML copiado com sucesso.'
    );

  }

  catch (error) {

    console.error(
      'Erro ao copiar HTML:',
      error
    );


    showStatus(
      'Não foi possível copiar o código HTML.',
      'error'
    );

  }

}


/* =============================================
   FALLBACK
============================================= */

function openSignature() {

  const windowReference =
    window.open(
      SIGNATURE_FILE,
      '_blank',
      'noopener,noreferrer'
    );


  if (windowReference) {

    windowReference.opener = null;

  }

}


/* =============================================
   EVENTOS
============================================= */

if (copySignatureButton) {

  copySignatureButton.addEventListener(
    'click',
    copySignature
  );

}


if (copyHtmlButton) {

  copyHtmlButton.addEventListener(
    'click',
    copyHtml
  );

}
