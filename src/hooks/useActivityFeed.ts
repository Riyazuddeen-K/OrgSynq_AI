import { useEffect, useState, useCallback } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { ActivityFeedEntry, ActivityFeedAction, UserRole } from '../lib/types'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

const DEFAULT_AUDIT_LOGS: ActivityFeedEntry[] = [
  {
    id: 'act-1',
    action: 'intern_converted',
    message: 'Hired intern Maya Lin as full-time Junior AI / ML Engineer',
    actor: 'Sarah Connor',
    actor_email: 'sarah.admin@orgsynq.ai',
    actor_role: 'superadmin',
    target: 'Maya Lin',
    details: 'Converted from Stanford University intern pool to Engineering Dept.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'act-2',
    action: 'event_created',
    message: 'Scheduled company event: "All-Hands Q3 Town Hall"',
    actor: 'David Miller',
    actor_email: 'david.hr@orgsynq.ai',
    actor_role: 'admin',
    target: 'All-Hands Q3 Town Hall',
    details: 'Target audience: All. Location: Google Meet.',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'act-3',
    action: 'project_status_changed',
    message: 'Marked project "Quantum Workforce Pipeline" as Completed',
    actor: 'Sarah Connor',
    actor_email: 'sarah.admin@orgsynq.ai',
    actor_role: 'superadmin',
    target: 'Quantum Workforce Pipeline',
    details: 'Status changed from Active to Completed. 4 members notified.',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'act-4',
    action: 'insight_resolved',
    message: 'Resolved high-risk alert: "Elevated Burnout in Core Teams"',
    actor: 'David Miller',
    actor_email: 'david.hr@orgsynq.ai',
    actor_role: 'admin',
    target: 'Elevated Burnout in Core Teams',
    details: 'Workload rebalance plan initiated with engineering managers.',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: 'act-5',
    action: 'employee_added',
    message: 'Added new workforce member: Marcus Chen (Staff Systems Architect)',
    actor: 'Sarah Connor',
    actor_email: 'sarah.admin@orgsynq.ai',
    actor_role: 'superadmin',
    target: 'Marcus Chen',
    details: 'Department: Engineering. Generated initial digital twin.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
]

export async function logActivity(entry: {
  action: ActivityFeedAction
  message: string
  actor?: string
  actor_email?: string
  actor_role?: UserRole
  target?: string
  details?: Record<string, unknown> | string
}): Promise<void> {
  const cleanEntry: ActivityFeedEntry = {
    id: `act-${Date.now()}`,
    action: entry.action,
    message: entry.message,
    actor: entry.actor || 'System Admin',
    actor_email: entry.actor_email || 'admin@orgsynq.ai',
    actor_role: entry.actor_role || 'admin',
    target: entry.target,
    details: typeof entry.details === 'object' ? JSON.stringify(entry.details) : entry.details,
    created_at: new Date().toISOString()
  }

  if (!isFirebaseConfigured) {
    try {
      const stored = localStorage.getItem('orgsynq_activity_feed') || JSON.stringify(DEFAULT_AUDIT_LOGS)
      const list: ActivityFeedEntry[] = JSON.parse(stored)
      list.unshift(cleanEntry)
      localStorage.setItem('orgsynq_activity_feed', JSON.stringify(list.slice(0, 100)))
    } catch {}
    return
  }

  try {
    const { id, ...rest } = cleanEntry
    await addDoc(collection(db, 'activity_feed'), {
      ...rest,
      created_at: Timestamp.now()
    })
  } catch {
    // best effort
  }
}

export function useActivityFeed(maxItems = 100) {
  const [feed, setFeed] = useState<ActivityFeedEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      try {
        const stored = localStorage.getItem('orgsynq_activity_feed')
        if (stored) {
          setFeed(JSON.parse(stored).slice(0, maxItems))
        } else {
          setFeed(DEFAULT_AUDIT_LOGS.slice(0, maxItems))
          localStorage.setItem('orgsynq_activity_feed', JSON.stringify(DEFAULT_AUDIT_LOGS))
        }
      } catch {
        setFeed(DEFAULT_AUDIT_LOGS.slice(0, maxItems))
      }
      setLoading(false)
      return
    }

    const q = query(collection(db, 'activity_feed'), orderBy('created_at', 'desc'), limit(maxItems))
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setFeed(DEFAULT_AUDIT_LOGS.slice(0, maxItems))
        } else {
          setFeed(
            snap.docs.map((d) => {
              const data = d.data()
              return { id: d.id, ...data, created_at: toIso(data.created_at) } as ActivityFeedEntry
            })
          )
        }
        setLoading(false)
      },
      () => {
        setFeed(DEFAULT_AUDIT_LOGS.slice(0, maxItems))
        setLoading(false)
      }
    )

    return unsub
  }, [maxItems])

  const deleteActivity = useCallback(
    async (id: string) => {
      // 1. Update local state
      setFeed((prev) => {
        const next = prev.filter((item) => item.id !== id)
        try {
          localStorage.setItem('orgsynq_activity_feed', JSON.stringify(next))
        } catch {}
        return next
      })

      // 2. Delete from Firestore if configured
      if (isFirebaseConfigured && !id.startsWith('act-')) {
        try {
          await deleteDoc(doc(db, 'activity_feed', id))
        } catch (err) {
          console.warn('[Audit Log] Failed to delete remote document:', err)
        }
      }
    },
    []
  )

  const clearAllActivity = useCallback(async () => {
    // 1. Update local state
    setFeed([])
    try {
      localStorage.setItem('orgsynq_activity_feed', JSON.stringify([]))
    } catch {}

    // 2. Delete docs in Firestore if configured
    if (isFirebaseConfigured) {
      for (const item of feed) {
        if (!item.id.startsWith('act-')) {
          try {
            await deleteDoc(doc(db, 'activity_feed', item.id))
          } catch {
            // best effort
          }
        }
      }
    }
  }, [feed])

  return { feed, loading, deleteActivity, clearAllActivity }
}
