import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Zap, Shield, User as UserIcon, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { classNames } from '../lib/utils'
import type { UserRole } from '../lib/types'
import { LoadingState } from '../components/Primitives'
import Logo from '../components/Logo'

export default function Login() {
  const { user, loading: authLoading, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isSignUp = location.pathname === '/signup'
  const [role, setRole] = useState<UserRole>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Clear any error left over from the other mode when switching tabs
  useEffect(() => {
    setError(null)
  }, [isSignUp])

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
        <LoadingState label="Authenticating workspace..." />
      </div>
    )
  }

  // Already signed in — go straight to app
  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: authError } = isSignUp
      ? await signUp(email, password, role)
      : await signIn(email, password)
    setLoading(false)
    if (authError) {
      setError(authError)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center p-4 relative overflow-hidden transition-colors">
      {/* Background glowing gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-signal/15 dark:bg-signal/10 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-teal/15 dark:bg-teal/10 blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-signal mb-6 focus-ring rounded-lg px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </Link>

        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-signal/20 via-signal/10 to-teal/20 ring-1 ring-black/5 dark:ring-white/10 shadow-lg mb-3">
            <Logo size={48} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
            OrgSynq AI
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Workforce Intelligence & Decision Platform
          </p>
        </div>

        {/* Card */}
        <div className="card-glass p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-white/[0.1]">
          <div className="mb-6">
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">
              {isSignUp ? 'Create your workspace' : 'Sign in to workspace'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isSignUp
                ? 'Configure your credentials to access the telemetry dashboard'
                : 'Enter your credentials to manage workforce analytics'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={classNames(
                      'flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all',
                      role === 'admin'
                        ? 'border-signal bg-signal/10 ring-2 ring-signal/20'
                        : 'border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                    )}
                  >
                    <Shield className="h-4 w-4 text-signal shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Admin</p>
                      <p className="text-[10px] text-slate-400">Full workspace telemetry</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('employee')}
                    className={classNames(
                      'flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all',
                      role === 'employee'
                        ? 'border-teal bg-teal/10 ring-2 ring-teal/20'
                        : 'border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                    )}
                  >
                    <UserIcon className="h-4 w-4 text-teal shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Employee</p>
                      <p className="text-[10px] text-slate-400">My profile & team view</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-signal transition-colors" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-signal focus:bg-white dark:focus:bg-surface-darkcard focus-ring transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-signal transition-colors" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-signal focus:bg-white dark:focus:bg-surface-darkcard focus-ring transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose/10 border border-rose/20 text-rose text-xs font-medium">
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-signal to-indigo-600 hover:from-signal-hover hover:to-indigo-700 text-white font-semibold shadow-lg shadow-signal/25 hover:shadow-signal/40 disabled:opacity-60 transition-all focus-ring text-sm mt-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>{isSignUp ? 'Create Workspace Account' : 'Sign in to OrgSynq AI'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-white/[0.06] text-center">
            <button
              type="button"
              onClick={() => navigate(isSignUp ? '/login' : '/signup')}
              className="text-xs font-semibold text-signal hover:underline focus-ring rounded"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          OrgSynq AI · Workforce Intelligence Platform
        </p>
      </div>
    </div>
  )
}
