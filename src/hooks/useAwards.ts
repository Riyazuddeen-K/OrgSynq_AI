import { useCallback, useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { Award } from '../lib/types'
import { logActivity } from './useActivityFeed'
import { pushNotification } from '../lib/notify'
import { optionalField } from '../lib/firestoreOptional'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

// Admin/manager-given awards (distinct from peer-to-peer kudos). Fetches
// all — admin needs the full history; employee-facing views filter
// client-side to their own employee_id, same pattern as projects.
export function useAwards() {
  const [awards, setAwards] = useState<Award[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    const q = query(collection(db, 'awards'), orderBy('created_at', 'desc'), limit(200))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAwards(
          snap.docs.map((d) => {
            const data = d.data()
            return { id: d.id, ...data, created_at: toIso(data.created_at) } as Award
          })
        )
        setLoading(false)
      },
      () => setLoading(false)
    )

    return unsub
  }, [])

  const giveAward = useCallback(
    async (
      employee: { id: string; name: string },
      awardType: string,
      message: string | undefined,
      givenBy: string
    ) => {
      if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to give awards.' } }
      try {
        await addDoc(collection(db, 'awards'), {
          employee_id: employee.id,
          employee_name: employee.name,
          award_type: awardType,
          ...optionalField('message', message),
          given_by: givenBy,
          created_at: Timestamp.now()
        })
        await logActivity({
          action: 'award_given',
          message: `${employee.name} received "${awardType}"`,
          target: employee.name,
          actor: givenBy
        })
        await pushNotification('You received an award! 🏆', `${givenBy} recognized you with "${awardType}".`, {
          employeeId: employee.id
        })
        return { error: null }
      } catch (err) {
        return { error: { message: err instanceof Error ? err.message : 'Failed to give award' } }
      }
    },
    []
  )

  const revokeAward = useCallback(async (id: string) => {
    if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to remove awards.' } }
    try {
      await deleteDoc(doc(db, 'awards', id))
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to remove award' } }
    }
  }, [])

  return { awards, loading, giveAward, revokeAward }
}
