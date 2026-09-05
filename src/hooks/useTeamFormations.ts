import { useCallback, useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, query, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { TeamFormation } from '../lib/types'
import { logActivity } from './useActivityFeed'
import { pushNotification } from '../lib/notify'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

export function useTeamFormations() {
  const [formations, setFormations] = useState<TeamFormation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setFormations([])
      setLoading(false)
      return
    }

    const unsub = onSnapshot(
      query(collection(db, 'team_formations'), orderBy('created_at', 'desc'), limit(20)),
      (snap) => {
        setFormations(
          snap.docs.map((d) => {
            const data = d.data()
            return { id: d.id, ...data, created_at: toIso(data.created_at) } as TeamFormation
          })
        )
        setLoading(false)
      },
      () => setLoading(false)
    )

    return unsub
  }, [])

  const saveFormation = useCallback(
    async (payload: Omit<TeamFormation, 'id' | 'created_at'>) => {
      if (!isFirebaseConfigured) {
        return { data: null, error: { message: 'Connect Firebase to save team formations.' } }
      }
      try {
        const ref = await addDoc(collection(db, 'team_formations'), { ...payload, created_at: Timestamp.now() })
        await logActivity({
          action: 'team_formation_generated',
          message: `Team formation generated for: "${payload.brief.slice(0, 60)}${payload.brief.length > 60 ? '…' : ''}" (${payload.members.length} employees)`,
          target: payload.brief.slice(0, 40)
        })
        await pushNotification(
          'Team formation ready',
          `A ${payload.members.length}-person team was recommended for "${payload.brief.slice(0, 60)}${payload.brief.length > 60 ? '…' : ''}".`
        )
        return { data: { id: ref.id }, error: null }
      } catch (err) {
        return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to save team formation' } }
      }
    },
    []
  )

  return { formations, loading, saveFormation }
}
