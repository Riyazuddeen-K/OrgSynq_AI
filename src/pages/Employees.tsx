import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Download, LayoutGrid, List as ListIcon, UserPlus, Trash2 } from 'lucide-react'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import AddEmployeeModal from '../components/AddEmployeeModal'
import { Badge, LoadingState, ErrorState, EmptyState } from '../components/Primitives'
import { useEmployees } from '../hooks/useEmployees'
import { useDepartments } from '../hooks/useDepartments'
import { riskColorClasses } from '../lib/utils'

export default function Employees() {
  const { employees, loading, error, addEmployee, deleteEmployee } = useEmployees()
  const { departments } = useDepartments()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [dept, setDept] = useState('All')
  const [sort, setSort] = useState<'name' | 'performance' | 'risk'>('name')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showAddModal, setShowAddModal] = useState(false)

  const filtered = useMemo(() => {
    let list = employees.filter((e) => {
      const matchesQuery =
        !query ||
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.email.toLowerCase().includes(query.toLowerCase())
      const matchesDept = dept === 'All' || e.department?.name === dept
      return matchesQuery && matchesDept
    })
    list = [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'performance') return b.performance - a.performance
      return b.attrition_risk - a.attrition_risk
    })
    return list
  }, [employees, query, dept, sort])

  function exportCsv() {
    const header = ['Name', 'Title', 'Department', 'Location', 'Status', 'Performance', 'Burnout', 'Attrition Risk']
    const rows = filtered.map((e) => [
      e.name,
      e.title,
      e.department?.name || '',
      e.location,
      e.status,
      e.performance,
      e.burnout,
      e.attrition_risk
    ])
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'orgsynq-employees.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <Topbar title="Employee Directory" subtitle={`${employees.length} team members across ${departments.length} departments`} />
      <div className="p-4 md:p-8 space-y-5">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setParams(e.target.value ? { q: e.target.value } : {})
              }}
              placeholder="Search by name, title, or email…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-transparent focus:border-signal/50 focus-ring"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="px-3 py-2.5 rounded-lg text-sm bg-black/[0.03] dark:bg-white/[0.05] focus-ring"
            >
              <option>All</option>
              {departments.map((d) => (
                <option key={d.id}>{d.name}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="px-3 py-2.5 rounded-lg text-sm bg-black/[0.03] dark:bg-white/[0.05] focus-ring"
            >
              <option value="name">Sort: Name</option>
              <option value="performance">Sort: Performance</option>
              <option value="risk">Sort: Risk</option>
            </select>
            <div className="flex bg-black/[0.03] dark:bg-white/[0.05] rounded-lg p-1">
              <button
                onClick={() => setView('grid')}
                className={`h-8 w-8 rounded-md flex items-center justify-center focus-ring ${view === 'grid' ? 'bg-signal text-white' : ''}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`h-8 w-8 rounded-md flex items-center justify-center focus-ring ${view === 'list' ? 'bg-signal text-white' : ''}`}
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 focus-ring"
            >
              <Download className="h-4 w-4" /> Export
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium bg-signal text-white hover:bg-signal/90 focus-ring"
            >
              <UserPlus className="h-4 w-4" /> Add Employee
            </button>
          </div>
        </div>

        {error && <ErrorState message={error} />}
        {loading && <LoadingState />}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState title="No employees match your filters" description="Try a different search term or clear the department filter." />
        )}

        {!loading && !error && filtered.length > 0 && view === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {filtered.map((e) => (
              <Link key={e.id} to={`/employees/${e.id}`} className="card p-4 hover:border-signal/40 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <Avatar name={e.name} size={44} />
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(ev) => {
                        ev.preventDefault()
                        ev.stopPropagation()
                        if (confirm(`Remove ${e.name} from OrgSynq AI?`)) deleteEmployee(e.id)
                      }}
                      className="h-6 w-6 rounded-md items-center justify-center text-black/30 dark:text-white/30 hover:text-rose hover:bg-rose/10 hidden group-hover:flex focus-ring"
                      title="Remove employee"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <Badge
                      className={
                        e.status === 'Active' ? 'bg-teal/15 text-teal' : e.status === 'Remote' ? 'bg-signal/15 text-signal' : 'bg-amber/15 text-amber'
                      }
                    >
                      {e.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm font-semibold">{e.name}</p>
                <p className="text-xs text-black/50 dark:text-white/40 mb-3">{e.title}</p>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-black/5 dark:bg-white/10">{e.department?.name}</Badge>
                  <span className="text-xs text-black/40 dark:text-white/30">{e.location}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-surface-lightborder dark:border-surface-darkborder text-center">
                  <div>
                    <p className="text-sm font-semibold text-teal">{e.performance}</p>
                    <p className="text-[10px] text-black/40 dark:text-white/30">Perf</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber">{e.burnout}</p>
                    <p className="text-[10px] text-black/40 dark:text-white/30">Burn</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-rose">{e.attrition_risk}%</p>
                    <p className="text-[10px] text-black/40 dark:text-white/30">Risk</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && view === 'list' && (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-black/40 dark:text-white/40 border-b border-surface-lightborder dark:border-surface-darkborder">
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Perf</th>
                  <th className="px-4 py-3 font-medium text-right">Burn</th>
                  <th className="px-4 py-3 font-medium text-right">Risk</th>
                  <th className="px-4 py-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b last:border-0 border-surface-lightborder dark:border-surface-darkborder hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3">
                      <Link to={`/employees/${e.id}`} className="flex items-center gap-3">
                        <Avatar name={e.name} size={32} />
                        <div>
                          <p className="font-medium">{e.name}</p>
                          <p className="text-xs text-black/45 dark:text-white/40">{e.title}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">{e.department?.name}</td>
                    <td className="px-4 py-3">{e.location}</td>
                    <td className="px-4 py-3">{e.status}</td>
                    <td className="px-4 py-3 text-right text-teal font-medium">{e.performance}</td>
                    <td className="px-4 py-3 text-right text-amber font-medium">{e.burnout}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge className={riskColorClasses(e.attrition_risk)}>{e.attrition_risk}%</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${e.name} from OrgSynq AI?`)) deleteEmployee(e.id)
                        }}
                        className="h-7 w-7 rounded-md inline-flex items-center justify-center text-black/30 dark:text-white/30 hover:text-rose hover:bg-rose/10 focus-ring"
                        title="Remove employee"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddEmployeeModal
          departments={departments}
          managers={employees}
          onClose={() => setShowAddModal(false)}
          onSubmit={addEmployee}
        />
      )}
    </div>
  )
}
