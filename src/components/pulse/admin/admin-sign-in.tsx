"use client"

import { useState } from "react"

import { useFirebaseAuth } from "@/lib/firebase/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * Wears the same navy masthead + gradient rule as every other surface where
 * IBP is the one speaking (DESIGN.md §1). Errors are in Considered Grey, never
 * red — Alarm Red belongs to the Health sector.
 */
export function AdminSignIn() {
  const { signInWithEmail } = useFirebaseAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    setBusy(true)
    setError(null)
    try {
      await signInWithEmail(email.trim(), password)
    } catch (signInError) {
      const code = (signInError as { code?: string }).code
      setError(
        code === "auth/configuration-not-found"
          ? "Email sign-in is not enabled on this Firebase project yet."
          : "Those details were not recognised."
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[420px] px-[5vw] py-20">
      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <div className="gradient-rule relative bg-navy-midnight px-6 py-5">
          <div className="mb-2 text-[10px] font-bold tracking-[0.2em] text-amber uppercase">
            PULSE Community
          </div>
          <h1 className="font-heading text-xl font-semibold text-white">
            Moderation
          </h1>
          <p className="mt-1.5 text-[13px] leading-[1.6] text-on-navy">
            Sign in with your IBP moderation account to review submitted
            accounts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="mb-5">
            <Label htmlFor="admin-email" className="mb-[7px]">
              Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@internationalbudget.org"
            />
          </div>

          <div className="mb-5">
            <Label htmlFor="admin-password" className="mb-[7px]">
              Password
            </Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="mb-4 rounded-lg bg-paper-3 px-3.5 py-3 text-[12.5px] leading-[1.6] text-grey"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="cta"
            disabled={busy}
            className="w-full py-3.5 text-xs"
          >
            {busy ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  )
}
