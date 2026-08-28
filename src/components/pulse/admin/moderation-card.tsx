"use client"

import { useEffect, useState } from "react"
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore"

import { useFirebaseAuth } from "@/lib/firebase/auth-provider"
import { db } from "@/lib/firebase/client"
import { submissionContactConverter } from "@/lib/firebase/converters"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  LABS,
  STATUS_LABELS,
  SUBMISSION_STATUSES,
  type SubmissionStatus,
} from "@/lib/pulse/labs"
import { staggerIndex } from "@/lib/pulse/motion"
import { formatSubmissionDate, type Submission } from "@/lib/pulse/submissions"
import { cn } from "@/lib/utils"

const STATUS_ITEMS = SUBMISSION_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}))

export function ModerationCard({
  submission,
  index,
}: {
  submission: Submission
  index: number
}) {
  const { user } = useFirebaseAuth()
  const lab = LABS[submission.sector]

  const [status, setStatus] = useState<SubmissionStatus>(submission.status)
  const [response, setResponse] = useState(submission.ibpResponse ?? "")
  const [email, setEmail] = useState<string | null>(null)
  const [contactChecked, setContactChecked] = useState(false)
  const [busy, setBusy] = useState<null | "approve" | "reject">(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getDoc(
      doc(db, "submissionContacts", submission.id).withConverter(
        submissionContactConverter
      )
    )
      .then((snapshot) => {
        if (cancelled) return
        setEmail(snapshot.exists() ? snapshot.data().email : null)
        setContactChecked(true)
      })
      .catch(() => {
        if (!cancelled) setContactChecked(true)
      })
    return () => {
      cancelled = true
    }
  }, [submission.id])

  async function moderate(decision: "approve" | "reject") {
    if (busy) return
    setBusy(decision)
    setError(null)
    try {
      // Exactly the key set whitelisted by the admin branch of firestore.rules
      // — anything else, including an edit to the testimony itself, is denied.
      await updateDoc(doc(db, "submissions", submission.id), {
        moderation: decision === "approve" ? "approved" : "rejected",
        status,
        ibpResponse: response.trim() ? response.trim() : null,
        publishedAt:
          decision === "approve"
            ? (submission.publishedAt ?? serverTimestamp())
            : null,
        moderatedAt: serverTimestamp(),
        moderatedBy: user?.uid ?? "",
      })
    } catch (updateError) {
      console.error("PULSE moderation write failed:", updateError)
      setError("That change could not be saved. Please try again.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <article
      style={{ "--i": staggerIndex(index) } as React.CSSProperties}
      className="stagger relative mb-4 animate-rise overflow-hidden rounded-lg border border-line bg-white"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: lab.color }}
      />

      <div className="flex items-start justify-between gap-3 pt-5 pr-[22px] pl-[26px]">
        <div>
          <div className="text-[13.5px] font-bold text-ink">
            {submission.name}
          </div>
          <div className="text-xs text-grey-light">
            {submission.role} · {submission.org}
          </div>
          <div className="mt-1 text-[11.5px] text-grey-light">
            {formatSubmissionDate(submission.createdAt)} ·{" "}
            {contactChecked
              ? (email ?? "No contact on file")
              : "Loading contact…"}
          </div>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-[3px] text-[10.5px] font-bold tracking-[0.05em] text-white uppercase"
          style={{ background: lab.color }}
        >
          {lab.icon} {lab.label}
        </span>
      </div>

      <div className="pt-3.5 pr-[22px] pb-[18px] pl-[26px]">
        <div className="mb-[5px] text-[10px] font-bold tracking-[0.12em] text-grey-light uppercase">
          What I observed
        </div>
        <p className="mb-3.5 font-heading text-base leading-[1.5] text-ink">
          {submission.observed}
        </p>
        <div className="mb-[5px] text-[10px] font-bold tracking-[0.12em] text-grey-light uppercase">
          What changed it or could change it
        </div>
        <p className="text-[13.5px] leading-[1.65] text-grey">
          {submission.changed}
        </p>
      </div>

      <div className="border-t border-paper-3 bg-paper-2 px-[26px] py-4">
        <div className="mb-4 grid gap-4 sm:grid-cols-[200px_1fr] sm:items-start">
          <div>
            <Label htmlFor={`status-${submission.id}`} className="mb-[7px]">
              Public status
            </Label>
            <Select
              items={STATUS_ITEMS}
              value={status}
              onValueChange={(value) => setStatus(value as SubmissionStatus)}
            >
              <SelectTrigger id={`status-${submission.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`response-${submission.id}`} className="mb-[7px]">
              IBP response <span>(optional, shown publicly)</span>
            </Label>
            <Textarea
              id={`response-${submission.id}`}
              maxLength={1200}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="min-h-[80px]"
              placeholder="Only set the Cited status once the reference has actually happened."
            />
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="mb-3 animate-rise-sm rounded-lg bg-paper-3 px-3.5 py-3 text-[12.5px] text-grey"
          >
            {error}
          </p>
        ) : null}

        {/* Both actions write to Firestore, so both carry the indeterminate
            rule while the write is in flight. The card leaving the queue is
            the confirmation; the bar is what covers the wait before it. */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="cta"
            size="pill"
            disabled={busy !== null}
            aria-busy={busy === "approve"}
            onClick={() => moderate("approve")}
            // The button doing the work keeps full opacity — a faded control
            // under a running progress bar reads as broken. The other one
            // dims, because it genuinely is unavailable.
            className={cn(
              "overflow-hidden",
              busy === "approve" && "disabled:opacity-100"
            )}
          >
            <span key={busy === "approve" ? "busy" : "idle"} className="animate-rise-sm">
              {busy === "approve" ? "Publishing…" : "Approve & Publish"}
            </span>
            {busy === "approve" ? (
              <span aria-hidden className="progress-rule" />
            ) : null}
          </Button>
          <Button
            variant="pill"
            size="pill"
            disabled={busy !== null}
            aria-busy={busy === "reject"}
            onClick={() => moderate("reject")}
            // The button doing the work keeps full opacity — a faded control
            // under a running progress bar reads as broken. The other one
            // dims, because it genuinely is unavailable.
            className={cn(
              "overflow-hidden",
              busy === "reject" && "disabled:opacity-100"
            )}
          >
            <span key={busy === "reject" ? "busy" : "idle"} className="animate-rise-sm">
              {busy === "reject" ? "Rejecting…" : "Reject"}
            </span>
            {busy === "reject" ? (
              <span aria-hidden className="progress-rule" />
            ) : null}
          </Button>
          <span className="text-[11.5px] text-grey-light">
            Currently {submission.moderation}
          </span>
        </div>
      </div>
    </article>
  )
}
