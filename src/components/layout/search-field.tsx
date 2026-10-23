import { cn } from 'cn'
import searchIcon from '@/assets/icons/search.svg'

type SearchFieldProps = {
  label: string
  placeholder: string
  defaultValue?: string
  onSearch: (query: string) => void
  className?: string
}

export function SearchField({
  label,
  placeholder,
  defaultValue,
  onSearch,
  className,
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
      <img
        src={searchIcon}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
      />
      <input
        type="search"
        name="q"
        aria-label={label}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-full w-full min-w-0 rounded-[inherit] bg-transparent pr-3 pl-10 text-sm text-foreground outline-none placeholder:text-brand-secondary focus-visible:ring-2 focus-visible:ring-ring"
      />
    </form>
  )
}
