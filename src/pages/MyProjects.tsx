import { useMemo, useState } from 'react'
import { FolderKanban, Calendar, Clock, CheckCircle2, Users as UsersIcon } from 'lucide-react'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import { Badge, LoadingState, EmptyState } from '../components/Primitives'
import { useAuth } from '../context/AuthContext'
import { useEmployees } from '../hooks/useEmployees'
import { useProjects } from '../hooks/useProjects'
import { classNames } from '../lib/utils'

export default function MyProjects() {
  const { profile } = useAuth()
  const employeeId = profile?.employee_id
  const { employees } = useEmployees()
  const { projects, loading, updateProject } = useProjects()
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees])
  const myProjects = useMemo(
    () => projects.filter((p) => employeeId && p.member_ids.includes(employeeId)),
    [projects, employeeId]
  )

  const completedCount = useMemo(() => myProjects.filter((p) => p.status === 'Completed').length, [myProjects])
  const pendingCount = useMemo(() => myProjects.filter((p) => p.status !== 'Completed').length, [myProjects])

  const filtered = useMemo(() => {
    if (statusFilter === 'completed') return myProjects.filter((p) => p.status === 'Completed')
    if (statusFilter === 'pending') return myProjects.filter((p) => p.status !== 'Completed')
    return myProjects
  }, [myProjects, statusFilter])

  async function toggleProjectCompletion(project: typeof myProjects[0]) {
    const newStatus = project.status === 'Completed' ? 'Active' : 'Completed'
    await updateProject(
      project.id,
      {
        name: project.name,
        description: project.description,
        status: newStatus,
        deadline: project.deadline,
        member_ids: project.member_ids
      },
      project.member_ids
    )
  }

  return (
    <div>
      <Topbar title="My Projects" subtitle="Track your active deliverables, team collaborations, and completion milestones" />
      <div className="p-4 md:p-8 space-y-6">
        {/* Status Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/[0.06] p-1 rounded-xl border border-slate-200/70 dark:border-white/[0.06]">
            <button
              onClick={() => setStatusFilter('all')}
              className={classNames(
                'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all focus-ring',
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              All Projects ({myProjects.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={classNames(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all focus-ring',
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Clock className="h-3 w-3" />
              Pending / In-Progress ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={classNames(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all focus-ring',
                statusFilter === 'completed'
                  ? 'bg-teal text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <CheckCircle2 className="h-3 w-3" />
              Completed ({completedCount})
            </button>
          </div>
        </div>

        {loading && <LoadingState label="Loading projects…" />}

        {!loading && filtered.length === 0 && (
          <EmptyState
            title={statusFilter === 'completed' ? 'No completed projects yet' : 'No projects found'}
            description={
              statusFilter === 'completed'
                ? 'Projects you mark as completed will be recorded in this tab.'
                : "When you're assigned to a project, it will show up here."
            }
          />
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((p) => {
              const isCompleted = p.status === 'Completed'
              return (
                <div key={p.id} className={classNames('card p-5 space-y-3 transition-all', isCompleted && 'bg-teal/[0.02] border-teal/20')}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={classNames('p-2 rounded-xl', isCompleted ? 'bg-teal/15 text-teal' : 'bg-signal/15 text-signal')}>
                        <FolderKanban className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-slate-900 dark:text-white truncate">{p.name}</p>
                        {p.deadline && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <Calendar className="h-3 w-3" /> Due {new Date(p.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          p.status === 'Active'
                            ? 'bg-teal/15 text-teal'
                            : p.status === 'Completed'
                              ? 'bg-signal/15 text-signal'
                              : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                        }
                      >
                        {p.status}
                      </Badge>
                      <button
                        onClick={() => toggleProjectCompletion(p)}
                        className={classNames(
                          'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all focus-ring',
                          isCompleted
                            ? 'border border-slate-300 dark:border-white/20 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                            : 'bg-teal text-white hover:bg-teal/90 shadow-sm'
                        )}
                        title={isCompleted ? 'Mark as In-Progress' : 'Mark as Completed'}
                      >
                        {isCompleted ? 'Reopen' : 'Done'}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{p.description}</p>

                  <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <UsersIcon className="h-3.5 w-3.5" />
                      <span>{p.member_ids.length} teammates</span>
                    </div>

                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                      {p.member_ids.map((id) => {
                        const member = employeeMap.get(id)
                        if (!member) return null
                        return (
                          <Avatar
                            key={id}
                            name={member.name}
                            src={member.photo_url}
                            size={24}
                            className="ring-2 ring-white dark:ring-surface-darkcard"
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

