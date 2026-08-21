import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebaseClient'

/**
 * Push a live, real-time notification into the bell dropdown. Every open
 * session picks this up instantly via useNotifications' onSnapshot
 * listener — nothing needs a refresh. Called from the real event sources
 * (adding/removing an employee, running a simulation, etc.) rather than
 * being seeded once, so the feed reflects what's actually happening.
 */
export async function pushNotification(title: string, message: string): Promise<void> {
  if (!isFirebaseConfigured) return
  try {
    await addDoc(collection(db, 'notifications'), {
      title,
      message,
      is_read: false,
      created_at: Timestamp.now()
    })
  } catch {
    // best-effort — a missed notification shouldn't block the action that triggered it
  }
}
