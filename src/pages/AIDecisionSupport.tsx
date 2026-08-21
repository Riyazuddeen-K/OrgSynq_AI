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
  const { insights, loading, error, resolveInsight } = useInsights()
  const [filter, setFilter] = useState<'all' | InsightType>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(
    () => insights.filter((i) => filter === 'all' || i.type === filter),
    [insights, filter]
  )
  const selected = insights.find((i) => i.id === selectedId) || null

  const criticalCount = insights.filter((i) => i.severity === 'critical' && i.status === 'open').length
  const opportunityCount = insights.filter((i) => i.type === 'opportunity' && i.status === 'open').length
  const avgConfidence = insights.length ? Math.round(insights.reduce((s, i) => s + i.confidence, 0) / insights.length) : 0

  return (
    <div>
      <Topbar title="AI Decision Support" subtitle="Explainable AI insights with confidence scores and action plans" />
      <div className="p-4 md:p-8 space-y-5">
        {error && <ErrorState message={error} />}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Brain className="h-4 w-4 text-signal" />} value={insights.length} label="Total Insights" accent="signal" />
          <StatCard icon={<Siren className="h-4 w-4 text-rose" />} value={criticalCount} label="Critical Risks" accent="rose" />
          <StatCard icon={<Lightbulb className="h-4 w-4 text-amber" />} value={opportunityCount} label="Opportunities" accent="amber" />
          <StatCard icon={<Compass className="h-4 w-4 text-teal" />} value={`${avgConfidence}%`} label="Avg Confidence" accent="teal" />
        </div>

        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border focus-ring ${
                filter === f.key
                  ? 'bg-signal text-white border-signal'
                  : 'border-surface-lightborder dark:border-surface-darkborder hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && <LoadingState />}

        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 space-y-3">
              {filtered.map((insight) => {
                const meta = TYPE_META[insight.type]
                return (
                  <button
                    key={insight.id}
                    onClick={() => setSelectedId(insight.id)}
                    className={classNames(
                      'card w-full text-left p-5 hover:border-signal/40 transition-colors',
                      selectedId === insight.id && 'border-signal/60'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <meta.icon className={classNames('h-5 w-5 shrink-0 mt-0.5', meta.color)} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold flex items-center gap-2">
                            {insight.title}
                            {insight.status === 'resolved' && <CheckCircle2 className="h-4 w-4 text-teal shrink-0" />}
                          </p>
                          <p className="text-xs text-black/50 dark:text-white/40 mt-1">{insight.description}</p>
                        </div>
                      </div>
                      <Badge className={SEVERITY_BADGE[insight.severity]}>{insight.severity}</Badge>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={insight.confidence} colorClass="bg-signal" />
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-signal font-medium">{insight.confidence}% confidence</span>
                        <span className="text-[11px] text-black/35 dark:text-white/30">{timeAgo(insight.created_at)}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
              {filtered.length === 0 && <p className="text-sm text-black/45 dark:text-white/40 py-10 text-center">No insights in this category.</p>}
            </div>

            <div className="lg:col-span-2">
              {!selected && (
                <div className="card p-10 flex flex-col items-center justify-center text-center gap-2 min-h-[380px] sticky top-8">
                  <Bot className="h-10 w-10 text-signal mb-1" />
                  <p className="font-display font-semibold">Select an Insight</p>
                  <p className="text-sm text-black/45 dark:text-white/40 max-w-xs">
                    Click any insight to view detailed AI reasoning, confidence scores, and step-by-step action plans.
                  </p>
                </div>
              )}
              {selected && (
                <div className="card p-6 sticky top-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={SEVERITY_BADGE[selected.severity]}>{selected.severity}</Badge>
                    <Badge className="bg-black/5 dark:bg-white/10">{TYPE_META[selected.type].label}</Badge>
                  </div>
                  <p className="font-display font-semibold text-lg mb-2">{selected.title}</p>
                  <p className="text-sm text-black/60 dark:text-white/50 mb-4">{selected.description}</p>

                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <span className="text-black/50 dark:text-white/40">AI Confidence</span>
                      <span className="font-semibold">{selected.confidence}%</span>
                    </div>
                    <ProgressBar value={selected.confidence} colorClass="bg-signal" />
                  </div>

                  {selected.action_steps?.length > 0 && (
                    <div className="mb-5">
                      <p className="text-xs font-medium text-black/50 dark:text-white/40 mb-2">Recommended Action Plan</p>
                      <div className="space-y-2">
                        {selected.action_steps.map((step, i) => (
                          <div key={step} className="flex items-start gap-2.5 p-3 rounded-lg bg-black/[0.03] dark:bg-white/[0.04]">
                            <span className="h-5 w-5 rounded-full bg-signal/15 text-signal text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <p className="text-sm">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-surface-lightborder dark:border-surface-darkborder">
                    <span className="text-xs text-black/40 dark:text-white/30">
                      {selected.employees_affected} employee{selected.employees_affected === 1 ? '' : 's'} affected
                    </span>
                    {selected.status === 'open' ? (
                      <button
                        onClick={() => resolveInsight(selected.id)}
                        className="px-3 py-1.5 rounded-lg bg-signal text-white text-xs font-medium hover:bg-signal/90 focus-ring"
                      >
                        Mark Resolved
                      </button>
                    ) : (
                      <Badge className="bg-teal/15 text-teal">Resolved</Badge>
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
