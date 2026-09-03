import { useCallback, useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, query, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { PlacementSearch } from '../lib/types'
import { logActivity } from './useActivityFeed'
import { pushNotification } from '../lib/notify'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

export function usePlacementSearches() {
  const [searches, setSearches] = useState<PlacementSearch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setSearches([])
      setLoading(false)
      return
    }

    const unsub = onSnapshot(
      query(collection(db, 'placement_searches'), orderBy('created_at', 'desc'), limit(20)),
      (snap) => {
        setSearches(
          snap.docs.map((d) => {
            const data = d.data()
            return { id: d.id, ...data, created_at: toIso(data.created_at) } as PlacementSearch
          })
        )
        setLoading(false)
      },
      () => setLoading(false)
    )

    return unsub
  }, [])

  const saveSearch = useCallback(async (payload: Omit<PlacementSearch, 'id' | 'created_at'>) => {
    if (!isFirebaseConfigured) return { data: null, error: { message: 'Connect Firebase to save placement searches.' } }
    try {
      const ref = await addDoc(collection(db, 'placement_searches'), { ...payload, created_at: Timestamp.now() })
      await logActivity({
        action: 'placement_search_generated',
        message: `Placement search run for: "${payload.job_brief.slice(0, 60)}${payload.job_brief.length > 60 ? '…' : ''}" (${payload.matches.length} candidates matched)`,
        target: payload.job_brief.slice(0, 40)
      })
      await pushNotification(
        'Placement matches ready',
        `${payload.matches.length} candidate${payload.matches.length === 1 ? '' : 's'} matched for "${payload.job_brief.slice(0, 60)}${payload.job_brief.length > 60 ? '…' : ''}".`
      )
      return { data: { id: ref.id }, error: null }
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to save placement search' } }
    }
  }, [])

  return { searches, loading, saveSearch }
}
