import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
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
    let active = true
    async function load() {
      setLoading(true)
      try {
        const snap = await getDocs(query(collection(db, 'departments'), orderBy('name')))
        if (!active) return
        setDepartments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Department)))
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load departments')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  return { departments, loading, error }
}
