import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { Menu, X, Share2, LayoutDashboard, Users, Fingerprint, FlaskConical, BarChart3, Sparkles, Wand2, UserSquare2, GraduationCap, Briefcase, Trophy, FolderKanban, Settings, User } from 'lucide-react'
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
  { to: '/my-team', label: 'My Team', icon: Users },
  { to: '/my-projects', label: 'My Projects', icon: FolderKanban },
  { to: '/recognition', label: 'Recognition', icon: Trophy },
  { to: '/learning', label: 'Learning', icon: GraduationCap },
  { to: '/settings', label: 'Settings', icon: Settings }
]

// Routes an "employee" role is allowed to see. Anything else redirects to My Profile.
const EMPLOYEE_ALLOWED_PATHS = ['/my-profile', '/my-team', '/my-projects', '/recognition', '/learning', '/settings']

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
    <div className="flex h-screen w-full overflow-hidden bg-surface-light dark:bg-surface-dark">
      <Sidebar />

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-surface-lightcard dark:bg-surface-darkcard p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Logo size={32} className="rounded-lg" />
                <span className="font-display font-semibold">OrgSynq AI</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="h-8 w-8 flex items-center justify-center focus-ring">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {mobileNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    classNames(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                      isActive ? 'bg-signal/10 text-signal' : 'text-black/60 dark:text-white/60'
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

      <div className="flex-1 flex flex-col min-w-0">
        <button
          onClick={() => setDrawerOpen(true)}
          className="md:hidden fixed z-30 top-3 left-3 h-9 w-9 rounded-lg bg-surface-lightcard dark:bg-surface-darkcard border border-surface-lightborder dark:border-surface-darkborder flex items-center justify-center shadow-card"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
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
