import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  getDoc,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { Department, Employee, EmploymentStatus } from '../lib/types'
import { logActivity } from './useActivityFeed'
import { pushNotification } from '../lib/notify'

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
  skills: string[]
  experience_years: number
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

async function fetchDepartmentsMap(): Promise<Map<string, Department>> {
  const { getDocs } = await import('firebase/firestore')
  const snap = await getDocs(collection(db, 'departments'))
  const map = new Map<string, Department>()
  snap.docs.forEach((d) => map.set(d.id, { id: d.id, ...d.data() } as Department))
  return map
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setEmployees([])
      setLoading(false)
      return
    }

    let deptMap = new Map<string, Department>()

    // Fetch departments once, then subscribe to employees
    fetchDepartmentsMap().then((map) => {
      deptMap = map

      const q = query(collection(db, 'employees'), orderBy('name'))
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => {
            const data = d.data()
            return {
              id: d.id,
              ...data,
              skills: Array.isArray(data.skills) ? data.skills : [],
              experience_years: typeof data.experience_years === 'number' ? data.experience_years : 0,
              created_at: toIso(data.created_at),
              department: deptMap.get(data.department_id)
            } as Employee
          })
          setEmployees(list)
          setLoading(false)
        },
        (err) => {
          setError(err.message)
          setLoading(false)
        }
      )
      return unsub
    })
  }, [])

  const addEmployee = useCallback(async (input: NewEmployeeInput) => {
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

      // Auto-generate a starting digital twin profile
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

      // Log to live activity feed
      await logActivity({
        action: 'employee_added',
        message: `${input.name} was added to ${deptMap.get(input.department_id)?.name || 'the org'}`,
        target: input.name
      })
      await pushNotification(
        'New employee added',
        `${input.name} joined as ${input.title} in ${deptMap.get(input.department_id)?.name || 'the org'}.`
      )

      return { data: employee, error: null }
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to save employee' } }
    }
  }, [])

  const deleteEmployee = useCallback(async (id: string, name?: string) => {
    if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to remove employees.' } }
    try {
      await deleteDoc(doc(db, 'employees', id))
      await deleteDoc(doc(db, 'digital_twins', id)).catch(() => undefined)
      if (name) {
        await logActivity({
          action: 'employee_deleted',
          message: `${name} was removed from the org`,
          target: name
        })
        await pushNotification('Employee removed', `${name} was removed from the workforce directory.`)
      }
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to remove employee' } }
    }
  }, [])

  const updateEmployee = useCallback(async (id: string, input: NewEmployeeInput) => {
    if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to edit employees.' } }
    try {
      await updateDoc(doc(db, 'employees', id), { ...input })
      await logActivity({
        action: 'employee_updated',
        message: `${input.name}'s profile was updated`,
        target: input.name
      })
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to update employee' } }
    }
  }, [])

  return { employees, loading, error, addEmployee, deleteEmployee, updateEmployee }
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

    const unsub = onSnapshot(
      doc(db, 'employees', id),
      async (snap) => {
        if (!snap.exists()) {
          setError('Employee not found')
          setLoading(false)
          return
        }
        const data = snap.data()
        let department: Department | undefined
        if (data.department_id) {
          const deptSnap = await getDoc(doc(db, 'departments', data.department_id))
          if (deptSnap.exists()) department = { id: deptSnap.id, ...deptSnap.data() } as Department
        }
        setEmployee({
          id: snap.id,
          ...data,
          skills: Array.isArray(data.skills) ? data.skills : [],
          experience_years: typeof data.experience_years === 'number' ? data.experience_years : 0,
          created_at: toIso(data.created_at),
          department
        } as Employee)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return unsub
  }, [id])

  return { employee, loading, error }
}
