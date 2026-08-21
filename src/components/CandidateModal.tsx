import { useState, FormEvent, ReactNode, KeyboardEvent } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Candidate, CandidateStatus } from '../lib/types'
import type { NewCandidateInput } from '../hooks/useCandidates'

interface CandidateModalProps {
  candidate?: Candidate | null
  onClose: () => void
  onSubmit: (input: NewCandidateInput) => Promise<{ error: { message: string } | null }>
}

const STATUS_OPTIONS: CandidateStatus[] = ['New', 'Screening', 'Interviewing', 'Offer', 'Hired', 'Rejected']

export default function CandidateModal({ candidate, onClose, onSubmit }: CandidateModalProps) {
  const isEdit = Boolean(candidate)
  const [name, setName] = useState(candidate?.name ?? '')
  const [email, setEmail] = useState(candidate?.email ?? '')
  const [appliedRole, setAppliedRole] = useState(candidate?.applied_role ?? '')
  const [location, setLocation] = useState(candidate?.location ?? '')
  const [experienceYears, setExperienceYears] = useState(candidate?.experience_years ?? 2)
  const [status, setStatus] = useState<CandidateStatus>(candidate?.status ?? 'New')
  const [testScore, setTestScore] = useState(candidate?.test_score ?? 60)
  const [interviewScore, setInterviewScore] = useState(candidate?.interview_score ?? 60)
  const [behaviorScore, setBehaviorScore] = useState(candidate?.behavior_score ?? 60)
  const [notes, setNotes] = useState(candidate?.notes ?? '')
  const [skills, setSkills] = useState<string[]>(candidate?.skills ?? [])
  const [skillDraft, setSkillDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && appliedRole.trim().length > 0

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
      applied_role: appliedRole.trim(),
      location: location.trim() || 'Remote',
      skills: finalSkills,
      experience_years: experienceYears,
      test_score: testScore,
      interview_score: interviewScore,
      behavior_score: behaviorScore,
      status,
      notes: notes.trim() || undefined
    })

    setSubmitting(false)
    if (result.error) {
      setError(result.error.message || 'Something went wrong saving this candidate.')
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
            <p className="font-display font-semibold text-lg">{isEdit ? 'Edit Candidate' : 'Add Candidate'}</p>
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
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Blake" className="input" required />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan.blake@example.com"
              className="input"
              required
            />
          </Field>
          <Field label="Applied Role" required>
            <input
              value={appliedRole}
              onChange={(e) => setAppliedRole(e.target.value)}
              placeholder="Senior Product Designer"
              className="input"
              required
            />
          </Field>
          <Field label="Location">
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Austin" className="input" />
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
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as CandidateStatus)} className="input">
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
          <SliderField label="Test Score" value={testScore} onChange={setTestScore} />
          <SliderField label="Interview Score" value={interviewScore} onChange={setInterviewScore} />
          <SliderField label="Behavior Score" value={behaviorScore} onChange={setBehaviorScore} />
        </div>

        <div className="mt-4">
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional recruiter notes…"
              rows={3}
              className="input resize-none"
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-lg bg-signal text-white font-medium hover:bg-signal/90 disabled:opacity-50 focus-ring"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Candidate'}
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

function SliderField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-black/50 dark:text-white/40">{label}</span>
        <span className="text-xs font-semibold">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-signal"
      />
    </div>
  )
}
