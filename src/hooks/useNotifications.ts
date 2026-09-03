import { useCallback, useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, orderBy, limit, writeBatch, doc, deleteDoc, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { Notification } from '../lib/types'
import { useAuth } from '../context/AuthContext'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

function fromSnap(snap: import('firebase/firestore').QuerySnapshot): Notification[] {
  return snap.docs.map((d) => {
    const data = d.data()
    return { id: d.id, ...data, created_at: toIso(data.created_at) } as Notification
  })
}

export function useNotifications() {
  const { role, profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setNotifications([])
      setLoading(false)
      return
    }

    // Admins see admin-oriented and broadcast notifications — but never
    // another specific employee's personal ones (e.g. "You received an
    // award!"), since that's written in second person for that employee
    // and is just confusing shown to anyone else, including the admin who
    // triggered it. Fetch a wider window than we display, since some of
    // it gets filtered out, then cap to 20 after filtering.
    if (role !== 'employee') {
      const q = query(collection(db, 'notifications'), orderBy('created_at', 'desc'), limit(50))
      const unsub = onSnapshot(q, (snap) => {
        const relevant = fromSnap(snap).filter(
          (n) => !n.audience_employee_id || n.audience_employee_id === 'admin' || n.audience_employee_id === 'all'
        )
        setNotifications(relevant.slice(0, 20))
        setLoading(false)
      })
      return unsub
    }

    // Employees only see broadcast ('all') notifications plus ones
    // targeted specifically at them — never the admin-only feed of
    // org-wide events (new hires, simulations run, etc. about other
    // people). Two plain-equality listeners (not `in`) so this never
    // needs a manual Firestore composite index; merged client-side.
    const employeeId = profile?.employee_id
    let broadcastDocs: Notification[] = []
    let personalDocs: Notification[] = []
    let broadcastLoaded = false
    let personalLoaded = employeeId ? false : true

    function merge() {
      const combined = [...broadcastDocs, ...personalDocs]
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setNotifications(combined.slice(0, 20))
      if (broadcastLoaded && personalLoaded) setLoading(false)
    }

    const unsubBroadcast = onSnapshot(
      query(collection(db, 'notifications'), where('audience_employee_id', '==', 'all'), orderBy('created_at', 'desc'), limit(20)),
      (snap) => {
        broadcastDocs = fromSnap(snap)
        broadcastLoaded = true
        merge()
      },
      () => {
        broadcastLoaded = true
        merge()
      }
    )

    let unsubPersonal: (() => void) | undefined
    if (employeeId) {
      unsubPersonal = onSnapshot(
        query(collection(db, 'notifications'), where('audience_employee_id', '==', employeeId), orderBy('created_at', 'desc'), limit(20)),
        (snap) => {
          personalDocs = fromSnap(snap)
          personalLoaded = true
          merge()
        },
        () => {
          personalLoaded = true
          merge()
        }
      )
    }

    return () => {
      unsubBroadcast()
      unsubPersonal?.()
    }
  }, [role, profile?.employee_id])

  const markAllRead = useCallback(async () => {
    if (!isFirebaseConfigured) return
    const ids = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (ids.length === 0) return
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    try {
      const batch = writeBatch(db)
      ids.forEach((id) => batch.update(doc(db, 'notifications', id), { is_read: true }))
      await batch.commit()
    } catch {
      // best-effort — UI already reflects read state
    }
  }, [notifications])

  const clearOne = useCallback(async (id: string) => {
    if (!isFirebaseConfigured) return
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    try {
      await deleteDoc(doc(db, 'notifications', id))
    } catch {
      // best-effort — the live listener will resync if this failed silently
    }
  }, [])

  const clearAll = useCallback(async () => {
    if (!isFirebaseConfigured) return
    const ids = notifications.map((n) => n.id)
    if (ids.length === 0) return
    // Optimistic update
    setNotifications([])
    try {
      const batch = writeBatch(db)
      ids.forEach((id) => batch.delete(doc(db, 'notifications', id)))
      await batch.commit()
    } catch {
      // best-effort — UI already reflects the cleared state
    }
  }, [notifications])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return { notifications, loading, unreadCount, markAllRead, clearOne, clearAll }
}
