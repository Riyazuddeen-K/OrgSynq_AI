import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LayoutDashboard, Users, Layers, BarChart3, Network, Brain, Settings, GitCompare, User, Wand2, X } from 'lucide-react'
import { useEmployees } from '../hooks/useEmployees'
import { useInsights } from '../hooks/useInsights'
import { classNames } from '../lib/utils'

interface PaletteItem {
  id: string
  label: string
  sublabel?: string
  category: 'Pages' | 'Employees' | 'Insights'
  icon: React.ReactNode
  action: () => void
}

const PAGES = [
  { id: 'page-home', label: 'Command Center', sublabel: 'Workforce intelligence dashboard', path: '/', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'page-employees', label: 'Employees', sublabel: 'People directory & search', path: '/employees', icon: <Users className="h-4 w-4" /> },
  { id: 'page-twins', label: 'Digital Twins', sublabel: 'AI cognitive profiles', path: '/digital-twins', icon: <Layers className="h-4 w-4" /> },
  { id: 'page-sim', label: 'Simulation Engine', sublabel: 'Predictive scenario modeling', path: '/simulation-engine', icon: <GitCompare className="h-4 w-4" /> },
  { id: 'page-prediction', label: 'Prediction', sublabel: 'AI team formation & allocation', path: '/prediction', icon: <Wand2 className="h-4 w-4" /> },
  { id: 'page-analytics', label: 'Analytics Hub', sublabel: 'Workforce analytics', path: '/analytics-hub', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'page-network', label: 'Org Network', sublabel: 'Collaboration graph', path: '/org-network', icon: <Network className="h-4 w-4" /> },
  { id: 'page-ai', label: 'AI Decision Support', sublabel: 'Insights & recommendations', path: '/ai-decision-support', icon: <Brain className="h-4 w-4" /> },
  { id: 'page-settings', label: 'Settings', sublabel: 'App configuration', path: '/settings', icon: <Settings className="h-4 w-4" /> },
  { id: 'page-profile', label: 'My Profile', sublabel: 'Employee self-service', path: '/my-profile', icon: <User className="h-4 w-4" /> }
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate()
  const { employees } = useEmployees()
  const { insights } = useInsights()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.toLowerCase().trim()

    const pages = PAGES.filter(
      (p) => !q || p.label.toLowerCase().includes(q) || p.sublabel?.toLowerCase().includes(q)
    ).map((p) => ({
      id: p.id,
      label: p.label,
      sublabel: p.sublabel,
      category: 'Pages' as const,
      icon: p.icon,
      action: () => { navigate(p.path); onClose() }
    }))

    const empItems = employees
      .filter(
        (e) =>
          !q ||
          e.name.toLowerCase().includes(q) ||
          e.title.toLowerCase().includes(q) ||
          e.department?.name.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map((e) => ({
        id: `emp-${e.id}`,
        label: e.name,
        sublabel: `${e.title} · ${e.department?.name}`,
        category: 'Employees' as const,
        icon: <Users className="h-4 w-4" />,
        action: () => { navigate(`/employees/${e.id}`); onClose() }
      }))

    const insightItems = insights
      .filter((i) => !q || i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
      .slice(0, 4)
      .map((i) => ({
        id: `ins-${i.id}`,
        label: i.title,
        sublabel: `${i.severity} · ${i.type}`,
        category: 'Insights' as const,
        icon: <Brain className="h-4 w-4" />,
        action: () => { navigate('/ai-decision-support'); onClose() }
      }))

    return [...pages, ...empItems, ...insightItems]
  }, [query, employees, insights, navigate, onClose])

  // Group items by category
  const grouped = useMemo(() => {
    const groups: Record<string, PaletteItem[]> = {}
    items.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    })
    return groups
  }, [items])

  // Flat list for keyboard navigation
  const flatItems = useMemo(() => items, [items])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      flatItems[activeIndex]?.action()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  let flatIndex = 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-xl card overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-lightborder dark:border-surface-darkborder">
          <Search className="h-5 w-5 text-black/40 dark:text-white/40 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, employees, insights…"
            className="flex-1 bg-transparent text-base focus:outline-none placeholder:text-black/35 dark:placeholder:text-white/30"
          />
          <button onClick={onClose} className="text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60">
            <X className="h-4 w-4" />
          </button>
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.06] text-[10px] font-mono text-black/40 dark:text-white/40">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[420px] overflow-y-auto py-2">
          {items.length === 0 && (
            <p className="text-sm text-black/40 dark:text-white/40 text-center py-10">No results for "{query}"</p>
          )}

          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category}>
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-black/35 dark:text-white/30">
                {category}
              </p>
              {catItems.map((item) => {
                const thisIndex = flatIndex++
                const isActive = thisIndex === activeIndex
                return (
                  <button
                    key={item.id}
                    id={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setActiveIndex(thisIndex)}
                    className={classNames(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      isActive
                        ? 'bg-signal/10 text-signal'
                        : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                    )}
                  >
                    <span className={classNames('shrink-0', isActive ? 'text-signal' : 'text-black/40 dark:text-white/40')}>
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      {item.sublabel && (
                        <p className="text-xs text-black/45 dark:text-white/40 truncate">{item.sublabel}</p>
                      )}
                    </div>
                    {isActive && (
                      <kbd className="ml-auto shrink-0 px-1.5 py-0.5 rounded bg-signal/15 text-signal text-[10px] font-mono">
                        ↵
                      </kbd>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-surface-lightborder dark:border-surface-darkborder flex items-center gap-3 text-[10px] text-black/35 dark:text-white/30">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
