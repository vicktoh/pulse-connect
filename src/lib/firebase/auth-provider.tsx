"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth"

import { auth } from "./client"

type AuthValue = {
  user: User | null
  /** False until the first onAuthStateChanged callback settles. */
  authReady: boolean
  /** Derived from the `admin` custom claim; see scripts/set-admin-claim.mjs. */
  isAdmin: boolean
  /** Signs in anonymously on demand, deduplicating concurrent calls. */
  ensureAnonymous: () => Promise<User>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function FirebaseAuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const pendingAnonymous = useRef<Promise<User> | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)

      if (nextUser && !nextUser.isAnonymous) {
        try {
          // Force a refresh so a claim granted after the account was created is
          // visible without the operator having to sign out and back in.
          const token = await nextUser.getIdTokenResult(true)
          setIsAdmin(token.claims.admin === true)
        } catch {
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }

      setAuthReady(true)
    })
  }, [])

  /**
   * Anonymous sign-in is lazy — triggered by the first support click or
   * submission, never on page load. Public reads need no auth at all, so the
   * board paints without an auth round-trip, and visiting /admin never creates
   * a throwaway anonymous account that email sign-in would then replace.
   */
  const ensureAnonymous = useCallback(async () => {
    if (auth.currentUser) return auth.currentUser
    if (!pendingAnonymous.current) {
      pendingAnonymous.current = signInAnonymously(auth)
        .then((credential) => credential.user)
        .finally(() => {
          pendingAnonymous.current = null
        })
    }
    return pendingAnonymous.current
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const signOutUser = useCallback(async () => {
    await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({
      user,
      authReady,
      isAdmin,
      ensureAnonymous,
      signInWithEmail,
      signOutUser,
    }),
    [user, authReady, isAdmin, ensureAnonymous, signInWithEmail, signOutUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useFirebaseAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error("useFirebaseAuth must be used within <FirebaseAuthProvider>")
  }
  return value
}
