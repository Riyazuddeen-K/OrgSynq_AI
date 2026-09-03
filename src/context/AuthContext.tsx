import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
  updatePassword as updateFirebasePassword,
  deleteUser as deleteFirebaseUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, limit, getDocs } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured, authReady } from '../lib/firebaseClient'
import { logActivity } from '../hooks/useActivityFeed'
import { pushNotification } from '../lib/notify'
import type { UserProfile, UserRole } from '../lib/types'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  role: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, role: UserRole) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateDisplayName: (name: string) => Promise<{ error: string | null }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null }>
  deleteAccount: (password: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  updateDisplayName: async () => ({ error: null }),
  changePassword: async () => ({ error: null }),
  deleteAccount: async () => ({ error: null })
})

// Try to link an "employee" account to an existing employee record with
// a matching email so their My Profile page shows real data. Firestore
// queries are case-sensitive, and admins often type emails with mixed
// case, so this tries an exact match first, then falls back to a
// case-insensitive scan of the (typically small) employees collection.
async function findEmployeeIdByEmail(email: string): Promise<string | undefined> {
  const target = email.trim().toLowerCase()
  try {
    const exact = await getDocs(query(collection(db, 'employees'), where('email', '==', email), limit(1)))
    if (!exact.empty) return exact.docs[0].id

    const all = await getDocs(collection(db, 'employees'))
    const match = all.docs.find((d) => (d.data().email ?? '').toString().trim().toLowerCase() === target)
    return match?.id
  } catch {
    return undefined
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (snap.exists()) {
            let currentProfile = snap.data() as UserProfile
            // Self-heal: an "employee" account that hasn't linked to an
            // employee record yet gets another attempt on every sign-in,
            // in case the employee record was added after this account
            // was created, or the first lookup missed on a case mismatch.
            if (currentProfile.role === 'employee' && !currentProfile.employee_id && currentProfile.email) {
              const employee_id = await findEmployeeIdByEmail(currentProfile.email)
              if (employee_id) {
                await updateDoc(doc(db, 'users', firebaseUser.uid), { employee_id })
                currentProfile = { ...currentProfile, employee_id }
              }
            }
            setProfile(currentProfile)
          } else {
            // Shouldn't normally happen (signUp creates the profile), but
            // fall back to a default admin profile if it's missing.
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email ?? '',
              displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
              role: 'admin'
            }
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile)
            setProfile(newProfile)
          }
        } catch {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return unsub
  }, [])

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    if (!isFirebaseConfigured) {
      const mockUser = { uid: 'demo-uid', email, displayName: email.split('@')[0] } as User
      setUser(mockUser)
      setProfile({
        uid: 'demo-uid',
        email,
        displayName: email.split('@')[0],
        role: 'admin'
      })
      return { error: null }
    }
    try {
      await authReady
      await signInWithEmailAndPassword(auth, email, password)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign-in failed' }
    }
  }

  async function signUp(email: string, password: string, role: UserRole): Promise<{ error: string | null }> {
    if (!isFirebaseConfigured) {
      const mockUser = { uid: 'demo-uid', email, displayName: email.split('@')[0] } as User
      setUser(mockUser)
      setProfile({
        uid: 'demo-uid',
        email,
        displayName: email.split('@')[0],
        role
      })
      return { error: null }
    }
    try {
      await authReady
      const { createUserWithEmailAndPassword } = await import('firebase/auth')
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      const employee_id = role === 'employee' ? await findEmployeeIdByEmail(email) : undefined
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        email,
        displayName: email.split('@')[0],
        role,
        ...(employee_id ? { employee_id } : {})
      }
      await setDoc(doc(db, 'users', cred.user.uid), newProfile)
      setProfile(newProfile)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign-up failed' }
    }
  }

  async function signOut() {
    if (!isFirebaseConfigured) {
      setUser(null)
      setProfile(null)
      return
    }
    await firebaseSignOut(auth)
    setProfile(null)
  }

  async function updateDisplayName(name: string): Promise<{ error: string | null }> {
    const trimmed = name.trim()
    if (!trimmed) return { error: 'Name cannot be empty.' }

    if (!isFirebaseConfigured) {
      setProfile((p) => (p ? { ...p, displayName: trimmed } : p))
      return { error: null }
    }
    if (!auth.currentUser) return { error: 'You must be signed in.' }
    try {
      await updateFirebaseProfile(auth.currentUser, { displayName: trimmed })
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { displayName: trimmed })
      setProfile((p) => (p ? { ...p, displayName: trimmed } : p))
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update name' }
    }
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<{ error: string | null }> {
    if (newPassword.length < 6) return { error: 'New password must be at least 6 characters.' }

    if (!isFirebaseConfigured) {
      return { error: null }
    }
    if (!auth.currentUser || !auth.currentUser.email) return { error: 'You must be signed in.' }
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updateFirebasePassword(auth.currentUser, newPassword)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to change password' }
    }
  }

  async function deleteAccount(password: string): Promise<{ error: string | null }> {
    if (!isFirebaseConfigured) {
      setUser(null)
      setProfile(null)
      return { error: null }
    }
    if (!auth.currentUser || !auth.currentUser.email) return { error: 'You must be signed in.' }
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, password)
      await reauthenticateWithCredential(auth.currentUser, credential)
      const uid = auth.currentUser.uid
      const currentProfile = profile

      // Self-service: an employee deleting their own account also removes
      // their linked workforce record (employee + digital twin), since
      // that record only exists to represent this person. Admin accounts
      // are never linked to an employee_id, so this is a no-op for them —
      // admins remove workforce records explicitly from the Employees page.
      if (currentProfile?.role === 'employee' && currentProfile.employee_id) {
        const employeeId = currentProfile.employee_id
        await deleteDoc(doc(db, 'employees', employeeId)).catch(() => undefined)
        await deleteDoc(doc(db, 'digital_twins', employeeId)).catch(() => undefined)
        await logActivity({
          action: 'employee_deleted',
          message: `${currentProfile.displayName || currentProfile.email} deleted their own account and workforce record`,
          target: currentProfile.displayName || currentProfile.email
        })
        await pushNotification(
          'Employee removed',
          `${currentProfile.displayName || currentProfile.email} deleted their own account, removing them from the workforce directory.`
        )
      }

      // Remove the app profile, then the Firebase Auth account itself.
      await deleteDoc(doc(db, 'users', uid)).catch(() => undefined)
      await deleteFirebaseUser(auth.currentUser)
      setUser(null)
      setProfile(null)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete account' }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role ?? null,
        loading,
        signIn,
        signUp,
        signOut,
        updateDisplayName,
        changePassword,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
