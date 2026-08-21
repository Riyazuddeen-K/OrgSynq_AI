import { CircleAlert } from 'lucide-react'
import { isFirebaseConfigured } from '../lib/firebaseClient'

export default function FirebaseSetupBanner() {
  if (isFirebaseConfigured) return null

  return (
    <div className="flex items-start gap-3 px-4 md:px-8 py-3 bg-amber/10 border-b border-amber/20 text-sm">
      <CircleAlert className="h-4 w-4 text-amber shrink-0 mt-0.5" />
      <p className="text-black/70 dark:text-white/70">
        <span className="font-medium text-amber">Firebase isn't connected yet.</span> Every page will look empty
        until you do. Copy <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">.env.example</code> to{' '}
        <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">.env</code>, add your Firebase web app
        config, then restart <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">npm run dev</code>.
        See the README for the full setup steps.
      </p>
    </div>
  )
}
