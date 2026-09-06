import { Link } from 'react-router-dom'
import { UserCog, AlertTriangle, ArrowRight } from 'lucide-react'
import Avatar from './Avatar'
import { Badge } from './Primitives'
import type { ManagerBlindSpot } from '../lib/managerInsights'

export default function ManagerBlindSpots({ blindSpots }: { blindSpots: ManagerBlindSpot[] }) {
  if (blindSpots.length === 0) return null

  return (
    <div className="card p-5 md:p-6 border-amber/40 bg-gradient-to-br from-amber/5 via-transparent to-transparent relative overflow-hidden shadow-lg shadow-amber/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber/15 text-amber">
            <UserCog className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Manager Attention Needed</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Teams with elevated burnout (&gt;60%) lacking 1:1 check-in telemetry
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber/15 text-amber uppercase tracking-wider self-start sm:self-center">
          {blindSpots.length} Team{blindSpots.length === 1 ? '' : 's'} Flagged
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {blindSpots.map((b) => (
          <div
            key={b.manager.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/70 dark:bg-white/[0.03] border border-amber/20 hover:border-amber/40 transition-all group"
          >
            <Avatar name={b.manager.name} size={38} />
            <div className="min-w-0 flex-1">
              <Link
                to={`/employees/${b.manager.id}`}
                className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-signal truncate block transition-colors"
              >
                {b.manager.name}
              </Link>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {b.directReports.length} report{b.directReports.length === 1 ? '' : 's'} ·{' '}
                {b.daysSinceLastOneOnOne === null ? 'No 1:1 logged' : `Last check-in ${b.daysSinceLastOneOnOne}d ago`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className="bg-amber/15 text-amber text-xs font-semibold px-2.5 py-1">
                <AlertTriangle className="h-3 w-3" /> {b.avgBurnout}%
              </Badge>
              <Link
                to={`/employees/${b.manager.id}`}
                className="p-1.5 rounded-lg text-slate-400 hover:text-signal hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                title="View Team"
              >
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
