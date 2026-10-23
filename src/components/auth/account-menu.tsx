import { Link } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import userIcon from '@/assets/tabbar/user.svg'
import { useLogout } from '@/hooks/use-session'
import type { User } from '@/types/auth'

type AccountMenuProps = {
  user: User
  variant: 'header' | 'tab-bar'
}

const itemClass =
  'flex cursor-default items-center rounded-sm px-3 py-2 text-sm outline-none data-[disabled]:opacity-60 data-[highlighted]:bg-accent'

export function AccountMenu({ user, variant }: AccountMenuProps) {
  const logout = useLogout()
  const firstName = user.name.split(' ')[0]

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {variant === 'header' ? (
          <button
            type="button"
            aria-label={`Conta de ${user.name}`}
            className="flex h-[35px] items-center gap-2 rounded-md border border-border-soft px-3 text-base font-medium focus-visible:outline-2 focus-visible:outline-ring"
          >
            {user.avatarUrl && (
              <img src={user.avatarUrl} alt="" width={24} height={24} className="size-6 rounded-full object-cover" />
            )}
            <span className="max-w-[120px] truncate">Olá, {firstName}</span>
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Conta de ${user.name}`}
            className="grid size-10 place-items-center rounded-md focus-visible:outline-2 focus-visible:outline-ring"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" width={28} height={28} className="size-7 rounded-full object-cover" />
            ) : (
              <img src={userIcon} alt="" className="size-5" />
            )}
          </button>
        )}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          side={variant === 'tab-bar' ? 'top' : 'bottom'}
          sideOffset={8}
          className="z-50 min-w-40 rounded-md border border-border bg-card p-1 shadow-xl"
        >
          <DropdownMenu.Label className="px-3 py-2 text-xs text-text-secondary">
            {user.email}
          </DropdownMenu.Label>
          <DropdownMenu.Item asChild className={itemClass}>
            <Link to="/carteiras">Minhas carteiras</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={itemClass}>
            <Link to="/perfil">Meu perfil</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={itemClass}
            disabled={logout.isPending}
            onSelect={() => logout.mutate()}
          >
            Sair
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
