import { useState } from 'react'
import { X, Loader2, Sparkles, AlertTriangle, Check } from 'lucide-react'
import Markdown from './Markdown'
import { generateOneOnOnePrep, isGeminiConfigured, type OneOnOneContext } from '../lib/geminiClient'
import { useOneOnOnesForEmployee, useLogOneOnOne } from '../hooks/useOneOnOnes'
import { usePulseSurvey } from '../hooks/usePulseSurvey'
import { explainAttritionRisk } from '../lib/attritionExplain'
import { timeAgo } from '../lib/utils'
import type { DigitalTwin, Employee } from '../lib/types'

interface OneOnOnePrepModalProps {
  employee: Employee
  twin?: DigitalTwin | null
  onClose: () => void
}

export default function OneOnOnePrepModal({ employee, twin, onClose }: OneOnOnePrepModalProps) {
  const { responses } = usePulseSurvey(employee.id)
  const { entries: history } = useOneOnOnesForEmployee(employee.id)
  const { logOneOnOne } = useLogOneOnOne()

  const [output, setOutput] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleGenerate() {
    setRunning(true)
    setError(null)
    setSaved(false)
    try {
      const factors = explainAttritionRisk(employee, twin)
      const ctx: OneOnOneContext = {
        name: employee.name,
        title: employee.title,
        department: employee.department?.name,
        performance: employee.performance,
        burnout: employee.burnout,
        attrition_risk: employee.attrition_risk,
        experience_years: employee.experience_years ?? 0,
        skills: employee.skills ?? [],
        digitalTwin: twin
          ? {
              leadership: twin.leadership,
              learning: twin.learning,
              promotion_ready: twin.promotion_ready,
              collaboration: twin.collaboration,
              org_contribution: twin.org_contribution
            }
          : null,
        recentPulses: responses.slice(0, 4).map((r) => ({ score: r.score, note: r.note, week: r.week })),
        riskFactors: factors.map((f) => f.label)
      }
      const result = await generateOneOnOnePrep(ctx)
      setOutput(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate 1:1 prep.')
    } finally {
      setRunning(false)
    }
  }

  async function handleSave() {
    if (!output) return
    const { error: saveError } = await logOneOnOne(employee.id, employee.name, employee.manager_id, output)
    if (saveError) {
      setError(saveError.message)
    } else {
      setSaved(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto scrollbar-thin bg-surface-lightcard dark:bg-surface-darkcard border border-surface-lightborder dark:border-surface-darkborder rounded-xl2 shadow-card p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="font-display font-semibold text-lg">Prep 1:1 with {employee.name}</p>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 focus-ring">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-black/45 dark:text-white/40 mb-4">
          Generated from their current data, digital twin trends, and recent pulse responses.
        </p>

        {!isGeminiConfigured && (
          <div className="mb-4 p-3 rounded-lg bg-amber/10 border border-amber/20 text-amber text-xs flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Add VITE_GEMINI_API_KEY to your .env to enable this.</span>
          </div>
        )}

        {history.length > 0 && !output && (
          <div className="mb-4">
            <p className="text-xs font-medium text-black/50 dark:text-white/40 mb-1.5">Previously logged</p>
            <p className="text-xs text-black/40 dark:text-white/30">
              Last 1:1 prep logged {timeAgo(history[0].created_at)}.
            </p>
          </div>
        )}

        {!output && !running && (
          <button
            onClick={handleGenerate}
            disabled={!isGeminiConfigured}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-signal text-white font-medium hover:bg-signal/90 disabled:opacity-50 focus-ring"
          >
            <Sparkles className="h-4 w-4" /> Generate Talking Points
          </button>
        )}

        {running && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-black/45 dark:text-white/40">
            <Loader2 className="h-4 w-4 animate-spin" /> Preparing talking points…
          </div>
        )}

        {error && <div className="mt-3 p-3 rounded-lg bg-rose/10 text-rose text-xs">{error}</div>}

        {output && (
          <>
            <div className="p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] text-sm">
              <Markdown text={output} />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleSave}
                disabled={saved}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-signal text-white text-sm font-medium hover:bg-signal/90 disabled:opacity-60 focus-ring"
              >
                {saved ? <Check className="h-4 w-4" /> : null}
                {saved ? 'Logged' : 'Log this 1:1'}
              </button>
              <button
                onClick={handleGenerate}
                className="px-4 py-2.5 rounded-lg text-sm text-black/60 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5 focus-ring"
              >
                Regenerate
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
