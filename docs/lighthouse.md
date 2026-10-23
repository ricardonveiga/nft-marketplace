# Auditoria Lighthouse

Reproduzir: `npm run audit:lighthouse` (script em `scripts/lighthouse.mjs`). Ele gera o build de
produção, sobe o `vite preview` (porta 4179) e mede **Início** e **Detalhe do NFT** (`/nft/nft-03`)
nos perfis **mobile** (padrão do Lighthouse: Moto G Power, 4G lento, CPU 4x) e **desktop**, **3
medições** cada, cada uma em um Chrome novo. Vale o **cenário padrão dos mocks** (MSW ligado,
imagens e fontes reais). Relatórios HTML/JSON da medição mediana e o resumo completo (todas as
medições, ambiente, versões) ficam em `reports/lighthouse/` (`SUMMARY.md`, `summary.json`).

Ambiente da última rodada: Windows 10, i7-7700HQ (8 núcleos), 16 GB, Node 24, Lighthouse 13.5.0,
HeadlessChrome 156 (o do Playwright), throttling simulado.

## Resultado (mediana de 3)

| Página | Perfil | Perf | A11y | BP | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Início | Mobile | 76 | 98 | 100 | 100 | 3,98 s | 0,003 | 293 ms |
| Início | Desktop | 99 | 99 | 100 | 100 | 0,86 s | 0,001 | 0 ms |
| Detalhe | Mobile | 77 | 100 | 100 | 100 | 3,98 s | 0 | 264 ms |
| Detalhe | Desktop | 99 | 100 | 100 | 100 | 0,89 s | 0 | 0 ms |

Metas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.
**Tudo atende, exceto Performance no mobile (76 e 77).**

## Correções feitas a partir da primeira medição

- **SEO 83 → 100**: faltava `<meta name="description">` e o `robots.txt` caía no rewrite de SPA
  (devolvia o `index.html`, 19 erros). Agora há a meta description e um `public/robots.txt` válido.
- **Imagem do LCP com `loading="lazy"`**: os 3 primeiros cards do grid agora carregam com
  `loading="eager"` e `fetchpriority="high"`.

## Por que o mobile fica abaixo de 90

- O LCP (~4 s) é quase todo **atraso antes de o elemento existir** (resource load delay ~690 ms
  de ~800 ms do LCP depois do FCP) e o FCP já está em ~2,8 s: a tela só renderiza depois de o
  React montar, e o React só monta depois de o **MSW iniciar** (`enableMocking()` em `src/main.tsx`),
  porque a primeira requisição do catálogo precisa ser interceptada.
- Com CPU 4x mais lenta, o pacote do MSW (`browser-*.js`, ~106 KB) custa ~690 ms de script; o
  bundle principal, ~490 ms. O Lighthouse também aponta ~106 KiB de JavaScript não usado na
  entrada e 180 ms de CSS bloqueante.
- O TBT (250–300 ms) vem desses mesmos scripts. CLS é ~0 e o desktop passa com folga (99).

O MSW é parte obrigatória da entrega (os mocks são o backend da demonstração), então o custo de
subir o service worker antes de renderizar é do cenário medido, não um artefato da medição.
Em produção real sem mocks esse atraso não existiria.

## Possíveis melhorias (não aplicadas)

- Renderizar o esqueleto da página antes de o MSW terminar (a consulta espera o worker).
- Dividir o chunk de `realtime` e adiar o que não é usado na primeira tela.
- Inlinar o CSS crítico.

São ajustes de risco médio sobre o fluxo de inicialização dos mocks; ficam como decisão do
projeto, dada a prioridade (fluxo de compra e fidelidade visual antes de Lighthouse).
