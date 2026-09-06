import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-center px-6">
      <p className="text-6xl font-display font-semibold text-signal mb-2">404</p>
      <p className="text-sm text-black/50 dark:text-white/40 mb-6">This page doesn't exist in the org chart.</p>
      <Link to="/" className="px-4 py-2 rounded-lg bg-signal text-white text-sm font-medium hover:bg-signal/90 focus-ring">
        Back to Command Center
      </Link>
    </div>
  )
}
