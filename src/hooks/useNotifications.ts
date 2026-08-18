import { useCallback, useEffect, useState } from 'react'
import { collection, getDocs, query, where, orderBy, limit, writeBatch, doc, Timestamp } from 'firebase/firestore'
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

  const refetch = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setNotifications([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'notifications'), orderBy('created_at', 'desc'), limit(8)))
      setNotifications(
        snap.docs.map((d) => {
          const data = d.data()
          return { id: d.id, ...data, created_at: toIso(data.created_at) } as Notification
        })
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const markAllRead = useCallback(async () => {
    if (!isFirebaseConfigured) return
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

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return { notifications, loading, unreadCount, markAllRead, refetch }
}
