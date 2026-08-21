import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Mail, Lock, Eye, EyeOff, Zap, Shield, User as UserIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { classNames } from '../lib/utils'
import type { UserRole } from '../lib/types'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [role, setRole] = useState<UserRole>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div className="min-h-screen bg-surface-lightbg dark:bg-surface-darkbg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-signal/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-teal/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-amber/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-signal mb-4 shadow-lg shadow-signal/30">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold">OrgSynq AI</h1>
          <p className="text-black/50 dark:text-white/40 mt-1 text-sm">Workforce Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <div className="mb-6">
            <h2 className="text-xl font-display font-semibold">{isSignUp ? 'Create account' : 'Sign in'}</h2>
            <p className="text-sm text-black/50 dark:text-white/40 mt-1">
              {isSignUp ? 'Sign up to configure your workforce profile' : 'Access your workforce command center'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-black/60 dark:text-white/50 mb-1.5">
                  I am signing up as
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={classNames(
                      'flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all',
                      role === 'admin'
                        ? 'border-signal bg-signal/5'
                        : 'border-surface-lightborder dark:border-surface-darkborder'
                    )}
                  >
                    <Shield className="h-4 w-4 text-signal shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Admin</p>
                      <p className="text-[11px] text-black/45 dark:text-white/40">Full workspace access</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('employee')}
                    className={classNames(
                      'flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all',
                      role === 'employee'
                        ? 'border-signal bg-signal/5'
                        : 'border-surface-lightborder dark:border-surface-darkborder'
                    )}
                  >
                    <UserIcon className="h-4 w-4 text-teal shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Employee</p>
                      <p className="text-[11px] text-black/45 dark:text-white/40">My Profile only</p>
                    </div>
                  </button>
                </div>
                {role === 'employee' && (
                  <p className="mt-2 text-[11px] text-black/40 dark:text-white/35">
                    Use the same email your admin added you with as an employee, so your account links to your existing profile automatically.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-black/60 dark:text-white/50 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/35 dark:text-white/30" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@orgsynq.ai"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm bg-black/[0.04] dark:bg-white/[0.06] border border-surface-lightborder dark:border-surface-darkborder focus:border-signal/60 focus:outline-none focus:ring-2 focus:ring-signal/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-black/60 dark:text-white/50 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/35 dark:text-white/30" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-lg text-sm bg-black/[0.04] dark:bg-white/[0.06] border border-surface-lightborder dark:border-surface-darkborder focus:border-signal/60 focus:outline-none focus:ring-2 focus:ring-signal/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/35 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose/10 border border-rose/20 text-rose text-sm">
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-signal text-white font-semibold hover:bg-signal/90 disabled:opacity-60 transition-all shadow-lg shadow-signal/25 focus:outline-none focus:ring-2 focus:ring-signal/40"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isSignUp ? 'Creating account…' : 'Signing in…'}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  {isSignUp ? 'Sign up' : 'Sign in to OrgSynq'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-surface-lightborder dark:border-surface-darkborder text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
              }}
              className="text-xs text-signal hover:underline focus:outline-none"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-black/35 dark:text-white/25 mt-6">
          OrgSynq AI · Workforce Intelligence Platform
        </p>
      </div>
    </div>
  )
}
