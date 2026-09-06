import type { Employee, OneOnOne } from './types'

export interface ManagerBlindSpot {
  manager: Employee
  directReports: Employee[]
  avgBurnout: number
  highBurnoutCount: number
  daysSinceLastOneOnOne: number | null   // null = never logged for any direct report
}

const BURNOUT_THRESHOLD = 55
const STALE_DAYS = 60

// Flags managers whose whole team shows elevated average burnout while the
// manager hasn't logged a single 1:1 (via the Prep 1:1 feature) with any
// of their direct reports recently. Individual-level burnout is already
// visible per-employee everywhere else in the app — this looks specifically
// for a *manager-level* accountability gap: a team trending badly with no
// visible check-in activity behind it.
//
// Caveat, stated plainly: this only sees 1:1s logged through this app's
// "Prep 1:1" feature. A manager who checks in via Slack/in-person and
// simply hasn't used this feature will still show up here — treat a flag
// as "no visibility on check-ins," not proof no check-in happened.
export function computeManagerBlindSpots(employees: Employee[], oneOnOnes: OneOnOne[]): ManagerBlindSpot[] {
  const byManager = new Map<string, Employee[]>()
  for (const e of employees) {
    if (!e.manager_id) continue
    const list = byManager.get(e.manager_id) ?? []
    list.push(e)
    byManager.set(e.manager_id, list)
  }

  const lastOneOnOneByEmployee = new Map<string, number>()
  for (const o of oneOnOnes) {
    const ts = new Date(o.created_at).getTime()
    const existing = lastOneOnOneByEmployee.get(o.employee_id)
    if (!existing || ts > existing) lastOneOnOneByEmployee.set(o.employee_id, ts)
  }

  const employeeById = new Map(employees.map((e) => [e.id, e]))
  const results: ManagerBlindSpot[] = []

  for (const [managerId, reports] of byManager.entries()) {
    const manager = employeeById.get(managerId)
    if (!manager) continue

    const avgBurnout = Math.round(reports.reduce((s, r) => s + r.burnout, 0) / reports.length)
    const highBurnoutCount = reports.filter((r) => r.burnout >= 60).length

    let mostRecent: number | null = null
    for (const r of reports) {
      const ts = lastOneOnOneByEmployee.get(r.id)
      if (ts && (!mostRecent || ts > mostRecent)) mostRecent = ts
    }
    const daysSinceLastOneOnOne = mostRecent ? Math.floor((Date.now() - mostRecent) / 86400000) : null

    const isBlindSpot = avgBurnout >= BURNOUT_THRESHOLD && (daysSinceLastOneOnOne === null || daysSinceLastOneOnOne > STALE_DAYS)

    if (isBlindSpot) {
      results.push({ manager, directReports: reports, avgBurnout, highBurnoutCount, daysSinceLastOneOnOne })
    }
  }

  return results.sort((a, b) => b.avgBurnout - a.avgBurnout)
}
