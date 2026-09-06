import { useState, useEffect } from 'react'
import { initials } from '../lib/utils'

const PALETTE = ['#6C5CE7', '#3B82F6', '#EC4899', '#F5A524', '#22C55E', '#06B6D4', '#F43F5E', '#14B8A6', '#8B5CF6']

function hashSeed(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export default function Avatar({
  name,
  src,
  size = 40,
  className = ''
}: {
  name: string
  src?: string
  size?: number
  className?: string
}) {
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [src])

  const color = PALETTE[hashSeed(name || 'OrgSynq') % PALETTE.length]
  const cleanSrc = src && typeof src === 'string' && src.trim().length > 0 ? src.trim() : null

  if (cleanSrc && !imgError) {
    return (
      <img
        src={cleanSrc}
        alt={name}
        onError={() => setImgError(true)}
        className={`rounded-full object-cover shrink-0 ring-1 ring-black/10 dark:ring-white/10 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white shrink-0 shadow-sm ${className}`}
      style={{ width: size, height: size, backgroundColor: color, fontSize: Math.max(10, size * 0.38) }}
    >
      {initials(name || 'U')}
    </div>
  )
}

