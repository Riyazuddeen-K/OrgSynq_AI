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
