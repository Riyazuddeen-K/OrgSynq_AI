import { useCallback, useEffect, useState } from 'react'
import { collection, getDocs, addDoc, query, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { Department, Simulation } from '../lib/types'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

export function useSimulations() {
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setSimulations([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [snap, deptSnap] = await Promise.all([
        getDocs(query(collection(db, 'simulations'), orderBy('created_at', 'desc'), limit(10))),
        getDocs(collection(db, 'departments'))
      ])
      const deptMap = new Map<string, Department>()
      deptSnap.docs.forEach((d) => deptMap.set(d.id, { id: d.id, ...d.data() } as Department))

      setSimulations(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            ...data,
            created_at: toIso(data.created_at),
            target_department: data.target_department_id ? deptMap.get(data.target_department_id) : undefined
          } as Simulation
        })
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const saveSimulation = useCallback(
    async (payload: Omit<Simulation, 'id' | 'created_at' | 'target_department'>) => {
      if (!isFirebaseConfigured) {
        return { data: null, error: { message: 'Connect Firebase to save simulation runs.' } }
      }
      try {
        const ref = await addDoc(collection(db, 'simulations'), { ...payload, created_at: Timestamp.now() })
        await refetch()
        return { data: { id: ref.id }, error: null }
      } catch (err) {
        return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to save simulation' } }
      }
    },
    [refetch]
  )

  return { simulations, loading, refetch, saveSimulation }
}
