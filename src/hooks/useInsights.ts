import { useCallback, useEffect, useState } from 'react'
import { collection, getDocs, doc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { Insight } from '../lib/types'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

export function useInsights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setInsights([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'insights'), orderBy('created_at', 'desc')))
      setInsights(
        snap.docs.map((d) => {
          const data = d.data()
          return { id: d.id, ...data, created_at: toIso(data.created_at) } as Insight
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const resolveInsight = useCallback(async (id: string) => {
    if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to resolve insights.' } }
    try {
      await updateDoc(doc(db, 'insights', id), { status: 'resolved' })
      setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'resolved' } : i)))
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to update insight' } }
    }
  }, [])

  return { insights, loading, error, refetch, resolveInsight }
}
