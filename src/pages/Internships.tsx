import { useMemo, useState } from 'react'
import {
  GraduationCap,
  Plus,
  Trash2,
  CheckCircle2,
  Building,
  Award,
  Sparkles,
  ArrowRight,
  UserCheck,
  Search,
  Filter,
  X
} from 'lucide-react'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import StatCard from '../components/StatCard'
import { Badge, LoadingState, ProgressBar } from '../components/Primitives'
import { useInterns, type NewInternInput } from '../hooks/useInterns'
import { useDepartments } from '../hooks/useDepartments'
import type { InternCandidate, InternStatus } from '../lib/types'
import { classNames } from '../lib/utils'

const STATUS_BADGES: Record<InternStatus, string> = {
  Applied: 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300',
  Screening: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  Interviewing: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  Offered: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  Accepted: 'bg-teal/15 text-teal',
  Converted: 'bg-signal/20 text-signal font-bold',
  Rejected: 'bg-rose/15 text-rose'
}

const TRACKS = ['All Tracks', 'AI / ML', 'Full Stack', 'UI/UX', 'Data Science', 'People Ops']

export default function Internships() {
  const { interns, loading, addIntern, updateInternStatus, deleteIntern, convertToEmployee } = useInterns()
  const { departments } = useDepartments()

  const [query, setQuery] = useState('')
  const [selectedTrack, setSelectedTrack] = useState('All Tracks')
  const [statusFilter, setStatusFilter] = useState<'All' | InternStatus>('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [convertingIntern, setConvertingIntern] = useState<InternCandidate | null>(null)
  const [convertDeptId, setConvertDeptId] = useState('')
  const [convertTitle, setConvertTitle] = useState('')

  // New Intern Form State
  const [formData, setFormData] = useState<NewInternInput>({
    name: '',
    email: '',
    university: '',
    degree_major: '',
    grad_year: 2026,
    track: 'AI / ML',
    duration_months: 3,
    status: 'Applied',
    test_score: 85,
    interview_score: 80,
    behavior_score: 85,
    notes: ''
  })

  // Summary Metrics
  const total = interns.length
  const interviewingCount = interns.filter((i) => i.status === 'Interviewing' || i.status === 'Screening').length
  const acceptedCount = interns.filter((i) => i.status === 'Accepted' || i.status === 'Offered').length
  const convertedCount = interns.filter((i) => i.status === 'Converted').length

  const filtered = useMemo(() => {
    return interns.filter((i) => {
      if (statusFilter !== 'All' && i.status !== statusFilter) return false
      if (selectedTrack !== 'All Tracks' && i.track !== selectedTrack) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        const match =
          i.name.toLowerCase().includes(q) ||
          i.university.toLowerCase().includes(q) ||
          i.degree_major.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [interns, statusFilter, selectedTrack, query])

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) return
    await addIntern(formData)
    setShowAddModal(false)
    setFormData({
      name: '',
      email: '',
      university: '',
      degree_major: '',
      grad_year: 2026,
      track: 'AI / ML',
      duration_months: 3,
      status: 'Applied',
      test_score: 85,
      interview_score: 80,
      behavior_score: 85,
      notes: ''
    })
  }

  async function handleConfirmConvert() {
    if (!convertingIntern) return
    const deptId = convertDeptId || (departments[0]?.id ?? 'dept-1')
    const title = convertTitle || `Junior ${convertingIntern.track} Specialist`
    await convertToEmployee(convertingIntern, deptId, title)
    setConvertingIntern(null)
  }

  return (
    <div>
      <Topbar
        title="Internship Candidates"
        subtitle="Manage prospective university interns, evaluate assessment scores, and convert high performers to full-time"
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<GraduationCap className="h-4 w-4 text-signal" />} value={total} label="Total Applicants" accent="signal" />
          <StatCard icon={<Building className="h-4 w-4 text-amber" />} value={interviewingCount} label="In Evaluation" accent="amber" />
          <StatCard icon={<Award className="h-4 w-4 text-teal" />} value={acceptedCount} label="Offers / Accepted" accent="teal" />
          <StatCard icon={<UserCheck className="h-4 w-4 text-signal" />} value={convertedCount} label="Converted to Full-Time" accent="signal" />
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search candidates or university..."
                className="input text-xs"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="input text-xs w-auto"
            >
              {TRACKS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="input text-xs w-auto"
            >
              <option value="All">All Stages</option>
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Offered">Offered</option>
              <option value="Accepted">Accepted</option>
              <option value="Converted">Converted to Full-Time</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-signal text-white text-xs font-semibold hover:bg-signal/90 shadow-sm transition-all focus-ring shrink-0"
          >
            <Plus className="h-4 w-4" /> Add Intern Candidate
          </button>
        </div>

        {loading && <LoadingState label="Loading internship candidates…" />}

        {/* Candidates Grid */}
        {!loading && filtered.length === 0 && (
          <div className="card p-12 text-center">
            <GraduationCap className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">No candidates match filter</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try resetting the stage or track filters.</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((candidate) => {
              const isConverted = candidate.status === 'Converted'
              const avgScore = Math.round(
                (candidate.test_score + (candidate.interview_score || candidate.test_score) + candidate.behavior_score) / 3
              )

              return (
                <div
                  key={candidate.id}
                  className={classNames(
                    'card p-5 space-y-4 hover:border-signal/40 transition-all relative flex flex-col justify-between',
                    isConverted ? 'bg-signal/[0.02] border-signal/30' : ''
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={candidate.name} size={42} />
                        <div className="min-w-0">
                          <p className="font-display font-semibold text-sm text-slate-900 dark:text-white truncate">
                            {candidate.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{candidate.university}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <select
                          value={candidate.status}
                          onChange={(e) => updateInternStatus(candidate.id, e.target.value as InternStatus, candidate.name)}
                          className={classNames(
                            'text-xs font-semibold px-2 py-0.5 rounded-lg border border-slate-200 dark:border-white/10 focus-ring cursor-pointer',
                            STATUS_BADGES[candidate.status]
                          )}
                        >
                          <option value="Applied">Applied</option>
                          <option value="Screening">Screening</option>
                          <option value="Interviewing">Interviewing</option>
                          <option value="Offered">Offered</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Converted">Converted</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                        <button
                          onClick={() => {
                            if (confirm(`Remove intern candidate "${candidate.name}"?`)) deleteIntern(candidate.id, candidate.name)
                          }}
                          className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-rose hover:bg-rose/10 transition-colors"
                          title="Delete candidate"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-signal/15 text-signal font-semibold">
                        {candidate.track}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                        {candidate.duration_months} Mo Duration
                      </span>
                      <span className="text-[11px] text-slate-400">Class of {candidate.grad_year}</span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">{candidate.degree_major}</p>

                    {candidate.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/[0.06] line-clamp-2">
                        {candidate.notes}
                      </p>
                    )}

                    {/* Assessment Scores Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Assessment Average</span>
                        <span className="font-bold text-signal">{avgScore}%</span>
                      </div>
                      <ProgressBar value={avgScore} colorClass={avgScore >= 85 ? 'bg-signal' : 'bg-amber'} />
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span>Test: {candidate.test_score}%</span>
                        <span>Interview: {candidate.interview_score || 'N/A'}</span>
                        <span>Culture: {candidate.behavior_score}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between mt-3">
                    <span className="text-[11px] text-slate-400">{candidate.email}</span>

                    {isConverted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-signal">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Full-Time Employee
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setConvertingIntern(candidate)
                          setConvertTitle(`Junior ${candidate.track} Engineer`)
                          setConvertDeptId(departments[0]?.id || '')
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-signal/15 text-signal text-xs font-semibold hover:bg-signal hover:text-white transition-all shadow-sm focus-ring"
                      >
                        <UserCheck className="h-3.5 w-3.5" /> Convert to Full-Time
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Convert Intern Modal */}
      {convertingIntern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-glass p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-signal/15 text-signal">
                  <UserCheck className="h-4 w-4" />
                </div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white">Convert to Full-Time Employee</h3>
              </div>
              <button
                onClick={() => setConvertingIntern(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              This will transition <strong>{convertingIntern.name}</strong> into the active employee directory and generate an initial AI Digital Twin profile.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full-Time Job Title
                </label>
                <input
                  value={convertTitle}
                  onChange={(e) => setConvertTitle(e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={convertDeptId}
                  onChange={(e) => setConvertDeptId(e.target.value)}
                  className="input text-xs"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
              <button
                onClick={() => setConvertingIntern(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConvert}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-signal text-white text-xs font-semibold hover:bg-signal/90 shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" /> Confirm & Hire
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Intern Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-glass p-6 max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-signal/15 text-signal">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white">Register Intern Candidate</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Candidate Name *
                  </label>
                  <input
                    required
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Candidate Email *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="jane@university.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    University / College *
                  </label>
                  <input
                    required
                    placeholder="e.g. Stanford University"
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Major / Program *
                  </label>
                  <input
                    required
                    placeholder="B.S. Computer Science"
                    value={formData.degree_major}
                    onChange={(e) => setFormData({ ...formData, degree_major: e.target.value })}
                    className="input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Track
                  </label>
                  <select
                    value={formData.track}
                    onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                    className="input text-xs"
                  >
                    <option value="AI / ML">AI / ML</option>
                    <option value="Full Stack">Full Stack</option>
                    <option value="UI/UX">UI/UX</option>
                    <option value="Data Science">Data Science</option>
                    <option value="People Ops">People Ops</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Grad Year
                  </label>
                  <input
                    type="number"
                    value={formData.grad_year}
                    onChange={(e) => setFormData({ ...formData, grad_year: Number(e.target.value) })}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration
                  </label>
                  <select
                    value={formData.duration_months}
                    onChange={(e) => setFormData({ ...formData, duration_months: Number(e.target.value) })}
                    className="input text-xs"
                  >
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Test Score (0-100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.test_score}
                    onChange={(e) => setFormData({ ...formData, test_score: Number(e.target.value) })}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Interview Score
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.interview_score}
                    onChange={(e) => setFormData({ ...formData, interview_score: Number(e.target.value) })}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Culture Fit
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.behavior_score}
                    onChange={(e) => setFormData({ ...formData, behavior_score: Number(e.target.value) })}
                    className="input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Interview Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Key strengths, projects, or feedback from interview panel..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-signal text-white text-xs font-semibold hover:bg-signal/90 shadow-sm"
                >
                  Save Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
