import { useState, FormEvent, ReactNode, KeyboardEvent } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Department, Employee, EmploymentStatus } from '../lib/types'
import type { NewEmployeeInput } from '../hooks/useEmployees'

interface AddEmployeeModalProps {
  departments: Department[]
  managers: Employee[]
  employee?: Employee | null
  onClose: () => void
  onSubmit: (
    input: NewEmployeeInput
  ) => Promise<{ data: Employee | null; error: { message: string } | null } | { error: { message: string } | null }>
}

const STATUS_OPTIONS: EmploymentStatus[] = ['Active', 'Remote', 'On Leave']

export default function AddEmployeeModal({ departments, managers, employee, onClose, onSubmit }: AddEmployeeModalProps) {
  const isEdit = Boolean(employee)
  const [name, setName] = useState(employee?.name ?? '')
  const [email, setEmail] = useState(employee?.email ?? '')
  const [title, setTitle] = useState(employee?.title ?? '')
  const [departmentId, setDepartmentId] = useState(employee?.department_id ?? departments[0]?.id ?? '')
  const [managerId, setManagerId] = useState(employee?.manager_id ?? '')
  const [location, setLocation] = useState(employee?.location ?? '')
  const [status, setStatus] = useState<EmploymentStatus>(employee?.status ?? 'Active')
  const [performance, setPerformance] = useState(employee?.performance ?? 60)
  const [burnout, setBurnout] = useState(employee?.burnout ?? 30)
  const [attritionRisk, setAttritionRisk] = useState(employee?.attrition_risk ?? 20)
  const [experienceYears, setExperienceYears] = useState(employee?.experience_years ?? 2)
  const [skills, setSkills] = useState<string[]>(employee?.skills ?? [])
  const [skillDraft, setSkillDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && title.trim().length > 0 && departmentId

  function addSkillFromDraft() {
    const cleaned = skillDraft.trim()
    if (!cleaned) return
    if (!skills.some((s) => s.toLowerCase() === cleaned.toLowerCase())) {
      setSkills((prev) => [...prev, cleaned])
    }
    setSkillDraft('')
  }

  function handleSkillKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkillFromDraft()
    } else if (e.key === 'Backspace' && !skillDraft && skills.length > 0) {
      setSkills((prev) => prev.slice(0, -1))
    }
  }

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((s) => s !== skill))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError(null)

    const finalSkills = skillDraft.trim() ? [...skills, skillDraft.trim()] : skills

    const result = await onSubmit({
      name: name.trim(),
      email: email.trim(),
      title: title.trim(),
      department_id: departmentId,
      manager_id: managerId || null,
      location: location.trim() || 'Remote',
      status,
      performance,
      burnout,
      attrition_risk: attritionRisk,
      skills: finalSkills,
      experience_years: experienceYears
    })

    setSubmitting(false)
    if (result.error) {
      setError(result.error.message || 'Something went wrong saving this employee.')
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
            <p className="font-display font-semibold text-lg">{isEdit ? 'Edit Employee' : 'Add Employee'}</p>
            <p className="text-xs text-black/45 dark:text-white/40">Saved directly to your Firebase project</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan Blake"
              className="input"
              required
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan.blake@orgsynq.ai"
              className="input"
              required
            />
          </Field>
          <Field label="Job Title" required>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Product Designer"
              className="input"
              required
            />
          </Field>
          <Field label="Location">
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Austin" className="input" />
          </Field>
          <Field label="Department" required>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="input" required>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Manager">
            <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className="input">
              <option value="">No manager</option>
              {managers
                .filter((m) => m.id !== employee?.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.title}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as EmploymentStatus)} className="input">
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Years of Experience">
            <input
              type="number"
              min={0}
              max={45}
              value={experienceYears}
              onChange={(e) => setExperienceYears(Math.max(0, Number(e.target.value)))}
              className="input"
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Skills (press Enter or comma to add)">
            <div className="input flex flex-wrap gap-1.5 items-center min-h-[42px] py-2">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-signal/15 text-signal"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    className="hover:text-rose focus-ring rounded-full"
                    aria-label={`Remove ${s}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                onBlur={addSkillFromDraft}
                placeholder={skills.length === 0 ? 'e.g. React, SQL, Negotiation…' : 'Add another…'}
                className="flex-1 min-w-[100px] bg-transparent outline-none text-sm"
              />
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <SliderField label="Performance" value={performance} onChange={setPerformance} max={100} />
          <SliderField label="Burnout" value={burnout} onChange={setBurnout} max={100} />
          <SliderField label="Attrition Risk" value={attritionRisk} onChange={setAttritionRisk} max={100} />
        </div>

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-lg bg-signal text-white font-medium hover:bg-signal/90 disabled:opacity-50 focus-ring"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Employee'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-black/50 dark:text-white/40">
        {label} {required && <span className="text-rose">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}

function SliderField({
  label,
  value,
  onChange,
  max
}: {
  label: string
  value: number
  onChange: (v: number) => void
  max: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-black/50 dark:text-white/40">{label}</span>
        <span className="text-xs font-semibold">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-signal"
      />
    </div>
  )
}
