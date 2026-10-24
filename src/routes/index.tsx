import { createFileRoute } from '@tanstack/react-router'
import { HomeContent } from '@/components/home/home-content'
import { validateCatalogSearch } from '@/lib/catalog-search'

export const Route = createFileRoute('/')({
  validateSearch: validateCatalogSearch,
  component: HomeContent,
})
