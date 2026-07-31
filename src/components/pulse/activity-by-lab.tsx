"use client"

import { useBoard } from "@/components/pulse/submissions-provider"
import { LABS, SECTORS } from "@/lib/pulse/labs"

/**
 * Live sector counts.
 *
 * Counts are always over the *whole* approved set, never the filtered view —
 * the panel's job is to show where the conversation is happening across every
 * Lab, including the ones the reader has filtered out.
 *
 * The bars carry their own loading state: they start at 0% and transition to
 * their real width when the first snapshot lands, so the arrival of data and
 * the animation are the same gesture rather than two separate ones.
 */
export function ActivityByLab() {
  const { submissions, state } = useBoard()
  const ready = state === "ready"

  const counts = SECTORS.map((sector) => ({
    sector,
    count: ready ? submissions.filter((s) => s.sector === sector).length : 0,
  }))
  const max = Math.max(1, ...counts.map((c) => c.count))

  return (
    <>
      {counts.map(({ sector, count }) => {
        const lab = LABS[sector]
        return (
          <div key={sector}>
            <div className="flex items-center gap-2.5 border-b border-paper-3 py-2 last:border-b-0">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: lab.color }}
              />
              <span className="flex-1 text-[12.5px] text-grey">
                {lab.icon} {lab.label}
              </span>
              <span
                key={count}
                className="animate-in fade-in slide-in-from-bottom-1 text-xs font-bold text-ink duration-300 motion-reduce:animate-none"
              >
                {ready ? count : "—"}
              </span>
            </div>
            <div className="mt-[3px] h-1 overflow-hidden rounded-full bg-paper-3">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
                style={{
                  width: `${(count / max) * 100}%`,
                  background: lab.color,
                }}
              />
            </div>
          </div>
        )
      })}
    </>
  )
}
