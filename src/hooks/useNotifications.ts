import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  doc,
  deleteDoc,
  getDocs,
  Timestamp
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { Notification } from '../lib/types'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setNotifications([])
      setLoading(false)
      return
    }

    const q = query(collection(db, 'notifications'), orderBy('created_at', 'desc'), limit(20))
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(
        snap.docs.map((d) => {
          const data = d.data()
          return { id: d.id, ...data, created_at: toIso(data.created_at) } as Notification
        })
      )
      setLoading(false)
    })

    return unsub
  }, [])

  const markAllRead = useCallback(async () => {
    if (!isFirebaseConfigured) return
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    try {
      const snap = await getDocs(query(collection(db, 'notifications'), where('is_read', '==', false)))
      const batch = writeBatch(db)
      snap.docs.forEach((d) => batch.update(doc(db, 'notifications', d.id), { is_read: true }))
      await batch.commit()
    } catch {
      // best-effort — UI already reflects read state
    }
  }, [])

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
    // Optimistic update
    setNotifications([])
    try {
      const snap = await getDocs(query(collection(db, 'notifications'), limit(20)))
      const batch = writeBatch(db)
      snap.docs.forEach((d) => batch.delete(doc(db, 'notifications', d.id)))
      await batch.commit()
    } catch {
      // best-effort — UI already reflects the cleared state
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return { notifications, loading, unreadCount, markAllRead, clearOne, clearAll }
}
