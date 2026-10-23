import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import {
  addCartItem,
  applyCoupon,
  fetchCart,
  removeCartItem,
  removeCoupon,
  setCartItemQuantity,
} from '@/api/cart'
import type { Cart } from '@/types/cart'

export const CART_QUERY_KEY = ['cart'] as const

/** Mutações do carrinho compartilham esta chave: a tela as usa para bloquear os controles. */
export const CART_MUTATION_KEY = ['cart', 'mutation'] as const

/**
 * Guarda a cotação mais nova. Respostas com versão menor que a já guardada são
 * ignoradas (chegaram fora de ordem) e nunca sobrescrevem um estado mais recente.
 */
export function storeCart(queryClient: QueryClient, cart: Cart) {
  const current = queryClient.getQueryData<Cart>(CART_QUERY_KEY)

  if (!current || cart.version >= current.version) {
    queryClient.setQueryData(CART_QUERY_KEY, cart)
  }
}

export function useCart() {
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: fetchCart,
    staleTime: 60 * 1000,
    retry: 1,
  })
}

function useCartMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<Cart>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn,
    onSuccess: (cart) => storeCart(queryClient, cart),
  })
}

export function useAddToCart() {
  return useCartMutation(addCartItem)
}

export function useSetCartItemQuantity() {
  return useCartMutation(({ nftId, quantity }: { nftId: string; quantity: number }) =>
    setCartItemQuantity(nftId, quantity),
  )
}

export function useRemoveCartItem() {
  return useCartMutation(removeCartItem)
}

export function useApplyCoupon() {
  return useCartMutation(applyCoupon)
}

export function useRemoveCoupon() {
  return useCartMutation(removeCoupon)
}
