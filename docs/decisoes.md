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

## Hero da Início

- **Critério de "destaque"** (hero e card da barra lateral): o NFT mais caro entre os
  disponíveis. `GET /api/nfts/highlights` devolve os 3 mais caros (empate pelo id); o primeiro é
  exatamente o NFT do card `GET /api/nfts/featured`, então os dois nunca divergem. Esgotado
  nunca é destaque. Eventos `nft.updated` fazem o hero se recalcular (se o destaque esgota, o
  próximo assume).
- **Carrossel** com 3 destaques e indicadores (os 3 pontos do Figma). **Sem rotação automática**:
  conteúdo que se move sozinho exige botão de pausa e atrapalha quem usa leitor de tela; a troca é
  só pelos indicadores (botões, com `aria-current` e posição "N de 3"). Sem animação de troca, o
  que também respeita `prefers-reduced-motion`.
- **Textos do Figma**: desktop "Seja dono do futuro da arte digital" + parágrafo longo; mobile
  "Seja dono da cultura digital" + parágrafo curto. As duas variantes existem no DOM e só a visível
  entra na árvore de acessibilidade. O título do hero é o único `h1` da página.
- **Nome e preço do NFT** aparecem sobre a imagem no desktop; no mobile (arte de 138 px) ficam só
  para leitores de tela. A miniatura de 58 px sobreposta (mobile) é o próximo destaque, decorativa.
- **EXPLORAR** rola até o catálogo e leva o foco para a seção (sem mexer na URL nem nos filtros).
- **Dimensões**: 1200 × 450 no desktop e 366 × 190 no mobile (medidas do Figma). O fundo e os
  círculos decorativos são inferidos (cor `surface-dark` e círculos translúcidos).
- Sem destaques (catálogo vazio ou erro) o hero mantém texto e botão, sem arte.

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

## Perfil do colecionador (`/perfil`)

- **Dados**: nome, e-mail e telefone (opcional, só dígitos; exibido como `(11) 91234-5678`).
  O perfil é parte do usuário da sessão: ao salvar, o cache da sessão se atualiza e o header
  reflete na hora. A "consulta" do perfil é a própria consulta da sessão (`/api/auth/session`);
  a API de perfil tem só as operações de escrita (`PATCH /api/profile`, `PUT`/`DELETE
  /api/profile/avatar`, `POST /api/profile/password`).
- **Validação** igual no formulário e na API: nome (2+ caracteres), e-mail válido, telefone com
  DDD quando informado. "Salvar alterações" só habilita quando algo muda. E-mail de outra conta
  é conflito (409) e o erro aparece no campo. Trocar o e-mail vale para o próximo login.
- **Telefone no pagamento**: vem preenchido com o do perfil.
- **Foto**: aceita PNG, JPEG ou WebP até 2 MB. O navegador recorta o quadrado central e reduz para
  256 × 256 em WebP (~15 KB) antes de enviar; o que fica guardado é esse data URL, nunca o arquivo
  original (`lib/image.ts`). Tipo inválido, arquivo grande e imagem corrompida têm mensagem
  própria. Sem foto, aparecem as iniciais. A foto também aparece no menu da conta (header e barra
  inferior do mobile). O campo de arquivo é um `<input type="file">` real, rotulado por
  "Alterar foto" (acessível por teclado).
- **Senha**: exige a senha atual (errada = erro no campo), a nova segue a mesma regra do cadastro
  (8+ caracteres, letras e números), tem que ser diferente da atual e ter confirmação. Ao
  concluir, os campos são limpos e a nova senha vale no próximo login. Cada campo tem o seu botão
  de mostrar/ocultar.
- **Mock**: alterações de perfil por usuário em `localStorage['mock-profile:<usuário>']`, por
  cima das fixtures e dos usuários cadastrados (`resetProfiles()` volta ao cenário conhecido).
- Sem frame mobile no Figma: abaixo de 1024 px os blocos empilham em uma coluna.

## Carteiras (`/carteiras`)

- **Regra do desafio**: no máximo **uma principal e uma secundária**. A primeira carteira de uma
  conta vira a principal; a segunda, a secundária; não há uma terceira (a API recusa com 409
  `wallet_limit`, e a tela nem oferece o botão).
- **Ações**: cadastrar, editar (apelido, endereço, redes), trocar qual é a principal e remover
  (com diálogo de confirmação). Remover a principal promove a outra. Trocar o endereço de uma
  carteira conectada encerra a conexão (a conexão passou a valer para outro endereço).
- **Validação** (a mesma no formulário e na API simulada): apelido de 2 a 30 caracteres, endereço
  `0x` + 40 caracteres hexadecimais, ao menos uma rede. Endereço repetido na mesma conta é conflito
  (409 `wallet_duplicate`, sem diferenciar maiúsculas) e o erro aparece no campo.
- **Formato do endereço**: só aceita o formato `0x…` para as três redes (inclusive Solana), por
  simplicidade e para casar com os dados do mock. Um endereço real de Solana (base58) seria
  recusado; num backend de verdade a validação dependeria da rede.
- **Formulário** em diálogo de 500 px (mesmo padrão do modal de login), com foco preso, Esc para
  fechar e retorno do foco ao botão. Cada abertura recomeça do estado salvo.
- **Do pagamento**: o aviso "sem carteiras" e o link "Gerenciar carteiras" levam a
  `/carteiras?redirect=/pagamento`; depois de salvar, aparece "Voltar ao pagamento". Assim contas
  novas conseguem concluir uma compra.
- **Mock**: carteiras por usuário em `localStorage['mock-wallets:<usuário>']`, semeadas com as
  fixtures (Ana: 2; Bruno: 1; contas novas: nenhuma). A "Carteira secundária" da Ana continua
  recusando a conexão, para o cenário de recusa do pagamento.
- **Sem frame mobile** no Figma: a tela empilha as carteiras em uma coluna abaixo de 768 px.

## Pagamento e pedido

- **Duas etapas**: (1) dados do colecionador + carteira e rede, (2) revisão. O envio só acontece
  na revisão, depois de aceitar os termos. `/pagamento` exige login: o visitante vai ao login e
  volta ao pagamento (o destino é fixado na primeira renderização da guarda de rota).
- **Dados do colecionador**: nome, e-mail e telefone brasileiro com DDD (10 ou 11 dígitos,
  aceita máscara). Vêm preenchidos com a conta. Os campos são inferidos (sem o Figma).
- **Carteiras**: do mock (Ana tem 2, Bruno 1; contas novas não têm nenhuma e cadastram em `/carteiras`).
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
  polling de reserva; o desfecho chega por `order.updated`, ver "Tempo real"). Confirmado esvazia o
  carrinho; recusado mantém carrinho e rascunho.
- **Pedido = retrato (snapshot)** dos itens, valores, carteira e dados do colecionador; mudanças
  no catálogo não o alteram. Pedidos são privados: outro usuário recebe "não encontrado".
- **Recibo** (`/pedido/:id`, confirmado): número do pedido, datas (feito/confirmado, em UTC para ser
  determinístico), itens (quantidade × preço unitário e total da linha), valores (subtotal,
  desconto com o código do cupom, taxa de rede, total), carteira e rede, dados do colecionador e a
  referência da transação. É o **retrato** do pedido: itens, preços e valores foram copiados na
  criação, então mudanças posteriores no catálogo (preço, estoque) não o alteram; só o link de cada
  item leva ao NFT atual.
- **Referência e explorador (simulados)**: o hash tem 64 caracteres hexadecimais, é derivado do
  número do pedido e pode ser copiado. O link "Ver no explorador (simulado)" abre uma página do
  próprio app (`/explorador/:hash`, pública, como um explorador real) que mostra rede, status, bloco,
  data, origem (a carteira), destino (um contrato do marketplace fictício), valor e taxa. Ela não
  expõe nada do colecionador nem o número do pedido. Nenhuma rede real é consultada e a página
  avisa isso.
- **Recusado**: mostra o motivo, os itens do retrato e "Tentar novamente"; não tem referência de
  transação nem botão de imprimir. Pendente: aviso de processamento e os mesmos blocos.
- **Imprimir recibo**: chama `window.print()`; os estilos de impressão (`print:hidden`, `@media
  print`) escondem header, footer, barra inferior e botões e usam papel claro.
- **Cenários**: `payment-declined` (o próximo pagamento é recusado), `order-timeout` (cria o
  pedido mas a resposta não chega, uma vez).

## Tempo real (Socket.IO)

**Transporte.** O cliente é o `socket.io-client` de verdade, conectado a um servidor Socket.IO
simulado na camada de rede com MSW + `@mswjs/socket.io-binding` (`src/mocks/realtime.ts`).
Nenhum setter ou callback atualiza o cache por fora: a interface só muda quando o evento chega
pelo socket.

**Limitações do ambiente de mocks** (documentadas por exigência do desafio):
- só **WebSocket** (`transports: ['websocket']`); o MSW intercepta o WebSocket, não o long-polling;
- o binding simula o handshake do Engine.IO; o mock envia os **pings** de keep-alive (sem eles o
  cliente cairia por "ping timeout" em ~30 s);
- sem namespaces, salas, broadcast nem acks: a assinatura de pedidos é um evento da aplicação
  (`orders.subscribe` com o token da sessão) e o "quarto" do usuário é uma lista mantida no mock;
- o MSW tira o prefixo `/socket.io/` da URL antes de comparar, então o handler usa `ws.link('*')` e
  só trata conexões do Engine.IO (parâmetro `EIO`); o resto (como o HMR do Vite) passa direto;
- o `socket.io-client` é carregado **sob demanda, depois de o mock ligar**: o Engine.IO guarda o
  `WebSocket` nativo ao ser importado, e importar antes impede a interceptação (isso também tira o
  cliente do pacote inicial). O `vite.config.ts` pré-declara a dependência para o Vite não
  reotimizar no meio da sessão;
- o servidor vive na página: recarregar derruba o servidor e os timers do mock (a retomada é
  feita pelo REST, que lê o mesmo estado).

**Eventos** (contrato em `src/types/realtime.ts`). Todos trazem `eventId` (identidade estável),
`resource` (tipo e id), `version` e `data` com o **estado completo** dos campos afetados (não um
diff), então aplicar duas vezes dá o mesmo resultado:
- `nft.updated` (público): preço, preço anterior, disponibilidade, estoque e máximo por pedido;
- `order.updated` (só para o dono do pedido): status, referência da transação e motivo da recusa.

**Regras do cliente** (`src/lib/realtime/apply-events.ts`): evento com `eventId` já visto é
ignorado (duplicata); evento com versão menor ou igual à já conhecida do recurso é ignorado
(antigo, fora de ordem, ou dado que o REST já trouxe mais novo, inclusive no carrinho). Só o que
passa por essas regras causa efeitos: patch do cache (catálogo, detalhe, destaque), releitura do
que a API calcula (listas, destaque, carrinho) e o aviso. Pedidos usam a mesma regra por versão.

**Fonte única de verdade.** `src/mocks/catalog-state.ts` guarda preço e estoque mutáveis (com
versão por NFT) e todo o REST (catálogo, detalhe, destaque, carrinho, pedidos) e os eventos leem
dali, então nunca divergem. Persiste em `localStorage['mock-nft-state']`.

**Interface.** Avisos em região `role="status"` onde fazem sentido (detalhe, carrinho,
pagamento, pedido; só o que chegou depois de a tela abrir). No pagamento, uma mudança de valores
durante a revisão mostra o aviso sozinha e exige "Aceitar novos valores" + novo aceite dos termos.
Sem conexão, aparece "Sem conexão em tempo real. Tentando reconectar…"; ao reconectar, o cliente
relê catálogo, carrinho e pedidos (os eventos perdidos não voltam). O polling do pedido só roda
como reserva enquanto o socket está fora.

**Sessão.** Ao entrar, o cliente assina os pedidos do usuário; ao sair ou trocar de conta, cancela
a assinatura anterior e assina a nova. O servidor só entrega `order.updated` ao dono.

**Painel de controle do mock** (`window.__mockControl`, só com mocks ligados; `src/mocks/control.ts`)
para cenários reproduzíveis: `updateNft(id, {priceEth, availableQuantity})` (muda o estado e emite),
`replay(evento)` (duplicata), `emit(evento)` (evento antigo/fora de ordem), `disconnect()`,
`setOffline(bool)`, `connections()` (quem assinou o quê) e `resetCatalog()`. Ele só comanda o
SERVIDOR simulado; quem atualiza a tela é o cliente real. O desfecho dos pedidos também sai pelo
socket (`order.updated`), ~1,2 s depois da criação.

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

## Mocks (MSW)

- Cenários por `localStorage['mock-scenario']`: `empty`, `session-expired`, `favorites-error`,
  `payment-declined`, `order-timeout` e os de rede abaixo. Os de rede valem para a API inteira
  (menos `/api/health`), aplicados por um handler único (`src/mocks/scenario-effects.ts`) que roda
  antes dos handlers de cada rota:
  - `slow`: toda resposta demora 1,2 s.
  - `variable-latency`: latência em ciclo fixo (900, 60, 500, 30 ms) por requisição, então uma
    resposta antiga chega depois de uma mais nova, sempre do mesmo jeito (`__mockControl.resetScenario()`
    reinicia o ciclo).
  - `request-timeout`: o servidor nunca responde; o Axios encerra no timeout (15 s; `VITE_API_TIMEOUT_MS`,
    3 s nos testes).
  - `network-error`: a conexão cai (erro de rede, sem resposta HTTP).
  - `forbidden`: carteiras, pedidos, perfil e favoritos respondem 403 a quem está logado
    (visitante continua recebendo 401; catálogo e carrinho seguem abertos).
  - `transient-failure`: a 1ª tentativa de cada requisição responde 503 e a repetição funciona.
  - `error`: tudo responde 500, inclusive carteiras, perfil e autenticação.
- Nova tentativa automática (`src/lib/query-retry.ts`, padrão do `QueryClient`): só para consultas
  e só em falha transitória (sem resposta: 1 tentativa; 502/503/504: até 2), com espera de 300 ms
  que dobra. 401, 403, 404, 409, 422 e 500 não são repetidos. Ações do usuário (login, salvar,
  pagar) nunca são repetidas sozinhas: quem repete é o usuário (o pagamento usa a chave de
  idempotência). Falha ao verificar a sessão mostra "Não foi possível verificar sua sessão" com
  botão de tentar de novo, em vez de mandar para o login.
- Os mocks sobem em paralelo à primeira renderização: a tela mostra os esqueletos e o Axios e o
  Socket.IO esperam o MSW ficar pronto (`src/lib/mocks-ready.ts`).
- Usuários de demonstração: `ana@kurio.test` / `kurio123` e `bruno@kurio.test` / `kurio456`.
  Contas criadas no cadastro ficam em `localStorage['mock-users']` (sobrevivem ao refresh;
  `resetRegisteredUsers()` volta ao cenário conhecido). Carrinhos ficam em
  `localStorage['mock-cart:<dono>']` (`clearMockCarts()` volta ao cenário conhecido).
- Sessão: token sem estado (`kurio.<usuário>.<expira>`) em `localStorage['kurio.session']`.
- Respostas de erro: 401 `invalid_credentials` / `session_expired` / `unauthenticated`,
  403 `forbidden`, 409 `email_taken`, 422 `validation_error`, 503 `service_unavailable` (falha
  transitória), 500 `internal_error` (cenário `error`).

## Promoções e Diário da Cunhagem (Início)

- Conteúdo editorial vindo do MSW (`GET /api/promotions`, `GET /api/blog/posts`; fixtures em
  `src/mocks/fixtures/editorial.ts`), depois do catálogo. Nada de dado fixo nos componentes.
- Os cards **não são links**. Nas promoções o cupom aparece como texto e é um cupom real: as
  fixtures leem os mesmos cupons do carrinho (`KURIO10`, `GENESIS15`), então o desconto prometido
  é o aplicado. Nos artigos, "Ler artigo (em breve)" segue o padrão inerte do cabeçalho e do
  rodapé (`aria-disabled`, `title="Em breve"`, cursor bloqueado).
- Lista vazia (cenário `empty`) esconde a seção; erro mostra aviso com "Tentar novamente" só na
  seção, sem afetar o catálogo. Datas em UTC (`formatDate`), imagens decorativas (`alt=""`).

## Menu lateral "Meu perfil" (Perfil e Carteiras)

- Conferido contra os prints do Figma (sem o MCP): as duas telas têm um menu lateral fixo, que
  não existia. Componente `AccountSidebar` (`src/components/profile/account-sidebar.tsx`), usado em
  `/perfil` e `/carteiras`.
- Itens: **Dados do perfil** e **Carteiras** (links, com `aria-current="page"` no ativo) e **Sair**
  (botão, mesma ação do menu da conta). **Atividade, Lista de interesse, Ofertas, Arquivos baixados
  e Suporte** estão fora do escopo do desafio: `aria-disabled`, `title="Em breve"` e cursor
  bloqueado, como no cabeçalho e no rodapé (não são links).
- Desktop (≥ 1024 px): coluna de 240 px à esquerda; Perfil fica em três colunas (menu, foto,
  formulários). Abaixo disso o menu vira um bloco no topo da página. O Figma não tem frame mobile
  dessas telas, então essa adaptação é nossa.
- Hero da Início e Pagamento mobile foram conferidos com prints e batem com o Figma (sem mudanças).

## Pagamento desktop: perfil do colecionador (conferido com prints)

A descrição do Figma (sem o MCP) lista um formulário extenso "Perfil do colecionador" ao lado do
resumo. Como cada campo foi tratado:

- **Já existiam**: nome (o "nome de exibição"/"nome do perfil" do Figma é o mesmo dado; o rótulo
  continua "Nome completo"), e-mail, telefone, carteira, rede e o resumo (itens, subtotal, cupom,
  desconto, taxa e total).
- **Novos, opcionais** (vazio = não informado; só entram no pedido quando preenchidos):
  **Nome de usuário** (3–30: letras, números, `.` ou `_`), **Nome ENS** (`nome.eth`),
  **Código de indicação** (4–12 letras ou números) e **Observação** (até 280 caracteres). O Figma
  repete "ENS" e "nome ENS"; ficou um campo só. A validação é a mesma no formulário e na API
  simulada (`src/lib/validation.ts`), os valores vão no retrato do pedido e aparecem no recibo.
  O código de indicação é só registrado: não altera valores (não há regra de negócio para ele).
- **Derivados da carteira** (somente leitura, não são campos): "Tipo de carteira" (Principal ou
  Secundária) e "Endereço da carteira" completo. Não existe campo para digitar um endereço avulso:
  o desafio manda pagar com as carteiras cadastradas.
- **"Usar outra carteira?"**: só aparece com mais de uma carteira. Desmarcado, mostra só a
  principal; marcado, lista as demais para escolher. Desmarcar volta para a principal.
- **Botão** "Confirmar pagamento" passou a "Confirmar compra" (texto do Figma). O fluxo continua em
  duas etapas (dados, depois revisão com aceite dos termos): a revisão antes do envio é exigida
  pelo desafio, e o Figma descreve só a tela de dados.
- **Só a partir de 768 px**: o frame mobile (414 px) do Figma não tem nada disto. Abaixo de 768 px
  (`useMediaQuery`, ponto em que o app já troca de layout) os quatro campos opcionais, o
  "Usar outra carteira?" e o bloco Tipo/Endereço não aparecem, e todas as carteiras ficam listadas
  como antes. Escondido não vale: os campos não são validados nem enviados (o valor digitado fica
  guardado e volta se a tela for alargada), então um valor inválido nunca trava o envio de forma
  invisível.
- **Regressão visual**: a baseline mobile do Pagamento é a original (a que já tinha sido conferida
  com o Figma) e continua batendo; o layout mobile ficou idêntico ao de antes dos campos novos. A
  baseline desktop foi regenerada (a tela mudou de propósito), então só vale como regressão.
- **Pendente de conferir**: a descrição do Figma desktop é em texto; espaçamentos e ordem exata
  dos campos não foram comparados com o frame.

## Fora do escopo (inertes e sinalizados com "Em breve")

Páginas editoriais, suporte e atividade, "Esqueceu a senha?", login social, itens do menu
(Criadores, Aprenda), links do footer e newsletter (mostra "indisponível nesta demonstração").

## Pendências conhecidas

- Promoções e "Diário da Cunhagem" da Início montados sem ler o frame do Figma (limite do MCP):
  estrutura (3 cards em linha, depois do catálogo) e textos inferidos.
- Carrinho, Detalhe do NFT, Pagamento e Pedido montados sem ler os frames do Figma (limite do
  MCP): estrutura, campos e medidas inferidos.
- Tela Carteiras montada sem ler o frame do Figma (limite do MCP): estrutura inferida.
- Tela de Perfil montada sem ler o frame do Figma (limite do MCP): estrutura inferida.
- Recibo/confirmação montados sem ler o frame do Figma (limite do MCP): estrutura inferida.
- Login (mobile) e Cadastro foram montados sem ler os frames do Figma (limite do MCP):
  estrutura e campos do Cadastro são inferidos a partir do Login.
