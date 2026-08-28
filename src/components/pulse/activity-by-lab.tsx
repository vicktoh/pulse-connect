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
      {counts.map(({ sector, count }, index) => {
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
              <span className="inline-grid overflow-hidden text-xs font-bold text-ink">
                <span key={count} className="animate-roll-up [grid-area:1/1]">
                  {ready ? count : "—"}
                </span>
              </span>
            </div>
            {/* Bars fill from the left on a transform rather than a width, so
                the five of them animate on the compositor. The pill shape is
                carried by the clipping track above, which is why the fill
                itself is square: scaling a rounded bar squashes its own caps.
                Each bar is offset from the one above so the panel fills as a
                sequence, not as a block. */}
            <div className="mt-[3px] h-1 overflow-hidden rounded-full bg-paper-3">
              <div
                className="h-full origin-left transition-transform duration-500 ease-out-quint motion-reduce:transition-none"
                style={{
                  transform: `scaleX(${count / max})`,
                  transitionDelay: `${index * 60}ms`,
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
