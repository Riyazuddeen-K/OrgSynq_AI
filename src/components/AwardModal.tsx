import { useState, FormEvent } from 'react'
import { X, Loader2, Trophy, Check } from 'lucide-react'
import type { Employee } from '../lib/types'
import Avatar from './Avatar'
import { classNames } from '../lib/utils'

interface AwardModalProps {
  employees: Employee[]
  onClose: () => void
  onSubmit: (employee: { id: string; name: string }, awardType: string, message?: string) => Promise<{ error: { message: string } | null }>
}

const PRESET_AWARDS = [
  'Employee of the Month',
  'Best Worker',
  'Rising Star',
  'Team Player',
  'Innovation Award',
  'Leadership Excellence',
  'Customer Champion',
  'Perfect Attendance'
]

export default function AwardModal({ employees, onClose, onSubmit }: AwardModalProps) {
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [awardType, setAwardType] = useState('')
  const [customAward, setCustomAward] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const finalAwardType = awardType === 'Other' ? customAward.trim() : awardType
  const canSubmit = Boolean(selectedEmployee) && finalAwardType.length > 0

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(employeeSearch.toLowerCase()) || e.title.toLowerCase().includes(employeeSearch.toLowerCase())
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit || !selectedEmployee || submitting) return
    setSubmitting(true)
    setError(null)

    const result = await onSubmit({ id: selectedEmployee.id, name: selectedEmployee.name }, finalAwardType, message)

    setSubmitting(false)
    if (result.error) {
      setError(result.error.message || 'Something went wrong giving this award.')
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
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber" />
            <div>
              <p className="font-display font-semibold text-lg">Give an Award</p>
              <p className="text-xs text-black/45 dark:text-white/40">They'll be notified instantly and it'll show on their Recognition page</p>
            </div>
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

        {!selectedEmployee ? (
          <div>
            <span className="text-xs font-medium text-black/50 dark:text-white/40">Choose an employee</span>
            <input
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="Search by name or title…"
              className="input mt-1.5 mb-2"
              autoFocus
            />
            <div className="max-h-64 overflow-y-auto scrollbar-thin rounded-lg border border-surface-lightborder dark:border-surface-darkborder divide-y divide-surface-lightborder dark:divide-surface-darkborder">
              {filteredEmployees.map((emp) => (
                <button
                  type="button"
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
                >
                  <Avatar name={emp.name} size={28} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{emp.name}</p>
                    <p className="text-xs text-black/45 dark:text-white/40 truncate">{emp.title}</p>
                  </div>
                </button>
              ))}
              {filteredEmployees.length === 0 && (
                <p className="text-xs text-black/40 dark:text-white/30 text-center py-4">No employees match.</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] mb-4">
              <div className="flex items-center gap-3">
                <Avatar name={selectedEmployee.name} size={32} />
                <div>
                  <p className="text-sm font-medium">{selectedEmployee.name}</p>
                  <p className="text-xs text-black/45 dark:text-white/40">{selectedEmployee.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="text-xs text-signal hover:underline"
              >
                Change
              </button>
            </div>

            <div className="mb-4">
              <span className="text-xs font-medium text-black/50 dark:text-white/40">Award</span>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {PRESET_AWARDS.map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => setAwardType(a)}
                    className={classNames(
                      'flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left',
                      awardType === a
                        ? 'border-amber bg-amber/10 text-amber'
                        : 'border-surface-lightborder dark:border-surface-darkborder hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                    )}
                  >
                    {a}
                    {awardType === a && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAwardType('Other')}
                  className={classNames(
                    'flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left col-span-2',
                    awardType === 'Other'
                      ? 'border-amber bg-amber/10 text-amber'
                      : 'border-surface-lightborder dark:border-surface-darkborder hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                  )}
                >
                  Other (custom)
                  {awardType === 'Other' && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              </div>
              {awardType === 'Other' && (
                <input
                  value={customAward}
                  onChange={(e) => setCustomAward(e.target.value)}
                  placeholder="Custom award name…"
                  className="input mt-2"
                  autoFocus
                />
              )}
            </div>

            <label className="block">
              <span className="text-xs font-medium text-black/50 dark:text-white/40">Message (optional)</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Say why they earned this…"
                rows={3}
                className="input mt-1.5 resize-none"
              />
            </label>
          </>
        )}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-lg bg-signal text-white font-medium hover:bg-signal/90 disabled:opacity-50 focus-ring"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? 'Sending…' : 'Give Award'}
        </button>
      </form>
    </div>
  )
}
