import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { Department } from '../lib/types'

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

  return { departments, loading, error }
}
