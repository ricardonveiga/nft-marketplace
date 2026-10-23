import { Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

/** Rota inexistente: dentro do layout do site (cabeçalho e rodapé), com saída para a Início. */
export function NotFound() {
  useEffect(() => {
    const previous = document.title

    document.title = 'Página não encontrada | Kurio'

    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div
      data-testid="route-not-found"
      className="mx-auto flex w-full max-w-[1264px] flex-col items-center gap-4 px-6 py-24 text-center md:px-8"
    >
      <p aria-hidden="true" className="text-display leading-none text-text-accent">
        404
      </p>
      <h1 className="text-heading">Página não encontrada</h1>
      <p className="max-w-[420px] text-text-secondary">
        O endereço que você abriu não existe ou foi movido. Volte à Início para continuar explorando.
      </p>
      <Button asChild className="mt-2 h-[45px] rounded-md px-6 text-base font-bold">
        <Link to="/">Voltar à Início</Link>
      </Button>
    </div>
  )
}
