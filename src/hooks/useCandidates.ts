import { useCallback, useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { Candidate, CandidateStatus } from '../lib/types'
import { logActivity } from './useActivityFeed'
import { pushNotification } from '../lib/notify'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

export interface NewCandidateInput {
  name: string
  email: string
  applied_role: string
  location: string
  skills: string[]
  experience_years: number
  test_score: number
  interview_score: number
  behavior_score: number
  status: CandidateStatus
  notes?: string
}

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    const unsub = onSnapshot(
      query(collection(db, 'candidates'), orderBy('created_at', 'desc')),
      (snap) => {
        setCandidates(
          snap.docs.map((d) => {
            const data = d.data()
            return { id: d.id, ...data, created_at: toIso(data.created_at) } as Candidate
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

  const addCandidate = useCallback(async (input: NewCandidateInput) => {
    if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to add candidates.' } }
    try {
      await addDoc(collection(db, 'candidates'), { ...input, created_at: Timestamp.now() })
      await logActivity({
        action: 'candidate_added',
        message: `${input.name} was added as a candidate for ${input.applied_role}`,
        target: input.name
      })
      await pushNotification('New candidate added', `${input.name} applied for ${input.applied_role}.`)
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to add candidate' } }
    }
  }, [])

  const updateCandidate = useCallback(async (id: string, input: NewCandidateInput) => {
    if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to edit candidates.' } }
    try {
      await updateDoc(doc(db, 'candidates', id), { ...input })
      await logActivity({
        action: 'candidate_added',
        message: `${input.name}'s candidate profile was updated`,
        target: input.name
      })
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to update candidate' } }
    }
  }, [])

  const deleteCandidate = useCallback(async (id: string, name?: string) => {
    if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to remove candidates.' } }
    try {
      await deleteDoc(doc(db, 'candidates', id))
      if (name) {
        await logActivity({ action: 'candidate_deleted', message: `${name} was removed from the candidate pool`, target: name })
      }
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to remove candidate' } }
    }
  }, [])

  return { candidates, loading, error, addCandidate, updateCandidate, deleteCandidate }
}
