import { useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, query, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { ActivityFeedEntry, ActivityFeedAction } from '../lib/types'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

// Standalone utility — can be imported by any hook/component to log an event
export async function logActivity(entry: {
  action: ActivityFeedAction
  message: string
  actor?: string
  target?: string
}): Promise<void> {
  if (!isFirebaseConfigured) return
  try {
    await addDoc(collection(db, 'activity_feed'), {
      ...entry,
      created_at: Timestamp.now()
    })
  } catch {
    // best-effort — don't let logging break the main flow
  }
}

export function useActivityFeed(maxItems = 20) {
  const [feed, setFeed] = useState<ActivityFeedEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    const q = query(collection(db, 'activity_feed'), orderBy('created_at', 'desc'), limit(maxItems))
    const unsub = onSnapshot(q, (snap) => {
      setFeed(
        snap.docs.map((d) => {
          const data = d.data()
          return { id: d.id, ...data, created_at: toIso(data.created_at) } as ActivityFeedEntry
        })
      )
      setLoading(false)
    })

    return unsub
  }, [maxItems])

  return { feed, loading }
}
