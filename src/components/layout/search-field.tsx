import { cn } from 'cn'
import searchIcon from '@/assets/icons/search.svg'

type SearchFieldProps = {
  label: string
  placeholder: string
  className?: string
}

export function SearchField({ label, placeholder, className }: SearchFieldProps) {
  return (
    <form
      role="search"
      onSubmit={(event) => event.preventDefault()}
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
        className="h-full w-full min-w-0 rounded-[inherit] bg-transparent pr-3 pl-10 text-sm text-foreground outline-none placeholder:text-brand-secondary focus-visible:ring-2 focus-visible:ring-ring"
      />
    </form>
  )
}
