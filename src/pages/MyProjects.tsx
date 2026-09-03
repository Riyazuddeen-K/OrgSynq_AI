import { useMemo } from 'react'
import { FolderKanban, Calendar } from 'lucide-react'
import Topbar from '../components/Topbar'
import { Badge, LoadingState, EmptyState } from '../components/Primitives'
import { useAuth } from '../context/AuthContext'
import { useEmployees } from '../hooks/useEmployees'
import { useProjects } from '../hooks/useProjects'

export default function MyProjects() {
  const { profile } = useAuth()
  const employeeId = profile?.employee_id
  const { employees } = useEmployees()
  const { projects, loading } = useProjects()

  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees])
  const myProjects = useMemo(
    () => projects.filter((p) => employeeId && p.member_ids.includes(employeeId)),
    [projects, employeeId]
  )

  return (
    <div>
      <Topbar title="My Projects" subtitle="Projects you've been assigned to" />
      <div className="p-4 md:p-8">
        {loading && <LoadingState label="Loading projects…" />}

        {!loading && myProjects.length === 0 && (
          <EmptyState title="No projects yet" description="When you're assigned to a project, it'll show up here — and you'll get notified." />
        )}

        {!loading && myProjects.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {myProjects.map((p) => (
              <div key={p.id} className="card p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-signal shrink-0" />
                    <p className="font-display font-semibold">{p.name}</p>
                  </div>
                  <Badge
                    className={
                      p.status === 'Active'
                        ? 'bg-teal/15 text-teal'
                        : p.status === 'Completed'
                          ? 'bg-signal/15 text-signal'
                          : 'bg-black/5 dark:bg-white/10'
                    }
                  >
                    {p.status}
                  </Badge>
                </div>

                <p className="text-sm text-black/60 dark:text-white/50 mb-3">{p.description}</p>

                {p.deadline && (
                  <div className="flex items-center gap-1.5 text-xs text-black/45 dark:text-white/40 mb-3">
                    <Calendar className="h-3.5 w-3.5" /> Due {new Date(p.deadline).toLocaleDateString()}
                  </div>
                )}

                <div className="pt-3 border-t border-surface-lightborder dark:border-surface-darkborder">
                  <p className="text-xs font-medium text-black/50 dark:text-white/40 mb-2">
                    {p.member_ids.length} member{p.member_ids.length === 1 ? '' : 's'} on this project
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.member_ids
                      .filter((id) => id !== employeeId)
                      .map((id) => {
                        const member = employeeMap.get(id)
                        if (!member) return null
                        return (
                          <Badge key={id} className="bg-black/5 dark:bg-white/10 text-[10px]">
                            {member.name} · {member.title}
                          </Badge>
                        )
                      })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
