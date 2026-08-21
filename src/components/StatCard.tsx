import { ReactNode } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { classNames } from '../lib/utils'

interface StatCardProps {
  icon: ReactNode
  value: string | number
  label: string
  sublabel?: string
  trend?: { value: string; direction: 'up' | 'down'; positive?: boolean }
  accent?: 'signal' | 'amber' | 'rose' | 'teal'
}

const accentMap = {
  signal: 'before:bg-signal',
  amber: 'before:bg-amber',
  rose: 'before:bg-rose',
  teal: 'before:bg-teal'
}

export default function StatCard({ icon, value, label, sublabel, trend, accent = 'signal' }: StatCardProps) {
  return (
    <div
      className={classNames(
        'card relative overflow-hidden p-5 before:absolute before:left-0 before:top-0 before:h-[3px] before:w-full',
        accentMap[accent]
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-9 w-9 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-base">
          {icon}
        </div>
        {trend && (
          <span
            className={classNames(
              'flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full',
              trend.positive ? 'bg-teal/15 text-teal' : 'bg-rose/15 text-rose'
            )}
          >
            {trend.direction === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl md:text-3xl font-display font-semibold tracking-tight">{value}</p>
      <p className="text-sm font-medium mt-1">{label}</p>
      {sublabel && <p className="text-xs text-black/45 dark:text-white/40 mt-0.5">{sublabel}</p>}
    </div>
  )
}
