import { useMemo, useState } from 'react'
import { Trophy, Plus, Trash2, Award as AwardIcon } from 'lucide-react'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import AwardModal from '../components/AwardModal'
import { Badge, LoadingState, EmptyState } from '../components/Primitives'
import { useAwards } from '../hooks/useAwards'
import { useEmployees } from '../hooks/useEmployees'
import { useAuth } from '../context/AuthContext'
import { timeAgo } from '../lib/utils'

export default function Recognition() {
  const { role, profile } = useAuth()
  const isAdmin = role !== 'employee'
  const { awards, loading, giveAward, revokeAward } = useAwards()
  const { employees } = useEmployees()
  const [showAwardModal, setShowAwardModal] = useState(false)

  const visibleAwards = useMemo(
    () => (isAdmin ? awards : awards.filter((a) => a.employee_id === profile?.employee_id)),
    [awards, isAdmin, profile?.employee_id]
  )

  async function handleGiveAward(employee: { id: string; name: string }, awardType: string, message?: string) {
    return giveAward(employee, awardType, message, profile?.displayName || 'An admin')
  }

  return (
    <div>
      <Topbar
        title="Recognition"
        subtitle={isAdmin ? 'Give employees awards for great work' : 'Awards you\u2019ve earned'}
      />
      <div className="p-4 md:p-8">
        {isAdmin && (
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={() => setShowAwardModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-signal text-white text-sm font-semibold hover:bg-signal/90 transition-all"
            >
              <Plus className="h-4 w-4" /> Give Award
            </button>
          </div>
        )}

        {loading && <LoadingState label="Loading recognition…" />}

        {!loading && visibleAwards.length === 0 && (
          <EmptyState
            title={isAdmin ? 'No awards given yet' : 'No awards yet'}
            description={
              isAdmin
                ? 'Give an employee an award for great work — they get notified instantly.'
                : "When your manager recognizes your work, it'll show up here."
            }
          />
        )}

        {!loading && visibleAwards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleAwards.map((a) => (
              <div key={a.id} className="card p-5 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-amber/10" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-amber/15 flex items-center justify-center shrink-0">
                      <Trophy className="h-5 w-5 text-amber" />
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove this award from ${a.employee_name}?`)) revokeAward(a.id)
                        }}
                        className="h-6 w-6 rounded-md flex items-center justify-center text-black/30 dark:text-white/30 hover:text-rose hover:bg-rose/10 focus-ring"
                        title="Revoke award"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <Badge className="bg-amber/15 text-amber mb-2">{a.award_type}</Badge>
                  {isAdmin && (
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={a.employee_name} size={22} />
                      <p className="text-sm font-semibold">{a.employee_name}</p>
                    </div>
                  )}
                  {a.message && <p className="text-sm text-black/60 dark:text-white/50 mb-2">"{a.message}"</p>}
                  <p className="text-xs text-black/40 dark:text-white/30 flex items-center gap-1">
                    <AwardIcon className="h-3 w-3" /> From {a.given_by} · {timeAgo(a.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAwardModal && <AwardModal employees={employees} onClose={() => setShowAwardModal(false)} onSubmit={handleGiveAward} />}
    </div>
  )
}
