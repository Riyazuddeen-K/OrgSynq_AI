import { useMemo, useState } from 'react'
import {
  Sparkles, Loader2, AlertTriangle, Bot, Award, Layers, Plus, Pencil, Trash2, Mail, MapPin
} from 'lucide-react'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import CandidateModal from '../components/CandidateModal'
import { Badge, LoadingState, EmptyState } from '../components/Primitives'
import { useCandidates } from '../hooks/useCandidates'
import { usePlacementSearches } from '../hooks/usePlacementSearches'
import { matchCandidates, isGeminiConfigured, type PlacementCandidateInput } from '../lib/geminiClient'
import { timeAgo, classNames } from '../lib/utils'
import type { Candidate, CandidateStatus } from '../lib/types'

const EXAMPLE_BRIEFS = [
  'Senior Backend Engineer — needs strong distributed systems experience and at least 5 years shipping production APIs.',
  'Customer Success Manager for our enterprise segment — needs excellent communication and prior SaaS account management.',
  'Junior Product Designer — Figma proficiency required, open to less experience if the portfolio is strong.'
]

const STATUS_COLORS: Record<CandidateStatus, string> = {
  New: 'bg-black/5 dark:bg-white/10',
  Screening: 'bg-signal/15 text-signal',
  Interviewing: 'bg-amber/15 text-amber',
  Offer: 'bg-teal/15 text-teal',
  Hired: 'bg-teal/25 text-teal',
  Rejected: 'bg-rose/15 text-rose'
}

type Tab = 'match' | 'pool'

export default function Placement() {
  const { candidates, loading: candidatesLoading, addCandidate, updateCandidate, deleteCandidate } = useCandidates()
  const { searches, saveSearch } = usePlacementSearches()

  const [tab, setTab] = useState<Tab>('match')
  const [brief, setBrief] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    summary: string
    matches: Array<{ candidate_id: string; match_score: number; reasoning: string; candidate: Candidate }>
  } | null>(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)

  const candidateInputs: PlacementCandidateInput[] = useMemo(
    () =>
      candidates.map((c) => ({
        id: c.id,
        name: c.name,
        applied_role: c.applied_role,
        location: c.location,
        skills: c.skills ?? [],
        experience_years: c.experience_years ?? 0,
        test_score: c.test_score,
        interview_score: c.interview_score,
        behavior_score: c.behavior_score,
        status: c.status
      })),
    [candidates]
  )

  async function handleGenerate() {
    if (!brief.trim() || running) return
    setRunning(true)
    setError(null)
    setResult(null)

    try {
      const matchResult = await matchCandidates(brief, candidateInputs)
      const candidateMap = new Map(candidates.map((c) => [c.id, c]))
      const matches = matchResult.matches
        .map((m) => {
          const candidate = candidateMap.get(m.candidate_id)
          return candidate ? { ...m, candidate } : null
        })
        .filter((m): m is { candidate_id: string; match_score: number; reasoning: string; candidate: Candidate } => Boolean(m))
        .sort((a, b) => b.match_score - a.match_score)

      setResult({ summary: matchResult.summary, matches })

      await saveSearch({
        job_brief: brief.trim(),
        summary: matchResult.summary,
        matches: matches.map((m) => ({ candidate_id: m.candidate_id, match_score: m.match_score, reasoning: m.reasoning }))
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate candidate matches.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <Topbar title="Placement" subtitle="Match external candidates to open roles using skills, experience, and assessment scores" />

      <div className="px-4 md:px-8 pt-4 md:pt-6">
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06]">
          <button
            onClick={() => setTab('match')}
            className={classNames(
              'px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === 'match' ? 'bg-surface-lightcard dark:bg-surface-darkcard shadow-sm' : 'text-black/50 dark:text-white/40'
            )}
          >
            Find Matches
          </button>
          <button
            onClick={() => setTab('pool')}
            className={classNames(
              'px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === 'pool' ? 'bg-surface-lightcard dark:bg-surface-darkcard shadow-sm' : 'text-black/50 dark:text-white/40'
            )}
          >
            Candidate Pool ({candidates.length})
          </button>
        </div>
      </div>

      {tab === 'match' && (
        <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="card p-5 lg:col-span-2 h-fit">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-signal" />
              <p className="font-display font-semibold">Describe the open role</p>
            </div>
            <p className="text-xs text-black/45 dark:text-white/40 mb-4">
              The AI matches candidates from your pool by skills, years of experience, and test/interview/behavior scores.
            </p>

            {!isGeminiConfigured && (
              <div className="mb-4 p-3 rounded-lg bg-amber/10 border border-amber/20 text-amber text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Add VITE_GEMINI_API_KEY to your .env to enable candidate matching. See .env.example.</span>
              </div>
            )}

            {candidates.length === 0 && (
              <div className="mb-4 p-3 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] text-xs text-black/50 dark:text-white/40 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber" />
                <span>
                  No candidates in your pool yet. Add some from the{' '}
                  <button onClick={() => setTab('pool')} className="text-signal hover:underline">
                    Candidate Pool
                  </button>{' '}
                  tab first.
                </span>
              </div>
            )}

            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="e.g. Senior Backend Engineer — needs strong distributed systems experience and at least 5 years shipping production APIs."
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
              disabled={!brief.trim() || running || !isGeminiConfigured || candidatesLoading || candidates.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-signal text-white font-medium hover:bg-signal/90 disabled:opacity-50 focus-ring"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {running ? 'Matching candidates…' : 'Find Matches'}
            </button>

            {error && <div className="mt-3 p-3 rounded-lg bg-rose/10 text-rose text-xs">{error}</div>}

            {searches.length > 0 && (
              <div className="mt-6 pt-5 border-t border-surface-lightborder dark:border-surface-darkborder">
                <p className="text-xs font-medium text-black/50 dark:text-white/40 mb-2">Recent Searches</p>
                <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
                  {searches.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setBrief(s.job_brief)}
                      className="w-full flex items-center justify-between text-xs px-2.5 py-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.07] text-left focus-ring"
                    >
                      <span className="truncate">{s.job_brief}</span>
                      <span className="text-black/40 dark:text-white/30 shrink-0 ml-2">{timeAgo(s.created_at)}</span>
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
                <p className="font-display font-semibold">Describe a role to begin</p>
                <p className="text-sm text-black/45 dark:text-white/40 max-w-sm">
                  The AI reads every candidate's skills, experience, and test/interview/behavior scores, then ranks who
                  fits best — with reasoning for each pick.
                </p>
              </div>
            )}

            {running && (
              <div className="card p-10 min-h-[400px]">
                <LoadingState label="Ranking candidates against the role…" />
              </div>
            )}

            {result && !running && (
              <>
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-4 w-4 text-signal" />
                    <p className="font-display font-semibold">Top Matches ({result.matches.length})</p>
                  </div>
                  <p className="text-sm text-black/60 dark:text-white/50">{result.summary}</p>
                </div>

                {result.matches.length === 0 && (
                  <div className="card p-8 text-center text-sm text-black/45 dark:text-white/40">
                    No strong matches were found in the current candidate pool for this role. Try broadening the
                    description or add more candidates.
                  </div>
                )}

                <div className="space-y-3">
                  {result.matches.map((m) => (
                    <div key={m.candidate_id} className="card p-4 flex items-start gap-4">
                      <Avatar name={m.candidate.name} size={44} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{m.candidate.name}</p>
                            <p className="text-xs text-black/50 dark:text-white/40 truncate">
                              Applied for {m.candidate.applied_role} · {m.candidate.location}
                            </p>
                          </div>
                          <Badge
                            className={classNames(
                              m.match_score >= 80 ? 'bg-teal/15 text-teal' : m.match_score >= 60 ? 'bg-amber/15 text-amber' : 'bg-black/5 dark:bg-white/10'
                            )}
                          >
                            {m.match_score}% match
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge className={STATUS_COLORS[m.candidate.status]}>{m.candidate.status}</Badge>
                          <span className="flex items-center gap-1 text-[11px] text-black/40 dark:text-white/30">
                            <Award className="h-3 w-3" /> {m.candidate.experience_years ?? 0}y exp
                          </span>
                          <span className="text-[11px] text-black/40 dark:text-white/30">
                            Test {m.candidate.test_score} · Interview {m.candidate.interview_score} · Behavior {m.candidate.behavior_score}
                          </span>
                        </div>
                        <p className="text-xs text-black/55 dark:text-white/45 mt-2">{m.reasoning}</p>
                        {(m.candidate.skills ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {m.candidate.skills.slice(0, 5).map((s) => (
                              <Badge key={s} className="bg-black/5 dark:bg-white/10 text-[10px]">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'pool' && (
        <div className="p-4 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-black/45 dark:text-white/40">
              External candidates available to match against open roles.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-signal text-white text-sm font-semibold hover:bg-signal/90 transition-all"
            >
              <Plus className="h-4 w-4" /> Add Candidate
            </button>
          </div>

          {candidatesLoading && <LoadingState label="Loading candidates…" />}

          {!candidatesLoading && candidates.length === 0 && (
            <EmptyState
              title="No candidates yet"
              description="Add external candidates with their skills, experience, and assessment scores to start matching them against open roles."
            />
          )}

          {!candidatesLoading && candidates.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.map((c) => (
                <div key={c.id} className="card p-4 group">
                  <div className="flex items-start justify-between mb-3">
                    <Avatar name={c.name} size={40} />
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingCandidate(c)}
                        className="h-6 w-6 rounded-md items-center justify-center text-black/30 dark:text-white/30 hover:text-signal hover:bg-signal/10 hidden group-hover:flex focus-ring"
                        title="Edit candidate"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${c.name} from the candidate pool?`)) deleteCandidate(c.id, c.name)
                        }}
                        className="h-6 w-6 rounded-md items-center justify-center text-black/30 dark:text-white/30 hover:text-rose hover:bg-rose/10 hidden group-hover:flex focus-ring"
                        title="Remove candidate"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-black/50 dark:text-white/40 mb-2">{c.applied_role}</p>
                  <div className="flex items-center gap-3 text-[11px] text-black/40 dark:text-white/30 mb-3">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {c.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-black/40 dark:text-white/30 mb-3">
                    <MapPin className="h-3 w-3" /> {c.location} · {c.experience_years ?? 0}y exp
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(c.skills ?? []).slice(0, 3).map((s) => (
                      <Badge key={s} className="bg-signal/10 text-signal text-[10px]">
                        {s}
                      </Badge>
                    ))}
                    {(c.skills ?? []).length > 3 && (
                      <span className="text-[10px] text-black/35 dark:text-white/30 self-center">+{(c.skills ?? []).length - 3}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-surface-lightborder dark:border-surface-darkborder text-center">
                    <div>
                      <p className="text-sm font-semibold text-teal">{c.test_score}</p>
                      <p className="text-[10px] text-black/40 dark:text-white/30">Test</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber">{c.interview_score}</p>
                      <p className="text-[10px] text-black/40 dark:text-white/30">Interview</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-signal">{c.behavior_score}</p>
                      <p className="text-[10px] text-black/40 dark:text-white/30">Behavior</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAddModal && <CandidateModal onClose={() => setShowAddModal(false)} onSubmit={addCandidate} />}
      {editingCandidate && (
        <CandidateModal
          candidate={editingCandidate}
          onClose={() => setEditingCandidate(null)}
          onSubmit={(input) => updateCandidate(editingCandidate.id, input)}
        />
      )}
    </div>
  )
}
