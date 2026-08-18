import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../lib/firebaseClient'
import type { UserProfile, UserRole } from '../lib/types'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  role: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {}
})

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
            setProfile(snap.data() as UserProfile)
          } else {
            // First sign-in: create a default admin profile
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
      await signInWithEmailAndPassword(auth, email, password)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign-in failed' }
    }
  }

  async function signUp(email: string, password: string): Promise<{ error: string | null }> {
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
      const { createUserWithEmailAndPassword } = await import('firebase/auth')
      await createUserWithEmailAndPassword(auth, email, password)
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

  return (
    <AuthContext.Provider value={{ user, profile, role: profile?.role ?? null, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
