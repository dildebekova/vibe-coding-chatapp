import clsx from 'clsx'

type Props = {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  online?: boolean
  className?: string
}

const sizes = { sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-14 w-14 text-lg' }

export function Avatar({ src, name, size = 'md', online, className }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className={clsx('relative shrink-0', sizes[size], className)}>
      {src ? (
        <img src={src} alt="" className="h-full w-full rounded-xl object-cover ring-1 ring-white/10" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#5d87ff]/90 to-[#3d5cff] font-semibold text-white ring-1 ring-white/10">
          {initial}
        </div>
      )}
      {online !== undefined && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#1a1d29]',
            online ? 'bg-emerald-400' : 'bg-zinc-500',
          )}
        />
      )}
    </div>
  )
}
