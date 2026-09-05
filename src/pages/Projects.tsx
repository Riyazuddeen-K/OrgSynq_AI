import { useMemo, useState } from 'react'
import { Briefcase, Plus, Pencil, Trash2, Calendar, Users as UsersIcon, CheckCircle2, Clock, Check } from 'lucide-react'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import StatCard from '../components/StatCard'
import ProjectModal from '../components/ProjectModal'
import { Badge, LoadingState, EmptyState } from '../components/Primitives'
import { useProjects } from '../hooks/useProjects'
import { useEmployees } from '../hooks/useEmployees'
import type { Project, ProjectStatus } from '../lib/types'
import { classNames } from '../lib/utils'

const STATUS_COLORS: Record<ProjectStatus, string> = {
  Planned: 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300',
  Active: 'bg-teal/15 text-teal',
  Completed: 'bg-signal/15 text-signal'
}

type StatusFilter = 'all' | 'pending' | 'completed'

export default function Projects() {
  const { projects, loading, createProject, updateProject, deleteProject } = useProjects()
  const { employees } = useEmployees()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees])

  const completedCount = useMemo(() => projects.filter((p) => p.status === 'Completed').length, [projects])
  const pendingCount = useMemo(() => projects.filter((p) => p.status !== 'Completed').length, [projects])
  const completionRate = projects.length ? Math.round((completedCount / projects.length) * 100) : 0

  const filteredProjects = useMemo(() => {
    if (statusFilter === 'completed') return projects.filter((p) => p.status === 'Completed')
    if (statusFilter === 'pending') return projects.filter((p) => p.status !== 'Completed')
    return projects
  }, [projects, statusFilter])

  async function handleQuickStatusChange(project: Project, newStatus: ProjectStatus) {
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
      <Topbar title="Projects" subtitle="Manage organizational project deliverables, team assignments, and delivery status" />
      <div className="p-4 md:p-8 space-y-6">
        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Briefcase className="h-4 w-4 text-signal" />} value={projects.length} label="Total Projects" accent="signal" />
          <StatCard icon={<Clock className="h-4 w-4 text-amber" />} value={pendingCount} label="Pending / In-Progress" accent="amber" />
          <StatCard icon={<CheckCircle2 className="h-4 w-4 text-teal" />} value={completedCount} label="Completed" accent="teal" />
          <StatCard icon={<Check className="h-4 w-4 text-signal" />} value={`${completionRate}%`} label="Completion Rate" accent="signal" />
        </div>

        {/* Action Header & Status Filters */}
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
              All ({projects.length})
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

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-signal text-white text-xs font-semibold hover:bg-signal/90 shadow-sm transition-all focus-ring"
          >
            <Plus className="h-4 w-4" /> New Project
          </button>
        </div>

        {loading && <LoadingState label="Loading projects…" />}

        {!loading && filteredProjects.length === 0 && (
          <EmptyState
            title={statusFilter === 'completed' ? 'No completed projects' : 'No projects found'}
            description={
              statusFilter === 'completed'
                ? 'Projects marked as completed will appear in this archive tab.'
                : 'Create a project and assign team members.'
            }
          />
        )}

        {!loading && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredProjects.map((p) => {
              const isCompleted = p.status === 'Completed'
              return (
                <div key={p.id} className={classNames('card p-5 space-y-3 transition-all', isCompleted && 'bg-teal/[0.02] border-teal/20')}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={classNames('p-2 rounded-xl', isCompleted ? 'bg-teal/15 text-teal' : 'bg-signal/15 text-signal')}>
                        <Briefcase className="h-4 w-4" />
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

                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={p.status}
                        onChange={(e) => handleQuickStatusChange(p, e.target.value as ProjectStatus)}
                        className={classNames(
                          'text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 focus-ring cursor-pointer',
                          STATUS_COLORS[p.status]
                        )}
                      >
                        <option value="Planned">Planned</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button
                        onClick={() => setEditingProject(p)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-signal hover:bg-signal/10 transition-colors focus-ring"
                        title="Edit project"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${p.name}"? Members will no longer see it.`)) deleteProject(p.id, p.name)
                        }}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose hover:bg-rose/10 transition-colors focus-ring"
                        title="Delete project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{p.description}</p>

                  <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <UsersIcon className="h-3.5 w-3.5" />
                      <span>{p.member_ids.length} member{p.member_ids.length === 1 ? '' : 's'}</span>
                    </div>

                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                      {p.member_ids.slice(0, 4).map((id) => {
                        const emp = employeeMap.get(id)
                        if (!emp) return null
                        return (
                          <Avatar
                            key={id}
                            name={emp.name}
                            src={emp.photo_url}
                            size={24}
                            className="ring-2 ring-white dark:ring-surface-darkcard"
                          />
                        )
                      })}
                      {p.member_ids.length > 4 && (
                        <span className="h-6 w-6 rounded-full bg-slate-200 dark:bg-white/10 text-[10px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-surface-darkcard">
                          +{p.member_ids.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAddModal && <ProjectModal employees={employees} onClose={() => setShowAddModal(false)} onSubmit={createProject} />}
      {editingProject && (
        <ProjectModal
          project={editingProject}
          employees={employees}
          onClose={() => setEditingProject(null)}
          onSubmit={(input) => updateProject(editingProject.id, input, editingProject.member_ids)}
        />
      )}
    </div>
  )
}

