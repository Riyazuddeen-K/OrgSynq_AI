import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch,
  Timestamp
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { DirectChatMessage, Employee } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { pushNotification } from '../lib/notify'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

const DEFAULT_MESSAGES: DirectChatMessage[] = [
  {
    id: 'msg-seed-1',
    sender_id: 'emp-sarah',
    sender_name: 'Sarah Chen',
    recipient_id: 'general-channel',
    content: 'Good morning everyone! Reminder that the Q3 All-Hands town hall is happening this Thursday at 3 PM.',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    reaction: '🎉'
  },
  {
    id: 'msg-seed-2',
    sender_id: 'emp-alex',
    sender_name: 'Alex Rivera',
    recipient_id: 'general-channel',
    content: 'Thanks Sarah! Looking forward to reviewing the new attrition forecast models.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    reaction: '🔥'
  },
  {
    id: 'msg-seed-3',
    sender_id: 'emp-sarah',
    sender_name: 'Sarah Chen',
    recipient_id: 'my-id',
    content: 'Hey there! Do you have 10 minutes today to sync on the placement candidate shortlist?',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'msg-seed-4',
    sender_id: 'my-id',
    sender_name: 'You',
    recipient_id: 'emp-sarah',
    content: 'Sure! 2:30 PM works great on my calendar. Send over the invite!',
    created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    reaction: '👍'
  }
]

function saveLocal(msgs: DirectChatMessage[]) {
  try {
    localStorage.setItem('orgsynq_employee_messages', JSON.stringify(msgs))
  } catch {
    // ignore quota errors
  }
}

export function useEmployeeChat(activeRecipientId: string, _activeColleague: Employee | null = null) {
  const { profile, user } = useAuth()
  const [messages, setMessages] = useState<DirectChatMessage[]>([])
  const [loading, setLoading] = useState(true)

  const currentUserId = profile?.employee_id || user?.uid || 'demo-user'
  const currentUserName = profile?.displayName || user?.email?.split('@')[0] || 'Me'
  const currentUserPhoto = profile?.photo_url

  useEffect(() => {
    // ── OFFLINE / DEMO MODE ──
    if (!isFirebaseConfigured) {
      let local: DirectChatMessage[] = []
      try {
        const raw = localStorage.getItem('orgsynq_employee_messages')
        if (raw) local = JSON.parse(raw)
      } catch {
        // ignore
      }
      if (local.length === 0) {
        local = DEFAULT_MESSAGES
        saveLocal(local)
      }
      setMessages(local)
      setLoading(false)
      return
    }

    // ── FIREBASE MODE: Real-time Firestore sync ──
    setLoading(true)

    try {
      const q = query(collection(db, 'employee_messages'), orderBy('created_at', 'asc'))
      const unsub = onSnapshot(
        q,
        (snap) => {
          const remote = snap.docs.map((d) => {
            const data = d.data()
            return {
              id: d.id,
              sender_id: data.sender_id || '',
              sender_name: data.sender_name || 'User',
              sender_photo: data.sender_photo || undefined,
              recipient_id: data.recipient_id || 'general-channel',
              content: data.content || '',
              reaction: data.reaction || undefined,
              edited_at: data.edited_at ? toIso(data.edited_at) : undefined,
              created_at: toIso(data.created_at)
            } as DirectChatMessage
          })

          setMessages((prev) => {
            const map = new Map<string, DirectChatMessage>()
            remote.forEach((m) => map.set(m.id, m))
            if (map.size === 0 && prev.length === 0) {
              DEFAULT_MESSAGES.forEach((m) => map.set(m.id, m))
            }
            return Array.from(map.values()).sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
          })
          setLoading(false)
        },
        (err) => {
          console.warn('[OrgSynq Chat] Remote sync notice:', err.message)
          let local: DirectChatMessage[] = []
          try {
            const raw = localStorage.getItem('orgsynq_employee_messages')
            if (raw) local = JSON.parse(raw)
          } catch {
            // ignore
          }
          if (local.length === 0) local = DEFAULT_MESSAGES
          setMessages(local)
          setLoading(false)
        }
      )
      return unsub
    } catch {
      setLoading(false)
    }
  }, [])

  const sendMessage = useCallback(
    async (content: string, recipientId: string) => {
      const trimmed = content.trim()
      if (!trimmed) return

      const nowIso = new Date().toISOString()
      // Only 1:1 DMs track read state for the unread badge/notification —
      // the general channel is a broadcast, not something to "unread-count".
      const isDirectMessage = recipientId !== 'general-channel'

      if (isFirebaseConfigured) {
        try {
          const payload: Record<string, unknown> = {
            sender_id: currentUserId,
            sender_name: currentUserName,
            recipient_id: recipientId,
            content: trimmed,
            created_at: Timestamp.now(),
            read: !isDirectMessage
          }
          if (currentUserPhoto) payload.sender_photo = currentUserPhoto
          await addDoc(collection(db, 'employee_messages'), payload)
          if (isDirectMessage) {
            // Best-effort — a missed notification shouldn't block sending.
            await pushNotification(`New message from ${currentUserName}`, trimmed.slice(0, 120), {
              employeeId: recipientId
            })
          }
        } catch (err) {
          console.warn('[OrgSynq Chat] Send failed, saving locally:', err)
          const fallbackMsg: DirectChatMessage = {
            id: `local-${Date.now()}`,
            sender_id: currentUserId,
            sender_name: currentUserName,
            sender_photo: currentUserPhoto,
            recipient_id: recipientId,
            content: trimmed,
            created_at: nowIso,
            read: !isDirectMessage
          }
          setMessages((prev) => {
            const next = [...prev, fallbackMsg]
            saveLocal(next)
            return next
          })
        }
      } else {
        const newMsg: DirectChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sender_id: currentUserId,
          sender_name: currentUserName,
          sender_photo: currentUserPhoto,
          recipient_id: recipientId,
          content: trimmed,
          created_at: nowIso,
          read: !isDirectMessage
        }
        setMessages((prev) => {
          const next = [...prev, newMsg]
          saveLocal(next)
          return next
        })
      }
    },
    [currentUserId, currentUserName, currentUserPhoto]
  )

  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      const trimmed = newContent.trim()
      if (!trimmed) return

      const nowIso = new Date().toISOString()

      // 1. Update local state immediately
      setMessages((prev) => {
        const next = prev.map((m) =>
          m.id === messageId ? { ...m, content: trimmed, edited_at: nowIso } : m
        )
        saveLocal(next)
        return next
      })

      // 2. Update Firestore if configured
      if (isFirebaseConfigured && !messageId.startsWith('local-') && !messageId.startsWith('msg-seed-')) {
        try {
          await updateDoc(doc(db, 'employee_messages', messageId), {
            content: trimmed,
            edited_at: Timestamp.now()
          })
        } catch (err) {
          console.warn('[OrgSynq Chat] Edit failed on remote:', err)
        }
      }
    },
    []
  )

  const deleteMessage = useCallback(
    async (messageId: string) => {
      // 1. Remove from local state immediately
      setMessages((prev) => {
        const next = prev.filter((m) => m.id !== messageId)
        saveLocal(next)
        return next
      })

      // 2. Delete from Firestore if configured
      if (isFirebaseConfigured && !messageId.startsWith('local-') && !messageId.startsWith('msg-seed-')) {
        try {
          await deleteDoc(doc(db, 'employee_messages', messageId))
        } catch (err) {
          console.warn('[OrgSynq Chat] Delete failed on remote:', err)
        }
      }
    },
    []
  )

  const clearChat = useCallback(
    async (recipientId: string) => {
      const myIds = new Set([currentUserId, 'my-id', 'demo-user', user?.uid ?? ''].filter(Boolean))

      // Identify which messages belong to this thread
      const messagesToDelete = messages.filter((m) => {
        if (recipientId === 'general-channel') {
          return m.recipient_id === 'general-channel'
        }
        const iSent = myIds.has(m.sender_id) && m.recipient_id === recipientId
        const theySent = m.sender_id === recipientId && myIds.has(m.recipient_id)
        return iSent || theySent
      })

      const idsToDelete = new Set(messagesToDelete.map((m) => m.id))

      // 1. Update local state
      setMessages((prev) => {
        const next = prev.filter((m) => !idsToDelete.has(m.id))
        saveLocal(next)
        return next
      })

      // 2. Delete remote docs in Firestore
      if (isFirebaseConfigured) {
        for (const m of messagesToDelete) {
          if (!m.id.startsWith('local-') && !m.id.startsWith('msg-seed-')) {
            try {
              await deleteDoc(doc(db, 'employee_messages', m.id))
            } catch {
              // best effort
            }
          }
        }
      }
    },
    [currentUserId, user?.uid, messages]
  )

  // Marks every unread message from `colleagueId` to me as read — called
  // when that thread is opened, like WhatsApp clearing a chat's unread
  // count as soon as you view it.
  const markThreadRead = useCallback(
    async (colleagueId: string) => {
      if (colleagueId === 'general-channel') return
      const myIds = new Set([currentUserId, 'my-id', 'demo-user', user?.uid ?? ''].filter(Boolean))

      const idsToMark = messages
        .filter((m) => m.sender_id === colleagueId && myIds.has(m.recipient_id) && m.read === false)
        .map((m) => m.id)

      if (idsToMark.length === 0) return

      // 1. Update local state / localStorage immediately
      setMessages((prev) => {
        const next = prev.map((m) => (idsToMark.includes(m.id) ? { ...m, read: true } : m))
        if (!isFirebaseConfigured) saveLocal(next)
        return next
      })

      // 2. Persist to Firestore if configured
      if (isFirebaseConfigured) {
        const remoteIds = idsToMark.filter((id) => !id.startsWith('local-') && !id.startsWith('msg-seed-'))
        if (remoteIds.length > 0) {
          try {
            const batch = writeBatch(db)
            remoteIds.forEach((id) => batch.update(doc(db, 'employee_messages', id), { read: true }))
            await batch.commit()
          } catch {
            // best-effort — UI already reflects the read state
          }
        }
      }
    },
    [messages, currentUserId, user?.uid]
  )

  // Per-colleague unread count for the sidebar badge (WhatsApp-style).
  const unreadCounts = useMemo(() => {
    const myIds = new Set([currentUserId, 'my-id', 'demo-user', user?.uid ?? ''].filter(Boolean))
    const counts: Record<string, number> = {}
    for (const m of messages) {
      if (m.read === false && myIds.has(m.recipient_id) && m.sender_id && !myIds.has(m.sender_id)) {
        counts[m.sender_id] = (counts[m.sender_id] || 0) + 1
      }
    }
    return counts
  }, [messages, currentUserId, user?.uid])

  const addReaction = useCallback((messageId: string, emoji: string) => {
    setMessages((prev) => {
      const next = prev.map((m) => (m.id === messageId ? { ...m, reaction: emoji } : m))
      if (!isFirebaseConfigured) saveLocal(next)
      return next
    })
    if (isFirebaseConfigured && !messageId.startsWith('local-') && !messageId.startsWith('msg-seed-')) {
      updateDoc(doc(db, 'employee_messages', messageId), { reaction: emoji }).catch(() => undefined)
    }
  }, [])

  // Filter messages for active thread view
  const activeThread = messages.filter((m) => {
    if (activeRecipientId === 'general-channel') {
      return m.recipient_id === 'general-channel'
    }
    const myIds = new Set([currentUserId, 'my-id', 'demo-user', user?.uid ?? ''].filter(Boolean))
    const iSentToColleague = myIds.has(m.sender_id) && m.recipient_id === activeRecipientId
    const colleagueSentToMe = m.sender_id === activeRecipientId && myIds.has(m.recipient_id)
    return iSentToColleague || colleagueSentToMe
  })

  return {
    messages,
    activeThread,
    loading,
    sendMessage,
    editMessage,
    deleteMessage,
    clearChat,
    addReaction,
    markThreadRead,
    unreadCounts,
    currentUserId,
    isTyping: false,
    typingName: ''
  }
}
