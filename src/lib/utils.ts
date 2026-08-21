export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function riskLabel(risk: number): 'Low Risk' | 'Medium Risk' | 'High Risk' {
  if (risk >= 60) return 'High Risk'
  if (risk >= 30) return 'Medium Risk'
  return 'Low Risk'
}

export function riskColorClasses(risk: number): string {
  if (risk >= 60) return 'bg-rose/15 text-rose'
  if (risk >= 30) return 'bg-amber/15 text-amber'
  return 'bg-teal/15 text-teal'
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// A derived "determination" signal (0–100) used by the Prediction /
// team-formation feature. There's no explicit "determination" field in
// the data model, so this is computed from three signals that already
// exist on every employee: performance (higher is better), inverted
// burnout (lower burnout suggests more sustainable drive), and inverted
// attrition risk (lower risk suggests more commitment to staying and
// following through). Shown in the UI as "Determination" so it's clear
// this is a derived score, not a field someone manually entered.
export function determinationScore(e: { performance: number; burnout: number; attrition_risk: number }): number {
  return Math.round((e.performance + (100 - e.burnout) + (100 - e.attrition_risk)) / 3)
}
