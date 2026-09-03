import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { HealthTrendPoint } from '../lib/types'

export function useHealthTrend() {
  const [trend, setTrend] = useState<HealthTrendPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = onSnapshot(
      query(collection(db, 'org_health_trend'), orderBy('sort_order')),
      (snap) => {
        setTrend(snap.docs.map((d) => ({ id: d.id, ...d.data() } as HealthTrendPoint)))
        setLoading(false)
      },
      () => {
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  return { trend, loading }
}
