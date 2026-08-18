import { useMemo, useState } from 'react'
import { Users, CheckCircle2, Home, Palmtree } from 'lucide-react'
import Topbar from '../components/Topbar'
import StatCard from '../components/StatCard'
import DeptBarChart from '../components/charts/DeptBarChart'
import DeptDonutChart from '../components/charts/DeptDonutChart'
import SkillsRadarChart from '../components/charts/SkillsRadarChart'
import { Badge, LoadingState } from '../components/Primitives'
import Avatar from '../components/Avatar'
import { useEmployees } from '../hooks/useEmployees'
import { useDepartments } from '../hooks/useDepartments'
import { useDigitalTwins } from '../hooks/useDigitalTwins'
import { riskColorClasses } from '../lib/utils'
import { Link } from 'react-router-dom'

const TABS = ['Workforce', 'Performance', 'Risk Analysis', 'Skills'] as const

export default function AnalyticsHub() {
  const { employees, loading } = useEmployees()
  const { departments } = useDepartments()
  const { twins } = useDigitalTwins()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Workforce')

  const donutData = useMemo(
    () =>
      departments.map((d, i) => ({
        name: d.name,
        value: employees.filter((e) => e.department_id === d.id).length,
        color: d.color || ['#3B82F6', '#8B5CF6', '#EC4899', '#F5A524', '#22C55E', '#06B6D4', '#F43F5E', '#14B8A6'][i % 8]
      })),
    [departments, employees]
  )

  const deptHealthData = useMemo(
    () =>
      departments.map((d) => {
        const list = employees.filter((e) => e.department_id === d.id)
        const avg = (k: 'performance' | 'burnout') => (list.length ? Math.round(list.reduce((s, e) => s + e[k], 0) / list.length) : 0)
        const performance = avg('performance')
        const burnout = avg('burnout')
        return { name: d.name.slice(0, 4), performance, burnout, health: Math.max(0, Math.round((performance + (100 - burnout)) / 2)) }
      }),
    [departments, employees]
  )

  const skillsRadar = useMemo(() => {
    if (twins.length === 0) return []
    const avg = (k: 'skills' | 'leadership' | 'learning' | 'collaboration' | 'org_contribution') =>
      Math.round(twins.reduce((s, t) => s + t[k], 0) / twins.length)
    return [
      { metric: 'Skills', value: avg('skills') },
      { metric: 'Leadership', value: avg('leadership') },
      { metric: 'Learning', value: avg('learning') },
      { metric: 'Collaboration', value: avg('collaboration') },
      { metric: 'Org Contribution', value: avg('org_contribution') }
    ]
  }, [twins])

  const topPerformanceTrend = useMemo(() => [...employees].sort((a, b) => b.performance - a.performance).slice(0, 6), [employees])
  const riskList = useMemo(() => [...employees].filter((e) => e.attrition_risk >= 30).sort((a, b) => b.attrition_risk - a.attrition_risk), [employees])

  const remote = employees.filter((e) => e.status === 'Remote').length
  const active = employees.filter((e) => e.status === 'Active').length
  const onLeave = employees.filter((e) => e.status === 'On Leave').length

  return (
    <div>
      <Topbar title="Analytics Hub" subtitle="Advanced workforce intelligence and forecasting" />
      <div className="p-4 md:p-8 space-y-5">
        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border focus-ring ${
                tab === t
                  ? 'bg-signal text-white border-signal'
                  : 'border-surface-lightborder dark:border-surface-darkborder hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading && <LoadingState />}

        {!loading && tab === 'Workforce' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<Users className="h-4 w-4 text-signal" />} value={employees.length} label="Total Headcount" accent="signal" />
              <StatCard icon={<CheckCircle2 className="h-4 w-4 text-teal" />} value={active} label="Active Employees" accent="teal" />
              <StatCard icon={<Home className="h-4 w-4 text-signal" />} value={remote} label="Remote Workers" accent="signal" />
              <StatCard icon={<Palmtree className="h-4 w-4 text-amber" />} value={onLeave} label="On Leave" accent="amber" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-5">
                <p className="font-display font-semibold mb-3">Workforce by Department</p>
                <DeptDonutChart data={donutData} />
              </div>
              <div className="card p-5">
                <p className="font-display font-semibold mb-3">Department Health Comparison</p>
                <DeptBarChart
                  data={deptHealthData}
                  xKey="name"
                  series={[
                    { key: 'performance', color: '#12B886', label: 'Performance' },
                    { key: 'burnout', color: '#F5A524', label: 'Burnout' },
                    { key: 'health', color: '#3B82F6', label: 'Health' }
                  ]}
                />
              </div>
            </div>
          </>
        )}

        {!loading && tab === 'Performance' && (
          <div className="card p-5">
            <p className="font-display font-semibold mb-4">Top Performers</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topPerformanceTrend.map((e) => (
                <Link key={e.id} to={`/employees/${e.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
                  <Avatar name={e.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.name}</p>
                    <p className="text-xs text-black/45 dark:text-white/40 truncate">
                      {e.title} · {e.department?.name}
                    </p>
                  </div>
                  <Badge className="bg-teal/15 text-teal">{e.performance}</Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!loading && tab === 'Risk Analysis' && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display font-semibold">Employees at Elevated Risk</p>
              <Badge className="bg-rose/15 text-rose">{riskList.length} flagged</Badge>
            </div>
            <div className="divide-y divide-surface-lightborder dark:divide-surface-darkborder">
              {riskList.map((e) => (
                <Link key={e.id} to={`/employees/${e.id}`} className="flex items-center gap-3 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] px-2 -mx-2 rounded-lg">
                  <Avatar name={e.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.name}</p>
                    <p className="text-xs text-black/45 dark:text-white/40 truncate">
                      {e.title} · {e.department?.name}
                    </p>
                  </div>
                  <Badge className={riskColorClasses(e.attrition_risk)}>{e.attrition_risk}% risk</Badge>
                </Link>
              ))}
              {riskList.length === 0 && <p className="text-sm text-black/45 dark:text-white/40 py-8 text-center">No elevated risk employees right now.</p>}
            </div>
          </div>
        )}

        {!loading && tab === 'Skills' && (
          <div className="card p-5">
            <p className="font-display font-semibold mb-3">Average Skills Profile</p>
            {skillsRadar.length > 0 ? (
              <SkillsRadarChart data={skillsRadar} height={340} />
            ) : (
              <p className="text-sm text-black/45 dark:text-white/40 py-8 text-center">No digital twin data available yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
