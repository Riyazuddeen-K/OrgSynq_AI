import { useCallback, useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { CalendarEvent, CalendarEventCategory } from '../lib/types'
import { logActivity } from './useActivityFeed'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

const DEFAULT_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'All-Hands Q3 Town Hall',
    description: 'Quarterly company update, revenue milestones, and product vision unveiling.',
    event_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    start_time: '15:00',
    end_time: '16:30',
    category: 'Town Hall',
    audience: 'All',
    location_or_link: 'https://meet.google.com/org-allhands',
    created_by: 'Executive Team',
    created_at: new Date().toISOString()
  },
  {
    id: 'evt-2',
    title: 'AI Digital Twin Architecture Sync',
    description: 'Deep dive into deterministic attrition modeling and pipeline deployment.',
    event_date: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
    start_time: '11:00',
    end_time: '12:00',
    category: 'Meeting',
    audience: 'Engineering',
    location_or_link: 'https://meet.google.com/eng-sync',
    created_by: 'Lead Architect',
    created_at: new Date().toISOString()
  },
  {
    id: 'evt-3',
    title: 'Design System & Micro-Interactions Workshop',
    description: 'Hands-on session covering dark mode color palettes and UI component upgrades.',
    event_date: new Date(Date.now() + 86400000 * 6).toISOString().slice(0, 10),
    start_time: '14:00',
    end_time: '15:30',
    category: 'Training',
    audience: 'Design',
    location_or_link: 'https://meet.google.com/design-critique',
    created_by: 'Head of Design',
    created_at: new Date().toISOString()
  },
  {
    id: 'evt-4',
    title: 'Mid-Year Wellness Day Off',
    description: 'Company-wide paid day off for rest, recreation, and family time.',
    event_date: new Date(Date.now() + 86400000 * 9).toISOString().slice(0, 10),
    category: 'Holiday',
    audience: 'All',
    location_or_link: 'Company Holiday',
    created_by: 'People Operations',
    created_at: new Date().toISOString()
  },
  {
    id: 'evt-5',
    title: 'Sprint 28 Retrospective & Review',
    description: 'Review deliverables, celebrate wins, and calibrate workload distribution.',
    event_date: new Date(Date.now() + 86400000 * 12).toISOString().slice(0, 10),
    start_time: '16:00',
    end_time: '17:00',
    category: 'Team Event',
    audience: 'Product',
    location_or_link: 'https://meet.google.com/sprint-review',
    created_by: 'Product Operations',
    created_at: new Date().toISOString()
  }
]

export interface NewCalendarEventInput {
  title: string
  description?: string
  event_date: string
  start_time?: string
  end_time?: string
  category: CalendarEventCategory
  audience: 'All' | 'Engineering' | 'Product' | 'Design' | 'Admins' | 'Remote'
  location_or_link?: string
}

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      try {
        const stored = localStorage.getItem('orgsynq_calendar_events')
        if (stored) {
          setEvents(JSON.parse(stored))
        } else {
          setEvents(DEFAULT_EVENTS)
          localStorage.setItem('orgsynq_calendar_events', JSON.stringify(DEFAULT_EVENTS))
        }
      } catch {
        setEvents(DEFAULT_EVENTS)
      }
      setLoading(false)
      return
    }

    const q = query(collection(db, 'calendar_events'), orderBy('event_date', 'asc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          // seed initial events
          DEFAULT_EVENTS.forEach(async (evt) => {
            const { id, ...rest } = evt
            await addDoc(collection(db, 'calendar_events'), { ...rest, created_at: Timestamp.now() })
          })
        } else {
          setEvents(
            snap.docs.map((d) => {
              const data = d.data()
              return { id: d.id, ...data, created_at: toIso(data.created_at) } as CalendarEvent
            })
          )
        }
        setLoading(false)
      },
      () => {
        setEvents(DEFAULT_EVENTS)
        setLoading(false)
      }
    )

    return unsub
  }, [])

  const addEvent = useCallback(async (input: NewCalendarEventInput, creatorName?: string) => {
    const newEntry: CalendarEvent = {
      id: `evt-${Date.now()}`,
      ...input,
      created_by: creatorName || 'Admin',
      created_at: new Date().toISOString()
    }

    if (!isFirebaseConfigured) {
      setEvents((prev) => {
        const updated = [...prev, newEntry].sort((a, b) => a.event_date.localeCompare(b.event_date))
        localStorage.setItem('orgsynq_calendar_events', JSON.stringify(updated))
        return updated
      })
      return { error: null }
    }

    try {
      await addDoc(collection(db, 'calendar_events'), {
        ...input,
        created_by: creatorName || 'Admin',
        created_at: Timestamp.now()
      })
      await logActivity({
        action: 'event_created',
        message: `New event scheduled: "${input.title}" on ${input.event_date}`,
        target: input.title
      })
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to save event' }
    }
  }, [])

  const deleteEvent = useCallback(async (id: string, title?: string) => {
    if (!isFirebaseConfigured) {
      setEvents((prev) => {
        const updated = prev.filter((e) => e.id !== id)
        localStorage.setItem('orgsynq_calendar_events', JSON.stringify(updated))
        return updated
      })
      return { error: null }
    }

    try {
      await deleteDoc(doc(db, 'calendar_events', id))
      if (title) {
        await logActivity({
          action: 'event_deleted',
          message: `Event canceled: "${title}"`,
          target: title
        })
      }
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete event' }
    }
  }, [])

  return { events, loading, addEvent, deleteEvent }
}
