import { useState, FormEvent } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Department } from '../lib/types'
import type { NewDepartmentInput } from '../hooks/useDepartments'

const PRESET_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F5A524', '#22C55E', '#06B6D4', '#F43F5E', '#14B8A6', '#6C5CE7', '#64748B']

interface DepartmentModalProps {
  department?: Department | null
  onClose: () => void
  onSubmit: (input: NewDepartmentInput) => Promise<{ error: { message: string } | null }>
}

export default function DepartmentModal({ department, onClose, onSubmit }: DepartmentModalProps) {
  const isEdit = Boolean(department)
  const [name, setName] = useState(department?.name ?? '')
  const [color, setColor] = useState(department?.color ?? PRESET_COLORS[0])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    const result = await onSubmit({ name: name.trim(), color })
    setSubmitting(false)
    if (result.error) {
      setError(result.error.message)
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm bg-surface-lightcard dark:bg-surface-darkcard border border-surface-lightborder dark:border-surface-darkborder rounded-xl2 shadow-card p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <p className="font-display font-semibold text-lg">{isEdit ? 'Edit Department' : 'Add Department'}</p>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 focus-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-rose/10 text-rose text-sm">{error}</div>}

        <label className="block mb-4">
          <span className="text-xs font-medium text-black/50 dark:text-white/40">Department Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Customer Success"
            className="input mt-1.5"
            required
            autoFocus
          />
        </label>

        <label className="block mb-2">
          <span className="text-xs font-medium text-black/50 dark:text-white/40">Color</span>
        </label>
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-7 w-7 rounded-full focus-ring"
              style={{ backgroundColor: c, outline: color === c ? '2px solid currentColor' : undefined, outlineOffset: 2 }}
              aria-label={c}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-7 w-9 rounded cursor-pointer border-0 bg-transparent"
            title="Custom color"
          />
        </div>

        <button
          type="submit"
          disabled={!name.trim() || submitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-signal text-white font-medium hover:bg-signal/90 disabled:opacity-50 focus-ring"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Department'}
        </button>
      </form>
    </div>
  )
}
