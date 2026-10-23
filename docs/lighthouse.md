# Auditoria Lighthouse

Reproduzir: `npm run audit:lighthouse` (script em `scripts/lighthouse.mjs`). Ele gera o build de
produção, sobe o `vite preview` (porta 4179) e mede **Início** e **Detalhe do NFT** (`/nft/nft-03`)
nos perfis **mobile** (padrão do Lighthouse: Moto G Power, 4G lento, CPU 4x) e **desktop**, **3
medições** cada, cada uma em um Chrome novo. Vale o **cenário padrão dos mocks** (MSW ligado,
imagens e fontes reais). Relatórios HTML/JSON da medição mediana e o resumo completo (todas as
medições, ambiente, versões) ficam em `reports/lighthouse/` (`SUMMARY.md`, `summary.json`).

Ambiente da última rodada: Windows 10, i7-7700HQ (8 núcleos), 16 GB, Node 24, Lighthouse 13.5.0,
HeadlessChrome 156 (o do Playwright), throttling simulado.

## Resultado (mediana de 3, última rodada)

| Página | Perfil | Perf | A11y | BP | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Início | Mobile | 73 | 98 | 100 | 100 | 4,23 s | 0,017 | 313 ms |
| Início | Desktop | 99 | 99 | 100 | 100 | 0,88 s | 0,001 | 0 ms |
| Detalhe | Mobile | 75 | 100 | 100 | 100 | 4,31 s | 0 | 231 ms |
| Detalhe | Desktop | 99 | 100 | 100 | 100 | 0,89 s | 0 | 1 ms |

Metas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.
**Tudo atende, exceto Performance no mobile (73 e 75).** A variação entre medições é de ±3 pontos.

## Correções feitas

- **SEO 83 → 100**: faltava `<meta name="description">` e o `robots.txt` caía no rewrite de SPA
  (devolvia o `index.html`, 19 erros). Agora há a meta description e um `public/robots.txt` válido.
- **Imagem do LCP com `loading="lazy"`**: os 3 primeiros cards do grid agora carregam com
  `loading="eager"` e `fetchpriority="high"`.
- **Esqueleto antes do MSW**: a tela passou a renderizar sem esperar o MSW (as requisições é que
  esperam). Resultado: **sem ganho mensurável** (73–76 antes, 73–75 depois, dentro do ruído).

## Por que o mobile continua abaixo de 90

O que explicou a nota **não** é só o MSW. Medição de controle: o mesmo build **sem mocks**
(`VITE_ENABLE_MOCKS=false`, 1 medição) dá Performance 79 (Início) e 67 (Detalhe), com FCP 2,7 s e
TBT ~300 ms. Ou seja, no perfil mobile do Lighthouse (4G lento, CPU 4x mais lenta) o próprio
aplicativo (React, roteador, TanStack Query, Radix, ícones: ~120 KB gzip só no bundle de entrada,
mais ~60 KB do chunk compartilhado) já leva ~2,7 s para o primeiro desenho. O MSW soma ~0,4 s de
FCP e ~690 ms de script (CPU 4x) e atrasa o LCP, porque a imagem do primeiro card só é pedida
depois de o worker subir e a API responder.

- FCP ~3,1 s e LCP ~4,2 s: o LCP é a imagem do primeiro card (depende de JS, MSW, API e imagem em
  sequência). CLS ~0 e o desktop passa com folga (99).
- O Lighthouse ainda aponta ~106 KiB de JavaScript não usado na entrada e 180 ms de CSS bloqueante.

O MSW é parte obrigatória da entrega (os mocks são o backend da demonstração), então o custo do
cenário medido é real. Em produção com API de verdade ele não existiria.

## O que ainda poderia melhorar (não aplicado)

- Um primeiro desenho estático no `index.html` (cabeçalho e esqueleto em HTML/CSS) baixaria o FCP
  para ~1 s, com estimativa de +5 a +8 pontos, mas não resolve o LCP nem o TBT, então não chega a 90.
- Para chegar a 90 no mobile seria preciso reduzir o bundle de entrada (dividir o que a Início não
  usa, trocar bibliotecas pesadas) e tirar o MSW do caminho crítico: um trabalho maior, que muda a
  arquitetura dos mocks. Fica como decisão do projeto, dada a prioridade (fluxo de compra e
  fidelidade visual antes de Lighthouse).

Os números oficiais (todas as medições, ambiente, versões) estão em `reports/lighthouse/SUMMARY.md`.
Variáveis `LH_PROFILE`, `LH_RUNS` e `LH_OUT` do script servem só para experimentos locais.
