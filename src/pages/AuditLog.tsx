import { useMemo, useState } from 'react'
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  User,
  Clock,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import StatCard from '../components/StatCard'
import { Badge, LoadingState } from '../components/Primitives'
import { useActivityFeed } from '../hooks/useActivityFeed'
import { useAuth } from '../context/AuthContext'
import type { ActivityFeedAction, UserRole } from '../lib/types'
import { classNames, timeAgo } from '../lib/utils'

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  intern_converted: { label: 'Intern Converted', color: 'bg-signal/15 text-signal' },
  intern_added: { label: 'Intern Registered', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  intern_deleted: { label: 'Intern Removed', color: 'bg-rose/15 text-rose' },
  event_created: { label: 'Calendar Event Scheduled', color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400' },
  event_deleted: { label: 'Event Canceled', color: 'bg-rose/15 text-rose' },
  project_created: { label: 'Project Created', color: 'bg-teal/15 text-teal' },
  project_status_changed: { label: 'Project Status Updated', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  project_deleted: { label: 'Project Deleted', color: 'bg-rose/15 text-rose' },
  employee_added: { label: 'Employee Hired', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  employee_updated: { label: 'Employee Modified', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  employee_deleted: { label: 'Employee Removed', color: 'bg-rose/15 text-rose' },
  insight_resolved: { label: 'AI Risk Resolved', color: 'bg-teal/15 text-teal' },
  insight_generated: { label: 'Insight Generated', color: 'bg-signal/15 text-signal' },
  role_updated: { label: 'User Role Changed', color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400' },
  profile_photo_updated: { label: 'Profile Photo Updated', color: 'bg-slate-100 dark:bg-white/10 text-slate-600' }
}

export default function AuditLog() {
  const { feed, loading, deleteActivity, clearAllActivity } = useActivityFeed(100)
  const { role } = useAuth()

  const [query, setQuery] = useState('')
  const [selectedAdmin, setSelectedAdmin] = useState('All')
  const [selectedAction, setSelectedAction] = useState('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Unique admins list
  const adminList = useMemo(() => {
    const set = new Set<string>()
    feed.forEach((item) => {
      if (item.actor) set.add(item.actor)
    })
    return ['All', ...Array.from(set)]
  }, [feed])

  const superAdminCount = useMemo(() => feed.filter((f) => f.actor_role === 'superadmin').length, [feed])
  const uniqueAdmins = useMemo(() => new Set(feed.map((f) => f.actor || f.actor_email)).size, [feed])

  const filtered = useMemo(() => {
    return feed.filter((item) => {
      if (selectedAdmin !== 'All' && item.actor !== selectedAdmin) return false
      if (selectedAction !== 'All' && item.action !== selectedAction) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        const match =
          item.message.toLowerCase().includes(q) ||
          (item.actor && item.actor.toLowerCase().includes(q)) ||
          (item.actor_email && item.actor_email.toLowerCase().includes(q)) ||
          (item.target && item.target.toLowerCase().includes(q)) ||
          (typeof item.details === 'string' && item.details.toLowerCase().includes(q))
        if (!match) return false
      }
      return true
    })
  }, [feed, selectedAdmin, selectedAction, query])

  function exportCsv() {
    const headers = ['Timestamp', 'Actor Name', 'Actor Email', 'Actor Role', 'Action', 'Message', 'Target', 'Details']
    const rows = filtered.map((item) => [
      `"${item.created_at}"`,
      `"${item.actor || 'Admin'}"`,
      `"${item.actor_email || 'N/A'}"`,
      `"${item.actor_role || 'admin'}"`,
      `"${item.action}"`,
      `"${item.message.replace(/"/g, '""')}"`,
      `"${(item.target || '').replace(/"/g, '""')}"`,
      `"${(typeof item.details === 'string' ? item.details : JSON.stringify(item.details || '')).replace(/"/g, '""')}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `orgsynq_audit_log_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleClearAll() {
    if (window.confirm('Are you sure you want to permanently clear all audit log entries? This action cannot be undone.')) {
      clearAllActivity()
    }
  }

  function handleDeleteSingle(id: string, actionName: string) {
    if (window.confirm(`Delete audit log entry: "${actionName}"?`)) {
      deleteActivity(id)
    }
  }

  return (
    <div>
      <Topbar
        title="Admin Change Audit Log"
        subtitle="Super Admin enterprise compliance: chronological log of changes made by administrators"
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<ShieldCheck className="h-4 w-4 text-signal" />} value={feed.length} label="Operations Logged" accent="signal" />
          <StatCard icon={<User className="h-4 w-4 text-amber" />} value={uniqueAdmins} label="Active Administrators" accent="amber" />
          <StatCard icon={<ShieldAlert className="h-4 w-4 text-purple-500" />} value={superAdminCount} label="Super Admin Actions" accent="signal" />
          <StatCard icon={<Clock className="h-4 w-4 text-teal" />} value="Real-time" label="Audit Trail Sync" accent="teal" />
        </div>

        {/* Filter and Export Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64 flex items-center">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search actor, target, or details..."
                className="input text-xs"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            <select
              value={selectedAdmin}
              onChange={(e) => setSelectedAdmin(e.target.value)}
              className="input text-xs w-auto"
            >
              {adminList.map((admin) => (
                <option key={admin} value={admin}>
                  {admin === 'All' ? 'All Administrators' : `Admin: ${admin}`}
                </option>
              ))}
            </select>

            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="input text-xs w-auto"
            >
              <option value="All">All Operations</option>
              {Object.keys(ACTION_LABELS).map((action) => (
                <option key={action} value={action}>
                  {ACTION_LABELS[action].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto">
            <button
              onClick={handleClearAll}
              disabled={feed.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose/30 hover:bg-rose/10 text-xs font-semibold text-rose transition-colors shadow-sm focus-ring shrink-0 disabled:opacity-40"
              title="Clear all audit log entries"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear All Logs
            </button>

            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors shadow-sm focus-ring shrink-0"
            >
              <Download className="h-3.5 w-3.5" /> Export Audit CSV
            </button>
          </div>
        </div>

        {loading && <LoadingState label="Loading audit trail records…" />}

        {/* Audit Log Table */}
        {!loading && (
          <div className="card overflow-hidden border border-slate-200/80 dark:border-white/[0.08] shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5 pl-5">Timestamp</th>
                    <th className="p-3.5">Administrator</th>
                    <th className="p-3.5">Operation / Event</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5">Target</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-white/[0.06]">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400">
                        No audit events match your search criteria.
                      </td>
                    </tr>
                  )}
                  {filtered.map((item) => {
                    const isSuper = item.actor_role === 'superadmin'
                    const actionMeta = ACTION_LABELS[item.action] || {
                      label: item.action.replace(/_/g, ' '),
                      color: 'bg-slate-100 dark:bg-white/10 text-slate-600'
                    }
                    const isExpanded = expandedId === item.id

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 pl-5 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              {new Date(item.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ({timeAgo(item.created_at)})
                            </p>
                          </div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={item.actor || 'Admin'} size={28} />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {item.actor || 'Admin'}
                                </span>
                                <span
                                  className={classNames(
                                    'px-1.5 py-0.2 rounded text-[9px] font-bold uppercase',
                                    isSuper
                                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                                      : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                  )}
                                >
                                  {isSuper ? 'Super Admin' : 'Admin'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">{item.actor_email || 'admin@orgsynq.ai'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span className={classNames('px-2.5 py-1 rounded-full text-[11px] font-semibold', actionMeta.color)}>
                            {actionMeta.label}
                          </span>
                        </td>

                        <td className="p-3.5 max-w-xs text-slate-700 dark:text-slate-300 font-medium">
                          {item.message}
                          {isExpanded && item.details && (
                            <div className="mt-2 p-2 rounded-lg bg-slate-100 dark:bg-black/40 text-[11px] font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 whitespace-pre-wrap">
                              {typeof item.details === 'string' ? item.details : JSON.stringify(item.details, null, 2)}
                            </div>
                          )}
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          {item.target ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 font-medium">
                              {item.target}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2 justify-end">
                            {item.details && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-signal hover:underline"
                              >
                                <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteSingle(item.id, item.message)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose hover:bg-rose/10 transition-colors"
                              title="Delete this log entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
