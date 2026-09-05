import { useCallback, useEffect, useState } from 'react'
import { collection, onSnapshot, doc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { Insight } from '../lib/types'
import { logActivity } from './useActivityFeed'
import { pushNotification } from '../lib/notify'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

export function useInsights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setInsights([])
      setLoading(false)
      return
    }

    const q = query(collection(db, 'insights'), orderBy('created_at', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setInsights(
          snap.docs.map((d) => {
            const data = d.data()
            return { id: d.id, ...data, created_at: toIso(data.created_at) } as Insight
          })
        )
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return unsub
  }, [])

  const resolveInsight = useCallback(async (id: string, title?: string) => {
    if (!isFirebaseConfigured) {
      setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'resolved' } : i)))
      return { error: null }
    }
    try {
      await updateDoc(doc(db, 'insights', id), { status: 'resolved' })
      setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'resolved' } : i)))
      if (title) {
        await logActivity({
          action: 'insight_resolved',
          message: `Insight resolved: "${title}"`,
          target: title
        })
        await pushNotification('Insight resolved', `"${title}" was marked resolved.`)
      }
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to update insight' } }
    }
  }, [])

  const reopenInsight = useCallback(async (id: string, title?: string) => {
    if (!isFirebaseConfigured) {
      setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'open' } : i)))
      return { error: null }
    }
    try {
      await updateDoc(doc(db, 'insights', id), { status: 'open' })
      setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'open' } : i)))
      if (title) {
        await logActivity({
          action: 'insight_generated',
          message: `Insight reopened: "${title}"`,
          target: title
        })
      }
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to reopen insight' } }
    }
  }, [])

  return { insights, loading, error, resolveInsight, reopenInsight }
}

