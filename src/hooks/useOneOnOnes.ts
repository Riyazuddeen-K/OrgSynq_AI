import { useCallback, useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { OneOnOne } from '../lib/types'
import { logActivity } from './useActivityFeed'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

// Recent 1:1s logged for one specific employee (shown on their detail page).
export function useOneOnOnesForEmployee(employeeId: string | undefined) {
  const [entries, setEntries] = useState<OneOnOne[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employeeId || !isFirebaseConfigured) {
      setLoading(false)
      return
    }
    const q = query(collection(db, 'one_on_ones'), where('employee_id', '==', employeeId), orderBy('created_at', 'desc'), limit(10))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data(), created_at: toIso(d.data().created_at) } as OneOnOne)))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [employeeId])

  return { entries, loading }
}

// Every logged 1:1 across the whole org — used by manager blind-spot
// detection to know, per employee, when they were last checked in with.
export function useAllOneOnOnes() {
  const [entries, setEntries] = useState<OneOnOne[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    const unsub = onSnapshot(
      query(collection(db, 'one_on_ones'), orderBy('created_at', 'desc'), limit(500)),
      (snap) => {
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data(), created_at: toIso(d.data().created_at) } as OneOnOne)))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [])

  return { entries, loading }
}

export function useLogOneOnOne() {
  const logOneOnOne = useCallback(
    async (employeeId: string, employeeName: string, managerId: string | null, talkingPoints: string) => {
      if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to log 1:1s.' } }
      try {
        await addDoc(collection(db, 'one_on_ones'), {
          employee_id: employeeId,
          manager_id: managerId,
          talking_points: talkingPoints,
          created_at: Timestamp.now()
        })
        await logActivity({
          action: 'one_on_one_logged',
          message: `1:1 prep logged for ${employeeName}`,
          target: employeeName
        })
        return { error: null }
      } catch (err) {
        return { error: { message: err instanceof Error ? err.message : 'Failed to log 1:1' } }
      }
    },
    []
  )

  return { logOneOnOne }
}
