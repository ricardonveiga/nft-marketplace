# Decisões e desvios em relação ao Figma

Registro das escolhas feitas durante a implementação. O Figma é a referência visual;
tudo o que difere dele (ou que ele não define) está listado aqui.

## Dados e critérios

- **NFT em destaque** (card da barra lateral e, no futuro, o hero): o NFT **mais caro entre
  os disponíveis**. Esgotados ficam de fora para o destaque sempre poder ser comprado.
  Implementado em `GET /api/nfts/featured` (`src/mocks/nfts-handlers.ts`), um único ponto
  para o card e o hero nunca divergirem. O teste usa um mock em que o NFT mais caro do
  catálogo está esgotado, para provar a exclusão.
- **Abas da Início**: "Novos lançamentos" = listados nos últimos 30 dias (data de referência
  fixa dos mocks, `REFERENCE_DATE`); "Em alta" = popularidade ≥ 70.
- **Contagens dos filtros** vêm da API e refletem os 27 NFTs reais do mock. Cada contagem
  ignora o próprio filtro (mostra quanto a opção adicionaria). As contagens do Figma
  (33, 12, 65…) eram placeholder e não foram usadas.
- **Valores em ETH** são sempre string decimal. Comparações usam BigInt (18 casas); o slider de
  preço usa inteiros de 0,01 ETH só para a interface. O serializador de search params
  (`src/lib/search-params.ts`) não converte valores em número, para `0.10` não virar `0.1`.

## Assets

- **Artes dos NFTs**: as 4 imagens do Figma (1254 × 1254, ~2 MB cada) foram redimensionadas
  para 600 × 600 em WebP (~28 KB) em `public/nfts/`, para não prejudicar o LCP. O Figma só tem
  4 artes; elas são reutilizadas entre os NFTs, como no próprio arquivo.
- **Ícones**: SVGs do Figma em `src/assets/icons` e `src/assets/tabbar`. Os ícones de seta e
  de ordenação usam lucide-react (o Figma usa Iconly).
- **Fonte**: Roboto Mono variável, local via `@fontsource-variable/roboto-mono` (sem CDN).

## Acessibilidade (ajustes além do Figma)

- Selo textual **"Esgotado"** nos cards (o estado não depende só de cor).
- Seta de seleção nos filtros de coleção/rede (o Figma só muda a cor).
- Ordenação com `<select>` nativo estilizado; o Figma mostra um dropdown sem comportamento.
- Rótulos visualmente ocultos nos campos de login e cadastro (o Figma usa só placeholder),
  com mensagens de erro ligadas por `aria-describedby` e foco no primeiro campo inválido.
- Gaveta de filtros (mobile e tablet) com foco preso, fechamento por Esc e retorno do foco
  ao botão que a abriu.
- Título "Descubra NFTs" oculto (`sr-only`) até o hero existir.

## Mocks (MSW)

- Cenários por `localStorage['mock-scenario']`: `empty`, `error`, `session-expired`.
- Usuários de demonstração: `ana@kurio.test` / `kurio123` e `bruno@kurio.test` / `kurio456`.
  Contas criadas no cadastro ficam em `localStorage['mock-users']` (sobrevivem ao refresh;
  `resetRegisteredUsers()` volta ao cenário conhecido).
- Sessão: token sem estado (`kurio.<usuário>.<expira>`) em `localStorage['kurio.session']`.
- Respostas de erro: 401 `invalid_credentials` / `session_expired` / `unauthenticated`,
  409 `email_taken`, 422 `validation_error`, 503 no cenário `error`.

## Fora do escopo (inertes e sinalizados com "Em breve")

Páginas editoriais, suporte e atividade, "Esqueceu a senha?", login social, itens do menu
(Criadores, Aprenda), links do footer e newsletter (mostra "indisponível nesta demonstração").

## Pendências conhecidas

- Seções do Figma ainda não implementadas na Início: hero, promoções e blog.
- Login (mobile) e Cadastro foram montados sem ler os frames do Figma (limite do MCP):
  estrutura e campos do Cadastro são inferidos a partir do Login.
