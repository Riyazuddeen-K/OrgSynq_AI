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
  GraduationCap,
  Briefcase,
  Trophy,
  FolderKanban,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Calendar,
  MessageSquare,
  ShieldAlert
} from 'lucide-react'
import { useState } from 'react'
import Logo from './Logo'
import Avatar from './Avatar'
import { classNames } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

interface NavGroup {
  label: string
  items: Array<{
    to: string
    label: string
    icon: typeof LayoutDashboard
    end?: boolean
    badge?: string
  }>
}

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Command Center', icon: LayoutDashboard, end: true },
      { to: '/employees', label: 'Employees', icon: Users },
      { to: '/calendar', label: 'Company Calendar', icon: Calendar, badge: 'New' },
      { to: '/chat', label: 'Team Messages', icon: MessageSquare },
      { to: '/org-network', label: 'Org Network', icon: Share2 }
    ]
  },
  {
    label: 'AI & Intelligence',
    items: [
      { to: '/digital-twins', label: 'Digital Twins', icon: Fingerprint, badge: 'Live' },
      { to: '/ai-decision-support', label: 'AI Decision Support', icon: Sparkles },
      { to: '/prediction', label: 'Prediction', icon: Wand2 },
      { to: '/simulation-engine', label: 'Simulation Engine', icon: FlaskConical }
    ]
  },
  {
    label: 'Workforce Operations',
    items: [
      { to: '/projects', label: 'Projects', icon: Briefcase },
      { to: '/internships', label: 'Internship Candidates', icon: GraduationCap, badge: 'Pipeline' },
      { to: '/placement', label: 'Placement', icon: UserSquare2 },
      { to: '/learning', label: 'Learning', icon: GraduationCap },
      { to: '/recognition', label: 'Recognition', icon: Trophy },
      { to: '/analytics-hub', label: 'Analytics Hub', icon: BarChart3 }
    ]
  },
  {
    label: 'Governance & Security',
    items: [
      { to: '/audit-log', label: 'Admin Audit Log', icon: ShieldAlert, badge: 'Super Admin' }
    ]
  }
]

const EMPLOYEE_NAV_GROUPS: NavGroup[] = [
  {
    label: 'My Workspace',
    items: [
      { to: '/my-profile', label: 'My Profile', icon: User, end: true },
      { to: '/calendar', label: 'Company Calendar', icon: Calendar, badge: 'Events' },
      { to: '/chat', label: 'Team Chat', icon: MessageSquare },
      { to: '/my-team', label: 'My Team', icon: Users },
      { to: '/my-projects', label: 'My Projects', icon: FolderKanban },
      { to: '/recognition', label: 'Recognition', icon: Trophy },
      { to: '/learning', label: 'Learning', icon: GraduationCap }
    ]
  }
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { role, profile, user } = useAuth()
  const groups = role === 'employee' ? EMPLOYEE_NAV_GROUPS : ADMIN_NAV_GROUPS

  return (
    <aside
      className={classNames(
        'hidden md:flex flex-col shrink-0 border-r border-slate-200/80 dark:border-white/[0.08] bg-surface-lightcard/95 dark:bg-surface-darkcard/95 backdrop-blur-xl transition-all duration-300 z-20 select-none',
        collapsed ? 'w-[78px]' : 'w-[272px]'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200/80 dark:border-white/[0.08]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative p-1.5 rounded-xl bg-gradient-to-tr from-signal/20 via-signal/10 to-teal/20 ring-1 ring-black/5 dark:ring-white/10 shadow-sm shrink-0">
            <Logo size={26} className="rounded-lg" />
          </div>
          {!collapsed && (
            <div className="leading-tight min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm tracking-tight text-slate-900 dark:text-white">OrgSynq</span>
                <span className="px-1.5 py-0.2 rounded-md bg-signal/15 text-signal text-[10px] font-bold tracking-wider">AI</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Workforce Intelligence</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors focus-ring"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 py-3 px-3 space-y-4 overflow-y-auto scrollbar-thin">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {group.label && !collapsed && (
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.label}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  classNames(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 focus-ring',
                    isActive
                      ? 'bg-gradient-to-r from-signal/15 to-signal/5 text-signal dark:text-signal-light font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white hover:translate-x-0.5'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={classNames(
                        'absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-signal transition-all duration-200',
                        isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50'
                      )}
                    />
                    <item.icon
                      className={classNames(
                        'h-[18px] w-[18px] shrink-0 transition-transform duration-150',
                        isActive ? 'text-signal scale-110' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                      )}
                    />
                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-teal/15 text-teal uppercase tracking-wider">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom User / Settings Card */}
      <div className="p-3 border-t border-slate-200/80 dark:border-white/[0.08] space-y-2 bg-slate-50/50 dark:bg-black/20">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            classNames(
              'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-ring',
              isActive
                ? 'bg-signal/15 text-signal font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
            )
          }
        >
          <Settings className="h-[18px] w-[18px] shrink-0 text-slate-400" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        {!collapsed ? (
          <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.05] flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <Avatar
                  name={profile?.displayName || user?.email?.split('@')[0] || 'User'}
                  src={profile?.photo_url}
                  size={32}
                />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-teal ring-2 ring-white dark:ring-surface-darkcard" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate text-slate-900 dark:text-white">
                  {profile?.displayName || user?.email?.split('@')[0] || 'Admin User'}
                </p>
                <div className="flex items-center gap-1 text-[10px]">
                  {role === 'superadmin' ? (
                    <span className="inline-flex items-center gap-0.5 text-purple-600 dark:text-purple-400 font-bold">
                      <ShieldCheck className="h-3 w-3" /> Super Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-slate-400 capitalize">
                      <ShieldCheck className="h-3 w-3 text-signal" /> {role || 'Admin'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors"
              title="Collapse"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="flex w-full items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors focus-ring"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  )
}
