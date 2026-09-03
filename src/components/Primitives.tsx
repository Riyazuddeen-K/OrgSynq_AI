import { ReactNode } from 'react'
import { Loader2, Inbox } from 'lucide-react'
import { classNames } from '../lib/utils'

export function ProgressBar({ value, colorClass = 'bg-signal' }: { value: number; colorClass?: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
      <div
        className={classNames('h-full rounded-full transition-all duration-500', colorClass)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={classNames('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', className)}>
      {children}
    </span>
  )
}

export function LoadingState({ label = 'Loading data…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-24 text-black/40 dark:text-white/30">
      <Loader2 className="h-5 w-5 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-24 text-center px-6">
      <div className="h-11 w-11 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-1">
        <Inbox className="h-5 w-5 text-black/40 dark:text-white/40" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-xs text-black/45 dark:text-white/40 max-w-sm">{description}</p>}
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="m-6 p-4 rounded-xl border border-rose/30 bg-rose/5 text-sm text-rose">
      Couldn't load data from Firebase: {message}
    </div>
  )
}
