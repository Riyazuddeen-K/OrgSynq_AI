import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Fingerprint,
  FlaskConical,
  BarChart3,
  Share2,
  Sparkles,
  Wand2,
  UserSquare2,
  Settings,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import Logo from './Logo'
import { classNames } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

const ADMIN_NAV_ITEMS = [
  { to: '/', label: 'Command Center', icon: LayoutDashboard, end: true },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/digital-twins', label: 'Digital Twins', icon: Fingerprint },
  { to: '/simulation-engine', label: 'Simulation Engine', icon: FlaskConical },
  { to: '/prediction', label: 'Prediction', icon: Wand2 },
  { to: '/placement', label: 'Placement', icon: UserSquare2 },
  { to: '/analytics-hub', label: 'Analytics Hub', icon: BarChart3 },
  { to: '/org-network', label: 'Org Network', icon: Share2 },
  { to: '/ai-decision-support', label: 'AI Decision Support', icon: Sparkles }
]

const EMPLOYEE_NAV_ITEMS = [{ to: '/my-profile', label: 'My Profile', icon: User, end: true }]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { role } = useAuth()
  const navItems = role === 'employee' ? EMPLOYEE_NAV_ITEMS : ADMIN_NAV_ITEMS

  return (
    <aside
      className={classNames(
        'hidden md:flex flex-col shrink-0 border-r border-surface-lightborder dark:border-surface-darkborder bg-surface-lightcard dark:bg-surface-darkcard transition-all duration-200',
        collapsed ? 'w-[76px]' : 'w-[264px]'
      )}
    >
      <div className="flex items-center gap-3 px-5 h-16 border-b border-surface-lightborder dark:border-surface-darkborder">
        <Logo size={32} className="rounded-lg shrink-0" />
        {!collapsed && (
          <div className="leading-tight">
            <p className="font-display font-semibold text-sm">OrgSynq AI</p>
            <p className="text-[11px] text-black/50 dark:text-white/40">Workforce Intelligence</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              classNames(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-ring',
                isActive
                  ? 'bg-signal/10 text-signal dark:bg-signal/15'
                  : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={classNames(
                    'absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-signal transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-surface-lightborder dark:border-surface-darkborder space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            classNames(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-ring',
              isActive
                ? 'bg-signal/10 text-signal'
                : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'
            )
          }
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-black/50 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5 focus-ring"
        >
          {collapsed ? <ChevronRight className="h-[18px] w-[18px]" /> : <ChevronLeft className="h-[18px] w-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
