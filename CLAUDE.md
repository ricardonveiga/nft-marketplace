# Convenções do projeto

O enunciado do desafio está em `CHALLENGE.md`; as decisões de arquitetura e de cada tela, em
`ARCHITECTURE.md` e `docs/decisoes.md`.

## Stack

React, TypeScript, TanStack Router, TanStack Query, Axios, Socket.IO, Tailwind, shadcn/ui, MSW e
Playwright.

## Arquitetura

- Dados fictícios ficam só na camada de mocks (`src/mocks`, MSW); nunca em componentes ou hooks.
- Toda chamada REST passa pela instância Axios de `src/lib/api.ts`.
- Valores em ETH são strings decimais; dinheiro nunca usa `float`.

## Commits

Pequenos e frequentes, com mensagem em português (`feat:`, `fix:`, `test:`, `docs:`).

## Prioridades do desafio

Itens eliminatórios, depois o fluxo de compra, a fidelidade visual, os testes e, por fim, o Lighthouse.
