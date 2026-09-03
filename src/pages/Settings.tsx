import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, Database, CheckCircle2, AlertTriangle, User, Lock, Mail, Eye, EyeOff, Shield, Trash2, Pencil, Plus, Building2 } from 'lucide-react'
import Topbar from '../components/Topbar'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { isFirebaseConfigured } from '../lib/firebaseClient'
import { classNames } from '../lib/utils'
import { useDepartments } from '../hooks/useDepartments'
import { useEmployees } from '../hooks/useEmployees'
import DepartmentModal from '../components/DepartmentModal'
import type { Department } from '../lib/types'

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { profile, role, updateDisplayName, changePassword, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const { departments, addDepartment, updateDepartment, deleteDepartment } = useDepartments()
  const { employees } = useEmployees()
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [deptError, setDeptError] = useState<string | null>(null)

  const [name, setName] = useState(profile?.displayName ?? '')
  const [nameStatus, setNameStatus] = useState<{ type: 'idle' | 'saving' | 'success' | 'error'; message?: string }>({
    type: 'idle'
  })

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'idle' | 'saving' | 'success' | 'error'; message?: string }>({
    type: 'idle'
  })

  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteStatus, setDeleteStatus] = useState<{ type: 'idle' | 'saving' | 'error'; message?: string }>({ type: 'idle' })
  const [showDeleteForm, setShowDeleteForm] = useState(false)

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    setNameStatus({ type: 'saving' })
    const { error } = await updateDisplayName(name)
    setNameStatus(error ? { type: 'error', message: error } : { type: 'success', message: 'Name updated.' })
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: "New passwords don't match." })
      return
    }
    setPasswordStatus({ type: 'saving' })
    const { error } = await changePassword(currentPassword, newPassword)
    if (error) {
      setPasswordStatus({ type: 'error', message: error })
    } else {
      setPasswordStatus({ type: 'success', message: 'Password changed.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault()
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteStatus({ type: 'error', message: 'Type DELETE to confirm.' })
      return
    }
    setDeleteStatus({ type: 'saving' })
    const { error } = await deleteAccount(deletePassword)
    if (error) {
      setDeleteStatus({ type: 'error', message: error })
    } else {
      navigate('/login', { replace: true })
    }
  }

  async function handleDeleteDepartment(dept: Department) {
    if (!confirm(`Remove "${dept.name}" department?`)) return
    const { error } = await deleteDepartment(dept.id, dept.name)
    setDeptError(error ? error.message : null)
  }

  return (
    <div>
      <Topbar title="Settings" subtitle="Workspace preferences and connection status" />
      <div className="p-4 md:p-8 max-w-2xl space-y-5">
        {/* Account */}
        <div className="card p-6">
          <p className="font-display font-semibold mb-1">Account</p>
          <p className="text-xs text-black/45 dark:text-white/40 mb-4">Your profile details for this OrgSynq AI account.</p>

          <div className="flex items-center gap-2.5 mb-5 text-xs px-3 py-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] w-fit">
            <Shield className="h-3.5 w-3.5 text-signal" />
            <span className="font-medium capitalize">{role ?? 'admin'}</span>
            <span className="text-black/40 dark:text-white/30">account</span>
          </div>

          <form onSubmit={handleSaveName} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-black/60 dark:text-white/50 mb-1.5">Display name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/35 dark:text-white/30" />
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setNameStatus({ type: 'idle' })
                  }}
                  placeholder="Your name"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-black/[0.04] dark:bg-white/[0.06] border border-surface-lightborder dark:border-surface-darkborder focus:border-signal/60 focus:outline-none focus:ring-2 focus:ring-signal/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-black/60 dark:text-white/50 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/35 dark:text-white/30" />
                <input
                  value={profile?.email ?? ''}
                  disabled
                  readOnly
                  title="Your email address can't be changed here."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-black/[0.02] dark:bg-white/[0.03] border border-surface-lightborder dark:border-surface-darkborder text-black/40 dark:text-white/30 cursor-not-allowed"
                />
              </div>
            </div>

            {nameStatus.type === 'error' && (
              <div className="p-2.5 rounded-lg bg-rose/10 border border-rose/20 text-rose text-xs">{nameStatus.message}</div>
            )}
            {nameStatus.type === 'success' && (
              <div className="p-2.5 rounded-lg bg-teal/10 border border-teal/20 text-teal text-xs">{nameStatus.message}</div>
            )}

            <button
              type="submit"
              disabled={nameStatus.type === 'saving'}
              className="px-4 py-2 rounded-lg bg-signal text-white text-sm font-semibold hover:bg-signal/90 disabled:opacity-60 transition-all"
            >
              {nameStatus.type === 'saving' ? 'Saving…' : 'Save name'}
            </button>
          </form>
        </div>

        {/* Departments (admin only) */}
        {role === 'admin' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-1">
              <p className="font-display font-semibold">Departments</p>
              <button
                onClick={() => {
                  setEditingDept(null)
                  setDeptError(null)
                  setShowDeptModal(true)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-signal text-white text-xs font-semibold hover:bg-signal/90 transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Add Department
              </button>
            </div>
            <p className="text-xs text-black/45 dark:text-white/40 mb-4">
              Manage your org's department structure. Employees reference these directly.
            </p>

            {deptError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose/10 border border-rose/20 text-rose text-xs">{deptError}</div>
            )}

            {departments.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-black/40 dark:text-white/30 py-6 justify-center">
                <Building2 className="h-4 w-4" /> No departments yet
              </div>
            ) : (
              <div className="space-y-1.5">
                {departments.map((d) => {
                  const count = employees.filter((e) => e.department_id === d.id).length
                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <p className="text-sm font-medium truncate">{d.name}</p>
                        <span className="text-xs text-black/40 dark:text-white/30 shrink-0">
                          {count} employee{count === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingDept(d)
                            setDeptError(null)
                            setShowDeptModal(true)
                          }}
                          className="h-7 w-7 rounded-md flex items-center justify-center text-black/30 dark:text-white/30 hover:text-signal hover:bg-signal/10 focus-ring"
                          title="Edit department"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(d)}
                          className="h-7 w-7 rounded-md flex items-center justify-center text-black/30 dark:text-white/30 hover:text-rose hover:bg-rose/10 focus-ring"
                          title="Remove department"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Change password */}
        <div className="card p-6">
          <p className="font-display font-semibold mb-1">Change password</p>
          <p className="text-xs text-black/45 dark:text-white/40 mb-4">
            Enter your current password to set a new one. Your email address stays the same.
          </p>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-black/60 dark:text-white/50 mb-1.5">Current password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/35 dark:text-white/30" />
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    setPasswordStatus({ type: 'idle' })
                  }}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm bg-black/[0.04] dark:bg-white/[0.06] border border-surface-lightborder dark:border-surface-darkborder focus:border-signal/60 focus:outline-none focus:ring-2 focus:ring-signal/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/35 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60"
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-black/60 dark:text-white/50 mb-1.5">New password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setPasswordStatus({ type: 'idle' })
                  }}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-black/[0.04] dark:bg-white/[0.06] border border-surface-lightborder dark:border-surface-darkborder focus:border-signal/60 focus:outline-none focus:ring-2 focus:ring-signal/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-black/60 dark:text-white/50 mb-1.5">Confirm new password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setPasswordStatus({ type: 'idle' })
                  }}
                  placeholder="Repeat new password"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-black/[0.04] dark:bg-white/[0.06] border border-surface-lightborder dark:border-surface-darkborder focus:border-signal/60 focus:outline-none focus:ring-2 focus:ring-signal/20 transition-all"
                />
              </div>
            </div>

            {passwordStatus.type === 'error' && (
              <div className="p-2.5 rounded-lg bg-rose/10 border border-rose/20 text-rose text-xs">{passwordStatus.message}</div>
            )}
            {passwordStatus.type === 'success' && (
              <div className="p-2.5 rounded-lg bg-teal/10 border border-teal/20 text-teal text-xs">{passwordStatus.message}</div>
            )}

            <button
              type="submit"
              disabled={passwordStatus.type === 'saving'}
              className="px-4 py-2 rounded-lg bg-signal text-white text-sm font-semibold hover:bg-signal/90 disabled:opacity-60 transition-all"
            >
              {passwordStatus.type === 'saving' ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>

        {/* Appearance */}
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

        {/* Data source */}
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

        {/* Danger zone */}
        <div className="card p-6 !border-rose/30">
          <p className="font-display font-semibold mb-1 text-rose">Danger Zone</p>
          <p className="text-xs text-black/45 dark:text-white/40 mb-4">
            {role === 'employee' && profile?.employee_id
              ? "Permanently delete your OrgSynq AI account. Since your account is linked to an employee record, this will also remove your employee profile and digital twin from the workforce directory."
              : 'Permanently delete your OrgSynq AI account. This removes your sign-in and profile — it does not remove any employee record from the workforce directory' +
                (role === 'admin' ? ' (admins manage that separately from the Employees page)' : '') +
                '.'}
          </p>

          {!showDeleteForm && (
            <button
              onClick={() => setShowDeleteForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-rose/30 text-rose text-sm font-semibold hover:bg-rose/10 transition-all"
            >
              <Trash2 className="h-4 w-4" /> Delete my account
            </button>
          )}

          {showDeleteForm && (
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="p-3 rounded-lg bg-rose/10 border border-rose/20 text-rose text-xs">
                This can't be undone. You'll be signed out immediately and won't be able to log back in with this account.
              </div>

              <div>
                <label className="block text-xs font-medium text-black/60 dark:text-white/50 mb-1.5">Confirm your password</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value)
                    setDeleteStatus({ type: 'idle' })
                  }}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-black/[0.04] dark:bg-white/[0.06] border border-surface-lightborder dark:border-surface-darkborder focus:border-rose/60 focus:outline-none focus:ring-2 focus:ring-rose/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black/60 dark:text-white/50 mb-1.5">
                  Type <span className="font-mono font-semibold">DELETE</span> to confirm
                </label>
                <input
                  value={deleteConfirmText}
                  onChange={(e) => {
                    setDeleteConfirmText(e.target.value)
                    setDeleteStatus({ type: 'idle' })
                  }}
                  placeholder="DELETE"
                  required
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-black/[0.04] dark:bg-white/[0.06] border border-surface-lightborder dark:border-surface-darkborder focus:border-rose/60 focus:outline-none focus:ring-2 focus:ring-rose/20 transition-all"
                />
              </div>

              {deleteStatus.type === 'error' && (
                <div className="p-2.5 rounded-lg bg-rose/10 border border-rose/20 text-rose text-xs">{deleteStatus.message}</div>
              )}

              <div className="flex items-center gap-2.5">
                <button
                  type="submit"
                  disabled={deleteStatus.type === 'saving'}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose text-white text-sm font-semibold hover:bg-rose/90 disabled:opacity-60 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleteStatus.type === 'saving' ? 'Deleting…' : 'Permanently delete account'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteForm(false)
                    setDeletePassword('')
                    setDeleteConfirmText('')
                    setDeleteStatus({ type: 'idle' })
                  }}
                  className="px-4 py-2 rounded-lg text-sm text-black/60 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {showDeptModal && (
        <DepartmentModal
          department={editingDept}
          onClose={() => setShowDeptModal(false)}
          onSubmit={(input) => (editingDept ? updateDepartment(editingDept.id, input) : addDepartment(input))}
        />
      )}
    </div>
  )
}
