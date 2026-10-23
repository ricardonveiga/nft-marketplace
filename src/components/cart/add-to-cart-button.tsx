import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAddToCart } from '@/hooks/use-cart'
import { getApiErrorMessage } from '@/lib/api-error'

type Feedback = { kind: 'success' | 'error'; text: string }

/** Botão "Adicionar ao carrinho" com retorno acessível (sucesso e erros da API). */
export function AddToCartButton({ nftId }: { nftId: string }) {
  const add = useAddToCart()
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  function handleClick() {
    setFeedback(null)
    add.mutate(
      { nftId },
      {
        onSuccess: () => setFeedback({ kind: 'success', text: 'Adicionado ao carrinho.' }),
        onError: (error) =>
          setFeedback({
            kind: 'error',
            text: getApiErrorMessage(error, 'Não foi possível adicionar ao carrinho. Tente novamente.'),
          }),
      },
    )
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <Button
        type="button"
        onClick={handleClick}
        disabled={add.isPending}
        aria-busy={add.isPending}
        className="h-[45px] rounded-md px-6 text-base font-bold"
      >
        {add.isPending ? 'Adicionando…' : 'Adicionar ao carrinho'}
      </Button>

      <p
        role="status"
        className={`min-h-5 text-sm ${feedback?.kind === 'error' ? 'text-destructive' : 'text-text-accent'}`}
      >
        {feedback?.text}
        {feedback?.kind === 'success' && (
          <>
            {' '}
            <Link to="/carrinho" className="underline underline-offset-4">
              Ver carrinho
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
