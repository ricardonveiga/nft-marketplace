import { cn } from 'cn'
import { Search } from 'lucide-react'
import searchIcon from '@/assets/icons/search.svg'

type SearchFieldProps = {
  label: string
  placeholder: string
  defaultValue?: string
  onSearch: (query: string) => void
  className?: string
  autoFocus?: boolean
  /** `mobile`: ícone fino na cor secundária e texto em peso médio (Figma Mobile / Início). */
  variant?: 'desktop' | 'mobile'
}

export function SearchField({
  label,
  placeholder,
  defaultValue,
  onSearch,
  className,
  autoFocus,
  variant = 'desktop',
}: SearchFieldProps) {
  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)

        onSearch(String(data.get('q') ?? ''))
      }}
      className={cn('relative', className)}
    >
      {variant === 'mobile' ? (
        <Search
          aria-hidden="true"
          strokeWidth={1.5}
          className="pointer-events-none absolute top-1/2 left-3 size-[22px] -translate-y-1/2 text-brand-secondary"
        />
      ) : (
        <img
          src={searchIcon}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
        />
      )}
      <input
        type="search"
        name="q"
        aria-label={label}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        className={cn(
          'h-full w-full min-w-0 rounded-[inherit] bg-transparent pr-3 pl-10 text-sm text-foreground outline-none placeholder:text-brand-secondary focus-visible:ring-2 focus-visible:ring-ring',
          variant === 'mobile' && 'pl-[42px] font-semibold',
        )}
      />
    </form>
  )
}
