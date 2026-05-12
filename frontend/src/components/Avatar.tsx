import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { API_URL } from '../services/api'

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
  const normalizedSrc = useMemo(() => {
    const value = typeof src === 'string' ? src.trim() : ''
    if (!value) return null
    if (['null', 'none', 'undefined'].includes(value.toLowerCase())) return null
    if (value.startsWith('/static/')) return `${API_URL}${value}`
    if (value.startsWith('static/')) return `${API_URL}/${value}`
    return value
  }, [src])
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    setImgFailed(false)
  }, [normalizedSrc])

  return (
    <div className={clsx('relative shrink-0', sizes[size], className)}>
      {normalizedSrc && !imgFailed ? (
        <img
          src={normalizedSrc}
          alt=""
          onError={() => setImgFailed(true)}
          className="h-full w-full rounded-xl object-cover ring-1 ring-white/10"
        />
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
