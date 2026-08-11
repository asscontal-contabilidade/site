# Site Institucional - Asscontal Assessoria Contábil

Este é o repositório do site institucional da Asscontal Assessoria Contábil, uma empresa com tradição no mercado desde 1971. O site foi desenvolvido para ser moderno, responsivo e informativo, servindo como um portal central para clientes, colaboradores e visitantes.

## ✨ Visão Geral

O projeto consiste em um site estático de múltiplas páginas, construído com tecnologias web modernas para garantir uma experiência de usuário rápida e agradável em todos os dispositivos. Ele destaca os serviços da empresa, especialidades, portais de acesso rápido e informações de contato.

## 🚀 Funcionalidades

- **Design Responsivo**: Totalmente adaptável para desktops, tablets e smartphones.
- **Página Principal (`index.html`)**:
    - **Portais de Acesso**: Cards de destaque para a "Área do Cliente", "Portal do Colaborador" e "Blog".
    - **Especialidades**: Seção visual que apresenta as áreas de especialização da contabilidade (Confecções, Comércio, Consultórios, etc.).
    - **Visão Geral dos Serviços**: Ícones e títulos para os principais serviços oferecidos (Contábeis, Fiscais, Departamento Pessoal, etc.).
    - **Banner de Chamada para Ação (CTA)**: Um banner convidativo para entrar em contato com especialistas.
- **Página de Contato (`contato.html`)**:
    - Informações de contato claras, incluindo Telefone/WhatsApp, E-mail, Endereço e Horário de Atendimento.
    - Mapa do Google Maps incorporado para fácil localização.
- **Navegação Intuitiva**:
    - Barra de navegação fixa (`sticky-top`).
    - Menus dropdown para "Serviços", "Consultas" e "Downloads", com links diretos para ferramentas e portais externos úteis.
- **Gráficos Otimizados**: Uso de SVGs embutidos para ilustrações, garantindo leveza, escalabilidade e alta qualidade visual sem depender de múltiplos arquivos de imagem.

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica do conteúdo.
- **CSS3**: Estilização customizada, utilizando Variáveis CSS (`:root`) para fácil manutenção do tema.
- **Bootstrap 5**: Framework front-end para layout responsivo e componentes de UI.
- **Font Awesome**: Biblioteca de ícones vetoriais.
- **Google Fonts**: Para a tipografia do site (família 'Inter').

## 📂 Estrutura de Arquivos

```
.
├── index.html          # Página principal
├── contato.html        # Página de contato
├── style.css           # Folha de estilos customizada
├── images/             # Diretório para imagens (logos, favicons, etc.)
└── README.md           # Este arquivo
```

## 🏁 Como Executar

Este é um projeto de site estático. Nenhuma compilação ou instalação de dependências é necessária.

1.  Clone este repositório:
    ```bash
    git clone <URL_DO_REPOSITORIO>
    ```
2.  Navegue até o diretório do projeto:
    ```bash
    cd <NOME_DO_DIRETORIO>
    ```
3.  Abra o arquivo `index.html` diretamente no seu navegador de preferência.

## 🎨 Customização

A personalização do site é simples e centralizada:

- **Cores**: As cores primárias, secundárias e de destaque podem ser facilmente alteradas modificando as variáveis CSS no início do arquivo `style.css`.

  ```css
  :root {
    --primary-color: #0b2545;
    --secondary-color: #134074;
    --accent-color: #0077b6;
    /* ...outras variáveis */
  }
  ```

- **Fontes**: A fonte 'Inter' é importada do Google Fonts. Para alterá-la, basta substituir o link no `<head>` dos arquivos `.html` e atualizar a propriedade `font-family` no `body` do `style.css`.

---

##  Desenvolvimento

O desenvolvimento deste site foi realizado em conjunto
- **Asscontal Acessoria Contável**: Libério Lorenoni
- **CompuCenter Tecnologia**: Frédney R. Moronari

---