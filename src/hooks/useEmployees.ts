import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { Department, Employee, EmploymentStatus } from '../lib/types'

export interface NewEmployeeInput {
  name: string
  email: string
  title: string
  department_id: string
  manager_id: string | null
  location: string
  status: EmploymentStatus
  performance: number
  burnout: number
  attrition_risk: number
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

async function fetchDepartmentsMap(): Promise<Map<string, Department>> {
  const snap = await getDocs(collection(db, 'departments'))
  const map = new Map<string, Department>()
  snap.docs.forEach((d) => map.set(d.id, { id: d.id, ...d.data() } as Department))
  return map
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setEmployees([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [snap, deptMap] = await Promise.all([
        getDocs(query(collection(db, 'employees'), orderBy('name'))),
        fetchDepartmentsMap()
      ])
      const list = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          ...data,
          created_at: toIso(data.created_at),
          department: deptMap.get(data.department_id)
        } as Employee
      })
      setEmployees(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const addEmployee = useCallback(
    async (input: NewEmployeeInput) => {
      if (!isFirebaseConfigured) {
        return { data: null, error: { message: 'Connect Firebase to add employees. See .env.example.' } }
      }
      try {
        const created_at = Timestamp.now()
        const ref = await addDoc(collection(db, 'employees'), { ...input, created_at })
        const deptMap = await fetchDepartmentsMap()
        const employee: Employee = {
          id: ref.id,
          ...input,
          created_at: created_at.toDate().toISOString(),
          avatar_seed: '',
          department: deptMap.get(input.department_id)
        }

        // Auto-generate a starting digital twin profile, keyed by employee id,
        // so the new hire shows up on the Digital Twins page immediately.
        await setDoc(doc(db, 'digital_twins', ref.id), {
          performance: employee.performance,
          skills: Math.round(40 + Math.random() * 40),
          leadership: Math.round(30 + Math.random() * 40),
          learning: Math.round(40 + Math.random() * 40),
          burnout: employee.burnout,
          attrition_risk: employee.attrition_risk,
          promotion_ready: Math.round(20 + Math.random() * 40),
          collaboration: Math.round(40 + Math.random() * 40),
          org_contribution: Math.round(30 + Math.random() * 40),
          overall: Math.round((employee.performance + (100 - employee.burnout) + (100 - employee.attrition_risk)) / 3),
          updated_at: Timestamp.now()
        })

        await refetch()
        return { data: employee, error: null }
      } catch (err) {
        return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to save employee' } }
      }
    },
    [refetch]
  )

  const deleteEmployee = useCallback(async (id: string) => {
    if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to remove employees.' } }
    try {
      await deleteDoc(doc(db, 'employees', id))
      await deleteDoc(doc(db, 'digital_twins', id)).catch(() => undefined)
      setEmployees((prev) => prev.filter((e) => e.id !== id))
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to remove employee' } }
    }
  }, [])

  return { employees, loading, error, refetch, addEmployee, deleteEmployee }
}

export function useEmployee(id: string | undefined) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    let active = true
    async function load() {
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, 'employees', id as string))
        if (!active) return
        if (!snap.exists()) {
          setError('Employee not found')
          return
        }
        const data = snap.data()
        let department: Department | undefined
        if (data.department_id) {
          const deptSnap = await getDoc(doc(db, 'departments', data.department_id))
          if (deptSnap.exists()) department = { id: deptSnap.id, ...deptSnap.data() } as Department
        }
        setEmployee({ id: snap.id, ...data, created_at: toIso(data.created_at), department } as Employee)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load employee')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id])

  return { employee, loading, error }
}
