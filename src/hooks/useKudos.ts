import { useCallback, useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, query, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { Kudos } from '../lib/types'
import { logActivity } from './useActivityFeed'
import { pushNotification } from '../lib/notify'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

// Recent peer recognition, org-wide (small org scale — filtered
// client-side per view, e.g. "my team" narrows to teammates).
export function useKudos() {
  const [kudos, setKudos] = useState<Kudos[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    const q = query(collection(db, 'kudos'), orderBy('created_at', 'desc'), limit(100))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setKudos(
          snap.docs.map((d) => {
            const data = d.data()
            return { id: d.id, ...data, created_at: toIso(data.created_at) } as Kudos
          })
        )
        setLoading(false)
      },
      () => setLoading(false)
    )

    return unsub
  }, [])

  const giveKudos = useCallback(
    async (from: { id: string; name: string }, to: { id: string; name: string }, message: string) => {
      if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to give recognition.' } }
      if (from.id === to.id) return { error: { message: "You can't give recognition to yourself." } }
      try {
        await addDoc(collection(db, 'kudos'), {
          from_employee_id: from.id,
          from_name: from.name,
          to_employee_id: to.id,
          to_name: to.name,
          message: message.trim(),
          created_at: Timestamp.now()
        })
        await logActivity({ action: 'kudos_given', message: `${from.name} recognized ${to.name}`, target: to.name, actor: from.name })
        await pushNotification('You received recognition', `${from.name}: "${message.trim()}"`, { employeeId: to.id })
        return { error: null }
      } catch (err) {
        return { error: { message: err instanceof Error ? err.message : 'Failed to give recognition' } }
      }
    },
    []
  )

  return { kudos, loading, giveKudos }
}
