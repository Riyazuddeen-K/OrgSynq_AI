import { useState, ReactNode } from 'react'
import { UserMinus, LogOut, Target, Rocket, Wallet, Home, TrendingUp, Layers, Play, Bot, Zap, DollarSign, FileWarning, Timer } from 'lucide-react'
import Topbar from '../components/Topbar'
import DeptBarChart from '../components/charts/DeptBarChart'
import { ProgressBar, Badge } from '../components/Primitives'
import { useDepartments } from '../hooks/useDepartments'
import { useSimulations } from '../hooks/useSimulations'
import { formatCurrency, classNames, timeAgo } from '../lib/utils'

const SCENARIO_TYPES = [
  { id: 'Layoff', label: 'Layoff', icon: UserMinus },
  { id: 'Resignation', label: 'Resignation', icon: LogOut },
  { id: 'Hiring', label: 'Hiring', icon: Target },
  { id: 'Promotion', label: 'Promotion', icon: Rocket },
  { id: 'BudgetCut', label: 'Budget Cut', icon: Wallet },
  { id: 'HybridWork', label: 'Hybrid Work', icon: Home },
  { id: 'Expansion', label: 'Expansion', icon: TrendingUp },
  { id: 'Restructuring', label: 'Restructuring', icon: Layers }
]

const SCENARIO_PROFILE: Record<string, { productivity: number; risk: number; morale: number; recovery: number; recs: string[] }> = {
  Layoff: {
    productivity: -11,
    risk: 32,
    morale: -18,
    recovery: 2,
    recs: ['Implement knowledge transfer protocols before changes', 'Communicate transparently with the remaining team', 'Offer outplacement support to affected employees']
  },
  Resignation: {
    productivity: -6,
    risk: 18,
    morale: -8,
    recovery: 1.5,
    recs: ['Start backfill hiring immediately', 'Schedule stay interviews with adjacent team members', 'Document tribal knowledge before exit']
  },
  Hiring: {
    productivity: 9,
    risk: -5,
    morale: 6,
    recovery: 3,
    recs: ['Pair new hires with a senior mentor', 'Front-load onboarding documentation', 'Stagger start dates to avoid ramp-up bottlenecks']
  },
  Promotion: {
    productivity: 5,
    risk: -12,
    morale: 14,
    recovery: 1,
    recs: ['Publicly recognize promoted employees', 'Set 30/60/90 day goals for the new scope', 'Backfill vacated responsibilities early']
  },
  BudgetCut: {
    productivity: -8,
    risk: 21,
    morale: -14,
    recovery: 2.5,
    recs: ['Prioritize roadmap ruthlessly with stakeholders', 'Freeze discretionary spend before headcount', 'Over-communicate the "why" to reduce anxiety']
  },
  HybridWork: {
    productivity: 3,
    risk: -9,
    morale: 11,
    recovery: 1,
    recs: ['Set clear core collaboration hours', 'Invest in async documentation habits', 'Audit meeting load for remote-first fairness']
  },
  Expansion: {
    productivity: 7,
    risk: 4,
    morale: 9,
    recovery: 3.5,
    recs: ['Define reporting lines before scaling headcount', 'Protect culture with a strong onboarding cohort', 'Track ramp velocity by department']
  },
  Restructuring: {
    productivity: -4,
    risk: 26,
    morale: -11,
    recovery: 2.5,
    recs: ['Announce the new org chart in one unified message', 'Give managers a shared FAQ for 1:1s', 'Re-baseline OKRs after the transition']
  }
}

export default function SimulationEngine() {
  const { departments } = useDepartments()
  const { simulations, saveSimulation } = useSimulations()
  const [scenarioType, setScenarioType] = useState('Layoff')
  const [scenarioName, setScenarioName] = useState('')
  const [targetDeptId, setTargetDeptId] = useState('')
  const [affected, setAffected] = useState(16)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<null | {
    productivity: number
    financial: number
    delayRisk: number
    recovery: number
    attritionRisk: number
    morale: number
    confidence: number
    recs: string[]
    deptImpact: Array<{ name: string; impact: number }>
  }>(null)

  const activeDept = departments.find((d) => d.id === targetDeptId) || departments[0]

  async function runSimulation() {
    setRunning(true)
    const profile = SCENARIO_PROFILE[scenarioType]
    const scale = affected / 16
    const productivity = Math.round(profile.productivity * (0.6 + scale * 0.4))
    const financial = Math.round(affected * 81711 * (profile.productivity < 0 ? 1 : 0.4))
    const delayRisk = Math.max(2, Math.round(Math.abs(profile.productivity) * 2 * (0.6 + scale * 0.4)))
    const recovery = Math.max(0.5, +(profile.recovery * (0.7 + scale * 0.3)).toFixed(1))
    const attritionRisk = Math.max(2, Math.round(Math.abs(profile.risk) * (0.7 + scale * 0.3)))
    const morale = Math.round(profile.morale * (0.7 + scale * 0.3))
    const confidence = Math.max(58, Math.min(96, 88 - Math.round(scale * 6)))
    const deptImpact = departments.slice(0, 6).map((d) => ({
      name: d.name.slice(0, 4),
      impact: Math.round(productivity + (Math.random() * 4 - 2))
    }))

    const computed = {
      productivity,
      financial,
      delayRisk,
      recovery,
      attritionRisk,
      morale,
      confidence,
      recs: profile.recs,
      deptImpact
    }
    setResult(computed)

    await saveSimulation({
      name: scenarioName || `${scenarioType} - ${activeDept?.name || 'Org-wide'}`,
      scenario_type: scenarioType,
      target_department_id: targetDeptId || null,
      affected_employees: affected,
      productivity_change: productivity,
      financial_impact: financial,
      project_delay_risk: delayRisk,
      recovery_time_months: recovery,
      attrition_risk: attritionRisk,
      morale_impact: morale,
      confidence,
      recommendations: profile.recs
    })
    setRunning(false)
  }

  return (
    <div>
      <Topbar title="AI Simulation Engine" subtitle="Predictive workforce scenario modeling" />
      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="card p-5 lg:col-span-2 h-fit">
          <p className="font-display font-semibold mb-4">Configure Scenario</p>

          <label className="text-xs font-medium text-black/50 dark:text-white/40">Scenario Name (optional)</label>
          <input
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="e.g. Q4 Engineering Restructure"
            className="w-full mt-1.5 mb-4 px-3 py-2.5 rounded-lg text-sm bg-black/[0.03] dark:bg-white/[0.05] focus-ring"
          />

          <p className="text-xs font-medium text-black/50 dark:text-white/40 mb-1.5">Scenario Type</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {SCENARIO_TYPES.map((s) => (
              <button
                key={s.id}
                onClick={() => setScenarioType(s.id)}
                className={classNames(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium focus-ring',
                  scenarioType === s.id
                    ? 'border-signal bg-signal/10 text-signal'
                    : 'border-surface-lightborder dark:border-surface-darkborder hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                )}
              >
                <s.icon className="h-4 w-4" /> {s.label}
              </button>
            ))}
          </div>

          <label className="text-xs font-medium text-black/50 dark:text-white/40">Target Department</label>
          <select
            value={targetDeptId}
            onChange={(e) => setTargetDeptId(e.target.value)}
            className="w-full mt-1.5 mb-4 px-3 py-2.5 rounded-lg text-sm bg-black/[0.03] dark:bg-white/[0.05] focus-ring"
          >
            <option value="">Org-wide</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-black/50 dark:text-white/40">Affected Employees</label>
            <span className="text-sm font-semibold">{affected}</span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            value={affected}
            onChange={(e) => setAffected(Number(e.target.value))}
            className="w-full accent-signal mb-1"
          />
          <div className="flex justify-between text-[11px] text-black/40 dark:text-white/30 mb-5">
            <span>1</span>
            <span>25</span>
            <span>50</span>
          </div>

          <button
            onClick={runSimulation}
            disabled={running}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-signal text-white font-medium hover:bg-signal/90 disabled:opacity-60 focus-ring"
          >
            <Play className="h-4 w-4" /> {running ? 'Running…' : 'Run Simulation'}
          </button>

          {simulations.length > 0 && (
            <div className="mt-6 pt-5 border-t border-surface-lightborder dark:border-surface-darkborder">
              <p className="text-xs font-medium text-black/50 dark:text-white/40 mb-2">Recent Simulations</p>
              <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
                {simulations.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs px-2.5 py-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.04]">
                    <span className="truncate">{s.name}</span>
                    <span className="text-black/40 dark:text-white/30 shrink-0 ml-2">{timeAgo(s.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-5">
          {!result && (
            <div className="card p-10 flex flex-col items-center justify-center text-center gap-2 min-h-[400px]">
              <Bot className="h-10 w-10 text-signal mb-1" />
              <p className="font-display font-semibold">Configure a scenario to begin</p>
              <p className="text-sm text-black/45 dark:text-white/40 max-w-sm">
                Choose a scenario type, target department, and headcount, then run the simulation to see predicted impact.
              </p>
            </div>
          )}

          {result && (
            <>
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-display font-semibold">
                      {scenarioType} {activeDept ? `- ${activeDept.name}` : '- Org-wide'} ({affected} employees)
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge className="bg-signal/15 text-signal">{scenarioType}</Badge>
                      <Badge className={result.delayRisk > 25 ? 'bg-rose/15 text-rose' : 'bg-amber/15 text-amber'}>
                        {result.delayRisk > 25 ? 'Critical Risk' : 'Moderate Risk'}
                      </Badge>
                      <span className="text-xs text-black/40 dark:text-white/30">Confidence: {result.confidence}%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MiniStat icon={<Zap className="h-4 w-4" />} value={`${result.productivity > 0 ? '+' : ''}${result.productivity}%`} label="Productivity Change" tone={result.productivity >= 0 ? 'teal' : 'rose'} />
                  <MiniStat icon={<DollarSign className="h-4 w-4" />} value={formatCurrency(result.financial)} label="Financial Impact" tone="rose" />
                  <MiniStat icon={<FileWarning className="h-4 w-4" />} value={`${result.delayRisk}%`} label="Project Delay Risk" tone="amber" />
                  <MiniStat icon={<Timer className="h-4 w-4" />} value={`${result.recovery}mo`} label="Recovery Time" tone="signal" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="card p-5">
                  <p className="font-display font-semibold mb-3">Department Impact</p>
                  <DeptBarChart data={result.deptImpact} xKey="name" series={[{ key: 'impact', color: '#6C5CE7', label: 'Impact' }]} height={220} />
                </div>
                <div className="card p-5">
                  <p className="font-display font-semibold mb-4">Risk Breakdown</p>
                  <div className="space-y-4">
                    <RiskRow label="Attrition Risk" value={result.attritionRisk} color="bg-rose" />
                    <RiskRow label="Project Delay Risk" value={result.delayRisk} color="bg-amber" />
                    <RiskRow label="Morale Impact" value={Math.abs(result.morale)} color="bg-signal" />
                    <RiskRow label="Confidence Score" value={result.confidence} color="bg-teal" />
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-4 w-4 text-signal" />
                  <p className="font-display font-semibold">AI Recommendations</p>
                </div>
                <div className="space-y-2">
                  {result.recs.map((r, i) => (
                    <div key={r} className="flex items-start gap-3 p-3 rounded-lg bg-black/[0.03] dark:bg-white/[0.04]">
                      <span className="h-5 w-5 rounded-full bg-signal/15 text-signal text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm">{r}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MiniStat({ icon, value, label, tone }: { icon: ReactNode; value: string; label: string; tone: 'teal' | 'rose' | 'amber' | 'signal' }) {
  const toneMap = { teal: 'text-teal', rose: 'text-rose', amber: 'text-amber', signal: 'text-signal' }
  return (
    <div className="p-3.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04]">
      <div className={classNames('mb-2', toneMap[tone])}>{icon}</div>
      <p className={classNames('text-lg font-display font-semibold', toneMap[tone])}>{value}</p>
      <p className="text-[11px] text-black/45 dark:text-white/40 mt-0.5">{label}</p>
    </div>
  )
}

function RiskRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-sm">
        <span className="text-black/60 dark:text-white/50">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <ProgressBar value={value} colorClass={color} />
    </div>
  )
}
