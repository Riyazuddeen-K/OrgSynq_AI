import { useMemo, useState } from 'react'
import {
  HeartPulse, Flame, PlaneTakeoff, ClipboardList, Users, Zap, Rocket, Building2,
  Activity, UserPlus, UserMinus, FlaskConical, Lightbulb, CheckCircle2, SmilePlus, AlertTriangle, Pencil, Sparkles,
  FolderPlus, FolderCog, FolderMinus, MessageCircle, UserSquare2, Trash2, GraduationCap, Briefcase, Award, Trophy
} from 'lucide-react'
import Topbar from '../components/Topbar'
import StatCard from '../components/StatCard'
import DeptBarChart from '../components/charts/DeptBarChart'
import HealthAreaChart from '../components/charts/HealthAreaChart'
import Avatar from '../components/Avatar'
import { LoadingState, ErrorState, Badge, EmptyState } from '../components/Primitives'
import { useEmployees } from '../hooks/useEmployees'
import { useDepartments } from '../hooks/useDepartments'
import { useHealthTrend } from '../hooks/useHealthTrend'
import { useSimulations } from '../hooks/useSimulations'
import { useActivityFeed } from '../hooks/useActivityFeed'
import { useAllOneOnOnes } from '../hooks/useOneOnOnes'
import { computeManagerBlindSpots } from '../lib/managerInsights'
import ManagerBlindSpots from '../components/ManagerBlindSpots'
import { riskColorClasses, timeAgo } from '../lib/utils'
import { Link } from 'react-router-dom'
import type { ActivityFeedAction } from '../lib/types'

const ACTION_META: Record<ActivityFeedAction, { icon: typeof Activity; color: string }> = {
  employee_added: { icon: UserPlus, color: 'text-teal' },
  employee_deleted: { icon: UserMinus, color: 'text-rose' },
  employee_updated: { icon: Pencil, color: 'text-signal' },
  simulation_run: { icon: FlaskConical, color: 'text-signal' },
  insight_resolved: { icon: CheckCircle2, color: 'text-teal' },
  insight_generated: { icon: Lightbulb, color: 'text-amber' },
  pulse_submitted: { icon: SmilePlus, color: 'text-signal' },
  burnout_alert: { icon: AlertTriangle, color: 'text-rose' },
  team_formation_generated: { icon: Sparkles, color: 'text-teal' },
  department_added: { icon: FolderPlus, color: 'text-teal' },
  department_updated: { icon: FolderCog, color: 'text-signal' },
  department_deleted: { icon: FolderMinus, color: 'text-rose' },
  one_on_one_logged: { icon: MessageCircle, color: 'text-signal' },
  candidate_added: { icon: UserSquare2, color: 'text-teal' },
  candidate_deleted: { icon: Trash2, color: 'text-rose' },
  placement_search_generated: { icon: Sparkles, color: 'text-teal' },
  course_added: { icon: GraduationCap, color: 'text-teal' },
  course_removed: { icon: Trash2, color: 'text-rose' },
  project_created: { icon: Briefcase, color: 'text-signal' },
  project_deleted: { icon: Trash2, color: 'text-rose' },
  project_assigned: { icon: Briefcase, color: 'text-teal' },
  kudos_given: { icon: Award, color: 'text-amber' },
  award_given: { icon: Trophy, color: 'text-amber' }
}

export default function CommandCenter() {
  const { employees, loading, error } = useEmployees()
  const { departments } = useDepartments()
  const { trend } = useHealthTrend()
  const { simulations } = useSimulations()
  const { feed, loading: feedLoading } = useActivityFeed(15)
  const { entries: oneOnOnes } = useAllOneOnOnes()
  const [metric, setMetric] = useState<'performance' | 'burnout' | 'attrition_risk'>('performance')

  const blindSpots = useMemo(() => computeManagerBlindSpots(employees, oneOnOnes), [employees, oneOnOnes])

  const stats = useMemo(() => {
    if (employees.length === 0) return null
    const avg = (key: 'performance' | 'burnout' | 'attrition_risk') =>
      Math.round(employees.reduce((sum, e) => sum + e[key], 0) / employees.length)
    const flightRisks = employees.filter((e) => e.attrition_risk >= 70).length
    const promotionReady = employees.filter((e) => e.performance >= 80 && e.burnout < 50).length
    return {
      orgHealth: Math.max(0, 100 - avg('burnout') * 0.4 - avg('attrition_risk') * 0.2 + avg('performance') * 0.2),
      burnoutIndex: avg('burnout'),
      flightRisks,
      avgPerformance: avg('performance'),
      promotionReady,
      total: employees.length
    }
  }, [employees])

  const deptChartData = useMemo(() => {
    return departments.map((dept) => {
      const deptEmployees = employees.filter((e) => e.department_id === dept.id)
      const avg = (key: 'performance' | 'burnout') =>
        deptEmployees.length ? Math.round(deptEmployees.reduce((s, e) => s + e[key], 0) / deptEmployees.length) : 0
      return {
        name: dept.name.slice(0, 4),
        performance: avg('performance'),
        burnout: avg('burnout'),
        attrition_risk: deptEmployees.length
          ? Math.round(deptEmployees.reduce((s, e) => s + e.attrition_risk, 0) / deptEmployees.length)
          : 0
      }
    })
  }, [departments, employees])

  const topPerformers = useMemo(
    () => [...employees].sort((a, b) => b.performance - a.performance).slice(0, 5),
    [employees]
  )
  const flightRiskList = useMemo(
    () => [...employees].sort((a, b) => b.attrition_risk - a.attrition_risk).slice(0, 5),
    [employees]
  )

  const metricColor = { performance: '#12B886', burnout: '#F5A524', attrition_risk: '#F43F5E' }[metric]

  return (
    <div>
      <Topbar title="Command Center" subtitle="Workforce Intelligence Dashboard" />
      <div className="p-4 md:p-8 space-y-6">
        {error && <ErrorState message={error} />}
        {loading && <LoadingState />}
        {!loading && !error && !stats && (
          <EmptyState title="No workforce data yet" description="Connect Firebase and run the seed script to populate your dashboard." />
        )}

        {!loading && !error && stats && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<HeartPulse className="h-4 w-4 text-teal" />}
                value={`${Math.round(stats.orgHealth)}%`}
                label="Organization Health"
                sublabel="Overall workforce score"
                accent="teal"
              />
              <StatCard
                icon={<Flame className="h-4 w-4 text-amber" />}
                value={`${stats.burnoutIndex}%`}
                label="Burnout Index"
                sublabel="Avg across all employees"
                accent="amber"
              />
              <StatCard
                icon={<PlaneTakeoff className="h-4 w-4 text-rose" />}
                value={stats.flightRisks}
                label="Flight Risks"
                sublabel="Employees at risk of leaving"
                accent="rose"
              />
              <StatCard
                icon={<ClipboardList className="h-4 w-4 text-signal" />}
                value={simulations.length}
                label="Simulations Run"
                sublabel="Scenario models this workspace"
                accent="signal"
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-4 flex items-center gap-3">
                <Users className="h-5 w-5 text-signal shrink-0" />
                <div>
                  <p className="text-lg font-display font-semibold leading-none">{stats.total}</p>
                  <p className="text-xs text-black/50 dark:text-white/40 mt-1">Total Employees</p>
                </div>
              </div>
              <div className="card p-4 flex items-center gap-3">
                <Zap className="h-5 w-5 text-amber shrink-0" />
                <div>
                  <p className="text-lg font-display font-semibold leading-none">{stats.avgPerformance}%</p>
                  <p className="text-xs text-black/50 dark:text-white/40 mt-1">Avg Performance</p>
                </div>
              </div>
              <div className="card p-4 flex items-center gap-3">
                <Rocket className="h-5 w-5 text-teal shrink-0" />
                <div>
                  <p className="text-lg font-display font-semibold leading-none">{stats.promotionReady}</p>
                  <p className="text-xs text-black/50 dark:text-white/40 mt-1">Promotion Ready</p>
                </div>
              </div>
              <div className="card p-4 flex items-center gap-3">
                <Building2 className="h-5 w-5 text-signal shrink-0" />
                <div>
                  <p className="text-lg font-display font-semibold leading-none">{departments.length}</p>
                  <p className="text-xs text-black/50 dark:text-white/40 mt-1">Departments</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="card p-5 lg:col-span-3">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="font-display font-semibold">Department Analytics</p>
                    <p className="text-xs text-black/45 dark:text-white/40">Metric by department</p>
                  </div>
                  <div className="flex gap-1 bg-black/5 dark:bg-white/5 rounded-lg p-1">
                    {(['performance', 'burnout', 'attrition_risk'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMetric(m)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize focus-ring ${
                          metric === m ? 'bg-signal text-white' : 'text-black/50 dark:text-white/50'
                        }`}
                      >
                        {m.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <DeptBarChart
                  data={deptChartData}
                  xKey="name"
                  series={[{ key: metric, color: metricColor, label: metric.replace('_', ' ') }]}
                />
              </div>

              <div className="card p-5 lg:col-span-2">
                <p className="font-display font-semibold">Health Trend</p>
                <p className="text-xs text-black/45 dark:text-white/40 mb-1">7-month forecast</p>
                <HealthAreaChart data={trend} />
              </div>
            </div>

            <ManagerBlindSpots blindSpots={blindSpots} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-display font-semibold">Top Performers</p>
                  <Link to="/employees" className="text-xs text-signal hover:underline">
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {topPerformers.map((e) => (
                    <Link
                      key={e.id}
                      to={`/employees/${e.id}`}
                      className="flex items-center gap-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] p-1.5 -mx-1.5 rounded-lg"
                    >
                      <Avatar name={e.name} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{e.name}</p>
                        <p className="text-xs text-black/45 dark:text-white/40 truncate">{e.title}</p>
                      </div>
                      <Badge className="bg-teal/15 text-teal">{e.performance} Perf</Badge>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-display font-semibold">Flight Risks</p>
                  <Badge className="bg-rose/15 text-rose">Urgent</Badge>
                </div>
                <div className="space-y-3">
                  {flightRiskList.map((e) => (
                    <Link
                      key={e.id}
                      to={`/employees/${e.id}`}
                      className="flex items-center gap-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] p-1.5 -mx-1.5 rounded-lg"
                    >
                      <Avatar name={e.name} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{e.name}</p>
                        <p className="text-xs text-black/45 dark:text-white/40 truncate">{e.title}</p>
                      </div>
                      <Badge className={riskColorClasses(e.attrition_risk)}>{e.attrition_risk}% risk</Badge>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Live Activity Feed */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-signal" />
                    <p className="font-display font-semibold">Live Activity</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-teal animate-pulse" />
                    <span className="text-[10px] text-teal font-medium">Live</span>
                  </div>
                </div>
                {feedLoading && <LoadingState label="Connecting…" />}
                {!feedLoading && feed.length === 0 && (
                  <p className="text-xs text-black/40 dark:text-white/30 py-6 text-center">
                    No activity yet. Actions like adding employees or running simulations will appear here.
                  </p>
                )}
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto scrollbar-thin">
                  {feed.map((entry) => {
                    const meta = ACTION_META[entry.action] || { icon: Activity, color: 'text-black/40' }
                    const Icon = meta.icon
                    return (
                      <div key={entry.id} className="flex items-start gap-2.5">
                        <div className={`mt-0.5 shrink-0 ${meta.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs leading-snug">{entry.message}</p>
                          <p className="text-[10px] text-black/35 dark:text-white/30 mt-0.5">
                            {timeAgo(entry.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
