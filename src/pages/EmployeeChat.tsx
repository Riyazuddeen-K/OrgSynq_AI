import { useMemo, useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageSquare,
  Send,
  Search,
  Hash,
  CheckCheck,
  Calendar,
  ExternalLink,
  Pencil,
  Trash2,
  Sparkles
} from 'lucide-react'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import { useEmployees } from '../hooks/useEmployees'
import { useEmployeeChat } from '../hooks/useEmployeeChat'
import { useAuth } from '../context/AuthContext'
import { classNames } from '../lib/utils'

const QUICK_EMOJIS = ['👍', '🔥', '🚀', '👏', '❤️', '💡']

const SUGGESTED_PROMPTS = [
  '☕ Free for a quick 10-min coffee sync?',
  '📊 Can we review the sprint deliverables?',
  '🚀 Great work on the latest milestone!',
  '📅 Do you have time today for a 1:1 check-in?'
]

export default function EmployeeChat() {
  const { employees } = useEmployees()
  const { profile, role } = useAuth()
  const [activeRecipientId, setActiveRecipientId] = useState<string>('general-channel')
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Edit message state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  const activeContact = useMemo(() => {
    if (activeRecipientId === 'general-channel') return null
    return employees.find((e) => e.id === activeRecipientId) || null
  }, [employees, activeRecipientId])

  const {
    activeThread,
    sendMessage,
    editMessage,
    deleteMessage,
    clearChat,
    addReaction,
    markThreadRead,
    unreadCounts,
    currentUserId
  } = useEmployeeChat(activeRecipientId, activeContact)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const filteredColleagues = useMemo(() => {
    return employees.filter((e) => {
      if (profile?.employee_id && e.id === profile.employee_id) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        e.name.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        (e.department?.name || '').toLowerCase().includes(q)
      )
    })
  }, [employees, profile?.employee_id, searchQuery])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeThread.length])

  // Clear the unread badge for whichever colleague's thread is open — both
  // when switching to it, and again if a new message arrives while it's
  // already the active thread (so the badge never lingers on an open chat).
  useEffect(() => {
    if (activeRecipientId !== 'general-channel') {
      markThreadRead(activeRecipientId)
    }
  }, [activeRecipientId, activeThread.length, markThreadRead])

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!messageInput.trim()) return
    const text = messageInput
    setMessageInput('')
    await sendMessage(text, activeRecipientId)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleQuickPrompt(promptText: string) {
    sendMessage(promptText, activeRecipientId)
  }

  function handleAddReaction(emoji: string) {
    if (activeThread.length > 0) {
      const lastMsg = activeThread[activeThread.length - 1]
      addReaction(lastMsg.id, emoji)
    } else {
      sendMessage(emoji, activeRecipientId)
    }
  }

  function handleSaveEdit(msgId: string) {
    if (!editingText.trim()) return
    editMessage(msgId, editingText)
    setEditingMessageId(null)
    setEditingText('')
  }

  function handleClearChat() {
    const targetName = activeRecipientId === 'general-channel' ? '# general-channel' : activeContact?.name || 'this contact'
    if (window.confirm(`Are you sure you want to clear chat history for ${targetName}?`)) {
      clearChat(activeRecipientId)
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <Topbar
        title="Employee Messages"
        subtitle="Direct 1-on-1 and organization-wide team messaging"
      />

      <div className="flex-1 min-h-0 overflow-hidden p-3 md:p-6">
        <div className="card h-full flex overflow-hidden border border-slate-200/80 dark:border-white/[0.08] shadow-card">
          {/* Left Colleague Sidebar */}
          <div className="w-72 md:w-80 border-r border-slate-200 dark:border-white/[0.08] flex flex-col shrink-0 bg-slate-50/50 dark:bg-black/15">
            <div className="p-3 border-b border-slate-200 dark:border-white/[0.08]">
              <div className="relative flex items-center">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search colleagues, roles, teams..."
                  className="input text-xs"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {/* General Channel */}
              <button
                onClick={() => setActiveRecipientId('general-channel')}
                className={classNames(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all focus-ring',
                  activeRecipientId === 'general-channel'
                    ? 'bg-signal/15 text-signal font-semibold shadow-xs ring-1 ring-signal/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                )}
              >
                <div className="h-9 w-9 rounded-xl bg-signal/15 text-signal flex items-center justify-center shrink-0">
                  <Hash className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold truncate"># general-channel</p>
                    <span className="h-2 w-2 rounded-full bg-teal shrink-0 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">Company announcements & team chat</p>
                </div>
              </button>

              <div className="pt-3 pb-1 px-3 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Colleagues ({filteredColleagues.length})
                </p>
              </div>

              {filteredColleagues.map((emp) => {
                const isActive = activeRecipientId === emp.id
                const unread = unreadCounts[emp.id] || 0
                return (
                  <button
                    key={emp.id}
                    onClick={() => setActiveRecipientId(emp.id)}
                    className={classNames(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all focus-ring group',
                      isActive
                        ? 'bg-signal/15 text-signal font-semibold shadow-xs ring-1 ring-signal/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar name={emp.name} src={emp.photo_url} size={36} />
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-teal ring-2 ring-white dark:ring-surface-darkcard" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={classNames(
                            'text-xs truncate',
                            unread > 0 ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-900 dark:text-white'
                          )}
                        >
                          {emp.name}
                        </p>
                        {unread > 0 ? (
                          <span className="h-4 min-w-[16px] px-1 rounded-full bg-teal text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                            {unread > 99 ? '99+' : unread}
                          </span>
                        ) : (
                          <span className="text-[9px] px-1 rounded bg-slate-100 dark:bg-white/10 text-slate-500 shrink-0">
                            {emp.department?.name?.slice(0, 4) || 'Org'}
                          </span>
                        )}
                      </div>
                      <p
                        className={classNames(
                          'text-[11px] truncate',
                          unread > 0 ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-400'
                        )}
                      >
                        {emp.title}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Chat Area */}
          <div className="flex-1 min-h-0 flex flex-col bg-surface-lightcard dark:bg-surface-darkcard overflow-hidden">
            {/* Chat Header */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/30 dark:bg-white/[0.01]">
              <div className="flex items-center gap-3">
                {activeRecipientId === 'general-channel' ? (
                  <div className="h-10 w-10 rounded-xl bg-signal/15 text-signal flex items-center justify-center">
                    <Hash className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="relative">
                    <Avatar name={activeContact?.name || 'User'} src={activeContact?.photo_url} size={40} />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-teal ring-2 ring-white dark:ring-surface-darkcard" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                      {activeRecipientId === 'general-channel' ? '# general-channel' : activeContact?.name}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {activeRecipientId === 'general-channel'
                      ? 'Open to all team members · Company-wide'
                      : `${activeContact?.title || 'Employee'} · ${activeContact?.department?.name || 'Department'}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeContact && (
                  <>
                    <Link
                      to="/calendar"
                      className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                      title="Schedule 1:1 on Calendar"
                    >
                      <Calendar className="h-3.5 w-3.5 text-signal" /> Schedule 1:1
                    </Link>
                    <Link
                      to={`/employees/${activeContact.id}`}
                      className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                      title="View Full Profile"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400" /> View Profile
                    </Link>
                  </>
                )}
                <button
                  onClick={handleClearChat}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose/30 text-xs font-medium text-rose hover:bg-rose/10 transition-colors"
                  title="Clear conversation history"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear Chat</span>
                </button>
                <span className="flex items-center gap-1 text-xs text-teal font-medium ml-1">
                  <span className="h-2 w-2 rounded-full bg-teal animate-pulse" /> Active Now
                </span>
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {activeThread.length === 0 && (
                <div className="text-center py-16">
                  <div className="h-12 w-12 rounded-2xl bg-signal/10 text-signal flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Start of conversation with{' '}
                    {activeRecipientId === 'general-channel' ? '# general-channel' : activeContact?.name}
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    {activeContact
                      ? `Send a message to ${activeContact.name} to connect directly.`
                      : 'Share an announcement or start a discussion with the entire company.'}
                  </p>
                </div>
              )}

              {activeThread.map((msg) => {
                const isMe =
                  msg.sender_id === currentUserId ||
                  msg.sender_id === 'my-id' ||
                  msg.sender_id === 'demo-user'
                const canModify = isMe || role === 'admin' || role === 'superadmin'
                const isEditingThis = editingMessageId === msg.id

                return (
                  <div
                    key={msg.id}
                    className={classNames('flex items-end gap-2.5 group relative', isMe ? 'justify-end' : 'justify-start')}
                  >
                    {!isMe && (
                      <Avatar
                        name={msg.sender_name}
                        src={msg.sender_photo || (activeContact?.id === msg.sender_id ? activeContact.photo_url : undefined)}
                        size={28}
                        className="shrink-0 mb-1"
                      />
                    )}

                    <div className={classNames('max-w-md space-y-1 relative', isMe ? 'items-end' : 'items-start')}>
                      {/* Floating edit/delete action buttons for sender or admin */}
                      {canModify && !isEditingThis && (
                        <div
                          className={classNames(
                            'opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 absolute -top-3.5 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm rounded-lg px-1 py-0.5',
                            isMe ? 'right-1' : 'left-1'
                          )}
                        >
                          <button
                            onClick={() => {
                              setEditingMessageId(msg.id)
                              setEditingText(msg.content)
                            }}
                            className="p-1 hover:text-signal text-slate-500 dark:text-slate-400 transition-colors"
                            title="Edit message"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="p-1 hover:text-rose text-slate-500 dark:text-slate-400 transition-colors"
                            title="Delete message"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {!isMe && (
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 ml-1">
                          {msg.sender_name}
                        </p>
                      )}

                      <div
                        className={classNames(
                          'p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm relative',
                          isMe
                            ? 'bg-signal text-white rounded-br-none'
                            : 'bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/60 dark:border-white/[0.06]'
                        )}
                      >
                        {isEditingThis ? (
                          <div className="space-y-2">
                            <input
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(msg.id)
                                if (e.key === 'Escape') setEditingMessageId(null)
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white text-slate-900 dark:bg-slate-800 dark:text-white border border-signal/50 focus:outline-none focus:ring-1 focus:ring-signal"
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingMessageId(null)}
                                className="px-2 py-0.5 rounded text-[10px] bg-white/20 hover:bg-white/30 text-white transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(msg.id)}
                                className="px-2 py-0.5 rounded text-[10px] bg-white text-signal font-semibold hover:bg-white/90 transition-colors"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            {msg.reaction && (
                              <span className="absolute -bottom-2 -right-1 bg-white dark:bg-surface-darkcard ring-1 ring-black/10 dark:ring-white/10 text-xs px-1.5 py-0.5 rounded-full shadow-xs">
                                {msg.reaction}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      <div
                        className={classNames(
                          'flex items-center gap-1.5 text-[10px] text-slate-400 px-1',
                          isMe ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.edited_at && <span className="italic text-[9px] text-slate-400">(edited)</span>}
                        {isMe && <CheckCheck className="h-3 w-3 text-signal" />}
                      </div>
                    </div>
                  </div>
                )
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Smart Suggested Prompts Bar */}
            <div className="px-5 py-2 border-t border-slate-200/60 dark:border-white/[0.04] flex items-center gap-2 overflow-x-auto scrollbar-thin">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-signal" /> Prompts:
              </span>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-signal/15 hover:text-signal transition-colors whitespace-nowrap focus-ring"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Quick Reactions Bar */}
            <div className="px-5 py-1.5 border-t border-slate-200/40 dark:border-white/[0.02] flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">React:</span>
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleAddReaction(emoji)}
                  className="h-6 w-6 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-sm flex items-center justify-center transition-transform hover:scale-125"
                  title={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-white/[0.08] flex items-center gap-2">
              <input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${
                  activeRecipientId === 'general-channel' ? '#general-channel' : activeContact?.name || 'colleague'
                } (Press Enter to send)...`}
                className="input text-xs flex-1"
                autoFocus
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="h-10 px-4 rounded-xl bg-signal text-white text-xs font-semibold hover:bg-signal/90 shadow-sm transition-all focus-ring disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
