import { useMemo, useState } from 'react'
import { Users, Award, Send, MapPin, Briefcase } from 'lucide-react'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import { LoadingState, EmptyState } from '../components/Primitives'
import { useEmployees } from '../hooks/useEmployees'
import { useKudos } from '../hooks/useKudos'
import { useAuth } from '../context/AuthContext'
import { timeAgo } from '../lib/utils'

export default function MyTeam() {
  const { profile } = useAuth()
  const { employees, loading } = useEmployees()
  const { kudos, giveKudos } = useKudos()

  const me = employees.find((e) => e.id === profile?.employee_id)

  // Teammates: same department (excluding myself). Only non-sensitive
  // fields are shown anywhere on this page — no performance, burnout, or
  // attrition-risk data, which stays admin-only.
  const teammates = useMemo(
    () => employees.filter((e) => e.id !== me?.id && e.department_id === me?.department_id),
    [employees, me]
  )

  const [recipientId, setRecipientId] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const teamKudos = useMemo(() => {
    const teamIds = new Set([me?.id, ...teammates.map((t) => t.id)].filter(Boolean))
    return kudos.filter((k) => teamIds.has(k.from_employee_id) || teamIds.has(k.to_employee_id)).slice(0, 10)
  }, [kudos, me, teammates])

  async function handleGiveKudos() {
    if (!me || !recipientId || !message.trim() || submitting) return
    const recipient = teammates.find((t) => t.id === recipientId)
    if (!recipient) return
    setSubmitting(true)
    setError(null)
    const { error: err } = await giveKudos({ id: me.id, name: me.name }, { id: recipient.id, name: recipient.name }, message)
    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    setMessage('')
    setRecipientId('')
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div>
      <Topbar title="My Team" subtitle="Your teammates and a place to recognize their work" />
      <div className="p-4 md:p-8 space-y-5">
        {loading && <LoadingState label="Loading your team…" />}

        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-signal" />
                <p className="font-display font-semibold">Teammates</p>
              </div>

              {teammates.length === 0 && (
                <EmptyState title="No teammates yet" description="No one else is in your department right now." />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teammates.map((t) => (
                  <div key={t.id} className="card p-4 flex items-center gap-3">
                    <Avatar name={t.name} src={t.photo_url} size={40} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{t.name}</p>
                      <p className="text-xs text-black/50 dark:text-white/40 truncate flex items-center gap-1">
                        <Briefcase className="h-3 w-3 shrink-0" /> {t.title}
                      </p>
                      <p className="text-[11px] text-black/40 dark:text-white/30 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" /> {t.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              {/* Give recognition */}
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="h-4 w-4 text-amber" />
                  <p className="font-display font-semibold">Give Recognition</p>
                </div>
                <p className="text-xs text-black/45 dark:text-white/40 mb-4">A quick shoutout for a teammate's work.</p>

                {teammates.length === 0 ? (
                  <p className="text-xs text-black/40 dark:text-white/30">No teammates to recognize yet.</p>
                ) : (
                  <>
                    <select
                      value={recipientId}
                      onChange={(e) => setRecipientId(e.target.value)}
                      className="input mb-2"
                    >
                      <option value="">Choose a teammate…</option>
                      {teammates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {t.title}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="What did they do well?"
                      rows={3}
                      className="input resize-none mb-2"
                    />
                    {error && <p className="text-xs text-rose mb-2">{error}</p>}
                    {sent && <p className="text-xs text-teal mb-2">Sent!</p>}
                    <button
                      onClick={handleGiveKudos}
                      disabled={!recipientId || !message.trim() || submitting}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-signal text-white text-sm font-medium hover:bg-signal/90 disabled:opacity-50 focus-ring"
                    >
                      <Send className="h-3.5 w-3.5" /> {submitting ? 'Sending…' : 'Send Recognition'}
                    </button>
                  </>
                )}
              </div>

              {/* Recent recognition feed */}
              <div className="card p-5">
                <p className="font-display font-semibold mb-3">Recent Recognition</p>
                {teamKudos.length === 0 && <p className="text-xs text-black/40 dark:text-white/30">Nothing yet — be the first!</p>}
                <div className="space-y-3">
                  {teamKudos.map((k) => (
                    <div key={k.id} className="text-sm">
                      <p>
                        <span className="font-medium">{k.from_name}</span>{' '}
                        <span className="text-black/40 dark:text-white/30">→</span>{' '}
                        <span className="font-medium">{k.to_name}</span>
                      </p>
                      <p className="text-xs text-black/55 dark:text-white/45 mt-0.5">"{k.message}"</p>
                      <p className="text-[10px] text-black/35 dark:text-white/30 mt-0.5">{timeAgo(k.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
