import { useEffect, useState } from 'react'
import { collection, getDocs, getDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore'
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
    let active = true
    async function load() {
      setLoading(true)
      try {
        const [twinSnap, employeeSnap, deptSnap] = await Promise.all([
          getDocs(query(collection(db, 'digital_twins'), orderBy('overall', 'desc'))),
          getDocs(collection(db, 'employees')),
          getDocs(collection(db, 'departments'))
        ])
        if (!active) return

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
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load digital twins')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
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
    let active = true
    async function load() {
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, 'digital_twins', employeeId as string))
        if (!active) return
        if (snap.exists()) {
          const data = snap.data()
          setTwin({ id: snap.id, employee_id: snap.id, ...data, updated_at: toIso(data.updated_at) } as DigitalTwin)
        } else {
          setTwin(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [employeeId])

  return { twin, loading }
}
