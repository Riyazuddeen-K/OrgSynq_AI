import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Sparkles, Crown, BookOpen, Flame, PlaneTakeoff, Rocket, Handshake, Building } from 'lucide-react'
import Topbar from '../components/Topbar'
import StatCard from '../components/StatCard'
import Avatar from '../components/Avatar'
import { ProgressBar, Badge, LoadingState, ErrorState } from '../components/Primitives'
import { useDigitalTwins } from '../hooks/useDigitalTwins'
import { riskColorClasses } from '../lib/utils'

export default function DigitalTwins() {
  const { twins, loading, error } = useDigitalTwins()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'overall' | 'burnout' | 'attrition_risk'>('overall')

  const avg = (key: keyof (typeof twins)[number]) =>
    twins.length ? Math.round(twins.reduce((s, t) => s + Number(t[key]), 0) / twins.length) : 0

  const filtered = useMemo(() => {
    const list = twins.filter((t) => t.employee?.name.toLowerCase().includes(query.toLowerCase()))
    return [...list].sort((a, b) => (b[sort] as number) - (a[sort] as number))
  }, [twins, query, sort])

  return (
    <div>
      <Topbar title="Digital Twin Profiles" subtitle={`Cognitive AI models for ${twins.length} employees`} />
      <div className="p-4 md:p-8 space-y-5">
        {error && <ErrorState message={error} />}
        {loading && <LoadingState />}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
              <StatCard icon={<Zap className="h-4 w-4 text-teal" />} value={avg('performance')} label="Performance" accent="teal" />
              <StatCard icon={<Sparkles className="h-4 w-4 text-signal" />} value={avg('skills')} label="Skills" accent="signal" />
              <StatCard icon={<Crown className="h-4 w-4 text-amber" />} value={avg('leadership')} label="Leadership" accent="amber" />
              <StatCard icon={<BookOpen className="h-4 w-4 text-signal" />} value={avg('learning')} label="Learning" accent="signal" />
              <StatCard icon={<Flame className="h-4 w-4 text-amber" />} value={avg('burnout')} label="Burnout" accent="amber" />
              <StatCard icon={<PlaneTakeoff className="h-4 w-4 text-rose" />} value={avg('attrition_risk')} label="Attrition Risk" accent="rose" />
              <StatCard icon={<Rocket className="h-4 w-4 text-teal" />} value={avg('promotion_ready')} label="Promotion" accent="teal" />
              <StatCard icon={<Handshake className="h-4 w-4 text-amber" />} value={avg('collaboration')} label="Collaboration" accent="amber" />
              <StatCard icon={<Building className="h-4 w-4 text-signal" />} value={avg('org_contribution')} label="Org Contribution" accent="signal" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search employees…"
                className="w-full sm:max-w-xs px-3 py-2.5 rounded-lg text-sm bg-black/[0.03] dark:bg-white/[0.05] focus-ring"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="px-3 py-2.5 rounded-lg text-sm bg-black/[0.03] dark:bg-white/[0.05] focus-ring"
              >
                <option value="overall">Sort: Overall</option>
                <option value="burnout">Sort: Burnout</option>
                <option value="attrition_risk">Sort: Attrition Risk</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((t) => (
                <div key={t.id} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={t.employee?.name || '—'} size={44} />
                      <div>
                        <p className="text-sm font-semibold">{t.employee?.name}</p>
                        <p className="text-xs text-black/50 dark:text-white/40">{t.employee?.title}</p>
                      </div>
                    </div>
                    <div className="relative h-11 w-11 shrink-0">
                      <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-black/10 dark:text-white/10" />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.5"
                          fill="none"
                          stroke="#6C5CE7"
                          strokeWidth="3"
                          strokeDasharray={`${(t.overall / 100) * 97.4} 97.4`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold">{t.overall}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <Badge className="bg-black/5 dark:bg-white/10">{t.employee?.department?.name}</Badge>
                    <Badge className={riskColorClasses(t.attrition_risk)}>
                      {t.attrition_risk >= 60 ? 'High Risk' : t.attrition_risk >= 30 ? 'Medium Risk' : 'Low Risk'}
                    </Badge>
                  </div>
                  <div className="space-y-2.5 mb-4">
                    <ScoreRow label="Performance" value={t.performance} color="bg-teal" />
                    <ScoreRow label="Burnout" value={t.burnout} color="bg-amber" />
                    <ScoreRow label="Attrition Risk" value={t.attrition_risk} color="bg-rose" />
                  </div>
                  <Link
                    to={`/employees/${t.employee_id}`}
                    className="block text-center text-sm font-medium text-signal hover:underline pt-3 border-t border-surface-lightborder dark:border-surface-darkborder"
                  >
                    View Full Profile →
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ScoreRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1 text-xs">
        <span className="text-black/55 dark:text-white/45">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <ProgressBar value={value} colorClass={color} />
    </div>
  )
}
