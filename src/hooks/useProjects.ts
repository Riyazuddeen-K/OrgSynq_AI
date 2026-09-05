import { useCallback, useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { Project, ProjectStatus } from '../lib/types'
import { logActivity } from './useActivityFeed'
import { pushNotification } from '../lib/notify'
import { optionalField, valueOrDeleteField } from '../lib/firestoreOptional'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

export interface NewProjectInput {
  name: string
  description: string
  status: ProjectStatus
  member_ids: string[]
  deadline?: string
}

// Fetches every project (small org scale, same pattern as
// useAllOneOnOnes) — admin sees all for management; employee-facing
// views filter client-side to member_ids.includes(myEmployeeId), which
// avoids needing an array-contains + orderBy composite Firestore index.
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    const q = query(collection(db, 'projects'), orderBy('created_at', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setProjects(
          snap.docs.map((d) => {
            const data = d.data()
            return { id: d.id, ...data, created_at: toIso(data.created_at) } as Project
          })
        )
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return unsub
  }, [])

  const createProject = useCallback(async (input: NewProjectInput) => {
    if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to create projects.' } }
    try {
      const { deadline, ...rest } = input
      await addDoc(collection(db, 'projects'), { ...rest, ...optionalField('deadline', deadline), created_at: Timestamp.now() })
      await logActivity({ action: 'project_created', message: `"${input.name}" project was created`, target: input.name })
      for (const memberId of input.member_ids) {
        await pushNotification('Assigned to a new project', `You were assigned to "${input.name}".`, { employeeId: memberId })
      }
      if (input.member_ids.length > 0) {
        await logActivity({
          action: 'project_assigned',
          message: `${input.member_ids.length} member${input.member_ids.length === 1 ? '' : 's'} assigned to "${input.name}"`,
          target: input.name
        })
      }
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to create project' } }
    }
  }, [])

  const updateProject = useCallback(
    async (id: string, input: NewProjectInput, previousMemberIds: string[]) => {
      if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to edit projects.' } }
      try {
        const { deadline, ...rest } = input
        // A deadline cleared back to blank actually removes the field here
        // (deleteField()), rather than silently keeping the old value.
        await updateDoc(doc(db, 'projects', id), { ...rest, deadline: valueOrDeleteField(deadline) })
        const newlyAdded = input.member_ids.filter((m) => !previousMemberIds.includes(m))
        for (const memberId of newlyAdded) {
          await pushNotification('Assigned to a project', `You were assigned to "${input.name}".`, { employeeId: memberId })
        }
        if (newlyAdded.length > 0) {
          await logActivity({
            action: 'project_assigned',
            message: `${newlyAdded.length} member${newlyAdded.length === 1 ? '' : 's'} added to "${input.name}"`,
            target: input.name
          })
        }
        return { error: null }
      } catch (err) {
        return { error: { message: err instanceof Error ? err.message : 'Failed to update project' } }
      }
    },
    []
  )

  const deleteProject = useCallback(async (id: string, name?: string) => {
    if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to remove projects.' } }
    try {
      await deleteDoc(doc(db, 'projects', id))
      if (name) {
        await logActivity({ action: 'project_deleted', message: `"${name}" project was removed`, target: name })
      }
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to remove project' } }
    }
  }, [])

  return { projects, loading, error, createProject, updateProject, deleteProject }
}
