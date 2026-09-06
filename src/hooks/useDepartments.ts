import { useEffect, useState, useCallback } from 'react'
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  where
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { Department } from '../lib/types'
import { logActivity } from './useActivityFeed'
import { pushNotification } from '../lib/notify'

export interface NewDepartmentInput {
  name: string
  color: string
}

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    const q = query(collection(db, 'departments'), orderBy('name'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setDepartments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Department)))
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return unsub
  }, [])

  const addDepartment = useCallback(async (input: NewDepartmentInput) => {
    if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to add departments.' } }
    try {
      await addDoc(collection(db, 'departments'), input)
      await logActivity({ action: 'department_added', message: `"${input.name}" department was created`, target: input.name })
      await pushNotification('New department added', `"${input.name}" was added to the org structure.`)
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to add department' } }
    }
  }, [])

  const updateDepartment = useCallback(async (id: string, input: NewDepartmentInput) => {
    if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to edit departments.' } }
    try {
      await updateDoc(doc(db, 'departments', id), { ...input })
      await logActivity({ action: 'department_updated', message: `"${input.name}" department was updated`, target: input.name })
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to update department' } }
    }
  }, [])

  // Deleting a department that still has employees would leave those
  // employees pointing at a department_id that no longer resolves —
  // every page that reads `employee.department?.name` etc would silently
  // show blanks. Rather than cascade-delete people or guess a fallback
  // department, this blocks the delete and tells the admin exactly how
  // many employees need to be reassigned first.
  const deleteDepartment = useCallback(async (id: string, name: string) => {
    if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to remove departments.' } }
    try {
      const snap = await getDocs(query(collection(db, 'employees'), where('department_id', '==', id)))
      if (!snap.empty) {
        return {
          error: {
            message: `${snap.size} employee${snap.size === 1 ? '' : 's'} still ${snap.size === 1 ? 'belongs' : 'belong'} to "${name}". Reassign them to another department first (edit each employee), then delete.`
          }
        }
      }
      await deleteDoc(doc(db, 'departments', id))
      await logActivity({ action: 'department_deleted', message: `"${name}" department was removed`, target: name })
      await pushNotification('Department removed', `"${name}" was removed from the org structure.`)
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to remove department' } }
    }
  }, [])

  return { departments, loading, error, addDepartment, updateDepartment, deleteDepartment }
}
