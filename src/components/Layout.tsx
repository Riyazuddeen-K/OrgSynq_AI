import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { Menu, X, Share2, LayoutDashboard, Users, Fingerprint, FlaskConical, BarChart3, Sparkles, Wand2, UserSquare2, GraduationCap, Briefcase, Trophy, FolderKanban, Settings, User, Calendar, MessageSquare } from 'lucide-react'
import Sidebar from './Sidebar'
import Logo from './Logo'
import FirebaseSetupBanner from './FirebaseSetupBanner'
import AskOrgSynqChat from './AskOrgSynqChat'
import CommandPalette from './CommandPalette'
import { classNames } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { LoadingState } from './Primitives'
import Landing from '../pages/Landing'

const ADMIN_MOBILE_NAV_ITEMS = [
  { to: '/', label: 'Command Center', icon: LayoutDashboard, end: true },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/digital-twins', label: 'Digital Twins', icon: Fingerprint },
  { to: '/simulation-engine', label: 'Simulation Engine', icon: FlaskConical },
  { to: '/prediction', label: 'Prediction', icon: Wand2 },
  { to: '/placement', label: 'Placement', icon: UserSquare2 },
  { to: '/projects', label: 'Projects', icon: Briefcase },
  { to: '/learning', label: 'Learning', icon: GraduationCap },
  { to: '/recognition', label: 'Recognition', icon: Trophy },
  { to: '/analytics-hub', label: 'Analytics Hub', icon: BarChart3 },
  { to: '/org-network', label: 'Org Network', icon: Share2 },
  { to: '/ai-decision-support', label: 'AI Decision Support', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: Settings }
]

const EMPLOYEE_MOBILE_NAV_ITEMS = [
  { to: '/my-profile', label: 'My Profile', icon: User, end: true },
  { to: '/calendar', label: 'Company Calendar', icon: Calendar },
  { to: '/chat', label: 'Team Chat', icon: MessageSquare },
  { to: '/my-team', label: 'My Team', icon: Users },
  { to: '/my-projects', label: 'My Projects', icon: FolderKanban },
  { to: '/recognition', label: 'Recognition', icon: Trophy },
  { to: '/learning', label: 'Learning', icon: GraduationCap },
  { to: '/settings', label: 'Settings', icon: Settings }
]

// Routes an "employee" role is allowed to see. Anything else redirects to My Profile.
const EMPLOYEE_ALLOWED_PATHS = ['/my-profile', '/my-team', '/my-projects', '/recognition', '/learning', '/settings', '/calendar', '/chat']

export default function Layout() {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    // The exact root path is public — signed-out visitors see the marketing
    // homepage there instead of being bounced to /login. Any other app path
    // still requires signing in first (deep-linking to e.g. /employees while
    // signed out sends you to log in, not the homepage).
    if (!loading && !user && location.pathname !== '/') {
      navigate('/login')
    }
  }, [user, loading, navigate, location.pathname])

  useEffect(() => {
    if (!loading && user && role === 'employee' && !EMPLOYEE_ALLOWED_PATHS.includes(location.pathname)) {
      navigate('/my-profile', { replace: true })
    }
  }, [loading, user, role, location.pathname, navigate])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (role === 'employee') return
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setPaletteOpen((s) => !s)
    }
  }, [role])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
        <LoadingState label="Authenticating..." />
      </div>
    )
  }

  if (!user) {
    // Mid-redirect to /login for any other path; the exact root renders
    // the public homepage instead, with no sidebar/topbar chrome.
    return location.pathname === '/' ? <Landing /> : null
  }

  const mobileNavItems = role === 'employee' ? EMPLOYEE_MOBILE_NAV_ITEMS : ADMIN_MOBILE_NAV_ITEMS

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-light dark:bg-surface-dark relative transition-colors duration-200">
      {/* Ambient background glows for inner pages */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 right-1/4 w-96 h-96 rounded-full bg-signal/10 dark:bg-signal/5 blur-[120px]" />
        <div className="absolute bottom-0 right-10 w-96 h-96 rounded-full bg-teal/10 dark:bg-teal/5 blur-[130px]" />
      </div>

      <Sidebar />

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 card-glass p-5 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/60 dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <Logo size={28} className="rounded-lg" />
                <span className="font-display font-bold text-sm text-slate-900 dark:text-white">OrgSynq AI</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white focus-ring"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1 overflow-y-auto scrollbar-thin flex-1">
              {mobileNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    classNames(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-signal/15 text-signal font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                    )
                  }
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <button
          onClick={() => setDrawerOpen(true)}
          className="md:hidden fixed z-30 top-3.5 left-3.5 h-9 w-9 rounded-xl bg-white/90 dark:bg-surface-darkcard/90 border border-slate-200 dark:border-white/[0.1] backdrop-blur-md flex items-center justify-center shadow-md focus-ring"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-slate-700 dark:text-slate-200" />
        </button>
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <FirebaseSetupBanner />
          <Outlet />
        </main>
      </div>

      {/* Global overlays */}
      {role !== 'employee' && <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />}
      <AskOrgSynqChat />
    </div>
  )
}
