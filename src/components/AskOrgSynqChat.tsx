import { useEffect, useRef, useState } from 'react'
import { Bot, X, Send, Sparkles, ChevronDown, AlertCircle } from 'lucide-react'
import { useEmployees } from '../hooks/useEmployees'
import { useAuth } from '../context/AuthContext'
import { askOrgSynq, isGeminiConfigured } from '../lib/geminiClient'
import { classNames } from '../lib/utils'
import Markdown from './Markdown'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: Date
}

const ADMIN_SUGGESTIONS = [
  'Who is most at risk of leaving?',
  'Which department has the highest burnout?',
  'Who should I consider for promotion?',
  'What are the top 3 workforce risks?'
]

const EMPLOYEE_SUGGESTIONS = [
  'How is my performance trending?',
  'What should I focus on to reduce burnout?',
  'Am I ready for a promotion?',
  'What skills should I develop next?'
]

export default function AskOrgSynqChat() {
  const { role, profile } = useAuth()
  const isEmployee = role === 'employee'
  const { employees } = useEmployees()

  // Employees only ever get their own record in context — never the
  // whole workforce's performance/burnout/attrition data. Admins keep
  // seeing everyone, unchanged.
  const contextEmployees = isEmployee ? employees.filter((e) => e.id === profile?.employee_id) : employees
  const SUGGESTIONS = isEmployee ? EMPLOYEE_SUGGESTIONS : ADMIN_SUGGESTIONS

  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Build chat history for Gemini multi-turn conversation
  const geminiHistory = messages.map((m) => ({
    role: m.role === 'user' ? ('user' as const) : ('model' as const),
    parts: [{ text: m.content }]
  }))

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, minimized])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg) return
    setInput('')
    setError(null)

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: msg, ts: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setThinking(true)

    try {
      const reply = await askOrgSynq(msg, contextEmployees, geminiHistory)
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: reply, ts: new Date() }
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response')
    } finally {
      setThinking(false)
    }
  }

  if (!open) {
    return (
      <button
        id="ask-orgsynq-open"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-2xl bg-signal text-white shadow-xl shadow-signal/30 flex items-center justify-center hover:bg-signal/90 hover:scale-105 transition-all group"
        title="Ask OrgSynq AI"
      >
        <Bot className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-teal border-2 border-white dark:border-surface-darkbg animate-pulse" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col w-[360px] max-h-[560px] card shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-signal text-white shrink-0">
        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Ask OrgSynq</p>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
            <p className="text-[11px] text-white/70">
              {isGeminiConfigured ? 'Gemini Flash · Live' : 'Gemini not configured'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setMinimized((s) => !s)}
          className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <ChevronDown className={classNames('h-4 w-4 transition-transform', minimized ? 'rotate-180' : '')} />
        </button>
        <button
          id="ask-orgsynq-close"
          onClick={() => setOpen(false)}
          className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[360px]">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full bg-signal/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-signal" />
                  </div>
                  <div className="bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl rounded-tl-sm p-3 text-sm max-w-[85%]">
                    {isEmployee
                      ? "Hi! I'm OrgSynq AI. I have access to your own profile data — ask me anything about your performance, burnout, or growth."
                      : "Hi! I'm OrgSynq AI. I have live access to your workforce data. Ask me anything about your team."}
                  </div>
                </div>
                {!isGeminiConfigured && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber shrink-0 mt-0.5" />
                    <p className="text-xs text-amber">
                      Set <code className="bg-amber/10 px-1 rounded">VITE_GEMINI_API_KEY</code> in your .env to
                      enable AI responses.
                    </p>
                  </div>
                )}
                <p className="text-xs text-black/40 dark:text-white/30 px-1">Try asking:</p>
                <div className="space-y-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="w-full text-left text-xs px-3 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-signal/10 hover:text-signal transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={classNames('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {m.role === 'assistant' && (
                  <div className="h-6 w-6 rounded-full bg-signal/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-signal" />
                  </div>
                )}
                <div
                  className={classNames(
                    'rounded-2xl px-3 py-2.5 text-sm max-w-[85%]',
                    m.role === 'user'
                      ? 'bg-signal text-white rounded-tr-sm whitespace-pre-wrap'
                      : 'bg-black/[0.04] dark:bg-white/[0.06] rounded-tl-sm'
                  )}
                >
                  {m.role === 'assistant' ? <Markdown text={m.content} /> : m.content}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex gap-2 items-start">
                <div className="h-6 w-6 rounded-full bg-signal/15 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-signal" />
                </div>
                <div className="bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-signal/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-signal/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-signal/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose/10 border border-rose/20">
                <AlertCircle className="h-4 w-4 text-rose shrink-0 mt-0.5" />
                <p className="text-xs text-rose">{error}</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-surface-lightborder dark:border-surface-darkborder shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask anything about your workforce…"
                disabled={thinking}
                className="flex-1 text-sm bg-black/[0.04] dark:bg-white/[0.05] px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-signal/30 placeholder:text-black/35 dark:placeholder:text-white/30 disabled:opacity-60"
              />
              <button
                id="ask-orgsynq-send"
                onClick={() => handleSend()}
                disabled={!input.trim() || thinking}
                className="h-10 w-10 rounded-xl bg-signal text-white flex items-center justify-center hover:bg-signal/90 disabled:opacity-40 transition-colors shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-black/30 dark:text-white/25 mt-1.5 px-1">
              Powered by Gemini Flash · {isEmployee ? 'your profile' : `${employees.length} employees`} in context
            </p>
          </div>
        </>
      )}
    </div>
  )
}
