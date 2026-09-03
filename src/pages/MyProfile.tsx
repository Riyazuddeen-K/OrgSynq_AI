import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  User, Mail, MapPin, Briefcase, HeartPulse, Flame, TrendingUp, LogOut, CheckCircle2,
  Compass, Loader2, AlertTriangle, MessageCircle, Users as UsersIcon, FolderKanban, Trophy
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useEmployee, useEmployees } from '../hooks/useEmployees'
import { useDigitalTwinByEmployee } from '../hooks/useDigitalTwins'
import { useOneOnOnesForEmployee } from '../hooks/useOneOnOnes'
import { ProgressBar, Badge, LoadingState } from '../components/Primitives'
import Avatar from '../components/Avatar'
import PulseSurveyWidget from '../components/PulseSurveyWidget'
import Markdown from '../components/Markdown'
import { riskColorClasses, riskLabel, timeAgo } from '../lib/utils'
import { suggestCareerPaths, isGeminiConfigured, type CareerPathResult } from '../lib/geminiClient'
import Topbar from '../components/Topbar'
import type { DigitalTwin } from '../lib/types'

export default function MyProfile() {
  const { profile, signOut } = useAuth()
  const employeeId = profile?.employee_id
  const { employee, loading } = useEmployee(employeeId)
  const { twin, loading: twinLoading } = useDigitalTwinByEmployee(employeeId)
  const { employees: allEmployees } = useEmployees()
  const { entries: oneOnOnes, loading: oneOnOnesLoading } = useOneOnOnesForEmployee(employeeId)
  const [signingOut, setSigningOut] = useState(false)

  const [careerPaths, setCareerPaths] = useState<CareerPathResult | null>(null)
  const [careerLoading, setCareerLoading] = useState(false)
  const [careerError, setCareerError] = useState<string | null>(null)

  const employeeMap = useMemo(() => new Map(allEmployees.map((e) => [e.id, e])), [allEmployees])

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
  }

  async function handleSuggestCareerPaths() {
    if (!employee || careerLoading) return
    setCareerLoading(true)
    setCareerError(null)
    try {
      const result = await suggestCareerPaths(
        {
          name: employee.name,
          title: employee.title,
          department: employee.department?.name,
          skills: employee.skills ?? [],
          experience_years: employee.experience_years ?? 0,
          performance: employee.performance
        },
        allEmployees.map((e) => ({
          title: e.title,
          department: e.department?.name,
          skills: e.skills ?? [],
          experience_years: e.experience_years ?? 0
        }))
      )
      setCareerPaths(result)
    } catch (err) {
      setCareerError(err instanceof Error ? err.message : 'Failed to generate career suggestions.')
    } finally {
      setCareerLoading(false)
    }
  }

  if (!profile?.employee_id) {
    return (
      <div>
        <Topbar title="My Profile" subtitle="Employee self-service portal" />
        <div className="p-8 max-w-xl mx-auto">
          <div className="card p-10 text-center">
            <User className="h-12 w-12 text-black/20 dark:text-white/20 mx-auto mb-3" />
            <p className="font-display font-semibold mb-2">No Employee Profile Linked</p>
            <p className="text-sm text-black/50 dark:text-white/40">
              Your account hasn't been linked to an employee record yet. Ask your admin to set your{' '}
              <code className="bg-black/5 dark:bg-white/10 px-1 rounded">employee_id</code> in Firestore.
            </p>
            <button
              onClick={handleSignOut}
              className="mt-6 px-4 py-2 rounded-lg bg-black/5 dark:bg-white/5 text-sm hover:bg-black/10 dark:hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Topbar title="My Profile" subtitle="Your digital twin & wellness dashboard" />
      <div className="p-4 md:p-8 space-y-5">
        {loading && <LoadingState />}

        {/* Bug fix: profile.employee_id is set, but the linked employee
            document doesn't exist (deleted, or a bad link) — show a clear
            message instead of silently rendering nothing. */}
        {!loading && !employee && (
          <div className="max-w-xl mx-auto">
            <div className="card p-10 text-center">
              <AlertTriangle className="h-12 w-12 text-amber mx-auto mb-3" />
              <p className="font-display font-semibold mb-2">Employee Record Not Found</p>
              <p className="text-sm text-black/50 dark:text-white/40">
                Your account is linked to an employee record that no longer exists. Ask your admin to relink your
                account, or add you back to the Employees list.
              </p>
              <button
                onClick={handleSignOut}
                className="mt-6 px-4 py-2 rounded-lg bg-black/5 dark:bg-white/5 text-sm hover:bg-black/10 dark:hover:bg-white/10"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {!loading && employee && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Profile card */}
              <div className="card p-6 h-fit">
                <div className="flex flex-col items-center text-center">
                  <Avatar name={employee.name} size={72} />
                  <p className="font-display font-semibold text-lg mt-3">{employee.name}</p>
                  <p className="text-sm text-black/50 dark:text-white/40">{employee.title}</p>
                  <div className="flex gap-2 mt-3 flex-wrap justify-center">
                    <Badge className="bg-black/5 dark:bg-white/10">{employee.department?.name}</Badge>
                    <Badge className={riskColorClasses(employee.attrition_risk)}>{riskLabel(employee.attrition_risk)}</Badge>
                  </div>
                </div>
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-black/60 dark:text-white/50">
                    <Mail className="h-4 w-4 shrink-0" /> {employee.email}
                  </div>
                  <div className="flex items-center gap-2 text-black/60 dark:text-white/50">
                    <MapPin className="h-4 w-4 shrink-0" /> {employee.location}
                  </div>
                  <div className="flex items-center gap-2 text-black/60 dark:text-white/50">
                    <Briefcase className="h-4 w-4 shrink-0" /> {employee.status}
                  </div>
                </div>
                <div className="mt-6 pt-5 border-t border-surface-lightborder dark:border-surface-darkborder grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="font-display font-semibold text-teal flex items-center justify-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />{employee.performance}
                    </p>
                    <p className="text-[11px] text-black/40 dark:text-white/30">Perf</p>
                  </div>
                  <div>
                    <p className="font-display font-semibold text-amber flex items-center justify-center gap-1">
                      <Flame className="h-3.5 w-3.5" />{employee.burnout}
                    </p>
                    <p className="text-[11px] text-black/40 dark:text-white/30">Burnout</p>
                  </div>
                  <div>
                    <p className="font-display font-semibold text-signal flex items-center justify-center gap-1">
                      <HeartPulse className="h-3.5 w-3.5" />{employee.attrition_risk}%
                    </p>
                    <p className="text-[11px] text-black/40 dark:text-white/30">Risk</p>
                  </div>
                </div>
                <Link
                  to="/my-team"
                  className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm border border-surface-lightborder dark:border-surface-darkborder hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <UsersIcon className="h-4 w-4" /> View My Team
                </Link>
                <Link
                  to="/my-projects"
                  className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm border border-surface-lightborder dark:border-surface-darkborder hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <FolderKanban className="h-4 w-4" /> View My Projects
                </Link>
                <Link
                  to="/recognition"
                  className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm border border-surface-lightborder dark:border-surface-darkborder hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Trophy className="h-4 w-4" /> View Recognition
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm border border-surface-lightborder dark:border-surface-darkborder hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>

              {/* Digital twin + pulse survey */}
              <div className="lg:col-span-2 space-y-5">
                {/* Pulse survey */}
                <PulseSurveyWidget employeeId={employeeId} />

                {/* Digital twin scores */}
                <div className="card p-6">
                  <p className="font-display font-semibold mb-1">Your Digital Twin</p>
                  <p className="text-xs text-black/45 dark:text-white/40 mb-5">
                    AI-derived scores from performance, engagement, and sentiment signals
                  </p>
                  {twinLoading && <LoadingState label="Loading twin…" />}
                  {!twinLoading && !twin && (
                    <p className="text-sm text-black/45 dark:text-white/40 py-6 text-center">
                      Your digital twin hasn't been generated yet.
                    </p>
                  )}
                  {!twinLoading && twin && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      {[
                        { key: 'performance', label: 'Performance', color: 'bg-teal' },
                        { key: 'skills', label: 'Skills', color: 'bg-signal' },
                        { key: 'leadership', label: 'Leadership', color: 'bg-amber' },
                        { key: 'learning', label: 'Learning', color: 'bg-signal' },
                        { key: 'collaboration', label: 'Collaboration', color: 'bg-amber' },
                        { key: 'promotion_ready', label: 'Promotion Ready', color: 'bg-teal' }
                      ].map((f) => (
                        <div key={f.key}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                              {Number(twin[f.key as keyof DigitalTwin]) >= 70 && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-teal" />
                              )}
                              {f.label}
                            </div>
                            <span className="text-sm font-semibold">{Number(twin[f.key as keyof DigitalTwin])}</span>
                          </div>
                          <ProgressBar value={Number(twin[f.key as keyof DigitalTwin])} colorClass={f.color} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Career path suggestions */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Compass className="h-4 w-4 text-signal" />
                      <p className="font-display font-semibold">Your Career Path</p>
                    </div>
                    <button
                      onClick={handleSuggestCareerPaths}
                      disabled={careerLoading || !isGeminiConfigured}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-signal text-white text-xs font-semibold hover:bg-signal/90 disabled:opacity-50 transition-all"
                    >
                      {careerLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {careerLoading ? 'Thinking…' : careerPaths ? 'Regenerate' : 'Suggest my path'}
                    </button>
                  </div>
                  <p className="text-xs text-black/45 dark:text-white/40 mb-4">
                    AI-suggested next roles based on your skills, experience, and roles that exist in this org today.
                  </p>

                  {!isGeminiConfigured && (
                    <p className="text-xs text-amber">Ask your admin to configure the AI assistant to enable this.</p>
                  )}
                  {careerError && <p className="text-xs text-rose">{careerError}</p>}

                  {!careerPaths && !careerLoading && isGeminiConfigured && !careerError && (
                    <p className="text-sm text-black/40 dark:text-white/30 py-4 text-center">
                      Click "Suggest my path" to see plausible next roles.
                    </p>
                  )}

                  {careerPaths && (
                    <div className="space-y-4">
                      {careerPaths.paths.map((p) => (
                        <div key={p.role_title} className="p-4 rounded-lg bg-black/[0.03] dark:bg-white/[0.04]">
                          <p className="text-sm font-semibold">{p.role_title}</p>
                          <p className="text-xs text-black/55 dark:text-white/45 mt-1">{p.why_it_fits}</p>
                          {p.skill_gaps.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {p.skill_gaps.map((g) => (
                                <Badge key={g} className="bg-amber/15 text-amber text-[10px]">
                                  Grow: {g}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 1:1 history */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageCircle className="h-4 w-4 text-signal" />
                    <p className="font-display font-semibold">Your 1:1 History</p>
                  </div>
                  <p className="text-xs text-black/45 dark:text-white/40 mb-4">
                    Discussion points and recommendations from your recent check-ins.
                  </p>

                  {oneOnOnesLoading && <LoadingState label="Loading history…" />}
                  {!oneOnOnesLoading && oneOnOnes.length === 0 && (
                    <p className="text-sm text-black/40 dark:text-white/30 py-4 text-center">No 1:1s logged yet.</p>
                  )}
                  <div className="space-y-4">
                    {oneOnOnes.map((o) => {
                      const manager = o.manager_id ? employeeMap.get(o.manager_id) : undefined
                      return (
                        <div key={o.id} className="p-4 rounded-lg bg-black/[0.03] dark:bg-white/[0.04]">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-xs font-medium text-black/55 dark:text-white/45">
                              With {manager?.name ?? 'your manager'}
                            </p>
                            <p className="text-[11px] text-black/35 dark:text-white/30">{timeAgo(o.created_at)}</p>
                          </div>
                          <Markdown text={o.talking_points} className="text-xs text-black/60 dark:text-white/50" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
