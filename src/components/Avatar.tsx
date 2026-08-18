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

export default function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const color = PALETTE[hashSeed(name) % PALETTE.length]
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold text-white shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  )
}
