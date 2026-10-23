# Kurio — Marketplace de NFTs

Marketplace de NFTs em React + TypeScript (desafio frontend). Descoberta (catálogo, busca, filtros),
compra (carrinho, pagamento, recibo) e conta do colecionador (login, cadastro, perfil, carteiras),
em desktop e mobile. Não há backend: APIs, autenticação, carteiras, pagamentos e eventos em tempo
real são **simulados na camada de rede com MSW**.

- **Aplicação publicada:** https://nft-marketplace-beta-black.vercel.app
- **Repositório:** https://github.com/ricardonveiga/nft-marketplace
- **Arquitetura, contratos, sessão e cache:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- **Decisões por tela e desvios do Figma:** [`docs/decisoes.md`](./docs/decisoes.md)
- **Auditoria Lighthouse:** [`docs/lighthouse.md`](./docs/lighthouse.md) e `reports/lighthouse/`

## Stack

React, TypeScript, TanStack Router, TanStack Query, Axios, Socket.IO (`socket.io-client`),
Tailwind CSS, shadcn/ui (Radix), MSW (+ `@mswjs/socket.io-binding`), Playwright e Lighthouse.
Build com Vite.

## Setup

Requisitos: Node.js 20 ou superior (desenvolvido e testado com Node 24) e npm.

```bash
git clone https://github.com/ricardonveiga/nft-marketplace.git
cd nft-marketplace
npm ci
npm run dev        # http://localhost:5173, com os mocks ligados
```

Os testes E2E usam o Chromium do Playwright. Na primeira vez: `npx playwright install chromium`.

## Variáveis de ambiente

| Variável | Padrão | Para quê |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` (já no `.env`, versionado) | Liga o MSW (REST e Socket.IO simulados). Fica ligado também no build publicado, como o desafio pede. Sem ele não há API para responder. |
| `VITE_API_TIMEOUT_MS` | `15000` | Tempo limite das requisições do Axios. Os testes usam 3000 para o cenário de timeout não custar 15 s. |

Só para a auditoria (`npm run audit:lighthouse`): `LH_RUNS` (medições por página, padrão 3),
`LH_OUT` (pasta de saída) e `LH_PROFILE` (`mobile` ou `desktop`). Experimentos locais; a auditoria
oficial usa os padrões.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Desenvolvimento com mocks (porta 5173) |
| `npm run build` | Gera as rotas, confere os tipos e faz o build de produção em `dist/` |
| `npm run preview` | Serve o build de `dist/` localmente |
| `npm run typecheck` | Geração de rotas + `tsc -b` |
| `npm run lint` | `oxlint` |
| `npm run test:e2e` | Testes Playwright (desktop 1440 e mobile 390, Chromium). Sobe o próprio servidor na porta 5199 |
| `npm run test:visual` | Só a regressão visual (Início, detalhe, carrinho e pagamento) |
| `npm run test:visual:update` | Regenera as baselines visuais (depois de mudança visual intencional) |
| `npm run audit:lighthouse` | Build, preview e 3 medições por página e perfil; escreve em `reports/lighthouse/` |

Relatório HTML dos testes: `npx playwright show-report`. Em caso de falha, o Playwright guarda o
trace (`trace: retain-on-failure`) em `test-results/`; abra com `npx playwright show-trace <trace.zip>`.

## Credenciais fictícias

| Usuário | E-mail | Senha |
| --- | --- | --- |
| Ana | `ana@kurio.test` | `kurio123` (2 carteiras) |
| Bruno | `bruno@kurio.test` | `kurio456` (1 carteira) |

Também é possível criar uma conta em `/cadastro` (fica em `localStorage['mock-users']`). Cupons do
carrinho: `KURIO10` (10%), `GENESIS15` (15%) e `EXPIRADO20` (expirado, para ver o erro).
A carteira "Carteira secundária" da Ana sempre recusa a conexão, para exercitar a recusa.

## Cenários do mock: selecionar e resetar

Os cenários ficam em `localStorage['mock-scenario']`. No console do navegador:

```js
localStorage.setItem('mock-scenario', 'slow')   // escolhe o cenário
location.reload()                               // o cenário vale a partir daí
localStorage.removeItem('mock-scenario')        // volta ao padrão (sucesso)
```

| Cenário | Efeito |
| --- | --- |
| *(nenhum)* | Sucesso, catálogo com os 27 NFTs |
| `empty` | Catálogo e listas vazias |
| `slow` | Toda resposta demora 1,2 s (skeletons) |
| `variable-latency` | Latência em ciclo fixo (900, 60, 500, 30 ms): respostas chegam fora de ordem |
| `request-timeout` | O servidor nunca responde; o Axios encerra no timeout |
| `network-error` | A conexão cai (erro de rede, sem resposta HTTP) |
| `transient-failure` | A 1ª tentativa de cada requisição dá 503; a repetição funciona |
| `forbidden` | Carteiras, pedidos, perfil e favoritos respondem 403 a quem está logado |
| `error` | Tudo responde 500 |
| `session-expired` | A sessão expira: 401 `session_expired`, volta ao login e retoma depois |
| `favorites-error` | A mutação de favoritos falha (rollback da atualização otimista) |
| `payment-declined` | O próximo pagamento é recusado |
| `order-timeout` | O pedido é criado, mas a resposta não chega (uma vez); reenviar recupera o mesmo pedido |

**Reset.** Para voltar a um estado conhecido, limpe os dados do site (`localStorage.clear(); sessionStorage.clear()`
no console e recarregue): zera sessão, contas criadas, carrinhos, favoritos, perfis, carteiras,
pedidos, estoque/preço do catálogo, cenário e o rascunho do pagamento. Para só reiniciar os contadores dos cenários (a
sequência de latência e as falhas transitórias já usadas) use `__mockControl.resetScenario()`;
para voltar o catálogo às fixtures, `__mockControl.resetCatalog()`.

## Reproduzir os fluxos de falha

Cada passo é o que os testes automatizados fazem (`e2e/`).

- **Sessão expirada:** entre como Ana, coloque `session-expired` no cenário e navegue ou abra o
  pagamento. Você vai ao login com um aviso; ao entrar volta à página em que estava.
- **Pagamento recusado:** `payment-declined`, adicione um NFT, vá a `/pagamento`, conecte a carteira,
  revise e confirme. O pedido fica "recusado", o carrinho e os dados continuam, e há "Tentar novamente".
- **Clique repetido:** na revisão do pagamento, clique várias vezes em "Confirmar compra". Só um
  pedido é criado (trava no cliente e idempotência na API).
- **Timeout após criar o pedido:** `order-timeout` e confirme o pagamento. A resposta não chega,
  a tela avisa; confirme de novo e o mesmo pedido é recuperado (mesma `Idempotency-Key`, sem duplicar).
- **Cupom inválido ou expirado:** no carrinho, aplique `XXXX` (inválido) ou `EXPIRADO20`.
- **Preço ou disponibilidade mudando (Socket.IO):** com um NFT no carrinho ou na revisão do pagamento,
  rode `__mockControl.updateNft('nft-03', { priceEth: '2.10' })` (ou `{ availableQuantity: 0 }`).
  A tela avisa, atualiza o resumo e o pagamento exige aceitar os novos valores.
- **Eventos duplicados ou antigos, queda de conexão:** `__mockControl.replay(evento)`,
  `__mockControl.emit(eventoComVersaoAntiga)`, `__mockControl.disconnect()` e
  `__mockControl.setOffline(true | false)`. O cliente ignora duplicatas e versões antigas e,
  ao reconectar, relê o que importa pela API REST. Recarregar a página com um pedido pendente também recupera o estado.
- **Falhas de rede e HTTP:** `network-error`, `request-timeout`, `transient-failure`, `forbidden` e `error`.
  Cada tela mostra o erro e a recuperação ("Tentar novamente").
- **Conflito de cadastro:** cadastre-se com `ana@kurio.test` (e-mail já usado, 409).

O painel `window.__mockControl` só existe com os mocks ligados e comanda apenas o servidor
simulado: quem atualiza a tela é sempre o cliente Socket.IO real.

## Estrutura

```
src/api         funções que chamam a API (todas passam pela instância Axios de src/lib/api.ts)
src/hooks       TanStack Query: consultas e mutações
src/components  interface (shadcn/ui em components/ui)
src/routes      rotas do TanStack Router (arquivos)
src/lib         utilitários (ETH em string decimal, busca na URL, realtime, validação)
src/mocks       MSW: handlers REST, fixtures, estado persistido, Socket.IO simulado
src/types       contratos tipados (REST e eventos)
e2e             testes Playwright e baselines visuais
```

## Limitações

Resumidas em [`ARCHITECTURE.md`](./ARCHITECTURE.md#limitações-e-pendências): transporte só
WebSocket no mock, validação de endereço de carteira no formato `0x…`, Performance mobile do
Lighthouse abaixo da meta, e telas ainda sem conferência final contra o Figma.
