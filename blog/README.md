# Portal de Notícias — GitHub Pages

Projeto inicial de um portal/blog responsivo com painel administrativo.

## Estrutura

- `/` — portal público
- `/materia.html?id=...` — matéria
- `/categoria.html?cat=...` — categoria
- `/busca.html` — busca
- `/admin/` — painel administrativo
- `/admin/editor.html` — editor de matérias

## Como testar

Abra `index.html` localmente ou publique o projeto em GitHub Pages.

## Importante sobre o painel

Esta versão funciona imediatamente como **protótipo funcional no navegador**, salvando matérias no `localStorage`. Isso permite testar o layout e o editor sem servidor.

Para que o painel publique matérias e imagens **diretamente no repositório GitHub**, será necessário conectar a GitHub API/OAuth ou usar um backend/serverless. Recomenda-se não colocar um Personal Access Token do GitHub diretamente no JavaScript público.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie todos os arquivos mantendo a estrutura de pastas.
3. Em Settings > Pages, escolha a branch principal e a pasta `/root`.
4. Salve e aguarde a publicação.

## Próxima etapa recomendada

Adicionar autenticação real e integração segura com GitHub API para:
- criar/editar arquivos Markdown ou JSON;
- enviar imagens;
- gerar URLs amigáveis;
- publicar automaticamente;
- manter histórico pelo Git.

O conteúdo de demonstração pode ser substituído pelo conteúdo real do portal.
