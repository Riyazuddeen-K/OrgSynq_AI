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

const accentStyles = {
  signal: {
    bar: 'bg-gradient-to-r from-signal to-indigo-400',
    iconBg: 'bg-signal/10 text-signal ring-signal/20 dark:bg-signal/20',
    hoverBorder: 'hover:border-signal/40',
    glow: 'group-hover:shadow-glow-signal'
  },
  amber: {
    bar: 'bg-gradient-to-r from-amber to-yellow-400',
    iconBg: 'bg-amber/10 text-amber ring-amber/20 dark:bg-amber/20',
    hoverBorder: 'hover:border-amber/40',
    glow: 'group-hover:shadow-glow-amber'
  },
  rose: {
    bar: 'bg-gradient-to-r from-rose to-pink-500',
    iconBg: 'bg-rose/10 text-rose ring-rose/20 dark:bg-rose/20',
    hoverBorder: 'hover:border-rose/40',
    glow: 'group-hover:shadow-glow-rose'
  },
  teal: {
    bar: 'bg-gradient-to-r from-teal to-emerald-400',
    iconBg: 'bg-teal/10 text-teal ring-teal/20 dark:bg-teal/20',
    hoverBorder: 'hover:border-teal/40',
    glow: 'group-hover:shadow-glow-teal'
  }
}

export default function StatCard({ icon, value, label, sublabel, trend, accent = 'signal' }: StatCardProps) {
  const styles = accentStyles[accent]

  return (
    <div
      className={classNames(
        'group relative overflow-hidden p-5 card hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300',
        styles.hoverBorder
      )}
    >
      {/* Top accent gradient bar */}
      <div className={classNames('absolute left-0 top-0 h-[3px] w-full', styles.bar)} />

      {/* Subtle corner ambient glow on hover */}
      <div
        className={classNames(
          'absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none',
          accent === 'signal' && 'bg-signal',
          accent === 'teal' && 'bg-teal',
          accent === 'amber' && 'bg-amber',
          accent === 'rose' && 'bg-rose'
        )}
      />

      <div className="flex items-start justify-between mb-3.5">
        <div
          className={classNames(
            'h-10 w-10 rounded-xl flex items-center justify-center text-lg ring-1 transition-transform group-hover:scale-105 duration-200',
            styles.iconBg
          )}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={classNames(
              'flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
              trend.positive
                ? 'bg-teal/15 text-teal dark:bg-teal/20'
                : 'bg-rose/15 text-rose dark:bg-rose/20'
            )}
          >
            {trend.direction === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {trend.value}
          </span>
        )}
      </div>

      <p className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
        {value}
      </p>
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 uppercase tracking-wider">
        {label}
      </p>
      {sublabel && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-normal truncate">
          {sublabel}
        </p>
      )}
    </div>
  )
}
