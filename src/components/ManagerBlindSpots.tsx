import { Link } from 'react-router-dom'
import { UserCog, AlertTriangle } from 'lucide-react'
import Avatar from './Avatar'
import { Badge } from './Primitives'
import type { ManagerBlindSpot } from '../lib/managerInsights'

export default function ManagerBlindSpots({ blindSpots }: { blindSpots: ManagerBlindSpot[] }) {
  if (blindSpots.length === 0) return null

  return (
    <div className="card p-5 !border-amber/30">
      <div className="flex items-center gap-2 mb-1">
        <UserCog className="h-4 w-4 text-amber" />
        <p className="font-display font-semibold">Manager Attention Needed</p>
      </div>
      <p className="text-xs text-black/45 dark:text-white/40 mb-4">
        Teams with elevated average burnout where no 1:1 has been logged (via Prep 1:1) with any direct report in over
        60 days.
      </p>
      <div className="space-y-2.5">
        {blindSpots.map((b) => (
          <div key={b.manager.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber/5">
            <Avatar name={b.manager.name} size={36} />
            <div className="min-w-0 flex-1">
              <Link to={`/employees/${b.manager.id}`} className="text-sm font-medium hover:text-signal truncate block">
                {b.manager.name}
              </Link>
              <p className="text-xs text-black/50 dark:text-white/40">
                {b.directReports.length} direct report{b.directReports.length === 1 ? '' : 's'} ·{' '}
                {b.daysSinceLastOneOnOne === null ? 'No 1:1 ever logged' : `Last 1:1 ${b.daysSinceLastOneOnOne}d ago`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className="bg-amber/15 text-amber">
                <AlertTriangle className="h-3 w-3" /> {b.avgBurnout}% avg burnout
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
