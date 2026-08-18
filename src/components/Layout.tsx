import { Outlet, NavLink } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, Share2, LayoutDashboard, Users, Fingerprint, FlaskConical, BarChart3, Sparkles, Settings } from 'lucide-react'
import Sidebar from './Sidebar'
import FirebaseSetupBanner from './FirebaseSetupBanner'
import { classNames } from '../lib/utils'

const MOBILE_NAV_ITEMS = [
  { to: '/', label: 'Command Center', icon: LayoutDashboard, end: true },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/digital-twins', label: 'Digital Twins', icon: Fingerprint },
  { to: '/simulation-engine', label: 'Simulation Engine', icon: FlaskConical },
  { to: '/analytics-hub', label: 'Analytics Hub', icon: BarChart3 },
  { to: '/org-network', label: 'Org Network', icon: Share2 },
  { to: '/ai-decision-support', label: 'AI Decision Support', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: Settings }
]

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)

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
                <div className="h-8 w-8 rounded-lg bg-signal flex items-center justify-center">
                  <Share2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-display font-semibold">OrgSynq AI</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="h-8 w-8 flex items-center justify-center focus-ring">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {MOBILE_NAV_ITEMS.map((item) => (
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
    </div>
  )
}
