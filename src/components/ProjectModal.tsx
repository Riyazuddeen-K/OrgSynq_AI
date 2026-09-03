import { useState, FormEvent } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import type { Project, ProjectStatus, Employee } from '../lib/types'
import type { NewProjectInput } from '../hooks/useProjects'
import Avatar from './Avatar'
import { classNames } from '../lib/utils'

interface ProjectModalProps {
  project?: Project | null
  employees: Employee[]
  onClose: () => void
  onSubmit: (input: NewProjectInput) => Promise<{ error: { message: string } | null }>
}

const STATUS_OPTIONS: ProjectStatus[] = ['Planned', 'Active', 'Completed']

export default function ProjectModal({ project, employees, onClose, onSubmit }: ProjectModalProps) {
  const isEdit = Boolean(project)
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'Planned')
  const [deadline, setDeadline] = useState(project?.deadline ?? '')
  const [memberIds, setMemberIds] = useState<string[]>(project?.member_ids ?? [])
  const [memberSearch, setMemberSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = name.trim().length > 0 && description.trim().length > 0

  function toggleMember(id: string) {
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      e.title.toLowerCase().includes(memberSearch.toLowerCase())
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError(null)

    const result = await onSubmit({
      name: name.trim(),
      description: description.trim(),
      status,
      member_ids: memberIds,
      deadline
    })

    setSubmitting(false)
    if (result.error) {
      setError(result.error.message || 'Something went wrong saving this project.')
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin bg-surface-lightcard dark:bg-surface-darkcard border border-surface-lightborder dark:border-surface-darkborder rounded-xl2 shadow-card p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-display font-semibold text-lg">{isEdit ? 'Edit Project' : 'New Project'}</p>
            <p className="text-xs text-black/45 dark:text-white/40">Assigned members are notified automatically</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 focus-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-rose/10 text-rose text-sm">{error}</div>}

        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-black/50 dark:text-white/40">
              Project Name <span className="text-rose">*</span>
            </span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mobile App Launch" className="input mt-1.5" required />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-black/50 dark:text-white/40">
              Description <span className="text-rose">*</span>
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this project is about…"
              rows={3}
              className="input mt-1.5 resize-none"
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-black/50 dark:text-white/40">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} className="input mt-1.5">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-black/50 dark:text-white/40">Deadline (optional)</span>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input mt-1.5" />
            </label>
          </div>

          <div>
            <span className="text-xs font-medium text-black/50 dark:text-white/40">
              Members ({memberIds.length} selected)
            </span>
            <input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search by name or title…"
              className="input mt-1.5 mb-2"
            />
            <div className="max-h-56 overflow-y-auto scrollbar-thin rounded-lg border border-surface-lightborder dark:border-surface-darkborder divide-y divide-surface-lightborder dark:divide-surface-darkborder">
              {filteredEmployees.map((emp) => {
                const selected = memberIds.includes(emp.id)
                return (
                  <button
                    type="button"
                    key={emp.id}
                    onClick={() => toggleMember(emp.id)}
                    className={classNames(
                      'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors',
                      selected && 'bg-signal/5'
                    )}
                  >
                    <Avatar name={emp.name} size={28} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{emp.name}</p>
                      <p className="text-xs text-black/45 dark:text-white/40 truncate">{emp.title}</p>
                    </div>
                    {selected && (
                      <div className="h-5 w-5 rounded-full bg-signal flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
              {filteredEmployees.length === 0 && (
                <p className="text-xs text-black/40 dark:text-white/30 text-center py-4">No employees match.</p>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-lg bg-signal text-white font-medium hover:bg-signal/90 disabled:opacity-50 focus-ring"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Project'}
        </button>
      </form>
    </div>
  )
}
