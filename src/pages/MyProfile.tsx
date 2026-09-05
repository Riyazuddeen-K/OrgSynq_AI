import { useMemo, useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  User, Mail, MapPin, Briefcase, HeartPulse, Flame, TrendingUp, LogOut, CheckCircle2,
  Compass, Loader2, AlertTriangle, MessageCircle, Users as UsersIcon, FolderKanban, Trophy,
  Camera, Upload, Image as ImageIcon, X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useEmployee, useEmployees } from '../hooks/useEmployees'
import { useDigitalTwinByEmployee } from '../hooks/useDigitalTwins'
import { useOneOnOnesForEmployee } from '../hooks/useOneOnOnes'
import { ProgressBar, Badge, LoadingState } from '../components/Primitives'
import Avatar from '../components/Avatar'
import PulseSurveyWidget from '../components/PulseSurveyWidget'
import Markdown from '../components/Markdown'
import { riskColorClasses, riskLabel, timeAgo, classNames } from '../lib/utils'
import { suggestCareerPaths, isGeminiConfigured, type CareerPathResult } from '../lib/geminiClient'
import Topbar from '../components/Topbar'
import type { DigitalTwin } from '../lib/types'

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'
]

export default function MyProfile() {
  const { profile, signOut, updateProfilePhoto, linkEmployeeId } = useAuth()
  const employeeId = profile?.employee_id
  const { employee, loading } = useEmployee(employeeId)
  const { twin, loading: twinLoading } = useDigitalTwinByEmployee(employeeId)
  const { employees: allEmployees } = useEmployees()
  const { entries: oneOnOnes, loading: oneOnOnesLoading } = useOneOnOnesForEmployee(employeeId)
  const [signingOut, setSigningOut] = useState(false)

  // Linking employee record state
  const [selectedEmpToLink, setSelectedEmpToLink] = useState<string>('')
  const [linkingRecord, setLinkingRecord] = useState(false)
  const [linkSuccess, setLinkSuccess] = useState(false)

  // Profile photo state
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [photoInputUrl, setPhotoInputUrl] = useState('')
  const [photoSaving, setPhotoSaving] = useState(false)
  const [photoSavedToast, setPhotoSavedToast] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [careerPaths, setCareerPaths] = useState<CareerPathResult | null>(null)
  const [careerLoading, setCareerLoading] = useState(false)
  const [careerError, setCareerError] = useState<string | null>(null)

  const employeeMap = useMemo(() => new Map(allEmployees.map((e) => [e.id, e])), [allEmployees])

  // Set default employee selection when list loads
  useEffect(() => {
    if (!selectedEmpToLink && allEmployees.length > 0) {
      // Look for match by email or name, otherwise default to first
      const matched = allEmployees.find(
        (e) => e.email.toLowerCase() === (profile?.email || '').toLowerCase()
      )
      setSelectedEmpToLink(matched ? matched.id : allEmployees[0].id)
    }
  }, [allEmployees, profile?.email, selectedEmpToLink])

  async function handleLinkEmployee() {
    if (!selectedEmpToLink) return
    setLinkingRecord(true)
    const res = await linkEmployeeId(selectedEmpToLink)
    setLinkingRecord(false)
    if (!res.error) {
      setLinkSuccess(true)
    }
  }

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
        <Topbar title="My Profile" subtitle="Employee self-service portal & profile manager" />
        <div className="p-4 md:p-8 max-w-xl mx-auto space-y-5">
          <div className="card p-6 md:p-8 text-center space-y-4 border border-slate-200/80 dark:border-white/[0.08] shadow-card">
            <div className="relative mx-auto w-fit group cursor-pointer" onClick={() => setShowPhotoModal(true)}>
              <Avatar
                name={profile?.displayName || 'User'}
                src={profile?.photo_url || localStorage.getItem('orgsynq_custom_profile_photo') || undefined}
                size={88}
              />
              <div className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6" />
                <span className="text-[10px] font-bold mt-0.5">Edit Photo</span>
              </div>
            </div>

            <div>
              <p className="font-display font-bold text-lg text-slate-900 dark:text-white">
                {profile?.displayName || 'User Account'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{profile?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-signal/15 text-signal uppercase tracking-wider">
                {profile?.role || 'Employee'}
              </span>
            </div>

            <button
              onClick={() => setShowPhotoModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors focus-ring"
            >
              <Camera className="h-3.5 w-3.5 text-signal" /> Change Profile Photo
            </button>

            <div className="pt-5 border-t border-slate-200/60 dark:border-white/[0.08] text-left space-y-3">
              <div>
                <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                  Link Your Employee Record
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Connect your login to your workforce record to unlock your Digital Twin, performance metrics, and 1:1 check-in history.
                </p>
              </div>

              {allEmployees.length > 0 ? (
                <div className="space-y-3">
                  <select
                    value={selectedEmpToLink}
                    onChange={(e) => setSelectedEmpToLink(e.target.value)}
                    className="input text-xs"
                  >
                    {allEmployees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} — {e.title} ({e.department?.name || 'General'})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleLinkEmployee}
                    disabled={linkingRecord || !selectedEmpToLink}
                    className="w-full py-2.5 rounded-xl bg-signal text-white text-xs font-semibold hover:bg-signal/90 shadow-sm transition-all focus-ring disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {linkingRecord && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{linkingRecord ? 'Connecting Profile...' : 'Connect to Selected Profile'}</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Loading available workforce records...</p>
              )}

              {linkSuccess && (
                <div className="p-3 rounded-xl bg-teal/15 text-teal text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Profile connected successfully! Refreshing view...</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSignOut}
              className="mt-2 text-xs text-slate-400 hover:text-rose transition-colors"
            >
              Sign out of this session
            </button>
          </div>
        </div>

        {/* Render Profile Photo Modal even in unlinked state */}
        {showPhotoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="card-glass p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-signal/15 text-signal">
                    <Camera className="h-4 w-4" />
                  </div>
                  <h3 className="font-display font-bold text-slate-900 dark:text-white">Update Profile Photo</h3>
                </div>
                <button
                  onClick={() => setShowPhotoModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Current Preview */}
              <div className="flex flex-col items-center justify-center py-2 space-y-2">
                <Avatar
                  name={profile?.displayName || 'User'}
                  src={photoInputUrl || profile?.photo_url || localStorage.getItem('orgsynq_custom_profile_photo') || undefined}
                  size={84}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">Preview</p>
              </div>

              {/* Option 1: File Upload */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5 text-signal" /> Upload from Computer
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = () => {
                      if (typeof reader.result === 'string') {
                        setPhotoInputUrl(reader.result)
                      }
                    }
                    reader.readAsDataURL(file)
                  }}
                  className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-signal/15 file:text-signal hover:file:bg-signal/25 file:cursor-pointer cursor-pointer"
                />
              </div>

              {/* Option 2: Image URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Or Paste Image URL
                </label>
                <input
                  placeholder="https://images.unsplash.com/..."
                  value={photoInputUrl}
                  onChange={(e) => setPhotoInputUrl(e.target.value)}
                  className="input text-xs"
                />
              </div>

              {/* Option 3: Studio Presets */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Or Pick a Studio Avatar
                </p>
                <div className="flex items-center gap-3">
                  {PRESET_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPhotoInputUrl(url)}
                      className={classNames(
                        'rounded-full ring-2 transition-all p-0.5',
                        photoInputUrl === url ? 'ring-signal scale-105' : 'ring-transparent hover:ring-slate-300'
                      )}
                    >
                      <img src={url} alt="Preset" className="h-10 w-10 rounded-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/[0.08]">
                {profile?.photo_url ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setPhotoSaving(true)
                      await updateProfilePhoto('')
                      setPhotoInputUrl('')
                      setPhotoSaving(false)
                      setShowPhotoModal(false)
                    }}
                    className="text-xs font-semibold text-rose hover:underline"
                  >
                    Remove Photo
                  </button>
                ) : <span />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={photoSaving || !photoInputUrl}
                    onClick={async () => {
                      if (!photoInputUrl) return
                      setPhotoSaving(true)
                      await updateProfilePhoto(photoInputUrl)
                      setPhotoSaving(false)
                      setShowPhotoModal(false)
                    }}
                    className="px-5 py-2 rounded-xl bg-signal text-white text-xs font-semibold hover:bg-signal/90 shadow-sm disabled:opacity-50"
                  >
                    {photoSaving ? 'Saving...' : 'Save Photo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
                  <div
                    onClick={() => setShowPhotoModal(true)}
                    className="relative group cursor-pointer"
                    title="Click to change profile photo"
                  >
                    <Avatar name={employee.name} src={profile?.photo_url || employee.photo_url} size={84} />
                    <div className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-6 w-6" />
                      <span className="text-[10px] font-bold mt-0.5">Edit</span>
                    </div>
                  </div>
                  <p className="font-display font-semibold text-lg mt-3 text-slate-900 dark:text-white">{employee.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{employee.title}</p>
                  <div className="flex gap-2 mt-3 flex-wrap justify-center">
                    <Badge className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">{employee.department?.name}</Badge>
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

      {/* Profile Photo Editor Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-glass p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-signal/15 text-signal">
                  <Camera className="h-4 w-4" />
                </div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white">Update Profile Photo</h3>
              </div>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Current Preview */}
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <Avatar
                name={employee?.name || 'User'}
                src={photoInputUrl || profile?.photo_url || employee?.photo_url}
                size={84}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Preview</p>
            </div>

            {/* Option 1: File Upload */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] space-y-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-signal" /> Upload from Computer
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      setPhotoInputUrl(reader.result)
                    }
                  }
                  reader.readAsDataURL(file)
                }}
                className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-signal/15 file:text-signal hover:file:bg-signal/25 file:cursor-pointer cursor-pointer"
              />
            </div>

            {/* Option 2: Image URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Or Paste Image URL
              </label>
              <input
                placeholder="https://images.unsplash.com/..."
                value={photoInputUrl}
                onChange={(e) => setPhotoInputUrl(e.target.value)}
                className="input text-xs"
              />
            </div>

            {/* Option 3: Curated Avatar Presets */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Or Pick a Studio Avatar
              </p>
              <div className="flex items-center gap-3">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPhotoInputUrl(url)}
                    className={classNames(
                      'rounded-full ring-2 transition-all p-0.5',
                      photoInputUrl === url ? 'ring-signal scale-105' : 'ring-transparent hover:ring-slate-300'
                    )}
                  >
                    <img src={url} alt="Preset" className="h-10 w-10 rounded-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/[0.08]">
              {(profile?.photo_url || employee?.photo_url) ? (
                <button
                  type="button"
                  onClick={async () => {
                    setPhotoSaving(true)
                    await updateProfilePhoto('')
                    setPhotoInputUrl('')
                    setPhotoSaving(false)
                    setShowPhotoModal(false)
                  }}
                  className="text-xs font-semibold text-rose hover:underline"
                >
                  Remove Photo
                </button>
              ) : <span />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={photoSaving || !photoInputUrl}
                  onClick={async () => {
                    if (!photoInputUrl) return
                    setPhotoSaving(true)
                    await updateProfilePhoto(photoInputUrl)
                    setPhotoSaving(false)
                    setShowPhotoModal(false)
                  }}
                  className="px-5 py-2 rounded-xl bg-signal text-white text-xs font-semibold hover:bg-signal/90 shadow-sm disabled:opacity-50"
                >
                  {photoSaving ? 'Saving...' : 'Save Photo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
