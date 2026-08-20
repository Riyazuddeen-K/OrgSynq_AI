import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Mail, MapPin, Briefcase, Award } from 'lucide-react'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import { ProgressBar, Badge, LoadingState } from '../components/Primitives'
import { useEmployee } from '../hooks/useEmployees'
import { useDigitalTwinByEmployee } from '../hooks/useDigitalTwins'
import { riskColorClasses, riskLabel } from '../lib/utils'

type NumericTwinKey =
  | 'performance'
  | 'skills'
  | 'leadership'
  | 'learning'
  | 'burnout'
  | 'attrition_risk'
  | 'promotion_ready'
  | 'collaboration'
  | 'org_contribution'

const SCORE_FIELDS: Array<{ key: NumericTwinKey; label: string; color: string }> = [
  { key: 'performance', label: 'Performance', color: 'bg-teal' },
  { key: 'skills', label: 'Skills', color: 'bg-signal' },
  { key: 'leadership', label: 'Leadership', color: 'bg-amber' },
  { key: 'learning', label: 'Learning', color: 'bg-signal' },
  { key: 'burnout', label: 'Burnout', color: 'bg-rose' },
  { key: 'attrition_risk', label: 'Attrition Risk', color: 'bg-rose' },
  { key: 'promotion_ready', label: 'Promotion Ready', color: 'bg-teal' },
  { key: 'collaboration', label: 'Collaboration', color: 'bg-amber' },
  { key: 'org_contribution', label: 'Org Contribution', color: 'bg-signal' }
]

export default function EmployeeDetail() {
  const { id } = useParams()
  const { employee, loading } = useEmployee(id)
  const { twin, loading: twinLoading } = useDigitalTwinByEmployee(id)

  return (
    <div>
      <Topbar title={employee?.name || 'Employee'} subtitle={employee?.title} />
      <div className="p-4 md:p-8">
        <Link to="/employees" className="inline-flex items-center gap-1.5 text-sm text-black/50 dark:text-white/40 hover:text-signal mb-5">
          <ArrowLeft className="h-4 w-4" /> Back to directory
        </Link>

        {loading && <LoadingState />}

        {!loading && employee && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="card p-6 lg:col-span-1 h-fit">
              <div className="flex flex-col items-center text-center">
                <Avatar name={employee.name} size={72} />
                <p className="font-display font-semibold text-lg mt-3">{employee.name}</p>
                <p className="text-sm text-black/50 dark:text-white/40">{employee.title}</p>
                <div className="flex gap-2 mt-3">
                  <Badge className="bg-black/5 dark:bg-white/10">{employee.department?.name}</Badge>
                  <Badge className={riskColorClasses(employee.attrition_risk)}>{riskLabel(employee.attrition_risk)}</Badge>
                </div>
              </div>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-black/60 dark:text-white/50">
                  <Mail className="h-4 w-4 shrink-0" /> {employee.email}
                </div>
                <div className="flex items-center gap-2 text-black/60 dark:text-white/50">
                  <MapPin className="h-4 w-4 shrink-0" /> {employee.location}
                </div>
                <div className="flex items-center gap-2 text-black/60 dark:text-white/50">
                  <Briefcase className="h-4 w-4 shrink-0" /> {employee.status}
                </div>
                <div className="flex items-center gap-2 text-black/60 dark:text-white/50">
                  <Award className="h-4 w-4 shrink-0" /> {employee.experience_years ?? 0} years experience
                </div>
              </div>
              {(employee.skills ?? []).length > 0 && (
                <div className="mt-5 pt-5 border-t border-surface-lightborder dark:border-surface-darkborder">
                  <p className="text-xs font-medium text-black/50 dark:text-white/40 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {employee.skills.map((s) => (
                      <Badge key={s} className="bg-signal/10 text-signal">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-6 pt-5 border-t border-surface-lightborder dark:border-surface-darkborder grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="font-display font-semibold text-teal">{employee.performance}</p>
                  <p className="text-[11px] text-black/40 dark:text-white/30">Perf</p>
                </div>
                <div>
                  <p className="font-display font-semibold text-amber">{employee.burnout}</p>
                  <p className="text-[11px] text-black/40 dark:text-white/30">Burnout</p>
                </div>
                <div>
                  <p className="font-display font-semibold text-rose">{employee.attrition_risk}%</p>
                  <p className="text-[11px] text-black/40 dark:text-white/30">Risk</p>
                </div>
              </div>
            </div>

            <div className="card p-6 lg:col-span-2">
              <p className="font-display font-semibold mb-1">Digital Twin Profile</p>
              <p className="text-xs text-black/45 dark:text-white/40 mb-5">Cognitive AI model scores derived from performance, engagement, and sentiment signals</p>

              {twinLoading && <LoadingState label="Loading digital twin…" />}

              {!twinLoading && !twin && (
                <p className="text-sm text-black/45 dark:text-white/40 py-10 text-center">
                  No digital twin has been generated for this employee yet.
                </p>
              )}

              {!twinLoading && twin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  {SCORE_FIELDS.map((f) => (
                    <div key={f.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium">{f.label}</span>
                        <span className="text-sm font-semibold">{twin[f.key]}</span>
                      </div>
                      <ProgressBar value={Number(twin[f.key])} colorClass={f.color} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
