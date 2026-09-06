import { useMemo, useState } from 'react'
import { Brain, Siren, Lightbulb, Compass, Telescope, CheckCircle2, Bot } from 'lucide-react'
import Topbar from '../components/Topbar'
import StatCard from '../components/StatCard'
import { ProgressBar, Badge, LoadingState, ErrorState } from '../components/Primitives'
import { useInsights } from '../hooks/useInsights'
import { classNames, timeAgo } from '../lib/utils'
import type { Insight, InsightType } from '../lib/types'

const TYPE_META: Record<InsightType, { label: string; icon: typeof Siren; color: string }> = {
  risk: { label: 'Risk', icon: Siren, color: 'text-rose' },
  opportunity: { label: 'Opportunity', icon: Lightbulb, color: 'text-amber' },
  recommendation: { label: 'Recommendation', icon: Compass, color: 'text-signal' },
  prediction: { label: 'Prediction', icon: Telescope, color: 'text-teal' }
}

const SEVERITY_BADGE: Record<Insight['severity'], string> = {
  critical: 'bg-rose/15 text-rose',
  high: 'bg-amber/15 text-amber',
  medium: 'bg-signal/15 text-signal',
  low: 'bg-teal/15 text-teal'
}

const FILTERS: Array<{ key: 'all' | InsightType; label: string }> = [
  { key: 'all', label: 'All Insights' },
  { key: 'risk', label: 'Risk' },
  { key: 'opportunity', label: 'Opportunity' },
  { key: 'recommendation', label: 'Recommendation' },
  { key: 'prediction', label: 'Prediction' }
]

export default function AIDecisionSupport() {
  const { insights, loading, error, resolveInsight, reopenInsight } = useInsights()
  const [statusTab, setStatusTab] = useState<'pending' | 'resolved'>('pending')
  const [filter, setFilter] = useState<'all' | InsightType>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const pendingInsights = useMemo(() => insights.filter((i) => i.status === 'open'), [insights])
  const resolvedInsights = useMemo(() => insights.filter((i) => i.status === 'resolved'), [insights])

  const currentPool = statusTab === 'pending' ? pendingInsights : resolvedInsights
  const filtered = useMemo(
    () => currentPool.filter((i) => filter === 'all' || i.type === filter),
    [currentPool, filter]
  )
  const selected = insights.find((i) => i.id === selectedId) || null

  const criticalCount = pendingInsights.filter((i) => i.severity === 'critical').length
  const opportunityCount = pendingInsights.filter((i) => i.type === 'opportunity').length
  const avgConfidence = insights.length ? Math.round(insights.reduce((s, i) => s + i.confidence, 0) / insights.length) : 0

  return (
    <div>
      <Topbar title="AI Decision Support" subtitle="Explainable AI insights classified by pending actions and resolved history" />
      <div className="p-4 md:p-8 space-y-5">
        {error && <ErrorState message={error} />}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Brain className="h-4 w-4 text-signal" />} value={insights.length} label="Total Generated" accent="signal" />
          <StatCard icon={<Siren className="h-4 w-4 text-rose" />} value={criticalCount} label="Pending Risks" accent="rose" />
          <StatCard icon={<Lightbulb className="h-4 w-4 text-amber" />} value={opportunityCount} label="Pending Opps" accent="amber" />
          <StatCard icon={<CheckCircle2 className="h-4 w-4 text-teal" />} value={resolvedInsights.length} label="Resolved Total" accent="teal" />
        </div>

        {/* Primary Status Classification Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/[0.08] pb-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/[0.06] p-1 rounded-xl border border-slate-200/70 dark:border-white/[0.06]">
            <button
              onClick={() => {
                setStatusTab('pending')
                setSelectedId(null)
              }}
              className={classNames(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all focus-ring',
                statusTab === 'pending'
                  ? 'bg-signal text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <span>Pending Action</span>
              <span className={classNames(
                'px-2 py-0.5 rounded-full text-xs font-bold',
                statusTab === 'pending' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
              )}>
                {pendingInsights.length}
              </span>
            </button>
            <button
              onClick={() => {
                setStatusTab('resolved')
                setSelectedId(null)
              }}
              className={classNames(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all focus-ring',
                statusTab === 'resolved'
                  ? 'bg-teal text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Resolved Archive</span>
              <span className={classNames(
                'px-2 py-0.5 rounded-full text-xs font-bold',
                statusTab === 'resolved' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
              )}>
                {resolvedInsights.length}
              </span>
            </button>
          </div>

          {/* Subcategory filters */}
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors focus-ring ${
                  filter === f.key
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm'
                    : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <LoadingState />}

        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 space-y-3">
              {filtered.map((insight) => {
                const meta = TYPE_META[insight.type]
                const isResolved = insight.status === 'resolved'
                return (
                  <button
                    key={insight.id}
                    onClick={() => setSelectedId(insight.id)}
                    className={classNames(
                      'card w-full text-left p-5 hover:border-signal/40 transition-all',
                      selectedId === insight.id ? 'border-signal ring-1 ring-signal/50 shadow-md' : '',
                      isResolved ? 'opacity-90 bg-teal/[0.02]' : ''
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <meta.icon className={classNames('h-5 w-5 shrink-0 mt-0.5', meta.color)} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                            {insight.title}
                            {isResolved && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal/15 text-teal">
                                <CheckCircle2 className="h-3 w-3" /> Resolved
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{insight.description}</p>
                        </div>
                      </div>
                      <Badge className={SEVERITY_BADGE[insight.severity]}>{insight.severity}</Badge>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={insight.confidence} colorClass={isResolved ? 'bg-teal' : 'bg-signal'} />
                      <div className="flex items-center justify-between mt-1.5">
                        <span className={classNames('text-xs font-medium', isResolved ? 'text-teal' : 'text-signal')}>
                          {insight.confidence}% confidence
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">{timeAgo(insight.created_at)}</span>
                      </div>
                    </div>
                  </button>
                )
              })}

              {filtered.length === 0 && (
                <div className="card p-10 text-center">
                  <CheckCircle2 className="h-10 w-10 text-teal/40 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {statusTab === 'pending' ? 'Zero Pending Issues in this Category!' : 'No Resolved Insights Yet'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {statusTab === 'pending'
                      ? 'All recommendations and risks have been addressed and archived.'
                      : 'Resolved decisions will be catalogued here for compliance and retrospective review.'}
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              {!selected && (
                <div className="card p-10 flex flex-col items-center justify-center text-center gap-2 min-h-[380px] sticky top-8">
                  <Bot className="h-10 w-10 text-signal mb-1" />
                  <p className="font-display font-semibold text-slate-900 dark:text-white">Select an Insight</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                    Click any insight to view detailed AI reasoning, confidence scores, and step-by-step action plans.
                  </p>
                </div>
              )}
              {selected && (
                <div className="card p-6 sticky top-8 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className={SEVERITY_BADGE[selected.severity]}>{selected.severity}</Badge>
                      <Badge className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                        {TYPE_META[selected.type].label}
                      </Badge>
                    </div>
                    {selected.status === 'resolved' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal bg-teal/10 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
                        Pending Action
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="font-display font-semibold text-lg text-slate-900 dark:text-white">{selected.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">{selected.description}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <span className="text-slate-500 dark:text-slate-400">AI Confidence Rating</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{selected.confidence}%</span>
                    </div>
                    <ProgressBar value={selected.confidence} colorClass={selected.status === 'resolved' ? 'bg-teal' : 'bg-signal'} />
                  </div>

                  {selected.action_steps?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                        Recommended Action Plan
                      </p>
                      <div className="space-y-2">
                        {selected.action_steps.map((step, i) => (
                          <div key={step} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
                            <span className="h-5 w-5 rounded-full bg-signal/15 text-signal text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <p className="text-sm text-slate-800 dark:text-slate-200">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/[0.08]">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {selected.employees_affected} employee{selected.employees_affected === 1 ? '' : 's'} affected
                    </span>
                    {selected.status === 'open' ? (
                      <button
                        onClick={async () => {
                          await resolveInsight(selected.id, selected.title)
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-signal text-white text-xs font-semibold hover:bg-signal/90 shadow-sm transition-all focus-ring"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          await reopenInsight(selected.id, selected.title)
                        }}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-white/10 transition-colors focus-ring"
                      >
                        Reopen to Pending
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
