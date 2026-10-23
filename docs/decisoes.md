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

## Carrinho

- **A API calcula tudo**: subtotal, desconto, taxa de rede e total chegam prontos (strings
  decimais, BigInt no mock); a interface só exibe. Nada é recalculado no cliente.
- **Taxa de rede**: fixa, 0.0045 ETH por pedido com ao menos um item comprável.
- **Estoque por edição**: `availableQuantity` = unidades restantes da edição (esgotado = 0).
  Limite por pedido: 5 unidades; `maxQuantity` do item = menor entre o limite e o estoque.
- **Itens indisponíveis** (esgotaram ou o estoque ficou abaixo da quantidade) continuam na
  lista, sinalizados, **ficam fora dos valores** e bloqueiam a finalização até serem resolvidos.
- **Cupons do mock**: `KURIO10` (10%), `GENESIS15` (15%), `EXPIRADO20` (expirado); códigos
  inexistentes são inválidos. Desconto = subtotal × % (divisão inteira em wei).
- **Carrinho do visitante** é identificado por `X-Guest-Cart` (UUID em
  `localStorage['kurio.guest-cart']`). Ao entrar ou cadastrar, `POST /api/cart/merge` passa os
  itens para a conta, somando quantidades (respeitando o limite). O carrinho de cada conta persiste.
- **Troca de usuário/logout** zera o cache privado com `resetQueries` e a consulta do carrinho
  é refeita com a nova identidade.
- **Ordem das respostas**: cada cotação tem `version`; uma resposta mais antiga nunca
  sobrescreve a mais nova (base para os eventos de tempo real).
- **Botão "Finalizar compra"** fica desabilitado até a etapa de pagamento existir.

## Detalhe do NFT

- **Galeria**: o Figma só tem 4 artes. A galeria mostra a arte do NFT e as outras 3 do catálogo
  como miniaturas (dado de mock, só para exercitar a interface). A API devolve `gallery`.
- **Quantidade**: o máximo é o menor entre o limite por pedido (5), o estoque da edição e o que
  ainda cabe somando o que já está no carrinho. A API continua sendo quem decide (409 com mensagem).
- **Edição esgotada**: a tela não oferece compra e explica o motivo.
- **NFT inexistente**: `GET /api/nfts/:id` devolve 404 e a tela mostra "NFT não encontrado"
  (o título da aba também muda).
- **Comprar agora**: adiciona ao carrinho e abre o carrinho (o pagamento ainda não existe).
- **Favoritos** exigem login (visitante vai ao login e volta ao mesmo NFT). Atualização
  otimista; se a API falhar o coração volta ao estado anterior, o erro é avisado e o estado
  real é relido. Cenário de teste: `localStorage['mock-scenario'] = 'favorites-error'`.
- **Dados extras de mock**: descrição e criador por coleção, gerados nas fixtures.

## Pagamento e pedido

- **Duas etapas**: (1) dados do colecionador + carteira e rede, (2) revisão. O envio só acontece
  na revisão, depois de aceitar os termos. `/pagamento` exige login: o visitante vai ao login e
  volta ao pagamento (o destino é fixado na primeira renderização da guarda de rota).
- **Dados do colecionador**: nome, e-mail e telefone brasileiro com DDD (10 ou 11 dígitos,
  aceita máscara). Vêm preenchidos com a conta. Os campos são inferidos (sem o Figma).
- **Carteiras**: do mock (Ana tem 2, Bruno 1; contas novas não têm nenhuma e são avisadas).
  A conexão é simulada no servidor: demora ~0,5 s, persiste após refresh, e a "Carteira
  secundária" da Ana sempre **recusa** a conexão (cenário determinístico). Desconectar é possível.
  A rede de pagamento só oferece as redes que a carteira aceita.
- **Idempotência**: `POST /api/orders` exige o cabeçalho `Idempotency-Key`. Mesma chave + mesmo
  conteúdo devolve o mesmo pedido (sem criar outro); mesma chave com conteúdo diferente é
  conflito (409). A chave vem do conteúdo do pedido e fica na sessão da aba: reenviar depois de
  um timeout ou de um refresh recupera o mesmo pedido. Muda quando o conteúdo muda e é
  renovada depois de um desfecho (para a tentativa seguinte ser um pedido novo).
- **Cliques repetidos**: uma trava síncrona (ref) + botão desabilitado; um segundo clique no
  mesmo instante nem chega à API. Além disso a API recusa um novo pedido enquanto há um pendente.
- **Revalidação**: o envio leva a cotação revisada (`version` + total). Se o carrinho mudou
  (valores, cupom, taxa) a API responde 409 `quote_changed` com a cotação atual; a tela mostra
  o novo resumo, desmarca os termos e exige nova confirmação. Itens indisponíveis, carteira
  desconectada e carrinho vazio também têm tratamento próprio.
- **Estados do pedido**: `pending` → `confirmed` | `declined`. O "processador" simulado decide
  ~1,2 s depois da criação; a página do pedido relê a cada segundo enquanto pendente (hoje por
  polling; os eventos `order.updated` entram na etapa de tempo real). Confirmado esvazia o
  carrinho; recusado mantém carrinho e rascunho.
- **Pedido = retrato (snapshot)** dos itens, valores, carteira e dados do colecionador; mudanças
  no catálogo não o alteram. Pedidos são privados: outro usuário recebe "não encontrado".
- **Confirmação provisória** (`/pedido/:id`): só os dados essenciais (número, referência de
  transação simulada, itens, valores, carteira, rede). O recibo completo vem na próxima etapa.
- **Cenários**: `payment-declined` (o próximo pagamento é recusado), `order-timeout` (cria o
  pedido mas a resposta não chega, uma vez).

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

- Cenários por `localStorage['mock-scenario']`: `empty`, `error` (catálogo, carrinho e pedidos),
  `session-expired`, `favorites-error`, `payment-declined`, `order-timeout`.
- Usuários de demonstração: `ana@kurio.test` / `kurio123` e `bruno@kurio.test` / `kurio456`.
  Contas criadas no cadastro ficam em `localStorage['mock-users']` (sobrevivem ao refresh;
  `resetRegisteredUsers()` volta ao cenário conhecido). Carrinhos ficam em
  `localStorage['mock-cart:<dono>']` (`clearMockCarts()` volta ao cenário conhecido).
- Sessão: token sem estado (`kurio.<usuário>.<expira>`) em `localStorage['kurio.session']`.
- Respostas de erro: 401 `invalid_credentials` / `session_expired` / `unauthenticated`,
  409 `email_taken`, 422 `validation_error`, 503 no cenário `error`.

## Fora do escopo (inertes e sinalizados com "Em breve")

Páginas editoriais, suporte e atividade, "Esqueceu a senha?", login social, itens do menu
(Criadores, Aprenda), links do footer e newsletter (mostra "indisponível nesta demonstração").

## Pendências conhecidas

- Seções do Figma ainda não implementadas na Início: hero, promoções e blog.
- Carrinho, Detalhe do NFT, Pagamento e Pedido montados sem ler os frames do Figma (limite do
  MCP): estrutura, campos e medidas inferidos.
- Falta o cadastro/edição de carteiras (tela Carteiras) e o recibo completo do pedido.
- Login (mobile) e Cadastro foram montados sem ler os frames do Figma (limite do MCP):
  estrutura e campos do Cadastro são inferidos a partir do Login.
