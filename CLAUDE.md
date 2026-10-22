# Regras do projeto
- Enunciado completo em CHALLENGE.md. Sempre consultar antes de decidir.
- Stack obrigatória: React, TypeScript, TanStack Router, TanStack Query, Axios, Socket.IO, Tailwind, shadcn/ui, MSW, Playwright.
- Nunca colocar dado fictício em componente ou hook. Mock só no MSW.
- Toda chamada REST passa pela instância Axios em src/lib/api.ts.
- Valores em ETH como string decimal; nunca usar float para dinheiro.
- Commits pequenos e frequentes, em português.
- Ao terminar cada tarefa, explique em português simples o que foi feito e por quê, em até 8 linhas.
- Prioridade: itens eliminatórios > fluxo de compra funcional > fidelidade visual > testes > Lighthouse.