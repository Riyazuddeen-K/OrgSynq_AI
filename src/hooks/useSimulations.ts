import { useCallback, useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, query, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { Department, Simulation } from '../lib/types'
import { logActivity } from './useActivityFeed'
import { pushNotification } from '../lib/notify'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

export function useSimulations() {
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setSimulations([])
      setLoading(false)
      return
    }

    const unsub = onSnapshot(
      query(collection(db, 'simulations'), orderBy('created_at', 'desc'), limit(20)),
      async (snap) => {
        const { getDocs } = await import('firebase/firestore')
        const deptSnap = await getDocs(collection(db, 'departments'))
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
        setLoading(false)
      }
    )

    return unsub
  }, [])

  const saveSimulation = useCallback(
    async (payload: Omit<Simulation, 'id' | 'created_at' | 'target_department'>) => {
      if (!isFirebaseConfigured) {
        return { data: null, error: { message: 'Connect Firebase to save simulation runs.' } }
      }
      try {
        const ref = await addDoc(collection(db, 'simulations'), { ...payload, created_at: Timestamp.now() })
        await logActivity({
          action: 'simulation_run',
          message: `Simulation run: "${payload.name}" (${payload.scenario_type}, ${payload.affected_employees} employees)`,
          target: payload.name
        })
        await pushNotification(
          'Simulation completed',
          `"${payload.name}" (${payload.scenario_type}) finished — ${payload.affected_employees} employees affected.`
        )
        return { data: { id: ref.id }, error: null }
      } catch (err) {
        return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to save simulation' } }
      }
    },
    []
  )

  return { simulations, loading, saveSimulation }
}
