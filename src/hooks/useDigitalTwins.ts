import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy, Timestamp, doc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { Department, DigitalTwin, Employee } from '../lib/types'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

export function useDigitalTwins() {
  const [twins, setTwins] = useState<DigitalTwin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    // Listen to digital_twins collection; for each update, re-fetch employees & departments
    const q = query(collection(db, 'digital_twins'), orderBy('overall', 'desc'))
    const unsub = onSnapshot(
      q,
      async (twinSnap) => {
        try {
          const { getDocs } = await import('firebase/firestore')
          const [employeeSnap, deptSnap] = await Promise.all([
            getDocs(collection(db, 'employees')),
            getDocs(collection(db, 'departments'))
          ])

          const deptMap = new Map<string, Department>()
          deptSnap.docs.forEach((d) => deptMap.set(d.id, { id: d.id, ...d.data() } as Department))

          const employeeMap = new Map<string, Employee>()
          employeeSnap.docs.forEach((d) => {
            const data = d.data()
            employeeMap.set(d.id, {
              id: d.id,
              ...data,
              created_at: toIso(data.created_at),
              department: deptMap.get(data.department_id)
            } as Employee)
          })

          const list = twinSnap.docs.map((d) => {
            const data = d.data()
            return {
              id: d.id,
              employee_id: d.id,
              ...data,
              updated_at: toIso(data.updated_at),
              employee: employeeMap.get(d.id)
            } as DigitalTwin
          })
          setTwins(list)
          setLoading(false)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load digital twins')
          setLoading(false)
        }
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return unsub
  }, [])

  return { twins, loading, error }
}

export function useDigitalTwinByEmployee(employeeId: string | undefined) {
  const [twin, setTwin] = useState<DigitalTwin | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!employeeId) return
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    const unsub = onSnapshot(
      doc(db, 'digital_twins', employeeId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          setTwin({ id: snap.id, employee_id: snap.id, ...data, updated_at: toIso(data.updated_at) } as DigitalTwin)
        } else {
          setTwin(null)
        }
        setLoading(false)
      }
    )

    return unsub
  }, [employeeId])

  return { twin, loading }
}
