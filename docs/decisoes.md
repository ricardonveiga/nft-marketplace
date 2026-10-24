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
- **Card "NFT em destaque"**: como no Figma, só o título, o rótulo "Oferta limitada" e a foto, sem
  texto sobre a imagem (o overlay de nome e preço foi removido, como no hero). Nome e preço seguem
  no link, só para leitores de tela (`sr-only`), para o link ter nome acessível.
- **Contagens dos filtros** vêm da API e refletem os 27 NFTs reais do mock. Cada contagem
  ignora o próprio filtro (mostra quanto a opção adicionaria). As contagens do Figma
  (33, 12, 65…) eram placeholder e não foram usadas.
  **Desvio intencional**: só o número muda em relação ao Figma. O estilo é o mesmo (formato
  `(N)`, à direita da linha, mesma fonte, tamanho e cor do rótulo, negrito só nas contagens de
  Coleções), e um teste confere isso (`e2e/filters.spec.ts`). Usar os números fixos do Figma
  mostraria contagens erradas ao usuário. Estilo conferido pelo código e pelo teste, com base na
  implementação feita quando o Figma ainda era legível; não houve nova comparação visual.
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
- **Nome e preço do NFT**: no Figma a arte do hero é só a imagem, sem texto sobreposto (conferido
  por print). Por isso o overlay visível foi removido, nos dois tamanhos. Nome e preço continuam no
  DOM, só para leitores de tela (`sr-only`), para o link do destaque ter nome acessível e o valor
  atualizado por `nft.updated` seguir verificável. A miniatura de 58 px sobreposta (mobile) é o
  próximo destaque, decorativa.
- **Moldura da arte** (conferida com o frame Desktop/Início): sem fundo próprio; a arte ocupa a
  moldura inteira (450 × 450 no desktop, raio 24; 138 × 138 no mobile, raio 20). O creme fixo que
  existiu antes (`hero-art`) foi removido: o frame mostra só a foto, com o fundo embutido na arte.
- **EXPLORAR** rola até o catálogo e leva o foco para a seção (sem mexer na URL nem nos filtros).
- **Dimensões**: 1200 × 450 no desktop e 366 × 190 no mobile (medidas do Figma). **Desktop: fundo
  liso, sem círculos e sem card.** **Mobile:** card de raio 32 sobre base `#1b110a` com dois círculos
  de 248 px (Ellipse 49/50), cada um com gradiente vertical e opacidade (0,63 e 0,384); os valores
  foram **ajustados por mínimos quadrados sobre o frame** (erro médio ≈ 4/255), pois o arquivo não
  estava legível. Os pontos do carrossel são três círculos da mesma cor (o frame não distingue o
  ativo; a posição fica em `aria-current` e no rótulo "N de 3").
- Sem destaques (catálogo vazio ou erro) o hero mantém texto e botão, sem arte.

## Cadastro (modal): conferência com o frame Desktop (print do usuário)

Mesma casca do Login (Início atrás, `inert`), conferida no pixel contra o frame:

- **Medidas**: modal de 500 × 656 a 158 px do topo, com cantos de 10 px (no frame do Login os cantos são
  retos e o modal fica a 160 px; as duas diferenças são do próprio Figma e foram mantidas).
- **Conteúdo**: abas com "Entrar" em branco e "Criar conta" em laranja; texto "Crie seu perfil de
  colecionador e conecte uma carteira quando quiser."; campos **Nome de usuário**, **Digite seu e-mail**,
  **Senha** (com o olho) e **Confirmar senha** (sem o olho, como no frame); botão "Criar conta";
  "Ou continue com" e os botões Google/Facebook (inertes, ver Login), 4 px mais abaixo e com 16 px entre eles.
- **Mudanças de comportamento**: o campo de nome passou a se chamar "Nome de usuário" (continua sendo o
  nome da conta, o mesmo `name` da API); a dica "Mínimo de 8 caracteres..." saiu (a regra aparece na
  mensagem de erro); a confirmação de senha deixou de ter o botão de mostrar/ocultar.

## Login (modal): conferência com o frame Desktop (print do usuário)

Conferido no pixel contra o frame (modal de 500 × 600, a 160 px do topo):

- **Estrutura**: o modal fica sobre a Início (que aparece atrás, sem escurecer, `inert` e escondida de
  leitores de tela; `src/components/auth/auth-layout.tsx`). Vale também para o cadastro. No mobile o
  modal sobe para cima do cabeçalho fixo.
- **Casca** (`auth-card.tsx`): cantos retos, faixa de 10 px na base, abas de 20 px (Entrar em laranja,
  Criar conta em branco, divisor `#8a4b38` de 1 px), texto de apoio de 13 px, X laranja de 12 px.
- **Campos**: vazados, 40 px, borda de 1 px que fica laranja no foco, raio 2; o olho da senha mostra o
  estado atual (senha oculta = olho riscado). O botão "Entrar" tem 45 px e raio 7.
- **Elementos que faltavam**: separador "Ou continue com" e os botões "Continuar com Google" e
  "Continuar com Facebook". **Login social está fora do escopo**: os botões existem como no Figma, mas
  são inertes (`aria-disabled`, `title="Em breve"`, nenhuma ação), sem aparentar sucesso.
- **Não replicado**: os três ícones de ação (carrinho, coração, lupa) que aparecem no hover de um card
  do fundo do frame, e o estado "senha preenchida" do print (é um estado de foco, não uma regra).
- **Pendente de conferir**: os frames mobile do Login e do Cadastro.

## Início: conferência com os frames do Figma (prints do usuário)

Desktop (1440) e mobile (414 × 896) conferidos **no pixel** contra os prints (medindo caixas de
texto, bordas e cores). O que mudou em relação ao que existia:

- **Cores**: fundo da página `#040202` (era `#140d0a`); texto dos botões laranja `#040202`; fundo do
  card "NFT em destaque" `#180f09`; linha do cabeçalho `#372414` só nos 1200 px do conteúdo.
- **Cabeçalho desktop**: 69 px (itens a partir de y = 24), menu ativo com sublinhado de 3 px sobre a
  linha, busca só com o ícone (clique abre o campo; `Esc` fecha se vazio), carrinho de 31 px com o
  contador e botão "Entrar" de 100 × 35 (o componente `Button` perdia 2 px por causa de uma borda
  transparente com `bg-clip-padding`; o padrão agora é borda da própria cor).
- **Catálogo**: barra lateral idêntica (slider com polegar de 21 px e trilha de 4 px, lista de Rede
  sem recuo à direita), abas regulares com sublinhado, "Ordenar por" sem folga antes da seta, linhas
  de cards a 71 px e preço fixado na base do card (a linha com preço antigo fica 6 px mais alta).
- **Card em destaque**: título em caixa alta, "OFERTA LIMITADA" em 22 px, cantos retos, imagem de
  310 × 366.
- **Promoções**: dois cards de 586 × 250 (arte de 287 px, texto à direita, botão "Explorar" que leva
  ao catálogo); o cupom que existia nos cards saiu, porque o Figma não o mostra (o cupom segue
  valendo no carrinho). A descrição do segundo card é cortada em três linhas, como no Figma.
- **Diário da Cunhagem**: quatro artigos de 268 px (data, "Leitura de N min", título, resumo e
  "Ler mais", inerte como "Em breve"). Os textos vêm do frame.
- **Rodapé**: faixa de 250 px com colunas de 296/266/266/372 px e divisores de 1 px; barra de contato
  de 88 px; sem cantos arredondados.
- **Mobile**: cabeçalho com 40 px de respiro no topo (o frame tem a área do aparelho; foi mantida
  para a posição bater), busca com ícone fino e texto em peso 600, botão de filtros em degradê
  escuro → claro com ícone de dois controles, abas de 14 px e barra inferior com os ícones 5 px
  mais altos e o coração na cor cheia.

**Não replicado de propósito** (ruído do arquivo, não regra de interface): posição da arte dentro de
cada card (varia de 20 a 31 px entre cards do mesmo frame; mantivemos a arte centralizada), a
terceira linha sem nome/preço do desktop, o coração só no primeiro card do mobile, os ícones de ação
(carrinho, coração e lupa) que aparecem no hover de um card do frame de Login (ainda não
implementados), os 4 números de página e as contagens dos filtros (dados do Figma; o mock tem 27
NFTs, 3 páginas), e a arte do hero (o Figma usa o Emerald Ape; aqui vale o critério do mais caro).

## Carrinho (`/carrinho`): conferido com o frame `Carrinho de NFTs.png`

- **Layout** (medido no pixel, 1440): tabela de 782 px (NFTs, Preço, Edições, Total e a lixeira, com
  linhas de 70 px e vão de 12) ao lado do "Resumo da carteira" de 332 px (vão de 86), breadcrumb
  "Início / Mercado / Carrinho" e, abaixo, "Colecionadores também viram".
- **Resumo**: código promocional com "Aplicar" colado ao campo, Subtotal, "Desconto do lançamento"
  (sempre visível: `(-) 00.00` sem cupom), Taxa de rede, "Taxa estimada" e Total, calculados pela API.
  O botão passou a "Conectar e finalizar" (texto do Figma) e leva ao pagamento; visitante passa pelo
  login e volta. "Continuar explorando" volta ao catálogo.
- **"Colecionadores também viram"**: 15 sugestões da API simulada (`GET /api/nfts/recommended`, lista
  fixa de NFTs disponíveis; a primeira página repete a do frame), 5 cards por página no desktop e
  pontos para trocar de página. Abaixo de 1024 px vira uma faixa rolável.
- **Quantidade**: botões redondos laranja de 19 × 24 px, limite por pedido de 5 (o frame mostra 6 e 9,
  que a regra do desafio não permite; o aviso "Máximo de 5 unidades por pedido." aparece sob o item).
- **ID do token**: derivado do número do nome do NFT (o frame mostra valores que não casam com os nomes).
- **Não replicado**: as imagens dos cards de sugestão variam de tamanho no frame; aqui todas usam o
  mesmo card do catálogo. O "12 itens" e o título "Carrinho de NFTs" visível saíram (o título ficou só
  para leitores de tela); o contador continua no ícone do carrinho.
- **Mobile**: ainda não há frame; abaixo de 1024 px a tabela vira cartões empilhados.

## Detalhe do NFT (`/nft/:id`): conferido com o frame `Detalhes do NFT.png`

- **Layout** (medido no pixel, 1440): breadcrumb "Início / Mercado", miniaturas de 100 px em coluna,
  imagem de 444 px com a arte de 402 px dentro do cartão, e a coluna de informações a 725 px.
- **Informações**: nome, preço, estrelas e "N avaliações de colecionadores", "Sobre este NFT:",
  "Edição:" (opções `1/1`, `1/10`, a do NFT selecionada e `ABERTA`), quantidade, **COMPRAR** e
  **Favoritar**, ID do token, coleção, atributos e "Compartilhar este NFT:" (ícones inertes, "Em breve").
  Os dados novos (resumo, nota e avaliações, atributos, textos da aba e edições) vêm da API simulada.
- **COMPRAR** põe o NFT no carrinho (respeitando estoque e limite por pedido) e mostra
  "Adicionado ao carrinho. Ver carrinho"; saiu o "Comprar agora" (o frame só tem um botão de compra).
- **Abas**: "Detalhes do NFT" (parágrafos + Rede, Contrato e Direitos autorais, com os mesmos rótulos
  do frame) e "Avaliações de colecionadores (N)" com a lista de avaliações.
- **Mais desta coleção**: reaproveita as sugestões do carrinho (`GET /api/nfts/recommended`, sem o
  próprio NFT), 5 por página, com pontos; o nome e o preço dos cards ficam mais juntos que no carrinho.
- **Mantido além do frame**: "Edição esgotada" (sem compra), aviso de limite por pedido (visível só ao
  atingir o limite, antes é só para leitores de tela), disponibilidade para leitores de tela.
- **Não replicado**: as miniaturas do frame repetem a mesma imagem; aqui são as artes do catálogo. O zoom
  da imagem é só o ícone (inerte). O nome da coleção vem do dado ("Emerald Apes", não "Kurio Apes").

## Perfil do colecionador (`/perfil`): conferido com o frame `Perfil do Colecionador.png`

- **Layout** (medido no pixel, 1440): menu lateral de 310 px (y101–508) e formulário em 2 colunas de
  417 px com vão de 28; campos de 40 px; rótulo 17 px acima do campo; "Salvar" 131 × 40.
- **Campos** (todos com asterisco são obrigatórios): nome de exibição, nome de usuário, e-mail,
  nome ENS (".eth" + nome), apelido da carteira. O **telefone saiu** (não existe no frame) e a coluna
  de foto/identificação à parte também; o avatar é o bloco "Avatar" com "Alterar" e "Remover".
- **Um só "Salvar"**: grava os dados se mudaram e troca a senha se algum campo de senha foi
  preenchido (aí os três são exigidos, a senha atual é conferida no servidor). Sem mudança, avisa
  "Nenhuma alteração para salvar." O botão não fica desabilitado como antes: o Figma o mostra sempre ativo.
- **Dados novos na conta** (`User`): `username`, `ensName`, `walletNickname`. Ana e Bruno têm valores
  nas fixtures; contas novas recebem padrões derivados do e-mail (só na camada de mocks) e podem trocar.
- **Avatar**: sem foto aparece o círculo com o ícone de imagem (as iniciais ficam no `title`);
  "Remover" fica inerte enquanto não há foto. A foto continua sendo salva na hora, ao escolher o arquivo.
- **Menu lateral** (também usado em Carteiras): ícones, barra laranja de 6 px no item ativo, divisor
  antes de "Sair". Itens fora do escopo seguem inertes ("Em breve").
- **Não replicado**: o cabeçalho do frame mostra o botão "Entrar" mesmo com a pessoa logada; o app
  mantém o menu da conta. Os ícones de "Ofertas" e "Arquivos baixados" são os mais próximos da
  biblioteca Lucide, não o desenho exato do frame.

## Carteiras (`/carteiras`): conferido com o frame `Carteiras.png`

- **Layout** (medido no pixel, 1440): mesmo menu lateral do Perfil; formulário em 2 colunas de 417 px
  (vão de 28), rótulo a 3 px do campo, "Salvar carteira" 131 × 40, depois a seção "Carteira secundária".
- **Um formulário só, para as duas carteiras**: nome de exibição, apelido, rede, nome do perfil,
  endereço, ENS/carteira secundária (opcional), tipo de carteira, código de indicação, e-mail e nome ENS.
  O diálogo e os cartões antigos saíram. Os dados novos ficam na carteira (`Wallet`); o apelido continua
  sendo o `label` usado no pagamento.
- **Rede**: o campo é uma rede só (a primeira de `networks`); as outras que a carteira já aceitava são
  preservadas ao salvar, para não reduzir as opções do pagamento.
- **"Adicionar"**: na principal (só aparece enquanto ela não existe) leva o foco ao formulário; na
  secundária mostra o formulário de cadastro, com "Cancelar". Sem principal, fica desabilitado: a
  primeira carteira sempre vira a principal. O limite de duas carteiras e a recusa de endereço
  duplicado continuam na API simulada.
- **"Igual à carteira principal"**: preferência só da tela (não persiste): dispensa a secundária e
  desabilita "Adicionar". O Figma não detalha o efeito; nada no pagamento depende dela.
- **Além do frame (necessário ao desafio)**: com a carteira cadastrada aparecem, ao lado de "Salvar
  carteira", o estado "Conectada/Desconectada" e as ações "Definir como principal" e "Remover" (com
  confirmação). O frame mostra só o estado vazio.
- **Não replicado**: o cabeçalho do frame mostra "Entrar" mesmo logado (o app mantém o menu da conta).

## Pagamento e pedido

- **Página única** (Figma): "Perfil do colecionador" à esquerda e "Seus NFTs" à direita. O resumo
  é a revisão; "Confirmar compra" valida e envia, sem etapa extra nem termos (o frame não tem).
  `/pagamento` exige login: o visitante vai ao login e volta ao pagamento.
- **Dados do colecionador** (campos do Figma, obrigatórios com asterisco): nome de exibição,
  nome de usuário, rede, nome do perfil, endereço da carteira, tipo de carteira, código de
  indicação, e-mail e nome ENS (+ ".eth"); opcionais: ENS/carteira secundária e observação. Vêm
  preenchidos com o que a conta já sabe. **Telefone saiu** (não existe no frame).
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
- **Revalidação**: o envio leva a cotação vista (`version` + total). Se o total mudou (valores,
  cupom, taxa) a tela avisa sozinha, desabilita o botão e exige "Aceitar novos valores"; a API
  também responde 409 `quote_changed`. Só o total conta como mudança visível: a versão do
  carrinho pode mudar (união do carrinho de visitante) sem alterar nada que a pessoa viu. Itens indisponíveis, carteira
  desconectada e carrinho vazio também têm tratamento próprio.
- **Estados do pedido**: `pending` → `confirmed` | `declined`. O "processador" simulado decide
  ~1,2 s depois da criação; a página do pedido relê a cada segundo enquanto pendente (hoje por
  polling de reserva; o desfecho chega por `order.updated`, ver "Tempo real"). Confirmado esvazia o
  carrinho; recusado mantém carrinho e rascunho.
- **Pedido = retrato (snapshot)** dos itens, valores, carteira e dados do colecionador; mudanças
  no catálogo não o alteram. Pedidos são privados: outro usuário recebe "não encontrado".
- **Pedido confirmado = modal do Figma** (`/pedido/:id`, 578 px, medido no pixel contra
  `Confirmação de Pedido.png`): "Seus NFTs agora estão na sua carteira", faixa com ID da transação
  (curto, `0xA91F…E82C`), data (UTC, "29 Jul, 2026"), total e tipo de carteira, "Detalhes da transação"
  (itens com `ID do token`, `(x N)` e subtotal), taxa de rede, total, texto da rede e **Ver no Etherscan**
  (abre o explorador simulado do próprio app). Fechar (X ou Esc) leva ao início. O recibo completo
  (número do pedido, datas, carteira, rede e dados do colecionador) continua no modal, mas só para
  leitores de tela e testes: o frame mostra apenas o resumo. **Saíram**: "Imprimir recibo" e
  "Continuar comprando" (não estão no frame); copiar a referência deixou de ter botão visível.
  Pendente e recusado seguem como páginas (o frame cobre só o confirmado).
- **Referência e explorador (simulados)**: o hash tem 64 caracteres hexadecimais, é derivado do
  número do pedido e pode ser copiado. O link "Ver no explorador (simulado)" abre uma página do
  próprio app (`/explorador/:hash`, pública, como um explorador real) que mostra rede, status, bloco,
  data, origem (a carteira), destino (um contrato do marketplace fictício), valor e taxa. Ela não
  expõe nada do colecionador nem o número do pedido. Nenhuma rede real é consultada e a página
  avisa isso.
- **Recusado**: mostra o motivo, os itens do retrato e "Tentar novamente"; não tem referência de
  transação nem botão de imprimir. Pendente: aviso de processamento e os mesmos blocos.
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
- **Reset único**: `__mockControl.resetAll()` (`src/mocks/reset.ts`) apaga tudo o que o servidor
  simulado guarda (todas as chaves `mock-*`: catálogo, cenário, usuários, carrinhos, favoritos, perfis,
  carteiras, conexão, pedidos, idempotência e sequência), a sessão e o carrinho do visitante,
  zera os contadores dos cenários e recarrega a página. Resets parciais continuam existindo.
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
- Senhas: nunca em claro no armazenamento; só hash SHA-256 (`passwordHash`). Ver "Política de sessão"
  em `ARCHITECTURE.md`.
- Rota inexistente: página "Página não encontrada" dentro do layout (`notFoundComponent`).
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

## Pagamento (desktop): conferido com o frame `Pagamento.png`

Medido no pixel contra o frame (1440): colunas de 764 e 405 px, campos de 370 × 40 (vão de 24),
botão 405 × 45, linhas de item de 70 px, rótulos de 15 px com asterisco laranja.

- **Validação**: nome, nome de usuário (3–30), nome do perfil, e-mail, tipo de carteira, código de
  indicação (4–12 letras/números, ex.: `KURIO10`) e nome ENS são obrigatórios, como o asterisco do
  Figma indica; o mesmo código valida o formulário e a API simulada (`src/lib/validation.ts`).
  O código de indicação é só registrado: não altera valores.
- **"Usar outra carteira?"**: torna o endereço editável (com validação de 0x + 40 hex); desmarcar volta
  ao endereço da carteira escolhida.
- **Carteira e rede**: o frame mostra MetaMask/Coinbase; aqui as opções são as carteiras
  cadastradas da conta (a conexão simulada continua por "Conectar"/"Desconectar" na linha escolhida).
  **Não replicado**: a pílula "carteiras compatíveis" (METAMASK · WALLETCONNECT · COINBASE) como
  opção de rádio; ela aparece só no rodapé.
- **ID do token** (`#0042`): derivado do número do nome do NFT, já que o desafio não traz esse dado.
- **Menu**: "Mercado" fica ativo em carrinho, pagamento, detalhe e pedido; "Início" nas demais.
- **Mobile**: a coluna única segue o mesmo formulário (sem os cortes antigos abaixo de 768 px).
  O frame mobile ainda não foi recebido; a baseline mobile é só de regressão.

## Flakes conhecidos sob carga

A suíte completa leva de 6 a 11 minutos e, com a máquina carregada, um teste isolado às vezes
passa a falhar na rodada inteira sem que o código tenha mudado. Casos vistos e como foram tratados:

- `filters.spec.ts` "filtros se combinam": lia a contagem de cards logo depois de a URL mudar,
  antes de a lista nova chegar (o catálogo mantém a página anterior de propósito). **Corrigido**
  com `expect.poll`; passa 12 vezes seguidas.
- `passwords.spec.ts` "trocar a senha no perfil": navegava para `/perfil` antes de o login
  terminar. **Corrigido** esperando o menu da conta aparecer.
- `wallets.spec.ts` "conta nova cadastra a carteira pelo pagamento e conclui a compra" (desktop):
  falhou uma vez em uma rodada completa e passa em 8 de 8 execuções isoladas. Sem causa óbvia no
  teste (não há espera fixa curta); é cadeia longa (cadastro, carteira, pagamento e recibo) sujeita
  a atraso sob carga. **Não corrigido; documentado.** Ao ver essa falha numa rodada completa,
  rode o teste isolado antes de investigar o código.
- `scenarios.spec.ts` "autenticação: login e cadastro mostram a falha e ficam na tela" (desktop,
  cenário `error`): falhou uma vez na suíte completa de um clone limpo (a página de login não
  mostrou o campo de e-mail em 30 s) e passa em 16 de 16 execuções isoladas. **Não corrigido;
  documentado.** Mesma orientação: rode isolado antes de investigar o código.
- `checkout.spec.ts` "o pedido de um usuário não aparece para outro": já falhou sob carga em
  outra época; nas 3 rodadas completas seguidas de 2026-10-23 passou todas as vezes.

## Fora do escopo (inertes e sinalizados com "Em breve")

Páginas editoriais, suporte e atividade, "Esqueceu a senha?", login social (os botões aparecem, inertes), itens do menu
(Criadores, Aprenda), links do footer e newsletter (mostra "indisponível nesta demonstração").

## Pendências conhecidas

Lista atual (a visão completa, com as limitações do ambiente, está em
[`ARCHITECTURE.md`](../ARCHITECTURE.md#limitações-e-pendências)). O MCP do Figma segue sem cota;
a conferência vem de prints enviados pelo usuário.

- **Conferido com prints e ajustado:** hero da Início (desktop e mobile), card "NFT em destaque",
  Pagamento mobile e o menu lateral "Meu perfil" (Perfil e Carteiras).
- **Pagamento desktop:** campos vindos de uma descrição em texto. Ordem, espaçamento vertical,
  agrupamento e alinhamento com o resumo ainda **não foram comparados**; aguardam o print do frame.
- **Em aberto:** cor da moldura da arte do hero (hoje creme fixo `#fcf2da`, medido em print).
- **Sem conferir com o frame (estrutura inferida):** Promoções e Diário da Cunhagem, Carrinho,
  Detalhe do NFT, Recibo/confirmação, Login mobile, Cadastro, e as telas Carteiras e Perfil além
  do menu lateral.
- **Fora do Figma:** Performance mobile do Lighthouse abaixo da meta (ver `ARCHITECTURE.md`).

## Mobile (frames de 414 × 896)

Mesma lógica do desktop; só o que o frame mobile mostra diferente.

- **Cadastro e Login (mobile)**: viram tela cheia (sem o modal, sem a Início atrás, sem abas nem X):
  "KURIO", título ("Criar perfil de colecionador" / "Entrar"), campos de 50 px com cantos de 12 px,
  botão de 60 px ("Criar perfil" no mobile, "Criar conta" no desktop), "Ou continue com", botões
  sociais inertes e o link de baixo ("Já tem uma conta? Entre" / "Novo na Kurio? Crie uma conta").
  Medido no pixel contra os frames. O frame do cadastro centraliza o placeholder do primeiro campo;
  não replicado (o texto digitado também ficaria centralizado, um defeito de uso).
