import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, Bell, Sun, Moon, Settings, LogOut, CheckCircle2, Database, X, Sparkles, Calendar, MessageSquare } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../hooks/useNotifications'
import { isFirebaseConfigured } from '../lib/firebaseClient'
import { timeAgo, classNames } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'

interface TopbarProps {
  title: string
  subtitle?: string
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { theme, toggleTheme } = useTheme()
  const { notifications, unreadCount, markAllRead, clearOne, clearAll } = useNotifications()
  const { user, profile, signOut } = useAuth()
  const [query, setQuery] = useState('')
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/employees?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-20 h-16 shrink-0 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-surface-darkcard/80 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between gap-4 transition-colors">
      <div className="min-w-0">
        <h1 className="text-lg md:text-xl font-display font-bold text-slate-900 dark:text-white tracking-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Search with keyboard badge */}
        <form onSubmit={onSearchSubmit} className="hidden md:block relative group">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-signal transition-colors" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search directory, skills, teams..."
            className="w-64 lg:w-72 pl-9 pr-14 py-2 rounded-xl text-xs font-medium bg-slate-100/80 dark:bg-white/[0.05] border border-transparent focus:border-signal/50 focus:bg-white dark:focus:bg-surface-darkcard focus-ring transition-all placeholder:text-slate-400"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-white/10 rounded border border-slate-200 dark:border-white/10 shadow-xs">
              ⌘K
            </kbd>
          </div>
        </form>

        {/* Live status badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.07] text-[11px] font-medium text-slate-600 dark:text-slate-300">
          {isFirebaseConfigured ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
              </span>
              <span>Live Firestore</span>
            </>
          ) : (
            <>
              <Database className="h-3 w-3 text-amber" />
              <span>Demo Mode</span>
            </>
          )}
        </div>

        {/* Quick Calendar Link */}
        <Link
          to="/calendar"
          className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors focus-ring"
          title="Company Calendar"
        >
          <Calendar className="h-[18px] w-[18px]" />
        </Link>

        {/* Quick Chat Link */}
        <Link
          to="/chat"
          className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors focus-ring"
          title="Team Messages"
        >
          <MessageSquare className="h-[18px] w-[18px]" />
        </Link>

        {/* Notifications */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => {
              setShowNotifs((s) => !s)
              setShowProfile(false)
            }}
            className={classNames(
              'relative h-9 w-9 rounded-xl flex items-center justify-center transition-colors focus-ring',
              showNotifs
                ? 'bg-slate-100 dark:bg-white/10 text-signal'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
            )}
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute 1.5 -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-gradient-to-r from-rose to-pink-500 text-white text-[10px] flex items-center justify-center font-bold shadow-sm shadow-rose/40 animate-pulse-subtle">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-84 card-glass p-2 z-30 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200/60 dark:border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <Bell className="h-4 w-4 text-signal" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-signal hover:underline font-medium focus-ring">
                      Mark read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={clearAll} className="text-xs text-slate-400 hover:text-rose transition-colors focus-ring">
                      Clear all
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04]">
                {notifications.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <CheckCircle2 className="h-8 w-8 text-teal mx-auto mb-2 opacity-80" />
                    No new notifications
                  </div>
                )}
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => clearOne(n.id)}
                    className={classNames(
                      'p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer transition-colors relative group',
                      !n.is_read && 'bg-signal/[0.03] dark:bg-signal/[0.06]'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-signal">System Alert</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          clearOne(n.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose transition-opacity"
                        title="Dismiss"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{n.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">{n.message}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all focus-ring"
          aria-label="Toggle theme"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-[18px] w-[18px] text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="h-[18px] w-[18px] text-slate-600 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* User Avatar Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile((s) => !s)
              setShowNotifs(false)
            }}
            className="relative h-9 w-9 rounded-xl flex items-center justify-center transition-all focus-ring ring-2 ring-white dark:ring-slate-800"
            aria-label="Account menu"
          >
            <Avatar src={profile?.photo_url} name={profile?.displayName || user?.email || 'User'} size={34} />
          </button>
          {showProfile && (
            <div className="absolute right-0 mt-2 w-68 card-glass p-2 z-30 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-3 p-2.5 border-b border-slate-200/60 dark:border-white/[0.06] mb-1.5 bg-slate-50/50 dark:bg-white/[0.02] rounded-xl">
                <Avatar src={profile?.photo_url} name={profile?.displayName || user?.email || 'User'} size={40} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {profile?.displayName || user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {profile?.email || user?.email || 'user@orgsynq.ai'}
                  </p>
                </div>
              </div>

              <div className="px-2.5 py-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                {isFirebaseConfigured ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal shrink-0" />
                    <span>Connected to live database</span>
                  </>
                ) : (
                  <>
                    <Database className="h-3.5 w-3.5 text-amber shrink-0" />
                    <span>Running in demo mode</span>
                  </>
                )}
              </div>

              <Link
                to="/settings"
                onClick={() => setShowProfile(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors focus-ring"
              >
                <Settings className="h-4 w-4 text-slate-400" /> Settings
              </Link>
              <button
                onClick={async () => {
                  setShowProfile(false)
                  await signOut()
                  navigate('/login')
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose hover:bg-rose/10 transition-colors focus-ring"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
