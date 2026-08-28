"use client"

import { useEffect, useState } from "react"
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore"

import { ModerationCard } from "@/components/pulse/admin/moderation-card"
import { db } from "@/lib/firebase/client"
import { submissionConverter } from "@/lib/firebase/converters"
import { useFirebaseAuth } from "@/lib/firebase/auth-provider"
import { Button } from "@/components/ui/button"
import type { ModerationState, Submission } from "@/lib/pulse/submissions"
import { cn } from "@/lib/utils"

const TABS: { value: ModerationState; label: string }[] = [
  { value: "pending", label: "Awaiting review" },
  { value: "approved", label: "Published" },
  { value: "rejected", label: "Rejected" },
]

export function ModerationQueue() {
  const { user, signOutUser } = useFirebaseAuth()
  const [tab, setTab] = useState<ModerationState>("pending")
  // Results are stamped with the tab they belong to, so switching tabs shows
  // the loading state during render rather than via a setState in the effect.
  const [result, setResult] = useState<{
    tab: ModerationState
    items: Submission[]
  } | null>(null)

  useEffect(() => {
    // Same composite index as the public feed — the two queries differ only in
    // the equality value on `moderation`.
    const queueQuery = query(
      collection(db, "submissions").withConverter(submissionConverter),
      where("moderation", "==", tab),
      orderBy("createdAt", "desc"),
      limit(100)
    )

    return onSnapshot(
      queueQuery,
      (snapshot) => {
        setResult({ tab, items: snapshot.docs.map((d) => d.data()) })
      },
      (error) => {
        console.error("PULSE moderation queue failed:", error)
        setResult({ tab, items: [] })
      }
    )
  }, [tab])

  const loading = result?.tab !== tab
  const submissions = result?.tab === tab ? result.items : []

  return (
    <div className="mx-auto max-w-[840px] px-[5vw] py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1.5 text-[10px] font-bold tracking-[0.18em] text-grey-light uppercase">
            PULSE Community
          </div>
          <h1 className="font-heading text-2xl text-ink">Moderation queue</h1>
          <p className="mt-1 text-[13px] text-grey">
            Signed in as {user?.email}
          </p>
        </div>
        <Button variant="pill" size="pill" onClick={signOutUser}>
          Sign out
        </Button>
      </header>

      <div className="mb-6 flex flex-wrap gap-2.5">
        {TABS.map((option) => (
          <Button
            key={option.value}
            variant="pill"
            size="pill"
            aria-pressed={tab === option.value}
            onClick={() => setTab(option.value)}
            className={cn(
              "whitespace-nowrap",
              tab === option.value &&
                "border-navy-midnight bg-navy-midnight text-white hover:border-navy-midnight hover:text-white"
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Keyed on the tab so switching queues replays the entrance — the same
          gesture the public feed uses when its filter changes. */}
      <div key={tab}>
        {loading ? (
          <div className="skeleton h-40 rounded-lg border border-line bg-white" />
        ) : submissions.length === 0 ? (
          <div className="animate-rise px-5 py-15 text-center">
            <div className="mb-3.5 animate-drift text-4xl">📭</div>
            <div className="mb-2 font-heading text-xl text-ink">
              Nothing here right now.
            </div>
            <p className="text-sm text-grey">
              {tab === "pending"
                ? "Every submitted account has been reviewed."
                : "No accounts in this state yet."}
            </p>
          </div>
        ) : (
          submissions.map((submission, index) => (
            <ModerationCard
              key={submission.id}
              submission={submission}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  )
}
