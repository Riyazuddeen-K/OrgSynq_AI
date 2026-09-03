import { useState } from 'react'
import { Briefcase, Plus, Pencil, Trash2, Calendar, Users as UsersIcon } from 'lucide-react'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import ProjectModal from '../components/ProjectModal'
import { Badge, LoadingState, EmptyState } from '../components/Primitives'
import { useProjects } from '../hooks/useProjects'
import { useEmployees } from '../hooks/useEmployees'
import type { Project, ProjectStatus } from '../lib/types'

const STATUS_COLORS: Record<ProjectStatus, string> = {
  Planned: 'bg-black/5 dark:bg-white/10',
  Active: 'bg-teal/15 text-teal',
  Completed: 'bg-signal/15 text-signal'
}

export default function Projects() {
  const { projects, loading, createProject, updateProject, deleteProject } = useProjects()
  const { employees } = useEmployees()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const employeeMap = new Map(employees.map((e) => [e.id, e]))

  return (
    <div>
      <Topbar title="Projects" subtitle="Create projects and assign employees — members are notified automatically" />
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-end mb-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-signal text-white text-sm font-semibold hover:bg-signal/90 transition-all"
          >
            <Plus className="h-4 w-4" /> New Project
          </button>
        </div>

        {loading && <LoadingState label="Loading projects…" />}

        {!loading && projects.length === 0 && (
          <EmptyState title="No projects yet" description="Create a project and assign employees — they'll get notified instantly." />
        )}

        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="card p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-signal shrink-0" />
                    <p className="font-display font-semibold">{p.name}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge>
                    <button
                      onClick={() => setEditingProject(p)}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-black/30 dark:text-white/30 hover:text-signal hover:bg-signal/10 focus-ring"
                      title="Edit project"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${p.name}"? Members will no longer see it.`)) deleteProject(p.id, p.name)
                      }}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-black/30 dark:text-white/30 hover:text-rose hover:bg-rose/10 focus-ring"
                      title="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-black/60 dark:text-white/50 mb-3">{p.description}</p>

                {p.deadline && (
                  <div className="flex items-center gap-1.5 text-xs text-black/45 dark:text-white/40 mb-3">
                    <Calendar className="h-3.5 w-3.5" /> Due {new Date(p.deadline).toLocaleDateString()}
                  </div>
                )}

                <div className="pt-3 border-t border-surface-lightborder dark:border-surface-darkborder">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-black/50 dark:text-white/40 mb-2">
                    <UsersIcon className="h-3.5 w-3.5" /> {p.member_ids.length} member{p.member_ids.length === 1 ? '' : 's'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.member_ids.map((id) => {
                      const emp = employeeMap.get(id)
                      if (!emp) return null
                      return (
                        <div key={id} className="flex items-center gap-1.5 pr-2 rounded-full bg-black/[0.03] dark:bg-white/[0.05]">
                          <Avatar name={emp.name} size={22} />
                          <span className="text-xs">
                            {emp.name} <span className="text-black/40 dark:text-white/30">· {emp.title}</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
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
