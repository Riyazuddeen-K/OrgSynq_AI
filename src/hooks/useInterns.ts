import { useCallback, useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { InternCandidate, InternStatus } from '../lib/types'
import { logActivity } from './useActivityFeed'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

const DEFAULT_INTERNS: InternCandidate[] = [
  {
    id: 'intern-1',
    name: 'Maya Lin',
    email: 'maya.lin@stanford.edu',
    university: 'Stanford University',
    degree_major: 'B.S. Computer Science & AI',
    grad_year: 2027,
    track: 'AI / ML',
    duration_months: 6,
    status: 'Accepted',
    test_score: 95,
    interview_score: 92,
    behavior_score: 90,
    notes: 'Exceptional background in PyTorch and LLM inference optimization. Highly recommended by interview panel.',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'intern-2',
    name: 'Devon Vance',
    email: 'dvance@berkeley.edu',
    university: 'UC Berkeley',
    degree_major: 'B.S. Electrical Engineering & CS',
    grad_year: 2026,
    track: 'Full Stack',
    duration_months: 3,
    status: 'Interviewing',
    test_score: 88,
    interview_score: 86,
    behavior_score: 94,
    notes: 'Strong React and Node.js fundamentals. Great teamwork skills in the collaborative coding challenge.',
    created_at: new Date(Date.now() - 86400000 * 8).toISOString()
  },
  {
    id: 'intern-3',
    name: 'Chloe Zhang',
    email: 'chloe.z@cmu.edu',
    university: 'Carnegie Mellon University',
    degree_major: 'M.S. Human-Computer Interaction',
    grad_year: 2026,
    track: 'UI/UX',
    duration_months: 6,
    status: 'Offered',
    test_score: 92,
    interview_score: 96,
    behavior_score: 91,
    notes: 'Outstanding portfolio with polished Figma design systems and accessibility research.',
    created_at: new Date(Date.now() - 86400000 * 12).toISOString()
  },
  {
    id: 'intern-4',
    name: 'Lucas Rossi',
    email: 'l.rossi@mit.edu',
    university: 'MIT',
    degree_major: 'B.S. Data Science & Economics',
    grad_year: 2027,
    track: 'Data Science',
    duration_months: 3,
    status: 'Screening',
    test_score: 84,
    interview_score: 80,
    behavior_score: 88,
    notes: 'Solid SQL and Python Pandas background. Awaiting panel technical round.',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: 'intern-5',
    name: 'Aisha Patel',
    email: 'aisha.p@georgiatech.edu',
    university: 'Georgia Tech',
    degree_major: 'B.S. Computer Engineering',
    grad_year: 2026,
    track: 'AI / ML',
    duration_months: 6,
    status: 'Applied',
    test_score: 91,
    interview_score: 0,
    behavior_score: 85,
    notes: 'Strong resume; initial coding assessment cleared with flying colors.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
]

export interface NewInternInput {
  name: string
  email: string
  university: string
  degree_major: string
  grad_year: number
  track: string
  duration_months: number
  status: InternStatus
  test_score: number
  interview_score: number
  behavior_score: number
  mentor_id?: string
  notes?: string
}

export function useInterns() {
  const [interns, setInterns] = useState<InternCandidate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      try {
        const stored = localStorage.getItem('orgsynq_interns')
        if (stored) {
          setInterns(JSON.parse(stored))
        } else {
          setInterns(DEFAULT_INTERNS)
          localStorage.setItem('orgsynq_interns', JSON.stringify(DEFAULT_INTERNS))
        }
      } catch {
        setInterns(DEFAULT_INTERNS)
      }
      setLoading(false)
      return
    }

    const q = query(collection(db, 'interns'), orderBy('created_at', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          DEFAULT_INTERNS.forEach(async (intern) => {
            const { id, ...rest } = intern
            await addDoc(collection(db, 'interns'), { ...rest, created_at: Timestamp.now() })
          })
        } else {
          setInterns(
            snap.docs.map((d) => {
              const data = d.data()
              return { id: d.id, ...data, created_at: toIso(data.created_at) } as InternCandidate
            })
          )
        }
        setLoading(false)
      },
      () => {
        setInterns(DEFAULT_INTERNS)
        setLoading(false)
      }
    )

    return unsub
  }, [])

  const addIntern = useCallback(async (input: NewInternInput) => {
    const newEntry: InternCandidate = {
      id: `intern-${Date.now()}`,
      ...input,
      created_at: new Date().toISOString()
    }

    if (!isFirebaseConfigured) {
      setInterns((prev) => {
        const updated = [newEntry, ...prev]
        localStorage.setItem('orgsynq_interns', JSON.stringify(updated))
        return updated
      })
      return { error: null }
    }

    try {
      await addDoc(collection(db, 'interns'), {
        ...input,
        created_at: Timestamp.now()
      })
      await logActivity({
        action: 'intern_added',
        message: `New intern candidate registered: ${input.name} (${input.university}) for ${input.track}`,
        target: input.name
      })
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to save intern' }
    }
  }, [])

  const updateInternStatus = useCallback(async (id: string, newStatus: InternStatus, internName: string) => {
    if (!isFirebaseConfigured) {
      setInterns((prev) => {
        const updated = prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
        localStorage.setItem('orgsynq_interns', JSON.stringify(updated))
        return updated
      })
      return { error: null }
    }

    try {
      await updateDoc(doc(db, 'interns', id), { status: newStatus })
      await logActivity({
        action: 'intern_added',
        message: `Intern pipeline status updated: ${internName} is now "${newStatus}"`,
        target: internName
      })
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update status' }
    }
  }, [])

  const deleteIntern = useCallback(async (id: string, name?: string) => {
    if (!isFirebaseConfigured) {
      setInterns((prev) => {
        const updated = prev.filter((i) => i.id !== id)
        localStorage.setItem('orgsynq_interns', JSON.stringify(updated))
        return updated
      })
      return { error: null }
    }

    try {
      await deleteDoc(doc(db, 'interns', id))
      if (name) {
        await logActivity({
          action: 'intern_deleted',
          message: `Intern removed: ${name}`,
          target: name
        })
      }
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete intern' }
    }
  }, [])

  // 1-Click Convert Intern to Full-Time Employee
  const convertToEmployee = useCallback(
    async (intern: InternCandidate, departmentId: string, fullTitle: string) => {
      // 1. Update intern status to Converted
      await updateInternStatus(intern.id, 'Converted', intern.name)

      // 2. Add to employees
      if (!isFirebaseConfigured) {
        try {
          const empRaw = localStorage.getItem('orgsynq_mock_employees') || '[]'
          const emps = JSON.parse(empRaw)
          const newEmp = {
            id: `emp-${Date.now()}`,
            name: intern.name,
            email: intern.email,
            title: fullTitle || `${intern.track} Engineer`,
            department_id: departmentId,
            manager_id: null,
            location: 'San Francisco, CA',
            status: 'Active',
            performance: Math.round((intern.test_score + intern.interview_score) / 2) || 88,
            burnout: 22,
            attrition_risk: 15,
            avatar_seed: intern.name,
            skills: [intern.track, 'Python', 'Git', 'Agile'],
            experience_years: 1,
            created_at: new Date().toISOString()
          }
          emps.unshift(newEmp)
          localStorage.setItem('orgsynq_mock_employees', JSON.stringify(emps))
        } catch {}
      } else {
        try {
          const empRef = await addDoc(collection(db, 'employees'), {
            name: intern.name,
            email: intern.email,
            title: fullTitle || `${intern.track} Engineer`,
            department_id: departmentId,
            manager_id: null,
            location: 'San Francisco, CA',
            status: 'Active',
            performance: Math.round((intern.test_score + intern.interview_score) / 2) || 88,
            burnout: 22,
            attrition_risk: 15,
            avatar_seed: intern.name,
            skills: [intern.track, 'Python', 'Git', 'Agile'],
            experience_years: 1,
            created_at: Timestamp.now()
          })

          // create initial digital twin
          await addDoc(collection(db, 'digital_twins'), {
            employee_id: empRef.id,
            performance: 88,
            skills: intern.test_score || 85,
            leadership: 75,
            learning: 95,
            burnout: 20,
            attrition_risk: 15,
            promotion_ready: 70,
            collaboration: 90,
            org_contribution: 80,
            overall: 85,
            updated_at: Timestamp.now()
          })

          await logActivity({
            action: 'intern_converted',
            message: `Hired intern ${intern.name} as full-time ${fullTitle}!`,
            target: intern.name
          })
        } catch {}
      }

      return { error: null }
    },
    [updateInternStatus]
  )

  return { interns, loading, addIntern, updateInternStatus, deleteIntern, convertToEmployee }
}
