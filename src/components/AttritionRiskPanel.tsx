import { AlertTriangle, TrendingDown, TrendingUp, Minus, ClipboardCheck } from 'lucide-react'
import { Badge } from './Primitives'
import { explainAttritionRisk, retentionPlaybook, type RiskImpact } from '../lib/attritionExplain'
import type { DigitalTwin, Employee } from '../lib/types'
import { riskColorClasses } from '../lib/utils'

const IMPACT_META: Record<RiskImpact, { icon: typeof TrendingUp; className: string }> = {
  high: { icon: TrendingUp, className: 'bg-rose/15 text-rose' },
  medium: { icon: AlertTriangle, className: 'bg-amber/15 text-amber' },
  low: { icon: Minus, className: 'bg-black/5 dark:bg-white/10 text-black/50 dark:text-white/40' },
  positive: { icon: TrendingDown, className: 'bg-teal/15 text-teal' }
}

const RISK_THRESHOLD = 50

export default function AttritionRiskPanel({ employee, twin }: { employee: Employee; twin?: DigitalTwin | null }) {
  const factors = explainAttritionRisk(employee, twin)
  const playbook = employee.attrition_risk >= RISK_THRESHOLD ? retentionPlaybook(factors) : []

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-1">
        <p className="font-display font-semibold">Why This Risk Score?</p>
        <Badge className={riskColorClasses(employee.attrition_risk)}>{employee.attrition_risk}% risk</Badge>
      </div>
      <p className="text-xs text-black/45 dark:text-white/40 mb-5">
        A rule-based breakdown built only from tracked data — performance, burnout, tenure, and digital twin scores.
        Nothing here is inferred by AI, so every line traces back to a number you can verify.
      </p>

      {factors.length === 0 ? (
        <p className="text-sm text-black/45 dark:text-white/40 py-4">
          No notable risk or protective factors stand out from the tracked data for this employee right now.
        </p>
      ) : (
        <div className="space-y-2.5">
          {factors.map((f) => {
            const meta = IMPACT_META[f.impact]
            const Icon = meta.icon
            return (
              <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.03]">
                <span className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${meta.className}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-xs text-black/55 dark:text-white/45 mt-0.5">{f.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {playbook.length > 0 && (
        <div className="mt-6 pt-5 border-t border-surface-lightborder dark:border-surface-darkborder">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck className="h-4 w-4 text-signal" />
            <p className="font-display font-semibold text-sm">Suggested Retention Playbook</p>
          </div>
          <div className="space-y-3">
            {playbook.map((p) => (
              <div key={p.title}>
                <p className="text-xs font-semibold text-black/70 dark:text-white/60 mb-1">{p.title}</p>
                <ul className="space-y-1">
                  {p.steps.map((s) => (
                    <li key={s} className="text-xs text-black/55 dark:text-white/45 flex items-start gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-signal mt-1.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
