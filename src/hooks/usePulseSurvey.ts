import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { PulseResponse } from '../lib/types'
import { logActivity } from './useActivityFeed'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

function currentWeek(): string {
  const now = new Date()
  const jan1 = new Date(now.getFullYear(), 0, 1)
  const week = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export function usePulseSurvey(employeeId: string | undefined) {
  const [responses, setResponses] = useState<PulseResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const week = currentWeek()

  useEffect(() => {
    if (!employeeId || !isFirebaseConfigured) {
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'pulse_responses'),
      where('employee_id', '==', employeeId),
      orderBy('created_at', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      setResponses(
        snap.docs.map((d) => {
          const data = d.data()
          return { id: d.id, ...data, created_at: toIso(data.created_at) } as PulseResponse
        })
      )
      setLoading(false)
    })

    return unsub
  }, [employeeId])

  const hasRespondedThisWeek = responses.some((r) => r.week === week)

  const submitPulse = useCallback(
    async (score: number, note?: string, employeeName?: string) => {
      if (!employeeId || !isFirebaseConfigured) return { error: 'Firebase not configured' }
      setSubmitting(true)
      try {
        await addDoc(collection(db, 'pulse_responses'), {
          employee_id: employeeId,
          score,
          note: note || '',
          week,
          created_at: Timestamp.now()
        })
        await logActivity({
          action: 'pulse_submitted',
          message: `${employeeName || 'An employee'} submitted a pulse score of ${score}/5`,
          target: employeeName
        })
        // Auto-alert if score is very low
        if (score <= 2) {
          await addDoc(collection(db, 'notifications'), {
            title: `Low pulse score alert`,
            message: `${employeeName || 'An employee'} reported feeling ${score}/5 this week. Consider a check-in.`,
            is_read: false,
            created_at: Timestamp.now()
          })
          await logActivity({
            action: 'burnout_alert',
            message: `🔴 Low pulse score (${score}/5) flagged for ${employeeName || 'an employee'}`,
            target: employeeName
          })
        }
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to submit' }
      } finally {
        setSubmitting(false)
      }
    },
    [employeeId, week]
  )

  const avgScore =
    responses.length > 0
      ? Math.round((responses.reduce((s, r) => s + r.score, 0) / responses.length) * 10) / 10
      : null

  return { responses, loading, submitting, hasRespondedThisWeek, submitPulse, avgScore, week }
}
