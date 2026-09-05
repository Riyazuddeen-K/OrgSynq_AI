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
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-2xl bg-gradient-to-tr from-signal via-indigo-600 to-purple-600 text-white shadow-xl shadow-signal/35 hover:shadow-signal/50 flex items-center justify-center hover:scale-105 transition-all group focus-ring ring-2 ring-white/20"
        title="Ask OrgSynq AI"
      >
        <Bot className="h-6 w-6 group-hover:rotate-6 transition-transform" />
        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-teal ring-2 ring-white dark:ring-slate-900 animate-pulse" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col w-[380px] max-h-[580px] card-solid shadow-2xl overflow-hidden border border-slate-200/80 dark:border-white/[0.1] animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-signal via-indigo-600 to-purple-600 text-white shrink-0 shadow-sm">
        <div className="h-8 w-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm leading-tight">OrgSynq AI Copilot</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[11px] text-white/80">
              {isGeminiConfigured ? 'Gemini 1.5 Flash · Live' : 'Demo Intelligence Ready'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setMinimized((s) => !s)}
          className="h-7 w-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
        >
          <ChevronDown className={classNames('h-4 w-4 transition-transform', minimized ? 'rotate-180' : '')} />
        </button>
        <button
          id="ask-orgsynq-close"
          onClick={() => setOpen(false)}
          className="h-7 w-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[380px] bg-slate-50/50 dark:bg-black/20 scrollbar-thin">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="h-7 w-7 rounded-xl bg-signal/15 text-signal flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="bg-white dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl rounded-tl-sm p-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 shadow-xs max-w-[88%] leading-relaxed">
                    {isEmployee
                      ? "Hi! I'm OrgSynq AI. I have access to your personal digital twin and performance metrics — ask me anything about your growth, workload, or retention indicators."
                      : "Hi! I'm OrgSynq AI. I have live access to your organization's digital twins, flight risks, and department telemetry. Ask me anything."}
                  </div>
                </div>
                {!isGeminiConfigured && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber/10 border border-amber/20">
                    <AlertCircle className="h-4 w-4 text-amber shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber leading-tight">
                      To enable full generative synthesis, set <code className="bg-amber/15 px-1 py-0.5 rounded font-mono">VITE_GEMINI_API_KEY</code> in .env.
                    </p>
                  </div>
                )}
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">Suggested inquiries:</p>
                <div className="space-y-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="w-full text-left text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.06] hover:border-signal/40 hover:bg-signal/5 dark:hover:bg-signal/10 hover:text-signal transition-all shadow-2xs"
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
                  <div className="h-6 w-6 rounded-lg bg-signal/15 text-signal flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={classNames(
                    'rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm max-w-[85%] shadow-xs leading-relaxed',
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-signal to-indigo-600 text-white rounded-tr-sm whitespace-pre-wrap'
                      : 'bg-white dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] text-slate-800 dark:text-slate-200 rounded-tl-sm'
                  )}
                >
                  {m.role === 'assistant' ? <Markdown text={m.content} /> : m.content}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex gap-2 items-start">
                <div className="h-6 w-6 rounded-lg bg-signal/15 text-signal flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-white dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs">
                  <div className="flex gap-1.5 items-center">
                    <span className="h-2 w-2 rounded-full bg-signal animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-signal animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-signal animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose/10 border border-rose/20 text-rose text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-surface-darkcard shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask anything about your workforce…"
                disabled={thinking}
                className="flex-1 text-xs bg-slate-100 dark:bg-white/[0.05] px-3.5 py-2.5 rounded-xl border border-transparent focus:border-signal/50 focus:bg-white dark:focus:bg-surface-darkcard focus-ring transition-all placeholder:text-slate-400 disabled:opacity-60"
              />
              <button
                id="ask-orgsynq-send"
                onClick={() => handleSend()}
                disabled={!input.trim() || thinking}
                className="h-9 w-9 rounded-xl bg-gradient-to-r from-signal to-indigo-600 text-white flex items-center justify-center hover:opacity-95 disabled:opacity-40 shadow-sm transition-all shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 px-1">
              Powered by Gemini · {isEmployee ? 'Personal profile' : `${employees.length} team profiles`} in context
            </p>
          </div>
        </>
      )}
    </div>
  )
}
