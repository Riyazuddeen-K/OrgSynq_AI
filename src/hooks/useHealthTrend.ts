import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
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
    let active = true
    async function load() {
      setLoading(true)
      try {
        const snap = await getDocs(query(collection(db, 'org_health_trend'), orderBy('sort_order')))
        if (!active) return
        setTrend(snap.docs.map((d) => ({ id: d.id, ...d.data() } as HealthTrendPoint)))
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  return { trend, loading }
}
