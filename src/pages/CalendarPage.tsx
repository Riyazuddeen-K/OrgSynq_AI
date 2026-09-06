import { useMemo, useState } from 'react'
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Clock,
  MapPin,
  Video,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  ExternalLink,
  X
} from 'lucide-react'
import Topbar from '../components/Topbar'
import { Badge, LoadingState } from '../components/Primitives'
import { useCalendarEvents, type NewCalendarEventInput } from '../hooks/useCalendarEvents'
import { useAuth } from '../context/AuthContext'
import type { CalendarEvent, CalendarEventCategory } from '../lib/types'
import { classNames } from '../lib/utils'

const CATEGORY_COLORS: Record<CalendarEventCategory, { bg: string; text: string; dot: string }> = {
  'Town Hall': { bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500' },
  Meeting: { bg: 'bg-signal/15', text: 'text-signal', dot: 'bg-signal' },
  Holiday: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  Training: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  'Performance Review': { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  Deadline: { bg: 'bg-rose/15', text: 'text-rose', dot: 'bg-rose' },
  'Team Event': { bg: 'bg-teal/15', text: 'text-teal', dot: 'bg-teal' }
}

const CATEGORIES: CalendarEventCategory[] = [
  'Town Hall',
  'Meeting',
  'Holiday',
  'Training',
  'Performance Review',
  'Deadline',
  'Team Event'
]

export default function CalendarPage() {
  const { events, loading, addEvent, deleteEvent } = useCalendarEvents()
  const { role, profile } = useAuth()
  const isAdmin = role === 'admin'

  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  // Form state
  const [formData, setFormData] = useState<NewCalendarEventInput>({
    title: '',
    description: '',
    event_date: new Date().toISOString().slice(0, 10),
    start_time: '10:00',
    end_time: '11:00',
    category: 'Meeting',
    audience: 'All',
    location_or_link: ''
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (selectedCategory !== 'All' && evt.category !== selectedCategory) return false
      return true
    })
  }, [events, selectedCategory])

  // Calendar grid calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  function handlePrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  function handleNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  async function handleAddEventSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title.trim()) return
    await addEvent(formData, profile?.displayName || 'Admin')
    setShowAddModal(false)
    setFormData({
      title: '',
      description: '',
      event_date: new Date().toISOString().slice(0, 10),
      start_time: '10:00',
      end_time: '11:00',
      category: 'Meeting',
      audience: 'All',
      location_or_link: ''
    })
  }

  return (
    <div>
      <Topbar
        title="Company Calendar"
        subtitle={
          isAdmin
            ? 'Schedule company events, all-hands town halls, and manage team schedules'
            : 'Explore scheduled company all-hands, team meetings, holidays, and workshops'
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.06] p-1 rounded-xl border border-slate-200/70 dark:border-white/[0.06]">
              <button
                onClick={handlePrevMonth}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 transition-colors focus-ring"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-sm font-bold text-slate-900 dark:text-white min-w-[140px] text-center">
                {monthName}
              </span>
              <button
                onClick={handleNextMonth}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 transition-colors focus-ring"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.06] p-1 rounded-xl border border-slate-200/70 dark:border-white/[0.06]">
              <button
                onClick={() => setViewMode('grid')}
                className={classNames(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus-ring',
                  viewMode === 'grid'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                Month Grid
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={classNames(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus-ring',
                  viewMode === 'agenda'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                Agenda List
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
              <button
                onClick={() => setSelectedCategory('All')}
                className={classNames(
                  'px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors focus-ring',
                  selectedCategory === 'All'
                    ? 'bg-signal text-white'
                    : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                )}
              >
                All Events
              </button>
              {CATEGORIES.slice(0, 4).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={classNames(
                    'px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus-ring',
                    selectedCategory === cat
                      ? 'bg-signal text-white'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-signal text-white text-xs font-semibold hover:bg-signal/90 shadow-sm transition-all focus-ring shrink-0"
              >
                <Plus className="h-4 w-4" /> Add Event
              </button>
            )}
          </div>
        </div>

        {loading && <LoadingState label="Loading calendar events…" />}

        {!loading && viewMode === 'grid' && (
          <div className="card overflow-hidden shadow-card border border-slate-200/80 dark:border-white/[0.08]">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-white/[0.08] text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-3 bg-slate-50/50 dark:bg-white/[0.02]">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200/70 dark:divide-white/[0.06]">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[110px] p-2 bg-slate-50/20 dark:bg-transparent" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                const dayEvents = filteredEvents.filter((e) => e.event_date === dateStr)
                const isToday = new Date().toISOString().slice(0, 10) === dateStr

                return (
                  <div
                    key={dayNum}
                    onClick={() => {
                      if (isAdmin && dayEvents.length === 0) {
                        setFormData((prev) => ({ ...prev, event_date: dateStr }))
                        setShowAddModal(true)
                      }
                    }}
                    className={classNames(
                      'min-h-[110px] p-2 transition-colors flex flex-col justify-between group',
                      isToday ? 'bg-signal/[0.03] dark:bg-signal/[0.05]' : 'hover:bg-slate-50/60 dark:hover:bg-white/[0.02]',
                      isAdmin && 'cursor-pointer'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={classNames(
                          'h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold',
                          isToday
                            ? 'bg-signal text-white shadow-sm font-bold'
                            : 'text-slate-700 dark:text-slate-300'
                        )}
                      >
                        {dayNum}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setFormData((prev) => ({ ...prev, event_date: dateStr }))
                            setShowAddModal(true)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-signal rounded transition-opacity"
                          title="Add event on this date"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1 mt-1 overflow-y-auto max-h-[80px] scrollbar-thin">
                      {dayEvents.map((evt) => {
                        const style = CATEGORY_COLORS[evt.category] || {
                          bg: 'bg-signal/15',
                          text: 'text-signal',
                          dot: 'bg-signal'
                        }
                        return (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEvent(evt)
                            }}
                            className={classNames(
                              'px-2 py-1 rounded-md text-[11px] font-medium truncate flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity',
                              style.bg,
                              style.text
                            )}
                            title={`${evt.title} (${evt.start_time || 'All day'})`}
                          >
                            <span className={classNames('h-1.5 w-1.5 rounded-full shrink-0', style.dot)} />
                            <span className="truncate">{evt.title}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Agenda List View */}
        {!loading && viewMode === 'agenda' && (
          <div className="space-y-3">
            {filteredEvents.length === 0 && (
              <div className="card p-12 text-center">
                <CalendarIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800 dark:text-slate-200">No events scheduled</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isAdmin ? 'Click "+ Add Event" to publish an event.' : 'Check back later for company updates.'}
                </p>
              </div>
            )}

            {filteredEvents.map((evt) => {
              const style = CATEGORY_COLORS[evt.category] || {
                bg: 'bg-signal/15',
                text: 'text-signal',
                dot: 'bg-signal'
              }
              const isPast = new Date(evt.event_date).getTime() < new Date().setHours(0, 0, 0, 0)

              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="card p-5 hover:border-signal/40 cursor-pointer transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.08] shrink-0 text-center">
                      <span className="text-[10px] font-bold uppercase text-signal">
                        {new Date(evt.event_date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-lg font-display font-bold text-slate-900 dark:text-white leading-none">
                        {new Date(evt.event_date).getDate()}
                      </span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={classNames('px-2.5 py-0.5 rounded-full text-[11px] font-bold', style.bg, style.text)}>
                          {evt.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                          Audience: {evt.audience}
                        </span>
                        {isPast && (
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Concluded</span>
                        )}
                      </div>
                      <p className="font-display font-semibold text-slate-900 dark:text-white text-base truncate">
                        {evt.title}
                      </p>
                      {evt.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{evt.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                        {evt.start_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" /> {evt.start_time} - {evt.end_time || 'End'}
                          </span>
                        )}
                        {evt.location_or_link && (
                          <span className="flex items-center gap-1 truncate max-w-xs">
                            {evt.location_or_link.startsWith('http') ? (
                              <Video className="h-3 w-3 text-signal" />
                            ) : (
                              <MapPin className="h-3 w-3 text-slate-400" />
                            )}
                            <span className="truncate">{evt.location_or_link}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {evt.location_or_link?.startsWith('http') && (
                      <a
                        href={evt.location_or_link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-signal/15 text-signal text-xs font-semibold hover:bg-signal/25 transition-colors focus-ring"
                      >
                        <Video className="h-3.5 w-3.5" /> Join Link
                      </a>
                    )}
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Remove event "${evt.title}"?`)) deleteEvent(evt.id, evt.title)
                        }}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose hover:bg-rose/10 transition-colors focus-ring"
                        title="Delete event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-glass p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={classNames('px-2.5 py-0.5 rounded-full text-xs font-bold', CATEGORY_COLORS[selectedEvent.category]?.bg, CATEGORY_COLORS[selectedEvent.category]?.text)}>
                  {selectedEvent.category}
                </span>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mt-2">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedEvent.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300">{selectedEvent.description}</p>
            )}

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] space-y-2 text-xs border border-slate-200/60 dark:border-white/[0.06]">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CalendarIcon className="h-4 w-4 text-signal shrink-0" />
                <span className="font-medium">
                  {new Date(selectedEvent.event_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              {selectedEvent.start_time && (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Clock className="h-4 w-4 text-signal shrink-0" />
                  <span>{selectedEvent.start_time} — {selectedEvent.end_time || 'TBD'}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Users className="h-4 w-4 text-signal shrink-0" />
                <span>Audience: <strong>{selectedEvent.audience}</strong></span>
              </div>
              {selectedEvent.location_or_link && (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <MapPin className="h-4 w-4 text-signal shrink-0" />
                  <span className="truncate">{selectedEvent.location_or_link}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/[0.08]">
              {isAdmin ? (
                <button
                  onClick={() => {
                    deleteEvent(selectedEvent.id, selectedEvent.title)
                    setSelectedEvent(null)
                  }}
                  className="text-xs font-semibold text-rose hover:underline"
                >
                  Delete Event
                </button>
              ) : <span />}

              <div className="flex items-center gap-2">
                {selectedEvent.location_or_link?.startsWith('http') && (
                  <a
                    href={selectedEvent.location_or_link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-signal text-white text-xs font-semibold hover:bg-signal/90 shadow-sm"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open Link
                  </a>
                )}
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-glass p-6 max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-signal/15 text-signal">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white">Schedule New Event</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddEventSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Event Title *
                </label>
                <input
                  required
                  placeholder="e.g. Q4 All-Hands Town Hall"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as CalendarEventCategory })}
                    className="input text-xs"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Audience
                  </label>
                  <select
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value as typeof formData.audience })}
                    className="input text-xs"
                  >
                    <option value="All">All Organization</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Admins">Admins Only</option>
                    <option value="Remote">Remote Workers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Meeting Link / Location
                  </label>
                  <input
                    placeholder="https://meet.google.com/..."
                    value={formData.location_or_link}
                    onChange={(e) => setFormData({ ...formData, location_or_link: e.target.value })}
                    className="input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Agenda
                </label>
                <textarea
                  rows={2}
                  placeholder="Key talking points or instructions for attendees..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-signal text-white text-xs font-semibold hover:bg-signal/90 shadow-sm"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
