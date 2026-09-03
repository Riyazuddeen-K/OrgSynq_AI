import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebaseClient'

export interface NotificationTargeting {
  // 'admin' (default) — only admins see it, matching the original
  // behavior of every existing call site. 'all' — every signed-in user
  // sees it (e.g. "a new course is available"). Pass employeeId instead
  // to target one specific employee (admins still see it too, same as
  // everything else).
  audience?: 'admin' | 'all'
  employeeId?: string
}

/**
 * Push a live, real-time notification into the bell dropdown. Every open
 * session picks this up instantly via useNotifications' onSnapshot
 * listener — nothing needs a refresh. Called from the real event sources
 * (adding/removing an employee, running a simulation, etc.) rather than
 * being seeded once, so the feed reflects what's actually happening.
 */
export async function pushNotification(title: string, message: string, targeting?: NotificationTargeting): Promise<void> {
  if (!isFirebaseConfigured) return
  try {
    await addDoc(collection(db, 'notifications'), {
      title,
      message,
      is_read: false,
      created_at: Timestamp.now(),
      audience_employee_id: targeting?.employeeId ?? (targeting?.audience === 'all' ? 'all' : 'admin')
    })
  } catch {
    // best-effort — a missed notification shouldn't block the action that triggered it
  }
}
