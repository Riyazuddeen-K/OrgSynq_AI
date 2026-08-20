import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import Topbar from '../components/Topbar'
import { Badge, LoadingState } from '../components/Primitives'
import { useEmployees } from '../hooks/useEmployees'
import { useDepartments } from '../hooks/useDepartments'
import { useDigitalTwinByEmployee } from '../hooks/useDigitalTwins'
import { initials, riskColorClasses } from '../lib/utils'
import type { Employee } from '../lib/types'

const NODE_R = 26
const LEVEL_GAP = 140
const NODE_GAP = 92

interface PositionedNode {
  employee: Employee
  x: number
  y: number
  level: number
}

function buildLayout(employees: Employee[]): { nodes: PositionedNode[]; width: number; height: number } {
  const byManager = new Map<string | null, Employee[]>()
  employees.forEach((e) => {
    const key = e.manager_id
    if (!byManager.has(key)) byManager.set(key, [])
    byManager.get(key)!.push(e)
  })

  const levels: Employee[][] = []
  let current = byManager.get(null) || []
  const visited = new Set<string>()
  while (current.length > 0) {
    levels.push(current)
    current.forEach((e) => visited.add(e.id))
    const next: Employee[] = []
    current.forEach((e) => {
      const children = byManager.get(e.id) || []
      children.forEach((c) => {
        if (!visited.has(c.id)) next.push(c)
      })
    })
    current = next
  }

  // Any employees not reached (orphaned managers) get appended to the last level
  const unplaced = employees.filter((e) => !visited.has(e.id))
  if (unplaced.length > 0) levels.push(unplaced)

  const nodes: PositionedNode[] = []
  const maxRowWidth = Math.max(...levels.map((l) => l.length)) * NODE_GAP
  levels.forEach((rowEmployees, level) => {
    const rowWidth = rowEmployees.length * NODE_GAP
    const offsetX = (maxRowWidth - rowWidth) / 2
    rowEmployees.forEach((e, i) => {
      nodes.push({
        employee: e,
        x: offsetX + i * NODE_GAP + NODE_GAP / 2,
        y: level * LEVEL_GAP + NODE_R + 20,
        level
      })
    })
  })

  return {
    nodes,
    width: Math.max(maxRowWidth, 600),
    height: levels.length * LEVEL_GAP + 60
  }
}

export default function OrgNetwork() {
  const { employees, loading } = useEmployees()
  const { departments } = useDepartments()
  const [deptFilter, setDeptFilter] = useState('All')
  const [selected, setSelected] = useState<Employee | null>(null)
  const { twin } = useDigitalTwinByEmployee(selected?.id)

  const filteredEmployees = useMemo(
    () => (deptFilter === 'All' ? employees : employees.filter((e) => e.department?.name === deptFilter)),
    [employees, deptFilter]
  )

  const { nodes, width, height } = useMemo(() => buildLayout(filteredEmployees), [filteredEmployees])
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.employee.id, n])), [nodes])

  return (
    <div>
      <Topbar title="Org Network Graph" subtitle="Interactive organizational hierarchy visualization" />
      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="card p-5 h-fit lg:col-span-1 space-y-4">
          <div>
            <p className="text-xs font-medium text-black/50 dark:text-white/40 mb-1.5">Filter by Department</p>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-black/[0.03] dark:bg-white/[0.05] focus-ring"
            >
              <option>All</option>
              {departments.map((d) => (
                <option key={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs font-medium text-black/50 dark:text-white/40 mb-2">Legend</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {departments.map((d, i) => (
                <span key={d.id} className="flex items-center gap-1.5 text-xs text-black/60 dark:text-white/50">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: d.color || ['#3B82F6', '#8B5CF6', '#EC4899', '#F5A524', '#22C55E', '#06B6D4', '#F43F5E', '#14B8A6'][i % 8] }}
                  />
                  {d.name}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-black/40 dark:text-white/30 pt-3 border-t border-surface-lightborder dark:border-surface-darkborder">
            Click a node to inspect. Scroll to pan across the chart.
          </p>
        </div>

        <div className="card p-3 lg:col-span-3 overflow-hidden">
          {loading && <LoadingState />}
          {!loading && (
            <div className="overflow-auto scrollbar-thin" style={{ maxHeight: 640 }}>
              <svg width={width + 40} height={height} className="mx-auto">
                <g transform="translate(20,10)">
                  {nodes.map((n) => {
                    if (!n.employee.manager_id) return null
                    const parent = nodeById.get(n.employee.manager_id)
                    if (!parent) return null
                    return (
                      <line
                        key={`edge-${n.employee.id}`}
                        x1={parent.x}
                        y1={parent.y}
                        x2={n.x}
                        y2={n.y}
                        stroke="currentColor"
                        className="text-black/15 dark:text-white/15"
                        strokeDasharray="3 3"
                      />
                    )
                  })}
                  {nodes.map((n) => {
                    const color = n.employee.department?.color || '#6C5CE7'
                    const isSelected = selected?.id === n.employee.id
                    return (
                      <g
                        key={n.employee.id}
                        transform={`translate(${n.x},${n.y})`}
                        onClick={() => setSelected(n.employee)}
                        className="cursor-pointer"
                      >
                        {n.employee.attrition_risk >= 60 && (
                          <circle r={NODE_R + 4} fill="none" stroke="#F43F5E" strokeWidth={1.5} strokeDasharray="4 3" />
                        )}
                        <circle
                          r={NODE_R}
                          fill={color}
                          fillOpacity={isSelected ? 1 : 0.85}
                          stroke={isSelected ? '#fff' : 'none'}
                          strokeWidth={2}
                        />
                        <text textAnchor="middle" dy="4" fill="#fff" fontSize="11" fontWeight={600}>
                          {initials(n.employee.name)}
                        </text>
                        <text textAnchor="middle" dy={NODE_R + 16} fontSize="11" className="fill-current text-black/60 dark:text-white/60">
                          {n.employee.name.split(' ')[0]}
                        </text>
                      </g>
                    )
                  })}
                </g>
              </svg>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-sm bg-surface-lightcard dark:bg-surface-darkcard h-full p-6 overflow-y-auto scrollbar-thin">
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 focus-ring">
              <X className="h-4 w-4" />
            </button>
            <div className="flex flex-col items-center text-center mt-4">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                style={{ backgroundColor: selected.department?.color || '#6C5CE7' }}
              >
                {initials(selected.name)}
              </div>
              <p className="font-display font-semibold text-lg mt-3">{selected.name}</p>
              <p className="text-sm text-black/50 dark:text-white/40">{selected.title}</p>
              <div className="flex gap-2 mt-3">
                <Badge className="bg-black/5 dark:bg-white/10">{selected.department?.name}</Badge>
                <Badge className={riskColorClasses(selected.attrition_risk)}>{selected.attrition_risk}% risk</Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-6 text-center">
              <div>
                <p className="font-display font-semibold text-teal">{selected.performance}</p>
                <p className="text-[11px] text-black/40 dark:text-white/30">Perf</p>
              </div>
              <div>
                <p className="font-display font-semibold text-amber">{selected.burnout}</p>
                <p className="text-[11px] text-black/40 dark:text-white/30">Burnout</p>
              </div>
              <div>
                <p className="font-display font-semibold text-signal">{twin?.overall ?? '—'}</p>
                <p className="text-[11px] text-black/40 dark:text-white/30">Twin Score</p>
              </div>
            </div>
            <Link
              to={`/employees/${selected.id}`}
              className="block text-center mt-6 py-2.5 rounded-lg bg-signal text-white text-sm font-medium hover:bg-signal/90"
            >
              View Full Profile
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
