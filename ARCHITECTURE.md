# Arquitetura

Visão técnica do marketplace Kurio: contratos REST e de eventos, sessão, estado do carrinho, cache
e a reconciliação entre REST e Socket.IO. As decisões de cada tela e os desvios do Figma estão em
[`docs/decisoes.md`](./docs/decisoes.md) (o registro detalhado, por tela); este documento cobre o
que atravessa a aplicação. Como rodar: [`README.md`](./README.md).

## Visão geral

```
UI (React, shadcn/ui, Tailwind)
  └─ hooks (TanStack Query)  ← cache, mutações, otimismo
       └─ src/api  →  instância Axios única (src/lib/api.ts)  →  /api/*
                                                                   │  MSW (service worker) responde
  Socket.IO client  ←─ eventos (nft.updated, order.updated) ───────┘  servidor Socket.IO simulado
```

- **Rotas e URL:** TanStack Router (por arquivos). Busca, filtros, ordenação, aba e página do
  catálogo vivem nos search params (`src/lib/catalog-search.ts`, `search-params.ts`) e sobrevivem a
  refresh e ao histórico. Rotas privadas passam por `RequireAuth`. Recurso inexistente em rota válida (NFT, pedido) e rota inexistente têm tela própria.
- **REST:** toda chamada passa por `src/lib/api.ts` (Axios, `baseURL: /api`, timeout de 15 s, ou
  `VITE_API_TIMEOUT_MS`). O interceptor de requisição espera o MSW subir, envia `Authorization` e
  `X-Guest-Cart`; o de resposta reconhece `session_expired`.
- **Mocks:** MSW na camada de rede, ligados por `VITE_ENABLE_MOCKS`, também no build publicado.
  Nenhum componente, hook ou o cliente Axios contém resposta fictícia.
- **ETH:** sempre string decimal; comparações em BigInt (18 casas). Quantidades são inteiras.

## Contratos REST

Todos sob `/api`. "Auth" = exige `Authorization: Bearer <token>` (sem ele: 401 `unauthenticated`).
"Visitante" = funciona sem login. Erros têm o formato `{ code, message?, errors? }`.

| Método e caminho | Auth | Descrição |
| --- | --- | --- |
| `POST /auth/register` | — | Cadastro. 201 `{ user, token }`; 409 `email_taken`; 422 `validation_error` |
| `POST /auth/login` | — | Login. 200 `{ user, token }`; 401 `invalid_credentials`; 422 |
| `GET /auth/session` | token | Usuário da sessão; 401 `session_expired` / `unauthenticated` |
| `POST /auth/logout` | token | 204 |
| `GET /nfts` | — | Listagem. Parâmetros: `page`, `pageSize` (12; máx. 50), `q`, `category[]`, `network[]`, `minPrice`, `maxPrice`, `tab` (`todos`, `novos`, `em-alta`), `sort` (`recent`, `price-asc`, `price-desc`, `name`). Resposta: `{ items, page, pageSize, total, totalPages, facets }` |
| `GET /nfts/:id` | — | Detalhe (inclui `gallery`); 404 `nft_not_found` |
| `GET /nfts/featured` | — | O NFT mais caro entre os disponíveis |
| `GET /nfts/highlights` | — | Os 3 mais caros disponíveis (hero); o 1º é o de `featured` |
| `GET /favorites` | auth | Ids favoritos |
| `PUT /favorites/:nftId` · `DELETE /favorites/:nftId` | auth | Inclui e remove |
| `GET /cart` | visitante | Cotação completa: itens, subtotal, desconto, taxa de rede, total, `version` |
| `POST /cart/items` | visitante | Adiciona. 404 `nft_not_found`; 409 `sold_out` / `quantity_limit`; 422 |
| `PATCH /cart/items/:nftId` · `DELETE /cart/items/:nftId` | visitante | Altera quantidade; remove. 404 `item_not_found` |
| `POST /cart/coupon` · `DELETE /cart/coupon` | visitante | Aplica/remove cupom. 404 `coupon_invalid`; 410 `coupon_expired`; 409 `cart_empty` |
| `POST /cart/merge` | auth | Passa os itens do visitante para a conta (soma, respeitando o limite) |
| `GET /wallets` | auth | `{ wallets, connectedWalletId }` |
| `POST /wallets` · `PATCH /wallets/:id` · `DELETE /wallets/:id` | auth | Cadastra, edita (`isPrimary: true` troca a principal), remove. 409 `wallet_limit` / `wallet_duplicate`; 422 |
| `POST /wallets/:id/connect` · `DELETE /wallets/connection` | auth | Conexão simulada. 403 `wallet_rejected` (recusa) |
| `POST /orders` | auth | Cria o pedido. **Exige** `Idempotency-Key` (400 `idempotency_key_required`). 201 `{ order }`; mesma chave e mesmo conteúdo: 200 com o mesmo pedido (`Idempotent-Replayed`); mesma chave com conteúdo diferente: 409 `idempotency_conflict`. Também: 409 `quote_changed` (com a cotação atual), `items_unavailable`, `wallet_not_connected`, `cart_empty`, `order_in_progress`; 404 `wallet_not_found`; 422 `validation_error` |
| `GET /orders/:id` | auth | Pedido e recibo (retrato). Só do dono: outro usuário recebe 404 `order_not_found` |
| `PATCH /profile` | auth | Nome, e-mail, telefone. 409 `email_taken`; 422 |
| `PUT /profile/avatar` · `DELETE /profile/avatar` | auth | Foto (data URL já reduzida no cliente) |
| `POST /profile/password` | auth | Troca de senha. 422 `invalid_current_password` ou `validation_error` |
| `GET /explorer/tx/:hash` | — | Explorador simulado de transações. 404 `transaction_not_found` |
| `GET /promotions` · `GET /blog/posts` | — | Conteúdo editorial da Início |
| `GET /health` | — | Disponibilidade (não sofre os cenários de falha) |

**Erros em geral:** 401 sessão inválida ou expirada; 403 sem permissão (`forbidden`, ou
`wallet_rejected`); 404 recurso inexistente; 409 conflito de disponibilidade, de cadastro ou de
idempotência; 410 cupom expirado; 422 validação (com `errors` por campo, a mesma regra no
formulário e na API); 503 falha transitória (`unavailable`); 500 `internal_error`.

**Cotação.** A API calcula tudo (subtotal, desconto, taxa de rede fixa de 0.0045 ETH, total); a
interface só exibe. Cada cotação tem `version`; o pedido leva `quote: { version, totalEth }` e a
API recusa com 409 `quote_changed` se a cotação mudou.

## Contratos de eventos (Socket.IO)

Contrato tipado em `src/types/realtime.ts`. Todo evento tem `eventId` (identidade estável),
`resource` (tipo e id), `version` (só avança) e `data` com o **estado completo** dos campos
afetados, nunca um diff: aplicar o mesmo evento duas vezes dá o mesmo resultado.

| Evento | Quem recebe | `data` |
| --- | --- | --- |
| `nft.updated` | todos | `priceEth`, `previousPriceEth`, `availability`, `availableQuantity`, `maxQuantity` |
| `order.updated` | só o dono do pedido | `status`, `settledAt`, `transactionHash`, `declineReason` |
| `orders.subscribe` / `orders.unsubscribe` (cliente → servidor) | — | token da sessão; o servidor guarda quem assinou o quê |

Transporte, limitações do ambiente de mocks e o painel `__mockControl`: seção "Tempo real" do
[`docs/decisoes.md`](./docs/decisoes.md).

## Política de sessão

- **Token** sem estado `kurio.<usuário>.<expira>` (validade de 8 h no mock), guardado em
  `localStorage['kurio.session']` e enviado como `Authorization: Bearer`. A sessão é recuperada
  após refresh por `GET /auth/session`. Usuários e senhas de demonstração: ver o README.
- **Verificação:** a consulta da sessão (`staleTime` de 5 min) é invalidada a cada navegação para
  reconfirmar o token (expiração durante a navegação). Uma falha que não seja 401 (rede, 5xx)
  **não** vira logout: a tela mostra "Não foi possível verificar sua sessão" com nova tentativa.
- **Expiração:** o interceptor do Axios vê `401 session_expired` e dispara `emitSessionExpired`;
  o `AuthListener` descarta o token, limpa os dados privados e leva a `/login`, em `replace`, com
  `redirect` para a página em que o usuário estava e `reason=expired`. Vale também no meio do
  pagamento: depois de entrar, o usuário volta ao pagamento (o rascunho do formulário fica em
  `sessionStorage`). Um token vencido ao abrir a página é só descartado, sem interromper a navegação.
- **Retorno ao fluxo:** `/login?redirect=…` aceita só caminhos internos (`getSafeRedirect` recusa
  `//`, URLs externas e o próprio login). Rotas privadas (`/pagamento`, `/perfil`, `/carteiras`,
  favoritos e pedidos) usam `RequireAuth`.
- **Senhas:** o mock nunca guarda senha em claro. Contas cadastradas (`mock-users`) e senhas
  trocadas no perfil (`mock-profile:*`) ficam só como hash SHA-256 (`passwordHash`, 64 hex, via
  `crypto.subtle`); login e troca de senha comparam hashes. Só as duas credenciais de demonstração
  (públicas, no código das fixtures) existem em claro, e são "hasheadas" na hora da comparação.
  Dados de versões antigas (senha em claro) são convertidos em hash na inicialização do mock
  (`migratePlainPasswords`). Num backend real o certo seria um hash lento e com sal (argon2/bcrypt).
- **Rota inexistente:** um caminho que não existe mostra "Página não encontrada" dentro do layout
  do site (`notFoundComponent` na rota raiz), com link para a Início.
- **Isolamento entre usuários:** ao entrar, sair, expirar ou trocar de conta, `clearPrivateData`
  (`resetQueries`) zera todo o cache, exceto `nfts` (público) e a sessão, e refaz as consultas em
  uso com a identidade nova. O cliente Socket.IO cancela a assinatura da sessão anterior e assina
  a nova; o servidor só entrega `order.updated` ao dono.
- **Carrinho do visitante** (`X-Guest-Cart`, UUID em `localStorage['kurio.guest-cart']`): ao
  entrar ou cadastrar, `POST /cart/merge` o passa para a conta. Cada conta tem o seu, persistido.

## Estado do carrinho

- A fonte da verdade é a API (mock em `localStorage['mock-cart:<dono>']`); o cliente guarda só a
  última cotação no cache (`['cart']`) e **não recalcula nada**.
- Toda mutação devolve a cotação completa. `storeCart` só aceita uma resposta com `version` maior
  ou igual à guardada: respostas fora de ordem nunca sobrescrevem um estado mais novo.
- Itens indisponíveis (esgotados ou com estoque abaixo da quantidade) ficam na lista, sinalizados,
  fora dos valores, e bloqueiam a finalização. Limite de 5 unidades por pedido e por estoque.
- Mudanças de preço e estoque chegam por `nft.updated`; o carrinho é relido (invalidação) e o
  resumo se atualiza. No pagamento, a cotação revisada só vale se continuar igual: senão a API
  responde 409 `quote_changed`, o usuário vê o novo resumo e precisa aceitar de novo.
- Depois de um pedido confirmado, o carrinho é relido (itens comprados saem). Falha ou recusa
  preservam os itens.

## Estratégia de cache

Cliente: TanStack Query. Política consolidada:

| Dado (chave) | `staleTime` | Como se atualiza |
| --- | --- | --- |
| Catálogo (`['nfts', params]`) | 0 (padrão) | `keepPreviousData` mantém a página anterior na tela enquanto a nova carrega; a chave inclui todos os parâmetros, então cada combinação tem a sua entrada |
| Detalhe (`['nfts','detail',id]`) | 30 s | Patch por `nft.updated`; 404 não é repetido |
| Destaque e hero (`['nfts','featured' \| 'highlights']`) | 0 | Invalidados por `nft.updated` (o mais caro pode mudar) |
| Sessão (`['session']`) | 5 min | `setQueryData` no login, cadastro e perfil; invalidada a cada navegação |
| Carrinho (`['cart']`) | 1 min | `storeCart` (por versão) nas mutações; invalidado por `nft.updated` e na reconexão |
| Favoritos (`['favorites']`) | 1 min | Atualização otimista (abaixo) |
| Carteiras (`['wallets']`) | 30 s | Mutações devolvem a lista completa, que vira o cache (`setQueryData`) |
| Pedido (`['orders', id]`) | 0 | `setQueryData` ao criar; `order.updated` por versão; só com o socket fora e pedido pendente relê a cada 1 s |
| Editorial (`['editorial', …]`) | 10 min | Só leitura |

- **`gcTime`, `refetchOnWindowFocus`, `refetchOnReconnect`:** padrões da biblioteca (5 min e
  recarregar ao voltar à aba). Nada customizado.
- **Retry** (`src/lib/query-retry.ts`, padrão do `QueryClient`): só **consultas** e só falha
  transitória: sem resposta (queda ou timeout) 1 nova tentativa; 502/503/504 até 2, com espera de
  300 ms que dobra (teto de 2 s). 401, 403, 404, 409, 422 e 500 não são repetidos. **Ações do
  usuário** (login, salvar, pagar) nunca são repetidas sozinhas; quem repete é o usuário (o
  pagamento usa a chave de idempotência).
- **Otimismo e rollback:** favoritos (`use-favorites.ts`). `onMutate` cancela as consultas,
  guarda o estado anterior e aplica a mudança; `onError` devolve o estado anterior e a tela avisa;
  `onSettled` invalida e relê o estado real. Cenário de teste: `favorites-error`.
- **Invalidação por evento:** `nft.updated` patcha o que está em cache (catálogo, detalhe, destaque)
  e invalida listas, destaque, hero e, se o NFT está nele, o carrinho. `order.updated` atualiza o
  pedido em cache.
- **Respostas obsoletas:** a chave da consulta carrega os parâmetros; uma resposta atrasada vai
  para a entrada da sua própria chave e não sobrescreve a atual (o cenário `variable-latency`
  exercita isso). Não usamos `AbortSignal`: as respostas antigas terminam, mas são descartadas da
  interface. O carrinho e o pedido usam `version` como segunda defesa.
- **Mutações:** cada mutação do carrinho e das carteiras tem `mutationKey`, usada para bloquear
  os controles enquanto uma está em andamento.

## Reconciliação entre REST e Socket.IO

- O REST é a fonte da verdade; o evento é uma notificação com o estado novo. Regras do cliente
  (`src/lib/realtime/apply-events.ts`): `eventId` já visto é ignorado (duplicata); evento com
  `version` menor ou igual à já conhecida do recurso é ignorado (antigo, fora de ordem, ou
  dado que o REST já trouxe mais novo, inclusive no carrinho). Só o que passa por essas regras tem
  efeito: patch do cache, releitura do que a API calcula e o aviso na tela (região `role="status"`).
- **Reconexão:** os eventos perdidos não voltam, então `resyncAfterReconnect` invalida `nfts`,
  `cart` e `orders` e o cliente relê pela API. A assinatura de pedidos é refeita (sessão atual).
- **Pedido pendente com a conexão fora:** o polling de reserva (1 s) recupera o desfecho; ao
  recarregar a página o pedido é lido pelo REST (mesmo estado, sem criar outro). Pedidos
  confirmados e recusados são terminais.
- **Fonte única no mock:** `src/mocks/catalog-state.ts` guarda preço e estoque (com versão por
  NFT) e todo o REST e os eventos leem dali, então nunca divergem.

## Limitações e pendências

**Do ambiente de mocks** (detalhes em "Tempo real" do `docs/decisoes.md`): transporte só
WebSocket; sem namespaces, salas, broadcast nem acks; o servidor simulado vive na página
(recarregar reinicia timers); endereços de carteira só no formato `0x…` (inclusive Solana).

**Conhecidas e abertas:**

- **Performance mobile do Lighthouse abaixo da meta:** 78 (meta 90) em Início e Detalhe; desktop
  99. Causas e tentativas em [`docs/lighthouse.md`](./docs/lighthouse.md).
- **Fidelidade ao Figma, por tela.** O MCP do Figma ficou sem cota; parte da conferência foi feita
  por prints:
  - *Conferidos por print e ajustados:* hero da Início (desktop e mobile; sem círculos e sem texto
    sobre a imagem no desktop, círculos só no mobile), card "NFT em destaque" (sem texto sobre a
    foto), Pagamento mobile, menu lateral "Meu perfil".
  - *Parcial:* Pagamento desktop. Os campos vieram de uma descrição em texto; ordem, espaçamentos,
    agrupamento e alinhamento com o resumo **não foram comparados**. Aguarda o print do frame.
  - *Em aberto:* cor da moldura da arte do hero (hoje creme fixo `#fcf2da`, medido em print; falta
    confirmar com o Figma).
  - *Sem conferir com o frame, estrutura inferida:* Promoções e Diário da Cunhagem, Carrinho,
    Detalhe do NFT, Recibo, Login mobile, Cadastro, Carteiras e Perfil (além do menu lateral).
- **Regressão visual:** a tela é fotografada inteira com tolerância de 1% (`maxDiffPixelRatio`);
  mudanças pequenas e localizadas podem passar sem atualizar a baseline.
- **Fora do escopo, inertes e sinalizados com "Em breve":** páginas editoriais, suporte, atividade,
  ofertas e downloads, "Esqueceu a senha?", login social, itens do menu (Criadores, Aprenda),
  links do rodapé e newsletter.
