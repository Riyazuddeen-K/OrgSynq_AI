import type { DigitalTwin, Employee } from './types'

export type RiskImpact = 'high' | 'medium' | 'low' | 'positive'

export interface RiskFactor {
  id: string
  label: string
  detail: string
  impact: RiskImpact
}

export interface PlaybookStep {
  title: string
  steps: string[]
}

// Deterministic, rule-based explanation for attrition_risk — built from
// only the fields this app actually tracks (performance, burnout, tenure,
// skills, and digital-twin scores when available). This is intentionally
// NOT an LLM guess: every line here traces back to a specific number you
// can go check yourself, which is the whole point of "explainable" risk —
// a black-box score nobody trusts vs. a score you can audit.
//
// It does not claim to know things the app doesn't track (comp history,
// raise timing, org changes) — it only speaks to signals actually present
// in the data model.
export function explainAttritionRisk(employee: Employee, twin?: DigitalTwin | null): RiskFactor[] {
  const factors: RiskFactor[] = []
  const exp = employee.experience_years ?? 0

  if (employee.burnout >= 70) {
    factors.push({
      id: 'burnout-high',
      label: 'Elevated burnout',
      detail: `Burnout is at ${employee.burnout}, well above a sustainable range — sustained overload is one of the strongest predictors of flight risk.`,
      impact: 'high'
    })
  } else if (employee.burnout >= 50) {
    factors.push({
      id: 'burnout-medium',
      label: 'Rising burnout',
      detail: `Burnout is at ${employee.burnout} — not critical yet, but worth watching before it compounds.`,
      impact: 'medium'
    })
  } else if (employee.burnout < 30) {
    factors.push({
      id: 'burnout-low',
      label: 'Low burnout',
      detail: `Burnout is low (${employee.burnout}), which typically supports retention.`,
      impact: 'positive'
    })
  }

  if (employee.performance >= 80 && employee.attrition_risk >= 50) {
    factors.push({
      id: 'high-performer-risk',
      label: 'High performer with elevated risk',
      detail: `Performance is strong (${employee.performance}) but risk is still elevated — top performers typically have more external options, so this combination deserves priority attention.`,
      impact: 'high'
    })
  }

  if (twin && exp >= 5 && twin.promotion_ready < 50) {
    factors.push({
      id: 'growth-plateau',
      label: 'Possible growth plateau',
      detail: `${exp} years of experience paired with a below-average promotion-readiness score (${twin.promotion_ready}) can signal that growth feels stalled.`,
      impact: 'medium'
    })
  }

  if (exp <= 1) {
    factors.push({
      id: 'early-tenure',
      label: 'Early tenure',
      detail: `Still within the first year (${exp} yr${exp === 1 ? '' : 's'}) — early-tenure employees carry structurally higher attrition risk while they evaluate fit, independent of performance.`,
      impact: exp === 0 ? 'medium' : 'low'
    })
  }

  if (twin && twin.collaboration < 40) {
    factors.push({
      id: 'low-collaboration',
      label: 'Low collaboration signal',
      detail: `Collaboration score is low (${twin.collaboration}), which can indicate friction with the team or manager, or early disengagement.`,
      impact: 'medium'
    })
  }

  if (twin && twin.learning < 40 && exp >= 2) {
    factors.push({
      id: 'low-learning',
      label: 'Limited recent growth',
      detail: `Learning score is low (${twin.learning}) for someone with ${exp} years of experience — may indicate limited recent skill development or stretch opportunities.`,
      impact: 'low'
    })
  }

  if ((employee.skills ?? []).length === 0) {
    factors.push({
      id: 'no-skills-data',
      label: 'No skills on file',
      detail: 'No skills are recorded for this employee, which limits how well internal opportunities (via Prediction) can be matched to them — itself a quiet retention risk.',
      impact: 'low'
    })
  }

  if (employee.attrition_risk >= 50 && factors.every((f) => f.impact !== 'high' && f.impact !== 'medium')) {
    factors.push({
      id: 'fallback',
      label: 'Elevated risk, no single dominant driver',
      detail: `Overall risk is elevated (${employee.attrition_risk}%) based on the combined signal, but no single tracked factor stands out — worth a direct check-in to understand why.`,
      impact: 'medium'
    })
  }

  return factors
}

// Maps triggered risk factors to concrete manager actions. Only steps
// tied to factors that actually fired are included — no generic filler.
const PLAYBOOK_MAP: Record<string, PlaybookStep> = {
  'burnout-high': {
    title: 'Address burnout now',
    steps: ['Review current workload and reprioritize or redistribute tasks', 'Actively encourage using accrued PTO', 'Schedule a wellbeing check-in this week, not next sprint']
  },
  'burnout-medium': {
    title: 'Get ahead of rising burnout',
    steps: ['Ask directly about workload in the next 1:1', 'Watch the trend over the next pulse cycle before it escalates']
  },
  'high-performer-risk': {
    title: 'Protect a high performer',
    steps: ['Prioritize a compensation / market-rate review', 'Have a skip-level conversation about their growth path', "Don't wait for a resignation letter to have the retention conversation"]
  },
  'growth-plateau': {
    title: 'Re-open the growth conversation',
    steps: ['Discuss a concrete promotion timeline or stretch project', 'Identify a mentor or sponsor for their next-level growth', 'Revisit role scope to add more ownership']
  },
  'early-tenure': {
    title: 'Reinforce early-tenure support',
    steps: ['Confirm onboarding/ramp check-ins are actually happening', 'Assign a buddy or mentor if one isn\u2019t already in place', 'Ask directly whether the role is matching expectations so far']
  },
  'low-collaboration': {
    title: 'Understand the disengagement signal',
    steps: ['1:1 to understand any team or manager friction', 'Observe team dynamics in the next few interactions', 'Consider a project or team change if disengagement persists']
  },
  'low-learning': {
    title: 'Reinvest in growth',
    steps: ['Discuss L&D budget or a course/certification goal', 'Set one concrete skill-building goal for next quarter']
  },
  fallback: {
    title: 'Run a direct check-in',
    steps: ['General retention conversation recommended', 'Monitor over the next 1\u20132 pulse cycles for a clearer signal']
  }
}

export function retentionPlaybook(factors: RiskFactor[]): PlaybookStep[] {
  const relevant = factors.filter((f) => f.impact === 'high' || f.impact === 'medium')
  const seen = new Set<string>()
  const playbook: PlaybookStep[] = []
  for (const f of relevant) {
    const step = PLAYBOOK_MAP[f.id]
    if (step && !seen.has(step.title)) {
      seen.add(step.title)
      playbook.push(step)
    }
  }
  return playbook
}
