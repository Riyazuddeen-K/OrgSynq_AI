import { Sun, Moon, Database, CheckCircle2, AlertTriangle, Github, Rocket } from 'lucide-react'
import Topbar from '../components/Topbar'
import { useTheme } from '../context/ThemeContext'
import { isFirebaseConfigured } from '../lib/firebaseClient'
import { classNames } from '../lib/utils'

export default function Settings() {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <Topbar title="Settings" subtitle="Workspace preferences and connection status" />
      <div className="p-4 md:p-8 max-w-2xl space-y-5">
        <div className="card p-6">
          <p className="font-display font-semibold mb-1">Appearance</p>
          <p className="text-xs text-black/45 dark:text-white/40 mb-4">Choose how OrgSynq AI looks on this device.</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={classNames(
                'flex items-center gap-3 p-4 rounded-lg border text-left focus-ring',
                theme === 'light' ? 'border-signal bg-signal/5' : 'border-surface-lightborder dark:border-surface-darkborder'
              )}
            >
              <span className="h-9 w-9 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center">
                <Sun className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium">Light</p>
                <p className="text-xs text-black/45 dark:text-white/40">Bright, high-contrast</p>
              </div>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={classNames(
                'flex items-center gap-3 p-4 rounded-lg border text-left focus-ring',
                theme === 'dark' ? 'border-signal bg-signal/5' : 'border-surface-lightborder dark:border-surface-darkborder'
              )}
            >
              <span className="h-9 w-9 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center">
                <Moon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium">Dark</p>
                <p className="text-xs text-black/45 dark:text-white/40">Easy on the eyes</p>
              </div>
            </button>
          </div>
        </div>

        <div className="card p-6">
          <p className="font-display font-semibold mb-1">Data Source</p>
          <p className="text-xs text-black/45 dark:text-white/40 mb-4">OrgSynq AI reads and writes live data through Firebase (Firestore).</p>
          <div
            className={classNames(
              'flex items-center gap-3 p-4 rounded-lg',
              isFirebaseConfigured ? 'bg-teal/10 text-teal' : 'bg-amber/10 text-amber'
            )}
          >
            {isFirebaseConfigured ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
            <div>
              <p className="text-sm font-medium">{isFirebaseConfigured ? 'Connected to Firebase' : 'Running in demo mode'}</p>
              <p className="text-xs opacity-80">
                {isFirebaseConfigured
                  ? 'Your Firebase web app config is set.'
                  : 'Add your Firebase project config to a .env file to load live data. See .env.example.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-black/45 dark:text-white/40">
            <Database className="h-3.5 w-3.5" />
            Collections: departments · employees · digital_twins · insights · simulations · org_health_trend · notifications
          </div>
        </div>

        <div className="card p-6">
          <p className="font-display font-semibold mb-1">Deployment</p>
          <p className="text-xs text-black/45 dark:text-white/40 mb-4">This project is ready to push to GitHub and deploy on Vercel.</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2.5">
              <Github className="h-4 w-4 text-black/50 dark:text-white/40" />
              <span>Push the project folder to a new GitHub repository</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Rocket className="h-4 w-4 text-black/50 dark:text-white/40" />
              <span>Import the repo in Vercel and add your Firebase env vars</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
