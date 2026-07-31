"use client"

import { AdminSignIn } from "@/components/pulse/admin/admin-sign-in"
import { ModerationQueue } from "@/components/pulse/admin/moderation-queue"
import { useFirebaseAuth } from "@/lib/firebase/auth-provider"
import { Button } from "@/components/ui/button"

/**
 * This gate hides controls; it does not protect data. Anyone can load this
 * route's JavaScript. The real enforcement is the isAdmin() clauses in
 * firestore.rules — without the custom claim, a visitor cannot list pending
 * submissions, read contact details, or write moderation fields, however much
 * of this component they reverse-engineer.
 */
export function AdminGate() {
  const { user, authReady, isAdmin, signOutUser } = useFirebaseAuth()

  if (!authReady) {
    return (
      <div className="mx-auto max-w-[420px] px-[5vw] py-20">
        <div className="h-48 animate-pulse rounded-lg border border-line bg-white motion-reduce:animate-none" />
      </div>
    )
  }

  if (!user || user.isAnonymous) {
    return <AdminSignIn />
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-[480px] px-[5vw] py-20 text-center">
        <div className="mb-3.5 text-4xl">🔒</div>
        <h1 className="mb-2 font-heading text-xl text-ink">
          This account is not authorised for moderation.
        </h1>
        <p className="mb-5 text-sm leading-[1.7] text-grey">
          You are signed in as {user.email}, but that account does not carry the
          moderation claim. Ask an administrator to grant it, then sign in
          again.
        </p>
        <Button variant="pill" size="pill" onClick={signOutUser}>
          Sign out
        </Button>
      </div>
    )
  }

  return <ModerationQueue />
}
