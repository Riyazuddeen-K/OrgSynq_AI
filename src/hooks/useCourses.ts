import { useCallback, useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { Course } from '../lib/types'
import { logActivity } from './useActivityFeed'
import { pushNotification } from '../lib/notify'
import { optionalField, valueOrDeleteField } from '../lib/firestoreOptional'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

export interface NewCourseInput {
  title: string
  description: string
  youtube_url: string
  category?: string
}

// Courses are admin-managed content (upskilling library), read by
// everyone — same read model as departments/employees in this app.
export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    const q = query(collection(db, 'courses'), orderBy('created_at', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setCourses(
          snap.docs.map((d) => {
            const data = d.data()
            return { id: d.id, ...data, created_at: toIso(data.created_at) } as Course
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

  const addCourse = useCallback(async (input: NewCourseInput) => {
    if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to add courses.' } }
    try {
      const { category, ...rest } = input
      await addDoc(collection(db, 'courses'), { ...rest, ...optionalField('category', category), created_at: Timestamp.now() })
      await logActivity({ action: 'course_added', message: `"${input.title}" was added to the learning library`, target: input.title })
      await pushNotification('New course available', `"${input.title}" was added to the learning library.`, { audience: 'all' })
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to add course' } }
    }
  }, [])

  const updateCourse = useCallback(async (id: string, input: NewCourseInput) => {
    if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to edit courses.' } }
    try {
      const { category, ...rest } = input
      // A category cleared back to blank actually removes the field here
      // (deleteField()), rather than silently keeping the old value.
      await updateDoc(doc(db, 'courses', id), { ...rest, category: valueOrDeleteField(category) })
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to update course' } }
    }
  }, [])

  const deleteCourse = useCallback(async (id: string, title?: string) => {
    if (!isFirebaseConfigured) return { error: { message: 'Connect Firebase to remove courses.' } }
    try {
      await deleteDoc(doc(db, 'courses', id))
      if (title) {
        await logActivity({ action: 'course_removed', message: `"${title}" was removed from the learning library`, target: title })
      }
      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to remove course' } }
    }
  }, [])

  return { courses, loading, error, addCourse, updateCourse, deleteCourse }
}
