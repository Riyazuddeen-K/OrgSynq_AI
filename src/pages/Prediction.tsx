import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Loader2, AlertTriangle, Bot, ChevronRight, Award, Layers } from 'lucide-react'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import { Badge, LoadingState } from '../components/Primitives'
import Markdown from '../components/Markdown'
import { useEmployees } from '../hooks/useEmployees'
import { useTeamFormations } from '../hooks/useTeamFormations'
import { recommendTeam, isGeminiConfigured, type TeamCandidate, type TeamRecommendationMember } from '../lib/geminiClient'
import { determinationScore, timeAgo, classNames } from '../lib/utils'
import type { Employee } from '../lib/types'

const EXAMPLE_BRIEFS = [
  'We are launching a new mobile app and need a team with strong engineering and design skills, minimum 3 years experience.',
  'New data-privacy policy requires a compliance review team with legal, security, and engineering representation.',
  'Standing up a customer success pod for our enterprise segment — needs strong communication and account management skills.'
]

export default function Prediction() {
  const { employees, loading: employeesLoading } = useEmployees()
  const { formations, saveFormation } = useTeamFormations()

  const [brief, setBrief] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    summary: string
    members: Array<TeamRecommendationMember & { employee: Employee }>
    skill_gaps: string[]
  } | null>(null)

  const candidates: TeamCandidate[] = useMemo(
    () =>
      employees.map((e) => ({
        id: e.id,
        name: e.name,
        title: e.title,
        department: e.department?.name,
        skills: e.skills ?? [],
        experience_years: e.experience_years ?? 0,
        performance: e.performance,
        burnout: e.burnout,
        attrition_risk: e.attrition_risk,
        determination: determinationScore(e)
      })),
    [employees]
  )

  const employeesWithoutSkills = employees.filter((e) => (e.skills ?? []).length === 0).length

  async function handleGenerate() {
    if (!brief.trim() || running) return
    setRunning(true)
    setError(null)
    setResult(null)

    try {
      const recommendation = await recommendTeam(brief, candidates)
      const employeeMap = new Map(employees.map((e) => [e.id, e]))
      const members = recommendation.members
        .map((m) => {
          const employee = employeeMap.get(m.employee_id)
          return employee ? { ...m, employee } : null
        })
        .filter((m): m is TeamRecommendationMember & { employee: Employee } => Boolean(m))
        .sort((a, b) => b.match_score - a.match_score)

      setResult({ summary: recommendation.summary, members, skill_gaps: recommendation.skill_gaps })

      await saveFormation({
        brief: brief.trim(),
        summary: recommendation.summary,
        members: members.map((m) => ({
          employee_id: m.employee_id,
          role_in_team: m.role_in_team,
          match_score: m.match_score,
          reasoning: m.reasoning
        })),
        skill_gaps: recommendation.skill_gaps
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate a team recommendation.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <Topbar title="Prediction" subtitle="AI team formation — allocate the right people to a project or policy" />
      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="card p-5 lg:col-span-2 h-fit">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-signal" />
            <p className="font-display font-semibold">Describe the project or policy</p>
          </div>
          <p className="text-xs text-black/45 dark:text-white/40 mb-4">
            The AI matches employees by skills, years of experience, and a determination score derived from
            performance, burnout, and attrition risk.
          </p>

          {!isGeminiConfigured && (
            <div className="mb-4 p-3 rounded-lg bg-amber/10 border border-amber/20 text-amber text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Add VITE_GEMINI_API_KEY to your .env to enable team allocation. See .env.example.</span>
            </div>
          )}

          {employeesWithoutSkills > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] text-xs text-black/50 dark:text-white/40 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber" />
              <span>
                {employeesWithoutSkills} employee{employeesWithoutSkills === 1 ? '' : 's'} have no skills listed yet, so they
                won't be matched well. Add skills from the{' '}
                <Link to="/employees" className="text-signal hover:underline">
                  Employees
                </Link>{' '}
                page (edit icon on any card).
              </span>
            </div>
          )}

          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. We're launching a new mobile app and need a team with strong engineering and design skills, minimum 3 years experience."
            rows={6}
            className="w-full px-3 py-2.5 rounded-lg text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-transparent focus:border-signal/50 focus-ring resize-none"
          />

          <div className="flex flex-wrap gap-1.5 mt-2 mb-4">
            {EXAMPLE_BRIEFS.map((ex) => (
              <button
                key={ex}
                onClick={() => setBrief(ex)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-black/50 dark:text-white/40 focus-ring"
              >
                {ex.slice(0, 36)}…
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={!brief.trim() || running || !isGeminiConfigured || employeesLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-signal text-white font-medium hover:bg-signal/90 disabled:opacity-50 focus-ring"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {running ? 'Allocating team…' : 'Generate Team'}
          </button>

          {error && <div className="mt-3 p-3 rounded-lg bg-rose/10 text-rose text-xs">{error}</div>}

          {formations.length > 0 && (
            <div className="mt-6 pt-5 border-t border-surface-lightborder dark:border-surface-darkborder">
              <p className="text-xs font-medium text-black/50 dark:text-white/40 mb-2">Recent Predictions</p>
              <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
                {formations.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setBrief(f.brief)}
                    className="w-full flex items-center justify-between text-xs px-2.5 py-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.07] text-left focus-ring"
                  >
                    <span className="truncate">{f.brief}</span>
                    <span className="text-black/40 dark:text-white/30 shrink-0 ml-2">{timeAgo(f.created_at)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-5">
          {!result && !running && (
            <div className="card p-10 flex flex-col items-center justify-center text-center gap-2 min-h-[400px]">
              <Bot className="h-10 w-10 text-signal mb-1" />
              <p className="font-display font-semibold">Describe a project or policy to begin</p>
              <p className="text-sm text-black/45 dark:text-white/40 max-w-sm">
                The AI reads every employee's skills, experience, and determination score, then recommends who to
                allocate — with reasoning for each pick.
              </p>
            </div>
          )}

          {running && (
            <div className="card p-10 min-h-[400px]">
              <LoadingState label="Matching employees to the brief…" />
            </div>
          )}

          {result && !running && (
            <>
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-signal" />
                  <p className="font-display font-semibold">Recommended Team ({result.members.length})</p>
                </div>
                <Markdown text={result.summary} className="text-sm text-black/60 dark:text-white/50" />

                {result.skill_gaps.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.skill_gaps.map((gap) => (
                      <Badge key={gap} className="bg-amber/15 text-amber">
                        <AlertTriangle className="h-3 w-3" /> Gap: {gap}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {result.members.length === 0 && (
                <div className="card p-8 text-center text-sm text-black/45 dark:text-white/40">
                  No strong matches were found in the current workforce for this brief. Try broadening the description
                  or add skills to more employees.
                </div>
              )}

              <div className="space-y-3">
                {result.members.map((m) => (
                  <Link
                    key={m.employee_id}
                    to={`/employees/${m.employee_id}`}
                    className="card p-4 flex items-start gap-4 hover:border-signal/40 transition-colors group"
                  >
                    <Avatar name={m.employee.name} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{m.employee.name}</p>
                          <p className="text-xs text-black/50 dark:text-white/40 truncate">
                            {m.employee.title} · {m.employee.department?.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={classNames(m.match_score >= 80 ? 'bg-teal/15 text-teal' : m.match_score >= 60 ? 'bg-amber/15 text-amber' : 'bg-black/5 dark:bg-white/10')}>
                            {m.match_score}% match
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-black/25 dark:text-white/25 group-hover:text-signal transition-colors" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-signal/15 text-signal">{m.role_in_team}</Badge>
                        <span className="flex items-center gap-1 text-[11px] text-black/40 dark:text-white/30">
                          <Award className="h-3 w-3" /> {m.employee.experience_years ?? 0}y exp
                        </span>
                      </div>
                      <Markdown text={m.reasoning} className="text-xs text-black/55 dark:text-white/45 mt-2" />
                      {(m.employee.skills ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {m.employee.skills.slice(0, 5).map((s) => (
                            <Badge key={s} className="bg-black/5 dark:bg-white/10 text-[10px]">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
