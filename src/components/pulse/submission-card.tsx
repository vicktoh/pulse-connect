"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { LABS, STATUS_CLASSES, STATUS_LABELS } from "@/lib/pulse/labs"
import { staggerIndex } from "@/lib/pulse/motion"
import { formatSubmissionDate, type Submission } from "@/lib/pulse/submissions"
import { cn } from "@/lib/utils"

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function SubmissionCard({
  submission,
  index,
  isSupported,
  isPending,
  onToggleSupport,
}: {
  submission: Submission
  index: number
  isSupported: boolean
  isPending: boolean
  onToggleSupport: (id: string) => void
}) {
  const lab = LABS[submission.sector]

  // Which way the count last moved. The number has to travel in the direction
  // it changed — a fade alone loses that, and the count moves for other
  // people's corroborations too, not only for this reader's.
  const [lastCount, setLastCount] = useState(submission.supportCount)
  const [direction, setDirection] = useState<"up" | "down">("up")
  if (lastCount !== submission.supportCount) {
    setDirection(submission.supportCount > lastCount ? "up" : "down")
    setLastCount(submission.supportCount)
  }

  // One ripple when *this* reader corroborates, never on someone else's.
  const [wasSupported, setWasSupported] = useState(isSupported)
  const [ripple, setRipple] = useState(0)
  if (wasSupported !== isSupported) {
    setWasSupported(isSupported)
    if (isSupported) setRipple((n) => n + 1)
  }

  return (
    <article
      style={{ "--i": staggerIndex(index) } as React.CSSProperties}
      className="stagger relative mb-4 animate-rise overflow-hidden rounded-lg border border-line bg-white transition-[box-shadow,transform] duration-[var(--duration-state)] ease-out-quart hover:-translate-y-px hover:shadow-card"
    >
      {/* Sector rail — the same colour as the avatar, tag and sidebar bar. */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: lab.color }}
      />

      <div className="flex items-start justify-between gap-3 pt-5 pr-[22px] pl-[26px]">
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-[8px] font-heading text-[13px] font-semibold text-white"
            style={{ background: lab.color }}
          >
            {initials(submission.name)}
          </div>
          <div>
            <div className="text-[13.5px] font-bold text-ink">
              {submission.name}
            </div>
            <div className="text-xs text-grey-light">
              {submission.role} · {submission.org}
            </div>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-[3px] text-[10px] font-bold tracking-[0.1em] uppercase",
            STATUS_CLASSES[submission.status]
          )}
        >
          {STATUS_LABELS[submission.status]}
        </span>
      </div>

      <div className="pt-3.5 pr-[22px] pb-[18px] pl-[26px]">
        <div className="mb-[5px] text-[10px] font-bold tracking-[0.12em] text-grey-light uppercase">
          What I observed
        </div>
        {/* Testimony sits in the serif, above the analysis. See DESIGN.md §3. */}
        <p className="mb-3.5 font-heading text-base leading-[1.5] font-normal text-ink">
          {submission.observed}
        </p>
        <div className="mb-[5px] text-[10px] font-bold tracking-[0.12em] text-grey-light uppercase">
          What changed it or could change it
        </div>
        <p className="text-[13.5px] leading-[1.65] text-grey">
          {submission.changed}
        </p>
      </div>

      {submission.ibpResponse ? (
        <div className="mr-[22px] mb-4 ml-[26px] rounded-r-lg border border-navy/12 border-l-[3px] border-l-navy bg-navy/4 px-4 py-3.5">
          <div className="mb-1.5 text-[10px] font-bold tracking-[0.12em] text-navy uppercase">
            IBP Response
          </div>
          <p className="text-[13px] leading-[1.65] text-grey">
            {submission.ibpResponse}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-paper-3 pt-3 pr-[22px] pb-3.5 pl-[26px]">
        <span
          className="rounded-full px-2.5 py-[3px] text-[10.5px] font-bold tracking-[0.05em] text-white uppercase"
          style={{ background: lab.color }}
        >
          {lab.icon} {lab.label}
        </span>
        <div className="flex items-center gap-3.5">
          <span className="text-[11.5px] text-grey-light">
            {formatSubmissionDate(submission.createdAt)}
          </span>
          <Button
            variant="pill"
            size="pill-lg"
            disabled={isPending}
            aria-busy={isPending}
            onClick={() => onToggleSupport(submission.id)}
            className={cn(
              // The wash, border and label all shift together on one curve, so
              // engaging reads as a single change of state.
              "disabled:opacity-100",
              isSupported && "border-navy bg-navy/7 text-navy hover:bg-navy/7"
            )}
          >
            {/* One navy ripple, 600ms, gone. Corroboration is not applause:
                no burst, no particles. See PRODUCT.md anti-references. */}
            {ripple > 0 ? (
              <span
                key={ripple}
                aria-hidden
                className="corroborate-ring absolute inset-0 rounded-full"
              />
            ) : null}

            <span key={String(isSupported)} className="animate-rise-sm">
              {isSupported ? "✓" : "+"}
            </span>
            {isSupported ? "You have seen this too" : "I have seen this too"} ·
            {/* No optimistic arithmetic: Firestore's latency compensation
                already applies the pending write to the local snapshot, so
                this moves instantly and rolls back on its own if rejected. */}
            <span className="inline-grid overflow-hidden">
              <span
                key={submission.supportCount}
                className={cn(
                  "[grid-area:1/1]",
                  direction === "up" ? "animate-roll-up" : "animate-roll-down"
                )}
              >
                {submission.supportCount}
              </span>
            </span>
          </Button>
        </div>
      </div>
    </article>
  )
}
