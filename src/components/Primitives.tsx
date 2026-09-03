import { ReactNode } from 'react'
import { Loader2, Inbox, AlertCircle } from 'lucide-react'
import { classNames } from '../lib/utils'

export function ProgressBar({ value, colorClass = 'bg-gradient-to-r from-signal to-indigo-500' }: { value: number; colorClass?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/[0.08] overflow-hidden p-0.5">
      <div
        className={classNames('h-full rounded-full transition-all duration-700 shadow-xs', colorClass)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide shadow-2xs border border-transparent',
        className
      )}
    >
      {children}
    </span>
  )
}

export function LoadingState({ label = 'Synthesizing workforce intelligence…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
      <div className="relative">
        <div className="h-10 w-10 rounded-full border-2 border-signal/20 border-t-signal animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="h-2 w-2 rounded-full bg-signal animate-ping" />
        </div>
      </div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-20 text-center px-6 card-glass max-w-lg mx-auto my-8 border-dashed border-2 border-slate-200 dark:border-white/10">
      <div className="h-12 w-12 rounded-2xl bg-signal/10 dark:bg-signal/20 text-signal flex items-center justify-center mb-1 shadow-sm">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="text-base font-display font-bold text-slate-900 dark:text-white">{title}</p>
      {description && <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">{description}</p>}
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="m-6 p-4 rounded-xl border border-rose/30 bg-rose/10 text-xs font-medium text-rose flex items-center gap-3 shadow-sm">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
