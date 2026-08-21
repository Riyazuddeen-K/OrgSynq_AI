import { useState } from 'react'
import { SmilePlus, CheckCircle2, TrendingUp } from 'lucide-react'
import { usePulseSurvey } from '../hooks/usePulseSurvey'
import { classNames } from '../lib/utils'

const SCORES = [
  { value: 1, emoji: '😞', label: 'Struggling' },
  { value: 2, emoji: '😕', label: 'Difficult' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '🤩', label: 'Thriving' }
]

interface Props {
  employeeId: string | undefined
  employeeName?: string
}

export default function PulseSurveyWidget({ employeeId, employeeName }: Props) {
  const { responses, loading, submitting, hasRespondedThisWeek, submitPulse, avgScore, week } =
    usePulseSurvey(employeeId)
  const [selected, setSelected] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit() {
    if (!selected) return
    const { error } = await submitPulse(selected, note, employeeName)
    if (!error) setSubmitted(true)
  }

  if (loading) return null

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SmilePlus className="h-5 w-5 text-signal" />
          <div>
            <p className="font-display font-semibold">Weekly Pulse Check</p>
            <p className="text-xs text-black/45 dark:text-white/40">{week}</p>
          </div>
        </div>
        {avgScore !== null && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-signal/10 text-signal text-sm font-semibold">
            <TrendingUp className="h-3.5 w-3.5" />
            {avgScore}/5 avg
          </div>
        )}
      </div>

      {(hasRespondedThisWeek || submitted) ? (
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-teal mb-2" />
          <p className="font-semibold">Thanks for checking in!</p>
          <p className="text-sm text-black/50 dark:text-white/40 mt-1">
            You've submitted your pulse for this week. See you next week!
          </p>
          {responses.length > 0 && (
            <div className="mt-4 flex gap-2 flex-wrap justify-center">
              {responses.slice(0, 8).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 text-xs"
                  title={r.week}
                >
                  <span>{SCORES[r.score - 1]?.emoji}</span>
                  <span className="text-black/50 dark:text-white/40">{r.week.split('W')[1]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-black/60 dark:text-white/50 mb-4">
            How are you feeling this week?
          </p>
          <div className="flex gap-2 mb-5">
            {SCORES.map((s) => (
              <button
                key={s.value}
                onClick={() => setSelected(s.value)}
                className={classNames(
                  'flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all hover:scale-105',
                  selected === s.value
                    ? 'border-signal bg-signal/10 scale-105 shadow-md shadow-signal/20'
                    : 'border-surface-lightborder dark:border-surface-darkborder hover:border-signal/30'
                )}
              >
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-[10px] font-medium text-black/50 dark:text-white/40 hidden sm:block">
                  {s.label}
                </span>
              </button>
            ))}
          </div>

          {selected && (
            <>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any thoughts to share? (optional)"
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-surface-lightborder dark:border-surface-darkborder resize-none focus:outline-none focus:border-signal/50 mb-3"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-signal text-white font-semibold text-sm hover:bg-signal/90 disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Submitting…' : 'Submit Pulse'}
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}
