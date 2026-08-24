import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, Bell, Sun, Moon, CircleAlert, Settings, LogOut, Database, CheckCircle2, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../hooks/useNotifications'
import { isFirebaseConfigured } from '../lib/firebaseClient'
import { timeAgo, classNames } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

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
    <header className="relative z-20 h-16 shrink-0 border-b border-surface-lightborder dark:border-surface-darkborder bg-surface-lightcard/80 dark:bg-surface-darkcard/80 backdrop-blur px-4 md:px-8 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-lg md:text-xl font-display font-semibold truncate">{title}</h1>
        {subtitle && <p className="text-xs text-black/50 dark:text-white/40 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <form onSubmit={onSearchSubmit} className="hidden lg:block relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees, insights..."
            className="w-64 pl-9 pr-3 py-2 rounded-lg text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-transparent focus:border-signal/50 focus-ring placeholder:text-black/40 dark:placeholder:text-white/30"
          />
        </form>

        {!isFirebaseConfigured && (
          <span
            title="Connect a Firebase project to load live data. See .env.example"
            className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-full bg-amber/15 text-amber"
          >
            <CircleAlert className="h-3.5 w-3.5" /> Demo mode
          </span>
        )}

        <div className="relative" ref={panelRef}>
          <button
            onClick={() => {
              setShowNotifs((s) => !s)
              setShowProfile(false)
            }}
            className="relative h-9 w-9 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 focus-ring"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-rose text-white text-[10px] flex items-center justify-center font-semibold">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 card p-2 z-30">
              <div className="flex items-center justify-between px-2 py-1.5">
                <p className="text-sm font-semibold">Notifications</p>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-signal hover:underline focus-ring">
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-black/45 dark:text-white/40 hover:text-rose hover:underline focus-ring"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin divide-y divide-surface-lightborder dark:divide-surface-darkborder">
                {notifications.length === 0 && (
                  <p className="text-xs text-black/50 dark:text-white/40 px-2 py-4 text-center">You're all caught up.</p>
                )}
                {notifications.map((n) => (
                  <div key={n.id} className={classNames('group relative px-2 py-2.5 pr-7', !n.is_read && 'bg-signal/5')}>
                    <button
                      onClick={() => clearOne(n.id)}
                      className="absolute top-2 right-1.5 h-5 w-5 rounded-md items-center justify-center text-black/30 dark:text-white/30 hover:text-rose hover:bg-rose/10 hidden group-hover:flex focus-ring"
                      aria-label="Dismiss notification"
                      title="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-black/50 dark:text-white/40 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-black/35 dark:text-white/30 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 focus-ring"
          aria-label="Toggle theme"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile((s) => !s)
              setShowNotifs(false)
            }}
            className="h-9 w-9 rounded-full bg-signal text-white flex items-center justify-center text-sm font-semibold shrink-0 focus-ring"
            aria-label="Account menu"
          >
            {profile?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'}
          </button>
          {showProfile && (
            <div className="absolute right-0 mt-2 w-64 card p-2 z-30">
              <div className="flex items-center gap-3 px-2 py-2.5 border-b border-surface-lightborder dark:border-surface-darkborder mb-1.5">
                <div className="h-9 w-9 rounded-full bg-signal text-white flex items-center justify-center text-sm font-semibold shrink-0">
                  {profile?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{profile?.displayName || user?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-black/45 dark:text-white/40 truncate">{profile?.email || user?.email || 'user@orgsynq.ai'}</p>
                </div>
              </div>

              <div className="px-2 py-2 flex items-center gap-2 text-xs text-black/50 dark:text-white/40">
                {isFirebaseConfigured ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal shrink-0" /> Connected to Firebase
                  </>
                ) : (
                  <>
                    <Database className="h-3.5 w-3.5 shrink-0" /> Running in demo mode
                  </>
                )}
              </div>

              <Link
                to="/settings"
                onClick={() => setShowProfile(false)}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm hover:bg-black/5 dark:hover:bg-white/5 focus-ring"
              >
                <Settings className="h-4 w-4" /> Settings
              </Link>
              <button
                onClick={async () => {
                  setShowProfile(false)
                  await signOut()
                  navigate('/login')
                }}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 focus-ring"
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
