import { X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Button } from '@/components/ui/button'
import { useCatalogNfts } from '@/hooks/use-catalog-search'
import { CatalogSortSelect } from './catalog-sort-select'
import { FiltersPanel } from './filters-panel'

type FiltersDrawerContextValue = {
  openFilters: () => void
}

const FiltersDrawerContext = createContext<FiltersDrawerContextValue | null>(null)

export function useFiltersDrawer() {
  const context = useContext(FiltersDrawerContext)

  if (!context) {
    throw new Error('useFiltersDrawer precisa estar dentro de FiltersDrawerProvider')
  }

  return context
}

type FiltersDrawerProps = {
  onClose: () => void
  onCloseAutoFocus: (event: Event) => void
}

function FiltersDrawer({ onClose, onCloseAutoFocus }: FiltersDrawerProps) {
  const { data } = useCatalogNfts()

  return (
    <Dialog.Content
      className="fixed inset-y-0 right-0 z-50 flex w-[min(90vw,360px)] flex-col gap-4 overflow-y-auto bg-background p-4 shadow-2xl outline-none"
      aria-describedby={undefined}
      onCloseAutoFocus={onCloseAutoFocus}
    >
      <div className="flex items-center justify-between">
        <Dialog.Title className="text-xl">Filtros</Dialog.Title>
        <Dialog.Close
          aria-label="Fechar filtros"
          className="grid size-9 place-items-center rounded-md hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X className="size-5" aria-hidden="true" />
        </Dialog.Close>
      </div>

      <CatalogSortSelect className="flex md:hidden" />
      <FiltersPanel />

      <Button
        type="button"
        size="lg"
        className="sticky bottom-0 h-10 w-full text-base font-bold"
        onClick={onClose}
      >
        {data ? `Ver ${data.total} ${data.total === 1 ? 'NFT' : 'NFTs'}` : 'Ver resultados'}
      </Button>
    </Dialog.Content>
  )
}

export function FiltersDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const openerRef = useRef<HTMLElement | null>(null)
  const value = useMemo(
    () => ({
      openFilters: () => {
        // Os botões que abrem a gaveta ficam fora do Dialog (não há Dialog.Trigger),
        // então guardamos quem abriu para devolver o foco ao fechar.
        openerRef.current = document.activeElement as HTMLElement | null
        setOpen(true)
      },
    }),
    [],
  )

  return (
    <FiltersDrawerContext.Provider value={value}>
      {children}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm" />
          <FiltersDrawer
            onClose={() => setOpen(false)}
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              openerRef.current?.focus()
            }}
          />
        </Dialog.Portal>
      </Dialog.Root>
    </FiltersDrawerContext.Provider>
  )
}
